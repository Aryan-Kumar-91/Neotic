# Security Policy

## Supported Versions

We currently provide security updates for the following versions of Neotic:

| Version | Supported          |
| ------- | ------------------ |
| Main branch | :white_check_mark: |
| All prior versions | :x:                |

## Reporting a Vulnerability

We take the security of Neotic seriously, especially given its role as an enterprise-grade AI reasoning platform. If you discover a security vulnerability within Neotic, please do **not** open a public issue.

Instead, please report it privately:

1. Send an email to the lead maintainers or use GitHub's private vulnerability reporting feature if enabled.
2. Please include a detailed description of the vulnerability.
3. Provide the steps required to reproduce the issue.
4. Include any possible mitigation if you have one.

### Response Timeline

*   We will acknowledge receipt of your vulnerability report within **48 hours**.
*   We will send you regular updates about our progress in addressing the vulnerability.
*   Once the issue has been resolved, we will publish a security advisory and, if you wish, credit you for the discovery.

## Scope

This policy applies to all systems managed within this repository, including but not limited to:
*   The Next.js frontend application (`src/`)
*   The FastAPI Python backend services (`server/`)
*   Database security configurations (`firestore.rules`)
*   Authentication and visualization components

It **does not** apply to vulnerabilities in third-party services (e.g., Firebase, Google AI Studio) unless the vulnerability is caused by a misconfiguration in our code.
