# Changelog — Logihertz SDR Spectrum & Waterfall Engine

All notable changes to `lh-sdr-spectrum-waterfall` will be documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-13

### Added
- **Radix-2 Cooley-Tukey Complex FFT Engine**:
  - In-place bit-reversal indexing and $\log_2 N$ butterfly decomposition stages.
  - Trigonometric twiddle factor evaluation $W_N^k = \exp(-j 2\pi k / N)$.
  - Coherent gain compensation for 4-term Blackman-Harris, Hann, Hamming, and Flat-Top windows.
  - DC-centered FFT shift swapping quadrants so bin $N/2$ corresponds to $0\text{ Hz}$.
  - Power Spectral Density (PSD) calculation in $\text{dBFS}$ relative to full scale.
- **Spectrum Telemetry & Peak Detection**:
  - `ExponentialSpectrumAverager` computing temporal smoothing ($\alpha = 0.25$) and peak-hold envelope.
  - Median noise floor estimator $N_{\text{floor}}$ (dBFS), Peak SNR (dB), carrier peak offset $\Delta f_{\text{peak}}$ (Hz), and Spurious-Free Dynamic Range (SFDR in dBc).
- **Scientific 256-Entry RGBA8 Colormaps**:
  - Deterministic 1024-byte `Uint8Array` lookup tables for `turbo`, `viridis`, `inferno`, and `radar-green`.
  - Dynamic range intensity normalization and boundary clamping ($P_{\min} \to P_{\max}$).
- **60fps GPU Waterfall Texture Ring-Buffer Shaders**:
  - WebGL2 (GLSL ES 3.0) vertex and fragment shaders featuring circular UV wrapping:
    $$v_{\text{ring}} = \text{fract}\left(v_{\text{uv}} + \frac{r_{\text{head}}}{H}\right)$$
  - WebGPU (WGSL) vertex and fragment shaders with standardized `@group(0) @binding(...)` layout.
  - Self-contained standalone HTML5 + WebGL2/Canvas 60fps RF dashboard generator (`gen-dashboard`).
- **10-Rule Deterministic SDR Telemetry Posture Auditor**:
  - Implementation of rules `LH-SPEC-001` through `LH-SPEC-010` mapping to CWEs with weighted scoring.
  - Exporters: ANSI box table with score banner, canonical JSON, and OASIS SARIF v2.1.0.
- **Command-Line Interface (`bin/lh-waterfall`)**:
  - `scan <config.json>`: Evaluate dashboard and telemetry configuration against 10 posture rules.
  - `analyze-iq <sample_iq_frame.json>`: Compute FFT, PSD, noise floor, and SFDR.
  - `gen-shaders [--backend webgl2|webgpu]`: Generate standalone GLSL or WGSL shaders.
  - `gen-dashboard [--output <dashboard.html>]`: Export ready-to-run interactive HTML5 dashboard.
  - `--version` and `--help`.
