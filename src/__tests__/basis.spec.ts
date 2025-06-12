import {describe, expect, it} from 'vitest';
import {
  det,
  eye,
  fractionalDet,
  fractionalEye,
  fractionalGram,
  fractionalInv,
  fractionalLenstraLenstraLovasz,
  fractionalMatadd,
  fractionalMatscale,
  fractionalMatsub,
  fractionalMatmul,
  fractionalTranspose,
  gram,
  inv,
  lenstraLenstraLovasz,
  matadd,
  matscale,
  matsub,
  matmul,
  minor,
  canonical,
  respell,
  solveDiophantine,
} from '../basis';
import {
  FractionalMonzo,
  applyWeights,
  fractionalDot,
  fractionalMonzosEqual,
  monzoToFraction,
  monzosEqual,
  toMonzo,
  unapplyWeights,
} from '../monzo';
import {dot} from '../number-array';
import {LOG_PRIMES, PRIMES} from '../primes';
import {Fraction} from '../fraction';
import {cokernel, kernel, preimage, transpose} from '../hnf';

const FUZZ = 'FUZZ' in process.env;

function naiveDet(matrix: number[][]): number {
  if (!matrix.length) {
    return 1;
  }
  let result = 0;
  for (let i = 0; i < matrix.length; ++i) {
    result += (-1) ** i * matrix[0][i] * naiveDet(minor(matrix, 0, i));
  }
  return result;
}

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
          Math.abs(dot(lll.basis[i], lll.gram.dual[j])),
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
              Math.abs(dot(lll.basis[i], lll.gram.dual[j])),
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
          fractionalDot(lll.basis[i], lll.gram.dual[j]).compare(0.5),
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
        n1.mul('3/4').compare(fractionalDot(ok, ok).add(n1.mul(mu.mul(mu)))),
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
                fractionalDot(lll.basis[i], lll.gram.dual[j])
                  .abs()
                  .compare(0.5),
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
                .compare(fractionalDot(ok, ok).add(n1.mul(mu).mul(mu))),
            ).toBeLessThanOrEqual(0);
          }
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        expect(message).includes('above safe limit');
      }
    }
  });
});

describe('Matrix multiplication', () => {
  it('multiplies two matrices', () => {
    const A = [
      [1, 0, 1],
      [2, 1, 1],
      [0, 1, 1],
      [1, 1, 2],
    ];
    const B = [
      [1, 2, 1],
      [2, 3, 1],
      [4, 2, 2],
    ];
    const C = matmul(A, B);
    expect(C).toEqual([
      [5, 4, 3],
      [8, 9, 5],
      [6, 5, 3],
      [11, 9, 6],
    ]);
  });

  it('multiplies a matrix with a vector', () => {
    const A = [
      [1, 2],
      [3, 4],
    ];
    const v = [5, 6];
    const u = matmul(A, v);
    expect(u).toEqual([17, 39]);
  });

  it('multiplies a vector with a matrix', () => {
    const A = [
      [1, 2],
      [3, 4],
    ];
    const v = [5, 6];
    const u = matmul(v, A);
    expect(u).toEqual([23, 34]);
  });

  it('multiplies a vector with a vector', () => {
    const u = [1, 2];
    const v = [5, 6];
    const s = matmul(u, v);
    expect(s).toEqual(17);
  });

  it('multiplies two matrices (fractions)', () => {
    const A = [
      [1, 0, 1],
      [2, 1, 1],
      [0, 0.5, 1],
      [1, 1, 2],
    ];
    const B = [
      [1, 2, 1],
      [2, 3, 1],
      ['4/3', 2, 2],
    ];
    const C = fractionalMatmul(A, B);
    expect(C.map(row => row.map(f => f.toFraction()))).toEqual([
      ['7/3', '4', '3'],
      ['16/3', '9', '5'],
      ['7/3', '7/2', '5/2'],
      ['17/3', '9', '6'],
    ]);
  });

  it('multiplies a matrix with a vector (fractions)', () => {
    const A = [
      [1, 2],
      [3, 0.5],
    ];
    const v = [5, '1/3'];
    const u = fractionalMatmul(A, v);
    expect(u.map(f => f.toFraction())).toEqual(['17/3', '91/6']);
  });

  it('multiplies a vector with a matrix (fractions)', () => {
    const A = [
      [1, 2],
      [3, '1/3'],
    ];
    const v = [5, 0.5];
    const u = fractionalMatmul(v, A);
    expect(u.map(f => f.toFraction())).toEqual(['13/2', '61/6']);
  });

  it('multiplies a vector with a vector (fractions)', () => {
    const u = [0.5, 2];
    const v = [5, '5/7'];
    const s = fractionalMatmul(u, v);
    expect(s.toFraction()).toBe('55/14');
  });
});

