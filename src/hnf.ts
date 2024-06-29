/**
 * Algorithm adapted from https://github.com/lan496/hsnf
 * Guaranteed to not overflow with BigInt matrices
 */
import {bigAbs} from './monzo';

function abs<T extends number | bigint>(x: T): T {
  if (typeof x === 'number') {
    return Math.abs(x) as T;
  }
  return bigAbs(x) as T;
}

function floorDiv<T extends number | bigint>(x: T, y: T): T {
  if (typeof x === 'number') {
    return Math.floor(x / (y as typeof x)) as T;
  }
  if (x >= 0n !== y >= 0n && x % (y as typeof x)) {
    // @ts-ignore
    return x / y - 1n;
  }
  return (x / y) as T;
}

function getPivot<T extends number | bigint>(A: T[][], i1: number, j: number) {
  let idx: number | undefined;
  let valmin: number | bigint | undefined;

  for (let i = i1; i < A.length; ++i) {
    if (!A[i][j]) {
      continue;
    }
    if (valmin === undefined || abs(A[i][j]) < valmin) {
      idx = i;
      valmin = abs(A[i][j]);
    }
  }
  return idx;
}

/**
 * Fix a 2-D matrix to have full rows (pad with zeros).
 * @param M Input matrix.
 * @returns Height, width, the padded matrix and the corresponding 0 or 0n and 1 or 1n.
 */
export function padMatrix<T extends number | bigint>(M: T[][]) {
  const height = M.length;
  if (!height) {
    return {
      height,
      width: 0,
      zero: 0 as T,
      one: 1 as T,
      M: [],
    };
  }
  let width = 0;
  let zero: T | undefined;
  for (const row of M) {
    width = Math.max(width, row.length);
    if (row.length) {
      // @ts-ignore
      zero = typeof row[0] === 'number' ? 0 : 0n;
    }
  }
  M = M.map(row => [...row]);
  if (zero === undefined) {
    return {
      height,
      width,
      zero: 0 as T,
      one: 1 as T,
      M,
    };
  }
  const one = typeof zero === 'number' ? 1 : 1n;
  for (const row of M) {
    while (row.length < width) {
      row.push(zero);
    }
  }
  return {
    height,
    width,
    zero,
    one,
    M,
  };
}

/**
 * Compute the Hermite normal form of a matrix of integers.
 * @param A The input matrix.
 * @returns The input in Hermite normal form.
 */
export function hnf<T extends number | bigint>(A: T[][]): T[][] {
  const {width, height, zero, one, M} = padMatrix(A);
  let si = 0;
  let sj = 0;

  // @ts-ignore
  const negOne: T = -one;

  while (true) {
    if (si === height || sj === width) {
      return M;
    }

    // choose a pivot
    const row = getPivot(M, si, sj);

    if (row === undefined) {
      // if there does not remain non-zero elements, go to a next column
      sj = sj + 1;
      continue;
    }
    // swap
    [M[si], M[row]] = [M[row], M[si]];

    // eliminate the s-th column entries
    for (let i = si + 1; i < height; ++i) {
      if (M[i][sj]) {
        const k = floorDiv(M[i][sj], M[si][sj]);
        for (let j = 0; j < width; ++j) {
          // @ts-ignore
          M[i][j] -= k * M[si][j];
        }
      }
    }

    // if there does not remain non-zero element in s-th column, find a next entry
    let rowDone = true;
    for (let i = si + 1; i < height; ++i) {
      if (M[i][sj]) {
        rowDone = false;
      }
    }
    if (rowDone) {
      if (M[si][sj] < zero) {
        for (let j = 0; j < width; ++j) {
          // @ts-ignore
          M[si][j] *= negOne;
        }
      }

      if (M[si][sj]) {
        for (let i = 0; i < si; ++i) {
          const k = floorDiv(M[i][sj], M[si][sj]);
          if (k) {
            for (let j = 0; j < width; ++j) {
              // @ts-ignore
              M[i][j] -= k * M[si][j];
            }
          }
        }
      }

      si += 1;
      sj += 1;
    }
  }
}

/**
 * Prune rows filled with falsy values from a 2-D matrix.
 * @param A: Matrix to prune in-place.
 */
export function pruneZeroRows(A: any[][]) {
  for (let i = 0; i < A.length; ++i) {
    if (!A[i].some(Boolean)) {
      A.splice(i, 1);
      i--;
    }
  }
}

