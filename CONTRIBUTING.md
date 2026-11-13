# Contributing to Logihertz SDR Spectrum & Waterfall Engine

Thank you for your interest in contributing to `lh-sdr-spectrum-waterfall` (`bin/lh-waterfall`). This project is an official core component of the Logihertz Systems 60-tool open-source ecosystem.

## Core Engineering Principles

1. **Strict Zero Runtime Dependencies**:
   `lh-sdr-spectrum-waterfall` has **0 runtime external dependencies**. All FFT algorithms, windowing functions, PSD calculations, colormaps, GPU shader generators, and SARIF serializers must be written in pure TypeScript utilizing standard ECMAScript APIs (`TypedArray`, `Math`, `Float32Array`, `Uint8Array`).

2. **TypeScript Strict Mode**:
   All codebase modules in `src/` must pass `tsc --strict` with zero warnings or errors. `any` types are strictly prohibited in public APIs.

3. **Deterministic Math & GPU Shaders**:
   - Cooley-Tukey Radix-2 FFT must be exact, bit-reversal indexed, with verified Parseval energy conservation and coherent gain compensation.
   - WebGL2 (GLSL ES 3.0) and WebGPU (WGSL) shaders must operate using an $\mathcal{O}(1)$ circular ring buffer without texture reallocation or full-screen pixel copies.

4. **10-Rule Auditor Integrity**:
   Any modification to the 10 normative rules (`LH-SPEC-001` .. `LH-SPEC-010`) must preserve deterministic posture score calculation:
   $$S_{\text{posture}} = \max\left(0, 100 - (25\cdot c_{\text{CRIT}} + 10\cdot c_{\text{HIGH}} + 4\cdot c_{\text{MED}} + 1\cdot c_{\text{LOW}})\right)$$

## Local Development Workflow

```bash
# 1. Typecheck without emitting code
npm run typecheck

# 2. Compile TypeScript
npm run build

# 3. Execute test suite (85+ assertions)
npm test

# 4. Run CLI locally
bin/lh-waterfall --version
bin/lh-waterfall --help
```

## Pull Request Guidelines

- Branch names should be descriptive (e.g., `feat/simd-fft`, `fix/colormap-clamping`).
- Commit messages must follow Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`).
- All PRs must include accompanying deterministic assertions in `tests/run_tests.ts`.
- Submissions will be reviewed by Sameer Tawade (`ops@logihertz.com`).
