import {describe, it, expect} from 'vitest';
import {antitranspose, hnf, integerDet, preimage, transpose} from '../hnf';

describe('Hermite normal form', () => {
  it('works on a small matrix', () => {
    const A = [
      [2, 3, 6, 2],
      [5, 6, 1, 6],
      [8, 3, 1, 1],
    ];

    const H = hnf(A);

    expect(H).toEqual([
      [1, 0, 50, -11],
      [0, 3, 28, -2],
      [0, 0, 61, -13],
    ]);
  });

  it('works on a small matrix (bigint)', () => {
    const A = [
      [2n, 3n, 6n, 2n],
      [5n, 6n, 1n, 6n],
      [8n, 3n, 1n, 1n],
    ];

    const H = hnf(A);

    expect(H).toEqual([
      [1n, 0n, 50n, -11n],
      [0n, 3n, 28n, -2n],
      [0n, 0n, 61n, -13n],
    ]);
  });
});

describe('Integer determinant', () => {
  it('works on a small matrix', () => {
    const mat = [
      [-2, -1, 2],
      [2, 1, 4],
      [-3, 3, -1],
    ];
    const determinant = integerDet(mat);
    expect(determinant).toBe(54);
  });

  it('works on a small matrix (bigint)', () => {
    const mat = [
      [-2n, -1n, 2n],
      [2n, 1n, 4n],
      [-3n, 3n, -1n],
    ];
    const determinant = integerDet(mat);
    expect(determinant).toBe(54n);
  });
});

describe('Transpose', () => {
  it('transposes a 3x2 matrix', () => {
    const mat = [[1, 2], [3], [4, 5]];
    expect(transpose(mat)).toEqual([
      [1, 3, 4],
      [2, 0, 5],
    ]);
  });
});

describe('Anti-transpose', () => {
  it('anti-transposes a 3x2 matrix', () => {
    const mat = [
      [1, 2],
      [3, 4],
      [5, 6],
    ];
    expect(antitranspose(mat)).toEqual([
      [6, 4, 2],
      [5, 3, 1],
    ]);
  });
});

describe('Preimage', () => {
  it('obtains the preimage associated with 5-limit meantone', () => {
    const map = [
      [1, 0, -4],
      [0, 1, 4],
    ];
    const gensT = preimage(map);
    expect(gensT).toEqual([
      [1, 0],
      [0, 1],
      [0, 0],
    ]);
  });
});
