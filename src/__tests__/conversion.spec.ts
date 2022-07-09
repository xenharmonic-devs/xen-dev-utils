import {describe, it, expect} from 'vitest';
import {
  centOffsetToFrequency,
  centsToValue,
  frequencyToCentOffset,
  ftom,
  mtof,
  valueToCents,
} from '../conversion';

describe('Ratio to cents converter', () => {
  it('converts a known value', () => {
    expect(valueToCents(3 / 2)).toBeCloseTo(701.9550008653874);
  });
});

describe('Cents to ratio converter', () => {
  it('converts a known value', () => {
    expect(centsToValue(1200)).toBeCloseTo(2);
  });
});

describe('Frequency to cents converter', () => {
  it('converts a known value', () => {
    expect(frequencyToCentOffset(220)).toBeCloseTo(-1200);
  });
});

describe('Cents to frequency converter', () => {
  it('converts a known value', () => {
    expect(centOffsetToFrequency(1200)).toBeCloseTo(880);
  });
});

describe('MIDI to frequency converter', () => {
  it('converts a known value', () => {
    expect(mtof(60)).toBeCloseTo(261.625565);
  });
});

describe('Frequency to MIDI converter', () => {
  it('converts a known value', () => {
    const [index, offset] = ftom(261.625565);
    expect(index).toBe(60);
    expect(offset).toBeCloseTo(0);
  });
});
