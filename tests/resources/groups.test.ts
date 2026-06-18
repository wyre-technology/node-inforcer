import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GroupsResource } from '../../src/resources/groups.js';
import { HttpClient } from '../../src/http.js';
import { mockResponse, envelope } from '../helpers.js';

describe('GroupsResource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let resource: GroupsResource;

  beforeEach(() => {
    mockFetch = vi.fn();
    const client = new HttpClient({
      baseUrl: 'https://api-uk.inforcer.com/api',
      apiKey: 'key',
      timeout: 5000,
      maxRetries: 0,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    resource = new GroupsResource(async () => client);
  });

  it('lists groups via GET /beta/tenants/{id}/groups and preserves continuationToken + totalCount', async () => {
    const groups = [{ id: 'g1', displayName: 'Finance', groupTypes: ['Unified'] }];
    mockFetch.mockResolvedValueOnce(
      mockResponse(envelope(groups, { continuationToken: 'g-next', totalCount: 9 }))
    );

    const result = await resource.listByTenant(139);

    expect(result.data).toEqual(groups);
    expect(result.continuationToken).toBe('g-next');
    expect(result.totalCount).toBe(9);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api-uk.inforcer.com/api/beta/tenants/139/groups',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('passes search and continuationToken as query params', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(envelope([])));

    await resource.listByTenant(139, { search: 'Finance', continuationToken: 'tok2' });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('search=Finance');
    expect(url).toContain('continuationToken=tok2');
  });

  it('gets a single group via GET /beta/tenants/{id}/groups/{groupId}', async () => {
    const group = { id: 'f44f2f5c-3160-420b-900d-5ecbede954fc', displayName: 'Tailspin', groupTypes: [] };
    mockFetch.mockResolvedValueOnce(mockResponse(envelope(group)));

    const result = await resource.get(139, 'f44f2f5c-3160-420b-900d-5ecbede954fc');

    expect(result).toEqual(group);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api-uk.inforcer.com/api/beta/tenants/139/groups/f44f2f5c-3160-420b-900d-5ecbede954fc',
      expect.objectContaining({ method: 'GET' })
    );
  });
});
