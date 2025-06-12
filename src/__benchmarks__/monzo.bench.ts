import {describe, bench} from 'vitest';

// It's important to use the distributed versions for a realistic comparison
import {
  toMonzoLegacy,
  primeLimitLegacy,
  toMonzoAndResidualLegacy,
} from '../../legacy/legacy';
import {toMonzo, primeLimit, toMonzoAndResidual} from '../monzo';

function randInt() {
  return Math.ceil(Math.random() * 1000000000);
}

function randNumComponents() {
  return 2 + Math.floor(Math.random() * 10);
}

describe('Number to prime exponent vector conversion', () => {
  bench('Old implementation', () => {
    try {
      toMonzoLegacy(randInt());
    } catch {}
  });

  bench('Using probes without division', () => {
    try {
      toMonzo(randInt());
    } catch {}
  });
});

describe('Prime limit calculator', () => {
  bench('Old implementation', () => {
    primeLimitLegacy(randInt());
  });

  bench('New implementation', () => {
    primeLimit(randInt());
  });
});

describe('Monzo with residual', () => {
  bench('Current implementation', () => {
    toMonzoAndResidual(randInt(), randNumComponents());
  });

  bench('Old implementation', () => {
    toMonzoAndResidualLegacy(randInt(), randNumComponents());
  });
});

describe('Monzo with residual (bigint)', () => {
  bench('Current implementation', () => {
    toMonzoAndResidual(BigInt(randInt()), randNumComponents());
  });

  bench('Old implementation', () => {
    toMonzoAndResidualLegacy(BigInt(randInt()), randNumComponents());
  });
});
