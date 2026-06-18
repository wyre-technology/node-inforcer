import { describe, it, expect } from 'vitest';
import { resolveBaseUrl, REGION_BASE_URLS } from '../src/region.js';
import { InforcerError } from '../src/errors.js';
import type { InforcerRegion } from '../src/types/common.js';

describe('resolveBaseUrl', () => {
  it('maps each region to its production base URL', () => {
    expect(resolveBaseUrl('anz')).toBe('https://api-anz.inforcer.com/api');
    expect(resolveBaseUrl('eu')).toBe('https://api-eu.inforcer.com/api');
    expect(resolveBaseUrl('uk')).toBe('https://api-uk.inforcer.com/api');
    expect(resolveBaseUrl('us')).toBe('https://api-us.inforcer.com/api');
  });

  it('exposes the region map', () => {
    expect(REGION_BASE_URLS).toEqual({
      anz: 'https://api-anz.inforcer.com/api',
      eu: 'https://api-eu.inforcer.com/api',
      uk: 'https://api-uk.inforcer.com/api',
      us: 'https://api-us.inforcer.com/api',
    });
  });

  it('uses an explicit baseUrl override', () => {
    expect(resolveBaseUrl('uk', 'https://api.example.com/api')).toBe(
      'https://api.example.com/api'
    );
  });

  it('trims a trailing slash from the baseUrl override', () => {
    expect(resolveBaseUrl('uk', 'https://api.example.com/api/')).toBe(
      'https://api.example.com/api'
    );
    expect(resolveBaseUrl('uk', 'https://api.example.com/api///')).toBe(
      'https://api.example.com/api'
    );
  });

  it('prefers the baseUrl override over the region', () => {
    expect(resolveBaseUrl('us', 'https://override.example.com')).toBe(
      'https://override.example.com'
    );
  });

  it('throws InforcerError for an invalid region', () => {
    expect(() => resolveBaseUrl('mars' as InforcerRegion)).toThrow(InforcerError);
    expect(() => resolveBaseUrl('mars' as InforcerRegion)).toThrow(/Invalid region/);
  });
});
