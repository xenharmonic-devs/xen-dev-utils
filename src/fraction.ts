import FractionJS, {NumeratorDenominator} from 'fraction.js';

export * from 'fraction.js';

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
