import type { HttpClient } from '../http.js';
import { NotFoundError } from '../errors.js';
import { resolveTenantId } from '../tenant-resolver.js';
import type { TenantIdInput } from '../types/common.js';
import type {
  ReportType,
  ReportRun,
  ReportRunRequestEntry,
  ReportRunQueueResult,
  ReportRunOutputsProbe,
  ReportRunOutput,
  ReportOutputDownload,
} from '../types/reports.js';

export class ReportsResource {
  constructor(private getClient: () => Promise<HttpClient>) {}

  /** List the report type catalog. `GET /beta/reports/types` */
  async types(): Promise<ReportType[]> {
    const client = await this.getClient();
    const data = await client.request<ReportType[]>('/beta/reports/types');
    return Array.isArray(data) ? data : data ? [data] : [];
  }

  /** List queued/completed report runs. `GET /beta/reports/runs` */
  async listRuns(): Promise<ReportRun[]> {
    const client = await this.getClient();
    const data = await client.request<ReportRun[]>('/beta/reports/runs');
    return Array.isArray(data) ? data : data ? [data] : [];
  }

  /**
   * Queue one or more reports across one or more tenants. `POST /beta/reports/runs`
   *
   * Each tenant identifier accepts a numeric Client Tenant ID, an Azure AD tenant
   * GUID, a tenant DNS name, or a friendly name — resolved to the numeric Client
   * Tenant ID before the request, mirroring {@link AssessmentsResource.run}.
   */
  async run(
    reports: ReportRunRequestEntry[],
    tenantIds: TenantIdInput[]
  ): Promise<ReportRunQueueResult> {
    const client = await this.getClient();
    const resolvedTenants = await Promise.all(
      tenantIds.map((t) => resolveTenantId(client, t))
    );
    return client.request<ReportRunQueueResult>('/beta/reports/runs', {
      method: 'POST',
      body: { reports, tenants: { includeTenants: resolvedTenants } },
      preserveStructure: true,
    });
  }

  /**
   * Probe whether a run has finished. `GET /beta/reports/runs/{runId}/outputs`
   *
   * The API returns 200 with the output list once the run is terminal, and 404
   * while it is still pending — normalized here into `{ isTerminal, outputs }`
   * so callers don't need to catch {@link NotFoundError} themselves.
   */
  async outputs(runId: string): Promise<ReportRunOutputsProbe> {
    const client = await this.getClient();
    try {
      const data = await client.request<ReportRunOutput[] | ReportRunOutput>(
        `/beta/reports/runs/${runId}/outputs`
      );
      const outputs = Array.isArray(data) ? data : data ? [data] : [];
      return { isTerminal: true, outputs };
    } catch (err) {
      if (err instanceof NotFoundError) {
        return { isTerminal: false, outputs: [] };
      }
      throw err;
    }
  }

  /**
   * Download a single report output's raw bytes.
   * `GET /beta/reports/runs/{runId}/outputs/{outputId}`
   */
  async downloadOutput(runId: string, outputId: string): Promise<ReportOutputDownload> {
    const client = await this.getClient();
    return client.requestBinary(`/beta/reports/runs/${runId}/outputs/${outputId}`);
  }
}
