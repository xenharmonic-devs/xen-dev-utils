import {describe, it, expect} from 'vitest';
import {Fraction, gcd, lcm, mmod} from '../fraction';

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
    const result = fraction.pow(half);
    expect(result).not.toBeNull();
    expect(result!.s).toBe(1);
    expect(result!.n).toBe(6);
    expect(result!.d).toBe(5);
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

  it('can simplify a random number', () => {
    const value = Math.random() * 2;
    const fraction = new Fraction(value);
    expect(fraction.simplify().valueOf()).toBeCloseTo(value);
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
    expect(fraction.lcr('64/27')!.equals('4096/729')).toBe(true);
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
});
