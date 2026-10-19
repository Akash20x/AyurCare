import { afterEach, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();

  if (typeof window !== 'undefined') {
    window.sessionStorage.clear();
    window.localStorage.clear();
  }
});
