import {describe, it, expect} from 'vitest';
import {Radical} from '../radical';
import {Fraction} from '../fraction';

describe('Radical', () => {
  it('can represent root two', () => {
    const radical = new Radical(2, 2);
    expect(radical.radicand.equals(new Fraction(2))).toBe(true);
    expect(radical.index).toBe(2);
    expect(radical.mul(radical).equals(2)).toBe(true);
    expect(radical.toString()).toBe('√2');
  });

  it('can represent the fifth of 12-TET', () => {
    const fif = new Radical(2, '12/7');
    expect(fif.radicand.equals(4096));
    expect(fif.index).toBe(12);
    expect(fif.valueOf()).toBeCloseTo(2 ** (7 / 12));
    expect(fif.mul(fif).div(2).equals(new Radical(2, '12/2'))).toBe(true);
  });

  it('can represent the cube root of 5', () => {
    const radical = new Radical(5, 3);
    expect(radical.pow(3).equals(5)).toBe(true);
    expect(radical.toString()).toBe('3√5');
  });

  it('can compare 5^(2/3) to 3', () => {
    const radical = new Radical(5, 1.5);
    expect(radical.compare(3)).toBeLessThan(0);
    expect(radical.valueOf()).toBeCloseTo(2.924);
  });

  it('can parse root three', () => {
    const radical = new Radical('√3');
    expect(radical.pow(2).equals(3)).toBe(true);
  });

  it('can parse (3/2)√(10/7)', () => {
    const radical = new Radical('(3/2)√(10/7)');
    expect(radical.pow(3).equals(new Fraction(10, 7).pow(2)!)).toBe(true);
  });

  // TODO
  it.skip('can parse 2^3', () => {
    const radical = new Radical('2^3');
    expect(radical.equals(8)).toBe(true);
  });

  // TODO
  it.skip('can parse (5/3)**(3/2)', () => {
    const radical = new Radical('(5/3)**(3/2)');
    expect(radical.pow(2).equals(new Fraction(5, 3).pow(3)!)).toBe(true);
  });
});
