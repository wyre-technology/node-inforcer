import { vi } from 'vitest';

// Mock fetch globally (per-test suites install their own vi.fn() and pass it
// explicitly via fetchImpl, but this guards any code path that falls back to
// the global).
globalThis.fetch = vi.fn();
