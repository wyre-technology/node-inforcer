import type { HttpClient } from '../http.js';
import type { AlignmentScore } from '../types/alignment.js';
import type { TenantIdInput } from '../types/common.js';
import { resolveTenantId } from '../tenant-resolver.js';

export class AlignmentResource {
  constructor(private getClient: () => Promise<HttpClient>) {}

  /** List alignment scores for tenants. `GET /beta/alignmentScores` */
  async listScores(): Promise<AlignmentScore[]> {
    const client = await this.getClient();
    const data = await client.request<AlignmentScore[]>('/beta/alignmentScores');
    return Array.isArray(data) ? data : data ? [data] : [];
  }

  /**
   * Get detailed alignment data for a tenant.
   * `GET /beta/tenants/{tenantId}/alignmentDetails`
   *
   * `tenantId` accepts a numeric Client Tenant ID, GUID, DNS name, or friendly name.
   */
  async getDetails(tenantId: TenantIdInput): Promise<unknown> {
    const client = await this.getClient();
    const clientTenantId = await resolveTenantId(client, tenantId);
    return client.request(`/beta/tenants/${clientTenantId}/alignmentDetails`, {
      preserveStructure: true,
    });
  }
}
