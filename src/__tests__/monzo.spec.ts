import {describe, it, expect} from 'vitest';
import {Fraction} from '../fraction';
import {
  monzoToFraction,
  primeLimit,
  toMonzo,
  toMonzoAndResidual,
} from '../monzo';

describe('Monzo converter', () => {
  it('can break down an integer to its prime components', () => {
    const monzo = toMonzo(360);
    expect(monzo[0]).toBe(3);
    expect(monzo[1]).toBe(2);
    expect(monzo[2]).toBe(1);
    expect(2 ** monzo[0] * 3 ** monzo[1] * 5 ** monzo[2]).toBe(360);
  });

  it('can break down a fraction to its prime components', () => {
    const monzo = toMonzo('1029/1024');
    expect(monzo[0]).toBe(-10);
    expect(monzo[1]).toBe(1);
    expect(monzo[2]).toBe(0);
    expect(monzo[3]).toBe(3);
    expect(
      new Fraction(2)
        .pow(monzo[0])!
        .mul(3 ** monzo[1] * 7 ** monzo[3])
        .equals('1029/1024')
    ).toBeTruthy();
  });

  it('can break down a fraction to its prime components (5-limit)', () => {
    const porcupineComma = toMonzo('250/243');
    expect(porcupineComma.length).toBe(3);
    expect(porcupineComma[0]).toBe(1);
    expect(porcupineComma[1]).toBe(-5);
    expect(porcupineComma[2]).toBe(3);
  });

  it('throws for zero', () => {
    expect(() => toMonzo(0)).toThrow();
  });
});

describe('Fraction to monzo converter', () => {
  it('can break down a fraction to its prime components', () => {
    const [monzo, residual] = toMonzoAndResidual(new Fraction(45, 32), 3);
    expect(residual.equals(1)).toBeTruthy();
    expect(monzo[0]).toBe(-5);
    expect(monzo[1]).toBe(2);
    expect(monzo[2]).toBe(1);
    expect(
      new Fraction(2)
        .pow(monzo[0])!
        .mul(3 ** monzo[1])
        .mul(5 ** monzo[2])
        .equals(new Fraction(45, 32))
    ).toBeTruthy();
  });

  it('leaves a residue if everything cannot be converted', () => {
    const [monzo, residual] = toMonzoAndResidual('12345/678', 3);
    expect(residual.equals('823/113')).toBeTruthy();
    expect(monzo).toHaveLength(3);
    expect(monzo[0]).toBe(-1);
    expect(monzo[1]).toBe(0);
    expect(monzo[2]).toBe(1);
    expect(
      new Fraction(2)
        .pow(monzo[0])!
        .mul(3 ** monzo[1])
        .mul(5 ** monzo[2])
        .mul(residual)
        .equals('12345/678')
    ).toBeTruthy();
  });

  it('leaves residual 0 for zero (vector part)', () => {
    const [monzo, residual] = toMonzoAndResidual(0, 1);
    expect(residual.equals(0)).toBeTruthy();
    expect(monzo).toHaveLength(1);
    expect(new Fraction(2).pow(monzo[0])!.mul(residual).equals(0)).toBeTruthy();
  });

  it('leaves residual 0 for zero (no vector part)', () => {
    const [monzo, residual] = toMonzoAndResidual(0, 0);
    expect(residual.equals(0)).toBeTruthy();
    expect(monzo).toHaveLength(0);
  });
});

describe('Monzo to fraction converter', () => {
  it('multiplies the prime components', () => {
    expect(
      monzoToFraction([3, -2, -1]).equals(new Fraction(8, 45))
    ).toBeTruthy();
  });
});

describe('Prime limit calculator', () => {
  it('knows that the limit of 1 is 1', () => {
    expect(primeLimit(1)).toBe(1);
  });

  it('knows that the prime limit of 64 is 2', () => {
    expect(primeLimit(64)).toBe(2);
  });

  it('knows that the prime limit of 45 is 5', () => {
    expect(primeLimit(45)).toBe(5);
  });

  it('knows that the prime limit of 21 has ordinal #4', () => {
    expect(primeLimit(21, true)).toBe(4);
  });

  it('knows that the prime limit of 11859211/11859210 is 19', () => {
    expect(primeLimit('11859211/11859210')).toBe(19);
  });

  it('returns infinity when going beyond the given limit', () => {
    expect(primeLimit(123456789, false, 97)).toBe(Infinity);
  });

  it('stays within the given limit', () => {
    const limit = primeLimit(
      new Fraction(
        Math.ceil(Math.random() * 10000),
        Math.ceil(Math.random() * 10000)
      ),
      false,
      97
    );
    if (limit < Infinity) {
      expect(limit).toBeLessThanOrEqual(97);
    } else {
      expect(limit).toBe(Infinity);
    }
  });

  it('can handle large inputs', () => {
    const limit = primeLimit(new Fraction(4294967296, 4006077075));
    expect(limit).toBe(13);
  });
});
