import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SecureScoresResource } from '../../src/resources/secure-scores.js';
import { HttpClient } from '../../src/http.js';
import { mockResponse, envelope } from '../helpers.js';

describe('SecureScoresResource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let resource: SecureScoresResource;

  beforeEach(() => {
    mockFetch = vi.fn();
    const client = new HttpClient({
      baseUrl: 'https://api-uk.inforcer.com/api',
      apiKey: 'key',
      timeout: 5000,
      maxRetries: 0,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    resource = new SecureScoresResource(async () => client);
  });

  it('gets secure scores via GET /beta/tenants/{id}/secureScores', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(envelope({ currentScore: 70, maxScore: 100 })));

    const result = await resource.getByTenant(139);

    expect(result).toEqual({ currentScore: 70, maxScore: 100 });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api-uk.inforcer.com/api/beta/tenants/139/secureScores',
      expect.objectContaining({ method: 'GET' })
    );
  });
});
