import {describe, it, expect} from 'vitest';
import {
  arraysEqual,
  binomial,
  circleDifference,
  circleDistance,
  clamp,
  div,
  dot,
  extendedEuclid,
  gcd,
  iteratedEuclid,
  norm,
  valueToCents,
} from '../index';

describe('Array equality tester', () => {
  it('works on integer arrays', () => {
    expect(arraysEqual([1, 2, 3], [1, 2, 3])).toBeTruthy();
    expect(arraysEqual([1, 2, 3], [1, 2, 3, 4])).toBeFalsy();
    expect(arraysEqual([1, 2], [1, 2, 3])).toBeFalsy();
  });
});

describe('extended Euclidean algorithm', () => {
  it('finds the Bézout coefficients for 15 and 42', () => {
    const a = 15;
    const b = 42;
    const result = extendedEuclid(15, 42);
    expect(a * result.coefA + b * result.coefB).toBe(gcd(a, b));
    expect(result.gcd).toBe(gcd(a, b));
    expect(div(a, gcd(a, b))).toBe(result.quotientA);
    expect(div(b, gcd(a, b))).toBe(result.quotientB);
  });
});

describe('iterated (extended) Euclidean algorithm', () => {
  it('works for a bunch of random numbers', () => {
    const l = Math.floor(Math.random() * 10);
    const params: number[] = [];
    for (let i = 0; i < l; ++i) {
      params.push(Math.floor(Math.random() * 100));
    }
    const coefs = iteratedEuclid(params);
    if (!params.length) {
      expect(coefs.length).toBe(0);
    } else {
      expect(params.map((p, i) => p * coefs[i]).reduce((a, b) => a + b)).toBe(
        params.reduce(gcd)
      );
    }
  });
});

describe('binomial coefficient', () => {
  it('tells you how many ways you can pick d unique elements out of n', () => {
    const n = 7;
    const d = 3;
    let numSubsets = 0;
    // This is d levels deep
    for (let i = 0; i < n; ++i) {
      for (let j = i + 1; j < n; ++j) {
        for (let k = j + 1; k < n; ++k) {
          numSubsets++;
        }
      }
    }
    expect(numSubsets).toBe(binomial(n, d));
  });

  it('calculates 11 choose 7', () => {
    expect(binomial(11, 7)).toBe(330);
  });
});

describe('Dot product', () => {
  it('can be used with all number arrays', () => {
    const a = new Float32Array([1, 2, 3, 4]);
    const b = new Int8Array([5, 6, 7]);
    expect(dot(a, b)).toBe(38);
    expect(dot(b, a)).toBe(38);
  });
});

describe('Value clamper', () => {
  it('works for lower bounds', () => {
    const value = -123.4;
    const clamped = clamp(0, 128, value);
    expect(clamped).toBe(0);
  });

  it('works for upper bounds', () => {
    const value = 13881.818;
    const clamped = clamp(0, 12800, value);
    expect(clamped).toBe(12800);
  });
});

describe('Norm', () => {
  it('calculates an euclidean norm (float32)', () => {
    const a = new Float32Array([-3, 4]);
    expect(norm(a)).toBeCloseTo(5);
  });
  it('calculates a taxicab norm (int8)', () => {
    const a = new Int8Array([3, -4]);
    expect(norm(a, 'taxicab')).toBeCloseTo(7);
  });
  it('calculates a max norm (number[])', () => {
    const a = [-3, -4];
    expect(norm(a, 'maximum')).toBeCloseTo(4);
  });
});

describe('Pitch difference with circle equivalence', () => {
  it('calculates the difference between 700.0 and 701.955', () => {
    const diff = circleDifference(700.0, 701.955);
    expect(diff).toBeCloseTo(-1.955);
  });

  it('calculates the octave-equivalent difference between 5/1 and 4\\12', () => {
    const diff = circleDifference(valueToCents(5), 400.0);
    expect(diff).toBeCloseTo(-13.686);
  });

  it('calculates the tritave-equivalent difference between 5/1 and 13/1', () => {
    const diff = circleDifference(
      valueToCents(5),
      valueToCents(13),
      valueToCents(3)
    );
    expect(diff).toBeCloseTo(247.741);
  });
});

describe('Pitch distance with circle equivalence', () => {
  it('calculates the distance between 700.0 and 701.955', () => {
    const diff = circleDistance(700.0, 701.955);
    expect(diff).toBeCloseTo(1.955);
  });

  it('calculates the octave-equivalent distance between 5/1 and 4\\12', () => {
    const diff = circleDistance(valueToCents(5), 400.0);
    expect(diff).toBeCloseTo(13.686);
  });

  it('calculates the tritave-equivalent distance between 5/1 and 13/1', () => {
    const diff = circleDistance(
      valueToCents(5),
      valueToCents(13),
      valueToCents(3)
    );
    expect(diff).toBeCloseTo(247.741);
  });
});
