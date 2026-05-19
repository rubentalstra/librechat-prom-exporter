import type { NextFunction, Request, RequestHandler, Response } from "express";
import { SignJWT, exportJWK, generateKeyPair, type JWK } from "jose";
import nock from "nock";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetConfigForTests } from "../config.js";
import { resetLoggerForTests } from "../logger.js";
import { buildMetricsAuth } from "./metricsAuth.js";

interface FakeRequest {
  method: string;
  path: string;
  ip: string;
  headers: Record<string, string>;
  header(name: string): string | undefined;
}

interface CapturedResponse {
  status: number;
  body: string;
  headers: Record<string, string>;
}

function makeReq(opts: Partial<FakeRequest> & { headers?: Record<string, string> } = {}): Request {
  const headers = opts.headers ?? {};
  const lowered: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    lowered[k.toLowerCase()] = v;
  }
  return {
    method: opts.method ?? "GET",
    path: opts.path ?? "/metrics",
    ip: opts.ip ?? "127.0.0.1",
    headers: lowered,
    header(name: string) {
      return lowered[name.toLowerCase()];
    },
  } as unknown as Request;
}

function makeRes(): { res: Response; captured: CapturedResponse } {
  const captured: CapturedResponse = { status: 0, body: "", headers: {} };
  const res = {
    status(code: number) {
      captured.status = code;
      return res;
    },
    set(name: string | Record<string, string>, value?: string) {
      if (typeof name === "string" && value !== undefined) {
        captured.headers[name.toLowerCase()] = value;
      } else if (typeof name === "object") {
        for (const [k, v] of Object.entries(name)) {
          captured.headers[k.toLowerCase()] = v;
        }
      }
      return res;
    },
    type() {
      return res;
    },
    send(body: string) {
      captured.body = body;
      return res;
    },
  };
  return { res: res as unknown as Response, captured };
}

async function invoke(mw: RequestHandler, req: Request): Promise<{ captured: CapturedResponse; nextCalled: boolean }> {
  const { res, captured } = makeRes();
  let nextCalled = false;
  const next: NextFunction = () => {
    nextCalled = true;
  };
  await mw(req, res, next);
  return { captured, nextCalled };
}

function clearAuthEnv() {
  for (const k of Object.keys(process.env)) {
    if (k.startsWith("METRICS_")) {
      delete process.env[k];
    }
  }
}

beforeEach(() => {
  clearAuthEnv();
  resetConfigForTests();
  resetLoggerForTests();
  nock.cleanAll();
});

afterEach(() => {
  nock.cleanAll();
  vi.useRealTimers();
});

describe("metricsAuth: no config (default open)", () => {
  it("calls next() with no headers required", async () => {
    const mw = await buildMetricsAuth();
    const { nextCalled } = await invoke(mw, makeReq());
    expect(nextCalled).toBe(true);
  });
});

describe("metricsAuth: static bearer", () => {
  it("rejects when no Authorization header", async () => {
    process.env.METRICS_BEARER_TOKEN = "secret";
    const mw = await buildMetricsAuth();
    const { captured, nextCalled } = await invoke(mw, makeReq());
    expect(nextCalled).toBe(false);
    expect(captured.status).toBe(401);
    expect(captured.headers["www-authenticate"]).toMatch(/Bearer/);
  });

  it("accepts correct token", async () => {
    process.env.METRICS_BEARER_TOKEN = "secret";
    const mw = await buildMetricsAuth();
    const { nextCalled } = await invoke(mw, makeReq({ headers: { authorization: "Bearer secret" } }));
    expect(nextCalled).toBe(true);
  });

  it("rejects wrong token", async () => {
    process.env.METRICS_BEARER_TOKEN = "secret";
    const mw = await buildMetricsAuth();
    const { captured, nextCalled } = await invoke(mw, makeReq({ headers: { authorization: "Bearer wrong" } }));
    expect(nextCalled).toBe(false);
    expect(captured.status).toBe(401);
  });

  it("rejects empty token", async () => {
    process.env.METRICS_BEARER_TOKEN = "secret";
    const mw = await buildMetricsAuth();
    const { captured } = await invoke(mw, makeReq({ headers: { authorization: "Bearer " } }));
    expect(captured.status).toBe(401);
  });
});

