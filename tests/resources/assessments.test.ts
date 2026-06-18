import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AssessmentsResource } from '../../src/resources/assessments.js';
import { HttpClient } from '../../src/http.js';
import { mockResponse, envelope } from '../helpers.js';

describe('AssessmentsResource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let resource: AssessmentsResource;

  beforeEach(() => {
    mockFetch = vi.fn();
    const client = new HttpClient({
      baseUrl: 'https://api-uk.inforcer.com/api',
      apiKey: 'key',
      timeout: 5000,
      maxRetries: 0,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    resource = new AssessmentsResource(async () => client);
  });

  it('lists assessments via GET /beta/assessments', async () => {
    const assessments = [{ id: 'a1', name: 'Copilot Readiness' }];
    mockFetch.mockResolvedValueOnce(mockResponse(envelope(assessments)));

    const result = await resource.list();

    expect(result).toEqual(assessments);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api-uk.inforcer.com/api/beta/assessments',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('runs an assessment via POST /beta/tenants/{id}/assessments/{assessmentId}/runs', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(envelope({ results: [] })));

    const result = await resource.run(144, 'a1');

    expect(result).toEqual({ results: [] });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api-uk.inforcer.com/api/beta/tenants/144/assessments/a1/runs',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
