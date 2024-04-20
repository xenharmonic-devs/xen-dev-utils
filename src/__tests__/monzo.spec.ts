import {describe, it, expect} from 'vitest';
import {Fraction} from '../fraction';
import {
  monzoToBigInt,
  monzoToFraction,
  primeLimit,
  toMonzo,
  toMonzoAndResidual,
} from '../monzo';

function toMonzoAndResidual11(n: number): [number[], number] {
  const result = [0, 0, 0, 0, 0];
  if (!n) {
    return [result, n];
  }
  while (n % 2 === 0) {
    n /= 2;
    result[0]++;
  }
  while (n % 3 === 0) {
    n /= 3;
    result[1]++;
  }
  while (n % 5 === 0) {
    n /= 5;
    result[2]++;
  }
  while (n % 7 === 0) {
    n /= 7;
    result[3]++;
  }
  while (n % 11 === 0) {
    n /= 11;
    result[4]++;
  }
  return [result, n];
}

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

  it('can break down a big integer to its prime components', () => {
    const monzo = toMonzo(BigInt('360000000000000000000000'));
    expect(monzo[0]).toBe(24);
    expect(monzo[1]).toBe(2);
    expect(monzo[2]).toBe(22);
    expect(
      BigInt(2) ** BigInt(monzo[0]) *
        BigInt(3) ** BigInt(monzo[1]) *
        BigInt(5) ** BigInt(monzo[2])
    ).toBe(BigInt('360000000000000000000000'));
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

  it('converts a Pythagorean interval', () => {
    const [monzo, residual] = toMonzoAndResidual('129140163/134217728', 6);
    expect(monzo).toEqual([-27, 17, 0, 0, 0, 0]);
    expect(residual.equals(1)).toBe(true);
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

  it('leaves a residue if everything cannot be converted', () => {
    const [monzo, residual] = toMonzoAndResidual(
      BigInt('123456789000000000000'),
      3
    );
    expect(residual).toBe(BigInt(13717421));
    expect(monzo).toHaveLength(3);
    expect(monzo[0]).toBe(12);
    expect(monzo[1]).toBe(2);
    expect(monzo[2]).toBe(12);
    expect(
      BigInt(2) ** BigInt(monzo[0]) *
        BigInt(3) ** BigInt(monzo[1]) *
        BigInt(5) ** BigInt(monzo[2]) *
        residual
    ).toBe(BigInt('123456789000000000000'));
  });

  it('leaves residual 0n for big int zero', () => {
    const [monzo, residual] = toMonzoAndResidual(0n, 1);
    expect(residual).toBe(0n);
    expect(monzo).toHaveLength(1);
  });

  it('leaves residual 0n for big int zero (no vector part)', () => {
    const [monzo, residual] = toMonzoAndResidual(0n, 0);
    expect(residual).toBe(0n);
    expect(monzo).toHaveLength(0);
  });

  it('leaves negative residual for big integers', () => {
    const [monzo, residual] = toMonzoAndResidual(-10n, 2);
    expect(residual).toBe(-5n);
    expect(monzo).toHaveLength(2);
    expect(monzo[0]).toBe(1);
    expect(monzo[1]).toBe(0);
  });

  it('leaves negative residual for integers', () => {
    const [monzo, residual] = toMonzoAndResidual(-10, 2);
    expect(residual.toFraction()).toBe('-5');
    expect(monzo).toHaveLength(2);
    expect(monzo[0]).toBe(1);
    expect(monzo[1]).toBe(0);
  });

  it('works just below the int32 boundary', () => {
    const [monzo, residual] = toMonzoAndResidual(2 ** 30, 1);
    expect(monzo).toEqual([30]);
    expect(residual.isUnity()).toBe(true);
  });

  it('works at the int32 boundary', () => {
    const [monzo, residual] = toMonzoAndResidual(2 ** 31, 1);
    expect(monzo).toEqual([31]);
    expect(residual.isUnity()).toBe(true);
  });

  it('works just above the int32 boundary', () => {
    const [monzo, residual] = toMonzoAndResidual(2 ** 32, 1);
    expect(monzo).toEqual([32]);
    expect(residual.isUnity()).toBe(true);
  });

  it('works just below the IEEE limit', () => {
    const [monzo, residual] = toMonzoAndResidual(2n ** 1023n, 1);
    expect(monzo).toEqual([1023]);
    expect(residual).toBe(1n);
  });

  it('works at the IEEE limit', () => {
    const [monzo, residual] = toMonzoAndResidual(2n ** 1024n, 1);
    expect(monzo).toEqual([1024]);
    expect(residual).toBe(1n);
  });

  it('works just above the IEEE limit', () => {
    const [monzo, residual] = toMonzoAndResidual(2n ** 1025n, 1);
    expect(monzo).toEqual([1025]);
    expect(residual).toBe(1n);
  });

  it('agrees with the reference implementation', () => {
    for (let n = -1000; n <= 1000; ++n) {
      const [monzo, residual] = toMonzoAndResidual(n, 5);
      const [bigMonzo, bigResidual] = toMonzoAndResidual(BigInt(n), 5);
      const [reference, refResidual] = toMonzoAndResidual11(n);
      expect(monzo).toEqual(reference);
      expect(bigMonzo).toEqual(reference);
      expect(residual.equals(refResidual)).toBe(true);
      expect(bigResidual).toBe(BigInt(refResidual));
    }
  });
});

describe('Monzo to fraction converter', () => {
  it('multiplies the prime components', () => {
    expect(
      monzoToFraction([3, -2, -1]).equals(new Fraction(8, 45))
    ).toBeTruthy();
  });
});

describe('Monzo to BigInt converter', () => {
  it('multiplies the prime components', () => {
    expect(monzoToBigInt([30, 20, 10])).toBe(
      BigInt('36561584400629760000000000')
    );
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

  it('can handle BigInt inputs', () => {
    const two = primeLimit(BigInt('1267650600228229401496703205376'));
    expect(two).toBe(2);
    const limit = primeLimit(BigInt('1561327220802586898249028'));
    expect(limit).toBe(19);
  });
});
