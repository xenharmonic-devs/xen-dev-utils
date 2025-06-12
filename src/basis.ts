import {Fraction, FractionValue} from './fraction';
import {
  FractionalMonzo,
  Monzo,
  ProtoFractionalMonzo,
  add,
  fractionalAdd,
  fractionalDot,
  fractionalScale,
  fractionalSub,
  monzosEqual,
  scale,
  sub,
} from './monzo';
import {dot} from './number-array';
import {transpose, hnf, integerDet, antitranspose, padMatrix} from './hnf';

/**
 * Result of Gram–Schmidt process without normalization.
 */
export type GramResult = {
  /** Orthogonal basis with the leading basis element intact. */
  ortho: number[][];
  /** Squared lengths of the orthogonal basis. */
  squaredLengths: number[];
  /** Geometric duals of the orthogonal basis. */
  dual: number[][];
};

/**
 * Result of Gram–Schmidt process without normalization.
 */
export type FractionalGramResult = {
  /** Orthogonal basis with the leading basis element intact. */
  ortho: FractionalMonzo[];
  /** Squared lengths of the orthogonal basis. */
  squaredLengths: Fraction[];
  /** Geometric duals of the orthogonal basis. */
  dual: FractionalMonzo[];
};

/**
 * Result of Lenstra-Lenstra-Lovász basis reduction.
 */
export type LLLResult = {
  /** Basis that's short and nearly orthogonal. */
  basis: number[][];
  /** Gram-Schmidt process results. */
  gram: GramResult;
};

/**
 * Result of Lenstra-Lenstra-Lovász basis reduction.
 */
export type FractionalLLLResult = {
  /** Basis that's short and nearly orthogonal. */
  basis: FractionalMonzo[];
  /** Gram-Schmidt process results. */
  gram: FractionalGramResult;
};

/**
 * Perform Gram–Schmidt process without normalization.
 * @param basis Array of basis elements.
 * @param epsilon Threshold for zero.
 * @returns The orthogonalized basis and its dual (duals of near-zero basis elements are coerced to zero).
 */
export function gram(basis: number[][], epsilon = 1e-12): GramResult {
  const ortho: number[][] = [];
  const squaredLengths: number[] = [];
  const dual: number[][] = [];
  for (let i = 0; i < basis.length; ++i) {
    ortho.push([...basis[i]]);
    for (let j = 0; j < i; ++j) {
      ortho[i] = sub(ortho[i], scale(ortho[j], dot(ortho[i], dual[j])));
    }
    squaredLengths.push(dot(ortho[i], ortho[i]));
    if (squaredLengths[i] > epsilon) {
      dual.push(scale(ortho[i], 1 / squaredLengths[i]));
    } else {
      dual.push(scale(ortho[i], 0));
    }
  }
  return {ortho, squaredLengths, dual};
}

/**
 * Perform Gram–Schmidt process without normalization.
 * @param basis Array of rational basis elements.
 * @returns The orthogonalized basis and its dual as arrays of fractions (duals of zero basis elements are coerced to zero).
 */
export function fractionalGram(
  basis: ProtoFractionalMonzo[],
): FractionalGramResult {
  const ortho: Fraction[][] = [];
  const squaredLengths: Fraction[] = [];
  const dual: Fraction[][] = [];
  for (let i = 0; i < basis.length; ++i) {
    ortho.push(basis[i].map(f => new Fraction(f)));
    for (let j = 0; j < i; ++j) {
      ortho[i] = fractionalSub(
        ortho[i],
        fractionalScale(ortho[j], fractionalDot(ortho[i], dual[j])),
      );
    }
    squaredLengths.push(fractionalDot(ortho[i], ortho[i]));
    if (squaredLengths[i].n) {
      dual.push(fractionalScale(ortho[i], squaredLengths[i].inverse()));
    } else {
      dual.push(fractionalScale(ortho[i], squaredLengths[i]));
    }
  }
  return {ortho, squaredLengths, dual};
}

/**
 * Preform Lenstra-Lenstra-Lovász basis reduction.
 * @param basis Array of basis elements.
 * @param delta Lovász coefficient.
 * @param epsilon Threshold for zero.
 * @param maxIterations Maximum number of iterations to perform.
 * @returns The basis processed to be short and nearly orthogonal alongside Gram-Schmidt coefficients.
 */