describe('Matrix inverse', () => {
  it('computes a 3x3 inverse', () => {
    const mat = [
      [2, -1], // Missing entry interpreted as 0
      [-1, 2, -1],
      [0, -1, 2],
    ];
    const inverse = inv(mat).map(row => row.map(x => Math.round(4 * x) / 4));
    expect(inverse).toEqual([
      [0.75, 0.5, 0.25],
      [0.5, 1, 0.5],
      [0.25, 0.5, 0.75],
    ]);
  });

  it('computes another 3x3 inverse', () => {
    const mat = [
      [-2, -1, 2],
      [2, 1, 4],
      [-3, 3, -1],
    ];
    const inverse = inv(mat).map(row => row.map(x => Math.round(100000 * x)));
    expect(inverse).toEqual([
      [-24074, 9259, -11111],
      [-18519, 14815, 22222],
      [16667, 16667, 0],
    ]);
  });

  it.each([2, 3, 4, 5, 6, 7, 8, 9, 10, 11])(
    'computes inverse of a Vandermonde matrix %s',
    (N: number) => {
      const mat: number[][] = [];
      for (const p of PRIMES.slice(0, N)) {
        const row = [...Array(N).keys()].map(i => p ** -i);
        mat.push(row);
      }
      expect(
        matmul(mat, inv(mat)).map(row =>
          row.map(x => Math.round(10000 * x) / 10000 || 0),
        ),
      ).toEqual(eye(N));
    },
  );

  it('throws for non-square matrix', () => {
    expect(() =>
      inv([
        [1, 2],
        [3, 4],
        [5, 6],
      ]),
    ).toThrow('Non-square matrix');
  });

  it('throws for singular matrix', () => {
    expect(() =>
      inv([
        [1, 0],
        [0, 0],
      ]),
    ).toThrow('Matrix is singular');
  });

  it('computes a 3x3 with fractional entries', () => {
    const mat = [
      [2, -1], // Missing entry interpreted as 0
      [-1, '2/1', -1],
      [0, -1, '2'],
    ];
    const inverse = fractionalInv(mat).map(row => row.map(x => x.toFraction()));
    expect(inverse).toEqual([
      ['3/4', '1/2', '1/4'],
      ['1/2', '1', '1/2'],
      ['1/4', '1/2', '3/4'],
    ]);
  });

  it('computes another 3x3 inverse with fractional result', () => {
    const mat = [
      [-2, -1, 2],
      [2, 1, 4],
      [-3, 3, -1],
    ];
    const inverse = fractionalInv(mat).map(row => row.map(x => x.toFraction()));
    expect(inverse).toEqual([
      ['-13/54', '5/54', '-1/9'],
      ['-5/27', '4/27', '2/9'],
      ['1/6', '1/6', '0'],
    ]);
  });

  it.each([2, 3, 4, 5, 6])(
    'computes exact inverse of a Vandermonde matrix %s',
    (N: number) => {
      const mat: Fraction[][] = [];
      for (const p of PRIMES.slice(0, N)) {
        const row = [...Array(N).keys()].map(i => new Fraction(p).pow(-i)!);
        mat.push(row);
      }
      expect(
        fractionalMatmul(mat, fractionalInv(mat)).map(row =>
          row.map(x => x.valueOf()),
        ),
      ).toEqual(eye(N));
    },
  );

  it('throws for non-square matrix with fractional entries', () => {
    expect(() =>
      fractionalInv([
        [1, 2],
        [3, 4],
        [5, 6],
      ]),
    ).toThrow('Non-square matrix');
  });

  it('throws for singular matrix with fractional entries', () => {
    expect(() =>
      fractionalInv([
        [1, 0],
        [0, 0],
      ]),
    ).toThrow('Matrix is singular');
  });

  it.runIf(FUZZ)('fuzzes for random inverses', () => {
    for (let k = 0; k < 10000; ++k) {
      const mat: number[][] = [];
      const N = Math.ceil(1 + Math.random() * 10);
      for (let i = 0; i < N; ++i) {
        const row: number[] = [];
        for (let j = 0; j < N; ++j) {
          row.push(Math.random() * 10 - 5);
        }
        mat.push(row);
      }
      const inverse = inv(mat);
      const I = matmul(mat, inverse).map(row =>
        row.map(x => Math.round(x * 1024) / 1024 || 0),
      );
      expect(I).toEqual(eye(N));
    }
  });

  it.runIf(FUZZ)('fuzzes for random inverses (fractional)', () => {
    for (let k = 0; k < 1000; ++k) {
      const mat: number[][] = [];
      const N = Math.ceil(1 + Math.random() * 7);
      for (let i = 0; i < N; ++i) {
        const row: number[] = [];
        for (let j = 0; j < N; ++j) {
          row.push(Math.round(Math.random() * 10 - 5));
        }
        mat.push(row);
      }
      const determinant = naiveDet(mat);
      let inverse: FractionalMonzo[] | undefined;
      try {
        inverse = fractionalInv(mat);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (!determinant) {
          expect(message).toBe('Matrix is singular');
        }
        /** empty */
      }
      if (inverse) {
        expect(determinant).not.toBe(0);
        const I = fractionalMatmul(mat, inverse);
        expect(I).toEqual(fractionalEye(N));
      }
    }
  });
});

