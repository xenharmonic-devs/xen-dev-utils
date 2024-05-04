// I'm rolling my own because fraction.js has trouble with TypeScript https://github.com/rawify/Fraction.js/issues/72
// -Lumi

import {valueToCents} from './conversion';
import {PRIMES} from './primes';

export type UnsignedFraction = {n: number; d: number};

// Explicitly drop [number, number] because it overlaps with monzos
export type FractionValue = Fraction | UnsignedFraction | number | string;

const MAX_CONTINUED_LENGTH = 1000;
const MAX_CYCLE_LENGTH = 128;

/**
 * Greatest common divisor of two integers.
 *
 * Zero is treated as the identity element: gcd(0, x) = gcd(x, 0) = x
 *
 * The sign of the result is essentially random for negative inputs.
 * @param a The first integer.
 * @param b The second integer.
 * @returns The largest integer that divides a and b.
 */
export function gcd(a: number, b: number): number;
export function gcd(a: bigint, b: bigint): bigint;
export function gcd(a: number | bigint, b: typeof a): typeof a {
  if (!a) return b;
  if (!b) return a;
  while (true) {
    // XXX: TypeScript trips up here for no reason.
    // @ts-ignore
    a %= b;
    if (!a) return b;
    // @ts-ignore
    b %= a;
    if (!b) return a;
  }
}

/**
 * Least common multiple of two integers.
 *
 * Return zero if either of the arguments is zero.
 *
 * Satisfies a * b = gcd * lcm. See {@link gcd} for consequences on negative inputs.
 * @param a The first integer.
 * @param b The second integer.
 * @returns The smallest integer that both a and b divide.
 */
export function lcm(a: number, b: number): number;
export function lcm(a: bigint, b: bigint): bigint;
export function lcm(a: number | bigint, b: typeof a): typeof a {
  // @ts-ignore
  return a ? (a / gcd(a, b)) * b : a;
}

/**
 * Mathematically correct modulo.
 * @param a The dividend.
 * @param b The divisor.
 * @returns The remainder of Euclidean division of a by b.
 */
export function mmod(a: number, b: number): number;
export function mmod(a: bigint, b: bigint): bigint;
export function mmod(a: number | bigint, b: typeof a): typeof a {
  // @ts-ignore
  return ((a % b) + b) % b;
}

/**
 *
 * This class offers the possibility to calculate fractions.
 * You can pass a fraction in different formats: either as two integers, an integer, a floating point number or a string.
 *
 * Numerator, denominator form
 * ```ts
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
 * new Fraction("13e-3");  // scientific notation
 * ```
 */
export class Fraction {
  /** Sign: +1, 0 or -1 */
  s: number;
  /** Numerator */
  n: number;
  /** Denominator */
  d: number;

