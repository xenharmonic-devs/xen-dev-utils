import {describe, it, expect} from 'vitest';
import {
  approximateOddLimit,
  approximatePrimeLimit,
  approximatePrimeLimitWithErrors,
  arraysEqual,
  binomial,
  div,
  extendedEuclid,
  gcd,
  iteratedEuclid,
  lcm,
  mmod,
  PRIMES,
  valueToCents,
} from '../index';

describe('Array equality tester', () => {
  it('works on integer arrays', () => {
    expect(arraysEqual([1, 2, 3], [1, 2, 3])).toBeTruthy();
    expect(arraysEqual([1, 2, 3], [1, 2, 3, 4])).toBeFalsy();
    expect(arraysEqual([1, 2], [1, 2, 3])).toBeFalsy();
  });
});

describe('gcd', () => {
  it('can find the greates common divisor of 12 and 15', () => {
    expect(gcd(12, 15)).toBe(3);
  });
});

describe('lcm', () => {
  it('can find the least common multiple of 6 and 14', () => {
    expect(lcm(6, 14)).toBe(42);
  });
});

describe('mmod', () => {
  it('works with negative numbers', () => {
    expect(mmod(-5, 3)).toBe(1);
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

describe('Odd limit approximator', () => {
  it('can approximate tau in the 15-odd-limit', () => {
    const approximation = approximateOddLimit(valueToCents(2 * Math.PI), 15)[0];
    expect(approximation.equals('44/7')).toBeTruthy();
    expect(approximation.valueOf()).toBeCloseTo(2 * Math.PI);
  });

  it('can approximate e in the 21-odd-limit', () => {
    const approximations = approximateOddLimit(valueToCents(Math.E), 21);
    expect(approximations[0].equals('19/7')).toBeTruthy();
    expect(approximations[0].valueOf()).toBeCloseTo(Math.E);
    expect(approximations[7].equals('21/8')).toBeTruthy();
    expect(approximations[7].valueOf()).toBeCloseTo(Math.E, 0);
  });
});

describe('Prime limit approximator', () => {
  it('can approximate pi in the 11-limit', () => {
    const approximation = approximatePrimeLimit(
      valueToCents(Math.PI),
      PRIMES.indexOf(11),
      3
    )[0];
    expect(approximation.equals('12544/3993')).toBeTruthy();
    expect(approximation.valueOf()).toBeCloseTo(Math.PI);
  });

  it('can approximate the square root of two in the 7-limit within maximum error', () => {
    const approximationsAndErrors = approximatePrimeLimitWithErrors(
      600,
      PRIMES.indexOf(7),
      5,
      10
    );
    expect(approximationsAndErrors).toHaveLength(28);
    approximationsAndErrors.forEach(([approximation, error]) => {
      const cents = valueToCents(approximation.valueOf());
      const calculatedError = Math.abs(cents - 600);
      expect(error).toBeCloseTo(calculatedError);
      expect(calculatedError).toBeLessThanOrEqual(10);
    });
  });
});
