/** A type of audit event (used to filter the activity log). */
export interface EventType {
  name: string;
}

/** An entry in the activity log. */
export interface AuditEvent {
  id: string;
  correlationId?: string;
  clientId?: number;
  relType?: string;
  relId?: string;
  eventType?: string;
  message?: string;
  code?: string;
  user?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

/** Filters for {@link AuditEventsResource.search} (POST /beta/auditEvents/search). */
export interface AuditEventSearchOptions {
  eventTypes?: string[];
  dateFrom?: string;
  dateTo?: string;
  pageSize?: number;
  continuationToken?: string;
}
