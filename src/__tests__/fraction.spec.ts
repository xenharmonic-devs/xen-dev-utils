import {describe, it, expect} from 'vitest';
import {Fraction, gcd, lcm, mmod, modc} from '../fraction';

describe('gcd', () => {
  it('can find the greatest common divisor of 12 and 15 (number)', () => {
    expect(gcd(12, 15)).toBe(3);
  });

  it('can find the greatest common divisor of 12 and 15 (bigint)', () => {
    expect(gcd(12n, 15n)).toBe(3n);
  });

  it('has an identity element (left)', () => {
    expect(gcd(12, 0)).toBe(12);
  });

  it('has an identity element (right)', () => {
    expect(gcd(0, 12)).toBe(12);
  });

  it('has an identity element (self)', () => {
    expect(gcd(0, 0)).toBe(0);
  });

  it('has an identity element (bigint)', () => {
    expect(gcd(12n, 0n)).toBe(12n);
  });
});

describe('lcm', () => {
  it('can find the least common multiple of 6 and 14 (number)', () => {
    expect(lcm(6, 14)).toBe(42);
  });

  it('can find the least common multiple of 6 and 14 (bigint)', () => {
    expect(lcm(6n, 14n)).toBe(42n);
  });

  it('works with zero (left)', () => {
    expect(lcm(0, 12)).toBe(0);
  });

  it('works with zero (right)', () => {
    expect(lcm(12, 0)).toBe(0);
  });

  it('works with zero (both)', () => {
    expect(lcm(0, 0)).toBe(0);
  });

  it('works with zero (bigint)', () => {
    expect(lcm(0n, 12n)).toBe(0n);
  });
});

describe('gcd with lcm', () => {
  it('satisfies the identity for small integers', () => {
    for (let i = -10; i <= 10; ++i) {
      for (let j = -10; j <= 10; ++j) {
        // We need to bypass (+0).toBe(-0) here...
        expect(gcd(i, j) * lcm(i, j) === i * j, `failed with ${i}, ${j}`).toBe(
          true
        );
        // This works, though.
        const x = BigInt(i);
        const y = BigInt(j);
        expect(gcd(x, y) * lcm(x, y)).toBe(x * y);
      }
    }
  });
});

describe('mmod', () => {
  it('works with negative numbers (number)', () => {
    expect(mmod(-5, 3)).toBe(1);
  });

  it('works with negative numbers (bigint)', () => {
    expect(mmod(-5n, 3n)).toBe(1n);
  });

  it('produces NaN for 1 % 0', () => {
    expect(mmod(1, 0)).toBeNaN();
  });

  it('throws for 1n % 0n', () => {
    expect(() => mmod(1n, 0n)).toThrow();
  });
});

