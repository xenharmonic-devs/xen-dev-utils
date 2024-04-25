import {describe, it, expect} from 'vitest';
import {
  Fraction,
  FractionSet,
  arraysEqual,
  binomial,
  ceilPow2,
  circleDifference,
  circleDistance,
  clamp,
  div,
  dot,
  extendedEuclid,
  fareyInterior,
  fareySequence,
  gcd,
  falsifyConstantStructure,
  hasMarginConstantStructure,
  iteratedEuclid,
  norm,
  valueToCents,
  monzoToCents,
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

describe('Ceiling power of two', () => {
  it('works with small values', () => {
    const x = 1 + Math.random() * (2 ** 30 - 2);
    const p2 = ceilPow2(x);
    expect(x).toBeLessThanOrEqual(p2);
    expect(p2).toBeLessThan(2 * x);
    expect(Math.log2(p2)).toBeCloseTo(Math.round(Math.log2(p2)));
  });

  it('works with tiny values', () => {
    const x = Math.random();
    const p2 = ceilPow2(x);
    expect(x).toBeLessThanOrEqual(p2);
    expect(p2).toBeLessThan(2 * x);
    expect(Math.log2(p2)).toBeCloseTo(Math.round(Math.log2(p2)));
  });

  it('works with large values', () => {
    const x = 2 ** 31 + Math.random() * 2 ** 37;
    const p2 = ceilPow2(x);
    expect(x).toBeLessThanOrEqual(p2);
    expect(p2).toBeLessThan(2 * x);
    expect(Math.log2(p2)).toBeCloseTo(Math.round(Math.log2(p2)));
  });
});

describe('Farey sequence generator', () => {
  it('generates all fractions with max denominator 6 between 0 and 1 inclusive', () => {
    const F6 = Array.from(fareySequence(6)).map(f => f.toFraction());
    expect(F6).toEqual([
      '0',
      '1/6',
      '1/5',
      '1/4',
      '1/3',
      '2/5',
      '1/2',
      '3/5',
      '2/3',
      '3/4',
      '4/5',
      '5/6',
      '1',
    ]);
  });

  it('agrees with the brute force method', () => {
    const everything = new FractionSet();
    const N = Math.floor(Math.random() * 50) + 1;
    for (let d = 1; d <= N; ++d) {
      for (let n = 0; n <= d; ++n) {
        everything.add(new Fraction(n, d));
      }
    }
    const brute = Array.from(everything);
    brute.sort((a, b) => a.compare(b));
    const farey = fareySequence(N);
    for (const entry of brute) {
      const f = farey.next().value!;
      expect(entry.equals(f)).toBe(true);
    }
    expect(farey.next().done).toBe(true);
  });
});

describe('Farey interior generator', () => {
  it('generates all fractions with max denominator 8 between 0 and 1 exclusive', () => {
    const Fi8 = Array.from(fareyInterior(8)).map(f => f.toFraction());
    expect(Fi8).toEqual([
      '1/8',
      '1/7',
      '1/6',
      '1/5',
      '1/4',
      '2/7',
      '1/3',
      '3/8',
      '2/5',
      '3/7',
      '1/2',
      '4/7',
      '3/5',
      '5/8',
      '2/3',
      '5/7',
      '3/4',
      '4/5',
      '5/6',
      '6/7',
      '7/8',
    ]);
  });

  it('agrees with the brute force method', () => {
    const everything = new FractionSet();
    const N = Math.floor(Math.random() * 50) + 1;
    for (let d = 1; d <= N; ++d) {
      for (let n = 1; n < d; ++n) {
        everything.add(new Fraction(n, d));
      }
    }
    const brute = Array.from(everything);
    brute.sort((a, b) => a.compare(b));
    const farey = fareyInterior(N);
    for (const entry of brute) {
      const f = farey.next().value!;
      expect(entry.equals(f)).toBe(true);
    }
    expect(farey.next().done).toBe(true);
  });
});

describe('Constant structure falsifier', () => {
  it('Rejects diatonic in 12-tone equal temperament with F-to-B against B-to-F', () => {
    const steps = [2, 4, 5, 7, 9, 11, 12];
    const [[lowAug4, highAug4], [lowDim5, highDim5]] =
      falsifyConstantStructure(steps)!;
    // C = -1
    // D = 0
    // E = 1
    expect(lowAug4).toBe(2); // F
    expect(highAug4).toBe(5); // B

    expect(lowDim5).toBe(5); // B
    expect(highDim5 % 7).toBe(2); // F
  });

  it('Accepts diatonic in 19-tone equal temperament', () => {
    const steps = [3, 6, 8, 11, 14, 17, 19];
    expect(falsifyConstantStructure(steps)).toBe(null);
  });

  it("Produces Zarlino's sequence in 311-tone equal temperament", () => {
    const sizes: number[] = [];
    const gs: number[] = [100, 182];
    for (let i = 3; i < 60; ++i) {
      const zarlino = [...gs];
      zarlino.push(311);
      zarlino.sort((a, b) => a - b);
      if (falsifyConstantStructure(zarlino) === null) {
        sizes.push(i);
      }
      const last = gs[gs.length - 1];
      if (i & 1) {
        gs.push((last + 100) % 311);
      } else {
        gs.push((last + 82) % 311);
      }
    }
    expect(sizes).toEqual([3, 4, 7, 10, 17, 34, 58]);
  });

  it('Accepts the empty scale', () => {
    expect(falsifyConstantStructure([])).toBe(null);
  });

  it('Accepts the trivial scale', () => {
    expect(falsifyConstantStructure([1])).toBe(null);
  });

  it('Rejects a scale with a repeated step (early)', () => {
    expect(falsifyConstantStructure([0, 1200])).toEqual([
      [-1, 1],
      [0, 1],
    ]);
  });

  it('Rejects a scale with a repeated step (late)', () => {
    expect(falsifyConstantStructure([1200, 1200])).toEqual([
      [-1, 1],
      [-1, 2],
    ]);
  });
});

describe('Constant structure checker with a margin of equivalence', () => {
  it('Rejects diatonic in 12-tone equal temperament (zero margin)', () => {
    const scaleCents = [200, 400, 500, 700, 900, 1100, 1200];
    expect(hasMarginConstantStructure(scaleCents, 0)).toBe(false);
  });

  it('Accepts diatonic in 19-tone equal temperament (margin of 1 cent)', () => {
    const scaleCents = [189.5, 378.9, 505.3, 694.7, 884.2, 1073.7, 1200];
    expect(hasMarginConstantStructure(scaleCents, 1)).toBe(true);
  });

  const zarlino: number[] = [386.313714, 701.955001];
  for (let i = 0; i < 31; ++i) {
    const last = zarlino[zarlino.length - 1];
    if (i & 1) {
      zarlino.push((last + 315.641287) % 1200);
    } else {
      zarlino.push((last + 386.313714) % 1200);
    }
  }
  zarlino.sort((a, b) => a - b);
  zarlino.push(1200);

  it('Accepts Zarlino[34] with a margin of 1 cent', () => {
    expect(hasMarginConstantStructure(zarlino, 1)).toBe(true);
  });

  it('Rejects Zarlino[34] with a margin of 2 cents', () => {
    expect(hasMarginConstantStructure(zarlino, 2)).toBe(false);
  });

  it('Accepts the empty scale', () => {
    expect(hasMarginConstantStructure([], 0)).toBe(true);
  });

  it('Accepts the trivial scale', () => {
    expect(hasMarginConstantStructure([1200], 0)).toBe(true);
  });

  it('Rejects a scale with a comma step (early)', () => {
    expect(hasMarginConstantStructure([1, 1200], 2)).toBe(false);
  });

  it('Rejects a scale with a comma step (late)', () => {
    expect(hasMarginConstantStructure([1199, 1200], 2)).toBe(false);
  });
});

describe('Monzo size measure', () => {
  it('calculates the size of the perfect fourth accurately', () => {
    expect(monzoToCents([2, -1])).toBeCloseTo(498.0449991346125, 12);
  });

  it('calculates the size of the rascal accurately', () => {
    expect(monzoToCents([-7470, 2791, 1312])).toBeCloseTo(
      5.959563411893381e-6,
      24
    );
  });

  it('calculates the size of the neutrino accurately', () => {
    expect(monzoToCents([1889, -2145, 138, 424])).toBeCloseTo(
      1.6361187484440885e-10,
      24
    );
  });

  it('calculates the size of the demiquartervice comma accurately', () => {
    expect(monzoToCents([-3, 2, -1, -1, 0, 0, -1, 0, 2])).toBeCloseTo(
      0.3636664332386927,
      15
    );
  });

  it('calculates the size of the negative junebug comma accurately', () => {
    expect(monzoToCents([-1, 1, -1, -1, 1, -1, -1, 1, 1, -1, 1])).toBeCloseTo(
      -6.104006661651758,
      15
    );
  });
});
