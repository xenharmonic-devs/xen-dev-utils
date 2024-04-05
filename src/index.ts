import {Fraction, mmod} from './fraction';

export * from './fraction';
export * from './primes';
export * from './conversion';
export * from './combinations';
export * from './monzo';
export * from './approximation';

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

/**
 * Calculate the inner (dot) product of two arrays of real numbers.
 * @param a The first array of numbers.
 * @param b The second array of numbers.
 * @returns The dot product.
 */
export function dot(a: NumberArray, b: NumberArray): number {
  let result = 0;
  for (let i = 0; i < Math.min(a.length, b.length); ++i) {
    result += a[i] * b[i];
  }
  return result;
}

/**
 * Calculate the norm (vector length) of an array of real numbers.
 * @param array The array to measure.
 * @param type Type of measurement.
 * @returns The length of the vector.
 */
export function norm(
  array: NumberArray,
  type: 'euclidean' | 'taxicab' | 'maximum' = 'euclidean'
) {
  let result = 0;
  for (let i = 0; i < array.length; ++i) {
    if (type === 'taxicab') {
      result += Math.abs(array[i]);
    } else if (type === 'maximum') {
      result = Math.max(result, Math.abs(array[i]));
    } else {
      result += array[i] * array[i];
    }
  }
  if (type === 'euclidean') {
    return Math.sqrt(result);
  }
  return result;
}

/**
 * Calculate the difference between two cents values such that equave equivalence is taken into account.
 * @param a The first pitch measured in cents.
 * @param b The second pitch measured in cents.
 * @param equaveCents The interval of equivalence measured in cents.
 * @returns The first pitch minus the second pitch but on a circle such that large differences wrap around.
 */
export function circleDifference(a: number, b: number, equaveCents = 1200.0) {
  const half = 0.5 * equaveCents;
  return mmod(a - b + half, equaveCents) - half;
}

/**
 * Calculate the distance between two cents values such that equave equivalence is taken into account.
 * @param a The first pitch measured in cents.
 * @param b The second pitch measured in cents.
 * @param equaveCents The interval of equivalence measured in cents.
 * @returns The absolute distance between the two pitches measured in cents but on a circle such that large distances wrap around.
 */
export function circleDistance(a: number, b: number, equaveCents = 1200.0) {
  return Math.abs(circleDifference(a, b, equaveCents));
}

/**
 * Calculate the smallest power of two greater or equal to the input value.
 * @param x Value to compare to.
 * @returns Smallest `2**n` such that `x <= 2**n`.
 */
export function ceilPow2(x: number) {
  if (x >= 1 && x < 0x40000000) {
    return 1 << (32 - Math.clz32(x - 1));
  }
  if (x <= 0) {
    return 0;
  }
  return 2 ** Math.ceil(Math.log2(x));
}

/**
 * Create an iterator over the n'th Farey sequence. (All fractions between 0 and 1 inclusive.)
 * @param maxDenominator Maximum denominator in the sequence.
 * @yields Fractions in ascending order starting from 0/1 and ending at 1/1.
 */
export function* fareySequence(
  maxDenominator: number
): Generator<Fraction, undefined, undefined> {
  let a = 0;
  let b = 1;
  let c = 1;
  let d = maxDenominator;
  yield new Fraction(a, b);
  while (0 <= c && c <= maxDenominator) {
    const k = Math.floor((maxDenominator + b) / d);
    [a, b, c, d] = [c, d, k * c - a, k * d - b];
    yield new Fraction(a, b);
  }
}

/**
 * Create an iterator over the interior of n'th Farey sequence. (All fractions between 0 and 1 exclusive.)
 * @param maxDenominator Maximum denominator in the sequence.
 * @yields Fractions in ascending order starting from 1/maxDenominator and ending at (maxDenominator-1)/maxDenominator.
 */
export function* fareyInterior(
  maxDenominator: number
): Generator<Fraction, undefined, undefined> {
  if (maxDenominator < 2) {
    return;
  }
  let a = 1;
  let b = maxDenominator;
  let c = 1;
  let d = maxDenominator - 1;
  yield new Fraction(a, b);
  while (d > 1) {
    const k = Math.floor((maxDenominator + b) / d);
    [a, b, c, d] = [c, d, k * c - a, k * d - b];
    yield new Fraction(a, b);
  }
}

/**
 * Determine if an equally tempered scale has constant structure i.e. you can tell the interval class from the size of an interval.
 * @param steps Musical intervals measured in steps not including the implicit 0 at the start, but including the interval of repetition at the end.
 * @returns A pair of pairs of indices that have the same stepspan but different subtension. `null` if the scale has constant structure.
 */
export function falsifyConstantStructure(
  steps: number[]
): [[number, number], [number, number]] | null {
  const n = steps.length;
  if (!n) {
    return null;
  }
  const period = steps[n - 1];
  const scale = [...steps];
  for (const step of steps) {
    scale.push(period + step);
  }

  // Map from interval sizes to pairs of [index, subtension]
  const subtensions = new Map<number, [number, number]>();

  // Against implicit unison
  for (let i = 0; i < n; i++) {
    if (subtensions.has(scale[i])) {
      return [subtensions.get(scale[i])!, [-1, i + 1]];
    }
    subtensions.set(scale[i], [-1, i + 1]);
  }

  // Against each other
  for (let i = 0; i < n - 1; ++i) {
    for (let j = 1; j < n; ++j) {
      const width = scale[i + j] - scale[i];
      if (subtensions.has(width)) {
        const [k, l] = subtensions.get(width)!;
        if (j !== l) {
          return [
            [k, k + l],
            [i, i + j],
          ];
        }
      }
      // Add the observed width to the collection
      subtensions.set(width, [i, j]);
    }
  }
  return null;
}

/**
 * Determine if a scale has constant structure i.e. you can tell the interval class from the size of an interval.
 * @param scaleCents Musical intervals measured in cents not including the implicit 0 at the start, but including the interval of repetition at the end.
 * @param margin Margin of equivalence between two intervals measured in cents.
 * @returns `true` if the scale definitely has constant structure. (A `false` result may convert to `true` using a smaller margin.)
 */
export function hasMarginConstantStructure(
  scaleCents: number[],
  margin: number
) {
  const n = scaleCents.length;
  if (!n) {
    return true;
  }
  const period = scaleCents[n - 1];
  const scale = [...scaleCents];
  for (const cents of scaleCents) {
    scale.push(period + cents);
  }

  // Map from interval sizes to (zero-indexed) interval classes a.k.a. subtensions
  const subtensions = new Map<number, number>();

  // Against unison
  for (let i = 0; i < n; i++) {
    // Check for margin equivalence
    for (const existing of subtensions.keys()) {
      if (Math.abs(existing - scale[i]) <= margin) {
        return false;
      }
    }
    subtensions.set(scale[i], i + 1);
  }

  // Against each other
  for (let i = 0; i < n - 1; ++i) {
    for (let j = 1; j < n; ++j) {
      const width = scale[i + j] - scale[i];
      // Try to get lucky with an exact match
      if (subtensions.has(width) && subtensions.get(width) !== j) {
        return false;
      }
      // Check for margin equivalence
      for (const [existing, subtension] of subtensions.entries()) {
        if (subtension === j) {
          continue;
        }
        if (Math.abs(existing - width) <= margin) {
          return false;
        }
      }
      // Add the observed width to the collection
      subtensions.set(width, j);
    }
  }
  return true;
}
