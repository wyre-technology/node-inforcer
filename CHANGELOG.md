## [1.1.1](https://github.com/WYRE-AI/node-inforcer/compare/v1.1.0...v1.1.1) (2026-08-25)


### Bug Fixes

* migrate to WYRE-AI org (npm scope, ghcr namespace, registry) ([#17](https://github.com/WYRE-AI/node-inforcer/issues/17)) ([4b096b8](https://github.com/WYRE-AI/node-inforcer/commit/4b096b8f568aa47f1e67688552a96a613846fc5b))

# [1.1.0](https://github.com/wyre-technology/node-inforcer/compare/v1.0.0...v1.1.0) (2026-08-19)


### Features

* add reports resource for report generation and download ([#15](https://github.com/wyre-technology/node-inforcer/issues/15)) ([65a1b1b](https://github.com/wyre-technology/node-inforcer/commit/65a1b1b4c55ba6ba1a8c387193640ce8680b309e))

# 1.0.0 (2026-06-18)


### Features

* initial Inforcer API client SDK ([4217038](https://github.com/wyre-technology/node-inforcer/commit/421703808d3176d31cfdfd664657d996970c0f78))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of `@wyre-technology/node-inforcer`, a zero-dependency Node.js / TypeScript
  client for the Inforcer REST API. API knowledge is community-sourced from
  [royklo/InforcerCommunity](https://github.com/royklo/InforcerCommunity) (MIT); nothing is invented.
- `InforcerClient` with a required `region` (`anz` | `eu` | `uk` | `us`), an optional `baseUrl`
  override (trailing slash trimmed), and `Inf-Api-Key` header authentication. The shared HTTP
  client is created lazily.
- Resources mirroring the community module:
  - `tenants` — list, get (numeric Client Tenant ID, GUID, DNS name, or friendly name).
  - `baselines` — list (`baselineTenantId` filter).
  - `alignment` — `listScores`, `getDetails`.
  - `policies` — `listByTenant`.
  - `secureScores` — `getByTenant`.
  - `users` — `listByTenant` (search + `continuationToken`, preserving `continuationToken`/`totalCount`), `get`.
  - `groups` — `listByTenant` (search + pagination), `get`.
  - `roles` — `listByTenant`.
  - `auditEvents` — `listEventTypes`, `search` (`POST` with JSON body, preserving `continuationToken`).
  - `assessments` — `list`, `run` (mutating).
  - `reports` — `types`, `listRuns`, `run` (mutating — queues a run across one or more tenants),
    `outputs` (poll a run to terminal; normalizes the API's 200/404 polling contract into
    `{ isTerminal, outputs }`), `downloadOutput` (raw bytes via `HttpClient.requestBinary`).
- `resolveTenantId` helper and `InforcerClient.resolveTenantId` for the Client Tenant ID (integer)
  vs Azure AD tenant GUID distinction.
- Standard envelope unwrapping (`{ success, message, errors, data }`) with `preserveFullResponse`
  and `preserveStructure` modes for the paginated endpoints, mirroring the upstream
  `Invoke-InforcerApiRequest` switches.
- Typed errors (`InforcerError`, `AuthenticationError`, `ForbiddenError`, `NotFoundError`,
  `RateLimitError`, `ServerError`) with `errorCode`/status mapping and API-key redaction.
- Full TypeScript type definitions for every documented schema; ESM + CommonJS builds.
