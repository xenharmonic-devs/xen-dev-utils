import FractionJS, {NumeratorDenominator} from 'fraction.js';
import {valueToCents} from './conversion';
import {PRIMES, PRIME_CENTS} from './primes';

export * from './primes';
export * from './conversion';
export * from './combinations';

// Subclass Fraction to remove default export status.
/**
 *
 * This class offers the possibility to calculate fractions.
 * You can pass a fraction in different formats: either as an array, an integer, a floating point number or a string.
 *
 * Array/Object form
 * ```ts
 * new Fraction([numerator, denominator]);
 * new Fraction(numerator, denominator);
 * ```
 *
 * Integer form
 * ```ts
 * new Fraction(numerator);
 * ```
 *
 * Floating point form
 * ```ts
 * new Fraction(value);
 * ```
 *
 * String form
 * ```ts
 * new Fraction("123.456");  // a simple decimal
 * new Fraction("123/456");  // a string fraction
 * new Fraction("123.'456'");  // repeating decimal places
 * new Fraction("123.(456)");  // synonym
 * new Fraction("123.45'6'");  // repeating last place
 * new Fraction("123.45(6)");  // synonym
 * ```
 * Example:
 * ```ts
 * const fraction = new Fraction("9.4'31'");
 * fraction.mul([-4, 3]).div(4.9)  // -37348/14553
 * ```
 *
 */
export class Fraction extends FractionJS {}

// Explicitly drop [number, number] because it overlaps with monzos
export type FractionValue =
  | Fraction
  | number
  | string
  | [string, string]
  | NumeratorDenominator;

export interface AnyArray {
  [key: number]: any;
  length: number;
}

export interface NumberArray {
  [key: number]: number;
  length: number;
}

/**
 * Check if the contents of two arrays are equal using '==='.
 * @param a The first array.
 * @param b The second array.
 * @returns True if the arrays are component-wise equal.
 */
