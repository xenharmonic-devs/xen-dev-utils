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
  mtsBytesToHex,
  mtsBytesToFrequency,
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
  it('converts known frequency values (based on MIDI Tuning Spec)', () => {
    expect(ftomts(8.175799)).toBe(0);
    expect(ftomts(8.175828)).toBe(0.000062);
    expect(ftomts(8.661957)).toBe(1);
    expect(ftomts(16.351598)).toBe(12);
    expect(ftomts(261.625565)).toBe(60);
    expect(ftomts(277.182631)).toBe(61);
    expect(ftomts(439.998449)).toBe(68.999939);
    expect(ftomts(440)).toBe(69);
    expect(ftomts(440.001551)).toBe(69.000061);
    expect(ftomts(8372.01809)).toBe(120);
    expect(ftomts(8372.047605)).toBe(120.000061);
    expect(ftomts(12543.853951)).toBe(127);
    expect(ftomts(12543.898175)).toBe(127.000061);
    expect(ftomts(13289.656616)).toBe(127.999878);
    expect(ftomts(13289.656616, true)).toBe(127.999878);
  });
  it('clamps values beyond the specified MTS frequency range', () => {
    expect(ftomts(-100, false)).toBe(0);
    expect(ftomts(14080, false)).toBe(127.999878);
    expect(ftomts(28980, false)).toBe(127.999878);
  });
  it('does not clamp values above the specified MTS frequency range if ignoreLimit is true', () => {
    expect(ftomts(-100, true)).toBe(0);
    expect(ftomts(14080, true)).toBe(129);
    expect(ftomts(28980, true)).toBeCloseTo(141.496923, 4);
  });
});

describe('Frequency to MTS sysex value', () => {
  it('converts known values from MIDI Tuning spec', () => {
    expect(frequencyToMtsBytes(8.175799)).toMatchObject(
      new Uint8Array([0, 0, 0])
    );
    expect(frequencyToMtsBytes(8.175828)).toMatchObject(
      new Uint8Array([0, 0, 1])
    );
    expect(frequencyToMtsBytes(8.661957)).toMatchObject(
      new Uint8Array([1, 0, 0])
    );
    expect(frequencyToMtsBytes(16.351598)).toMatchObject(
      new Uint8Array([12, 0, 0])
    );
    expect(frequencyToMtsBytes(261.625565)).toMatchObject(
      new Uint8Array([60, 0, 0])
    );
    expect(frequencyToMtsBytes(277.182631)).toMatchObject(
      new Uint8Array([61, 0, 0])
    );
    expect(frequencyToMtsBytes(439.998449)).toMatchObject(
      new Uint8Array([68, 127, 127])
    );
    expect(frequencyToMtsBytes(440)).toMatchObject(new Uint8Array([69, 0, 0]));
    expect(frequencyToMtsBytes(440.001551)).toMatchObject(
      new Uint8Array([69, 0, 1])
    );
    expect(frequencyToMtsBytes(8372.01809)).toMatchObject(
      new Uint8Array([120, 0, 0])
    );
    expect(frequencyToMtsBytes(8372.047605)).toMatchObject(
      new Uint8Array([120, 0, 1])
    );
    expect(frequencyToMtsBytes(12543.853951)).toMatchObject(
      new Uint8Array([127, 0, 0])
    );
    expect(frequencyToMtsBytes(12543.898175)).toMatchObject(
      new Uint8Array([127, 0, 1])
    );
    expect(frequencyToMtsBytes(13289.656616)).toMatchObject(
      new Uint8Array([127, 127, 126])
    );
  });
  it('converts other known values', () => {
    expect(frequencyToMtsBytes(255.999612)).toMatchObject(
      new Uint8Array([59, 79, 106])
    );
    expect(frequencyToMtsBytes(256)).toMatchObject(
      new Uint8Array([59, 79, 106])
    );
    expect(frequencyToMtsBytes(441.999414)).toMatchObject(
      new Uint8Array([69, 10, 6])
    );
    expect(frequencyToMtsBytes(442)).toMatchObject(new Uint8Array([69, 10, 6]));
  });
  it('clamps values beyond supported MTS range', () => {
    expect(frequencyToMtsBytes(-1)).toMatchObject(new Uint8Array([0, 0, 0]));
    expect(frequencyToMtsBytes(14000)).toMatchObject(
      new Uint8Array([127, 127, 126])
    );
  });
});

