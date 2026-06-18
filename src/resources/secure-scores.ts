import type { HttpClient } from '../http.js';
import type { SecureScore } from '../types/secure-scores.js';
import type { TenantIdInput } from '../types/common.js';
import { resolveTenantId } from '../tenant-resolver.js';

export class SecureScoresResource {
  constructor(private getClient: () => Promise<HttpClient>) {}

  /**
   * Get Microsoft Secure Score data for a tenant.
   * `GET /beta/tenants/{tenantId}/secureScores`
   *
   * `tenantId` accepts a numeric Client Tenant ID, GUID, DNS name, or friendly name.
   *
   * Note: this route is documented in the Inforcer scope map but is not exposed
   * by a public cmdlet in the community module, so its response shape is not
   * formally documented. The `.data` payload is returned as-is.
   */
  async getByTenant(tenantId: TenantIdInput): Promise<SecureScore> {
    const client = await this.getClient();
    const clientTenantId = await resolveTenantId(client, tenantId);
    return client.request<SecureScore>(`/beta/tenants/${clientTenantId}/secureScores`, {
      preserveStructure: true,
    });
  }
}
