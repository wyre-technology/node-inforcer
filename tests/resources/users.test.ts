import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UsersResource } from '../../src/resources/users.js';
import { HttpClient } from '../../src/http.js';
import { mockResponse, envelope } from '../helpers.js';

describe('UsersResource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let resource: UsersResource;

  beforeEach(() => {
    mockFetch = vi.fn();
    const client = new HttpClient({
      baseUrl: 'https://api-uk.inforcer.com/api',
      apiKey: 'key',
      timeout: 5000,
      maxRetries: 0,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    resource = new UsersResource(async () => client);
  });

  it('lists users via GET /beta/tenants/{id}/users and preserves continuationToken + totalCount', async () => {
    const users = [{ id: 'u1', displayName: 'Adele' }];
    mockFetch.mockResolvedValueOnce(
      mockResponse(envelope(users, { continuationToken: 'next-page', totalCount: 137 }))
    );

    const result = await resource.listByTenant(139);

    expect(result.data).toEqual(users);
    expect(result.continuationToken).toBe('next-page');
    expect(result.totalCount).toBe(137);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api-uk.inforcer.com/api/beta/tenants/139/users',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('passes search and continuationToken as query params', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(envelope([])));

    await resource.listByTenant(139, { search: 'Adele', continuationToken: 'tok' });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('search=Adele');
    expect(url).toContain('continuationToken=tok');
  });

  it('gets a single user via GET /beta/tenants/{id}/users/{userId}', async () => {
    const user = { id: '8e61ce11-a45b-42a6-8ca4-1d881781566d', displayName: 'Adele Vance' };
    mockFetch.mockResolvedValueOnce(mockResponse(envelope(user)));

    const result = await resource.get(139, '8e61ce11-a45b-42a6-8ca4-1d881781566d');

    expect(result).toEqual(user);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api-uk.inforcer.com/api/beta/tenants/139/users/8e61ce11-a45b-42a6-8ca4-1d881781566d',
      expect.objectContaining({ method: 'GET' })
    );
  });
});
