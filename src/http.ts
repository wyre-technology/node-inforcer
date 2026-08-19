import {
  InforcerError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ServerError,
} from './errors.js';
import type { ApiEnvelope } from './types/common.js';

export interface HttpClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  maxRetries: number;
  fetchImpl: typeof fetch;
}

export interface RequestOptions {
  method?: string;
  params?: Record<string, unknown>;
  body?: unknown;
  /**
   * Preserve the full envelope (`{ success, data, continuationToken, ... }`)
   * instead of unwrapping `.data`. Mirrors the module's `-PreserveFullResponse`.
   * Used for the users/groups list endpoints whose pagination metadata lives at
   * the envelope root.
   */
  preserveFullResponse?: boolean;
  /**
   * Unwrap `.data` but preserve its inner structure (do not collapse a wrapper
   * object down to its single array property). Mirrors `-PreserveStructure`.
   * Used for the audit search endpoint whose `items` + `continuationToken` live
   * inside `.data`.
   */
  preserveStructure?: boolean;
}

const QUOTA_PATTERN = /quota|rate.?limit|throttl/i;

export class HttpClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly fetchImpl: typeof fetch;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout;
    this.maxRetries = config.maxRetries;
    this.fetchImpl = config.fetchImpl;
  }

  /** Replace any occurrence of the API key in a string with `[REDACTED]`. */
  private redact(text: string): string {
    if (!this.apiKey) return text;
    return text.split(this.apiKey).join('[REDACTED]');
  }

  async request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', params, body, preserveFullResponse, preserveStructure } = options;

    let endpoint = path.trim();
    if (!endpoint.startsWith('/')) endpoint = `/${endpoint}`;

    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
          for (const v of value) searchParams.append(key, String(v));
        } else {
          searchParams.set(key, String(value));
        }
      }
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = Math.min(1000 * 2 ** (attempt - 1) + Math.random() * 1000, 300_000);
        await new Promise((r) => setTimeout(r, delay));
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const headers: Record<string, string> = {
        'Inf-Api-Key': this.apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };

      let response: Response;
      try {
        response = await this.fetchImpl(url, {
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (err) {
        clearTimeout(timeoutId);
        let e = err as Error;
        if (e.name === 'AbortError') {
          e = new InforcerError(`Request timeout after ${this.timeout}ms`);
        }
        lastError = e;
        if (attempt < this.maxRetries) continue;
        throw e;
      }

      const rawText = await response.text().catch(() => '');
      let parsed: unknown;
      try {
        parsed = rawText ? JSON.parse(rawText) : undefined;
      } catch {
        parsed = undefined;
      }

      const envelope = (parsed && typeof parsed === 'object' ? (parsed as ApiEnvelope<T>) : undefined);

      // HTTP-level errors take precedence (401/429/5xx may not always carry a body).
      if (!response.ok) {
        // Retry transient server errors.
        if (response.status >= 500 && attempt < this.maxRetries) {
          lastError = this.buildError(response.status, envelope, rawText);
          continue;
        }
        throw this.buildError(response.status, envelope, rawText);
      }

      // Envelope-level error (HTTP 200 with success: false).
      if (envelope && envelope.success === false) {
        throw this.buildError(response.status, envelope, rawText);
      }

      if (envelope === undefined) {
        // Non-JSON success body — nothing useful to unwrap.
        return undefined as T;
      }

      if (preserveFullResponse) {
        return envelope as unknown as T;
      }

      const data = 'data' in envelope ? envelope.data : (envelope as unknown);

      if (preserveStructure) {
        return data as T;
      }

      return this.unwrap(data) as T;
    }

    throw lastError ?? new InforcerError('Request failed after retries');
  }

  /**
   * Download raw bytes from an endpoint that returns a file (not a JSON
   * envelope) — e.g. `GET /beta/reports/runs/{runId}/outputs/{outputId}`.
   * Retries on 5xx like {@link request}; does not JSON-parse the body.
   */
  async requestBinary(path: string): Promise<{
    data: ArrayBuffer;
    contentType: string | null;
    fileName: string | null;
  }> {
    let endpoint = path.trim();
    if (!endpoint.startsWith('/')) endpoint = `/${endpoint}`;
    const url = `${this.baseUrl}${endpoint}`;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = Math.min(1000 * 2 ** (attempt - 1) + Math.random() * 1000, 300_000);
        await new Promise((r) => setTimeout(r, delay));
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      let response: Response;
      try {
        response = await this.fetchImpl(url, {
          method: 'GET',
          headers: { 'Inf-Api-Key': this.apiKey },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (err) {
        clearTimeout(timeoutId);
        let e = err as Error;
        if (e.name === 'AbortError') {
          e = new InforcerError(`Request timeout after ${this.timeout}ms`);
        }
        lastError = e;
        if (attempt < this.maxRetries) continue;
        throw e;
      }

      if (!response.ok) {
        if (response.status >= 500 && attempt < this.maxRetries) {
          const rawText = await response.text().catch(() => '');
          lastError = this.buildError(response.status, undefined, rawText);
          continue;
        }
        const rawText = await response.text().catch(() => '');
        let envelope: ApiEnvelope | undefined;
        try {
          envelope = rawText ? (JSON.parse(rawText) as ApiEnvelope) : undefined;
        } catch {
          envelope = undefined;
        }
        throw this.buildError(response.status, envelope, rawText);
      }

      const data = await response.arrayBuffer();
      const contentType = response.headers.get('content-type');
      const fileName = this.parseFileName(response.headers.get('content-disposition'));
      return { data, contentType, fileName };
    }

    throw lastError ?? new InforcerError('Request failed after retries');
  }

  /** Extract the `filename` parameter from a `Content-Disposition` header value. */
  private parseFileName(header: string | null): string | null {
    if (!header) return null;
    const starMatch = /filename\*\s*=\s*[^']*''([^;]+)/i.exec(header);
    if (starMatch) {
      try {
        return decodeURIComponent(starMatch[1].trim());
      } catch {
        return starMatch[1].trim();
      }
    }
    const match = /filename\s*=\s*"?([^";]+)"?/i.exec(header);
    return match ? match[1].trim() : null;
  }

  /**
   * If `data` is a plain object whose only meaningful array property holds the
   * payload (e.g. `{ value: [...] }`), unwrap to that array. Mirrors the tail of
   * `Invoke-InforcerApiRequest` (the default, non-preserve path).
   */
  private unwrap(data: unknown): unknown {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const arrayProps = Object.values(data as Record<string, unknown>).filter((v) =>
        Array.isArray(v)
      );
      if (arrayProps.length === 1) {
        return arrayProps[0];
      }
    }
    return data;
  }

  /** Map an HTTP status + envelope to the appropriate typed error. */
  private buildError(
    status: number,
    envelope: ApiEnvelope | undefined,
    rawText: string
  ): InforcerError {
    const apiMessage = envelope?.message?.trim();
    const errorCode = (envelope?.errorCode ?? '').toString().toLowerCase();
    const extra =
      envelope?.errors && envelope.errors.length > 0
        ? ` ${envelope.errors.join('; ')}`
        : '';
    const baseMessage = this.redact((apiMessage || rawText || `HTTP ${status}`).slice(0, 500));
    const message = `${baseMessage}${this.redact(extra)}`.trim();

    // errorCode-driven mapping first (works for both HTTP 200 success:false and error bodies).
    if (errorCode === 'forbidden') {
      return new ForbiddenError(message || "You don't have permission to access this tenant or resource.", envelope, errorCode);
    }
    if (errorCode === 'notfound' || errorCode === 'not_found') {
      return new NotFoundError(message || 'Tenant or resource not found.', envelope, errorCode);
    }

    if (status === 401) {
      return new AuthenticationError(message || 'Your credentials are invalid. Please verify your API key.', envelope, errorCode);
    }
    if (status === 429 || QUOTA_PATTERN.test(apiMessage ?? '') || QUOTA_PATTERN.test(rawText)) {
      return new RateLimitError(message || 'API rate limit exceeded. Please wait and try again.', envelope, errorCode);
    }
    if (status === 403) {
      return new ForbiddenError(message || "You don't have permission to access this tenant or resource.", envelope, errorCode);
    }
    if (status === 404) {
      return new NotFoundError(message || 'Tenant or resource not found.', envelope, errorCode);
    }
    if (status >= 500) {
      return new ServerError(message || 'Internal server error', status, envelope, errorCode);
    }

    return new InforcerError(message || `Inforcer API request failed (HTTP ${status})`, status, envelope, errorCode);
  }
}
