import type { HttpClient } from '../http.js';
import type { TenantRole } from '../types/roles.js';
import type { TenantIdInput } from '../types/common.js';
import { resolveTenantId } from '../tenant-resolver.js';

export class RolesResource {
  constructor(private getClient: () => Promise<HttpClient>) {}

  /**
   * List Entra ID directory role definitions for a tenant.
   * `GET /beta/tenants/{tenantId}/roles`
   *
   * `tenantId` accepts a numeric Client Tenant ID, GUID, DNS name, or friendly name.
   */
  async listByTenant(tenantId: TenantIdInput): Promise<TenantRole[]> {
    const client = await this.getClient();
    const clientTenantId = await resolveTenantId(client, tenantId);
    const data = await client.request<TenantRole[]>(`/beta/tenants/${clientTenantId}/roles`);
    return Array.isArray(data) ? data : data ? [data] : [];
  }
}
