import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RolesResource } from '../../src/resources/roles.js';
import { HttpClient } from '../../src/http.js';
import { mockResponse, envelope } from '../helpers.js';

describe('RolesResource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let resource: RolesResource;

  beforeEach(() => {
    mockFetch = vi.fn();
    const client = new HttpClient({
      baseUrl: 'https://api-uk.inforcer.com/api',
      apiKey: 'key',
      timeout: 5000,
      maxRetries: 0,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    resource = new RolesResource(async () => client);
  });

  it('lists roles via GET /beta/tenants/{id}/roles', async () => {
    const roles = [{ id: 'r1', displayName: 'Global Administrator', isPrivileged: true }];
    mockFetch.mockResolvedValueOnce(mockResponse(envelope(roles)));

    const result = await resource.listByTenant(139);

    expect(result).toEqual(roles);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api-uk.inforcer.com/api/beta/tenants/139/roles',
      expect.objectContaining({ method: 'GET' })
    );
  });
});