// exact integer determinant using Bareiss algorithm
// modified slightly from:
// https://stackoverflow.com/questions/66192894/precise-determinant-of-integer-nxn-matrix

/**
 * Compute the determinant of a matrix of integers.
 * @param A The input matrix.
 * @returns The determinant.
 */
export function integerDet<T extends number | bigint>(A: T[][]): T {
  const {width, height, zero, one, M} = padMatrix(A);
  if (!width || !height || width !== height) {
    return zero;
  }
  let sign = one;
  let prev = sign;
  for (let i = 0; i < width - 1; ++i) {
    if (!M[i][i]) {
      // swap with another row having nonzero i's elem
      let swapto: number | undefined;
      for (let j = i + 1; j < height; ++j) {
        if (M[j][i]) {
          swapto = j;
          break;
        }
      }
      if (swapto === undefined) {
        return zero; // all M[*][i] are zero => zero determinant
      }
      // swap rows
      [M[i], M[swapto]] = [M[swapto], M[i]];
      sign = -sign;
    }
    for (let j = i + 1; j < height; ++j) {
      for (let k = i + 1; k < width; ++k) {
        // assert (M[j, k] * M[i, i] - M[j, i] * M[i, k]) % prev == 0
        // @ts-ignore
        M[j][k] = floorDiv(M[j][k] * M[i][i] - M[j][i] * M[i][k], prev);
      }
    }
    prev = M[i][i];
  }
  // @ts-ignore
  return sign * M.pop()!.pop()!;
}

/**
 * Anti-transpose a 2-D matrix (swap rows and columns along the other diagonal).
 * @param matrix Matrix to antitranspose.
 * @returns The antitranspose.
 */
export function antitranspose<T extends number | bigint>(matrix: T[][]): T[][] {
  const {width, height, M} = padMatrix(matrix);
  const result: T[][] = [];
  for (let i = width - 1; i >= 0; --i) {
    const row: T[] = [];
    for (let j = height - 1; j >= 0; --j) {
      row.push(M[j][i]);
    }
    result.push(row);
  }
  return result;
}

/**
 * Transpose a 2-D matrix (swap rows and columns).
 * @param matrix Matrix to transpose.
 * @returns The transpose.
 */
export function transpose<T extends number | bigint>(matrix: T[][]): T[][] {
  const {width, height, M} = padMatrix(matrix);
  const result: T[][] = [];
  for (let i = 0; i < width; ++i) {
    const row: T[] = [];
    for (let j = 0; j < height; ++j) {
      row.push(M[j][i]);
    }
    result.push(row);
  }
  return result;
}

// Find the left kernel (nullspace) of M.
// Adjoin an identity block matrix and solve for HNF.
// This is equivalent to the highschool maths method,
// but using HNF instead of Gaussian elimination.

/**
 * Find the left kernel (nullspace) of the input matrix.
 * @param A The input matrix.
 * @returns The kernel matrix.
 */
export function kernel<T extends number | bigint>(A: T[][]): T[][] {
  const {width, height, zero, one, M} = padMatrix(A);
  for (let i = 0; i < width; ++i) {
    const row = Array(width).fill(zero);
    row[i] = one;
    M.push(row);
  }
  const K = transpose(hnf(transpose(M)));
  for (let i = 0; i < height; ++i) {
    K.shift();
  }
  for (const row of K) {
    for (let i = 0; i < height; ++i) {
      row.shift();
    }
  }
  return K;
}

/**
 * Find the right kernel (nullspace) of the input matrix.
 * @param A The input matrix.
 * @returns The kernel matrix.
 */
export function cokernel<T extends number | bigint>(A: T[][]): T[][] {
  return transpose(kernel(transpose(A)));
}

/**
 * Find the preimage X of A such that AX = I.
 * @param A The input matrix.
 * @returns The preimage.
 */
export function preimage<T extends number | bigint>(A: T[][]): T[][] {
  const {width, height, zero, one, M} = padMatrix(A);
  const B = transpose(M);
  for (let i = 0; i < width; ++i) {
    for (let j = 0; j < width; ++j) {
      // @ts-ignore
      B[i].push(i === j ? one : zero);
    }
  }
  const H = hnf(B);
  while (H.length > height) {
    H.pop();
  }
  for (const row of H) {
    for (let i = 0; i < height; ++i) {
      row.shift();
    }
  }
  return transpose(H);
}
