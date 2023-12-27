import {describe, it, expect} from 'vitest';
import {
  approximateOddLimit,
  approximatePrimeLimit,
  approximatePrimeLimitWithErrors,
  approximateRadical,
  getConvergents,
} from '../approximation';
import {valueToCents} from '../conversion';
import {PRIMES} from '../primes';

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

  it('has somewhat sane default behavior', () => {
    expect(() =>
      approximatePrimeLimit(valueToCents(Math.PI), 8, 2)
    ).not.toThrow();
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

  it('calculates convergents for 1\\5', () => {
    expect(() =>
      getConvergents(1.148698354997035, undefined, 256, true, false)
    ).not.toThrow();
  });
});

describe('Radical approximator', () => {
  it("finds Ramanujan's approximation to pi", () => {
    const {index, radicant} = approximateRadical(Math.PI);
    expect(index).toBe(4);
    expect(radicant.toFraction()).toBe('2143/22');
  });

  it('works with a random value without crashing', () => {
    const value = Math.random() * 1000 - 100;
    const {index, radicant} = approximateRadical(value);
    expect(radicant.valueOf() ** (1 / index) / value).toBeCloseTo(1);
  });
});
