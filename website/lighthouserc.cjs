/**
 * Lighthouse CI config. Using `.cjs` (not `.json`) so the `staticDistDir`
 * path can be anchored to the config file's directory via `__dirname`,
 * independent of where lhci is invoked from. This matters because:
 *
 *   - Locally, lhci is run from `website/` (CWD = website).
 *   - In CI (treosh/lighthouse-ci-action), lhci is run from the repo
 *     root (CWD = repo root) — the action does not honor a job's
 *     defaults.run.working-directory.
 *
 * Per the official lhci docs:
 *   https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md
 * paths in JSON are resolved relative to CWD; `.cjs` lets us use Node's
 * standard `__dirname` to escape that ambiguity.
 */
const path = require("node:path");

/** @type {import("@lhci/utils/src/presets/all").default} */
module.exports = {
  ci: {
    collect: {
      staticDistDir: path.resolve(__dirname, "build"),
      url: [
        "http://localhost/",
        "http://localhost/docs/intro.html",
        "http://localhost/docs/reference/environment-variables.html",
        "http://localhost/docs/contributing/architecture.html",
      ],
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.85 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.85 }],
        "categories:seo": ["error", { minScore: 0.9 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