  constructor(numerator: FractionValue, denominator?: number) {
    if (denominator !== undefined) {
      if (typeof numerator !== 'number') {
        throw new Error('Numerator must be a number when denominator is given');
      }
      if (isNaN(numerator) || isNaN(denominator)) {
        throw new Error('Cannot represent NaN as a fraction');
      }
      this.s = Math.sign(numerator * denominator);
      this.n = Math.abs(numerator);
      this.d = Math.abs(denominator);

      this.screenInfinity();

      if (this.d > Number.MAX_SAFE_INTEGER) {
        throw new Error('Denominator above safe limit');
      }
      if (this.n > Number.MAX_SAFE_INTEGER) {
        if (!isFinite(this.n)) {
          throw new Error('Cannot represent Infinity as a fraction');
        }
        throw new Error('Numerator above safe limit');
      }
      if (this.d === 0) {
        throw new Error('Division by Zero');
      }
      this.defloat();
    } else if (typeof numerator === 'number') {
      if (isNaN(numerator)) {
        throw new Error('Cannot represent NaN as a fraction');
      }
      this.s = Math.sign(numerator);
      this.n = Math.abs(numerator);
      this.d = 1;
      if (!isFinite(this.n)) {
        throw new Error('Cannot represent Infinity as a fraction');
      }
      this.defloat();
    } else if (typeof numerator === 'string') {
      numerator = numerator.toLowerCase();
      this.n = 1;
      this.d = 1;
      if (numerator.includes('e')) {
        const [mantissa, exponent] = numerator.split('e', 2);
        numerator = mantissa;
        const e = parseInt(exponent, 10);
        if (e > 0) {
          this.n = 10 ** e;
        } else if (e < 0) {
          this.d = 10 ** -e;
        }
      }
      if (numerator.includes('/')) {
        if (numerator.includes('.')) {
          throw new Error('Parameters must be integer');
        }
        const [n, d] = numerator.split('/', 2);
        if (n === '-') {
          this.n *= -1;
        } else {
          this.n *= n ? parseInt(n, 10) : 1;
        }
        this.d *= d ? parseInt(d, 10) : 1;
        this.s = Math.sign(this.n * this.d);
        this.n = Math.abs(this.n);
        this.d = Math.abs(this.d);
      } else if (numerator.includes('.')) {
        let [n, f] = numerator.split('.', 2);
        let r: string | undefined;
        [f, r] = f.split("'", 2);
        if (n.startsWith('-')) {
          this.s = -1;
          n = n.slice(1);
        } else {
          this.s = 1;
        }
        let m = n ? parseInt(n, 10) : 0;
        if (this.n < 0) {
          throw new Error('Double sign');
        }
        for (const c of f) {
          m = 10 * m + parseInt(c, 10);
          this.d *= 10;
        }
        this.n *= m;
        if (r) {
          r = r.replace(/'/g, '');
          if (r.length) {
            const cycleN = parseInt(r, 10);
            if (cycleN > Number.MAX_SAFE_INTEGER) {
              throw new Error('Cycle too long');
            }
            const cycleD = (10 ** r.length - 1) * 10 ** f.length;
            this.n = this.n * cycleD + this.d * cycleN;
            this.d *= cycleD;
          }
        }
        if (!this.n) {
          this.s = 0;
        }
      } else {
        this.n = parseInt(numerator, 10);
        this.s = Math.sign(this.n);
        this.n = Math.abs(this.n);
      }
      if (this.d === 0) {
        throw new Error('Division by Zero');
      }
      this.reduce();
    } else {
      if (numerator.d === 0) {
        throw new Error('Division by Zero');
      }
      if ('s' in numerator) {
        this.s = Math.sign(numerator.s);
      } else {
        this.s = 1;
      }
      if (numerator.d < 0) {
        this.s = -this.s;
      }
      if (numerator.n < 0) {
        this.s = -this.s;
      } else if (numerator.n === 0) {
        this.s = 0;
      }
      this.n = Math.abs(numerator.n);
      this.d = Math.abs(numerator.d);
      this.screenInfinity();
      this.reduce();
    }
    this.validate();
  }

  /**
   * Validate that this fraction represents the ratio of two integers.
   */
  validate() {
    if (isNaN(this.s) || isNaN(this.n) || isNaN(this.d)) {
      throw new Error('Cannot represent NaN as a fraction');
    }
    if (this.n > Number.MAX_SAFE_INTEGER) {
      if (!isFinite(this.n)) {
        throw new Error('Cannot represent Infinity as a fraction');
      }
      throw new Error('Numerator above safe limit');
    }
    if (this.d > Number.MAX_SAFE_INTEGER) {
      throw new Error('Denominator above safe limit');
    }
  }

  /**
   * IEEE floats always have a denominator of a power of two. Reduce it out.
   * If the process would produce integers too large for the Number type an approximation is used.
   */
  defloat() {
    while (this.n !== Math.floor(this.n) || this.d !== Math.floor(this.d)) {
      this.n *= 2;
      this.d *= 2;
    }
    // Cut back if defloating produces something not representable additively.
    if (this.n > Number.MAX_SAFE_INTEGER || this.d > Number.MAX_SAFE_INTEGER) {
      let x = this.n / this.d;
      const coefs: number[] = [];
      for (let i = 0; i < 20; ++i) {
        const coef = Math.floor(x);
        if (coef > 1e12) {
          break;
        }
        coefs.push(coef);
        if (x === coef) {
          break;
        }
        x = 1 / (x - coef);
      }
      if (!coefs.length) {
        throw new Error('Numerator above safe limit');
      }
      let j = 1;
      while (j <= coefs.length) {
        let n = coefs[coefs.length - j];
        let d = 1;
        for (let i = coefs.length - j - 1; i >= 0; --i) {
          [n, d] = [d + n * coefs[i], n];
        }
        this.n = n;
        this.d = d;
        if (n <= Number.MAX_SAFE_INTEGER && d <= Number.MAX_SAFE_INTEGER) {
          break;
        }
        j++;
      }
    }
    this.reduce();
  }

  /**
   * Reduce out the common factor between the numerator and denominator.
   */
  reduce() {
    const commonFactor = gcd(this.n, this.d);
    this.n /= commonFactor;
    this.d /= commonFactor;
  }

  /**
   * Normalize infinite denominator into 0/1.
   */
  screenInfinity() {
    if (!isFinite(this.d)) {
      if (!isFinite(this.n)) {
        throw new Error('Cannot represent NaN as a fraction');
      }
      this.s = 0;
      this.n = 0;
      this.d = 1;
    }
  }

  /**
   * Creates a string representation of a fraction with all digits.
   *
   * Example:
   * ```ts
   * new Fraction("100.'91823'").toString()  // "100.'91823'"
   * ```
   **/
  toString() {
    let result = this.s < 0 ? '-' : '';
    const whole = Math.floor(this.n / this.d);
    result += whole.toString();
    let fractional = this.abs().sub(whole);
    if (fractional.n === 0) {
      return result;
    }
    result += '.';
    let decimals = '';
    const history = [fractional];

    for (let i = 0; i < MAX_CYCLE_LENGTH; ++i) {
      fractional = fractional.mul(10);
      const digit = Math.floor(fractional.n / fractional.d);
      decimals += digit.toString();
      fractional = fractional.sub(digit);
      if (fractional.n === 0) {
        return result + decimals;
      }
      for (let j = 0; j < history.length; ++j) {
        if (fractional.equals(history[j])) {
          return result + decimals.slice(0, j) + "'" + decimals.slice(j) + "'";
        }
      }
      history.push(fractional);
    }
    return result + decimals + '...';
  }

  /**
   * Serialize the fraction to a JSON compatible object.
   * @returns An object with properties 'n', and 'd' corresponding to a signed numerator and an unsigned denominator respectively.
   */
  toJSON(): UnsignedFraction {
    return {
      n: this.n * this.s,
      d: this.d,
    };
  }

  /**
   * Revive a {@link Fraction} instance produced by Fraction.toJSON(). Return everything else as is.
   *
   * Intended usage:
   * ```ts
   * const data = JSON.parse(serializedData, Fraction.reviver);
   * ```
   *
   * @param key Property name.
   * @param value Property value.
   * @returns Deserialized {@link Fraction} instance or other data without modifications.
   * @throws An error if the numerator or denominator exceeds `Number.MAX_SAFE_INTEGER`.
   */
  static reviver(key: string, value: any) {
    if (
      typeof value === 'object' &&
      value !== null &&
      'n' in value &&
      Number.isInteger(value.n) &&
      'd' in value &&
      Number.isInteger(value.d) &&
      Object.keys(value).length === 2
    ) {
      return new Fraction(value as UnsignedFraction);
    }
    return value;
  }

  /**
   * Returns an array of continued fraction elements.
   *
   * Example:
   * ```ts
   * new Fraction("7/8").toContinued()  // [0, 1, 7]
   * ```
   */
  toContinued() {
    const result = [];
    let a = this.n;
    let b = this.d;
    for (let i = 0; i < MAX_CONTINUED_LENGTH; ++i) {
      const coef = Math.floor(a / b);
      result.push(coef);
      [a, b] = [b, a - coef * b];
      if (a === 1) {
        break;
      }
    }
    return result;
  }

  /**
   * Calculates the absolute value.
   *
   * Example:
   * ```ts
   * new Fraction(-4).abs()  // 4
   * ```
   **/
  abs() {
    return new Fraction({
      s: Math.abs(this.s),
      n: this.n,
      d: this.d,
    });
  }

  /**
   * Returns a decimal representation of the fraction.
   *
   * Example:
   * ```ts
   * new Fraction("100.'91823'").valueOf()  // 100.91823918239183
   * ```
   **/
  valueOf() {
    return (this.s * this.n) / this.d;
  }

  /**
   * Returns the inverse of the fraction, numerator and denominator are exchanged.
   *
   * Example:
   * ```ts
   * new Fraction(-3, 4).inverse()  // -4/3
   * ```
   **/
  inverse() {
    if (this.n === 0) {
      throw new Error('Division by Zero');
    }
    return new Fraction({s: this.s, n: this.d, d: this.n} as Fraction);
  }

  /**
   * Returns the additive inverse of the fraction.
   *
   * Example:
   * ```ts
   * new Fraction(-4).neg()  // 4
   * ```
   **/
  neg() {
    return new Fraction({s: -this.s, n: this.n, d: this.d} as Fraction);
  }

  /**
   * Returns a string-fraction representation of a Fraction object.
   *
   * Example:
   * ```ts
   * new Fraction("1.'3'").toFraction()  // "4/3"
   * ```
   **/
  toFraction() {
    const n = this.s * this.n;
    if (this.d === 1) {
      return n.toString();
    }
    return `${n}/${this.d}`;
  }

  /**
   * Clones the actual object.
   *
   * Example:
   * ```ts
   * new Fraction("-17.'345'").clone()  // new Fraction("-17.'345'")
   * ```
   **/
  clone() {
    return new Fraction(this);
  }

  /**
   * Return a convergent of this fraction that is within the given absolute tolerance.
   * @param epsilon Absolute tolerance for error.
   */
  simplify(epsilon = 0.001) {
    const abs = this.abs();
    const cont = abs.toContinued();
    const absValue = abs.valueOf();

    for (let i = 1; i < cont.length; i++) {
      let s = new Fraction({s: 1, n: cont[i - 1], d: 1} as Fraction);
      for (let k = i - 2; k >= 0; k--) {
        s = s.inverse().add(cont[k]);
      }

      if (Math.abs(s.valueOf() - absValue) <= epsilon) {
        return new Fraction({s: this.s, n: s.n, d: s.d} as Fraction);
      }
    }
    return this.clone();
  }

  /**
   * Return a convergent of this fraction that is within the given relative tolerance measured in cents.
   * @param tolerance Relative tolerance measured in cents.
   */
  simplifyRelative(tolerance = 3.5) {
    const abs = this.abs();
    const cont = abs.toContinued();
    const absCents = valueToCents(abs.valueOf());

    for (let i = 1; i < cont.length; i++) {
      let s = new Fraction({s: 1, n: cont[i - 1], d: 1} as Fraction);
      for (let k = i - 2; k >= 0; k--) {
        s = s.inverse().add(cont[k]);
      }

      if (Math.abs(valueToCents(s.valueOf()) - absCents) <= tolerance) {
        return new Fraction({s: this.s, n: s.n, d: s.d} as Fraction);
      }
    }
    return this.clone();
  }

  /**
   * Calculates the floor of a rational number.
   *
   * Example:
   * ```ts
   * new Fraction("4.'3'").floor()  // 4/1
   * ```
   **/
  floor() {
    if (this.d > Number.MAX_SAFE_INTEGER) {
      return new Fraction(Math.floor(this.valueOf()));
    }
    const n = this.s * this.n;
    const m = mmod(n, this.d);
    return new Fraction((n - m) / this.d);
  }

  /**
   * Calculates the ceil of a rational number.
   *
   * Example:
   * ```ts
   * new Fraction("4.'3'").ceil()  // 5/1
   * ```
   **/
  ceil() {
    if (this.d > Number.MAX_SAFE_INTEGER) {
      return new Fraction(Math.ceil(this.valueOf()));
    }
    const n = this.s * this.n;
    const m = mmod(n, this.d);
    if (m) {
      return new Fraction(1 + (n - m) / this.d);
    }
    return this;
  }

  /**
   * Rounds a rational number.
   *
   * Examples:
   * ```ts
   * new Fraction("4.'3'").floor()  // 4/1
   * new Fraction("4.5").floor()    // 5/1
   * new Fraction("4.'6'").floor()  // 5/1
   * ```
   **/
  round() {
    try {
      return this.add(new Fraction({s: 1, n: 1, d: 2} as Fraction)).floor();
    } catch {
      return new Fraction(Math.round(this.valueOf()));
    }
  }

  /**
   * Rounds a rational number to a multiple of another rational number.
   *
   * Examples:
   * ```ts
   * new Fraction("0.'7'").roundTo("1/9")   // 7/9
   * new Fraction("0.78").roundTo("1/9")    // 7/9
   * new Fraction("0.8'3'").roundTo("1/9")  // 8/9
   * new Fraction("0.85").roundTo("1/9")    // 8/9
   * ```
   **/
  roundTo(other: FractionValue) {
    const {n, d} = new Fraction(other);

    return new Fraction(
      this.s * Math.round((this.n * d) / (this.d * n)) * n,
      d
    );
  }

  /**
   * Adds two rational numbers.
   *
   * Example:
   * ```ts
   * new Fraction({n: 2, d: 3}).add("14.9")  // 467/30
   * ```
   **/
  add(other: FractionValue) {
    const {s, n, d} = new Fraction(other);
    // Must pre-reduce to avoid blowing the limits
    const factor = gcd(this.d, d);
    const df = d / factor;
    return new Fraction(
      this.s * this.n * df + s * n * (this.d / factor),
      df * this.d
    );
  }

  /**
   * Subtracts two rational numbers.
   *
   * Example:
   * ```ts
   * new Fraction({n: 2, d: 3}).sub("14.9")  // -427/30
   * ```
   **/
  sub(other: FractionValue) {
    const {s, n, d} = new Fraction(other);
    // Must pre-reduce to avoid blowing the limits
    const factor = gcd(this.d, d);
    const df = d / factor;
    return new Fraction(
      this.s * this.n * df - s * n * (this.d / factor),
      df * this.d
    );
  }

  /**
   * Perform harmonic addition of two rational numbers according to the thin lens equation f⁻¹ = u⁻¹ + v⁻¹.
   *
   * Example:
   * ```ts
   * new Fraction('5/3').lensAdd('3/2')  // 15/19
   * ```
   */
  lensAdd(other: FractionValue) {
    const {s, n, d} = new Fraction(other);
    if (!n || !this.n) {
      // Based on behavior in the limit where both terms become zero.
      return new Fraction({s: 0, n: 0, d: 1});
    }
    // Must pre-reduce to avoid blowing the limits
    const numerator = lcm(this.n, n);
    return new Fraction(
      this.s * s * numerator,
      (numerator / n) * d + (numerator / this.n) * this.d
    );
  }

  /**
   * Perform harmonic subtraction of two rational numbers u⁻¹ = f⁻¹ - v⁻¹ (rearranged thin lens equation).
   *
   * Example:
   * ```ts
   * new Fraction('15/19').lensSub('3/2')  // 5/3
   * ```
   */
  lensSub(other: FractionValue) {
    const {s, n, d} = new Fraction(other);
    if (!n || !this.n) {
      // Based on behavior in the limit where both terms become zero.
      return new Fraction({s: 0, n: 0, d: 1});
    }
    // Must pre-reduce to avoid blowing the limits
    const numerator = lcm(this.n, n);
    return new Fraction(
      this.s * s * numerator,
      (numerator / this.n) * this.d - (numerator / n) * d
    );
  }

  /**
   * Multiplies two rational numbers.
   *
   * Example:
   * ```ts
   * new Fraction("-17.'345'").mul(3)  // 5776/111
   * ```
   **/
  mul(other: FractionValue) {
    const {s, n, d} = new Fraction(other);
    // Must pre-reduce to avoid blowing the limits
    const ndFactor = gcd(this.n, d);
    const dnFactor = gcd(this.d, n);
    return new Fraction(
      this.s * (this.n / ndFactor) * s * (n / dnFactor),
      (this.d / dnFactor) * (d / ndFactor)
    );
  }

  /**
   * Divides two rational numbers
   *
   * Example:
   * ```ts
   * new Fraction("-17.'345'").div(3)  // 5776/999
   * ```
   **/
  div(other: FractionValue) {
    const {s, n, d} = new Fraction(other);
    if (n === 0) {
      throw new Error('Division by Zero');
    }
    // Must pre-reduce to avoid blowing the limits
    const nFactor = gcd(this.n, n);
    const dFactor = gcd(this.d, d);
    return new Fraction(
      this.s * (this.n / nFactor) * s * (d / dFactor),
      (this.d / dFactor) * (n / nFactor)
    );
  }

  /**
   * Calculates the computational modulo of two rational numbers - a more precise fmod. Incorrectly processes signs.
   *
   * Examples:
   * ```ts
   * new Fraction("5/1").mod("3/1")   //   (5/1) % (3/1)  = 2/1
   * new Fraction("-5/1").mod("3/1")  // -((5/1) % (3/1)) = -2/1
   * ```
   **/
  mod(other: FractionValue) {
    const {n, d} = new Fraction(other);
    // Must pre-reduce to avoid blowing the limits
    const denominator = lcm(this.d, d);
    return new Fraction(
      (this.s * ((denominator / this.d) * this.n)) % (n * (denominator / d)),
      denominator
    );
  }

  /**
   * Calculates the mathematical modulo of two rational numbers. Correctly processes signs.
   *
   * Examples:
   * ```ts
   * new Fraction("5/1").mod("3/1")   // (5/1) % (3/1)  = 2/1
   * new Fraction("-5/1").mod("3/1")  // (-5/1) % (3/1) = (1/1) % (3/1) = 1/1
   * ```
   **/
  mmod(other: FractionValue) {
    const {n, d} = new Fraction(other);
    // Must pre-reduce to avoid blowing the limits
    const denominator = lcm(this.d, d);
    return new Fraction(
      mmod(this.s * ((denominator / this.d) * this.n), n * (denominator / d)),
      denominator
    );
  }

  /**
   * Calculates the fraction to some rational exponent, if possible.
   *
   * Examples:
   * ```ts
   * new Fraction("1/2").pow(2)      // 1/4
   * new Fraction("-1/2").pow(-3)    // -8
   * new Fraction("9/4").pow("3/2")  // 27/8
   * new Fraction("2/1").pow("1/2")  // null
   * ```
   */
  pow(other: FractionValue): Fraction | null {
    const {s, n, d} = new Fraction(other);
    if (s === 0) {
      return new Fraction(1);
    }
    if (d === 1) {
      if (s < 0) {
        return new Fraction((this.s * this.d) ** n, this.n ** n);
      } else {
        return new Fraction((this.s * this.n) ** n, this.d ** n);
      }
    }
    if (this.s === 0) {
      return new Fraction(0);
    }
    if (this.s < 0 && d % 2 === 0) {
      return null;
    }
    if (this.n === 1) {
      if (this.s > 0) {
        return new Fraction(1);
      }
      return new Fraction(-1);
    }
    let nProbe = 1;
    let dProbe = 1;
    let limitIndex = 0;
    let numerator = this.s;
    let denominator = 1;
    do {
      if (limitIndex >= PRIMES.length) {
        return null;
      }
      let rootExponent = -1;
      const prime = PRIMES[limitIndex];
      const primePower = prime ** d;
      let lastProbe;
      do {
        lastProbe = nProbe;
        nProbe *= primePower;
        rootExponent++;
      } while (this.n % nProbe === 0);
      nProbe = lastProbe;

      for (let i = 1; i < d; ++i) {
        lastProbe *= prime;
        if (this.n % lastProbe === 0) {
          return null;
        }
      }

      // The fraction is in lowest terms so we can skip the denominator
      if (rootExponent) {
        numerator *= prime ** (n * rootExponent);
        limitIndex++;
        continue;
      }

      rootExponent = -1;
      do {
        lastProbe = dProbe;
        dProbe *= primePower;
        rootExponent++;
      } while (this.d % dProbe === 0);
      dProbe = lastProbe;

      for (let i = 1; i < d; ++i) {
        lastProbe *= prime;
        if (this.d % lastProbe === 0) {
          return null;
        }
      }

      denominator *= prime ** (n * rootExponent);
      limitIndex++;
    } while (nProbe !== this.n || dProbe !== this.d);

    if (s > 0) {
      return new Fraction(numerator, denominator);
    }
    return new Fraction(denominator, numerator);
  }

  /**
   * Compare two rational numbers, returns (this - other) which has the correct sign for `Array.sort()`.
   *
   * Examples:
   * ```ts
   * new Fraction("19.7").compare("98/5") // 0.1
   * new Fraction("19.6").compare("98/5") // 0
   * new Fraction("19.5").compare("98/5") // -0.1
   * ```
   **/
  compare(other: FractionValue) {
    try {
      const {s, n, d} = new Fraction(other);
      return this.s * this.n * d - s * n * this.d;
    } catch {
      return NaN;
    }
  }

  /**
   * Check if two rational numbers are the same
   *
   * Examples:
   * ```ts
   * new Fraction("19.7").equals("98/5") // false
   * new Fraction("19.6").equals("98/5") // true
   * new Fraction("19.5").equals("98/5") // false
   * ```
   **/
  equals(other: FractionValue) {
    try {
      const {s, n, d} = new Fraction(other);
      return this.s === s && this.n === n && this.d === d;
    } catch {
      return false;
    }
  }

  /**
   * Check if two rational numbers are divisible
   * (i.e. this is an integer multiple of other)
   *
   * Examples:
   * ```ts
   * new Fraction("7.6").divisible("5/2") // false
   * new Fraction("7.5").divisible("5/2") // true
   * new Fraction("7/4").divisible("5/2") // false
   * ```
   */
  divisible(other: FractionValue) {
    try {
      const {n, d} = new Fraction(other);
      const nFactor = gcd(this.n, n);
      const dFactor = gcd(this.d, d);
      return !(
        !n ||
        ((this.n / nFactor) * (d / dFactor)) %
          ((n / nFactor) * (this.d / dFactor))
      );
    } catch {
      return false;
    }
  }

  /**
   * Calculates the fractional gcd of two rational numbers. (i.e. both this and other is divisible by the result)
   *
   * Always returns a non-negative result.
   *
   * Example:
   * ```ts
   * new Fraction(5,8).gcd("3/7")  // 1/56
   * ```
   */
  gcd(other: FractionValue) {
    const {n, d} = new Fraction(other);
    return new Fraction(gcd(n, this.n), lcm(this.d, d));
  }

  /**
   * Calculates the fractional lcm of two rational numbers. (i.e. the result is divisible by both this and other)
   *
   * Has the same sign as the product of the rational numbers.
   *
   * Example:
   * ```ts
   * new Fraction(5,8).gcd("3/7")  // 15
   * ```
   */
  lcm(other: FractionValue) {
    const {s, n, d} = new Fraction(other);
    const result = new Fraction(lcm(n, this.n), gcd(d, this.d));
    result.s = this.s * s;
    return result;
  }

  /**
   * Geometrically reduce a rational number until its absolute value is between 1 and the absolute value of other, i.e. geometric modulo.
   * Note: Returns a positive result for a negative modulo if the required number of divisions is even.
   *
   * Examples:
   * ```ts
   * new Fraction(5, 1).geoMod(2)        // 5/4
   * new Fraction(1, 11).geoMod(3)       // 27/11
   * new Fraction(1, 11).geoMod("-1/3")  // 9/11
   * ```
   */
  geoMod(other: FractionValue) {
    let {s, n, d} = this;
    const {s: os, n: on, d: od} = new Fraction(other);

    if (on === od) {
      throw new Error('Geometric modulo by 1');
    }

    let octaves = Math.floor(Math.log(n / d) / Math.log(on / od));

    if (isNaN(octaves) || !isFinite(octaves)) {
      throw new Error('Unable to calculate geometric modulo.');
    }

    if (octaves > 0) {
      n *= od ** octaves;
      d *= on ** octaves;
    } else if (octaves < 0) {
      n *= on ** -octaves;
      d *= od ** -octaves;
    }

    // Fine-tune to fix floating point issues.
    if (on > od) {
      if (n * od >= d * on) {
        octaves++;
        n *= od;
        d *= on;
      }
      if (n < d) {
        octaves--;
        n *= on;
        d *= od;
      }
    } else {
      if (n * od <= d * on) {
        octaves++;
        n *= od;
        d *= on;
      }
      if (n > d) {
        octaves--;
        n *= on;
        d *= od;
      }
    }

    s *= os ** octaves;

    return new Fraction({s, n, d});
  }

  /**
   * Check if the rational number is 1.
   *
   * Examples:
   * ```ts
   * new Fraction(9, 9).isUnity()      // true
   * new Fraction("0.01e2").isUnity()  // true
   * new Fraction(7, 6).isUnity()      // false
   * ```
   */
  isUnity() {
    return this.s === 1 && this.n === 1 && this.d === 1;
  }

  /**
   * Calculates the geometric absolute value. Discards sign.
   *
   * Examples:
   * ```ts
   * new Fraction(3, 2).gabs()   // 3/2
   * new Fraction(2, 3).gabs()   // 2/3
   * new Fraction(-1, 2).gabs()  // 2/1
   * ```
   **/
  gabs() {
    if (this.n < this.d) {
      return new Fraction({n: this.d, d: this.n});
    }
    return this.abs();
  }

  /**
   * Calculate the greatest common radical between two rational numbers if it exists.
   *
   * Never returns a subunitary result.
   *
   * Treats unity as the identity element: gcr(1, x) = gcr(x, 1) = x
   *
   * Examples:
   * ```ts
   * new Fraction(8).gcr(4)          // 2
   * new Fraction(81).gcr(6561)      // 9
   * new Fraction("1/2").gcr("1/3")  // null
   * ```
   */
  gcr(other: FractionValue, maxIter = 100) {
    let a = this.gabs();
    let b = new Fraction(other).gabs();
    if (a.isUnity()) return b;
    if (b.isUnity()) return a;
    for (let i = 0; i < maxIter; ++i) {
      try {
        a = a.geoMod(b);
        if (a.isUnity()) return b;
        b = b.geoMod(a);
        if (b.isUnity()) return a;
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Calculate the logarithm of a rational number in the base of another, i.e. logdivision if the result exists as a rational number.
   *
   * Examples:
   * ```ts
   * new Fraction(4).log(2)              // 2
   * new Fraction(64,27).log("16/9")     // 3/2
   * new Fraction(64,27).log("1/1")      // null
   * new Fraction(64,27).log(7)          // null
   *
   * new Fraction(64,27).log("-16/9")    // null
   * new Fraction(-64,27).log("16/9")    // null
   * new Fraction(-64,27).log("-16/9")   // null
   * ```
   */
  log(other: FractionValue, maxIter = 100) {
    const other_ = new Fraction(other);
    if (other_.isUnity()) {
      if (this.isUnity()) {
        // This convention follows from an identity between gcr and lcr
        // Not entirely well-founded, but not entirely wrong either.
        return new Fraction(1);
      }
      return null;
    }
    const radical = this.gcr(other_, maxIter);
    if (radical === null) {
      return null;
    }

    const base = 1 / Math.log(radical.n / radical.d);
    const n = Math.round(Math.log(this.n / this.d) * base);
    const d = Math.round(Math.log(other_.n / other_.d) * base);

    if (other_.s < 0) {
      if (d % 2 === 0) {
        return null;
      }
      if (n % 2) {
        if (this.s > 0) {
          return null;
        }
      } else {
        if (this.s < 0) {
          return null;
        }
      }
    } else if (this.s < 0) {
      return null;
    }

    return new Fraction({n, d});
  }

  /**
   * Calculate the least common radicand between two rational numbers if it exists.
   *
   * If either of the inputs is unitary returns unity (1).
   *
   * Returns a subunitary result if only one of the inputs is subunitary, superunitary otherwise.
   *
   * Examples:
   * ```ts
   * new Fraction(8).lcr(4)          // 64
   * new Fraction("1/2").lcr("1/3")  // null
   * ```
   */
  lcr(other: FractionValue, maxIter = 100) {
    const other_ = new Fraction(other);
    const radical = this.gcr(other, maxIter);
    if (radical === null) {
      return null;
    }
    if (radical.isUnity()) {
      return new Fraction(1);
    }
    const base = 1 / Math.log(radical.n / radical.d);
    const n = Math.round(Math.log(this.n / this.d) * base);
    const d = Math.round(Math.log(other_.n / other_.d) * base);
    return radical.pow(n * d);
  }

  /**
   * Rounds a rational number to a power of another rational number.
   *
   * Examples:
   * ```ts
   * new Fraction('5/4').geoRoundTo("9/8")     // 81/64
   * new Fraction('5/4').geoRoundTo("1/1")     // 1/1
   *
   * // handling negative values
   *
   * new Fraction('5/4').geoRoundTo("-9/8")    // 81/64
   *
   * new Fraction('10/7').geoRoundTo("9/8")    // 729/512
   * new Fraction('10/7').geoRoundTo("-9/8")   // 6561/4096
   *
   * new Fraction('-5/4').geoRoundTo("9/8")    // null
   *
   * new Fraction('-5/4').geoRoundTo("-9/8")   // -9/8
   * ```
   */
  geoRoundTo(other: FractionValue) {
    const other_ = new Fraction(other);
    let exponent = Math.log(this.n / this.d) / Math.log(other_.n / other_.d);
    if (this.s === 0) {
      return this.clone();
    }
    if (this.s < 0) {
      if (other_.s > 0) {
        return null;
      }
      exponent = Math.round((exponent + 1) * 0.5) * 2 - 1;
    } else if (other_.s < 0) {
      exponent = Math.round(exponent * 0.5) * 2;
    } else {
      exponent = Math.round(exponent);
    }
    return other_.pow(exponent);
  }
}
