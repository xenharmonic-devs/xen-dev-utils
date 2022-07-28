import {Fraction, FractionValue} from './fraction';
import {LOG_PRIMES, PRIMES} from './primes';

/**
 * Array of integers representing the exponents of prime numbers in the unique factorization of a rational number.
 */
export type Monzo = number[];

/**
 * Check if two monzos are equal.
 * @param a The first monzo.
 * @param b The first monzo.
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
 * Extract the exponents of the prime factors of a rational number.
 * @param n Rational number to convert to a monzo.
 * @returns The monzo representing `n`.
 */
export function toMonzo(n: FractionValue): Monzo {
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

/**
 * Extract the exponents of the prime factors of a rational number.
 * @param n Rational number to convert to a monzo.
 * @param numberOfComponents Number of components in the result.
 * @returns The monzo representing `n` and a multiplicative residue that cannot be represented in the given limit.
 */
export function toMonzoAndResidual(
  n: FractionValue,
  numberOfComponents: number
): [Monzo, Fraction] {
  n = new Fraction(n);
  const numerator = n.n;
  const denominator = n.d;

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
 * Calculate the prime limit of an integer or a fraction.
 * @param n Integer or fraction to calculate prime limit for.
 * @param maxLimit Maximum prime limit to consider.
 * @returns The largest prime in the factorization of the input. `Infinity` if above the maximum limit. `NaN` if not applicable.
 */
export function primeLimit(n: FractionValue, maxLimit = 7919): number {
  if (typeof n !== 'number') {
    n = new Fraction(n);
    return Math.max(primeLimit(n.n, maxLimit), primeLimit(n.d, maxLimit));
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
    probe = (n ^ (n - 1)) & n;
    if (n === probe) {
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

/** Value that represents a rational number and can be normalized into a monzo. */
export type MonzoValue = Monzo | FractionValue;

/**
 * Normalize value into a monzo.
 * @param value Rational number as a number, string, fraction or a monzo.
 * @returns An array of exponents of prime numbers.
 */
export function resolveMonzo(value: MonzoValue): Monzo {
  if (
    Array.isArray(value) &&
    !(value.length === 2 && typeof value[0] === 'string')
  ) {
    return value as Monzo;
  } else {
    return toMonzo(value as FractionValue);
  }
}

function taxicab(monzo: Monzo, start = 0) {
  return monzo.slice(start).reduce((a, b) => Math.abs(a) + Math.abs(b));
}

function positiveTenney(monzo: Monzo, start = 0) {
  return monzo
    .slice(start)
    .map((component, index) => Math.max(0, component) * LOG_PRIMES[index])
    .reduce((a, b) => a + b);
}

function negativeTenney(monzo: Monzo, start = 0) {
  return monzo
    .slice(start)
    .map((component, index) => Math.max(0, -component) * LOG_PRIMES[index])
    .reduce((a, b) => a + b);
}

function basisSpell(monzo: Monzo, basis: Monzo[], searchBreadth: number) {
  // Find and apply breadth=1 simplifications using a cheap metric
  const basisMonzo = Array(basis.length).fill(0);
  let distance = taxicab(monzo);
  let done;
  do {
    done = true;
    for (let i = 0; i < basis.length; ++i) {
      let candidate = add(monzo, basis[i]);
      let candidateDistance = taxicab(candidate);
      if (candidateDistance < distance) {
        monzo = candidate;
        basisMonzo[i]++;
        distance = candidateDistance;
        done = false;
        continue;
      }
      candidate = sub(monzo, basis[i]);
      candidateDistance = taxicab(candidate);
      if (candidateDistance < distance) {
        monzo = candidate;
        basisMonzo[i]--;
        distance = candidateDistance;
        done = false;
      }
    }
  } while (!done);

  const best = [...basisMonzo];
  const result = {
    minNumerator: best,
    minDenominator: best,
    minBenedetti: best,
  };

  let positive = positiveTenney(monzo);
  let negative = negativeTenney(monzo);
  let error = positive + negative;
  let positiveTiebreak = negative;
  let negativeTiebreak = positive;

  function search(accumulator: Monzo, bMonzo: Monzo, index: number) {
    if (index >= basis.length) {
      const candidatePositive = positiveTenney(accumulator);
      const candidateNegative = negativeTenney(accumulator);
      const candidateError = candidatePositive + candidateNegative;
      if (
        candidatePositive < positive ||
        (candidatePositive === positive && candidateNegative < positiveTiebreak)
      ) {
        result.minNumerator = bMonzo;
        positive = candidatePositive;
        positiveTiebreak = candidateNegative;
      }
      if (
        candidateNegative < negative ||
        (candidateNegative === negative && candidatePositive < negativeTiebreak)
      ) {
        result.minDenominator = bMonzo;
        negative = candidateNegative;
        negativeTiebreak = candidatePositive;
      }
      if (candidateError < error) {
        result.minBenedetti = bMonzo;
        error = candidateError;
      }
      return;
    }
    search(accumulator, bMonzo, index + 1);
    for (let i = 0; i < 2 * searchBreadth; ++i) {
      accumulator = add(accumulator, basis[index]);
      bMonzo = [...bMonzo];
      bMonzo[index]++;
      search(accumulator, bMonzo, index + 1);
    }
  }

  const accumulator = [...monzo];
  for (let i = 0; i < basis.length; ++i) {
    while (accumulator.length < basis[i].length) {
      accumulator.push(0);
    }
    for (let j = 0; j < basis[i].length; ++j) {
      accumulator[j] -= basis[i][j] * searchBreadth;
    }
    basisMonzo[i] -= searchBreadth;
  }
  search(accumulator, basisMonzo, 0);

  return result;
}

/** Simple spellings of a fraction according to various criteria. */
export type Spelling = {
  /** Spelling with the least numerator. */
  minNumerator: Fraction;
  /** Spelling with the least denominator. */
  minDenominator: Fraction;
  /** Spelling with the least product of numerator and denominator. */
  minBenedetti: Fraction;
  /** Spelling with the least numerator, ignoring powers of two. */
  noTwosMinNumerator: Fraction;
  /** Spelling with the least denominator, ignoring powers of two. */
  noTwosMinDenominator: Fraction;
  /** Spelling with the least product of numerator and denominator, ignoring powers of two. */
  noTwosMinBenedetti: Fraction;
};

/**
 * Find simpler spellings of a fraction assuming that the given commas are tempered out.
 * @param fraction Fraction to simplify.
 * @param commas List of commas that should only affect the spelling, but not the pitch.
 * @param searchBreadth Half-width of the search lattice.
 * @returns Simple spellings of a fraction according to various criteria.
 */
export function spell(
  fraction: MonzoValue,
  commas: MonzoValue[],
  searchBreadth = 3
): Spelling {
  const monzo = resolveMonzo(fraction);
  const basis = commas.map(resolveMonzo);

  const fraction_ = monzoToFraction(monzo);
  const commas_ = basis.map(monzoToFraction);

  const result = basisSpell(monzo, basis, searchBreadth);

  monzo[0] = 0;
  basis.forEach(comma => (comma[0] = 0));

  const noTwosResult = basisSpell(monzo, basis, searchBreadth);

  function combine(basisMonzo: Monzo) {
    return fraction_.mul(
      basisMonzo
        .map((exponent, i) => commas_[i].pow(exponent))
        .reduce((a, b) => a.mul(b))
    );
  }

  return {
    minNumerator: combine(result.minNumerator),
    minDenominator: combine(result.minDenominator),
    minBenedetti: combine(result.minBenedetti),
    noTwosMinNumerator: combine(noTwosResult.minNumerator),
    noTwosMinDenominator: combine(noTwosResult.minDenominator),
    noTwosMinBenedetti: combine(noTwosResult.minBenedetti),
  };
}
