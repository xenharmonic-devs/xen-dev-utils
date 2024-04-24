// Mapping commas for measuring the sizes of small intervals

export const MAPPING_COMMA_MONZOS = [
  [1], // Octave
  [-1, 1], // Pure fifth
  [554, -351, 1], // Quectisma
  [-55, 30, 2, 1], // Nommisma
  [-30, 27, -7, 0, 1], // Negative syntonoschisma / syntonisma
  [9, 0, -1, 0, -3, 1], // Jacobin comma
  [-2, 2, -1, -5, 0, 3, 1], // Aksial comma
  [9, -3, -3, -2, 0, 0, 1, 1], // Decimillisma
  [-1, -1, 0, -1, -2, 1, 1, 0, 1], // Broadviewsma
];

export const MAPPING_COMMA_CENTS = [
  1200, 701.9550008653874, 0.10841011385118912, 0.1033601604170961,
  -0.09303132362673557, 0.2601208102056527, 0.005150328654440726,
  0.010468503793319029, 0.34062647410756758,
];

// Auxiliary commas for chipping away at the 3-limit
export const SATANIC_COMMA_MONZO = [-1054, 665];
export const SATANIC_COMMA_CENTS = 0.07557548263280008;

export const MERCATOR_COMMA_MONZO = [-84, 53];
export const MERCATOR_COMMA_CENTS = 3.61504586553314;

export const PYTH_COMMA_MONZO = [-19, 12];
export const PYTH_COMMA_CENTS = 23.46001038464901;

export const PYTH_LIMMA_MONZO = [8, -5];
export const PYTH_LIMMA_CENTS = 90.22499567306291;

export const PYTH_TONE_MONZO = [-3, 2];
export const PYTH_TONE_CENTS = 203.9100017307748;
