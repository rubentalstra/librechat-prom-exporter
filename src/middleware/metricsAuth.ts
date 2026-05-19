import { timingSafeEqual } from "crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import {
  createRemoteJWKSet,
  errors as joseErrors,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyGetKey,
} from "jose";
import ipaddr from "ipaddr.js";

import { envFlag } from "../metrics/util.js";

interface OAuth2Config {
  jwksUri: string;
  issuer?: string;
  audience: string;
  requiredScopes: string[];
  algorithms: string[];
}

interface ResolvedConfig {
  bearerToken?: string;
  basicHeader?: string;
  oauth2?: OAuth2Config;
  cidrs?: Array<[ipaddr.IPv4 | ipaddr.IPv6, number]>;
  enabled: boolean;
}

function splitCsv(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function splitScopes(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(/\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function parseCidrs(
  csv: string | undefined,
): Array<[ipaddr.IPv4 | ipaddr.IPv6, number]> | undefined {
  const items = splitCsv(csv);
  if (items.length === 0) {
    return undefined;
  }
  return items.map((cidr) => {
    try {
      return ipaddr.parseCIDR(cidr);
    } catch {
      const addr = ipaddr.parse(cidr);
      const bits = addr.kind() === "ipv4" ? 32 : 128;
      return [addr, bits] as [ipaddr.IPv4 | ipaddr.IPv6, number];
    }
  });
}

function buildBasicHeader(user: string, password: string): string {
  return "Basic " + Buffer.from(`${user}:${password}`).toString("base64");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    return false;
  }
  return timingSafeEqual(ab, bb);
}

async function discoverJwksUri(issuer: string): Promise<string> {
  const url = issuer.replace(/\/$/, "") + "/.well-known/openid-configuration";
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `OIDC discovery failed: GET ${url} -> ${res.status} ${res.statusText}`,
    );
  }
  const body = (await res.json()) as { jwks_uri?: string };
  if (!body.jwks_uri || typeof body.jwks_uri !== "string") {
    throw new Error(`OIDC discovery response missing jwks_uri: ${url}`);
  }
  return body.jwks_uri;
}

function clientIp(req: Request): string | null {
  const ip = req.ip;
  if (!ip) {
    return null;
  }
  return ip.replace(/^::ffff:/, "");
}

function ipMatches(
  ip: string,
  cidrs: Array<[ipaddr.IPv4 | ipaddr.IPv6, number]>,
): boolean {
  let addr: ipaddr.IPv4 | ipaddr.IPv6;
  try {
    addr = ipaddr.parse(ip);
  } catch {
    return false;
  }
  for (const cidr of cidrs) {
    if (addr.kind() !== cidr[0].kind()) {
      continue;
    }
    try {
      if (addr.match(cidr)) {
        return true;
      }
    } catch {
      // skip
    }
  }
  return false;
}

function extractScopes(payload: JWTPayload): string[] {
  const scope = (payload as Record<string, unknown>).scope;
  if (typeof scope === "string") {
    return splitScopes(scope);
  }
  const scp = (payload as Record<string, unknown>).scp;
  if (Array.isArray(scp)) {
    return scp.filter((s): s is string => typeof s === "string");
  }
  if (typeof scp === "string") {
    return splitScopes(scp);
  }
  return [];
}

