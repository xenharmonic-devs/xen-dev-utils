# xen-dev-utils

Utility functions used by the Scale Workshop ecosystem.

## Installation

Install the published package in your project:

```bash
npm install xen-dev-utils
```

For local development in this repository, install dependencies with:

```bash
npm ci
```

This package currently targets Node.js 18.18.0 or newer.

## Documentation

API documentation can be generated locally with:

```bash
npm run doc
```

Typedoc writes the generated site to the default `docs/` directory.

## Development

Useful repository commands:

```bash
npm test
npm run lint
npm run compile
```

## Examples

Test if two arrays are equal:

```typescript
import {arraysEqual} from 'xen-dev-utils';

const first = [1, 2, 3];
const second = [4, 5];

arraysEqual(first, second);  // false
arraysEqual(second, [4.0, 5.0]);  // true
```

Mathematically consistent modulo:

```typescript
import {mmod} from 'xen-dev-utils';

mmod(4, 3);  // 1
mmod(-1, 3);  // 2
```

Calculate convergents of real numbers:

```typescript
import {Fraction, getConvergents} from 'xen-dev-utils';

// Convergents are in some sense the best rational approximations of given complexity.
getConvergents(Math.PI);  // ["3/1", "22/7", "333/106", "355/113", ...].map(f => new Fraction(f))
// Each semi-convergents is more accurate than the previous one.
getConvergents(Math.PI, 100, 5, true);  // 3/1, 13/4, 16/5, 19/6, 22/7
// Non-monotonic convergents cover even more ground.
getConvergents(Math.PI, 100, 8, true, true);  // 3/1, 4/1, 7/2, 10/3, 13/4, 16/5, 19/6, 22/7
```

Clamp values to stay within the specified limits:

```typescript
import {clamp} from 'xen-dev-utils';

clamp(-1, 2, 0.5);  // 0.5
clamp(-1, 2, 2.5);  // 2
clamp(-1, 2, -1.5);  // -1
```

Convert fractions to their prime components:

```typescript
import {toMonzo} from 'xen-dev-utils';

// 225/224 = 2**-5 * 3**2 * 5**2 * 7**-1
toMonzo("225/224");  // [ -5, 2, 2, -1 ]
```

Convert frequencies to cents (comparing to 440Hz):

```typescript
import {frequencyToCentOffset} from 'xen-dev-utils';

frequencyToCentOffset(660);  // 701.9550008653874
```

Convert semitones to natural logarithmic units:

```typescript
import {semitonesToNats} from 'xen-dev-utils';

semitonesToNats(5);  // 0.28881132523331055
```

Get all combinations of given length:

```typescript
import {kCombinations} from 'xen-dev-utils';

kCombinations([1, 2, 3], 2);  // [[1, 2], [1, 3], [2, 3]]
```
