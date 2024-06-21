import {describe, expect, it} from 'vitest';
import {
  fractionalGram,
  fractionalLenstraLenstraLovasz,
  gram,
  lenstraLenstraLovasz,
} from '../basis';
import {
  applyWeights,
  fractionalDot,
  fractionalMonzosEqual,
  monzoToFraction,
  monzosEqual,
  toMonzo,
  unapplyWeights,
} from '../monzo';
import {dot} from '../number-array';
import {LOG_PRIMES} from '../primes';

const FUZZ = 'FUZZ' in process.env;

describe('Gram process', () => {
  it('orthogonalizes a basis', () => {
    const basis = [
      [1, 2, 3],
      [4, -5, 6],
      [-7, 8, 9],
    ];
    const {ortho, dual} = gram(basis);
    // Leading orientation
    expect(monzosEqual(basis[0], ortho[0]));
    // Geometric duals
    expect(dot(ortho[0], dual[0])).toBeCloseTo(1);
    expect(dot(ortho[1], dual[1])).toBeCloseTo(1);
    expect(dot(ortho[2], dual[2])).toBeCloseTo(1);
    // Orthogonality
    expect(dot(ortho[0], ortho[1])).toBeCloseTo(0);
    expect(dot(ortho[0], ortho[2])).toBeCloseTo(0);
    expect(dot(ortho[1], ortho[2])).toBeCloseTo(0);
    // Value
    expect(ortho.map(o => o.map(c => c.toFixed(2)))).toEqual([
      ['1.00', '2.00', '3.00'],
      ['3.14', '-6.71', '3.43'],
      ['-7.46', '-1.66', '3.59'],
    ]);
  });

  it('handles non-basis', () => {
    const basis = [
      [1, 2, 3, 4],
      [0, 1, 1, 0],
      [1, 1, 2, 4],
      [-1, 2, 0, 0],
    ];
    const {ortho} = gram(basis);
    // Pseudo-orthogonality
    expect(dot(ortho[0], ortho[1])).toBeCloseTo(0);
    expect(dot(ortho[0], ortho[2])).toBeCloseTo(0);
    expect(dot(ortho[0], ortho[3])).toBeCloseTo(0);
    expect(dot(ortho[1], ortho[2])).toBeCloseTo(0);
    expect(dot(ortho[1], ortho[3])).toBeCloseTo(0);
    expect(dot(ortho[2], ortho[3])).toBeCloseTo(0);
  });

  it.runIf(FUZZ)('Fuzzes for random bases', () => {
    for (let k = 0; k < 100000; ++k) {
      const basis: number[][] = [];
      for (let i = Math.random() * 10; i > 0; --i) {
        const row: number[] = [];
        for (let j = Math.random() * 10; j > 0; --j) {
          row.push(Math.random() * 100 - 50);
        }
        basis.push(row);
      }
      const {ortho} = gram(basis);
      // Pseudo-orthogonality
      for (let i = 0; i < basis.length; ++i) {
        for (let j = 0; j < i; ++j) {
          expect(dot(ortho[i], ortho[j])).toBeCloseTo(0);
        }
      }
    }
  });
});

