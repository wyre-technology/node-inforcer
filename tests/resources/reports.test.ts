import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReportsResource } from '../../src/resources/reports.js';
import { HttpClient } from '../../src/http.js';
import { mockResponse, mockBinaryResponse, envelope } from '../helpers.js';

describe('ReportsResource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let resource: ReportsResource;

  beforeEach(() => {
    mockFetch = vi.fn();
    const client = new HttpClient({
      baseUrl: 'https://api-uk.inforcer.com/api',
      apiKey: 'key',
      timeout: 5000,
      maxRetries: 0,
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    resource = new ReportsResource(async () => client);
  });

  it('lists the report type catalog via GET /beta/reports/types', async () => {
    const types = [{ key: 'CopilotAdoption', supportedOutputFormats: ['csv', 'pdf'] }];
    mockFetch.mockResolvedValueOnce(mockResponse(envelope(types)));

    const result = await resource.types();

    expect(result).toEqual(types);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api-uk.inforcer.com/api/beta/reports/types',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('lists report runs via GET /beta/reports/runs', async () => {
    const runs = [{ runId: 'r1', status: 'completed' }];
    mockFetch.mockResolvedValueOnce(mockResponse(envelope(runs)));

    const result = await resource.listRuns();

    expect(result).toEqual(runs);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api-uk.inforcer.com/api/beta/reports/runs',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('queues a run via POST /beta/reports/runs, resolving numeric tenant IDs as-is', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(envelope({ runId: 'r1' })));

    const result = await resource.run(
      [{ type: 'CopilotAdoption', outputFormat: 'csv' }],
      [482, 139]
    );

    expect(result).toEqual({ runId: 'r1' });
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api-uk.inforcer.com/api/beta/reports/runs');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({
      reports: [{ type: 'CopilotAdoption', outputFormat: 'csv' }],
      tenants: { includeTenants: [482, 139] },
    });
  });

  it('outputs() reports isTerminal:true with the output list on 200', async () => {
    const outputs = [{ id: 'o1' }];
    mockFetch.mockResolvedValueOnce(mockResponse(envelope(outputs)));

    const result = await resource.outputs('run-1');

    expect(result).toEqual({ isTerminal: true, outputs });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api-uk.inforcer.com/api/beta/reports/runs/run-1/outputs',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('outputs() reports isTerminal:false with no outputs on 404', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(envelope(null, { success: false, errorCode: 'notFound' }), { status: 404 })
    );

    const result = await resource.outputs('run-1');

    expect(result).toEqual({ isTerminal: false, outputs: [] });
  });

  it('downloadOutput() returns raw bytes, content type, and filename', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    mockFetch.mockResolvedValueOnce(
      mockBinaryResponse(bytes, {
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': 'attachment; filename="report.pdf"',
        },
      })
    );

    const result = await resource.downloadOutput('run-1', 'output-1');

    expect(new Uint8Array(result.data)).toEqual(bytes);
    expect(result.contentType).toBe('application/pdf');
    expect(result.fileName).toBe('report.pdf');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api-uk.inforcer.com/api/beta/reports/runs/run-1/outputs/output-1',
      expect.objectContaining({ method: 'GET' })
    );
  });
});
