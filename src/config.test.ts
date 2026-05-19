import { describe, expect, it } from "vitest";

import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  const baseEnv: NodeJS.ProcessEnv = {
    NODE_ENV: "test",
  };

  it("applies defaults when env is empty", () => {
    const cfg = loadConfig(baseEnv);
    expect(cfg.PORT).toBe(3000);
    expect(cfg.MONGO_URI).toBe("mongodb://localhost:27017/librechat");
    expect(cfg.MONGO_POOL_SIZE).toBe(50);
    expect(cfg.REFRESH_INTERVAL).toBe(30_000);
    expect(cfg.ADVANCED_REFRESH_INTERVAL).toBe(300_000);
    expect(cfg.LOG_LEVEL).toBe("info");
    expect(cfg.LOG_TIMINGS).toBe(false);
    expect(cfg.EMIT_PER_USER_METRICS).toBe(false);
    expect(cfg.RATE_LIMIT_WINDOW_MS).toBe(60_000);
    expect(cfg.RATE_LIMIT_MAX).toBe(120);
    expect(cfg.HEALTH_RATE_LIMIT_MAX).toBe(600);
    expect(cfg.TRUST_PROXY).toBe("loopback");
  });

  it("derives ADVANCED_REFRESH_INTERVAL from REFRESH_INTERVAL when unset", () => {
    const cfg = loadConfig({ ...baseEnv, REFRESH_INTERVAL: "15000" });
    expect(cfg.REFRESH_INTERVAL).toBe(15_000);
    expect(cfg.ADVANCED_REFRESH_INTERVAL).toBe(150_000);
  });

  it("respects explicit ADVANCED_REFRESH_INTERVAL", () => {
    const cfg = loadConfig({
      ...baseEnv,
      REFRESH_INTERVAL: "10000",
      ADVANCED_REFRESH_INTERVAL: "60000",
    });
    expect(cfg.ADVANCED_REFRESH_INTERVAL).toBe(60_000);
  });

  it("accepts boolean 'true' (case-insensitive)", () => {
    expect(loadConfig({ ...baseEnv, LOG_TIMINGS: "true" }).LOG_TIMINGS).toBe(true);
    expect(loadConfig({ ...baseEnv, LOG_TIMINGS: "TRUE" }).LOG_TIMINGS).toBe(true);
    expect(loadConfig({ ...baseEnv, LOG_TIMINGS: "False" }).LOG_TIMINGS).toBe(false);
  });

  it("rejects boolean aliases like '1' / 'yes' / 'on'", () => {
    expect(() => loadConfig({ ...baseEnv, LOG_TIMINGS: "1" })).toThrow(/LOG_TIMINGS/);
    expect(() => loadConfig({ ...baseEnv, LOG_TIMINGS: "yes" })).toThrow(/LOG_TIMINGS/);
    expect(() => loadConfig({ ...baseEnv, LOG_TIMINGS: "on" })).toThrow(/LOG_TIMINGS/);
  });

  it("rejects non-numeric PORT", () => {
    expect(() => loadConfig({ ...baseEnv, PORT: "not-a-port" })).toThrow(/PORT/);
  });

  it("rejects out-of-range PORT", () => {
    expect(() => loadConfig({ ...baseEnv, PORT: "0" })).toThrow(/PORT/);
    expect(() => loadConfig({ ...baseEnv, PORT: "99999" })).toThrow(/PORT/);
  });

  it("rejects basic auth with only user set", () => {
    expect(() => loadConfig({ ...baseEnv, METRICS_BASIC_AUTH_USER: "u" })).toThrow(/METRICS_BASIC_AUTH_USER/);
  });

  it("rejects basic auth with only password set", () => {
    expect(() => loadConfig({ ...baseEnv, METRICS_BASIC_AUTH_PASSWORD: "p" })).toThrow(/METRICS_BASIC_AUTH_USER/);
  });

  it("accepts both basic auth vars set", () => {
    const cfg = loadConfig({
      ...baseEnv,
      METRICS_BASIC_AUTH_USER: "u",
      METRICS_BASIC_AUTH_PASSWORD: "p",
    });
    expect(cfg.METRICS_BASIC_AUTH_USER).toBe("u");
    expect(cfg.METRICS_BASIC_AUTH_PASSWORD).toBe("p");
  });

  it("requires audience when any OAuth2 var is set", () => {
    expect(() => loadConfig({ ...baseEnv, METRICS_OAUTH2_ISSUER: "https://idp" })).toThrow(/METRICS_OAUTH2_AUDIENCE/);
  });

  it("requires one of JWKS_URI or ISSUER when OAuth2 is configured", () => {
    expect(() =>
      loadConfig({
        ...baseEnv,
        METRICS_OAUTH2_AUDIENCE: "aud",
        METRICS_OAUTH2_REQUIRED_SCOPES: "metrics:read",
      }),
    ).toThrow(/METRICS_OAUTH2_JWKS_URI/);
  });

  it("rejects both JWKS_URI and ISSUER together", () => {
    expect(() =>
      loadConfig({
        ...baseEnv,
        METRICS_OAUTH2_AUDIENCE: "aud",
        METRICS_OAUTH2_ISSUER: "https://idp",
        METRICS_OAUTH2_JWKS_URI: "https://idp/jwks",
      }),
    ).toThrow(/mutually exclusive/);
  });

  it("accepts OAuth2 via issuer", () => {
    const cfg = loadConfig({
      ...baseEnv,
      METRICS_OAUTH2_AUDIENCE: "aud",
      METRICS_OAUTH2_ISSUER: "https://idp.example.com",
    });
    expect(cfg.METRICS_OAUTH2_ISSUER).toBe("https://idp.example.com");
    expect(cfg.METRICS_OAUTH2_JWKS_URI).toBeUndefined();
  });

  it("accepts OAuth2 via JWKS URI", () => {
    const cfg = loadConfig({
      ...baseEnv,
      METRICS_OAUTH2_AUDIENCE: "aud",
      METRICS_OAUTH2_JWKS_URI: "https://idp/jwks",
    });
    expect(cfg.METRICS_OAUTH2_JWKS_URI).toBe("https://idp/jwks");
  });

  it("treats empty string optional fields as undefined", () => {
    const cfg = loadConfig({ ...baseEnv, TENANT_ID: "" });
    expect(cfg.TENANT_ID).toBeUndefined();
  });

  it("collects multiple errors in one throw", () => {
    let err: Error | undefined;
    try {
      loadConfig({ ...baseEnv, PORT: "abc", LOG_TIMINGS: "maybe" });
    } catch (e) {
      err = e as Error;
    }
    expect(err).toBeDefined();
    expect(err!.message).toContain("PORT");
    expect(err!.message).toContain("LOG_TIMINGS");
  });
});