export function lenstraLenstraLovasz(
  basis: number[][],
  delta = 0.75,
  epsilon = 1e-12,
  maxIterations = 10000,
): LLLResult {
  // https://en.wikipedia.org/wiki/Lenstra%E2%80%93Lenstra%E2%80%93Lov%C3%A1sz_lattice_basis_reduction_algorithm#LLL_algorithm_pseudocode
  basis = basis.map(row => [...row]);
  let {ortho, squaredLengths, dual} = gram(basis, epsilon);
  let k = 1;
  while (k < basis.length && maxIterations--) {
    for (let j = k - 1; j >= 0; --j) {
      const mu = dot(basis[k], dual[j]);
      if (Math.abs(mu) > 0.5) {
        basis[k] = sub(basis[k], scale(basis[j], Math.round(mu)));

        ({ortho, squaredLengths, dual} = gram(basis, epsilon));
      }
    }
    const mu = dot(basis[k], dual[k - 1]);
    if (
      squaredLengths[k] > (delta - mu * mu) * squaredLengths[k - 1] ||
      !squaredLengths[k - 1]
    ) {
      k++;
    } else {
      const bk = basis[k];
      basis[k] = basis[k - 1];
      basis[k - 1] = bk;

      ({ortho, squaredLengths, dual} = gram(basis, epsilon));

      k = Math.max(k - 1, 1);
    }
  }
  return {
    basis,
    gram: {
      ortho,
      squaredLengths,
      dual,
    },
  };
}

const HALF = new Fraction(1, 2);

/**
 * Preform Lenstra-Lenstra-Lovász basis reduction using rational numbers.
 * @param basis Array of rational basis elements.
 * @param delta Lovász coefficient.
 * @param maxIterations Maximum number of iterations to perform.
 * @returns The basis processed to be short and nearly orthogonal alongside Gram-Schmidt coefficients.
 */
export function fractionalLenstraLenstraLovasz(
  basis: ProtoFractionalMonzo[],
  delta: FractionValue = '3/4',
  maxIterations = 10000,
): FractionalLLLResult {
  const result = basis.map(row => row.map(f => new Fraction(f)));
  const delta_ = new Fraction(delta);
  let {ortho, squaredLengths, dual} = fractionalGram(result);
  let k = 1;
  while (k < result.length && maxIterations--) {
    for (let j = k - 1; j >= 0; --j) {
      const mu = fractionalDot(result[k], dual[j]);
      if (mu.abs().compare(HALF) > 0) {
        result[k] = fractionalSub(
          result[k],
          fractionalScale(result[j], mu.round()),
        );

        ({ortho, squaredLengths, dual} = fractionalGram(result));
      }
    }
    const mu = fractionalDot(result[k], dual[k - 1]);
    if (
      squaredLengths[k].compare(
        delta_.sub(mu.mul(mu)).mul(squaredLengths[k - 1]),
      ) > 0 ||
      !squaredLengths[k - 1].n
    ) {
      k++;
    } else {
      const bk = result[k];
      result[k] = result[k - 1];
      result[k - 1] = bk;

      ({ortho, squaredLengths, dual} = fractionalGram(result));

      k = Math.max(k - 1, 1);
    }
  }
  return {
    basis: result,
    gram: {
      ortho,
      squaredLengths,
      dual,
    },
  };
}

/**
 * Return a 2-D array with ones on the diagonal and zeros elsewhere.
 * @param N Number of rows in the output.
 * @param M Number of columns in the output.
 * @param k Index of the diagonal.
 * @returns An array where all elements are equal to zero, except for the `k`-th diagonal, whose values are equal to one.
 */
export function eye(N: number, M?: number, k = 0) {
  M ??= N;
  const result: number[][] = [];
  for (let i = 0; i < N; ++i) {
    result.push(Array(M).fill(0));
    if (i >= k && i + k < M) {
      result[i][i + k] = 1;
    }
  }
  return result;
}

/**
 * Return a 2-D array with ones on the diagonal and zeros elsewhere.
 * @param N Number of rows in the output.
 * @param M Number of columns in the output.
 * @param k Index of the diagonal.
 * @returns An array where all elements are equal to zero, except for the `k`-th diagonal, whose values are equal to one.
 */
