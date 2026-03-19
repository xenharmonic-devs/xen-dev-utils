// Legacy implementations that need to be tsc compiled for fair benchmark comparison.

import {Fraction, FractionValue} from './fraction';
import {Monzo, sub} from './monzo';
import {BIG_INT_PRIMES, PRIMES} from './primes';

// Old implementation to test how the compiled package performs
export function toMonzoLegacy(n: FractionValue | bigint): Monzo {
  if (typeof n === 'bigint') {
    return bigIntToMonzo(n);
  }
  if (typeof n !== 'number') {
    n = new Fraction(n);
    return sub(toMonzoLegacy(n.n), toMonzoLegacy(n.d));
  }
  if (n < 1 || Math.round(n) !== n) {
    throw new Error(`Cannot convert number ${n} to monzo`);
  }
  if (n === 1) {
    return [];
  }

  const result: Monzo = [];
  for (const prime of PRIMES) {
    let component = 0;
    while (n % prime === 0) {
      n /= prime;
      component++;
    }
    result.push(component);
    if (n === 1) {
      break;
    }
  }
  if (n !== 1) {
    throw new Error('Out of primes');
  }
  return result;
}

export function primeLimitLegacy(
  n: FractionValue | bigint,
  asOrdinal = false,
  maxLimit = 7919,
): number {
  if (typeof n === 'bigint') {
    return bigIntPrimeLimit(n, asOrdinal, maxLimit);
  }
  if (typeof n !== 'number') {
    n = new Fraction(n);
    return Math.max(
      primeLimitLegacy(n.n, asOrdinal, maxLimit),
      primeLimitLegacy(n.d, asOrdinal, maxLimit),
    );
  }
  if (n < 1 || Math.round(n) !== n) {
    return NaN;
  }
  if (n === 1) {
    return 1;
  }

  // Accumulate increasingly complex factors into the probe
  // until it reaches the input value.
  let probe = 1;
  let limitIndex = 0;

  if (n < 0x100000000) {
    // Bit-magic for small 2-limit
    while (!(n & 1)) {
      n >>= 1;
    }
    if (n === 1) {
      return 2;
    }
    limitIndex = 1;
  }

  while (true) {
    const lastProbe = probe;
    probe *= PRIMES[limitIndex];
    if (n % probe) {
      probe = lastProbe;
      limitIndex++;
      if (limitIndex >= PRIMES.length || PRIMES[limitIndex] > maxLimit) {
        return Infinity;
      }
    } else if (n === probe) {
      return PRIMES[limitIndex];
    }
  }
}

// This was the current implementation at the time of writing. Re-printed here because we don't want to export it.
function bigIntToMonzo(n: bigint) {
  if (n < 1n) {
    throw new Error('Cannot convert non-positive big integer to monzo');
  }
  if (n === 1n) {
    return [];
  }
  const result = [0];

  // Accumulate increasingly complex factors into the probe
  // until it reaches the input value.
  let probe = 1n;
  let limitIndex = 0;

  while (true) {
    const lastProbe = probe;
    probe *= BIG_INT_PRIMES[limitIndex];
    if (n % probe) {
      probe = lastProbe;
      result.push(0);
      limitIndex++;
      if (limitIndex >= BIG_INT_PRIMES.length) {
        throw new Error('Out of primes');
      }
    } else if (n === probe) {
      result[limitIndex]++;
      return result;
    } else {
      result[limitIndex]++;
    }
  }
}

function bigIntPrimeLimit(
  n: bigint,
  asOrdinal: boolean,
  maxLimit: number,
): number {
  if (n < 1n) {
    return NaN;
  }
  if (n === 1n) {
    return asOrdinal ? 0 : 1;
  }

  // Accumulate increasingly complex factors into the probe
  // until it reaches the input value.

  // Bit-magic for 2-limit
  let probe = (n ^ (n - 1n)) & n;
  if (n === probe) {
    return asOrdinal ? 1 : 2;
  }
  let limitIndex = 1;

  while (true) {
    const lastProbe = probe;
    probe *= BIG_INT_PRIMES[limitIndex];
    if (n % probe) {
      probe = lastProbe;
      limitIndex++;
      // Using non-big primes here is intentional, the arrays have the same length.
      if (limitIndex >= PRIMES.length || PRIMES[limitIndex] > maxLimit) {
        return Infinity;
      }
    } else if (n === probe) {
      return asOrdinal ? limitIndex + 1 : PRIMES[limitIndex];
    }
  }
}

/**
 * Extract the exponents of the prime factors of a rational number.
 * @param n Rational number to convert to a monzo.
 * @param numberOfComponents Number of components in the result.
 * @returns The monzo representing `n` and a multiplicative residue that cannot be represented in the given limit.
 */
export function toMonzoAndResidualLegacy(
  n: bigint,
  numberOfComponents: number,
): [Monzo, bigint];
export function toMonzoAndResidualLegacy(
  n: FractionValue,
  numberOfComponents: number,
): [Monzo, Fraction];
export function toMonzoAndResidualLegacy(
  n: FractionValue | bigint,
  numberOfComponents: number,
): [Monzo, Fraction] | [Monzo, bigint] {
  if (typeof n === 'bigint') {
    return bigIntToMonzoAndResidualLegacy(n, numberOfComponents);
  }
  n = new Fraction(n);
  const numerator = n.n;
  const denominator = n.d;

  if (!n.n) {
    return [Array(numberOfComponents).fill(0), new Fraction(0)];
  }

  let nProbe = 1;
  let dProbe = 1;

  const result = Array(numberOfComponents).fill(-1);
  for (let i = 0; i < numberOfComponents; ++i) {
    let lastProbe;
    do {
      lastProbe = nProbe;
      nProbe *= PRIMES[i];
      result[i]++;
    } while (numerator % nProbe === 0);
    nProbe = lastProbe;

    // The fraction is in lowest terms so we know that positive components exclude negative components.
    if (result[i]) {
      continue;
    }

    result[i] = 1;
    do {
      lastProbe = dProbe;
      dProbe *= PRIMES[i];
      result[i]--;
    } while (denominator % dProbe === 0);
    dProbe = lastProbe;
  }

  return [result, (n as Fraction).div(new Fraction(nProbe, dProbe))];
}

function bigIntToMonzoAndResidualLegacy(
  n: bigint,
  numberOfComponents: number,
): [Monzo, bigint] {
  if (!n) {
    return [Array(numberOfComponents).fill(0), 0n];
  }

  let probe = 1n;

  const result = Array(numberOfComponents).fill(-1);
  for (let i = 0; i < numberOfComponents; ++i) {
    let lastProbe;
    do {
      lastProbe = probe;
      probe *= BIG_INT_PRIMES[i];
      result[i]++;
    } while (n % probe === 0n);
    probe = lastProbe;
  }

  return [result, n / probe];
}
