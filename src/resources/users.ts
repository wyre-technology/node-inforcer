import type { HttpClient } from '../http.js';
import type { User, UserSummary, UserListOptions } from '../types/users.js';
import type { ApiEnvelope, PaginatedResult, TenantIdInput } from '../types/common.js';
import { resolveTenantId } from '../tenant-resolver.js';

export class UsersResource {
  constructor(private getClient: () => Promise<HttpClient>) {}

  /**
   * List user summaries for a tenant. `GET /beta/tenants/{tenantId}/users`
   *
   * `tenantId` accepts a numeric Client Tenant ID, GUID, DNS name, or friendly name.
   *
   * Pagination metadata (`continuationToken`, `totalCount`) lives at the envelope
   * root alongside `data`, so this method returns a {@link PaginatedResult}.
   * Pass the returned `continuationToken` back via options to fetch the next page.
   */
  async listByTenant(
    tenantId: TenantIdInput,
    options: UserListOptions = {}
  ): Promise<PaginatedResult<UserSummary>> {
    const client = await this.getClient();
    const clientTenantId = await resolveTenantId(client, tenantId);

    const params: Record<string, unknown> = {};
    if (options.search) params.search = options.search;
    if (options.continuationToken) params.continuationToken = options.continuationToken;

    const envelope = await client.request<ApiEnvelope<UserSummary[]>>(
      `/beta/tenants/${clientTenantId}/users`,
      { params, preserveFullResponse: true }
    );

    return {
      data: Array.isArray(envelope.data) ? envelope.data : [],
      continuationToken: envelope.continuationToken,
      totalCount: envelope.totalCount,
    };
  }

  /**
   * Get full detail for a single user.
   * `GET /beta/tenants/{tenantId}/users/{userId}`
   *
   * `tenantId` accepts a numeric Client Tenant ID, GUID, DNS name, or friendly name.
   */
  async get(tenantId: TenantIdInput, userId: string): Promise<User> {
    const client = await this.getClient();
    const clientTenantId = await resolveTenantId(client, tenantId);
    return client.request<User>(`/beta/tenants/${clientTenantId}/users/${userId}`, {
      preserveStructure: true,
    });
  }
}
