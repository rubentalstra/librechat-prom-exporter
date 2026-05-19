import pino, { type Logger, type LoggerOptions } from "pino";

import { getConfig } from "./config.js";

function buildLogger(): Logger {
  const cfg = getConfig();
  const opts: LoggerOptions = {
    level: cfg.LOG_LEVEL,
    base: { svc: "librechat-prom-exporter" },
    redact: {
      paths: ["req.headers.authorization", "req.headers.cookie", "*.password", "*.token", "*.secret"],
      remove: true,
    },
  };
  if (cfg.NODE_ENV !== "production") {
    opts.transport = {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:HH:MM:ss.l",
        ignore: "pid,hostname,svc",
        singleLine: false,
      },
    };
  }
  return pino(opts);
}

let cached: Logger | undefined;

export function logger(): Logger {
  if (!cached) {
    cached = buildLogger();
  }
  return cached;
}

export function resetLoggerForTests(): void {
  cached = undefined;
}
