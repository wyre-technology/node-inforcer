import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TenantsResource } from '../../src/resources/tenants.js';
import { HttpClient } from '../../src/http.js';
import { NotFoundError } from '../../src/errors.js';
import { mockResponse, envelope } from '../helpers.js';

const TENANTS = [
  { clientTenantId: 1, tenantFriendlyName: 'Alpha', tenantDnsName: 'alpha.onmicrosoft.com' },
  { clientTenantId: 2, tenantFriendlyName: 'Beta', tenantDnsName: 'beta.onmicrosoft.com' },
];

describe('TenantsResource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let resource: TenantsResource;

  beforeEach(() => {
    mockFetch = vi.fn();
    const client = new HttpClient({
      baseUrl: 'https://api-uk.inforcer.com/api',
      apiKey: 'key',
      timeout: 5000,
      maxRetries: 0,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    resource = new TenantsResource(async () => client);
  });

  it('lists tenants via GET /beta/tenants', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(envelope(TENANTS)));

    const result = await resource.list();

    expect(result).toEqual(TENANTS);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api-uk.inforcer.com/api/beta/tenants',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('gets a tenant by friendly name (client-side filter)', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(envelope(TENANTS)));

    const result = await resource.get('Beta');

    expect(result).toMatchObject({ clientTenantId: 2, tenantFriendlyName: 'Beta' });
  });

  it('throws NotFoundError for an unknown tenant', async () => {
    mockFetch.mockResolvedValue(mockResponse(envelope(TENANTS)));

    await expect(resource.get('Nope')).rejects.toThrow();
  });

  it('throws NotFoundError when the resolved id has no matching tenant object', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(envelope(TENANTS)));

    await expect(resource.get(9999)).rejects.toBeInstanceOf(NotFoundError);
  });
});
