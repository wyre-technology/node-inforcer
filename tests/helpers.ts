/**
 * Build a minimal mock `Response` for `vi.fn()` fetch mocks. The SDK's
 * {@link HttpClient} reads the body via `response.text()`, so we serialize the
 * body to a string here.
 */
export function mockResponse(
  body: unknown,
  init: { ok?: boolean; status?: number } = {}
): { ok: boolean; status: number; text: () => Promise<string> } {
  const status = init.status ?? 200;
  const ok = init.ok ?? (status >= 200 && status < 300);
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return {
    ok,
    status,
    text: async () => text,
  };
}

/**
 * Build a minimal mock binary `Response` for {@link HttpClient.requestBinary}
 * fetch mocks — reads via `response.arrayBuffer()` and `response.headers`.
 */
export function mockBinaryResponse(
  bytes: Uint8Array,
  init: { ok?: boolean; status?: number; headers?: Record<string, string> } = {}
): {
  ok: boolean;
  status: number;
  headers: Headers;
  text: () => Promise<string>;
  arrayBuffer: () => Promise<ArrayBuffer>;
} {
  const status = init.status ?? 200;
  const ok = init.ok ?? (status >= 200 && status < 300);
  return {
    ok,
    status,
    headers: new Headers(init.headers ?? {}),
    text: async () => new TextDecoder().decode(bytes),
    arrayBuffer: async () => bytes.buffer as ArrayBuffer,
  };
}

/** Wrap a payload in the standard Inforcer success envelope. */
export function envelope<T>(data: T, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { success: true, message: '', errors: [], data, ...extra };
}
