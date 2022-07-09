import {describe, it, expect} from 'vitest';
import {PRIMES} from '../primes';

describe('Array of prime numbers', () => {
  it('has no gaps', () => {
    expect(PRIMES[0]).toBe(2);
    let index = 1;
    for (let n = 3; n <= 7919; n += 2) {
      let isPrime = true;
      for (let i = 3; i * i <= n; ++i) {
        if (n % i === 0) {
          isPrime = false;
          break;
        }
      }
      if (isPrime) {
        expect(PRIMES[index]).toBe(n);
        index++;
      }
    }
  });
});
