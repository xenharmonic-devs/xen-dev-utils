// @ts-ignore
import Benchmark = require('benchmark');
import {PRIMES, isPrime} from '../primes';

function withoutInclusionCheck(n: number) {
  if (!Number.isInteger(n) || n < 2) {
    return false;
  }
  if (n > 62837328) {
    throw new Error('Prime check only implemented up to 62837328');
  }
  for (const prime of PRIMES) {
    if (prime * prime > n) {
      return true;
    }
    if (n % prime === 0) {
      return false;
    }
  }
  return true;
}

function randSmallInt() {
  return Math.floor(Math.random() * 10000);
}

const primalityCheckSuite = new Benchmark.Suite();
primalityCheckSuite
  .add('primality check (with array inclusion)', () => isPrime(randSmallInt()))
  .add('primality check (without array inclusion)', () =>
    withoutInclusionCheck(randSmallInt())
  )
  .on('cycle', (event: {target: any}) => {
    console.log(String(event.target));
  })
  .on('complete', () => {
    console.log(
      'Fastest is ' + primalityCheckSuite.filter('fastest').map('name')
    );
  })
  .run({async: true});
