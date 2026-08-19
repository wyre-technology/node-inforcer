/**
 * A report type catalog entry from `GET /beta/reports/types`. Field set is not
 * formally documented by the community module; common fields are typed here
 * and unknown extras preserved.
 */
export interface ReportType {
  key: string;
  tags?: string[];
  collatable?: boolean;
  supportedOutputFormats?: string[];
  [key: string]: unknown;
}

/** A single report request within a `POST /beta/reports/runs` body. */
export interface ReportRunRequestEntry {
  type: string;
  outputFormat: string;
  collate?: boolean;
  parameters?: Record<string, string>;
}

/** Body of `POST /beta/reports/runs`. */
export interface ReportRunRequest {
  reports: ReportRunRequestEntry[];
  tenants: { includeTenants: number[] };
}

/**
 * Response from queuing a report run. Shape not formally documented by the
 * community module; passed through as-is.
 */
export interface ReportRunQueueResult {
  [key: string]: unknown;
}

/** A report run record from `GET /beta/reports/runs`. */
export interface ReportRun {
  runId?: string;
  id?: string;
  status?: string;
  [key: string]: unknown;
}

/** A single downloadable output produced by a completed report run. */
export interface ReportRunOutput {
  id?: string;
  outputId?: string;
  [key: string]: unknown;
}

/**
 * Result of probing `GET /beta/reports/runs/{runId}/outputs`. The endpoint
 * returns 200 with the outputs once the run is terminal, and 404 while it is
 * still pending — this shape normalizes both into one result.
 */
export interface ReportRunOutputsProbe {
  isTerminal: boolean;
  outputs: ReportRunOutput[];
}

/** Raw bytes downloaded from `GET /beta/reports/runs/{runId}/outputs/{outputId}`. */
export interface ReportOutputDownload {
  data: ArrayBuffer;
  contentType: string | null;
  fileName: string | null;
}
