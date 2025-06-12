import {sum} from './polyfills/sum-precise';

export interface NumberArray {
  [key: number]: number;
  length: number;
}

/**
 * Calculate the inner (dot) product of two arrays of real numbers.
 * @param a The first array of numbers.
 * @param b The second array of numbers.
 * @returns The dot product.
 */
export function dot(a: NumberArray, b: NumberArray): number {
  const numComponents = Math.min(a.length, b.length);
  let result = 0;
  for (let i = 0; i < numComponents; ++i) {
    result += a[i] * b[i];
  }
  return result;
}

/**
 * Calculate the inner (dot) product of two arrays of real numbers.
 * The resulting terms are summed accurately using Shewchuk's algorithm.
 * @param a The first array of numbers.
 * @param b The second array of numbers.
 * @returns The dot product.
 */
export function dotPrecise(a: NumberArray, b: NumberArray): number {
  const numComponents = Math.min(a.length, b.length);
  function* terms() {
    for (let i = 0; i < numComponents; ++i) {
      yield a[i] * b[i];
    }
  }
  return sum(terms());
}

/**
 * Calculate the norm (vector length) of an array of real numbers.
 * @param array The array to measure.
 * @param type Type of measurement.
 * @returns The length of the vector.
 */
export function norm(
  array: NumberArray,
  type: 'euclidean' | 'L2' | 'taxicab' | 'maximum' = 'euclidean',
) {
  let result = 0;
  for (let i = 0; i < array.length; ++i) {
    if (type === 'taxicab') {
      result += Math.abs(array[i]);
    } else if (type === 'maximum') {
      result = Math.max(result, Math.abs(array[i]));
    } else {
      result += array[i] * array[i];
    }
  }
  if (type === 'euclidean') {
    return Math.sqrt(result);
  }
  return result;
}
