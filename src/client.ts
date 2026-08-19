import type { InforcerClientConfig } from './types/common.js';
import { HttpClient } from './http.js';
import { resolveBaseUrl } from './region.js';
import { resolveTenantId } from './tenant-resolver.js';
import type { TenantIdInput } from './types/common.js';
import { TenantsResource } from './resources/tenants.js';
import { BaselinesResource } from './resources/baselines.js';
import { AlignmentResource } from './resources/alignment.js';
import { PoliciesResource } from './resources/policies.js';
import { SecureScoresResource } from './resources/secure-scores.js';
import { UsersResource } from './resources/users.js';
import { GroupsResource } from './resources/groups.js';
import { RolesResource } from './resources/roles.js';
import { AuditEventsResource } from './resources/auditEvents.js';
import { AssessmentsResource } from './resources/assessments.js';
import { ReportsResource } from './resources/reports.js';

/**
 * Client for the Inforcer REST API.
 *
 * `region` is required (anz, eu, uk, us); provide an explicit `baseUrl` to
 * override the region map. Every request sends the `Inf-Api-Key` header.
 *
 * The underlying {@link HttpClient} is created lazily and shared across all
 * resource getters.
 */
export class InforcerClient {
  readonly tenants: TenantsResource;
  readonly baselines: BaselinesResource;
  readonly alignment: AlignmentResource;
  readonly policies: PoliciesResource;
  readonly secureScores: SecureScoresResource;
  readonly users: UsersResource;
  readonly groups: GroupsResource;
  readonly roles: RolesResource;
  readonly auditEvents: AuditEventsResource;
  readonly assessments: AssessmentsResource;
  readonly reports: ReportsResource;

  private httpClient: HttpClient | null = null;
  private readonly config: Required<
    Pick<InforcerClientConfig, 'region' | 'apiKey' | 'timeout' | 'maxRetries' | 'fetchImpl'>
  > & { baseUrl?: string };

  constructor(config: InforcerClientConfig) {
    if (!config.region && !config.baseUrl) {
      throw new Error('InforcerClient requires a `region` (anz, eu, uk, us) or an explicit `baseUrl`.');
    }
    if (!config.apiKey) {
      throw new Error('InforcerClient requires an `apiKey`.');
    }

    this.config = {
      region: config.region,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      timeout: config.timeout ?? 30_000,
      maxRetries: config.maxRetries ?? 3,
      fetchImpl: config.fetchImpl ?? globalThis.fetch,
    };

    const getClient = async () => this.getHttpClient();

    this.tenants = new TenantsResource(getClient);
    this.baselines = new BaselinesResource(getClient);
    this.alignment = new AlignmentResource(getClient);
    this.policies = new PoliciesResource(getClient);
    this.secureScores = new SecureScoresResource(getClient);
    this.users = new UsersResource(getClient);
    this.groups = new GroupsResource(getClient);
    this.roles = new RolesResource(getClient);
    this.auditEvents = new AuditEventsResource(getClient);
    this.assessments = new AssessmentsResource(getClient);
    this.reports = new ReportsResource(getClient);
  }

  /**
   * Resolve a tenant identifier (numeric Client Tenant ID, Azure AD GUID, DNS
   * name, or friendly name) to the numeric Inforcer Client Tenant ID. Mirrors
   * the community module's `Resolve-InforcerTenantId`.
   */
  async resolveTenantId(tenantId: TenantIdInput): Promise<number> {
    const client = await this.getHttpClient();
    return resolveTenantId(client, tenantId);
  }

  private async getHttpClient(): Promise<HttpClient> {
    if (this.httpClient) {
      return this.httpClient;
    }

    const baseUrl = resolveBaseUrl(this.config.region, this.config.baseUrl);

    this.httpClient = new HttpClient({
      baseUrl,
      apiKey: this.config.apiKey,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      fetchImpl: this.config.fetchImpl,
    });

    return this.httpClient;
  }
}
