import {Primitive} from 'ts-essentials';
import {HashMap, Hashable} from '../hashable';
import {PRIMES} from '../primes';
import {Monzo, monzosEqual} from '../monzo';
import {describe, it, expect} from 'vitest';

/**
 * Partial implementation of a rational number capable of holding very large values with a limited number of prime factors.
 */
class ImmutableMonzo extends Hashable {
  vector: Readonly<Monzo>;

  constructor(vector: Readonly<Monzo>) {
    super();
    this.vector = vector;
  }

  valueOf(): number {
    let value = 1;
    for (let i = 0; i < this.vector.length; ++i) {
      value *= PRIMES[i] ** this.vector[i];
    }
    return value;
  }

  strictEquals(other: Hashable | Primitive): boolean {
    if (other instanceof ImmutableMonzo) {
      return monzosEqual(this.vector, other.vector);
    }
    return false;
  }
}

function M(vector: Readonly<Monzo>) {
  return Object.freeze(new ImmutableMonzo(Object.freeze(vector)));
}

describe('Hash-map / dictionary', () => {
  it('can set / get keys that hash to the same value', () => {
    const thirty = M([1, 1, 1]);
    const big = M([100000]);
    const alsoBig = M([-1, 1000]);
    expect(thirty.valueOf()).toBe(30);
    expect(big.valueOf()).toBe(alsoBig.valueOf());

    const map = new HashMap<number | ImmutableMonzo, string>([
      [30, 'number'],
      [thirty, 'thirty'],
      [big, 'biig'], // Oops typo. To be overriden.
    ]);

    map.set(alsoBig, 'also big');
    map.set(M([100000]), 'big');

    expect(map.get(30)).toBe('number');
    expect(map.get(M([1, 1, 1]))).toBe('thirty');
    expect(map.get(M([100000]))).toBe('big');
    expect(map.get(M([-1, 1000]))).toBe('also big');

    expect(map.size).toBe(4);
  });

  it('can be cleared', () => {
    const map = new HashMap();
    map.set(3, 4);
    expect(map.size).toBe(1);
    map.clear();
    expect(map.size).toBe(0);
    expect(map.get(3)).toBe(undefined);
  });

  // TODO: Rest of the methods of HashMap
});
