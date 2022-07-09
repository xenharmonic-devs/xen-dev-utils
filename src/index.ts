import FractionJS, {NumeratorDenominator} from 'fraction.js';

export * from './primes';
export * from './conversion';

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
 * closer than any approximation with a smaller or equal denominator.
 * @param value The fraction to simplify.
 * @param maxDenominator Maximum denominator to include.
 * @param maxLength Maximum length of the array of approximations.
 * @param includeNonMonotonic Include non-monotonically improving approximations.
 * @returns An array of semiconvergents.
 */
export function getSemiconvergents(
  value: FractionValue,
  maxDenominator?: number,
  maxLength?: number,
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
    // calculate the convergent
    for (let i = d; i > 0; i--) {
      [den, num] = [num, den];
      num += den * cf[i - 1];
    }
    if (d > 0) {
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
