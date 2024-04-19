import {describe, bench} from 'vitest';

// It's important to use the distributed versions for a realistic comparison
import {toMonzoLegacy, primeLimitLegacy} from '../../legacy/legacy';
import {toMonzo, primeLimit} from '../../dist';

function randInt() {
  return Math.ceil(Math.random() * 1000000000);
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
