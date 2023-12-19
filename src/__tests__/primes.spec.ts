import {describe, it, expect} from 'vitest';
import {PRIMES, isPrime, primes} from '../primes';

describe('Array of prime numbers', () => {
  it('has no gaps', () => {
    expect(PRIMES[0]).toBe(2);
    let index = 1;
    for (let n = 3; n <= 7919; n += 2) {
      let isPrime_ = true;
      for (let i = 3; i * i <= n; ++i) {
        if (n % i === 0) {
          isPrime_ = false;
          break;
        }
      }
      if (isPrime_) {
        expect(PRIMES[index]).toBe(n);
        index++;
      }
    }
  });
});

const LARGER_PRIMES = [
  7927, 7933, 7937, 7949, 7951, 7963, 7993, 8009, 8011, 8017, 8039, 8053, 8059,
  8069, 8081, 8087, 8089, 8093,
];

describe('Primeness detector', () => {
  it('works for small primes', () => {
    for (let n = -1.5; n < 7920.5; n += 0.5) {
      if (isPrime(n)) {
        expect(PRIMES).includes(n);
      } else {
        expect(PRIMES).not.includes(n);
      }
    }
  });
  it.each(LARGER_PRIMES)('works for %s', (prime: number) => {
    expect(isPrime(prime)).toBe(true);
  });
  it('works for larger composites', () => {
    for (let n = 7919.25; n < 8095; n += 0.25) {
      if (LARGER_PRIMES.includes(n)) {
        continue;
      }
      expect(isPrime(n)).toBe(false);
    }
  });
  it('works for 62837327', () => {
    expect(isPrime(62837327)).toBe(false);
  });
  it('works for 62837303', () => {
    expect(isPrime(62837303)).toBe(true);
  });
});

describe('Lists of primes', () => {
  it('works from implicit 2 to 7', () => {
    expect(primes(7)).toEqual([2, 3, 5, 7]);
  });

  it('works from implicit 2 to below 16', () => {
    expect(primes(16)).toEqual([2, 3, 5, 7, 11, 13]);
  });

  it('produces an empty array with negative bounds', () => {
    expect(primes(-100, -50)).toHaveLength(0);
  });

  it('produces an empty array when end < start', () => {
    expect(primes(10, 1)).toHaveLength(0);
  });

  it('supports start and end parameters', () => {
    expect(primes(12, 31)).toEqual([13, 17, 19, 23, 29, 31]);
  });

  it('works with medium-sized values', () => {
    expect(primes(7907, 7933)).toEqual([7907, 7919, 7927, 7933]);
  });

  it('works with larger values', () => {
    expect(primes(7920, 8094)).toEqual(LARGER_PRIMES);
  });
});