export function fractionalEye(N: number, M?: number, k = 0): FractionalMonzo[] {
  M ??= N;
  const result: FractionalMonzo[] = [];
  for (let i = 0; i < N; ++i) {
    const row: FractionalMonzo = [];
    for (let j = 0; j < M; ++j) {
      if (j === i + k) {
        row.push(new Fraction(1));
      } else {
        row.push(new Fraction(0));
      }
    }
    result.push(row);
  }
  return result;
}

// XXX: I'm sorry. This matrix inversion algorithm is not particularly sophisticated. Existing solutions just come with too much bloat.

/**
 * Compute the (multiplicative) inverse of a matrix.
 * @param matrix Matrix to be inverted.
 * @returns The multiplicative inverse.
 * @throws An error if the matrix is not square or not invertible.
 */
export function inv(matrix: number[][]) {
  let width = 0;
  const height = matrix.length;
  for (const row of matrix) {
    width = Math.max(width, row.length);
  }
  if (width !== height) {
    throw new Error('Non-square matrix');
  }
  const result: number[][] = [];
  for (let i = 0; i < height; ++i) {
    result.push(Array(width).fill(0));
    result[i][i] = 1;
  }
  // Don't modify input
  matrix = matrix.map(row => [...row]);
  // Coerce missing entries to zeros
  for (let y = 0; y < height; ++y) {
    for (let x = matrix[y].length; x < width; ++x) {
      matrix[y][x] = 0;
    }
  }
  // Put ones along the diagonal, zeros in the lower triangle
  for (let x = 0; x < width; ++x) {
    // Maintain row echelon form by pivoting on the most dominant row.
    let pivot: number | undefined;
    let s = 0;
    for (let y = x; y < height; ++y) {
      if (Math.abs(matrix[y][x]) > Math.abs(s)) {
        pivot = y;
        s = matrix[y][x];
      }
    }
    if (pivot === undefined) {
      throw new Error('Matrix is singular');
    }
    if (x !== pivot) {
      let temp = matrix[pivot];
      matrix[pivot] = matrix[x];
      matrix[x] = temp;

      temp = result[pivot];
      result[pivot] = result[x];
      result[x] = temp;
    }
    if (s !== 1) {
      s = 1 / s;
      matrix[x] = matrix[x].map(a => a * s);
      result[x] = result[x].map(a => a * s);
    }
    for (let y = x + 1; y < height; ++y) {
      s = matrix[y][x];
      if (s) {
        result[y] = result[y].map((a, i) => a - s * result[x][i]);
        // Ignore entries that are not used later on.
        for (let i = x + 1; i < width; ++i) {
          matrix[y][i] -= s * matrix[x][i];
        }
        // Full row operation for reference:
        // matrix[y] = matrix[y].map((a, i) => a - s * matrix[x][i]);
      }
    }
  }
  // Eliminate remaining entries in the upper triangle
  for (let x = width - 1; x > 0; --x) {
    for (let y = x - 1; y >= 0; --y) {
      const s = matrix[y][x];
      if (s) {
        // No need to keep track of these entries anymore.
        // matrix[y] = matrix[y].map((a, i) => a - s * matrix[x][i]);
        result[y] = result[y].map((a, i) => a - s * result[x][i]);
      }
    }
  }
  return result;
}

/**
 * Compute the (multiplicative) inverse of a matrix.
 * @param matrix Matrix to be inverted.
 * @returns The multiplicative inverse.
 * @throws An error if the matrix is not square or not invertible.
 */
