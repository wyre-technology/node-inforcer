import type { InforcerRegion } from './types/common.js';
import { InforcerError } from './errors.js';

/**
 * Region → production API base URL. Mirrors the community module's
 * `Get-InforcerBaseUrl`. Every base URL ends in `/api`.
 */
const REGION_BASE_URLS: Record<InforcerRegion, string> = {
  anz: 'https://api-anz.inforcer.com/api',
  eu: 'https://api-eu.inforcer.com/api',
  uk: 'https://api-uk.inforcer.com/api',
  us: 'https://api-us.inforcer.com/api',
};

/**
 * Resolve the API base URL for a region, or use an explicit `baseUrl` override
 * (trimmed of any trailing slash). Region is required when no override is given.
 *
 * @throws {InforcerError} when the region is not one of anz, eu, uk, us.
 */
export function resolveBaseUrl(region: InforcerRegion, baseUrl?: string): string {
  if (baseUrl && baseUrl.trim()) {
    return baseUrl.trim().replace(/\/+$/, '');
  }

  const resolved = REGION_BASE_URLS[region];
  if (!resolved) {
    throw new InforcerError(
      `Invalid region: ${region}. Valid regions are: anz, eu, uk, us.`
    );
  }
  return resolved;
}

export { REGION_BASE_URLS };