export async function buildMetricsAuth(): Promise<RequestHandler> {
  const bearerToken = process.env.METRICS_BEARER_TOKEN || undefined;

  const basicUser = process.env.METRICS_BASIC_AUTH_USER;
  const basicPassword = process.env.METRICS_BASIC_AUTH_PASSWORD;
  if ((basicUser && !basicPassword) || (!basicUser && basicPassword)) {
    throw new Error(
      "METRICS_BASIC_AUTH_USER and METRICS_BASIC_AUTH_PASSWORD must both be set or both unset",
    );
  }
  const basicHeader =
    basicUser && basicPassword ? buildBasicHeader(basicUser, basicPassword) : undefined;

  let oauth2: OAuth2Config | undefined;
  let jwks: JWTVerifyGetKey | undefined;
  const audience = process.env.METRICS_OAUTH2_AUDIENCE;
  const issuer = process.env.METRICS_OAUTH2_ISSUER;
  let jwksUri = process.env.METRICS_OAUTH2_JWKS_URI;

  const anyOauthEnv = audience || issuer || jwksUri ||
    process.env.METRICS_OAUTH2_REQUIRED_SCOPES ||
    process.env.METRICS_OAUTH2_ALGORITHMS;

  if (anyOauthEnv) {
    if (!audience) {
      throw new Error("METRICS_OAUTH2_AUDIENCE is required when any METRICS_OAUTH2_* is set");
    }
    if (!jwksUri && !issuer) {
      throw new Error("One of METRICS_OAUTH2_JWKS_URI or METRICS_OAUTH2_ISSUER must be set");
    }
    if (jwksUri && issuer) {
      throw new Error("METRICS_OAUTH2_JWKS_URI and METRICS_OAUTH2_ISSUER are mutually exclusive");
    }
    if (!jwksUri && issuer) {
      jwksUri = await discoverJwksUri(issuer);
    }
    oauth2 = {
      jwksUri: jwksUri!,
      issuer,
      audience,
      requiredScopes: splitScopes(process.env.METRICS_OAUTH2_REQUIRED_SCOPES),
      algorithms: splitCsv(process.env.METRICS_OAUTH2_ALGORITHMS).length > 0
        ? splitCsv(process.env.METRICS_OAUTH2_ALGORITHMS)
        : ["RS256", "ES256"],
    };
    jwks = createRemoteJWKSet(new URL(oauth2.jwksUri), {
      cacheMaxAge: 10 * 60 * 1000,
      cooldownDuration: 30 * 1000,
    });
  }

  const cidrs = parseCidrs(process.env.METRICS_ALLOWED_IPS);

  const config: ResolvedConfig = {
    bearerToken,
    basicHeader,
    oauth2,
    cidrs,
    enabled: Boolean(bearerToken || basicHeader || oauth2 || cidrs),
  };

  const hasTokenMethod = Boolean(bearerToken || basicHeader || oauth2);
  const logRejects = envFlag("METRICS_AUTH_LOG_REJECTS", true);
  let lastLogAt = 0;
  const logReject = (req: Request, reason: string): void => {
    if (!logRejects) {
      return;
    }
    const now = Date.now();
    if (now - lastLogAt < 1000) {
      return;
    }
    lastLogAt = now;
    console.warn(
      `[metrics-auth] reject ${req.method} ${req.path} from ${clientIp(req) ?? "?"}: ${reason}`,
    );
  };

  return async function metricsAuth(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    if (!config.enabled) {
      next();
      return;
    }

    if (config.cidrs) {
      const ip = clientIp(req);
      if (!ip || !ipMatches(ip, config.cidrs)) {
        logReject(req, "ip not in allowlist");
        if (!hasTokenMethod) {
          res.status(403).type("text/plain").send("Forbidden");
          return;
        }
        res.status(403).type("text/plain").send("Forbidden");
        return;
      }
    }

    if (!hasTokenMethod) {
      next();
      return;
    }

    const authHeader = req.header("authorization") || "";

    if (config.basicHeader && safeEqual(authHeader, config.basicHeader)) {
      next();
      return;
    }

    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice("Bearer ".length).trim();

      if (config.bearerToken && safeEqual(token, config.bearerToken)) {
        next();
        return;
      }

      if (config.oauth2 && jwks) {
        try {
          const { payload } = await jwtVerify(token, jwks, {
            audience: config.oauth2.audience,
            issuer: config.oauth2.issuer,
            algorithms: config.oauth2.algorithms,
          });
          if (config.oauth2.requiredScopes.length > 0) {
            const tokenScopes = extractScopes(payload);
            const missing = config.oauth2.requiredScopes.filter(
              (s) => !tokenScopes.includes(s),
            );
            if (missing.length > 0) {
              logReject(req, `missing scopes: ${missing.join(",")}`);
              res
                .status(403)
                .set(
                  "WWW-Authenticate",
                  `Bearer error="insufficient_scope", scope="${config.oauth2.requiredScopes.join(" ")}"`,
                )
                .type("text/plain")
                .send("Forbidden");
              return;
            }
          }
          next();
          return;
        } catch (err) {
          const code =
            err instanceof joseErrors.JOSEError ? err.code : "invalid_token";
          logReject(req, `oauth2 reject: ${code}`);
          res
            .status(401)
            .set("WWW-Authenticate", `Bearer error="invalid_token"`)
            .type("text/plain")
            .send("Unauthorized");
          return;
        }
      }
    }

    logReject(req, "no matching credentials");
    const challenges: string[] = [];
    if (config.basicHeader) {
      challenges.push('Basic realm="metrics"');
    }
    if (config.bearerToken || config.oauth2) {
      challenges.push('Bearer realm="metrics"');
    }
    if (challenges.length > 0) {
      res.set("WWW-Authenticate", challenges.join(", "));
    }
    res.status(401).type("text/plain").send("Unauthorized");
  };
}