export function fractionalInv(matrix: ProtoFractionalMonzo[]) {
  let width = 0;
  const height = matrix.length;
  for (const row of matrix) {
    width = Math.max(width, row.length);
  }
  if (width !== height) {
    throw new Error('Non-square matrix');
  }
  const result: FractionalMonzo[] = [];
  for (let i = 0; i < height; ++i) {
    const row: FractionalMonzo = [];
    for (let j = 0; j < width; ++j) {
      if (i === j) {
        row.push(new Fraction(1));
      } else {
        row.push(new Fraction(0));
      }
    }
    result.push(row);
  }
  // Don't modify input
  const matrix_: FractionalMonzo[] = matrix.map(row =>
    row.map(f => new Fraction(f)),
  );
  // Coerce missing entries to zeros
  for (let y = 0; y < height; ++y) {
    for (let x = matrix_[y].length; x < width; ++x) {
      matrix_[y][x] = new Fraction(0);
    }
  }
  // Put ones along the diagonal, zeros in the lower triangle
  for (let x = 0; x < width; ++x) {
    let s = matrix_[x][x];
    if (!s.n) {
      // Row echelon form (pivoting makes no difference over rationals)
      // TODO: Figure out if there's a strategy to avoid blowing safe limits during manipulation.
      for (let y = x + 1; y < height; ++y) {
        if (matrix_[y][x].n) {
          let temp = matrix_[y];
          matrix_[y] = matrix_[x];
          matrix_[x] = temp;

          temp = result[y];
          result[y] = result[x];
          result[x] = temp;
          break;
        }
      }
      s = matrix_[x][x];
      if (!s.n) {
        throw new Error('Matrix is singular');
      }
    }
    if (!s.isUnity()) {
      matrix_[x] = matrix_[x].map(a => a.div(s));
      result[x] = result[x].map(a => a.div(s));
    }
    for (let y = x + 1; y < height; ++y) {
      s = matrix_[y][x];
      if (s.n) {
        result[y] = result[y].map((a, i) => a.sub(s.mul(result[x][i])));
        // Ignore entries that are not used later on.
        for (let i = x + 1; i < width; ++i) {
          matrix_[y][i] = matrix_[y][i].sub(s.mul(matrix_[x][i]));
        }
        // Full row operation for reference:
        // matrix_[y] = matrix_[y].map((a, i) => a.sub(s.mul(matrix_[x][i])));
      }
    }
  }
  // Eliminate remaining entries in the upper triangle
  for (let x = width - 1; x > 0; --x) {
    for (let y = x - 1; y >= 0; --y) {
      const s = matrix_[y][x];
      if (s.n) {
        // No need to keep track of these entries anymore.
        // matrix_[y] = matrix_[y].map(...);
        result[y] = result[y].map((a, i) => a.sub(s.mul(result[x][i])));
      }
    }
  }
  return result;
}

/**
 * Compute the matrix product of two matrices or vectors.
 * @param A The left operand.
 * @param B The right operand.
 * @returns The matrix product of the operands.
 */
export function matmul(A: number[], B: number[]): number;
export function matmul(A: number[], B: number[][]): number[];
export function matmul(A: number[][], B: number[]): number[];
export function matmul(A: number[][], B: number[][]): number[][];
export function matmul(A: number[] | number[][], B: number[] | number[][]) {
  let numVectors = 0;
  if (!Array.isArray(A[0])) {
    A = [A as number[]];
    numVectors++;
  }
  if (!Array.isArray(B[0])) {
    B = (B as number[]).map(c => [c]);
    numVectors++;
  }
  const result = matmul_(A as number[][], B as number[][]);
  if (numVectors === 1) {
    return result.flat();
  } else if (numVectors === 2) {
    return result[0][0];
  }
  return result;
}

function matmul_(A: number[][], B: number[][]) {
  const height = A.length;
  let width = 0;
  for (const row of B) {
    width = Math.max(width, row.length);
  }
  let n = 0;
  for (const row of A) {
    n = Math.max(n, row.length);
  }
  B = [...B];
  while (B.length < n) {
    B.push([]);
  }
  const result: number[][] = [];
  for (let i = 0; i < height; ++i) {
    const row = Array(width).fill(0);
    const rowA = A[i];
    for (let j = 0; j < width; ++j) {
      for (let k = 0; k < rowA.length; ++k) {
        row[j] += rowA[k] * (B[k][j] ?? 0);
      }
    }
    result.push(row);
  }
  return result;
}

/**
 * Compute the matrix product of two matrices or vectors.
 * @param A The left operand.
 * @param B The right operand.
 * @returns The matrix product of the operands.
 */