describe('MTS sysex value to frequency ', () => {
  it('converts known values from MIDI Tuning spec', () => {
    expect(mtsBytesToFrequency(new Uint8Array([0, 0, 0]))).toBeCloseTo(
      8.175799,
      4
    );
    expect(mtsBytesToFrequency(new Uint8Array([0, 0, 1]))).toBeCloseTo(
      8.175828,
      4
    );
    expect(mtsBytesToFrequency(new Uint8Array([1, 0, 0]))).toBeCloseTo(
      8.661957,
      4
    );
    expect(mtsBytesToFrequency(new Uint8Array([12, 0, 0]))).toBeCloseTo(
      16.351598,
      4
    );
    expect(mtsBytesToFrequency(new Uint8Array([60, 0, 0]))).toBeCloseTo(
      261.625565,
      4
    );
    expect(mtsBytesToFrequency(new Uint8Array([61, 0, 0]))).toBeCloseTo(
      277.182631,
      4
    );
    expect(mtsBytesToFrequency(new Uint8Array([68, 127, 127]))).toBeCloseTo(
      439.998449,
      4
    );
    expect(mtsBytesToFrequency(new Uint8Array([69, 0, 0]))).toBe(440);
    expect(mtsBytesToFrequency(new Uint8Array([69, 0, 1]))).toBeCloseTo(
      440.001551,
      4
    );
    expect(mtsBytesToFrequency(new Uint8Array([120, 0, 0]))).toBeCloseTo(
      8372.01809,
      4
    );
    expect(mtsBytesToFrequency(new Uint8Array([120, 0, 1]))).toBeCloseTo(
      8372.047605,
      4
    );
    expect(mtsBytesToFrequency(new Uint8Array([127, 0, 0]))).toBeCloseTo(
      12543.853951,
      4
    );
    expect(mtsBytesToFrequency(new Uint8Array([127, 0, 1]))).toBeCloseTo(
      12543.898175,
      4
    );
    expect(mtsBytesToFrequency(new Uint8Array([127, 127, 126]))).toBeCloseTo(
      13289.656616,
      4
    );
  });
  it('converts other known values', () => {
    expect(mtsBytesToFrequency(new Uint8Array([59, 79, 106]))).toBeCloseTo(
      255.999612,
      4
    );
    expect(mtsBytesToFrequency(new Uint8Array([69, 10, 6]))).toBeCloseTo(
      441.999414,
      4
    );
  });
  it('clamps values beyond supported MTS range', () => {
    expect(mtsBytesToFrequency(new Uint8Array([68, 199, 199]))).toBeCloseTo(
      439.998449,
      4
    );
    expect(mtsBytesToFrequency(new Uint8Array([199, 199, 199]))).toBeCloseTo(
      13289.656616,
      4
    );
  });
});

describe('MTS data hex string converter', () => {
  it('converts other known values', () => {
    expect(mtsBytesToHex(new Uint8Array([60, 0, 0]))).toEqual('3c0000');
    expect(mtsBytesToHex(new Uint8Array([69, 0, 0]))).toEqual('450000');
    expect(mtsBytesToHex(new Uint8Array([69, 10, 6]))).toEqual('450a06');
  });
  it('masks int values above 0x7f by 0x7f', () => {
    expect(mtsBytesToHex(new Uint8Array([69, 240, 6]))).toEqual('457006');
    expect(mtsBytesToHex(new Uint8Array([69, 255, 6]))).toEqual('457f06');
  });
});

describe('Frequency to MIDI converter', () => {
  it('converts a known value', () => {
    const [index, offset] = ftom(261.625565);
    expect(index).toBe(60);
    expect(offset).toBeCloseTo(0);
  });
});
