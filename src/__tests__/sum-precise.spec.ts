import {describe, expect, it, vi} from 'vitest';

describe('sum polyfill wrapper', () => {
  it('uses Math.sumPrecise when available in the runtime', async () => {
    vi.resetModules();

    const hasOwnSumPrecise = Object.hasOwn(Math, 'sumPrecise');
    const original = (Math as Partial<Math & {sumPrecise: (values: Iterable<number>) => number}>).sumPrecise;
    const intrinsic = vi.fn((values: Iterable<number>) =>
      Array.from(values).reduce((acc, value) => acc + value, 0),
    );
    (Math as Partial<Math & {sumPrecise: (values: Iterable<number>) => number}>).sumPrecise = intrinsic;

    try {
      const module = await import('../polyfills/sum-precise.js');
      expect(module.sum([1, 2, 3])).toBe(6);
      expect(intrinsic).toHaveBeenCalledOnce();
      expect(intrinsic).toHaveBeenCalledWith([1, 2, 3]);
    } finally {
      if (hasOwnSumPrecise) {
        (Math as Partial<Math & {sumPrecise: (values: Iterable<number>) => number}>).sumPrecise = original;
      } else {
        delete (Math as Partial<Math & {sumPrecise: (values: Iterable<number>) => number}>).sumPrecise;
      }
    }
  });
});
