import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaselinesResource } from '../../src/resources/baselines.js';
import { HttpClient } from '../../src/http.js';
import { mockResponse, envelope } from '../helpers.js';

describe('BaselinesResource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let resource: BaselinesResource;

  beforeEach(() => {
    mockFetch = vi.fn();
    const client = new HttpClient({
      baseUrl: 'https://api-uk.inforcer.com/api',
      apiKey: 'key',
      timeout: 5000,
      maxRetries: 0,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    resource = new BaselinesResource(async () => client);
  });

  it('lists baselines via GET /beta/baselines', async () => {
    const baselines = [{ id: 'b1', name: 'Standard', baselineClientTenantId: 5 }];
    mockFetch.mockResolvedValueOnce(mockResponse(envelope(baselines)));

    const result = await resource.list();

    expect(result).toEqual(baselines);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api-uk.inforcer.com/api/beta/baselines',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('passes baselineTenantId as a query param', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(envelope([])));

    await resource.list({ baselineTenantId: 42 });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api-uk.inforcer.com/api/beta/baselines?baselineTenantId=42',
      expect.any(Object)
    );
  });
});
