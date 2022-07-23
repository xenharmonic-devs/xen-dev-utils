import {describe, it, expect} from 'vitest';
import {
  centOffsetToFrequency,
  centsToValue,
  frequencyToCentOffset,
  ftomts,
  frequencyToMtsBytes,
  ftom,
  mtof,
  valueToCents,
  mtsBytesToHex
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

describe('Frequency to MTS converter', () => {
  it('converts a known value', () => {
    expect(ftomts(261.625565)).toBeCloseTo(60);
    expect(ftomts(0, false)).toBe(0);
    expect(ftomts(14080, false)).toBe(127);
    expect(ftomts(14080, true)).toBeCloseTo(129);
  })
})

describe("Frequency to MTS sysex value", () => {
  it('converts a known value', () => {
    expect(frequencyToMtsBytes(261.625565)).toMatchObject(new Uint8Array([60, 0, 0]));
    expect(frequencyToMtsBytes(440)).toMatchObject(new Uint8Array([69, 0, 0]));
    expect(frequencyToMtsBytes(442)).toMatchObject(new Uint8Array([69, 10, 6]));
    expect(frequencyToMtsBytes(0)).toMatchObject(new Uint8Array([0, 0, 0]));
  })
})

describe("MTS data hex string converter", () => {
  it('converts a known value', () => {
    expect(mtsBytesToHex(new Uint8Array([60, 0, 0]))).toEqual("3c0000");
    expect(mtsBytesToHex(new Uint8Array([69, 0, 0]))).toEqual("450000");
    expect(mtsBytesToHex(new Uint8Array([69, 10, 6]))).toEqual("450a06");
    expect(mtsBytesToHex(new Uint8Array([69, 256, 6]))).toEqual("450006");
  })
})

describe('Frequency to MIDI converter', () => {
  it('converts a known value', () => {
    const [index, offset] = ftom(261.625565);
    expect(index).toBe(60);
    expect(offset).toBeCloseTo(0);
  });
});