describe("metricsAuth: basic auth", () => {
  beforeEach(() => {
    process.env.METRICS_BASIC_AUTH_USER = "alice";
    process.env.METRICS_BASIC_AUTH_PASSWORD = "p4ss";
  });

  it("accepts correct credentials", async () => {
    const mw = await buildMetricsAuth();
    const creds = Buffer.from("alice:p4ss").toString("base64");
    const { nextCalled } = await invoke(mw, makeReq({ headers: { authorization: `Basic ${creds}` } }));
    expect(nextCalled).toBe(true);
  });

  it("rejects wrong password", async () => {
    const mw = await buildMetricsAuth();
    const creds = Buffer.from("alice:wrong").toString("base64");
    const { captured, nextCalled } = await invoke(mw, makeReq({ headers: { authorization: `Basic ${creds}` } }));
    expect(nextCalled).toBe(false);
    expect(captured.status).toBe(401);
    expect(captured.headers["www-authenticate"]).toMatch(/Basic/);
  });

  it("rejects when no header", async () => {
    const mw = await buildMetricsAuth();
    const { captured } = await invoke(mw, makeReq());
    expect(captured.status).toBe(401);
  });
});

describe("metricsAuth: IP allowlist", () => {
  it("accepts matching IP without token", async () => {
    process.env.METRICS_ALLOWED_IPS = "10.0.0.0/8";
    const mw = await buildMetricsAuth();
    const { nextCalled } = await invoke(mw, makeReq({ ip: "10.1.2.3" }));
    expect(nextCalled).toBe(true);
  });

  it("rejects non-matching IP without token", async () => {
    process.env.METRICS_ALLOWED_IPS = "10.0.0.0/8";
    const mw = await buildMetricsAuth();
    const { captured, nextCalled } = await invoke(mw, makeReq({ ip: "192.168.1.1" }));
    expect(nextCalled).toBe(false);
    expect(captured.status).toBe(403);
  });

  it("requires both IP and token when both configured", async () => {
    process.env.METRICS_ALLOWED_IPS = "10.0.0.0/8";
    process.env.METRICS_BEARER_TOKEN = "secret";
    const mw = await buildMetricsAuth();

    // Right IP, no token → 403 (IP enforced first; no token means fall through to 401)
    const r1 = await invoke(mw, makeReq({ ip: "10.0.0.1" }));
    expect(r1.captured.status).toBe(401);

    // Wrong IP, right token → 403 (IP rejects)
    const r2 = await invoke(mw, makeReq({ ip: "192.168.1.1", headers: { authorization: "Bearer secret" } }));
    expect(r2.captured.status).toBe(403);

    // Right IP + right token → next()
    const r3 = await invoke(mw, makeReq({ ip: "10.0.0.1", headers: { authorization: "Bearer secret" } }));
    expect(r3.nextCalled).toBe(true);
  });
});

