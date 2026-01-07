import { describe, it, expect, vi } from 'vitest';

describe('API Config', () => {
  it('should export API_URL', async () => {
    const { API_URL } = await import('../api');
    expect(API_URL).toBeDefined();
    expect(typeof API_URL).toBe('string');
  });

  it('should export SOCKET_URL', async () => {
    const { SOCKET_URL } = await import('../api');
    expect(SOCKET_URL).toBeDefined();
    expect(typeof SOCKET_URL).toBe('string');
  });

  it('should have default values when env vars are not set', async () => {
    // Reset modules to test defaults
    vi.resetModules();
    const { API_URL, SOCKET_URL } = await import('../api');
    expect(API_URL).toContain('localhost');
    expect(SOCKET_URL).toContain('localhost');
  });
});

