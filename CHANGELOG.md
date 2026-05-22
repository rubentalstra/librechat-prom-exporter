# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.10.0] - 2026-05-22

### Added

- `CHANGELOG.md` (this file). Future releases append here instead of living only in GitHub Releases.
- CI lockfile-drift guardrail in `.github/workflows/ci.yml`: runs `pnpm install --lockfile-only` after the frozen install and fails on any diff. Catches the `@emnapi/*` class of optional-dep bugs, and any future `package.json` ↔ lockfile mismatch, before merge.
- Root `.npmrc` with `engine-strict=true` and `verify-deps-before-run=true` — the local-dev half of the lockfile-drift guardrail (pnpm refuses to run `pnpm <script>` against an out-of-sync `node_modules`).

### Changed

- **Package manager: npm → pnpm 11.2.2.** Contributors must now have Corepack enabled (`corepack enable`); `pnpm install` from the repo root resolves both the exporter and the docs site via a single `pnpm-workspace.yaml`. One `pnpm-lock.yaml` replaces the two `package-lock.json` files. Version pinned exactly in `packageManager` (with the Corepack-written sha512 hash) so the toolchain is fully deterministic across local + CI + Docker.
- Dockerfile: builder + deps stages use Corepack + `pnpm install --frozen-lockfile --filter "librechat-prom-exporter..."` with a BuildKit pnpm-store cache mount. The `--filter pkg...` keeps the docs-site deps out of the runtime image. The Chainguard runtime stage is unchanged.
- All 7 GitHub Actions workflows now use `pnpm/action-setup@v6.0.5` + `actions/setup-node@v6` with `cache: 'pnpm'`. `docs-*.yml` no longer needs `working-directory: website` or `cache-dependency-path` — they install once at root and run tasks via `pnpm --filter ./website ...`. `release-prepare.yml` uses `pnpm version` and the workspace filter for the docs version snapshot.
- Cardinality scrape (`src/metrics/cardinalityMetrics.ts`) no longer issues a redundant `User.find` when `ANONYMIZE_EMAIL_LABEL=true` (which is the default). One less Mongo round-trip per cardinality tick; the three emit loops collapsed to a single `labelFor()` closure.
- ESLint upgraded to **v10** (was v9.39). Config rewritten flat-native using the `typescript-eslint` aggregator and `eslint-plugin-import-x` (a maintained drop-in for the unmaintained `eslint-plugin-import`, which has no published v10-compatible release on npm yet). `FlatCompat`, `@eslint/compat`, `@eslint/eslintrc`, and the unused `eslint-plugin-jest` (project uses vitest) all removed. Lint command no longer needs the legacy `--ext .ts` flag; `eslint .` does the right thing under flat config.
- TypeScript upgraded to **6.0.3**.
- Docker base image: `node:25-alpine` → `node:26-alpine`. Corepack is installed via `npm install -g corepack@latest` since Alpine's Node image doesn't ship it bundled (and pnpm docs recommend the latest Corepack anyway to avoid stale-signature warnings).
- Website docs: `environment-variables.mdx` and `metrics.mdx` now correctly document the `id` label (the three high-cardinality metrics were already emitted with `id`, but the docs had stale `email`) and the new `ANONYMIZE_EMAIL_LABEL` + `CARDINALITY_REFRESH_INTERVAL` env vars.

### Fixed

- Recurring `npm error Missing: @emnapi/core@1.10.0 from lock file` CI failures. Root cause was npm stripping platform-conditional optional dependencies (`@emnapi/*`, `@img/sharp-*`, `lightningcss-*` and friends) from `package-lock.json` based on the host that produced the install, then failing on CI runners that *did* need them. pnpm's lockfile model captures the full graph and applies `os` / `cpu` / `libc` filters at install time rather than at lock time, so the symptom is structurally gone. The new lockfile-drift guardrail in `ci.yml` makes any future regression of the same class impossible to merge silently.

### Internal

- Closed 12 stale Dependabot PRs (#194, #196, #197, #198, #199, #200, #201, #202, #210, #211, #213, #214) — either superseded by the bumps in this release, or already at target version on `dev`.
- Husky pre-commit hook: `npx lint-staged` → `pnpm exec lint-staged`.
- Cardinality module: dropped the unused identity-map `userIdToLabel` and the duplicated `userIdToLabel.get(...) || (anonymize ? userId : "unknown")` fallback expressions.

## [0.9.0] - 2026-05-20

See the [v0.9.0 GitHub Release](https://github.com/rubentalstra/librechat-prom-exporter/releases/tag/v0.9.0) for notes — releases up to and including v0.9.0 lived only in GitHub Releases.

[Unreleased]: https://github.com/rubentalstra/librechat-prom-exporter/compare/v0.10.0...HEAD
[0.10.0]: https://github.com/rubentalstra/librechat-prom-exporter/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/rubentalstra/librechat-prom-exporter/releases/tag/v0.9.0
