import {describe, it, expect} from 'vitest';
import {
  combinations,
  iterCombinations,
  iterKCombinations,
  kCombinations,
} from '../combinations';

describe('K-combinations generator', () => {
  it('produces all subsets of size 3 of the set {a, b, c, d}', () => {
    const result = kCombinations(['a', 'b', 'c', 'd'], 3);
    expect(result.map(subset => subset.join('')).join(',')).toBe(
      'abc,abd,acd,bcd',
    );
  });
});

describe('Combinations generator', () => {
  it('produces all subsets of the set {a, b, c}', () => {
    const result = combinations(['a', 'b', 'c']);
    expect(result.map(subset => subset.join('')).join(',')).toBe(
      'a,b,c,ab,ac,bc,abc',
    );
  });
});

describe('K-combinations iterative generator', () => {
  it('produces all subsets of size 2 of the set {a, b, c, d}', () => {
    const result = [...iterKCombinations(['a', 'b', 'c', 'd'], 2)];
    expect(result.map(subset => subset.join('')).join(',')).toBe(
      'ab,ac,ad,bc,bd,cd',
    );
  });
});

describe('Combinations iterative generator', () => {
  it('produces all subsets of the set {a, b, c, d}', () => {
    const result = [...iterCombinations(['a', 'b', 'c', 'd'])];
    expect(result.map(subset => subset.join('')).join(',')).toBe(
      'a,b,c,d,ab,ac,ad,bc,bd,cd,abc,abd,acd,bcd,abcd',
    );
  });
});
