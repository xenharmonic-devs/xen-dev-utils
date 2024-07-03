# Change log

## 0.11.0
 * Feature: `hnf` for converting integer matrices to Hermite normal form. [#43](https://github.com/xenharmonic-devs/xen-dev-utils/issues/43)
 * Feature: Other related tools such as `defactoredHnf`, `canonical`, `integerDet`, `kernel`, `cokernel`, `preimage` and `respell`.
## 0.10.2
 * Tweak: Make matrix inversion and determinant more stable numerically. [#42](https://github.com/xenharmonic-devs/xen-dev-utils/issues/42)
## 0.10.1
 * Feature: Accept vectors in `matmul` and `fractionalMatmul` and adjust return types accordingly.
 * Feature: `matscale`, `matadd`, `matsub` and fractional variants. [#41](https://github.com/xenharmonic-devs/xen-dev-utils/issues/41)
## 0.10.0
 * Feature: New array type `FractionalMonzo` with vector methods `fractionalMonzosEqual`, `fractionalAdd`, `fractionalSub`, `fractionalDot`, `fractionalScale` and `fractionalNorm`.
 * Feature: Unnormalized Gram-Schmidt orthogonalization `gram` and `fractionalGram`.
 * Feature: Lenstra-Lenstra-Lovász basis lattice reduction algrorithm `lenstraLenstraLovasz` and the fractional variant for exact results.
 * Features: Matrix multiplication, inversion, determinant, transpose and identity.
## 0.9.1
 * Bug fix: Fix accuracy issues when converting decimal strings to fractions. [#37](https://github.com/xenharmonic-devs/xen-dev-utils/issues/37)
