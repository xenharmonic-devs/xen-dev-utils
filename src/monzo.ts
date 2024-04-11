import {Fraction, FractionValue} from './fraction';
import {BIG_INT_PRIMES, PRIMES} from './primes';

/**
 * Array of integers representing the exponents of prime numbers in the unique factorization of a rational number.
 */
export type Monzo = number[];

/**
 * Check if two monzos are equal.
 * @param a The first monzo.
 * @param b The second monzo.
 * @returns `true` if the two values are equal when interpreted as fractions.
 */
export function monzosEqual(a: Readonly<Monzo>, b: Readonly<Monzo>) {
  if (a === b) {
    return true;
  }
  for (let i = 0; i < Math.min(a.length, b.length); ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  if (a.length > b.length) {
    for (let i = b.length; i < a.length; ++i) {
      if (a[i]) {
        return false;
      }
    }
  }
  if (b.length > a.length) {
    for (let i = a.length; i < b.length; ++i) {
      if (b[i]) {
        return false;
      }
    }
  }
  return true;
}

// TODO: Make types readonly where applicable.

/**
 * Add two monzos.
 * @param a The first monzo.
 * @param b The second monzo.
 * @returns A monzo that represents the product of the two numbers represented by `a` and `b`.
 */
export function add(a: Monzo, b: Monzo): Monzo {
  if (a.length < b.length) {
    return add(b, a);
  }
  const result = [...a];
  for (let i = 0; i < b.length; ++i) {
    result[i] += b[i];
  }
  return result;
}

/**
 * Subtract two monzos.
 * @param a The first monzo.
 * @param b The second monzo.
 * @returns A monzo that represents the division of the two numbers represented by `a` and `b`.
 */
export function sub(a: Monzo, b: Monzo): Monzo {
  const result = [...a];
  for (let i = 0; i < Math.min(a.length, b.length); ++i) {
    result[i] -= b[i];
  }
  while (result.length < b.length) {
    result.push(-b[result.length]);
  }
  return result;
}

/**
 * Scale a monzo by a scalar.
 * @param monzo The monzo to scale.
 * @param amount The amount to scale by.
 * @returns The scalar multiple.
 */
export function scale(monzo: Monzo, amount: number) {
  return monzo.map(component => component * amount);
}

/**
 * Multiply two monzos component-wise.
 * @param monzo The first monzo.
 * @param weights The second monzo. Missing values interpreted as 1 (no change).
 * @returns The first monzo weighted by the second.
 */
export function applyWeights(monzo: Monzo, weights: Monzo) {
  const result = [...monzo];
  for (let i = 0; i < Math.min(monzo.length, weights.length); ++i) {
    result[i] *= weights[i];
  }
  return result;
}

/**
 * Accumulate a monzo into the first one.
 * @param target The monzo to accumulate into.
 * @param source The monzo to add.
 * @returns The (modified) target monzo.
 */
export function accumulate(target: Monzo, source: Monzo) {
  for (let i = 0; i < Math.min(target.length, source.length); ++i) {
    target[i] += source[i];
  }
  return target;
}

/**
 * Decumulate a monzo into the first one.
 * @param target The monzo to decumulate into.
 * @param source The monzo to subtract.
 * @returns The (modified) target monzo.
 */
export function decumulate(target: Monzo, source: Monzo) {
  for (let i = 0; i < Math.min(target.length, source.length); ++i) {
    target[i] -= source[i];
  }
  return target;
}

/**
 * Rescale a monzo by a scalar.
 * @param target The monzo to rescale.
 * @param amount The amount to scale by.
 * @returns The (modified) target monzo.
 */
export function rescale(target: Monzo, amount: number) {
  for (let i = 0; i < target.length; ++i) {
    target[i] *= amount;
  }
  return target;
}

/**
 * Extract the exponents of the prime factors of a rational number.
 * @param n Rational number to convert to a monzo.
 * @returns The monzo representing `n`.
 */
export function toMonzo(n: FractionValue | bigint): Monzo {
  if (typeof n === 'bigint') {
    return bigIntToMonzo(n);
  }
  if (typeof n !== 'number') {
    n = new Fraction(n);
    return sub(toMonzo(n.n), toMonzo(n.d));
  }
  if (n < 1 || Math.round(n) !== n) {
    throw new Error(`Cannot convert number ${n} to monzo`);
  }
  if (n === 1) {
    return [];
  }

  const result = [0];

  // Accumulate increasingly complex factors into the probe
  // until it reaches the input value.
  let probe = 1;
  let limitIndex = 0;

  if (n < 0x100000000) {
    // Bit-magic for small 2-limit
    probe = (n ^ (n - 1)) & n;
    result[0] = Math.log2(probe);
    if (n === probe) {
      return result;
    }
    result.push(0);
    limitIndex = 1;
  }

  while (true) {
    const lastProbe = probe;
    probe *= PRIMES[limitIndex];
    if (n % probe) {
      probe = lastProbe;
      result.push(0);
      limitIndex++;
      if (limitIndex >= PRIMES.length) {
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

/**
 * Extract the exponents of the prime factors of a rational number.
 * @param n Rational number to convert to a monzo.
 * @param numberOfComponents Number of components in the result.
 * @returns The monzo representing `n` and a multiplicative residue that cannot be represented in the given limit.
 */
export function toMonzoAndResidual(
  n: bigint,
  numberOfComponents: number
): [Monzo, bigint];
export function toMonzoAndResidual(
  n: FractionValue,
  numberOfComponents: number
): [Monzo, Fraction];
export function toMonzoAndResidual(
  n: FractionValue | bigint,
  numberOfComponents: number
): [Monzo, Fraction] | [Monzo, bigint] {
  if (typeof n === 'bigint') {
    return bigIntToMonzoAndResidual(n, numberOfComponents);
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

function bigIntToMonzoAndResidual(
  n: bigint,
  numberOfComponents: number
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

/**
 * Convert a monzo to the fraction it represents.
 * @param monzo Iterable of prime exponents.
 * @returns Fractional representation of the monzo.
 */
export function monzoToFraction(monzo: Iterable<number>) {
  let numerator = 1;
  let denominator = 1;
  let index = 0;
  for (const component of monzo) {
    if (component > 0) {
      numerator *= PRIMES[index] ** component;
    }
    if (component < 0) {
      denominator *= PRIMES[index] ** -component;
    }
    index++;
  }
  return new Fraction(numerator, denominator);
}

/**
 * Convert a monzo to the BigInt it represents.
 * @param monzo Iterable of prime exponents.
 * @returns BigInt representation of the monzo.
 */
export function monzoToBigInt(monzo: Iterable<number>) {
  let result = 1n;
  let index = 0;
  for (const component of monzo) {
    if (component > 0) {
      result *= BIG_INT_PRIMES[index] ** BigInt(component);
    }
    if (component < 0) {
      throw new Error('Cannot produce big fractions');
    }
    index++;
  }
  return result;
}

/**
 * Calculate the prime limit of an integer or a fraction.
 * @param n Integer or fraction to calculate prime limit for.
 * @param asOrdinal Return the limit as an ordinal instead of a prime. (1 is #0, 2 is #1, 3 is #2, 5 is #3, etc.)
 * @param maxLimit Maximum prime limit to consider.
 * @returns The largest prime in the factorization of the input. `Infinity` if above the maximum limit. `NaN` if not applicable.
 */
export function primeLimit(
  n: FractionValue | bigint,
  asOrdinal = false,
  maxLimit = 7919
): number {
  if (typeof n === 'bigint') {
    return bigIntPrimeLimit(n, asOrdinal, maxLimit);
  }
  if (typeof n !== 'number') {
    n = new Fraction(n);
    return Math.max(
      primeLimit(n.n, asOrdinal, maxLimit),
      primeLimit(n.d, asOrdinal, maxLimit)
    );
  }
  if (n < 1 || Math.round(n) !== n) {
    return NaN;
  }
  if (n === 1) {
    return asOrdinal ? 0 : 1;
  }

  // Accumulate increasingly complex factors into the probe
  // until it reaches the input value.
  let probe = 1;
  let limitIndex = 0;

  if (n < 0x100000000) {
    // Bit-magic for small 2-limit
    probe = (n ^ (n - 1)) & n;
    if (n === probe) {
      return asOrdinal ? 1 : 2;
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
      return asOrdinal ? limitIndex + 1 : PRIMES[limitIndex];
    }
  }
}

function bigIntPrimeLimit(
  n: bigint,
  asOrdinal: boolean,
  maxLimit: number
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