describe('Ceiling modulo', () => {
  it('works like clockwork', () => {
    expect([...Array(13).keys()].map(i => modc(i, 12))).toEqual([
      12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
  });

  it('works with negative numbers (bigint)', () => {
    expect(modc(-5n, 3n)).toBe(1n);
  });

  it('produces 0 for 1 % 0', () => {
    expect(modc(1, 0)).toBe(0);
  });

  it('produces 0n for 1n % 0n', () => {
    expect(modc(1n, 0n)).toBe(0n);
  });
});

describe('Fraction', () => {
  it('can be constructed from numerator and denominator', () => {
    const fraction = new Fraction(-6, -12);
    expect(fraction.s).toBe(1);
    expect(fraction.n).toBe(1);
    expect(fraction.d).toBe(2);
  });

  it('can be constructed from a floating point number', () => {
    const fraction = new Fraction(-0.875);
    expect(fraction.s).toBe(-1);
    expect(fraction.n).toBe(7);
    expect(fraction.d).toBe(8);
  });

  it('can be constructed from a plain number string', () => {
    const fraction = new Fraction('5');
    expect(fraction.s).toBe(1);
    expect(fraction.n).toBe(5);
    expect(fraction.d).toBe(1);
  });

  it('can be constructed from a decimal string', () => {
    const fraction = new Fraction('3.14159');
    expect(fraction.s).toBe(1);
    expect(fraction.n).toBe(314159);
    expect(fraction.d).toBe(100000);
  });

  it('can be construction from a fraction string', () => {
    const fraction = new Fraction('-9/12');
    expect(fraction.s).toBe(-1);
    expect(fraction.n).toBe(3);
    expect(fraction.d).toBe(4);
  });

  it('can calculate the square root of 36/25', () => {
    const fraction = new Fraction(36, 25);
    const half = new Fraction(1, 2);
    const result = fraction.pow(half)!;
    expect(result).not.toBeNull();
    expect(result.s).toBe(1);
    expect(result.n).toBe(6);
    expect(result.d).toBe(5);
  });

  it('can calculate the inverse square root of 36/25', () => {
    const fraction = new Fraction(36, 25);
    const negHalf = new Fraction(-1, 2);
    const result = fraction.pow(negHalf)!;
    expect(result).not.toBeNull();
    expect(result.s).toBe(1);
    expect(result.n).toBe(5);
    expect(result.d).toBe(6);
  });

  it('can calculate (-125/27) ** (1/3)', () => {
    const fraction = new Fraction(-125, 27);
    const result = fraction.pow('1/3')!;
    expect(result).not.toBeNull();
    expect(result.s).toBe(-1);
    expect(result.n).toBe(5);
    expect(result.d).toBe(3);
  });

  it('can calculate (-125/27) ** (2/3)', () => {
    const fraction = new Fraction(-125, 27);
    const result = fraction.pow('2/3')!;
    expect(result).not.toBeNull();
    expect(result.s).toBe(1);
    expect(result.n).toBe(25);
    expect(result.d).toBe(9);
  });

  it('infers zeroes for decimal components', () => {
    const half = new Fraction('.5');
    expect(half.valueOf()).toBe(0.5);
    const negativeQuarter = new Fraction('-.25');
    expect(negativeQuarter.valueOf()).toBe(-0.25);
    const two = new Fraction('2.');
    expect(two.valueOf()).toBe(2);
    const zero = new Fraction('.');
    expect(zero.valueOf()).toBe(0);
  });

  it('infers ones for slash components', () => {
    const third = new Fraction('/3');
    expect(third.s).toBe(1);
    expect(third.n).toBe(1);
    expect(third.d).toBe(3);
    const fifth = new Fraction('-/5');
    expect(fifth.s).toBe(-1);
    expect(fifth.n).toBe(1);
    expect(fifth.d).toBe(5);
    const four = new Fraction('-4/');
    expect(four.s).toBe(-1);
    expect(four.n).toBe(4);
    expect(four.d).toBe(1);
    const one = new Fraction('/');
    expect(one.s).toBe(1);
    expect(one.n).toBe(1);
    expect(one.d).toBe(1);
  });

  it('supports scientific notation', () => {
    const thirtySevenPercent = new Fraction('37e-2');
    expect(thirtySevenPercent.s).toBe(1);
    expect(thirtySevenPercent.n).toBe(37);
    expect(thirtySevenPercent.d).toBe(100);
    const minusTwelve = new Fraction('-1.2e1');
    expect(minusTwelve.s).toBe(-1);
    expect(minusTwelve.n).toBe(12);
    expect(minusTwelve.d).toBe(1);
    const cursedTritone = new Fraction('14e-1');
    expect(cursedTritone.s).toBe(1);
    expect(cursedTritone.n).toBe(7);
    expect(cursedTritone.d).toBe(5);
    const pleaseDont = new Fraction('-11/3e2');
    expect(pleaseDont.s).toBe(-1);
    expect(pleaseDont.n).toBe(1100);
    expect(pleaseDont.d).toBe(3);
  });

  // These obviously crashes the engine before failing the test. No way around that.
  it('produces a finite continued fraction from a random value (0, 10)', () => {
    const value = Math.random() * 10;
    const fraction = new Fraction(value);
    expect(fraction.toContinued().length).toBeLessThan(Infinity);
  });

  it.skip('produces a finite continued fraction from a random value (MAX_SAFE, 1e20<<', () => {
    const value = Number.MAX_SAFE_INTEGER + Math.random() * 1e19;
    const fraction = new Fraction(value);
    // This obviously crashes the engine before failing the test. No way around that.
    expect(fraction.toContinued().length).toBeLessThan(Infinity);
  });

  it.skip('produces a finite continued fraction from a balanced high complexity value', () => {
    const fraction = new Fraction(
      Number.MAX_SAFE_INTEGER + Math.random() * 1e18,
      Number.MAX_SAFE_INTEGER + Math.random() * 1e18
    );
    expect(fraction.toContinued().length).toBeLessThan(Infinity);
  });

  it.skip('produces a finite continued fraction from an imbalanced high complexity value', () => {
    const fraction = new Fraction(
      Math.floor(Math.random() * 1000),
      Number.MAX_SAFE_INTEGER + Math.random() * 1e18
    );
    expect(fraction.toContinued().length).toBeLessThan(Infinity);
  });

  it.skip('produces a finite continued fraction from infinity', () => {
    const fraction = new Fraction(Infinity);
    expect(fraction.toContinued().length).toBeLessThan(Infinity);
  });

  it('can approximate the golden ratio', () => {
    let approximant = new Fraction(1);
    for (let i = 0; i < 76; ++i) {
      approximant = approximant.inverse().add(1);
      // Finite numbers have two valid representations.
      // This is the shorter one.
      const expected = Array(i).fill(1);
      expected.push(2);
      expect(approximant.toContinued()).toEqual(expected);
    }
  });

  it('can simplify a random number using an absolute metric', () => {
    const value = Math.random() * 4 - 2;
    const fraction = new Fraction(value);
    expect(fraction.simplify().valueOf()).toBeCloseTo(value);
  });

  it('can simplify a random number using a relative metric', () => {
    const value =
      Math.exp(Math.random() * 20 - 10) *
      (Math.floor(2 * Math.random()) * 2 - 1);
    const fraction = new Fraction(value);
    const simplified = fraction.simplifyRelative().valueOf();
    expect(Math.sign(simplified)).toBe(Math.sign(value));
    expect(
      Math.abs(Math.log(Math.abs(simplified)) - Math.log(Math.abs(value)))
    ).toBeLessThanOrEqual((Math.LN2 / 1200) * 3.5);
  });

  it('can parse a repeated decimal', () => {
    const fraction = new Fraction("3.'3'");
    expect(fraction.s).toBe(1);
    expect(fraction.n).toBe(10);
    expect(fraction.d).toBe(3);
  });

  it('can parse a repeated decimal (zero whole part)', () => {
    const fraction = new Fraction("0.'1'");
    expect(fraction.s).toBe(1);
    expect(fraction.n).toBe(1);
    expect(fraction.d).toBe(9);
  });

  // Need BigInt for this.
  it.skip('can parse repeated decimal (late cycle)', () => {
    const fraction = new Fraction("0.269'736842105263157894'");
    console.log(fraction);
  });

  it('can produce repeated decimals', () => {
    const fraction = new Fraction(5, 11);
    expect(fraction.toString()).toBe("0.'45'");
  });

  it('is not equal to NaN', () => {
    const fraction = new Fraction(3, 2);
    expect(fraction.equals(NaN)).toBe(false);
  });

  it('is not equal to garbage', () => {
    const fraction = new Fraction(3, 2);
    expect(fraction.equals('asdf')).toBe(false);
  });

  it("doesn't compare to NaN", () => {
    const fraction = new Fraction(7, 3);
    expect(fraction.compare(NaN)).toBeNaN();
  });

  it("doesn't compare to garbage", () => {
    const fraction = new Fraction(7, 3);
    expect(fraction.compare('garbage')).toBeNaN();
  });

  it('is not divisible by NaN', () => {
    const fraction = new Fraction(13, 11);
    expect(fraction.divisible(NaN)).toBe(false);
  });

  it('is not divisible by garbage', () => {
    const fraction = new Fraction(13, 11);
    expect(fraction.divisible('conquer')).toBe(false);
  });

  it('gives the correct error for too large components', () => {
    expect(() => new Fraction(1.1231233477899796e16, 1)).toThrowError(
      'Numerator above safe limit'
    );
  });

  it('can convert a problematic float to a fraction', () => {
    const x = 0.5717619047619048;
    const y = new Fraction(x);
    expect(y.valueOf()).toBeCloseTo(x);
  });

  it('has a geometric modulo (integers)', () => {
    const fraction = new Fraction(5);
    expect(fraction.geoMod(2).equals('5/4')).toBe(true);
  });

  it('has a geometric modulo (fractions)', () => {
    const fraction = new Fraction(19, 5);
    expect(fraction.geoMod('3/2').equals('152/135')).toBe(true);
  });

  it('has a geometric modulo (sub-unity)', () => {
    const fraction = new Fraction(7);
    expect(fraction.geoMod('1/2').equals('7/8')).toBe(true);
  });

  it('has a geometric modulo (negative numbers)', () => {
    const fraction = new Fraction(11);
    expect(fraction.geoMod(-2).equals('-11/8')).toBe(true);
  });

  it('has a geometric modulo (unity)', () => {
    const fraction = new Fraction(1);
    expect(fraction.geoMod(3).equals(1)).toBe(true);
  });

  it('has a geometric modulo (self)', () => {
    const fraction = new Fraction(4, 3);
    expect(fraction.geoMod('4/3').equals(1)).toBe(true);
  });

  // This can easily produce unrepresentable fractions.
  it.skip('has a geometric modulo (random)', () => {
    const fraction = new Fraction(Math.random());
    expect(fraction.geoMod(Math.random()).compare(1)).toBeLessThan(0);
  });

  it('has a geometric gcd (integers)', () => {
    const fraction = new Fraction(8);
    expect(fraction.gcr(4)!.equals(2)).toBe(true);
  });

  it('has a geometric gcd (unrelated integers)', () => {
    const fraction = new Fraction(9);
    expect(fraction.gcr(4)).toBeNull();
  });

  it('has a geometric gcd (fractions)', () => {
    const fraction = new Fraction(1024, 243);
    expect(fraction.gcr('27/64')!.equals('4/3')).toBe(true);
  });

  // Apparently this can "succeed" even though it should be exceedingly unlikely...
  it.skip('has a geometric gcd (random)', () => {
    const fraction = new Fraction(Math.random());
    expect(fraction.gcr(Math.random())).toBeNull();
  });

  it('treats unity as the identity in geometric gcd (left)', () => {
    const fraction = new Fraction(12);
    expect(fraction.gcr(1)!.equals(12)).toBe(true);
  });

  it('treats unity as the identity in geometric gcd (right)', () => {
    const fraction = new Fraction(1);
    expect(fraction.gcr(12)!.equals(12)).toBe(true);
  });

  it('treats unity as the identity in geometric gcd (self)', () => {
    const fraction = new Fraction(1);
    expect(fraction.gcr(1)!.equals(1)).toBe(true);
  });

  it('has logdivision (integers)', () => {
    const fraction = new Fraction(9);
    expect(fraction.log(3)!.equals(2)).toBe(true);
  });

  it('has logdivision (negatives)', () => {
    const fraction = new Fraction(-8);
    expect(fraction.log(-2)!.equals(3)).toBe(true);
  });

  it('has logdivision (positive/negative)', () => {
    const fraction = new Fraction(4);
    expect(fraction.log(-2)!.equals(2)).toBe(true);
  });

  it('has logdivision (incompatible negatives)', () => {
    const fraction = new Fraction(-4);
    expect(fraction.log(-2)).toBeNull();
  });

  it('has logdivision (negative/positive)', () => {
    const fraction = new Fraction(-4);
    expect(fraction.log(2)).toBeNull();
  });

  it('has logdivision (negative result)', () => {
    const fraction = new Fraction(1, 16);
    expect(fraction.log(2)!.equals(-4)).toBe(true);
  });

  it('has logdivision (unrelated integers)', () => {
    const fraction = new Fraction(15);
    expect(fraction.log(2)).toBeNull();
  });

  it('has logdivision (fractions)', () => {
    const fraction = new Fraction(64, 27);
    expect(fraction.log('16/9')!.equals('3/2')).toBe(true);
  });

  // Apparently this can "succeed" even though it should be exceedingly unlikely...
  it.skip('has logdivision (random)', () => {
    const fraction = new Fraction(Math.random());
    expect(fraction.log(Math.random())).toBeNull();
  });

  it('has geometric lcm (integers)', () => {
    const fraction = new Fraction(27);
    expect(fraction.lcr(81)!.equals(531441)).toBe(true);
  });

  it('has a geometric lcm (fractions)', () => {
    const fraction = new Fraction(9, 16);
    // The result is subunitary for a subunitary argument by convention.
    expect(fraction.lcr('64/27')!.equals('729/4096')).toBe(true);
  });

  it('has geometric lcm that works with unity (left)', () => {
    const fraction = new Fraction(1, 2);
    expect(fraction.lcr(1)!.equals(1)).toBe(true);
  });

  it('has geometric lcm that works with unity (right)', () => {
    const fraction = new Fraction(1);
    expect(fraction.lcr(2)!.equals(1)).toBe(true);
  });

  it('has geometric lcm that works with unity (both)', () => {
    const fraction = new Fraction(1);
    expect(fraction.lcr(1)!.equals(1)).toBe(true);
  });

  it('satisfies the gcr/lcr identity for small integers when it exists', () => {
    for (let i = 1; i <= 10; ++i) {
      for (let j = 1; j <= 10; ++j) {
        const gcr = new Fraction(i).gcr(j);
        if (gcr === null) {
          continue;
        }
        const lcr = new Fraction(i).lcr(j)!;
        expect(lcr.log(i)!.equals(new Fraction(j).log(gcr)!)).toBe(true);
      }
    }
  });

  it('satisfies the gcr/lcr identity between a small integer and a particular when it exists', () => {
    for (let i = 1; i <= 10; ++i) {
      const particular = new Fraction(i).inverse();
      // Starting from 2 to avoid logdivision by unity.
      for (let j = 2; j <= 10; ++j) {
        const gcr = particular.gcr(j);
        if (gcr === null) {
          continue;
        }
        const lcr = particular.lcr(j)!;
        expect(lcr.log(particular)!.equals(new Fraction(j).log(gcr)!)).toBe(
          true
        );

        expect(new Fraction(j).gcr(particular)!.equals(gcr)).toBe(true);
        expect(new Fraction(j).lcr(particular)!.equals(lcr)).toBe(true);
        expect(lcr!.log(j)!.equals(particular.log(gcr)!)).toBe(true);
      }
    }
  });

  it('has geometric rounding (integers)', () => {
    const fraction = new Fraction(17);
    expect(fraction.geoRoundTo(2)!.equals(16)).toBe(true);
  });

  it('has geometric rounding (positive/negative)', () => {
    const fraction = new Fraction(7);
    expect(fraction.geoRoundTo(-2)!.equals(4)).toBe(true);
  });

  it('has geometric rounding (incompatible negative/positive)', () => {
    const fraction = new Fraction(-7);
    expect(fraction.geoRoundTo(2)).toBeNull();
  });

  it('has geometric rounding (negative)', () => {
    const fraction = new Fraction(-7);
    expect(fraction.geoRoundTo(-2)!.equals(-8)).toBe(true);
  });

  it('has geometric rounding (fractions)', () => {
    const fraction = new Fraction(3, 2);
    expect(fraction.geoRoundTo('10/9')!.equals('10000/6561')).toBe(true);
  });

  it('has harmonic addition', () => {
    const fraction = new Fraction('7/5');
    expect(fraction.lensAdd('13/11').toFraction()).toBe('91/142');
  });

  it('has harmonic addition of zero (left)', () => {
    const fraction = new Fraction(0);
    expect(fraction.lensAdd('3/2').toFraction()).toBe('0');
  });

  it('has harmonic addition of zero (right)', () => {
    const fraction = new Fraction('3/2');
    expect(fraction.lensAdd(0).toFraction()).toBe('0');
  });

  it('has harmonic addition of zero (both)', () => {
    const fraction = new Fraction(0);
    expect(fraction.lensAdd(0).toFraction()).toBe('0');
  });

  it('has harmonic subtraction', () => {
    const fraction = new Fraction('7/5');
    expect(fraction.lensSub('13/11').toFraction()).toBe('-91/12');
  });

  it('has harmonic subtraction of zero (left)', () => {
    const fraction = new Fraction(0);
    expect(fraction.lensSub('3/2').toFraction()).toBe('0');
  });

  it('has harmonic subtraction of zero (right)', () => {
    const fraction = new Fraction('3/2');
    expect(fraction.lensSub(0).toFraction()).toBe('0');
  });

  it('has harmonic subtraction of zero (both)', () => {
    const fraction = new Fraction(0);
    expect(fraction.lensSub(0).toFraction()).toBe('0');
  });

  it('cancels harmonic addition with harmonic subtraction', () => {
    const a = new Fraction(
      Math.floor(Math.random() * 1000),
      Math.floor(Math.random() * 1000) + 1
    );
    const b = new Fraction(
      Math.floor(Math.random() * 1000),
      Math.floor(Math.random() * 1000) + 1
    );
    const lensSum = a.lensAdd(b);
    expect(lensSum.lensSub(b).equals(a)).toBe(true);
    expect(lensSum.lensSub(a).equals(b)).toBe(true);
  });

  it.fails('blows up on repeated division', () => {
    let foo = new Fraction('3/2');
    const bar = new Fraction('103/101');
    for (let i = 0; i < 10; ++i) {
      foo = foo.div(bar);
    }
  });

  it.fails('blows up on repeated multiplication', () => {
    let foo = new Fraction('103/101');
    for (let i = 0; i < 4; ++i) {
      foo = foo.mul(foo);
    }
  });

  it('multiplies large cancelling factors', () => {
    const one = new Fraction('1234567890/987654321').mul(
      '987654321/1234567890'
    );
    expect(one.equals(1)).toBe(true);
  });

  it('adds terms with large denominators', () => {
    const a = new Fraction('123456789/94906267');
    const b = new Fraction('987654321/94906267');
    expect(a.add(b).equals('1111111110/94906267')).toBe(true);
  });

  it('subtracts terms with large denominators', () => {
    const a = new Fraction('987654321/94906267');
    const b = new Fraction('123456789/94906267');
    expect(a.sub(b).equals('864197532/94906267'));
  });

  it('lens-adds terms with large numerators', () => {
    const a = new Fraction('94906267/123456789');
    const b = new Fraction('94906267/987654321');
    expect(a.lensAdd(b).equals('94906267/1111111110')).toBe(true);
  });

  it('lens-subtracts terms with large numerators', () => {
    const a = new Fraction('94906267/123456789');
    const b = new Fraction('94906267/987654321');
    expect(a.lensSub(b).equals('-94906267/864197532')).toBe(true);
  });

  it('mods terms with large denominators', () => {
    const a = new Fraction('123456789/94906267');
    const b = new Fraction('987654321/94906267');
    expect(b.mod(a).equals('9/94906267')).toBe(true);
  });

  it('mmods terms with large denominators', () => {
    const a = new Fraction('123456789/94906267');
    const b = new Fraction('987654321/94906267');
    expect(b.mmod(a).equals('9/94906267')).toBe(true);
  });

  it('checks divisibility of complex fractions', () => {
    const a = new Fraction('123456789/94906267');
    expect(a.mul(21).divisible(a)).toBe(true);
  });

  it('computes gcd of factors with large denominators', () => {
    const a = new Fraction('123456789/94906267');
    const b = new Fraction('987654321/94906267');
    expect(a.gcd(b).equals('9/94906267')).toBe(true);
  });

  it('computes lcm of factors with with large numerators', () => {
    const a = new Fraction('94906267/123456789');
    const b = new Fraction('94906267/987654321');
    expect(a.lcm(b).equals('94906267/9')).toBe(true);
  });

  it('satisfies the multiplicative identity between gcd and lcm for small integers', () => {
    for (let i = -10; i <= 10; ++i) {
      for (let j = -10; j <= 10; ++j) {
        const f = new Fraction(i);
        expect(
          f
            .gcd(j)
            .mul(f.lcm(j))
            .equals(i * j),
          `failed with ${i}, ${j}`
        ).toBe(true);
      }
    }
  });

  it('normalizes zero (integer)', () => {
    const fraction = new Fraction(0);
    expect(fraction.s).toBe(0);
    expect(fraction.n).toBe(0);
    expect(fraction.d).toBe(1);
  });

  it('normalizes zero (numerator)', () => {
    const fraction = new Fraction({n: -0, d: 1});
    expect(fraction.s).toBe(0);
    expect(fraction.n).toBe(0);
    expect(fraction.d).toBe(1);
  });

  it('normalizes zero (denominator)', () => {
    const fraction = new Fraction({n: 0, d: -1});
    expect(fraction.s).toBe(0);
    expect(fraction.n).toBe(0);
    expect(fraction.d).toBe(1);
  });

  it('normalizes zero (infinite denominator)', () => {
    const fraction = new Fraction({n: 123, d: Infinity});
    expect(fraction.s).toBe(0);
    expect(fraction.n).toBe(0);
    expect(fraction.d).toBe(1);
  });

  it('normalizes zero (infinite second argument)', () => {
    const fraction = new Fraction(-123, Infinity);
    expect(fraction.s).toBe(0);
    expect(fraction.n).toBe(0);
    expect(fraction.d).toBe(1);
  });

  it('throws an informative error for (Infinity, 1)', () => {
    expect(() => new Fraction(Infinity, 1)).throws(
      'Cannot represent Infinity as a fraction'
    );
  });

  it('throws an informative error for (-Infinity, 1)', () => {
    expect(() => new Fraction(-Infinity, 1)).throws(
      'Cannot represent Infinity as a fraction'
    );
  });

  it('throws an informative error for Infinity', () => {
    expect(() => new Fraction(Infinity)).throws(
      'Cannot represent Infinity as a fraction'
    );
  });

  it('throws an informative error for {n: Infinity, d:1}', () => {
    expect(() => new Fraction({n: Infinity, d: 1})).throws(
      'Cannot represent Infinity as a fraction'
    );
  });

  it('throws for NaN (literal)', () => {
    expect(() => new Fraction(NaN)).throws(
      'Cannot represent NaN as a fraction'
    );
  });

  it('throws for NaN (implicit)', () => {
    expect(() => new Fraction(Infinity, Infinity)).throws(
      'Cannot represent NaN as a fraction'
    );
  });

  it('calculates the square root of 9/4', () => {
    const fraction = new Fraction(9, 4).sqrt()!;
    expect(fraction.equals('3/2')).toBe(true);
  });

  it('gives up on root 3', () => {
    const nil = new Fraction(3).sqrt();
    expect(nil).toBeNull();
  });

  it('gives up on root -1', () => {
    const nil = new Fraction(-1).sqrt();
    expect(nil).toBeNull();
  });

  // Passes, but takes about 409094ms
  it.skip('works on every square within the supported limit', () => {
    let n = 0;
    while (n * n < Number.MAX_SAFE_INTEGER) {
      expect(new Fraction(n * n).sqrt()!.equals(n)).toBe(true);
      ++n;
    }
  });
});

describe('JSON serialization', () => {
  it('can serialize an array of fractions along with other data', () => {
    const serialized = JSON.stringify([
      new Fraction(42),
      2,
      new Fraction(-5, 3),
      new Fraction('1.234'),
      'hello',
      new Fraction({s: 0, n: 0, d: 1}),
      null,
    ]);

    expect(serialized).toBe(
      '[{"n":42,"d":1},2,{"n":-5,"d":3},{"n":617,"d":500},"hello",{"n":0,"d":1},null]'
    );
  });

  it('can revive an array of fractions along with other data', () => {
    const serialized =
      '[{"n":42,"d":1},2,{"n":-5,"d":3},{"n":617,"d":500},"hello",{"n":0,"d":1},null]';
    const data = JSON.parse(serialized, Fraction.reviver);
    expect(data).toHaveLength(7);

    expect(data[0]).toBeInstanceOf(Fraction);
    expect(data[0]).toEqual({s: 1, n: 42, d: 1});

    expect(data[1]).toBe(2);

    expect(data[2]).toBeInstanceOf(Fraction);
    expect(data[2]).toEqual({s: -1, n: 5, d: 3});

    expect(data[3]).toBeInstanceOf(Fraction);
    expect(data[3].equals('1.234')).toBe(true);

    expect(data[4]).toBe('hello');

    expect(data[5]).toBeInstanceOf(Fraction);
    expect(data[5]).toEqual({s: 0, n: 0, d: 1});

    expect(data[6]).toBeNull();
  });
});
