// @ts-ignore
import Benchmark = require('benchmark');
import {PRIMES} from '../primes';
import {type Monzo, toMonzo, sub, primeLimit} from '../monzo';
import {Fraction, FractionValue} from '../fraction';

// Old implementation
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

// Second iteration
export function toMonzoWhile(n: FractionValue): Monzo {
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
    while (!(n & 1)) {
      n >>= 1;
      result[0]++;
    }
    if (n === 1) {
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

// First iteration
export function primeLimitWhile(n: FractionValue, maxLimit = 7919): number {
  if (typeof n !== 'number') {
    n = new Fraction(n);
    return Math.max(
      primeLimitWhile(n.n, maxLimit),
      primeLimitWhile(n.d, maxLimit)
    );
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
    while (!(n & 1)) {
      n >>= 1;
    }
    if (n === 1) {
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
  .add('second monzo converter (using modulo only with while)', () => {
    try {
      toMonzoWhile(randInt());
    } catch {}
  })
  .add('new monzo converter (using modulo only without while)', () => {
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

const primeLimitSuite = new Benchmark.Suite();
primeLimitSuite
  .add('first prime limit calculator (using while)', () => {
    try {
      primeLimitWhile(randInt());
    } catch {}
  })
  .add('new prime limit calculator (without while)', () => {
    try {
      primeLimit(randInt());
    } catch {}
  })
  .on('cycle', (event: {target: any}) => {
    console.log(String(event.target));
  })
  .on('complete', () => {
    console.log('Fastest is ' + primeLimitSuite.filter('fastest').map('name'));
  })
  .run({async: true});
