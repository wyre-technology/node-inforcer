import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpClient } from '../src/http.js';
import { resolveTenantId } from '../src/tenant-resolver.js';
import { InforcerError } from '../src/errors.js';
import { mockResponse, envelope } from './helpers.js';

const TENANTS = [
  {
    clientTenantId: 139,
    tenantFriendlyName: 'Contoso',
    tenantDnsName: 'contoso.onmicrosoft.com',
    msTenantId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  },
  {
    clientTenantId: 144,
    tenantFriendlyName: 'Fabrikam',
    tenantDnsName: 'fabrikam.onmicrosoft.com',
    msTenantId: '11111111-2222-3333-4444-555555555555',
  },
  {
    clientTenantId: 200,
    tenantFriendlyName: 'Duplicate',
    tenantDnsName: 'dup-a.onmicrosoft.com',
    msTenantId: '99999999-9999-9999-9999-999999999999',
  },
  {
    clientTenantId: 201,
    tenantFriendlyName: 'Duplicate',
    tenantDnsName: 'dup-b.onmicrosoft.com',
    msTenantId: '88888888-8888-8888-8888-888888888888',
  },
];

describe('resolveTenantId', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: HttpClient;

  beforeEach(() => {
    mockFetch = vi.fn();
    client = new HttpClient({
      baseUrl: 'https://api-uk.inforcer.com/api',
      apiKey: 'key',
      timeout: 5000,
      maxRetries: 0,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
  });

  it('passes through a numeric Client Tenant ID without hitting the API', async () => {
    const result = await resolveTenantId(client, 139);
    expect(result).toBe(139);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('passes through an integer string', async () => {
    const result = await resolveTenantId(client, '144');
    expect(result).toBe(144);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('matches a GUID against msTenantId', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(envelope(TENANTS)));
    const result = await resolveTenantId(client, '11111111-2222-3333-4444-555555555555');
    expect(result).toBe(144);
  });

  it('matches a DNS name', async () => {
    const result = await resolveTenantId(client, 'contoso.onmicrosoft.com', TENANTS);
    expect(result).toBe(139);
  });

  it('matches a friendly name (case-insensitive)', async () => {
    const result = await resolveTenantId(client, 'fabrikam', TENANTS);
    expect(result).toBe(144);
  });

  it('throws when no tenant matches a GUID', async () => {
    await expect(
      resolveTenantId(client, '00000000-0000-0000-0000-000000000000', TENANTS)
    ).rejects.toThrow(InforcerError);
  });

  it('throws when no tenant matches a name', async () => {
    await expect(resolveTenantId(client, 'Nonexistent', TENANTS)).rejects.toThrow(
      /No tenant found with name/
    );
  });

  it('throws on an ambiguous name match', async () => {
    await expect(resolveTenantId(client, 'Duplicate', TENANTS)).rejects.toThrow(
      /Multiple tenants match/
    );
  });
});
