# Dagna (ዳኛ) Maintenance Schedule & Cloud Budget

## 1. Monthly Cost Breakdown (< $40/month Target)

| Service | Provider & Plan | Specs | Real Monthly Cost |
|---|---|---|---|
| **Core Host VPS** | Hetzner Cloud CX22 | 2 vCPU / 4 GB RAM / 40 GB SSD | **€3.79 (~$4.15)** |
| **Judge Host VPS** | Hetzner Cloud CPX31 | 4 Dedicated vCPU / 8 GB RAM / 80 GB SSD | **€14.20 (~$15.50)** |
| **Object Storage** | Cloudflare R2 / MinIO | S3 API, 10 GB free tier | **$0.00** |
| **Email Service** | Brevo / Resend | 300 free emails/day tier | **$0.00** |
| **DNS / CDN / WAF** | Cloudflare Free Tier | DDoS mitigation, SSL, Global edge | **$0.00** |
| **Backup Storage** | Hetzner Storage Box | 1 TB offsite storage | **€3.80 (~$4.15)** |
| **Total Monthly Cost** | | | **~$23.80 / month** |

*Well under the $40/month budget ceiling!*

## 2. Maintenance Cadence
- **Weekly:** Review Renovate dependency PRs and security advisories.
- **Monthly:** OS kernel security updates on Core and Judge hosts, followed by automated hostile suite run.
- **Monthly:** Automated restore drill verified in scratch container.
- **Quarterly:** Review language time multipliers and memory allowances against fresh microbenchmarks.
