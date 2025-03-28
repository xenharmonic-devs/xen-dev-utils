import {Fraction, FractionValue, gcd} from './fraction';
import {toMonzo} from './monzo';
import {PRIMES} from './primes';

export type RadicalValue = FractionValue | Radical;

function stripParenthesis(str: string) {
  while (str.startsWith('(') || str.startsWith(' ')) {
    str = str.slice(1);
  }
  while (str.endsWith(')') || str.endsWith(' ')) {
    str = str.slice(0, -1);
  }
  return str;
}

/**
 * Radical expressions like 3√(10/7).
 * Powerful enough to represent all n-th roots of sufficiently small arguments.
 */
export class Radical {
  /**
   * Non-negative radicand under the radical surd.
   */
  radicand: Fraction;
  /**
   * Index of radication i.e. the inverse power. Always positive and never zero.
   */
  index: number;

  /**
   * Construct a new radical value.
   * @param radicand The radicand under the radical surd.
   * @param index Index of radication i.e. the inverse exponent of the radicand.
   */
  constructor(radicand: RadicalValue, index?: FractionValue) {
    if (
      index === undefined &&
      typeof radicand === 'string' &&
      radicand.includes('√')
    ) {
      [index, radicand] = radicand.split('√');
      index = stripParenthesis(index || '2');
      radicand = stripParenthesis(radicand);
    }

    if (radicand instanceof Radical) {
      index = new Fraction(index || 1).mul(radicand.index);
      radicand = radicand.radicand;
    }

    this.radicand = new Fraction(radicand);

    if (this.radicand.s < 0) {
      throw new Error('Negative radicands not supported.');
    }

    const {s, n, d} = new Fraction(index || 1);
    if (s < 0) {
      this.radicand = this.radicand.inverse();
    } else if (s === 0) {
      throw new Error('Radication by zero.');
    }
    const r = this.radicand.pow(d);
    if (r === null) {
      throw new Error('Radical index denominator too large.');
    }
    this.radicand = r;
    this.index = n;

    this.reduce();
  }

  reduce() {
    const monzo = toMonzo(this.index);
    this.index = 1;
    for (let i = 0; i < monzo.length; ++i) {
      const root = new Fraction(1, PRIMES[i]);
      while (true) {
        const reduction = this.radicand.pow(root);
        if (reduction === null) {
          break;
        } else {
          this.radicand = reduction;
          monzo[i]--;
        }
      }
      this.index *= PRIMES[i] ** monzo[i];
    }
  }

  toString() {
    if (this.index === 1) {
      return this.radicand.toString();
    }
    const result = `√${this.radicand}`;
    if (this.index === 2) {
      return result;
    }
    return this.index.toString() + result;
  }

  valueOf() {
    return this.radicand.valueOf() ** (1 / this.index);
  }

  inverse() {
    return new Radical(this.radicand, -this.index);
  }

  // TODO
  floor() {}
  ceil() {}
  round() {}
  roundTo(other: RadicalValue) {}
  gcd() {}
  lcm() {}
  geoMod(other: RadicalValue) {}
  gabs() {}
  gcr(other: RadicalValue) {}
  lcr(other: RadicalValue) {}
  log(other: RadicalValue) {}
  geoRoundTo(other: RadicalValue) {}

  mul(other: RadicalValue) {
    if (!(other instanceof Radical)) {
      other = new Radical(other);
    }
    const commonFactor = gcd(this.index, other.index);
    const a = this.radicand.pow(other.index / commonFactor);
    const b = other.radicand.pow(this.index / commonFactor);
    if (a === null || b === null) {
      throw new Error('Radical multiplication failed.');
    }
    return new Radical(a.mul(b), (this.index / commonFactor) * other.index);
  }

  div(other: RadicalValue) {
    return this.mul(new Radical(other).inverse());
  }

  pow(exponent: FractionValue) {
    return new Radical(
      this.radicand,
      new Fraction(exponent).inverse().mul(this.index)
    );
  }

  compare(other: RadicalValue) {
    const ratio = this.div(other);
    return ratio.radicand.n - ratio.radicand.d;
  }

  equals(other: RadicalValue) {
    if (!(other instanceof Radical)) {
      other = new Radical(other);
    }
    return this.radicand.equals(other.radicand) && this.index === other.index;
  }
}
