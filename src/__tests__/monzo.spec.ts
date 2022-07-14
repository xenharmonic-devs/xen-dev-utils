import {describe, it, expect} from 'vitest';
import {Fraction} from '../fraction';
import {primeLimit, toMonzo} from '../monzo';

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
        .pow(monzo[0])
        .mul(3 ** monzo[1] * 7 ** monzo[3])
        .equals('1029/1024')
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

  it('knows that the prime limit of 11859211/11859210 is 19', () => {
    expect(primeLimit('11859211/11859210')).toBe(19);
  });

  it('returns infinity when going beyond the given limit', () => {
    expect(primeLimit(123456789, 97)).toBe(Infinity);
  });

  it('stays within the given limit', () => {
    const limit = primeLimit(
      new Fraction(
        Math.ceil(Math.random() * 10000),
        Math.ceil(Math.random() * 10000)
      ),
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
