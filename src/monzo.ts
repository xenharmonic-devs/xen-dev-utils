import {Fraction, FractionValue, gcd} from './fraction';
import {BIG_INT_PRIMES, PRIMES} from './primes';

/**
 * Array of integers representing the exponents of prime numbers in the unique factorization of a rational number.
 */
export type Monzo = number[];

// The limit at which ((n ^ (n-1)) & n) is no longer equal to the two's factor.
const BIT_MAGIC_LIMIT = 2 ** 31;

/**
 * Calculate the absolute value of a BigInt.
 * @param n Integer to measure.
 * @returns Size of the integer as a BigInt.
 */
export function bigAbs(n: bigint) {
  return n < 0n ? -n : n;
}

/**
 * Check if two monzos are equal.
 * @param a The first monzo.
 * @param b The second monzo.
 * @returns `true` if the two values are equal when interpreted as fractions.
 */
export function monzosEqual(a: Monzo, b: Monzo) {
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
    if ((n as Fraction).s !== 1) {
      throw new Error(
        `Cannot convert fraction ${(n as Fraction).toFraction()} to monzo`
      );
    }
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

  if (n < BIT_MAGIC_LIMIT) {
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
 * Convert a monzo to the BigInt fraction it represents.
 * @param monzo Iterable of prime exponents.
 * @returns Record with keys 'numerator' and 'denominator containing BigInts.
 */
export function monzoToBigNumeratorDenominator(monzo: Iterable<number>) {
  let numerator = 1n;
  let denominator = 1n;
  let index = 0;
  for (const component of monzo) {
    if (component > 0) {
      numerator *= BIG_INT_PRIMES[index] ** BigInt(component);
    }
    if (component < 0) {
      denominator *= BIG_INT_PRIMES[index] ** BigInt(-component);
    }
    index++;
  }
  return {numerator, denominator};
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

  if (n < BIT_MAGIC_LIMIT) {
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

  if (!n.n) {
    return [Array(numberOfComponents).fill(0), new Fraction(0)];
  }

  let [n7, numerator] = intToMonzo7(n.n);
  let [d7, denominator] = intToMonzo7(n.d);

  const result: Monzo = Array(numberOfComponents).fill(-1);

  result[0] = n7[0] - d7[0];
  result[1] = n7[1] - d7[1];
  result[2] = n7[2] - d7[2];
  result[3] = n7[3] - d7[3];

  let nProbe = 1;
  let dProbe = 1;

  for (let i = 4; i < numberOfComponents; ++i) {
    let lastProbe: number;
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

  numerator /= nProbe;
  denominator /= dProbe;

  // Silly user, 7-limit is fine for everyone.
  while (result.length > numberOfComponents) {
    const exponent = result.pop()!;
    if (exponent > 0) {
      numerator *= PRIMES[result.length] ** exponent;
    } else if (exponent < 0) {
      denominator *= PRIMES[result.length] ** -exponent;
    }
  }

  const residual = new Fraction(numerator, denominator);
  residual.s = (n as Fraction).s;

  return [result, residual];
}

function bigIntToMonzoAndResidual(
  n: bigint,
  numberOfComponents: number
): [Monzo, bigint] {
  if (!n) {
    return [Array(numberOfComponents).fill(0), 0n];
  }

  let [result, residual] = bigIntToMonzo7(bigAbs(n));

  let probe = 1n;

  for (let i = 4; i < numberOfComponents; ++i) {
    result.push(-1);
    let lastProbe: bigint;
    do {
      lastProbe = probe;
      probe *= BIG_INT_PRIMES[i];
      result[i]++;
    } while (residual % probe === 0n);
    probe = lastProbe;
  }

  residual /= probe;

  while (result.length > numberOfComponents) {
    const exponent = result.pop()!;
    residual *= BIG_INT_PRIMES[result.length] ** BigInt(exponent);
  }

  return [result, n < 0n ? -residual : residual];
}

// Factors of 315 factorized to monzos
const M0 = [0, 0, 0, 0];
const M1 = [0, 1, 0, 0];
const M2 = [0, 0, 1, 0];
const M3 = [0, 0, 0, 1];
const M4 = [0, 2, 0, 0];
const M5 = [0, 1, 1, 0];
const M6 = [0, 1, 0, 1];
const M7 = [0, 0, 1, 1];
const M8 = [0, 2, 1, 0];
const M9 = [0, 2, 0, 1];
const Ma = [0, 1, 1, 1];
const Mb = [0, 2, 1, 1];

// prettier-ignore
const MONZO_LOOKUP: [number, Monzo][] = [
  [315, Mb], [1, M0], [1, M0], [3, M1], [1, M0], [5, M2], [3, M1], [7, M3], [1, M0], [9, M4], [5, M2], [1, M0], [3, M1], [1, M0], [7, M3],
  [15, M5], [1, M0], [1, M0], [9, M4], [1, M0], [5, M2], [21, M6], [1, M0], [1, M0], [3, M1], [5, M2], [1, M0], [9, M4], [7, M3], [1, M0],
  [15, M5], [1, M0], [1, M0], [3, M1], [1, M0], [35, M7], [9, M4], [1, M0], [1, M0], [3, M1], [5, M2], [1, M0], [21, M6], [1, M0], [1, M0],
  [45, M8], [1, M0], [1, M0], [3, M1], [7, M3], [5, M2], [3, M1], [1, M0], [1, M0], [9, M4], [5, M2], [7, M3], [3, M1], [1, M0], [1, M0],
  [15, M5], [1, M0], [1, M0], [63, M9], [1, M0], [5, M2], [3, M1], [1, M0], [1, M0], [3, M1], [35, M7], [1, M0], [9, M4], [1, M0], [1, M0],
  [15, M5], [1, M0], [7, M3], [3, M1], [1, M0], [5, M2], [9, M4], [1, M0], [1, M0], [21, M6], [5, M2], [1, M0], [3, M1], [1, M0], [1, M0],
  [45, M8], [7, M3], [1, M0], [3, M1], [1, M0], [5, M2], [3, M1], [1, M0], [7, M3], [9, M4], [5, M2], [1, M0], [3, M1], [1, M0], [1, M0],
  [105, Ma], [1, M0], [1, M0], [9, M4], [1, M0], [5, M2], [3, M1], [7, M3], [1, M0], [3, M1], [5, M2], [1, M0], [9, M4], [1, M0], [7, M3],
  [15, M5], [1, M0], [1, M0], [3, M1], [1, M0], [5, M2], [63, M9], [1, M0], [1, M0], [3, M1], [5, M2], [1, M0], [3, M1], [7, M3], [1, M0],
  [45, M8], [1, M0], [1, M0], [3, M1], [1, M0], [35, M7], [3, M1], [1, M0], [1, M0], [9, M4], [5, M2], [1, M0], [21, M6], [1, M0], [1, M0],
  [15, M5], [1, M0], [1, M0], [9, M4], [7, M3], [5, M2], [3, M1], [1, M0], [1, M0], [3, M1], [5, M2], [7, M3], [9, M4], [1, M0], [1, M0],
  [15, M5], [1, M0], [1, M0], [21, M6], [1, M0], [5, M2], [9, M4], [1, M0], [1, M0], [3, M1], [35, M7], [1, M0], [3, M1], [1, M0], [1, M0],
  [45, M8], [1, M0], [7, M3], [3, M1], [1, M0], [5, M2], [3, M1], [1, M0], [1, M0], [63, M9], [5, M2], [1, M0], [3, M1], [1, M0], [1, M0],
  [15, M5], [7, M3], [1, M0], [9, M4], [1, M0], [5, M2], [3, M1], [1, M0], [7, M3], [3, M1], [5, M2], [1, M0], [9, M4], [1, M0], [1, M0],
  [105, Ma], [1, M0], [1, M0], [3, M1], [1, M0], [5, M2], [9, M4], [7, M3], [1, M0], [3, M1], [5, M2], [1, M0], [3, M1], [1, M0], [7, M3],
  [45, M8], [1, M0], [1, M0], [3, M1], [1, M0], [5, M2], [21, M6], [1, M0], [1, M0], [9, M4], [5, M2], [1, M0], [3, M1], [7, M3], [1, M0],
  [15, M5], [1, M0], [1, M0], [9, M4], [1, M0], [35, M7], [3, M1], [1, M0], [1, M0], [3, M1], [5, M2], [1, M0], [63, M9], [1, M0], [1, M0],
  [15, M5], [1, M0], [1, M0], [3, M1], [7, M3], [5, M2], [9, M4], [1, M0], [1, M0], [3, M1], [5, M2], [7, M3], [3, M1], [1, M0], [1, M0],
  [45, M8], [1, M0], [1, M0], [21, M6], [1, M0], [5, M2], [3, M1], [1, M0], [1, M0], [9, M4], [35, M7], [1, M0], [3, M1], [1, M0], [1, M0],
  [15, M5], [1, M0], [7, M3], [9, M4], [1, M0], [5, M2], [3, M1], [1, M0], [1, M0], [21, M6], [5, M2], [1, M0], [9, M4], [1, M0], [1, M0],
  [15, M5], [7, M3], [1, M0], [3, M1], [1, M0], [5, M2], [9, M4], [1, M0], [7, M3], [3, M1], [5, M2], [1, M0], [3, M1], [1, M0], [1, M0]
];

const BIG_LOOKUP: [bigint, Monzo][] = MONZO_LOOKUP.map(l => [
  BigInt(l[0]),
  l[1],
]);

// XXX: Not resistant to zero, check your inputs.
function intToMonzo7(n: number): [Monzo, number] {
  const result = [0, 0, 0, 0];
  if (n < BIT_MAGIC_LIMIT) {
    // Bit-magic for small 2-limit
    const twos = (n ^ (n - 1)) & n;
    n /= twos;
    // IEEE 754 guarantees that this works,
    // and it's the fastest way I know that works in JS.
    result[0] = Math.log2(twos);
  } else {
    while (!(n % 2)) {
      result[0]++;
      n /= 2;
    }
  }
  while (true) {
    const [factor, m] = MONZO_LOOKUP[n % 315];
    if (factor === 1) {
      break;
    }
    n /= factor;
    result[1] += m[1];
    result[2] += m[2];
    result[3] += m[3];
  }
  return [result, n];
}

// XXX: Not resistant to zero, check your inputs.
function bigIntToMonzo7(n: bigint): [Monzo, bigint] {
  const result = [0, 0, 0, 0];
  // Factors of two using bit magic
  const twos = (n ^ (n - 1n)) & n;
  n /= twos;
  // IEEE 754 guarantees that this works up to n = 2n ** 1023n
  result[0] += Math.log2(Number(twos));

  // Absurd inputs require absurd solutions
  if (result[0] === Infinity) {
    result[0] = 0;
    let probe = 1n;
    while (probe < twos) {
      result[0]++;
      probe <<= 1n;
    }
  }

  while (true) {
    const [factor, m] = BIG_LOOKUP[Number(n % 315n)];
    if (factor === 1n) {
      break;
    }
    n /= factor;
    result[1] += m[1];
    result[2] += m[2];
    result[3] += m[3];
  }
  return [result, n];
}

// Condition: m, n < 2**30
function modMul(m: number, n: number, modulus: number) {
  let result = 0;
  let current = m;
  while (n) {
    if (n & 1) {
      result = (result + current) % modulus;
    }
    current = (current << 1) % modulus;
    n >>= 1;
  }
  return result;
}

function pollardRhoStep(n: number, p: number, seed = 1) {
  // n² + s mod p
  return modMul(n, n, p) + seed;
}

// Condition: n !== 1
function pollardRhoFactor(n: number, seed = 2, stepSeed = 1) {
  let x = seed;
  let y = x;
  let d = 1;
  while (d === 1) {
    x = pollardRhoStep(x, n, stepSeed);
    y = pollardRhoStep(pollardRhoStep(y, n, stepSeed), n, stepSeed);
    d = gcd(Math.abs(x - y), n);
  }
  return d;
}

// Condition n ∈ 7-limit residue
// Checked up to 20000000.
function rhoCascade(n: number) {
  let factor = pollardRhoFactor(n);
  if (factor === n) {
    factor = pollardRhoFactor(n, 3);
    if (factor === n) {
      factor = pollardRhoFactor(n, 9);
      if (factor === n) {
        factor = pollardRhoFactor(n, 4, 2);
        if (factor === n) {
          return pollardRhoFactor(n, 1, 2);
        }
      }
    }
  }
  return factor;
}

/**
 * Factorize a number into a `Map` instace with prime numbers as keys and their multiplicity as values.
 * @param value Rational number to factorize.
 * @returns A sparse monzo.
 */
export function primeFactorize(value: FractionValue): Map<number, number> {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    const {s, n, d} = new Fraction(value);
    const nResult = primeFactorize(s * n);
    const dResult = primeFactorize(d);
    for (const [prime, exponent] of dResult) {
      nResult.set(prime, -exponent);
    }
    return nResult;
  }
  const result: Map<number, number> = new Map();
  if (value === 0) {
    result.set(0, 1);
    return result;
  } else if (value < 0) {
    result.set(-1, 1);
    value = -value;
  }
  if (value > 1073741823) {
    throw new Error('Factorization not implemented above 1073741823.');
  }
  let [monzo, residual] = intToMonzo7(value);
  for (let i = 0; i < monzo.length; ++i) {
    if (monzo[i]) {
      result.set(PRIMES[i], monzo[i]);
    }
  }
  // This is entirely ad. hoc. with holes patched as they came up during fuzzing.
  while (residual !== 1) {
    let factor = rhoCascade(residual);
    residual /= factor;
    let subFactor = rhoCascade(factor);
    if (subFactor === factor) {
      result.set(factor, (result.get(factor) ?? 0) + 1);
    } else {
      while (factor !== subFactor) {
        if (subFactor === 901) {
          result.set(17, (result.get(17) ?? 0) + 1);
          result.set(53, (result.get(53) ?? 0) + 1);
        } else if (subFactor === 1241) {
          result.set(17, (result.get(17) ?? 0) + 1);
          result.set(73, (result.get(73) ?? 0) + 1);
        } else if (subFactor === 1681) {
          result.set(41, (result.get(41) ?? 0) + 2);
        } else if (subFactor === 3149) {
          result.set(47, (result.get(47) ?? 0) + 1);
          result.set(67, (result.get(67) ?? 0) + 1);
        } else if (subFactor === 3869) {
          result.set(53, (result.get(53) ?? 0) + 1);
          result.set(73, (result.get(73) ?? 0) + 1);
        } else if (subFactor === 65773) {
          result.set(17, (result.get(17) ?? 0) + 1);
          result.set(53, (result.get(53) ?? 0) + 1);
          result.set(73, (result.get(73) ?? 0) + 1);
        } else {
          result.set(subFactor, (result.get(subFactor) ?? 0) + 1);
        }
        factor /= subFactor;
        subFactor = rhoCascade(factor);
      }
      result.set(factor, (result.get(factor) ?? 0) + 1);
    }
  }
  return result;
}
