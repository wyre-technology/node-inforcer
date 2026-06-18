import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InforcerClient } from '../src/client.js';
import type { InforcerRegion } from '../src/types/common.js';
import { mockResponse, envelope } from './helpers.js';

describe('InforcerClient', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
  });

  it('exposes all resource getters and the tenant resolver', () => {
    const client = new InforcerClient({
      region: 'uk',
      apiKey: 'key',
      fetchImpl: mockFetch as unknown as typeof fetch,
    });

    expect(client.tenants).toBeDefined();
    expect(client.baselines).toBeDefined();
    expect(client.alignment).toBeDefined();
    expect(client.policies).toBeDefined();
    expect(client.secureScores).toBeDefined();
    expect(client.users).toBeDefined();
    expect(client.groups).toBeDefined();
    expect(client.roles).toBeDefined();
    expect(client.auditEvents).toBeDefined();
    expect(client.assessments).toBeDefined();
    expect(typeof client.resolveTenantId).toBe('function');
  });

  it('throws when neither region nor baseUrl is provided', () => {
    expect(
      () =>
        new InforcerClient({
          apiKey: 'key',
          fetchImpl: mockFetch as unknown as typeof fetch,
        } as unknown as { region: InforcerRegion; apiKey: string })
    ).toThrow(/region/);
  });

  it('throws when apiKey is missing', () => {
    expect(
      () =>
        new InforcerClient({
          region: 'uk',
          fetchImpl: mockFetch as unknown as typeof fetch,
        } as unknown as { region: InforcerRegion; apiKey: string })
    ).toThrow(/apiKey/);
  });

  const regionCases: Array<[InforcerRegion, string]> = [
    ['anz', 'https://api-anz.inforcer.com/api/beta/tenants'],
    ['eu', 'https://api-eu.inforcer.com/api/beta/tenants'],
    ['uk', 'https://api-uk.inforcer.com/api/beta/tenants'],
    ['us', 'https://api-us.inforcer.com/api/beta/tenants'],
  ];

  it.each(regionCases)('builds the base URL for region %s', async (region, expectedUrl) => {
    const client = new InforcerClient({
      region,
      apiKey: 'key',
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    mockFetch.mockResolvedValueOnce(mockResponse(envelope([])));

    await client.tenants.list();

    expect(mockFetch).toHaveBeenCalledWith(expectedUrl, expect.any(Object));
  });

  it('uses an explicit baseUrl override (trailing slash trimmed)', async () => {
    const client = new InforcerClient({
      region: 'uk',
      apiKey: 'key',
      baseUrl: 'https://custom.example.com/api/',
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    mockFetch.mockResolvedValueOnce(mockResponse(envelope([])));

    await client.tenants.list();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://custom.example.com/api/beta/tenants',
      expect.any(Object)
    );
  });

  it('sends the Inf-Api-Key header on requests', async () => {
    const client = new InforcerClient({
      region: 'eu',
      apiKey: 'my-api-key',
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    mockFetch.mockResolvedValueOnce(mockResponse(envelope([])));

    await client.tenants.list();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Inf-Api-Key': 'my-api-key',
          Accept: 'application/json',
        }),
      })
    );
  });

  it('reuses a single lazy HTTP client across requests', async () => {
    const client = new InforcerClient({
      region: 'uk',
      apiKey: 'key',
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    mockFetch.mockResolvedValue(mockResponse(envelope([])));

    await client.tenants.list();
    await client.tenants.list();

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
