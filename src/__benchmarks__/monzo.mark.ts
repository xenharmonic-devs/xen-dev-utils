// @ts-ignore
import Benchmark = require('benchmark');
import {PRIMES} from '../primes';
import {type Monzo, toMonzo} from '../monzo';

function numberToMonzo(n: number) {
  if (n < 0) {
    throw new Error('Cannot convert negative number to monzo');
  }
  const result: Monzo = [];
  PRIMES.every(prime => {
    let component = 0;
    while (n % prime === 0) {
      n /= prime;
      component++;
    }
    result.push(component);
    return n !== 1;
  });
  if (n !== 1) {
    throw new Error('Out of primes');
  }
  return result;
}

function randInt() {
  return Math.ceil(Math.random() * 10000000000);
}

const intToMonzoSuite = new Benchmark.Suite();
intToMonzoSuite
  .add('old monzo converter (using division and modulo)', () => {
    try {
      numberToMonzo(randInt());
    } catch {}
  })
  .add('new monzo converter (using modulo only)', () => {
    try {
      toMonzo(randInt());
    } catch {}
  })
  .on('cycle', (event: {target: any}) => {
    console.log(String(event.target));
  })
  .on('complete', () => {
    console.log('Fastest is ' + intToMonzoSuite.filter('fastest').map('name'));
  })
  .run({async: true});
