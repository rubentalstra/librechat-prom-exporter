# LibreChat Prometheus Exporter

[![CI](https://github.com/rubentalstra/librechat-prom-exporter/actions/workflows/ci.yml/badge.svg)](https://github.com/rubentalstra/librechat-prom-exporter/actions/workflows/ci.yml)
[![CD](https://github.com/rubentalstra/librechat-prom-exporter/actions/workflows/cd.yml/badge.svg)](https://github.com/rubentalstra/librechat-prom-exporter/actions/workflows/cd.yml)
[![Docs](https://github.com/rubentalstra/librechat-prom-exporter/actions/workflows/docs-deploy.yml/badge.svg)](https://rubentalstra.github.io/librechat-prom-exporter/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GHCR](https://img.shields.io/badge/ghcr.io-librechat--prom--exporter-blue)](https://github.com/rubentalstra/librechat-prom-exporter/pkgs/container/librechat-prom-exporter)

Lightweight Node.js service that connects to a **LibreChat MongoDB** database, collects useful metrics, and exposes them on `/metrics` for **Prometheus** to scrape and **Grafana** to visualize.

## 📖 [Read the full docs →](https://rubentalstra.github.io/librechat-prom-exporter/)

## Quick start

```bash
# 1. Copy the example env file and edit MONGO_URI
cp .env.example .env

# 2. Run with docker-compose (pulls prebuilt image from GHCR)
docker compose up -d

# 3. Confirm
curl -fsS http://localhost:9087/metrics | head
```

## Where to next

| You want to...               | See                                                                                                                  |
|------------------------------|----------------------------------------------------------------------------------------------------------------------|
| Install it (Docker or local) | [Installation](https://rubentalstra.github.io/librechat-prom-exporter/docs/installation/docker)                      |
| Configure environment vars   | [Environment variables](https://rubentalstra.github.io/librechat-prom-exporter/docs/reference/environment-variables) |
| Secure `/metrics` with auth  | [Auth](https://rubentalstra.github.io/librechat-prom-exporter/docs/reference/auth)                                   |
| See every metric exposed     | [Metrics reference](https://rubentalstra.github.io/librechat-prom-exporter/docs/reference/metrics)                   |
| Tune for scale               | [Tuning](https://rubentalstra.github.io/librechat-prom-exporter/docs/guides/tuning)                                  |
| Debug a problem              | [Troubleshooting](https://rubentalstra.github.io/librechat-prom-exporter/docs/guides/troubleshooting)                |
| Contribute                   | [Contributing](https://rubentalstra.github.io/librechat-prom-exporter/docs/contributing/)                            |

The published image is multi-arch (`linux/amd64` + `linux/arm64`), signed with [cosign](https://github.com/sigstore/cosign), SLSA build-provenance attested, and SBOM-attached on tagged releases.

## GDPR compliance

This project has been developed with privacy in mind. It exposes only aggregated metrics that do not contain personally identifiable information (PII), adhering to the principle of data minimization. Overall GDPR compliance depends on your complete data-processing workflow and deployment configuration; you are responsible for ensuring your implementation meets all applicable regulations. This statement is informational and does not constitute legal advice.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [Contributing docs](https://rubentalstra.github.io/librechat-prom-exporter/docs/contributing/).

## License

[MIT](LICENSE) — © Ruben Talstra.
