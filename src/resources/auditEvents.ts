import type { HttpClient } from '../http.js';
import type { AuditEvent, EventType, AuditEventSearchOptions } from '../types/audit.js';

/**
 * Page of audit events returned by {@link AuditEventsResource.search}. The
 * Inforcer search endpoint nests `items` + `continuationToken` inside `.data`
 * (unlike the users/groups endpoints, which put the token at the envelope root).
 */
export interface AuditEventSearchResult {
  items: AuditEvent[];
  continuationToken?: string;
}

interface AuditSearchData {
  items?: AuditEvent[];
  continuationToken?: string;
}

export class AuditEventsResource {
  constructor(private getClient: () => Promise<HttpClient>) {}

  /**
   * List the audit event types available for filtering.
   * `GET /beta/auditEvents/eventTypes`
   */
  async listEventTypes(): Promise<EventType[]> {
    const client = await this.getClient();
    const data = await client.request<EventType[]>('/beta/auditEvents/eventTypes');
    return Array.isArray(data) ? data : data ? [data] : [];
  }

  /**
   * Search the activity log. `POST /beta/auditEvents/search`
   *
   * Sends a JSON body of the provided filters. The response nests `items` and
   * `continuationToken` inside `.data`; pass the returned `continuationToken`
   * back via options to fetch the next page.
   */
  async search(options: AuditEventSearchOptions = {}): Promise<AuditEventSearchResult> {
    const client = await this.getClient();

    const body: Record<string, unknown> = {};
    if (options.eventTypes) body.eventTypes = options.eventTypes;
    if (options.dateFrom) body.dateFrom = options.dateFrom;
    if (options.dateTo) body.dateTo = options.dateTo;
    if (options.pageSize !== undefined) body.pageSize = options.pageSize;
    if (options.continuationToken) body.continuationToken = options.continuationToken;

    const data = await client.request<AuditSearchData>('/beta/auditEvents/search', {
      method: 'POST',
      body,
      preserveStructure: true,
    });

    return {
      items: Array.isArray(data?.items) ? data.items : [],
      continuationToken: data?.continuationToken,
    };
  }
}
