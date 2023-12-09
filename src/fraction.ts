// I'm rolling my own because fraction.js has trouble with TypeScript https://github.com/rawify/Fraction.js/issues/72
// -Lumi

import {PRIMES} from './primes';

export type UnsignedFraction = {n: number; d: number};

// Explicitly drop [number, number] because it overlaps with monzos
export type FractionValue = Fraction | UnsignedFraction | number | string;

const MAX_CONTINUED_LENGTH = 1000;
const MAX_CYCLE_LENGTH = 128;

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
      if (numerator.n < 0) {
        this.s = -this.s;
      }
      if (numerator.d < 0) {
        this.s = -this.s;
      }
      this.n = Math.abs(numerator.n);
      this.d = Math.abs(numerator.d);
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
    /*
    if (!isFinite(this.d)) {
      if (!isFinite(this.n)) {
        throw new Error('Both numerator and denominator cannot be infinite');
      }
      this.n = 0;
      this.d = 1;
    }
    */
    if (this.n > Number.MAX_SAFE_INTEGER) {
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
      let n = coefs.pop()!;
      let d = 1;
      while (coefs.length) {
        [n, d] = [d + n * coefs.pop()!, n];
      }
      this.n = n;
      this.d = d;
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
   * Creates a string representation of a fraction with all digits
   *
   * Ex: new Fraction("100.'91823'").toString() => "100.'91823'"
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
   * Returns an array of continued fraction elements
   *
   * Ex: new Fraction("7/8").toContinued() => [0,1,7]
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
   * Calculates the absolute value
   *
   * Ex: new Fraction(-4).abs() => 4
   **/
  abs() {
    return new Fraction({
      s: Math.abs(this.s),
      n: this.n,
      d: this.d,
    });
  }

  /**
   * Returns a decimal representation of the fraction
   *
   * Ex: new Fraction("100.'91823'").valueOf() => 100.91823918239183
   **/
  valueOf() {
    return (this.s * this.n) / this.d;
  }

  /**
   * Gets the inverse of the fraction, means numerator and denominator are exchanged
   *
   * Ex: new Fraction(-3, 4).inverse() => -4 / 3
   **/
  inverse() {
    if (this.n === 0) {
      throw new Error('Division by Zero');
    }
    return new Fraction({s: this.s, n: this.d, d: this.n} as Fraction);
  }

  /**
   * Inverts the sign of the current fraction
   *
   * Ex: new Fraction(-4).neg() => 4
   **/
  neg() {
    return new Fraction({s: -this.s, n: this.n, d: this.d} as Fraction);
  }

  /**
   * Returns a string-fraction representation of a Fraction object
   *
   * Ex: new Fraction("1.'3'").toFraction(true) => "4/3"
   **/
  toFraction() {
    const n = this.s * this.n;
    if (this.d === 1) {
      return n.toString();
    }
    return `${n}/${this.d}`;
  }

  /**
   * Clones the actual object
   *
   * Ex: new Fraction("-17.'345'").clone()
   **/
  clone() {
    return new Fraction(this);
  }

  /**
   * Return a convergent of this fraction that is within the given tolerance.
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

      if (Math.abs(s.valueOf() - absValue) < epsilon) {
        return new Fraction({s: this.s, n: s.n, d: s.d} as Fraction);
      }
    }
    return this.clone();
  }

  /**
   * Calculates the floor of a rational number
   *
   * Ex: new Fraction("4.'3'").floor() => (4 / 1)
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
   * Calculates the ceil of a rational number
   *
   * Ex: new Fraction("4.'3'").ceil() => (5 / 1)
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
   * Rounds a rational number
   *
   * Ex: new Fraction("4.'3'").round() => (4 / 1)
   **/
  round() {
    try {
      return this.add(new Fraction({s: 1, n: 1, d: 2} as Fraction)).floor();
    } catch {
      return new Fraction(Math.round(this.valueOf()));
    }
  }

  /**
   * Rounds a rational number to a multiple of another rational number
   *
   * Ex: new Fraction('0.9').roundTo("1/8") => 7 / 8
   **/
  roundTo(other: FractionValue) {
    const {n, d} = new Fraction(other);

    return new Fraction(
      this.s * Math.round((this.n * d) / (this.d * n)) * n,
      d
    );
  }

  /**
   * Adds two rational numbers
   *
   * Ex: new Fraction(\{n: 2, d: 3\}).add("14.9") => 467 / 30
   **/
  add(other: FractionValue) {
    const {s, n, d} = new Fraction(other);
    return new Fraction(this.s * this.n * d + s * n * this.d, this.d * d);
  }

  /**
   * Subtracts two rational numbers
   *
   * Ex: new Fraction(\{n: 2, d: 3\}).add("14.9") => -427 / 30
   **/
  sub(other: FractionValue) {
    const {s, n, d} = new Fraction(other);
    return new Fraction(this.s * this.n * d - s * n * this.d, this.d * d);
  }

  /**
   * Multiplies two rational numbers
   *
   * Ex: new Fraction("-17.'345'").mul(3) => 5776 / 111
   **/
  mul(other: FractionValue) {
    const {s, n, d} = new Fraction(other);
    return new Fraction(this.s * this.n * s * n, this.d * d);
  }

  /**
   * Divides two rational numbers
   *
   * Ex: new Fraction("-17.'345'").inverse().div(3)
   **/
  div(other: FractionValue) {
    const {s, n, d} = new Fraction(other);
    if (n === 0) {
      throw new Error('Division by Zero');
    }
    return new Fraction(this.s * this.n * s * d, this.d * n);
  }

  /**
   * Calculates the modulo of two rational numbers - a more precise fmod
   *
   * Ex: new Fraction("4.'3'").mod("7/8") => (13/3) % (7/8) = (5/6)
   **/
  mod(other: FractionValue) {
    other = new Fraction(other);
    return new Fraction(
      (this.s * (other.d * this.n)) % (other.n * this.d),
      this.d * other.d
    );
  }

  /**
   * Calculates the mathematically correct modulo of two rational numbers
   *
   * Ex: new Fraction("-4.'3'").mmod("7/8") => (-13/3) % (7/8) = (1/24)
   **/
  mmod(other: FractionValue) {
    other = new Fraction(other);
    return new Fraction(
      mmod(this.s * (other.d, this.n), other.n * this.d),
      this.d * other.d
    );
  }

  /**
   * Calculates the fraction to some rational exponent, if possible
   *
   * Ex: new Fraction(-1,2).pow(-3) => -8
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
   * Compare if two rational numbers, return negative if this is less
   *
   * Ex: new Fraction("19.6").equals("98/5");
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
   * Ex: new Fraction("19.6").equals("98/5");
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
   *
   * Ex: new Fraction("19.6").divisible("1.5");
   */
  divisible(other: FractionValue) {
    try {
      other = new Fraction(other);
      return !(!(other.n * this.d) || (this.n * other.d) % (other.n * this.d));
    } catch {
      return false;
    }
  }

  /**
   * Calculates the fractional gcd of two rational numbers
   *
   * Ex: new Fraction(5,8).gcd("3/7") => 1/56
   */
  gcd(other: FractionValue) {
    const {n, d} = new Fraction(other);
    return new Fraction(gcd(n, this.n) * gcd(d, this.d), d * this.d);
  }

  /**
   * Calculates the fractional lcm of two rational numbers
   *
   * Ex: new Fraction(5,8).lcm("3/7") => 15
   */
  lcm(other: FractionValue) {
    const {n, d} = new Fraction(other);
    if (n === 0 && this.n === 0) {
      return new Fraction({s: 0, n: 0, d: 1});
    }
    return new Fraction(n * this.n, gcd(n, this.n) * gcd(d, this.d));
  }
}
