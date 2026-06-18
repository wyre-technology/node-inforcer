import type { HttpClient } from '../http.js';
import type { BaselineGroup } from '../types/baselines.js';

export interface BaselineListOptions {
  /** Filter baseline groups by baseline (owner) tenant ID. */
  baselineTenantId?: number;
}

export class BaselinesResource {
  constructor(private getClient: () => Promise<HttpClient>) {}

  /**
   * List baseline groups and their members. `GET /beta/baselines`
   *
   * `baselineTenantId` is passed through as a query param when provided.
   */
  async list(options: BaselineListOptions = {}): Promise<BaselineGroup[]> {
    const client = await this.getClient();
    const params: Record<string, unknown> = {};
    if (options.baselineTenantId !== undefined) {
      params.baselineTenantId = options.baselineTenantId;
    }
    const data = await client.request<BaselineGroup[]>('/beta/baselines', { params });
    return Array.isArray(data) ? data : data ? [data] : [];
  }
}