describe("metricsAuth: OAuth2 / OIDC JWT", () => {
  const ISSUER = "https://idp.test.example";
  const AUDIENCE = "librechat-prom-exporter";
  let publicJwk: JWK;
  let privateKey: CryptoKey;
  let keyId: string;

  beforeEach(async () => {
    const { publicKey, privateKey: priv } = await generateKeyPair("RS256");
    privateKey = priv;
    publicJwk = await exportJWK(publicKey);
    keyId = "test-key-1";
    publicJwk.kid = keyId;
    publicJwk.alg = "RS256";
    publicJwk.use = "sig";

    nock(ISSUER)
      .get("/.well-known/openid-configuration")
      .reply(200, { jwks_uri: `${ISSUER}/jwks.json` })
      .persist();
    nock(ISSUER)
      .get("/jwks.json")
      .reply(200, { keys: [publicJwk] })
      .persist();

    process.env.METRICS_OAUTH2_ISSUER = ISSUER;
    process.env.METRICS_OAUTH2_AUDIENCE = AUDIENCE;
  });

  async function signToken(
    overrides: { aud?: string; iss?: string; scope?: string; expSeconds?: number } = {},
  ): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const jwt = new SignJWT({ scope: overrides.scope ?? "" })
      .setProtectedHeader({ alg: "RS256", kid: keyId })
      .setIssuedAt(now)
      .setIssuer(overrides.iss ?? ISSUER)
      .setAudience(overrides.aud ?? AUDIENCE)
      .setExpirationTime(now + (overrides.expSeconds ?? 300));
    return jwt.sign(privateKey);
  }

  it("accepts a valid token", async () => {
    const mw = await buildMetricsAuth();
    const token = await signToken();
    const { nextCalled } = await invoke(mw, makeReq({ headers: { authorization: `Bearer ${token}` } }));
    expect(nextCalled).toBe(true);
  });

  it("rejects token with wrong audience", async () => {
    const mw = await buildMetricsAuth();
    const token = await signToken({ aud: "other-audience" });
    const { captured } = await invoke(mw, makeReq({ headers: { authorization: `Bearer ${token}` } }));
    expect(captured.status).toBe(401);
  });

  it("rejects expired token", async () => {
    const mw = await buildMetricsAuth();
    const token = await signToken({ expSeconds: -10 });
    const { captured } = await invoke(mw, makeReq({ headers: { authorization: `Bearer ${token}` } }));
    expect(captured.status).toBe(401);
  });

  it("rejects token missing required scope", async () => {
    process.env.METRICS_OAUTH2_REQUIRED_SCOPES = "metrics:read";
    const mw = await buildMetricsAuth();
    const token = await signToken({ scope: "other:scope" });
    const { captured } = await invoke(mw, makeReq({ headers: { authorization: `Bearer ${token}` } }));
    expect(captured.status).toBe(403);
    expect(captured.headers["www-authenticate"]).toMatch(/insufficient_scope/);
  });

  it("accepts token with required scope", async () => {
    process.env.METRICS_OAUTH2_REQUIRED_SCOPES = "metrics:read";
    const mw = await buildMetricsAuth();
    const token = await signToken({ scope: "metrics:read other:scope" });
    const { nextCalled } = await invoke(mw, makeReq({ headers: { authorization: `Bearer ${token}` } }));
    expect(nextCalled).toBe(true);
  });

  it("rejects tampered signature", async () => {
    const mw = await buildMetricsAuth();
    const token = await signToken();
    const parts = token.split(".");
    parts[2] = parts[2]!.slice(0, -3) + "AAA";
    const tampered = parts.join(".");
    const { captured } = await invoke(mw, makeReq({ headers: { authorization: `Bearer ${tampered}` } }));
    expect(captured.status).toBe(401);
  });
});

describe("metricsAuth: misconfiguration", () => {
  it("throws when JWKS_URI and ISSUER both set", async () => {
    process.env.METRICS_OAUTH2_JWKS_URI = "https://idp/jwks";
    process.env.METRICS_OAUTH2_ISSUER = "https://idp";
    process.env.METRICS_OAUTH2_AUDIENCE = "aud";
    await expect(buildMetricsAuth()).rejects.toThrow(/mutually exclusive/);
  });

  it("throws when audience missing", async () => {
    process.env.METRICS_OAUTH2_ISSUER = "https://idp";
    await expect(buildMetricsAuth()).rejects.toThrow(/METRICS_OAUTH2_AUDIENCE/);
  });

  it("throws when basic auth is half-configured", async () => {
    process.env.METRICS_BASIC_AUTH_USER = "u";
    await expect(buildMetricsAuth()).rejects.toThrow(/METRICS_BASIC_AUTH/);
  });
});