export function fractionalMatmul(
  A: ProtoFractionalMonzo,
  B: ProtoFractionalMonzo,
): Fraction;
export function fractionalMatmul(
  A: ProtoFractionalMonzo,
  B: ProtoFractionalMonzo[],
): FractionalMonzo;
export function fractionalMatmul(
  A: ProtoFractionalMonzo[],
  B: ProtoFractionalMonzo,
): FractionalMonzo;
export function fractionalMatmul(
  A: ProtoFractionalMonzo[],
  B: ProtoFractionalMonzo[],
): FractionalMonzo[];
export function fractionalMatmul(
  A: ProtoFractionalMonzo | ProtoFractionalMonzo[],
  B: ProtoFractionalMonzo | ProtoFractionalMonzo[],
) {
  let numVectors = 0;
  if (!Array.isArray(A[0])) {
    A = [A as ProtoFractionalMonzo];
    numVectors++;
  }
  if (!Array.isArray(B[0])) {
    B = (B as ProtoFractionalMonzo).map(c => [c]);
    numVectors++;
  }
  const result = fractionalMatmul_(
    A as ProtoFractionalMonzo[],
    B as ProtoFractionalMonzo[],
  );
  if (numVectors === 1) {
    return result.flat();
  } else if (numVectors === 2) {
    return result[0][0];
  }
  return result;
}

export function fractionalMatmul_(
  A: ProtoFractionalMonzo[],
  B: ProtoFractionalMonzo[],
): FractionalMonzo[] {
  const height = A.length;
  let width = 0;
  for (const row of B) {
    width = Math.max(width, row.length);
  }
  let n = 0;
  for (const row of A) {
    n = Math.max(n, row.length);
  }
  const B_ = B.map(row => row.map(f => new Fraction(f)));
  while (B_.length < n) {
    B_.push([]);
  }
  for (const row of B_) {
    while (row.length < width) {
      row.push(new Fraction(0));
    }
  }
  const result: FractionalMonzo[] = [];
  for (let i = 0; i < height; ++i) {
    const row: FractionalMonzo = [];
    while (row.length < width) {
      row.push(new Fraction(0));
    }
    const rowA = A[i].map(f => new Fraction(f));
    for (let j = 0; j < width; ++j) {
      for (let k = 0; k < rowA.length; ++k) {
        row[j] = row[j].add(rowA[k].mul(B_[k][j]));
      }
    }
    result.push(row);
  }
  return result;
}

/**
 * Compute the determinant of a matrix.
 * @param matrix Array of arrays of numbers to calculate determinant for.
 * @returns The determinant.
 */
export function det(matrix: number[][]) {
  let width = 0;
  const height = matrix.length;
  for (const row of matrix) {
    width = Math.max(width, row.length);
  }
  if (width !== height) {
    throw new Error('Non-square matrix');
  }
  matrix = matrix.map(row => [...row]);
  let result = 1;
  for (let x = 0; x < width; ++x) {
    // Maintain row echelon form by pivoting on the most dominant row.
    let pivot: number | undefined;
    let d = 0;
    for (let y = x; y < height; ++y) {
      if (Math.abs(matrix[y][x]) > Math.abs(d)) {
        pivot = y;
        d = matrix[y][x];
      }
    }
    if (pivot === undefined) {
      return 0;
    }
    if (x !== pivot) {
      const temp = matrix[pivot];
      matrix[pivot] = matrix[x];
      matrix[x] = temp;

      result = -result;
    }
    result *= d;
    d = 1 / d;
    for (let y = x + 1; y < height; ++y) {
      const row = matrix[y];
      const s = row[x] * d;
      if (s) {
        // Skip over entries that are not used later.
        const upperRow = matrix[x];
        for (let i = x + 1; i < upperRow.length; ++i) {
          row[i] -= s * upperRow[i];
        }
        // Full row operation for reference:
        // matrix[y] = matrix[y].map((a, i) => a - s * (matrix[x][i] ?? 0));
      }
    }
  }
  return result;
}

/**
 * Compute the determinant of a matrix with rational entries.
 * @param matrix Array of arrays of fractions to calculate determinant for.
 * @returns The determinant.
 */
export function fractionalDet(matrix: ProtoFractionalMonzo[]) {
  let width = 0;
  const height = matrix.length;
  for (const row of matrix) {
    width = Math.max(width, row.length);
  }
  if (width !== height) {
    throw new Error('Non-square matrix');
  }
  const matrix_ = matrix.map(row => row.map(f => new Fraction(f)));
  for (const row of matrix_) {
    while (row.length < width) {
      row.push(new Fraction(0));
    }
  }
  let result = new Fraction(1);
  for (let x = 0; x < width; ++x) {
    let d = matrix_[x][x];
    if (!d.n) {
      // Row echelon form
      for (let y = x + 1; y < height; ++y) {
        if (matrix_[y][x].n) {
          const temp = matrix_[y];
          matrix_[y] = matrix_[x];
          matrix_[x] = temp;

          result = result.neg();
          break;
        }
      }
      d = matrix_[x][x];
      if (!d.n) {
        return new Fraction(0);
      }
    }
    result = result.mul(d);
    for (let y = x + 1; y < height; ++y) {
      const row = matrix_[y];
      const s = row[x].div(d);
      if (s.n) {
        // Skip over entries that are not used later.
        const upperRow = matrix_[x];
        for (let i = x + 1; i < width; ++i) {
          row[i] = row[i].sub(s.mul(upperRow[i]));
        }
      }
    }
  }
  return result;
}

