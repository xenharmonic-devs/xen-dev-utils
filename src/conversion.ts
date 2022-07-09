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
 * @param index MIDI note number.
 * @returns Frequency in Hertz.
 */
export function mtof(index: number) {
  return 440 * Math.pow(2, (index - MIDI_NOTE_NUMBER_OF_A4) / 12);
}

/**
 * Convert frequency to MIDI note number and pitch offset measured in cents.
 * @param frequency Frequency in Hertz.
 * @returns [MIDI note number, pitch offset in cents]
 */
export function ftom(frequency: number): [number, number] {
  const semitones = MIDI_NOTE_NUMBER_OF_A4 + 12 * Math.log2(frequency / 440);
  const midiNoteNumber = Math.round(semitones);
  const centsOffset = (semitones - midiNoteNumber) * 100;
  return [midiNoteNumber, centsOffset];
}
