import {valueToCents} from './conversion';
import {Fraction, FractionValue, mmod} from './fraction';
import {PRIMES, PRIME_CENTS} from './primes';

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
export function approximateOddLimitWithErrors(cents: number, limit: number) {
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
      results.push([ODD_FRACTIONS[i].mul(TWO.pow(exponent)!), error]);
    }
    // Undershot
    else {
      const exponent = Math.round((cents - oddCents - remainder) / 1200) + 1;
      const error = 1200 - remainder;
      results.push([ODD_FRACTIONS[i].mul(TWO.pow(exponent)!), error]);
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
 * @param maxLength Maximum number of approximations to return.
 * @returns All valid fractions within `maxError` cents of the input value sorted by closeness with cent offsets attached.
 */
export function approximatePrimeLimitWithErrors(
  cents: number,
  limitIndex: number,
  maxExponent: number,
  maxError = 600,
  maxLength?: number
) {
  if (maxError > 600) {
    throw new Error('Maximum search distance is 600 cents');
  }
  const results: [Fraction, number][] = [];

  function push(error: number, generator: () => Fraction) {
    if (maxLength === undefined || results.length < maxLength) {
      results.push([generator(), error]);
      if (results.length === maxLength) {
        results.sort((a, b) => a[1] - b[1]);
      }
    } else {
      if (error > results[results.length - 1][1]) {
        return;
      }
      for (let index = results.length - 1; ; index--) {
        if (error <= results[index][1]) {
          results.splice(index, 0, [generator(), error]);
          break;
        }
      }
      results.pop();
    }
  }

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
        push(error, () =>
          approximation.mul(
            TWO.pow(
              Math.round((cents - approximationCents - remainder) / 1200)
            )!
          )
        );
      } else {
        const error = 1200 - remainder;
        if (error > maxError) {
          return;
        }
        push(error, () =>
          approximation.mul(
            TWO.pow(
              Math.round((cents - approximationCents - remainder) / 1200) + 1
            )!
          )
        );
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
 * @param maxLength Maximum number of approximations to return.
 * @returns All valid fractions within `maxError` cents of the input value sorted by closenesss.
 */
export function approximatePrimeLimit(
  cents: number,
  limitIndex: number,
  maxExponent: number,
  maxError = 600,
  maxLength?: number
) {
  return approximatePrimeLimitWithErrors(
    cents,
    limitIndex,
    maxExponent,
    maxError,
    maxLength
  ).map(result => result[0]);
}
