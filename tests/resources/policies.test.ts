import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PoliciesResource } from '../../src/resources/policies.js';
import { HttpClient } from '../../src/http.js';
import { mockResponse, envelope } from '../helpers.js';

describe('PoliciesResource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let resource: PoliciesResource;

  beforeEach(() => {
    mockFetch = vi.fn();
    const client = new HttpClient({
      baseUrl: 'https://api-uk.inforcer.com/api',
      apiKey: 'key',
      timeout: 5000,
      maxRetries: 0,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    resource = new PoliciesResource(async () => client);
  });

  it('lists policies via GET /beta/tenants/{id}/policies', async () => {
    const policies = [{ id: 'p1', name: 'Policy 1', displayName: 'Policy One' }];
    mockFetch.mockResolvedValueOnce(mockResponse(envelope(policies)));

    const result = await resource.listByTenant(139);

    expect(result).toEqual(policies);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api-uk.inforcer.com/api/beta/tenants/139/policies',
      expect.objectContaining({ method: 'GET' })
    );
  });
});
