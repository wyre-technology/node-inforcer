import type { HttpClient } from '../http.js';
import type { Assessment, AssessmentRun } from '../types/assessments.js';
import type { TenantIdInput } from '../types/common.js';
import { resolveTenantId } from '../tenant-resolver.js';

export class AssessmentsResource {
  constructor(private getClient: () => Promise<HttpClient>) {}

  /** List available assessments. `GET /beta/assessments` */
  async list(): Promise<Assessment[]> {
    const client = await this.getClient();
    const data = await client.request<Assessment[]>('/beta/assessments');
    return Array.isArray(data) ? data : data ? [data] : [];
  }

  /**
   * Trigger an assessment run for a tenant. The only mutating method in this SDK.
   * `POST /beta/tenants/{tenantId}/assessments/{assessmentId}/runs`
   *
   * `tenantId` accepts a numeric Client Tenant ID, GUID, DNS name, or friendly name.
   * `assessmentId` is the assessment's ID (use {@link list} to discover IDs).
   */
  async run(tenantId: TenantIdInput, assessmentId: string): Promise<AssessmentRun> {
    const client = await this.getClient();
    const clientTenantId = await resolveTenantId(client, tenantId);
    return client.request<AssessmentRun>(
      `/beta/tenants/${clientTenantId}/assessments/${assessmentId}/runs`,
      { method: 'POST', preserveStructure: true }
    );
  }
}
