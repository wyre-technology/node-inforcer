import type { HttpClient } from '../http.js';
import type { Tenant } from '../types/tenants.js';
import type { TenantIdInput } from '../types/common.js';
import { resolveTenantId } from '../tenant-resolver.js';
import { NotFoundError } from '../errors.js';

export class TenantsResource {
  constructor(private getClient: () => Promise<HttpClient>) {}

  /** List all tenants. `GET /beta/tenants` */
  async list(): Promise<Tenant[]> {
    const client = await this.getClient();
    const data = await client.request<Tenant[]>('/beta/tenants');
    return Array.isArray(data) ? data : data ? [data] : [];
  }

  /**
   * Get a single tenant. Mirrors the module: fetches `GET /beta/tenants` and
   * filters client-side (for dedup/consistency). Accepts a numeric Client
   * Tenant ID, an Azure AD GUID, a DNS name, or a friendly name.
   *
   * @throws {NotFoundError} when no tenant matches.
   */
  async get(tenantId: TenantIdInput): Promise<Tenant> {
    const client = await this.getClient();
    const tenants = await this.list();
    const clientTenantId = await resolveTenantId(client, tenantId, tenants);
    const match = tenants.find((t) => Number(t.clientTenantId) === clientTenantId);
    if (!match) {
      throw new NotFoundError('Tenant or resource not found.');
    }
    return match;
  }
}
