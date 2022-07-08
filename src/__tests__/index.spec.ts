import {describe, it, expect} from 'vitest';
import {arraysEqual} from '../index';

describe('Array equality tester', () => {
  it('works on integer arrays', () => {
    expect(arraysEqual([1, 2, 3], [1, 2, 3])).toBeTruthy();
    expect(arraysEqual([1, 2, 3], [1, 2, 3, 4])).toBeFalsy();
    expect(arraysEqual([1, 2], [1, 2, 3])).toBeFalsy();
  });
});
