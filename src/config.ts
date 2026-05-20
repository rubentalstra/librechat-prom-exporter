import "dotenv/config";
import { z } from "zod";

const boolish = z.union([z.boolean(), z.string()]).transform((v, ctx) => {
  if (typeof v === "boolean") {
    return v;
  }
  const lower = v.trim().toLowerCase();
  if (lower === "true") {
    return true;
  }
  if (lower === "false") {
    return false;
  }
  ctx.addIssue({
    code: "custom",
    message: "must be 'true' or 'false' (case-insensitive)",
  });
  return z.NEVER;
});

const optionalBoolish = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((v, ctx) => {
    if (v === undefined || v === "") {
      return undefined;
    }
    if (typeof v === "boolean") {
      return v;
    }
    const lower = v.trim().toLowerCase();
    if (lower === "true") {
      return true;
    }
    if (lower === "false") {
      return false;
    }
    ctx.addIssue({
      code: "custom",
      message: "must be 'true' or 'false' (case-insensitive) or unset",
    });
    return z.NEVER;
  });

const portSchema = z.coerce.number().int().min(1).max(65535);

const positiveInt = z.coerce.number().int().positive();

const trimmedString = z.string().trim().min(1);

const optionalTrimmed = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

const LOG_LEVELS = ["trace", "debug", "info", "warn", "error", "fatal"] as const;

const Schema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    LOG_LEVEL: z.enum(LOG_LEVELS).default("info"),
    LOG_TIMINGS: boolish.default(false),

    MONGO_URI: trimmedString.default("mongodb://localhost:27017/librechat"),
    MONGO_POOL_SIZE: positiveInt.default(50),

    PORT: portSchema.default(3000),
    METRICS_PORT: portSchema.optional(),

    REFRESH_INTERVAL: positiveInt.default(30_000),
    ADVANCED_REFRESH_INTERVAL: positiveInt.optional(),
    CARDINALITY_REFRESH_INTERVAL: positiveInt.optional(),

    EMIT_PER_USER_METRICS: boolish.default(false),
    ANONYMIZE_EMAIL_LABEL: boolish.default(true),
    TENANT_ID: optionalTrimmed,

    TRUST_PROXY: z.string().default("loopback"),
    RATE_LIMIT_WINDOW_MS: positiveInt.default(60_000),
    RATE_LIMIT_MAX: positiveInt.default(120),
    HEALTH_RATE_LIMIT_MAX: positiveInt.default(600),

    METRICS_BEARER_TOKEN: optionalTrimmed,
    METRICS_BASIC_AUTH_USER: optionalTrimmed,
    METRICS_BASIC_AUTH_PASSWORD: optionalTrimmed,
    METRICS_OAUTH2_JWKS_URI: optionalTrimmed,
    METRICS_OAUTH2_ISSUER: optionalTrimmed,
    METRICS_OAUTH2_AUDIENCE: optionalTrimmed,
    METRICS_OAUTH2_REQUIRED_SCOPES: optionalTrimmed,
    METRICS_OAUTH2_ALGORITHMS: optionalTrimmed,
    METRICS_ALLOWED_IPS: optionalTrimmed,
    METRICS_AUTH_LOG_REJECTS: optionalBoolish,
  })
  .superRefine((val, ctx) => {
    const basicUser = val.METRICS_BASIC_AUTH_USER;
    const basicPass = val.METRICS_BASIC_AUTH_PASSWORD;
    if (Boolean(basicUser) !== Boolean(basicPass)) {
      ctx.addIssue({
        code: "custom",
        message: "METRICS_BASIC_AUTH_USER and METRICS_BASIC_AUTH_PASSWORD must both be set or both unset",
        path: ["METRICS_BASIC_AUTH_USER"],
      });
    }
    const anyOauth =
      val.METRICS_OAUTH2_JWKS_URI ||
      val.METRICS_OAUTH2_ISSUER ||
      val.METRICS_OAUTH2_AUDIENCE ||
      val.METRICS_OAUTH2_REQUIRED_SCOPES ||
      val.METRICS_OAUTH2_ALGORITHMS;
    if (anyOauth) {
      if (!val.METRICS_OAUTH2_AUDIENCE) {
        ctx.addIssue({
          code: "custom",
          message: "METRICS_OAUTH2_AUDIENCE is required when any METRICS_OAUTH2_* is set",
          path: ["METRICS_OAUTH2_AUDIENCE"],
        });
      }
      const hasJwks = Boolean(val.METRICS_OAUTH2_JWKS_URI);
      const hasIssuer = Boolean(val.METRICS_OAUTH2_ISSUER);
      if (!hasJwks && !hasIssuer) {
        ctx.addIssue({
          code: "custom",
          message: "Either METRICS_OAUTH2_JWKS_URI or METRICS_OAUTH2_ISSUER must be set",
          path: ["METRICS_OAUTH2_JWKS_URI"],
        });
      }
      if (hasJwks && hasIssuer) {
        ctx.addIssue({
          code: "custom",
          message: "METRICS_OAUTH2_JWKS_URI and METRICS_OAUTH2_ISSUER are mutually exclusive",
          path: ["METRICS_OAUTH2_JWKS_URI"],
        });
      }
    }
  });

export type Config = z.infer<typeof Schema> & {
  ADVANCED_REFRESH_INTERVAL: number;
  CARDINALITY_REFRESH_INTERVAL: number;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = Schema.safeParse(env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => {
      const key = i.path.join(".") || "(root)";
      return `  - ${key}: ${i.message}`;
    });
    const msg = "Environment configuration is invalid:\n" + lines.join("\n");
    throw new Error(msg);
  }
  const data = parsed.data;
  const advanced = data.ADVANCED_REFRESH_INTERVAL ?? data.REFRESH_INTERVAL * 10;
  const cardinality = data.CARDINALITY_REFRESH_INTERVAL ?? advanced;
  return { ...data, ADVANCED_REFRESH_INTERVAL: advanced, CARDINALITY_REFRESH_INTERVAL: cardinality };
}

let cached: Config | undefined;

export function getConfig(): Config {
  if (!cached) {
    cached = loadConfig();
  }
  return cached;
}

export function resetConfigForTests(): void {
  cached = undefined;
}
