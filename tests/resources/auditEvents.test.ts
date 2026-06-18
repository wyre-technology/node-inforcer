import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditEventsResource } from '../../src/resources/auditEvents.js';
import { HttpClient } from '../../src/http.js';
import { mockResponse, envelope } from '../helpers.js';

describe('AuditEventsResource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let resource: AuditEventsResource;

  beforeEach(() => {
    mockFetch = vi.fn();
    const client = new HttpClient({
      baseUrl: 'https://api-uk.inforcer.com/api',
      apiKey: 'key',
      timeout: 5000,
      maxRetries: 0,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    resource = new AuditEventsResource(async () => client);
  });

  it('lists event types via GET /beta/auditEvents/eventTypes', async () => {
    const types = [{ name: 'authentication' }, { name: 'failedAuthentication' }];
    mockFetch.mockResolvedValueOnce(mockResponse(envelope(types)));

    const result = await resource.listEventTypes();

    expect(result).toEqual(types);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api-uk.inforcer.com/api/beta/auditEvents/eventTypes',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('searches via POST /beta/auditEvents/search with a JSON body and preserves continuationToken', async () => {
    const events = [{ id: 'e1', eventType: 'authentication' }];
    mockFetch.mockResolvedValueOnce(
      mockResponse(envelope({ items: events, continuationToken: 'audit-next' }))
    );

    const result = await resource.search({
      eventTypes: ['authentication'],
      dateFrom: '2026-02-01T00:00:00Z',
      dateTo: '2026-02-26T23:59:59Z',
      pageSize: 50,
    });

    expect(result.items).toEqual(events);
    expect(result.continuationToken).toBe('audit-next');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api-uk.inforcer.com/api/beta/auditEvents/search',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          eventTypes: ['authentication'],
          dateFrom: '2026-02-01T00:00:00Z',
          dateTo: '2026-02-26T23:59:59Z',
          pageSize: 50,
        }),
      })
    );
  });

  it('includes continuationToken in the request body when provided', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(envelope({ items: [] })));

    await resource.search({ continuationToken: 'resume-token' });

    const init = mockFetch.mock.calls[0][1] as { body: string };
    expect(JSON.parse(init.body)).toMatchObject({ continuationToken: 'resume-token' });
  });
});
