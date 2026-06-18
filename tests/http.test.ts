import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpClient } from '../src/http.js';
import {
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ServerError,
} from '../src/errors.js';
import { mockResponse, envelope } from './helpers.js';

const API_KEY = 'super-secret-key';

function makeClient(mockFetch: ReturnType<typeof vi.fn>, maxRetries = 0): HttpClient {
  return new HttpClient({
    baseUrl: 'https://api-uk.inforcer.com/api',
    apiKey: API_KEY,
    timeout: 5000,
    maxRetries,
    fetchImpl: mockFetch as unknown as typeof fetch,
  });
}

describe('HttpClient', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
  });

  it('sends the Inf-Api-Key and Accept headers', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(envelope({ ok: true })));
    const client = makeClient(mockFetch);

    await client.request('/beta/tenants');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api-uk.inforcer.com/api/beta/tenants',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Inf-Api-Key': API_KEY,
          Accept: 'application/json',
        }),
      })
    );
  });

  it('unwraps the success envelope (.data)', async () => {
    const data = [{ clientTenantId: 1 }, { clientTenantId: 2 }];
    mockFetch.mockResolvedValueOnce(mockResponse(envelope(data)));
    const client = makeClient(mockFetch);

    const result = await client.request('/beta/tenants');
    expect(result).toEqual(data);
  });

  it('collapses a single-array wrapper object in the default path', async () => {
    // data is an object whose only array property holds the payload.
    mockFetch.mockResolvedValueOnce(
      mockResponse(envelope({ value: [{ id: 'a' }, { id: 'b' }] }))
    );
    const client = makeClient(mockFetch);

    const result = await client.request('/beta/something');
    expect(result).toEqual([{ id: 'a' }, { id: 'b' }]);
  });

  it('preserveFullResponse returns the whole envelope (root-level pagination)', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(envelope([{ id: 'u1' }], { continuationToken: 'tok', totalCount: 42 }))
    );
    const client = makeClient(mockFetch);

    const result = await client.request<Record<string, unknown>>('/beta/tenants/1/users', {
      preserveFullResponse: true,
    });
    expect(result.data).toEqual([{ id: 'u1' }]);
    expect(result.continuationToken).toBe('tok');
    expect(result.totalCount).toBe(42);
  });

  it('preserveStructure unwraps .data but keeps inner structure', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(envelope({ items: [{ id: 'e1' }], continuationToken: 'next' }))
    );
    const client = makeClient(mockFetch);

    const result = await client.request<Record<string, unknown>>('/beta/auditEvents/search', {
      method: 'POST',
      body: {},
      preserveStructure: true,
    });
    expect(result.items).toEqual([{ id: 'e1' }]);
    expect(result.continuationToken).toBe('next');
  });

  it('serializes a JSON body for POST', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(envelope({ items: [] })));
    const client = makeClient(mockFetch);

    await client.request('/beta/auditEvents/search', {
      method: 'POST',
      body: { eventTypes: ['authentication'], pageSize: 50 },
      preserveStructure: true,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api-uk.inforcer.com/api/beta/auditEvents/search',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ eventTypes: ['authentication'], pageSize: 50 }),
      })
    );
  });

  it('appends query params, including arrays', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(envelope([])));
    const client = makeClient(mockFetch);

    await client.request('/beta/tenants/1/users', {
      params: { search: 'Adele', continuationToken: 'tok123' },
    });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('search=Adele');
    expect(calledUrl).toContain('continuationToken=tok123');
  });

  it('throws on a success:false envelope (HTTP 200)', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ success: false, message: 'Something went wrong', errors: ['boom'] })
    );
    const client = makeClient(mockFetch);

    await expect(client.request('/beta/tenants')).rejects.toThrow('Something went wrong');
  });

  it('maps errorCode forbidden to ForbiddenError', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(
        { success: false, message: 'no access', errorCode: 'forbidden' },
        { ok: false, status: 403 }
      )
    );
    const client = makeClient(mockFetch);

    await expect(client.request('/beta/tenants')).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('maps errorCode notfound to NotFoundError (HTTP 200 success:false)', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ success: false, message: 'missing', errorCode: 'notfound' })
    );
    const client = makeClient(mockFetch);

    await expect(client.request('/beta/tenants')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('maps HTTP 401 to AuthenticationError', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(
        { success: false, message: 'Your credentials are invalid' },
        { ok: false, status: 401 }
      )
    );
    const client = makeClient(mockFetch);

    await expect(client.request('/beta/tenants')).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('maps HTTP 403 to ForbiddenError', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ success: false, message: 'forbidden' }, { ok: false, status: 403 })
    );
    const client = makeClient(mockFetch);

    await expect(client.request('/beta/tenants')).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('maps HTTP 404 to NotFoundError', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ success: false, message: 'not found' }, { ok: false, status: 404 })
    );
    const client = makeClient(mockFetch);

    await expect(client.request('/beta/tenants')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('maps HTTP 429 to RateLimitError', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ success: false, message: 'too many requests' }, { ok: false, status: 429 })
    );
    const client = makeClient(mockFetch);

    await expect(client.request('/beta/tenants')).rejects.toBeInstanceOf(RateLimitError);
  });

  it('maps a quota message to RateLimitError even on 403', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(
        { success: false, message: 'API quota exceeded for this key' },
        { ok: false, status: 403 }
      )
    );
    const client = makeClient(mockFetch);

    await expect(client.request('/beta/tenants')).rejects.toBeInstanceOf(RateLimitError);
  });

  it('maps HTTP 500 to ServerError', async () => {
    mockFetch.mockResolvedValue(
      mockResponse({ success: false, message: 'Internal server error' }, { ok: false, status: 500 })
    );
    const client = makeClient(mockFetch);

    await expect(client.request('/beta/tenants')).rejects.toBeInstanceOf(ServerError);
  });

  it('redacts the API key from error messages', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(
        { success: false, message: `bad key ${API_KEY} rejected` },
        { ok: false, status: 401 }
      )
    );
    const client = makeClient(mockFetch);

    await expect(client.request('/beta/tenants')).rejects.toThrow(/\[REDACTED\]/);
    await expect(client.request('/beta/tenants')).rejects.not.toThrow(
      new RegExp(API_KEY)
    );
  });

  it('retries transient 5xx errors then succeeds', async () => {
    mockFetch
      .mockResolvedValueOnce(
        mockResponse({ success: false, message: 'oops' }, { ok: false, status: 500 })
      )
      .mockResolvedValueOnce(mockResponse(envelope([{ clientTenantId: 1 }])));
    const client = makeClient(mockFetch, 2);

    const result = await client.request('/beta/tenants');
    expect(result).toEqual([{ clientTenantId: 1 }]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