describe('Gram process for arrays of fractions', () => {
  it('orthogonalizes a basis', () => {
    const basis = [
      [1, 2, 3],
      [4, -5, 6],
      [-7, 8, 9],
    ];
    const {ortho, dual} = fractionalGram(basis);
    // Leading orientation
    expect(fractionalMonzosEqual(basis[0], ortho[0]));
    // Geometric duals
    expect(fractionalDot(ortho[0], dual[0]).toFraction()).toBe('1');
    expect(fractionalDot(ortho[1], dual[1]).toFraction()).toBe('1');
    expect(fractionalDot(ortho[2], dual[2]).toFraction()).toBe('1');
    // Orthogonality
    expect(fractionalDot(ortho[0], ortho[1]).n).toBe(0);
    expect(fractionalDot(ortho[0], ortho[2]).n).toBe(0);
    expect(fractionalDot(ortho[1], ortho[2]).n).toBe(0);
    // Value
    expect(ortho.map(o => o.map(c => c.toFraction()))).toEqual([
      ['1', '2', '3'],
      ['22/7', '-47/7', '24/7'],
      ['-3483/467', '-774/467', '1677/467'],
    ]);
  });

  it('handles non-basis', () => {
    const basis = [
      [1, 2, 3, 4],
      [0, 1, 1, 0],
      [1, 1, 2, 4],
      [-1, 2, 0, 0],
    ];
    const {ortho} = fractionalGram(basis);
    // Pseudo-orthogonality
    expect(fractionalDot(ortho[0], ortho[1]).n).toBeCloseTo(0);
    expect(fractionalDot(ortho[0], ortho[2]).n).toBeCloseTo(0);
    expect(fractionalDot(ortho[0], ortho[3]).n).toBeCloseTo(0);
    expect(fractionalDot(ortho[1], ortho[2]).n).toBeCloseTo(0);
    expect(fractionalDot(ortho[1], ortho[3]).n).toBeCloseTo(0);
    expect(fractionalDot(ortho[2], ortho[3]).n).toBeCloseTo(0);
  });
});

describe('LLL basis reduction', () => {
  it('can LLL reduce', () => {
    const basis = [
      [1, 1, 1],
      [-1, 0, 2],
      [3, 5, 6],
    ];
    const lll = lenstraLenstraLovasz(basis);
    // Size-reduction
    for (let i = 0; i < 3; ++i) {
      for (let j = 0; j < i; ++j) {
        expect(
          Math.abs(dot(lll.basis[i], lll.gram.dual[j]))
        ).toBeLessThanOrEqual(0.5);
      }
    }
    // Lovász condition
    for (let k = 1; k < 3; ++k) {
      const ok = lll.gram.ortho[k];
      const ok1 = lll.gram.ortho[k - 1];
      const mu = dot(lll.basis[k], lll.gram.dual[k - 1]);
      const n1 = dot(ok1, ok1);
      expect((n1 * 3) / 4).toBeLessThanOrEqual(dot(ok, ok) + n1 * mu * mu);
    }

    expect(lll.basis).toEqual([
      [0, 1, 0],
      [1, 0, 1],
      [-1, 0, 2],
    ]);
  });

  it('handles non-basis', () => {
    const basis = [
      [1, 2, 3, 4],
      [0, 1, 1, 0],
      [1, 1, 2, 4],
      [-1, 2, 0, 0],
    ];
    const lll = lenstraLenstraLovasz(basis);
    expect(lll.basis).toEqual([
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [-1, 1, -1, 0],
      [0, 0, -1, 4],
    ]);
  });

  it('can mess up the basis of miracle with naïve weights', () => {
    const basis = ['225/224', '1029/1024'].map(toMonzo);
    const lll = lenstraLenstraLovasz(basis);
    expect(lll.basis.map(m => monzoToFraction(m).toFraction())).toEqual([
      '225/224',
      '2401/2400',
    ]);
  });

  it('can fix the basis of miracle with Tenney weights', () => {
    const basis = ['225/224', '2401/2400']
      .map(toMonzo)
      .map(m => applyWeights(m, LOG_PRIMES));
    const lll = lenstraLenstraLovasz(basis);
    const commas = lll.basis
      .map(m => unapplyWeights(m, LOG_PRIMES).map(Math.round))
      .map(m => monzoToFraction(m).toFraction());
    expect(commas).toEqual(['225/224', '1029/1024']);
  });

  it.runIf(FUZZ)('Fuzzes for random bases', () => {
    for (let k = 0; k < 1000; ++k) {
      let basis: number[][] = [];
      for (let i = Math.random() * 10; i > 0; --i) {
        const row: number[] = [];
        for (let j = Math.random() * 10; j > 0; --j) {
          row.push(Math.random() * 100 - 50);
        }
        basis.push(row);
      }
      if (Math.random() < 0.5) {
        basis = basis.map(row => row.map(Math.round));
      }
      const lll = lenstraLenstraLovasz(basis);
      if (lll.gram.squaredLengths.every(l => l)) {
        // Size-reduction
        for (let i = 0; i < basis.length; ++i) {
          for (let j = 0; j < i; ++j) {
            expect(
              Math.abs(dot(lll.basis[i], lll.gram.dual[j]))
            ).toBeLessThanOrEqual(0.5);
          }
        }
        // Lovász condition
        for (let k = 1; k < basis.length; ++k) {
          const ok = lll.gram.ortho[k];
          const ok1 = lll.gram.ortho[k - 1];
          const mu = dot(lll.basis[k], lll.gram.dual[k - 1]);
          const n1 = dot(ok1, ok1);
          expect((n1 * 3) / 4).toBeLessThanOrEqual(dot(ok, ok) + n1 * mu * mu);
        }
      }
    }
  });
});

