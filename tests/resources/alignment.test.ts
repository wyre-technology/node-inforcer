import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AlignmentResource } from '../../src/resources/alignment.js';
import { HttpClient } from '../../src/http.js';
import { mockResponse, envelope } from '../helpers.js';

describe('AlignmentResource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let resource: AlignmentResource;

  beforeEach(() => {
    mockFetch = vi.fn();
    const client = new HttpClient({
      baseUrl: 'https://api-uk.inforcer.com/api',
      apiKey: 'key',
      timeout: 5000,
      maxRetries: 0,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    resource = new AlignmentResource(async () => client);
  });

  it('lists alignment scores via GET /beta/alignmentScores', async () => {
    const scores = [{ tenantId: 1, score: 80 }];
    mockFetch.mockResolvedValueOnce(mockResponse(envelope(scores)));

    const result = await resource.listScores();

    expect(result).toEqual(scores);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api-uk.inforcer.com/api/beta/alignmentScores',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('gets alignment details for a numeric tenant id', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(envelope({ summary: 'ok' })));

    const result = await resource.getDetails(139);

    expect(result).toEqual({ summary: 'ok' });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api-uk.inforcer.com/api/beta/tenants/139/alignmentDetails',
      expect.objectContaining({ method: 'GET' })
    );
  });
});
