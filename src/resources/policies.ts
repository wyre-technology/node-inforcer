import type { HttpClient } from '../http.js';
import type { Policy } from '../types/policies.js';
import type { TenantIdInput } from '../types/common.js';
import { resolveTenantId } from '../tenant-resolver.js';

export class PoliciesResource {
  constructor(private getClient: () => Promise<HttpClient>) {}

  /**
   * List policies for a tenant. `GET /beta/tenants/{tenantId}/policies`
   *
   * `tenantId` accepts a numeric Client Tenant ID, GUID, DNS name, or friendly name.
   */
  async listByTenant(tenantId: TenantIdInput): Promise<Policy[]> {
    const client = await this.getClient();
    const clientTenantId = await resolveTenantId(client, tenantId);
    const data = await client.request<Policy[]>(`/beta/tenants/${clientTenantId}/policies`);
    return Array.isArray(data) ? data : data ? [data] : [];
  }
}
