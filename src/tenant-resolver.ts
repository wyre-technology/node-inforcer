import type { HttpClient } from './http.js';
import type { Tenant } from './types/tenants.js';
import type { TenantIdInput } from './types/common.js';
import { InforcerError } from './errors.js';

const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isIntegerLike(value: TenantIdInput): boolean {
  if (typeof value === 'number') return Number.isInteger(value);
  return /^-?\d+$/.test(value.trim());
}

/**
 * Resolve a tenant identifier to the numeric Inforcer **Client Tenant ID**.
 *
 * Inforcer's path `tenantId` is an integer "Client Tenant ID", NOT the Azure AD
 * tenant GUID (`msTenantId`). This helper mirrors the community module's
 * `Resolve-InforcerTenantId`:
 *
 * - If `input` is already an integer (or integer-string), return it directly.
 * - Otherwise fetch `GET /beta/tenants` and match (case-insensitively) on
 *   `msTenantId` (GUID), `tenantDnsName`, or `tenantFriendlyName`, returning the
 *   matching `clientTenantId`.
 *
 * @throws {InforcerError} when no tenant matches, or when a name matches more
 * than one tenant (ambiguous — pass the numeric Client Tenant ID instead).
 */
export async function resolveTenantId(
  client: HttpClient,
  input: TenantIdInput,
  tenantData?: Tenant[]
): Promise<number> {
  if (isIntegerLike(input)) {
    return typeof input === 'number' ? input : parseInt(input.trim(), 10);
  }

  const needle = String(input).trim();
  const tenants =
    tenantData ?? (await client.request<Tenant[]>('/beta/tenants')) ?? [];
  const list = Array.isArray(tenants) ? tenants : [tenants];

  // GUID → match on msTenantId.
  if (GUID_PATTERN.test(needle)) {
    for (const t of list) {
      if (t?.msTenantId && String(t.msTenantId).toLowerCase() === needle.toLowerCase()) {
        if (t.clientTenantId != null) return Number(t.clientTenantId);
      }
    }
    throw new InforcerError(`No tenant found with Microsoft Tenant ID: ${needle}`);
  }

  // Name → match on tenantFriendlyName or tenantDnsName (case-insensitive).
  const matches = list.filter((t) => {
    const friendly = t?.tenantFriendlyName?.toLowerCase();
    const dns = t?.tenantDnsName?.toLowerCase();
    const lower = needle.toLowerCase();
    return friendly === lower || dns === lower;
  });

  if (matches.length === 1 && matches[0].clientTenantId != null) {
    return Number(matches[0].clientTenantId);
  }

  if (matches.length > 1) {
    const ids = matches.map((t) => t.clientTenantId).join(', ');
    throw new InforcerError(
      `Multiple tenants match name '${needle}' (IDs: ${ids}). Use the numeric Client Tenant ID instead.`
    );
  }

  throw new InforcerError(
    `No tenant found with name '${needle}'. Use tenants.list() to list available tenants.`
  );
}
