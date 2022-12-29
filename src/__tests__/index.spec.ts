import {describe, it, expect} from 'vitest';
import {
  approximateOddLimit,
  approximatePrimeLimit,
  approximatePrimeLimitWithErrors,
  arraysEqual,
  binomial,
  clamp,
  div,
  dot,
  extendedEuclid,
  gcd,
  getConvergents,
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

  it('can approximate pi in the 13-limit with a small sized result', () => {
    const approximations = approximatePrimeLimit(
      valueToCents(Math.PI),
      PRIMES.indexOf(13),
      3,
      15,
      4
    );
    expect(approximations).toHaveLength(4);
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

describe('Convergent calculator', () => {
  it('calculates the convergents of pi', () => {
    const convergents = getConvergents(Math.PI, undefined, 10);
    expect(convergents).toHaveLength(10);
    expect(convergents[0].equals(3)).toBeTruthy();
    expect(convergents[1].equals('22/7')).toBeTruthy();
    expect(convergents[2].equals('333/106')).toBeTruthy();
    expect(convergents[3].equals('355/113')).toBeTruthy();
    expect(convergents[4].equals('103993/33102')).toBeTruthy();
    expect(convergents[5].equals('104348/33215')).toBeTruthy();
    expect(convergents[6].equals('208341/66317')).toBeTruthy();
    expect(convergents[7].equals('312689/99532')).toBeTruthy();
    expect(convergents[8].equals('833719/265381')).toBeTruthy();
    expect(convergents[9].equals('1146408/364913')).toBeTruthy();
  });

  it('calculates the semiconvergents of pi', () => {
    const semiconvergents = getConvergents(Math.PI, undefined, 13, true);
    expect(semiconvergents).toHaveLength(13);
    expect(semiconvergents[0].equals(3)).toBeTruthy();
    expect(semiconvergents[1].equals('13/4')).toBeTruthy();
    expect(semiconvergents[2].equals('16/5')).toBeTruthy();
    expect(semiconvergents[3].equals('19/6')).toBeTruthy();
    expect(semiconvergents[4].equals('22/7')).toBeTruthy();
    expect(semiconvergents[5].equals('179/57')).toBeTruthy();
    expect(semiconvergents[6].equals('201/64')).toBeTruthy();
    expect(semiconvergents[7].equals('223/71')).toBeTruthy();
    expect(semiconvergents[8].equals('245/78')).toBeTruthy();
    expect(semiconvergents[9].equals('267/85')).toBeTruthy();
    expect(semiconvergents[10].equals('289/92')).toBeTruthy();
    expect(semiconvergents[11].equals('311/99')).toBeTruthy();
    expect(semiconvergents[12].equals('333/106')).toBeTruthy();

    let error = Infinity;
    semiconvergents.forEach(semiconvergent => {
      const newError = Math.abs(Math.PI - semiconvergent.valueOf());
      expect(newError).toBeLessThan(error);
      error = newError;
    });
  });

  it('calculates the non-monotonic semiconvergents of pi', () => {
    const semiconvergents = getConvergents(Math.PI, undefined, 5, true, true);
    expect(semiconvergents).toHaveLength(5);
    expect(semiconvergents[0].equals(3)).toBeTruthy();
    expect(semiconvergents[1].equals(4)).toBeTruthy();
    expect(semiconvergents[2].equals('7/2')).toBeTruthy();
    expect(semiconvergents[3].equals('10/3')).toBeTruthy();
    expect(semiconvergents[4].equals('13/4')).toBeTruthy();
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