/**
 * Transpose a 2-D matrix with rational entries (swap rows and columns).
 * @param matrix Matrix to transpose.
 * @returns The transpose.
 */
export function fractionalTranspose(matrix: ProtoFractionalMonzo[]) {
  let width = 0;
  for (const row of matrix) {
    width = Math.max(row.length, width);
  }
  const result: FractionalMonzo[] = [];
  for (let i = 0; i < width; ++i) {
    const row: FractionalMonzo = [];
    for (let j = 0; j < matrix.length; ++j) {
      row.push(new Fraction(matrix[j][i] ?? 0));
    }
    result.push(row);
  }
  return result;
}

/**
 * Obtain the minor a matrix.
 * @param matrix The input matrix.
 * @param i The row to remove.
 * @param j The column to remove.
 * @returns The spliced matrix.
 */
export function minor(matrix: any[][], i: number, j: number) {
  matrix = matrix.map(row => [...row]);
  matrix.splice(i, 1);
  for (const row of matrix) {
    row.splice(j, 1);
  }
  return matrix;
}

/**
 * Scale a matrix by a scalar.
 * @param matrix The matrix to scale.
 * @param amount The amount to scale by.
 * @returns The scalar multiple.
 */
export function matscale(matrix: number[][], amount: number) {
  return matrix.map(row => scale(row, amount));
}

/**
 * Add two matrices.
 * @param A The first matrix.
 * @param B The second matrix.
 * @returns The sum.
 */
export function matadd(A: number[][], B: number[][]) {
  const result: number[][] = [];
  const numRows = Math.max(A.length, B.length);
  for (let i = 0; i < numRows; ++i) {
    result.push(add(A[i] ?? [], B[i] ?? []));
  }
  return result;
}

/**
 * Subtract two matrices.
 * @param A The matrix to subtract from.
 * @param B The matrix to subtract by.
 * @returns The difference.
 */
export function matsub(A: number[][], B: number[][]) {
  const result: number[][] = [];
  const numRows = Math.max(A.length, B.length);
  for (let i = 0; i < numRows; ++i) {
    result.push(sub(A[i] ?? [], B[i] ?? []));
  }
  return result;
}

/**
 * Scale a matrix by a scalar.
 * @param matrix The matrix to scale.
 * @param amount The amount to scale by.
 * @returns The scalar multiple.
 */
export function fractionalMatscale(
  matrix: ProtoFractionalMonzo[],
  amount: FractionValue,
) {
  return matrix.map(row => fractionalScale(row, amount));
}

/**
 * Add two matrices.
 * @param A The first matrix.
 * @param B The second matrix.
 * @returns The sum.
 */
export function fractionalMatadd(
  A: ProtoFractionalMonzo[],
  B: ProtoFractionalMonzo[],
) {
  const result: FractionalMonzo[] = [];
  const numRows = Math.max(A.length, B.length);
  for (let i = 0; i < numRows; ++i) {
    result.push(fractionalAdd(A[i] ?? [], B[i] ?? []));
  }
  return result;
}

/**
 * Subtract two matrices.
 * @param A The matrix to subtract from.
 * @param B The matrix to subtract by.
 * @returns The difference.
 */
export function fractionalMatsub(
  A: ProtoFractionalMonzo[],
  B: ProtoFractionalMonzo[],
) {
  const result: FractionalMonzo[] = [];
  const numRows = Math.max(A.length, B.length);
  for (let i = 0; i < numRows; ++i) {
    result.push(fractionalSub(A[i] ?? [], B[i] ?? []));
  }
  return result;
}

