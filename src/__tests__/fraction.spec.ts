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
});
