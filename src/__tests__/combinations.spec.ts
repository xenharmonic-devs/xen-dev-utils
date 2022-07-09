import {describe, it, expect} from 'vitest';
import {combinations, kCombinations} from '../combinations';

describe('K-combinations generator', () => {
  it('produces all subsets of size 3 of the set {a, b, c, d}', () => {
    const result = kCombinations(['a', 'b', 'c', 'd'], 3);
    expect(result.map(subset => subset.join('')).join(',')).toBe(
      'abc,abd,acd,bcd'
    );
  });
});

describe('Combinations generator', () => {
  it('produces all subsets of the set {a, b, c}', () => {
    const result = combinations(['a', 'b', 'c']);
    expect(result.map(subset => subset.join('')).join(',')).toBe(
      'a,b,c,ab,ac,bc,abc'
    );
  });
});
