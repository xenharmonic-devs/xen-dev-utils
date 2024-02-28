// @ts-ignore
import Benchmark = require('benchmark');
import {Fraction, gcd, lcm} from '..';

function addWithLcm(self: Fraction, other: Fraction) {
  const {s, n, d} = new Fraction(other);
  const denominator = lcm(self.d, d);
  return new Fraction(
    self.s * self.n * (denominator / self.d) + s * n * (denominator / d),
    denominator
  );
}

function addWithGcd(self: Fraction, other: Fraction) {
  const {s, n, d} = new Fraction(other);
  const factor = gcd(self.d, d);
  const df = d / factor;
  return new Fraction(
    self.s * self.n * df + s * n * (self.d / factor),
    df * self.d
  );
}

function randomFraction() {
  return new Fraction(
    Math.floor(Math.random() * 10000),
    Math.floor(Math.random() * 10000) + 1
  );
}

const fractionAddSuite = new Benchmark.Suite();
fractionAddSuite
  .add('current implementation', () => {
    randomFraction().add(randomFraction());
  })
  .add('old implementation (using lcm)', () => {
    addWithLcm(randomFraction(), randomFraction());
  })
  .add('new implementation (using gcd)', () => {
    addWithGcd(randomFraction(), randomFraction());
  })
  .on('cycle', (event: {target: any}) => {
    console.log(String(event.target));
  })
  .on('complete', () => {
    console.log('Fastest is ' + fractionAddSuite.filter('fastest').map('name'));
  })
  .run({async: true});
