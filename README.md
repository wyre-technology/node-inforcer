# @wyre-technology/node-inforcer

Node.js / TypeScript client library for the [Inforcer](https://www.inforcer.com/) REST API — Microsoft 365 baseline management, alignment scoring, tenant policy, users, groups, roles, audit events, and assessments.

Zero runtime dependencies (native `fetch`). ESM + CommonJS. Strict TypeScript types.

## ⚠️ Community-sourced API (no official public docs)

**Inforcer does not publish official public API documentation.** Every endpoint,
schema, scope, response envelope, and error mapping in this library is mirrored
from the community PowerShell module
**[royklo/InforcerCommunity](https://github.com/royklo/InforcerCommunity)**
(MIT licensed) — the verified primary source. Nothing here is invented or guessed.

Full credit and thanks to **royklo** and the InforcerCommunity contributors. If
Inforcer publishes (or changes) its API, the upstream module — and then this
library — should be updated to match.

## Installation

This package is published to **GitHub Packages**, not the public npm registry.
Add a scoped registry entry to your project's `.npmrc`:

```ini
@wyre-technology:registry=https://npm.pkg.github.com
```

Then install:

```bash
npm install @wyre-technology/node-inforcer
```

(Installing private GitHub Packages requires an authenticated `.npmrc` with a
token that has `read:packages`.)

## Authentication

The Inforcer API authenticates with an **API key** sent in the `Inf-Api-Key`
header. There is no username/password or OAuth flow.

API keys are issued with one or more **scopes** (e.g. `Tenants.Read`,
`Baselines.Read`, `Assessments.Run`). Request the narrowest scope that satisfies
your use case; `Tenants.Read` is broad and covers most tenant-related reads.

## Region is required

Inforcer runs region-specific API hosts. You **must** pass a `region`
(or an explicit `baseUrl` override). There is no silent default.

| Region | Base URL |
|--------|----------|
| `anz`  | `https://api-anz.inforcer.com/api` |
| `eu`   | `https://api-eu.inforcer.com/api`  |
| `uk`   | `https://api-uk.inforcer.com/api`  |
| `us`   | `https://api-us.inforcer.com/api`  |

## Quick start

```typescript
import { InforcerClient } from '@wyre-technology/node-inforcer';

const client = new InforcerClient({
  region: 'uk', // required: 'anz' | 'eu' | 'uk' | 'us'
  apiKey: process.env.INFORCER_API_KEY!,
  // baseUrl: 'https://api.example.com/api', // optional override (trailing slash trimmed)
});

// Tenants
const tenants = await client.tenants.list();
const tenant = await client.tenants.get('contoso.onmicrosoft.com');

// Baselines & alignment
const baselines = await client.baselines.list();
const scores = await client.alignment.listScores();
const details = await client.alignment.getDetails(139);

// Tenant policies
const policies = await client.policies.listByTenant(139);

// Users (paginated — continuationToken + totalCount are siblings of `data`)
const firstPage = await client.users.listByTenant(139, { search: 'Adele' });
console.log(firstPage.data, firstPage.continuationToken, firstPage.totalCount);
if (firstPage.continuationToken) {
  const nextPage = await client.users.listByTenant(139, {
    continuationToken: firstPage.continuationToken,
  });
}
const user = await client.users.get(139, '8e61ce11-a45b-42a6-8ca4-1d881781566d');

// Groups & roles
const groups = await client.groups.listByTenant(139);
const group = await client.groups.get(139, 'f44f2f5c-3160-420b-900d-5ecbede954fc');
const roles = await client.roles.listByTenant(139);

// Audit events
const eventTypes = await client.auditEvents.listEventTypes();
const events = await client.auditEvents.search({
  eventTypes: ['authentication', 'failedAuthentication'],
  dateFrom: '2026-02-01T00:00:00Z',
  dateTo: '2026-02-26T23:59:59Z',
  pageSize: 50,
});
console.log(events.items, events.continuationToken);

// Assessments (run is the only mutating call in this SDK)
const assessments = await client.assessments.list();
const run = await client.assessments.run(144, assessments[0].id);
```

## Tenant ID gotcha: Client Tenant ID (integer) vs Azure AD GUID

Inforcer's path parameter `tenantId` is an **integer Client Tenant ID** — Inforcer's
own internal tenant number. It is **not** the Azure AD / Microsoft tenant GUID
(`msTenantId`).

Every tenant-scoped method accepts a flexible `tenantId` and resolves it for you:

- a **number** (or integer string) → used directly as the Client Tenant ID;
- an **Azure AD GUID** → matched against each tenant's `msTenantId`;
- a **DNS name** (e.g. `contoso.onmicrosoft.com`) → matched against `tenantDnsName`;
- a **friendly name** → matched against `tenantFriendlyName`.

Non-numeric inputs trigger a `GET /beta/tenants` lookup. If a name matches more
than one tenant, resolution throws (pass the numeric Client Tenant ID instead).

You can resolve explicitly too:

```typescript
const clientTenantId = await client.resolveTenantId('contoso.onmicrosoft.com'); // → 139
```

> Passing a numeric Client Tenant ID avoids the extra tenant-list lookup (and the
> `Tenants.Read` scope it requires).

## Error handling

Every response is wrapped in the standard envelope
(`{ success, message, errors, data }`). On `success: false` or a non-2xx status,
the client throws a typed error (with the API key redacted from messages):

| Error | When |
|-------|------|
| `AuthenticationError` | HTTP 401 / invalid credentials |
| `ForbiddenError`      | HTTP 403 or `errorCode: forbidden` (tenant verification / scope) |
| `NotFoundError`       | HTTP 404 or `errorCode: notfound` |
| `RateLimitError`      | HTTP 429 or a quota/rate-limit/throttle message |
| `ServerError`         | HTTP 5xx |
| `InforcerError`       | base class for all of the above |

```typescript
import { InforcerClient, NotFoundError, RateLimitError } from '@wyre-technology/node-inforcer';

try {
  await client.tenants.get('nope.onmicrosoft.com');
} catch (err) {
  if (err instanceof NotFoundError) {
    // tenant or resource not found
  } else if (err instanceof RateLimitError) {
    // back off and retry
  } else {
    throw err;
  }
}
```

Transient 5xx and network errors are retried automatically with exponential
backoff (`maxRetries`, default 3).

## License

Apache-2.0. See [LICENSE](LICENSE).

API knowledge is sourced from [royklo/InforcerCommunity](https://github.com/royklo/InforcerCommunity) (MIT).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