describe('Precise LLL basis reduction', () => {
  it('can LLL reduce', () => {
    const basis = [
      [1, 1, 1],
      [-1, 0, 2],
      [3, 5, 6],
    ];
    const lll = fractionalLenstraLenstraLovasz(basis);
    // Size-reduction
    for (let i = 0; i < 3; ++i) {
      for (let j = 0; j < i; ++j) {
        expect(
          fractionalDot(lll.basis[i], lll.gram.dual[j]).compare(0.5)
        ).toBeLessThanOrEqual(0);
      }
    }
    // Lovász condition
    for (let k = 1; k < 3; ++k) {
      const ok = lll.gram.ortho[k];
      const ok1 = lll.gram.ortho[k - 1];
      const mu = fractionalDot(lll.basis[k], lll.gram.dual[k - 1]);
      const n1 = fractionalDot(ok1, ok1);
      expect(
        n1.mul('3/4').compare(fractionalDot(ok, ok).add(n1.mul(mu.mul(mu))))
      ).toBeLessThanOrEqual(0);
    }

    expect(lll.basis.map(row => row.map(f => f.valueOf()))).toEqual([
      [0, 1, 0],
      [1, 0, 1],
      [-1, 0, 2],
    ]);
  });

  it('handles non-basis', () => {
    const basis = [
      [1, 2, 3, 4],
      [0, 1, 1, 0],
      [1, 1, 2, 4],
      [-1, 2, 0, 0],
    ];
    const lll = fractionalLenstraLenstraLovasz(basis);
    expect(lll.basis.map(row => row.map(f => f.valueOf()))).toEqual([
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [-1, 1, -1, 0],
      [0, 0, -1, 4],
    ]);
  });

  it.runIf(FUZZ)('Fuzzes for random bases', () => {
    for (let k = 0; k < 500; ++k) {
      let basis: number[][] = [];
      for (let i = Math.random() * 10; i > 0; --i) {
        const row: number[] = [];
        for (let j = Math.random() * 10; j > 0; --j) {
          row.push(Math.random() * 20 - 10);
        }
        basis.push(row);
      }
      basis = basis.map(row => row.map(Math.round));
      try {
        const lll = fractionalLenstraLenstraLovasz(basis);
        if (lll.gram.squaredLengths.every(l => l.n)) {
          // Size-reduction
          for (let i = 0; i < basis.length; ++i) {
            for (let j = 0; j < i; ++j) {
              expect(
                fractionalDot(lll.basis[i], lll.gram.dual[j]).abs().compare(0.5)
              ).toBeLessThanOrEqual(0);
            }
          }
          // Lovász condition
          for (let k = 1; k < basis.length; ++k) {
            const ok = lll.gram.ortho[k];
            const ok1 = lll.gram.ortho[k - 1];
            const mu = fractionalDot(lll.basis[k], lll.gram.dual[k - 1]);
            const n1 = fractionalDot(ok1, ok1);
            expect(
              n1
                .mul('3/4')
                .compare(fractionalDot(ok, ok).add(n1.mul(mu).mul(mu)))
            ).toBeLessThanOrEqual(0);
          }
        }
      } catch (e) {
        expect(e.message).includes('above safe limit');
      }
    }
  });
});
