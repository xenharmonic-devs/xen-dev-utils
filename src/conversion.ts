/**
 * Convert floating point ratio to cents.
 * ```ts
 * valueToCents(3/2)  // 701.9550008653874
 * ```
 * @param value Musical interval in multiplicative representation.
 * @returns Musical interval in additive representation measured in cents.
 */
export function valueToCents(value: number) {
  return 1200 * Math.log2(value);
}

/**
 * Convert cents to floating point ratio.
 * ```ts
 * centsToValue(1200)  // 2.0
 * ```
 * @param cents Musical interval in additive representation measured in cents.
 * @returns Musical interval in multiplicative representation.
 */
export function centsToValue(cents: number) {
  return Math.pow(2, cents / 1200);
}

/**
 * Convert musical frequency to pitch in cents by comparing it to a reference frequency.
 * ```ts
 * frequencyToCentOffset(220)  // -1200.0
 * ```
 * @param frequency Musical frequency.
 * @param baseFrequency Reference frequency.
 * @returns Musical pitch in additive representation as a cents offset from reference.
 */
export function frequencyToCentOffset(frequency: number, baseFrequency = 440) {
  return valueToCents(frequency / baseFrequency);
}

/**
 * Convert pitch as cents offset from reference to frequency.
 * ```ts
 * centOffsetToFrequency(1200)  // 880.0
 * ```
 * @param offset Musical pitch in additive representation as a cents offset from reference.
 * @param baseFrequency Reference frequency.
 * @returns Musical frequency.
 */
export function centOffsetToFrequency(offset: number, baseFrequency = 440) {
  return centsToValue(offset) * baseFrequency;
}

const MIDI_NOTE_NUMBER_OF_A4 = 69;
/**
 * Convert MIDI note number to frequency.
 * @param index MIDI note number or MTS value.
 * @returns Frequency in Hertz.
 */
export function mtof(index: number) {
  return 440 * Math.pow(2, (index - MIDI_NOTE_NUMBER_OF_A4) / 12);
}

function mtsRound(mtsValue: number): number {
  return Math.round(mtsValue * 100000) / 100000;
  }
/**
 * Convert frequency to MTS number (semitones with A440=69).
 * @param frequency Frequency in Hertz.
 * @returns MTS value
 */
 export function ftomts(frequency: number, ignoreLimit: boolean=false): number {
  const mts = mtsRound(MIDI_NOTE_NUMBER_OF_A4 + 12 * Math.log2(frequency / 440));
  if (mts < 0 && !ignoreLimit)
    return 0;
  if (mts > 127.9999 && !ignoreLimit) // Last accepted value - 7F 7F 7F is reserved 
    return 127.9999;
  return mts;
}

/**
 * Convert frequency to MIDI note number and pitch offset measured in cents.
 * @param frequency Frequency in Hertz.
 * @returns [MIDI note number, pitch offset in cents]
 */
export function ftom(frequency: number): [number, number] {
  const semitones = ftomts(frequency);
  const midiNoteNumber = Math.round(semitones);
  const centsOffset = (semitones - midiNoteNumber) * 100;
  return [midiNoteNumber, centsOffset];
}

/**
 * Convert MTS pitch value to 3-byte representation
 * @param number MTS pitch value
 * @returns Uint8Array 3-byte of 7-bit MTS data
 */
export function mtsToMtsBytes(mtsValue: number): Uint8Array {
  const noteNumber = Math.trunc(mtsValue);
  const fine = Math.round(0x3fff * (mtsValue - noteNumber));
  
  const data = new Uint8Array(3);
  data[0] = noteNumber;
  data[1] = (fine >> 7) & 0x7f;
  data[2] = fine & 0x7f;
  return data;
}

/**
 * Convert frequency to 3-byte MTS value
 * @param frequency Frequency in Hertz.
 * @returns Uint8Array of length 3
 */
 export function frequencyToMtsBytes(frequency: number): Uint8Array {
  const mtsValue = ftomts(frequency);
 return mtsToMtsBytes(mtsValue);
}

/**
 * Convert 3-byte MTS value to frequency
 * @param Uint8Array of 3-bytes of 7-bit MTS values
 * @returns frequency Frequency in Hertz
 */
export function mtsBytesToMts(mtsBytes: Uint8Array): number {
  const noteNumber = mtsBytes[0];

  const high = (mtsBytes[1] & 0x7f) << 7;
  const low = mtsBytes[2] & 0x7f;
  const fine = (high + low) / 0x3fff;
  return noteNumber + fine;
}

/**
 * Convert 3-byte MTS value to frequency
 * @param Uint8Array of 3-bytes of 7-bit MTS values
 * @returns frequency Frequency in Hertz
 */
export function mtsBytesToFrequency(mtsBytes: Uint8Array): number {
  const mts = mtsBytesToMts(mtsBytes);
  return mtof(mts);
}

/** Convert MTS Data value into readable hex string 
 * @param Uint8Array of 3-bytes of 7-bit MTS values
 * @returns String representation of MTS value in hexadecimal
 *          can be used in MIDI messages
*/
export function mtsBytesToHex(mtsBytes: Uint8Array): String {
  return (mtsBytes[0] & 0x7f).toString(16).padStart(2, "0")
       + (mtsBytes[1] & 0x7f).toString(16).padStart(2, "0")
       + (mtsBytes[2] & 0x7f).toString(16).padStart(2, "0");
}

/**
 * Convert cents to natural units.
 * @param cents Musical interval in cents.
 * @returns Musical interval in natural units.
 */
export function centsToNats(cents: number) {
  return (cents / 1200) * Math.LN2;
}

/**
 * Convert natural units to cents.
 * @param nats Musical interval in natural units.
 * @returns Musical interval in cents.
 */
export function natsToCents(nats: number) {
  return (nats / Math.LN2) * 1200;
}

/**
 * Convert semitones to natural units.
 * @param semitones Musical interval in semitones.
 * @returns Musical interval in natural units.
 */
export function semitonesToNats(semitones: number) {
  return (semitones / 12) * Math.LN2;
}

/**
 * Convert natural units to cents.
 * @param nats Musical interval in natural units.
 * @returns Musical interval in semitones.
 */
export function natsToSemitones(nats: number) {
  return (nats / Math.LN2) * 12;
}
