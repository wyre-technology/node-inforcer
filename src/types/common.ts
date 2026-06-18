/**
 * Inforcer region codes mapped to production API base URLs in `region.ts`.
 */
export type InforcerRegion = 'anz' | 'eu' | 'uk' | 'us';

/**
 * Client configuration for {@link InforcerClient}.
 *
 * `region` is required (there is no silent default). Provide an explicit
 * `baseUrl` to override the region map (e.g. for a non-production endpoint).
 */
export interface InforcerClientConfig {
  /** Region for the production API. One of: anz, eu, uk, us. */
  region: InforcerRegion;
  /** Inforcer API key, sent as the `Inf-Api-Key` header. */
  apiKey: string;
  /** Optional explicit base URL override. Trailing slash is trimmed. */
  baseUrl?: string;
  /** Request timeout in milliseconds. Default: 30000. */
  timeout?: number;
  /** Max retries on 5xx/network errors. Default: 3. */
  maxRetries?: number;
  /** Override the fetch implementation (defaults to global fetch). */
  fetchImpl?: typeof fetch;
}

/**
 * Standard response envelope returned by every Inforcer endpoint.
 *
 * `data` carries the payload. `continuationToken` and `totalCount` appear at the
 * envelope root (siblings of `data`) for the users/groups list endpoints.
 */
export interface ApiEnvelope<T = unknown> {
  success: boolean;
  message?: string;
  errors?: string[];
  errorCode?: string;
  data: T;
  continuationToken?: string;
  totalCount?: number;
}

/**
 * A paginated result surfacing the cursor and (when available) total count that
 * the Inforcer API returns alongside `data` for list/search endpoints.
 */
export interface PaginatedResult<T> {
  data: T[];
  continuationToken?: string;
  totalCount?: number;
}

/**
 * A tenant identifier accepted by tenant-scoped methods: either the numeric
 * Inforcer Client Tenant ID, or a value resolved via {@link resolveTenantId}
 * (Azure AD tenant GUID, tenant DNS name, or friendly name).
 */
export type TenantIdInput = number | string;
