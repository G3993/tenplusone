import { describe, it, expect } from 'vitest';

describe('API structure', () => {
  it('exports default with fetch handler', async () => {
    const mod = await import('./index');
    expect(mod.default).toBeDefined();
    expect(mod.default.fetch).toBeDefined();
  });
});