describe('Determinant', () => {
  it('computes the determinant of a 3x3 matrix', () => {
    const mat = [
      [-2, -1, 2],
      [2, 1, 4],
      [-3, 3, -1],
    ];
    const determinant = det(mat);
    expect(determinant).toBe(54);
  });

  it.each([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13])(
    'computes the determinant of a Vandermonde matrix %s',
    (N: number) => {
      const mat: number[][] = [];
      for (const p of PRIMES.slice(0, N)) {
        const row = [...Array(N).keys()].map(i => p ** -i);
        mat.push(row);
      }
      let analytic = 1;
      for (let i = 0; i < N; ++i) {
        for (let j = i + 1; j < N; ++j) {
          analytic *= 1 / PRIMES[j] - 1 / PRIMES[i];
        }
      }
      expect(det(mat) / analytic).toBeCloseTo(1, 1);
    },
  );

  it('computes 0 for the origin', () => {
    const mat = [[0, 0], []];
    const determinant = det(mat);
    expect(determinant).toBe(0);
  });

  it('computes the area of a square', () => {
    const sides = [
      [1, 1],
      [-1, 1],
    ];
    const determinant = det(sides);
    expect(determinant).toBe(2);
  });

  it('computes the volume of a skew-aligned box', () => {
    const sides = [
      [1, 1, 1],
      [-Math.SQRT2, Math.SQRT1_2, Math.SQRT1_2],
      [0, 1, -1],
    ];
    const determinant = det(sides);
    expect(determinant).toBe(-3 * Math.SQRT2);
  });

  it('computes the determinant of a 3x3 matrix with fractional entries', () => {
    const mat = [
      [-2, -1, 2],
      [2, 0.5, 4],
      [-3, 3, '-1/3'],
    ];
    const d = fractionalDet(mat);
    expect(d.toFraction()).toBe('152/3');
  });

  it('computes the determinant of a 4x4 matrix', () => {
    const mat = [
      [-0, -1, 3, 2],
      [-0, -3, -0, 3],
      [2, 1, 0, -4],
      [-4, -3, -5, -3],
    ];
    expect(det(mat)).toBe(-186);
  });

  it('computes the determinant of a 4x4 matrix (fractional)', () => {
    const mat = [
      [-0, -1, 3, 2],
      [-0, -3, -0, 3],
      [2, 1, 0, -4],
      [-4, -3, -5, -3],
    ];
    expect(fractionalDet(mat).valueOf()).toBe(-186);
  });

  it.runIf(FUZZ)('agrees with the naïve implementation', () => {
    for (let i = 0; i < 1000; ++i) {
      const mat: number[][] = [];
      const N = Math.ceil(1 + Math.random() * 8);
      for (let i = 0; i < N; ++i) {
        const row: number[] = [];
        for (let j = 0; j < N; ++j) {
          row.push(Math.random() * 10 - 5);
        }
        mat.push(row);
      }
      const determinant = det(mat);
      const naive = naiveDet(mat);
      expect(determinant).toBeCloseTo(naive);
    }
  });

  it.runIf(FUZZ)('agrees with the naïve implementation (fractional)', () => {
    for (let i = 0; i < 100; ++i) {
      const mat: number[][] = [];
      const N = Math.ceil(1 + Math.random() * 8);
      for (let i = 0; i < N; ++i) {
        const row: number[] = [];
        for (let j = 0; j < N; ++j) {
          row.push(Math.round(Math.random() * 10 - 5));
        }
        mat.push(row);
      }
      const determinant = fractionalDet(mat);
      const naive = naiveDet(mat);
      expect(determinant.valueOf()).toBe(naive);
    }
  });
});

