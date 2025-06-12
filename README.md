# xen-dev-utils
Utility functions used by the Scale Workshop ecosystem.

[![npm version](https://img.shields.io/npm/v/xen-dev-utils.svg)](https://www.npmjs.com/package/xen-dev-utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## Table of Contents
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Features](#features)
- [Documentation](#documentation)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)

## Installation
```bash
npm install xen-dev-utils
```

## Getting Started
Import the utilities you need:
```typescript
import { arraysEqual, mmod, getConvergents } from 'xen-dev-utils';
```

## Features
- Array utilities (equality checking, combinations)
- Mathematical functions (modulo, convergents)
- Musical utilities (frequency conversion, cents calculation)
- Fraction handling (prime factorization, monzo conversion)
- Value manipulation (clamping, conversions)

## Documentation
Documentation is hosted at the project [Github pages](https://xenharmonic-devs.github.io/xen-dev-utils).

To generate documentation locally run:
```bash
npm run doc
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
mmod(4, 3);  // 1
mmod(-1, 3);  // 2
```

Calculate convergents of real numbers:
```typescript
// Convergents are in some sense the best rational approximations of given complexity.
getConvergents(Math.PI);  // ["3/1", "22/7", "333/106", "355/113", ...].map(f => new Fraction(f))
// Each semi-convergents is more accurate than the previous one.
getConvergents(Math.PI, 100, 5, true);  // 3/1, 13/4, 16/5, 19/6, 22/7
// Non-monotonic convergents cover even more ground.
getConvergents(Math.PI, 100, 8, true, true);  // 3/1, 4/1, 7/2, 10/3, 13/4, 16/5, 19/6, 22/7
```

Clamp values to stay within the specified limits:
```typescript
clamp(-1, 2, 0.5);  // 0.5
clamp(-1, 2, 2.5);  // 2
clamp(-1, 2, -1.5);  // -1
```

Convert fractions to their prime components:
```typescript
// 225/224 = 2**-5 * 3**2 * 5**2 * 7**-1
toMonzo("225/224");  // [ -5, 2, 2, -1 ]
```

Convert frequencies to cents (comparing to 440Hz).
```typescript
frequencyToCentOffset(660);  // 701.9550008653874
```

Convert semitones to natural logarithmic units.
```typescript
semitonesToNats(5);  // 0.28881132523331055
```

Get all combinations of given length:
```typescript
kCombinations([1, 2, 3], 2)  // [[1, 2], [1, 3], [2, 3]]
```

## Contributing
We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and contribute to the project.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