export function arraysEqual(a: AnyArray, b: AnyArray) {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

// Stolen from fraction.js, because it's not exported.
/**
 * Greatest common divisor of two integers.
 * @param a The first integer.
 * @param b The second integer.
 * @returns The largest integer that divides a and b.
 */
export function gcd(a: number, b: number): number {
  if (!a) return b;
  if (!b) return a;
  while (true) {
    a %= b;
    if (!a) return b;
    b %= a;
    if (!b) return a;
  }
}

/**
 * Least common multiple of two integers.
 * @param a The first integer.
 * @param b The second integer.
 * @returns The smallest integer that both a and b divide.
 */
export function lcm(a: number, b: number): number {
  return (Math.abs(a) / gcd(a, b)) * Math.abs(b);
}

/**
 * Mathematically correct modulo.
 * @param a The dividend.
 * @param b The divisor.
 * @returns The remainder of Euclidean division of a by b.
 */
export function mmod(a: number, b: number) {
  return ((a % b) + b) % b;
}

/**
 * Floor division.
 * @param a The dividend.
 * @param b The divisor.
 * @returns The quotient of Euclidean division of a by b.
 */
export function div(a: number, b: number): number {
  return Math.floor(a / b);
}

/** Result of the extended Euclidean algorithm. */
export type ExtendedEuclid = {
  /** Bézout coefficient of the first parameter.  */
  coefA: number;
  /** Bézout coefficient of the second parameter.  */
  coefB: number;
  /** Greatest common divisor of the parameters. */
  gcd: number;
  /** Quotient of the first parameter when divided by the gcd */
  quotientA: number;
  /** Quotient of the second parameter when divided by the gcd */
  quotientB: number;
};

// https://en.wikipedia.org/wiki/Extended_Euclidean_algorithm#Pseudocode
/**
 * Extended Euclidean algorithm for integers a and b:
 * Find x and y such that ax + by = gcd(a, b).
 * ```ts
 * result.gcd = a * result.coefA + b * result.coefB;  // = gcd(a, b)
 * result.quotientA = div(a, gcd(a, b));
 * result.quotientB = div(b, gcd(a, b));
 * ```
 * @param a The first integer.
 * @param b The second integer.
 * @returns Bézout coefficients, gcd and quotients.
 */
export function extendedEuclid(a: number, b: number): ExtendedEuclid {
  if (isNaN(a) || isNaN(b)) {
    throw new Error('Invalid input');
  }

  let [rOld, r] = [a, b];
  let [sOld, s] = [1, 0];
  let [tOld, t] = [0, 1];

  while (r !== 0) {
    const quotient = div(rOld, r);
    [rOld, r] = [r, rOld - quotient * r];
    [sOld, s] = [s, sOld - quotient * s];
    [tOld, t] = [t, tOld - quotient * t];
  }

  return {
    coefA: sOld,
    coefB: tOld,
    gcd: rOld,
    quotientA: t,
    quotientB: Math.abs(s),
  };
}

/**
 * Iterated (extended) Euclidean algorithm.
 * @param params An iterable of integers.
 * @returns Bézout coefficients of the parameters.
 */
export function iteratedEuclid(params: Iterable<number>) {
  const coefs = [];
  let a: number | undefined = undefined;
  for (const param of params) {
    if (a === undefined) {
      a = param;
      coefs.push(1);
      continue;
    }
    const ee = extendedEuclid(a, param);
    for (let j = 0; j < coefs.length; ++j) {
      coefs[j] *= ee.coefA;
    }
    a = ee.gcd;
    coefs.push(ee.coefB);
  }
  return coefs;
}

/**
 * Calculate best rational approximations to a given fraction that are
 * closer than any approximation with a smaller or equal denominator
 * unless non-monotonic approximations are requested as well.
 * @param value The fraction to simplify.
 * @param maxDenominator Maximum denominator to include.
 * @param maxLength Maximum length of the array of approximations.
 * @param includeSemiconvergents Include semiconvergents.
 * @param includeNonMonotonic Include non-monotonically improving approximations.
 * @returns An array of (semi)convergents.
 */
export function getConvergents(
  value: FractionValue,
  maxDenominator?: number,
  maxLength?: number,
  includeSemiconvergents = false,
  includeNonMonotonic = false
) {
  const value_ = new Fraction(value);
  /*
    Glossary
      cfDigit : the continued fraction digit
      num : the convergent numerator
      den : the convergent denominator
      scnum : the semiconvergent numerator
      scden : the semiconvergen denominator
      cind : tracks indicies of convergents
  */
  const result: Fraction[] = [];
  const cf = value_.toContinued();
  const cind: number[] = [];
  for (let d = 0; d < cf.length; d++) {
    const cfDigit = cf[d];
    let num = cfDigit;
    let den = 1;
    // Calculate the convergent.
    for (let i = d; i > 0; i--) {
      [den, num] = [num, den];
      num += den * cf[i - 1];
    }
    if (includeSemiconvergents && d > 0) {
      const lowerBound = includeNonMonotonic ? 1 : Math.ceil(cfDigit / 2);
      for (let i = lowerBound; i < cfDigit; i++) {
        const scnum = num - (cfDigit - i) * result[cind[d - 1]].n;
        const scden = den - (cfDigit - i) * result[cind[d - 1]].d;
        if (scden > maxDenominator!) break;
        const convergent = new Fraction(scnum, scden);
        if (includeNonMonotonic) {
          result.push(convergent);
        } else {
          // See https://en.wikipedia.org/wiki/Continued_fraction#Semiconvergents
          // for the origin of this half-rule
          if (2 * i > cfDigit) {
            result.push(convergent);
          } else if (
            convergent
              .sub(value_)
              .abs()
              .compare(result[result.length - 1].sub(value_).abs()) < 0
          ) {
            result.push(convergent);
          }
        }
        if (result.length >= maxLength!) {
          return result;
        }
      }
    }
    if (den > maxDenominator!) break;
    cind.push(result.length);
    result.push(new Fraction(num, den));
    if (result.length >= maxLength!) {
      return result;
    }
  }
  return result;
}

/**
 * Collection of unique fractions.
 */
export class FractionSet extends Set<Fraction> {
  /**
   * Check `value` membership.
   * @param value Value to check for membership.
   * @returns A boolean asserting whether an element is present with the given value in the `FractionSet` object or not.
   */
  has(value: Fraction) {
    for (const other of this) {
      if (other.equals(value)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Appends `value` to the `FractionSet` object.
   * @param value Value to append.
   * @returns The `FractionSet` object with added value.
   */
  add(value: Fraction) {
    if (this.has(value)) {
      return this;
    }
    super.add(value);
    return this;
  }

  /**
   * Removes the element associated to the `value`.
   * @param value Value to remove.
   * @returns A boolean asserting whether an element was successfully removed or not. `FractionSet.prototype.has(value)` will return `false` afterwards.
   */
  delete(value: Fraction) {
    for (const other of this) {
      if (other.equals(value)) {
        return super.delete(other);
      }
    }
    return false;
  }
}

// https://stackoverflow.com/a/37716142
// step 1: a basic LUT with a few steps of Pascal's triangle
const BINOMIALS = [
  [1],
  [1, 1],
  [1, 2, 1],
  [1, 3, 3, 1],
  [1, 4, 6, 4, 1],
  [1, 5, 10, 10, 5, 1],
  [1, 6, 15, 20, 15, 6, 1],
  [1, 7, 21, 35, 35, 21, 7, 1],
  [1, 8, 28, 56, 70, 56, 28, 8, 1],
];

// step 2: a function that builds out the LUT if it needs to.
/**
 * Calculate the Binomial coefficient *n choose k*.
 * @param n Size of the set to choose from.
 * @param k Number of elements to choose.
 * @returns The number of ways to choose `k` (unordered) elements from a set size `n`.
 */
export function binomial(n: number, k: number) {
  while (n >= BINOMIALS.length) {
    const s = BINOMIALS.length;
    const lastRow = BINOMIALS[s - 1];
    const nextRow = [1];
    for (let i = 1; i < s; i++) {
      nextRow.push(lastRow[i - 1] + lastRow[i]);
    }
    nextRow.push(1);
    BINOMIALS.push(nextRow);
  }
  return BINOMIALS[n][k];
}

/**
 * Clamp a value to a finite range.
 * @param minValue Lower bound.
 * @param maxValue Upper bound.
 * @param value Value to clamp between bounds.
 * @returns Clamped value.
 */
export function clamp(minValue: number, maxValue: number, value: number) {
  if (value < minValue) {
    return minValue;
  }
  if (value > maxValue) {
    return maxValue;
  }
  return value;
}

// Cache of odd limit fractions. Expanded as necessary.
const ODD_FRACTIONS = [new Fraction(1), new Fraction(1, 3), new Fraction(3)];
const ODD_CENTS = [0, -PRIME_CENTS[1], PRIME_CENTS[1]];
const ODD_BREAKPOINTS = [1, 3];
const TWO = new Fraction(2);

/**
 * Approximate a musical interval by ratios of which neither the numerator or denominator
 * exceeds a specified limit, once all powers of 2 are removed.
 * @param cents Size of the musical interval measured in cents.
 * @param limit Maximum odd limit.
 * @returns All odd limit fractions within 600 cents of the input value sorted by closeness with cent offsets attached.
 */
function approximateOddLimitWithErrors(cents: number, limit: number) {
  const breakpointIndex = (limit - 1) / 2;
  // Expand cache.
  while (ODD_BREAKPOINTS.length <= breakpointIndex) {
    const newLimit = ODD_BREAKPOINTS.length * 2 + 1;
    for (let numerator = 1; numerator <= newLimit; numerator += 2) {
      for (let denominator = 1; denominator <= newLimit; denominator += 2) {
        const fraction = new Fraction(numerator, denominator);
        let novel = true;
        for (let i = 0; i < ODD_FRACTIONS.length; ++i) {
          if (fraction.equals(ODD_FRACTIONS[i])) {
            novel = false;
            break;
          }
        }
        if (novel) {
          ODD_FRACTIONS.push(fraction);
          ODD_CENTS.push(valueToCents(fraction.valueOf()));
        }
      }
    }
    ODD_BREAKPOINTS.push(ODD_FRACTIONS.length);
  }

  // Find closest odd limit fractions modulo octaves.
  const results: [Fraction, number][] = [];
  for (let i = 0; i < ODD_BREAKPOINTS[breakpointIndex]; ++i) {
    const oddCents = ODD_CENTS[i];
    const remainder = mmod(cents - oddCents, 1200);
    // Overshot
    if (remainder <= 600) {
      // Rounding done to eliminate floating point jitter.
      const exponent = Math.round((cents - oddCents - remainder) / 1200);
      const error = remainder;
      // Exponentiate to add the required number of octaves.
      results.push([ODD_FRACTIONS[i].mul(TWO.pow(exponent)), error]);
    }
    // Undershot
    else {
      const exponent = Math.round((cents - oddCents - remainder) / 1200) + 1;
      const error = 1200 - remainder;
      results.push([ODD_FRACTIONS[i].mul(TWO.pow(exponent)), error]);
    }
  }

  results.sort((a, b) => a[1] - b[1]);

  return results;
}

/**
 * Approximate a musical interval by ratios of which neither the numerator or denominator
 * exceeds a specified limit, once all powers of 2 are removed.
 * @param cents Size of the musical interval measured in cents.
 * @param limit Maximum odd limit.
 * @returns All odd limit fractions within 600 cents of the input value sorted by closeness.
 */
export function approximateOddLimit(cents: number, limit: number) {
  return approximateOddLimitWithErrors(cents, limit).map(result => result[0]);
}

/**
 * Approximate a musical interval by ratios of which are within a prime limit with
 * exponents that do not exceed the maximimum, exponent of 2 ignored.
 * @param cents Size of the musical interval measured in cents.
 * @param limitIndex The ordinal of the prime of the limit.
 * @param maxError Maximum error from the interval for inclusion in the result.
 * @returns All valid fractions within `maxError` cents of the input value sorted by closeness with cent offsets attached.
 */
export function approximatePrimeLimitWithErrors(
  cents: number,
  limitIndex: number,
  maxExponent: number,
  maxError = 600
) {
  if (maxError > 600) {
    throw new Error('Maximum search distance is 600 cents');
  }
  const results: [Fraction, number][] = [];
  function accumulate(
    approximation: Fraction,
    approximationCents: number,
    index: number
  ) {
    if (index > limitIndex) {
      // Procedure is the same as in approximateOddLimitWithErrors
      const remainder = mmod(cents - approximationCents, 1200);
      if (remainder <= 600) {
        const error = remainder;
        if (error > maxError) {
          return;
        }
        const exponent = Math.round(
          (cents - approximationCents - remainder) / 1200
        );
        results.push([approximation.mul(TWO.pow(exponent)), error]);
      } else {
        const error = 1200 - remainder;
        if (error > maxError) {
          return;
        }
        const exponent =
          Math.round((cents - approximationCents - remainder) / 1200) + 1;
        results.push([approximation.mul(TWO.pow(exponent)), error]);
      }
      return;
    }
    approximation = approximation.div(PRIMES[index] ** maxExponent);
    approximationCents -= PRIME_CENTS[index] * maxExponent;
    for (let i = -maxExponent; i <= maxExponent; ++i) {
      accumulate(approximation, approximationCents, index + 1);
      approximation = approximation.mul(PRIMES[index]);
      approximationCents += PRIME_CENTS[index];
    }
  }
  accumulate(new Fraction(1), 0, 1);

  results.sort((a, b) => a[1] - b[1]);

  return results;
}

/**
 * Approximate a musical interval by ratios of which are within a prime limit with
 * exponents that do not exceed the maximimum, exponent of 2 ignored.
 * @param cents Size of the musical interval measured in cents.
 * @param limitIndex The ordinal of the prime of the limit.
 * @param maxError Maximum error from the interval for inclusion in the result.
 * @returns All valid fractions within `maxError` cents of the input value sorted by closenesss.
 */
export function approximatePrimeLimit(
  cents: number,
  limitIndex: number,
  maxExponent: number,
  maxError = 600
) {
  return approximatePrimeLimitWithErrors(
    cents,
    limitIndex,
    maxExponent,
    maxError
  ).map(result => result[0]);
}

/**
 * Calculate the prime limit of an integer or a fraction.
 * @param n Integer or fraction to calculate prime limit for.
 * @param maxLimit Maximum prime limit to consider.
 * @returns The largest prime in the factorization of the input. `Infinity` if above the maximum limit. `NaN` if not applicable.
 */
export function primeLimit(n: FractionValue, maxLimit = 7919): number {
  if (typeof n !== 'number') {
    n = new Fraction(n);
    return Math.max(primeLimit(n.n), primeLimit(n.d));
  }
  if (n < 1 || Math.round(n) !== n) {
    return NaN;
  }
  if (n === 1) {
    return 1;
  }
  // Bit-magic for 2-limit
  while (!(n & 1)) {
    n >>= 1;
  }
  if (n === 1) {
    return 2;
  }

  // Accumulate increasingly complex factors into the probe
  // until it reaches the input value with factors of two removed.
  let probe = 1;
  let limitIndex = 1;

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