// Finds the Hermite normal form and 'defactors' it.
// Defactoring is also known as saturation.
// This removes torsion from the map.
// Algorithm as described by:
//
// Clément Pernet and William Stein.
// Fast Computation of HNF of Random Integer Matrices.
// Journal of Number Theory.
// https://doi.org/10.1016/j.jnt.2010.01.017
// See section 8.

/**
 * Compute the Hermite normal form with torsion removed.
 * @param M The input matrix.
 * @returns The defactored Hermite normal form.
 */
export function defactoredHnf(M: number[][]): number[][] {
  // Need to convert to bigint so that intermediate results don't blow up.
  const bigM = M.map(row => row.map(BigInt));
  const K = hnf(transpose(bigM));
  while (K.length > M.length) {
    K.pop();
  }
  const determinant = integerDet(K);
  if (determinant === 1n) {
    return hnf(bigM).map(row => row.map(Number));
  }
  const S = inv(transpose(K).map(row => row.map(Number)));
  const D = matmul(S, M).map(row => row.map(Math.round));
  return hnf(D);
}

/**
 * Compute the canonical form of the input.
 * @param M Input maps.
 * @returns Defactored Hermite normal form or the antitranspose sandwich for commas bases.
 */
export function canonical(M: number[][]): number[][] {
  for (const row of M) {
    if (row.length < M.length) {
      // Comma basis
      return antitranspose(defactoredHnf(antitranspose(M)));
    }
  }
  return defactoredHnf(M);
}

// Babai's nearest plane algorithm for solving approximate CVP
// `basis` should be LLL reduced first

/**
 * Solve approximate CVP using Babai's nearest plane algorithm.
 * @param v Vector to reduce.
 * @param basis LLL basis to reduce with.
 * @param dual Optional precalculated geometric duals of the orthogonalized basis.
 * @returns The reduced vector.
 */
export function nearestPlane(
  v: number[],
  basis: number[][],
  dual?: number[][],
) {
  // Body moved to respell to save a sub() call.
  return sub(v, respell(v, basis, dual));
}

/**
 * Respell a monzo represting a rational number to a simpler form.
 * @param monzo Array of prime exponents to simplify.
 * @param commas Monzos representing near-unisons to simplify by. Should be LLL reduced to work properly.
 * @param commaOrthoDuals Optional precalculated geometric duals of the orthogonalized comma basis.
 * @returns An array of prime exponents representing a simpler rational number.
 */
export function respell(
  monzo: Monzo,
  commas: Monzo[],
  commaOrthoDuals?: Monzo[],
) {
  if (commaOrthoDuals === undefined) {
    commaOrthoDuals = gram(commas).dual;
  }
  monzo = [...monzo];

  for (let i = commaOrthoDuals.length - 1; i >= 0; --i) {
    const mu = dot(monzo, commaOrthoDuals[i]);
    monzo = sub(monzo, scale(commas[i], Math.round(mu)));
  }
  return monzo;
}

/**
 * Solve Ax = b in the integers.
 * @param A Coefficients of unknowns.
 * @param b Target vector or a matrix of column vectors.
 * @returns A vector mapped to the target vector by A or a matrix of row vectors.
 */
export function solveDiophantine(A: number[][], b: number[][]): number[][];
export function solveDiophantine(A: number[][], b: number[]): number[];
export function solveDiophantine(
  A: number[][],
  b: number[] | number[][],
): typeof b {
  const hasMultiple = Array.isArray(b[0]);

  const B: number[][] = hasMultiple
    ? padMatrix(b as number[][]).M
    : (b as number[]).map(c => [c]);

  // Need to convert to bigint so that intermediate results don't blow up.
  const {width, height, M} = padMatrix(A.map(row => row.map(BigInt)));
  for (let i = 0; i < height; ++i) {
    M[i].push(...B[i].map(BigInt));
  }
  const H = hnf(M);
  while (H.length > width) {
    H.pop();
  }
  const c: number[][] = [];
  for (const row of H) {
    c.push(row.splice(width, row.length - width).map(Number));
  }
  const S = inv(H.map(row => row.map(Number)));
  const sol = matmul(S, c).map(row => row.map(Math.round));

  // Check solution(s).
  const BS = matmul(A, sol);
  for (let i = 0; i < B.length; ++i) {
    if (!monzosEqual(B[i], BS[i])) {
      throw new Error('Could not solve system');
    }
  }

  return hasMultiple ? sol : sol.map(row => row[0]);
}