describe('Transpose', () => {
  it('transposes a 3x2 matrix with rational entries', () => {
    const mat = [[1, 0.5], [3], ['2/7', 5]];
    expect(
      fractionalTranspose(mat).map(row => row.map(f => f.toFraction())),
    ).toEqual([
      ['1', '3', '2/7'],
      ['1/2', '0', '5'],
    ]);
  });
});

describe('Auxiliary matrix methods', () => {
  it('scales', () => {
    const A = [
      [1, 2],
      [3, 4],
    ];
    expect(matscale(A, 2)).toEqual([
      [2, 4],
      [6, 8],
    ]);
    expect(
      fractionalMatscale(A, 2).map(row => row.map(f => f.valueOf())),
    ).toEqual([
      [2, 4],
      [6, 8],
    ]);
  });

  it('adds', () => {
    const A = [
      [1, 2],
      [3, 4],
    ];
    const B = [
      [-1, 5],
      [6, 7],
    ];
    expect(matadd(A, B)).toEqual([
      [0, 7],
      [9, 11],
    ]);
    expect(
      fractionalMatadd(A, B).map(row => row.map(f => f.valueOf())),
    ).toEqual([
      [0, 7],
      [9, 11],
    ]);
  });

  it('subtracts', () => {
    const A = [
      [1, 2],
      [3, 4],
    ];
    const B = [
      [-1, 5],
      [6, 7],
    ];
    expect(matsub(A, B)).toEqual([
      [2, -3],
      [-3, -3],
    ]);
    expect(
      fractionalMatsub(A, B).map(row => row.map(f => f.valueOf())),
    ).toEqual([
      [2, -3],
      [-3, -3],
    ]);
  });
});

describe("Sin-tel's example", () => {
  it('agrees with temper/example.py', () => {
    // 31 & 19
    const tMap = [
      [19, 30, 44, 53],
      [31, 49, 72, 87],
    ];
    // Canonical form
    const c = [
      [1, 0, -4, -13],
      [0, 1, 4, 10],
    ];
    const can = canonical(tMap);
    expect(can).toEqual(c);

    let commas = transpose(kernel(can));
    expect(commas.map(comma => monzoToFraction(comma).toFraction())).toEqual([
      '126/125',
      '1275989841/1220703125',
    ]);

    commas = lenstraLenstraLovasz(commas).basis;
    expect(commas.map(comma => monzoToFraction(comma).toFraction())).toEqual([
      '126/125',
      '81/80',
    ]);

    const gens = transpose(preimage(can));

    expect(gens.map(gen => monzoToFraction(gen).toFraction())).toEqual([
      '20253807/9765625',
      '3',
    ]);

    const simpleGens = gens.map(gen => respell(gen, commas));

    expect(simpleGens.map(gen => monzoToFraction(gen).toFraction())).toEqual([
      '2',
      '3',
    ]);
  });

  it('agrees with temper/example_commas.py', () => {
    const commas = ['81/80', '225/224'].map(toMonzo);

    expect(commas).toEqual([
      [-4, 4, -1],
      [-5, 2, 2, -1],
    ]);

    const tMap = cokernel(transpose(commas));
    expect(tMap).toEqual([
      [1, 0, -4, -13],
      [0, 1, 4, 10],
    ]);
  });
});

describe('Diophantine equation solver', () => {
  it.skip('solves a diophantine equation', () => {
    const A = [
      [1, 2, 3],
      [-4, 5, 6],
      [7, -8, 9],
    ];
    const b = [4, 28, -28];
    const solution = solveDiophantine(A, b);
    expect(solution).toEqual([-3, 2, 1]);
  });

  it('converts standard basis commas to subgroup basis monzos (pinkan)', () => {
    const subgroup = '2.3.13/5.19/5'.split('.').map(toMonzo);
    const commas = ['676/675', '1216/1215'].map(toMonzo);
    const subgroupMonzos = solveDiophantine(
      transpose(subgroup),
      transpose(commas),
    );
    expect(transpose(subgroupMonzos)).toEqual([
      [2, -3, 2, 0],
      [6, -5, 0, 1],
    ]);
  });
});
