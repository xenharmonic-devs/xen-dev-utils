import {Fraction, FractionValue} from './fraction';
import {
  FractionalMonzo,
  ProtoFractionalMonzo,
  fractionalDot,
  fractionalScale,
  fractionalSub,
  scale,
  sub,
} from './monzo';
import {dot} from './number-array';

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
  basis: ProtoFractionalMonzo[]
): FractionalGramResult {
  const ortho: Fraction[][] = [];
  const squaredLengths: Fraction[] = [];
  const dual: Fraction[][] = [];
  for (let i = 0; i < basis.length; ++i) {
    ortho.push(basis[i].map(f => new Fraction(f)));
    for (let j = 0; j < i; ++j) {
      ortho[i] = fractionalSub(
        ortho[i],
        fractionalScale(ortho[j], fractionalDot(ortho[i], dual[j]))
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
  maxIterations = 10000
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
  maxIterations = 10000
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
          fractionalScale(result[j], mu.round())
        );

        ({ortho, squaredLengths, dual} = fractionalGram(result));
      }
    }
    const mu = fractionalDot(result[k], dual[k - 1]);
    if (
      squaredLengths[k].compare(
        delta_.sub(mu.mul(mu)).mul(squaredLengths[k - 1])
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
