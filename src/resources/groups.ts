import type { HttpClient } from '../http.js';
import type { TenantGroup, TenantGroupSummary, GroupListOptions } from '../types/groups.js';
import type { ApiEnvelope, PaginatedResult, TenantIdInput } from '../types/common.js';
import { resolveTenantId } from '../tenant-resolver.js';

export class GroupsResource {
  constructor(private getClient: () => Promise<HttpClient>) {}

  /**
   * List Entra ID group summaries for a tenant.
   * `GET /beta/tenants/{tenantId}/groups`
   *
   * `tenantId` accepts a numeric Client Tenant ID, GUID, DNS name, or friendly name.
   *
   * Pagination metadata (`continuationToken`, `totalCount`) lives at the envelope
   * root alongside `data`, so this method returns a {@link PaginatedResult}.
   * Pass the returned `continuationToken` back via options to fetch the next page.
   */
  async listByTenant(
    tenantId: TenantIdInput,
    options: GroupListOptions = {}
  ): Promise<PaginatedResult<TenantGroupSummary>> {
    const client = await this.getClient();
    const clientTenantId = await resolveTenantId(client, tenantId);

    const params: Record<string, unknown> = {};
    if (options.search) params.search = options.search;
    if (options.continuationToken) params.continuationToken = options.continuationToken;

    const envelope = await client.request<ApiEnvelope<TenantGroupSummary[]>>(
      `/beta/tenants/${clientTenantId}/groups`,
      { params, preserveFullResponse: true }
    );

    return {
      data: Array.isArray(envelope.data) ? envelope.data : [],
      continuationToken: envelope.continuationToken,
      totalCount: envelope.totalCount,
    };
  }

  /**
   * Get full detail for a single group, including members.
   * `GET /beta/tenants/{tenantId}/groups/{groupId}`
   *
   * `tenantId` accepts a numeric Client Tenant ID, GUID, DNS name, or friendly name.
   */
  async get(tenantId: TenantIdInput, groupId: string): Promise<TenantGroup> {
    const client = await this.getClient();
    const clientTenantId = await resolveTenantId(client, tenantId);
    return client.request<TenantGroup>(`/beta/tenants/${clientTenantId}/groups/${groupId}`, {
      preserveStructure: true,
    });
  }
}
