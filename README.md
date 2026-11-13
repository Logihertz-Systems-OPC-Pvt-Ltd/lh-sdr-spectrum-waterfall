# Logihertz SDR Spectrum & Waterfall Engine (`lh-sdr-spectrum-waterfall`)

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Runtime](https://img.shields.io/badge/Node.js-20%20%7C%2022-brightgreen.svg)](package.json)
[![Standard](https://img.shields.io/badge/TypeScript-Strict%20ES2022-blue.svg)](tsconfig.json)
[![SARIF](https://img.shields.io/badge/SARIF-OASIS%20v2.1.0-orange.svg)](https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html)
[![Zero-Dependencies](https://img.shields.io/badge/Dependencies-0%20Runtime-success.svg)](package.json)

**`lh-sdr-spectrum-waterfall`** (`bin/lh-waterfall`) is an enterprise-grade, clean-room, zero-runtime-dependency TypeScript digital signal processing and RF visualization engine. It provides high-performance 60fps WebGL2 (GLSL ES 3.0) and WebGPU (WGSL) circular ring-buffer waterfall shaders, an in-place Radix-2 Cooley-Tukey FFT processor, Blackman-Harris windowing with coherent gain correction, Power Spectral Density (PSD) calculation in dBFS, Spurious-Free Dynamic Range (SFDR) detection, 256-entry scientific colormaps, and a 10-rule deterministic SDR telemetry dashboard posture auditor.

---

## Key Capabilities

1. **100% Zero External Runtime Dependencies**:
   Engineered entirely in pure TypeScript using native ECMAScript standard library constructs (`Float32Array`, `Uint8Array`, `Math`). Zero third-party runtime packages.
2. **Cooley-Tukey Radix-2 Complex FFT Engine**:
   - In-place bit-reversal permutation and $\log_2 N$ butterfly decomposition stages.
   - Exact trigonometric twiddle factors $W_N^k = \exp(-j 2\pi k / N)$.
   - Coherent gain compensation $G_{\text{coh}} = \frac{1}{N}\sum_{n=0}^{N-1} w[n]$ for window functions.
   - Quadrant swapping (DC-centered FFT shift) placing $0\text{ Hz}$ at bin $N/2$.
   - True Power Spectral Density (PSD) in $\text{dBFS}$ relative to full scale.
3. **Spectrum Telemetry & Metric Extraction**:
   - `ExponentialSpectrumAverager` computing temporal smoothing ($\alpha = 0.25$) and peak-hold tracking.
   - Median noise floor estimator $N_{\text{floor}}$ ($\text{dBFS}$), Peak SNR ($\text{dB}$), peak carrier frequency offset $\Delta f_{\text{peak}}$ ($\text{Hz}$), and Spurious-Free Dynamic Range ($\text{SFDR}$ in $\text{dBc}$).
4. **Scientific 256-Entry RGBA8 Colormaps**:
   - Deterministic 1024-byte `Uint8Array` lookup tables for `turbo`, `viridis`, `inferno`, and `radar-green`.
   - Dynamic power scaling with lower and upper boundary clamping ($P_{\min} \to P_{\max}$).
5. **$\mathcal{O}(1)$ Circular Ring-Buffer GPU Shaders (60fps)**:
   - WebGL2 (GLSL ES 3.0) and WebGPU (WGSL) shaders that eliminate full-texture GPU blits by updating single rows via ring pointer $r_{\text{head}}$ and wrapping fragment UV coordinates:
     $$v_{\text{ring}} = \text{fract}\left(v_{\text{uv}} + \frac{r_{\text{head}}}{H}\right)$$
   - Standalone HTML5/Canvas/WebGL2 dashboard generator (`gen-dashboard`) producing zero-dependency visualizers.
6. **10-Rule SDR Telemetry Dashboard Posture Auditor**:
   - Deterministic configuration audit checking transport security, buffer bounds, window leakage, CSP headers, and frequency redaction.
   - Comprehensive multi-format reporting: ANSI terminal box table, Canonical JSON, and OASIS SARIF v2.1.0.

---

## Signal Processing & GPU Math

### 1. In-Place Radix-2 Cooley-Tukey FFT

For complex sequence $z[n] = I[n] + j Q[n]$ with power-of-two size $N = 2^m$:
$$X[k] = \sum_{n=0}^{N-1} \left(z[n] \cdot w[n]\right) \exp\left(-j \frac{2\pi k n}{N}\right)$$

Butterfly computation at stage $s$ with twiddle factor $W_N^k$:
$$u = A, \quad v = B \cdot W_N^k, \quad A' = u + v, \quad B' = u - v$$

### 2. 4-Term Blackman-Harris Window & Coherent Gain

$$w[n] = a_0 - a_1 \cos\left(\frac{2\pi n}{N-1}\right) + a_2 \cos\left(\frac{4\pi n}{N-1}\right) - a_3 \cos\left(\frac{6\pi n}{N-1}\right)$$
where $a_0 = 0.35875, \; a_1 = 0.48829, \; a_2 = 0.14128, \; a_3 = 0.01168$, achieving $> 92\text{ dB}$ sidelobe suppression.

Coherent gain compensation:
$$G_{\text{coh}} = \frac{1}{N}\sum_{n=0}^{N-1} w[n]$$

### 3. DC-Centered Power Spectral Density (PSD)

After shifting bins so index $N/2$ represents the DC carrier ($0\text{ Hz}$):
$$P_{\text{dBFS}}[k] = 10 \log_{10}\left(\frac{\text{Re}(X_{\text{shift}}[k])^2 + \text{Im}(X_{\text{shift}}[k])^2}{N^2 \cdot G_{\text{coh}}^2} + 10^{-15}\right)$$

### 4. GPU Circular Ring-Buffer Sampling

Instead of shifting rows in VRAM every frame ($\mathcal{O}(N \times H)$ GPU blit), a single row is written at head pointer $r_{\text{head}} \in [0, H-1]$, and the fragment shader samples:
$$v_{\text{ring}} = \text{fract}\left(v_{\text{uv}} + \frac{r_{\text{head}}}{H}\right)$$

---

## Normative 10-Rule SDR Telemetry Posture Registry

| Rule ID | Severity | CWE | Weight | Trigger Condition & Normative Rationale |
|:---|:---:|:---:|:---:|:---|
| `LH-SPEC-001` | **CRITICAL** | CWE-319 | 25 | Unencrypted (`ws://`) or unauthenticated WebSocket IQ/FFT stream (`websocket_tls_enabled: false` or `websocket_auth_required: false`) |
| `LH-SPEC-002` | **CRITICAL** | CWE-400 | 25 | Invalid or excessive FFT bin size (`fft_size` not power of two or outside $[256, 16384]$), risking GPU starvation |
| `LH-SPEC-003` | **CRITICAL** | CWE-770 | 25 | Unbounded GPU waterfall ring-buffer or missing WebGL context-loss handler (`max_waterfall_history_rows > 2048` or `webgl_context_loss_handler: false`) |
| `LH-SPEC-004` | **HIGH** | CWE-682 | 10 | Rectangular (`"rectangular"`/`"none"`) window or insufficient suppression (`sidelobe_suppression_db < 40`), causing severe spectral leakage |
| `LH-SPEC-005` | **HIGH** | CWE-400 | 10 | Target frame rate exceeds 60fps ceiling or unbounded WebSocket ingress rate (`target_fps > 60` or `max_websocket_mbps > 50.0`) |
| `LH-SPEC-006` | **HIGH** | CWE-682 | 10 | Invalid dBFS dynamic range bounds (`min_dbfs >= max_dbfs`, `max_dbfs > 0.0`, or `(max_dbfs - min_dbfs) < 30.0`) |
| `LH-SPEC-007` | **HIGH** | CWE-200 | 10 | Sensitive RF frequency markers unredacted or raw receiver GPS coordinates exposed (`redact_sensitive_freq_labels: false` or `expose_receiver_gps_coords: true`) |
| `LH-SPEC-008` | **MEDIUM** | CWE-682 | 4 | Missing DC-center FFT shift or uncompensated window coherent gain (`fft_shift_dc_centered: false` or `apply_coherent_gain_correction: false`) |
| `LH-SPEC-009` | **MEDIUM** | CWE-693 | 4 | Missing Content-Security-Policy (CSP) or Cross-Origin Isolation headers (`strict_csp_enabled: false` or `shared_array_buffer_coop_coep: false`) |
| `LH-SPEC-010` | **LOW** | CWE-755 | 1 | Invalid EMA smoothing factor (`ema_alpha <= 0.0` or `ema_alpha > 1.0`) or missing ADC overload visual alert banner (`adc_overload_banner_enabled: false`) |

### Posture Scoring Equation

$$S_{\text{posture}} = \max\left(0, 100 - (25\cdot c_{\text{CRIT}} + 10\cdot c_{\text{HIGH}} + 4\cdot c_{\text{MED}} + 1\cdot c_{\text{LOW}})\right)$$

---

## CLI Reference (`bin/lh-waterfall`)

```bash
# 1. Evaluate SDR waterfall configuration against 10 posture rules
bin/lh-waterfall scan fixtures/hardened_waterfall_config.json
bin/lh-waterfall scan fixtures/vulnerable_waterfall_config.json --format sarif --output audit.sarif

# 2. Analyze complex IQ frame (FFT, PSD, Noise Floor, SFDR)
bin/lh-waterfall analyze-iq fixtures/sample_iq_frame.json --fft-size 1024 --window blackman-harris

# 3. Generate standalone WebGL2 GLSL or WebGPU WGSL shaders
bin/lh-waterfall gen-shaders --backend webgl2
bin/lh-waterfall gen-shaders --backend webgpu --output waterfall.wgsl

# 4. Generate standalone self-contained 60fps HTML5/WebGL2 dashboard
bin/lh-waterfall gen-dashboard --output dashboard.html

# 5. General info
bin/lh-waterfall --version
bin/lh-waterfall --help
```

### Deterministic Exit Codes

- `0`: Scan passed successfully (Posture Score: `100/100`) or valid signal analysis completed.
- `1`: Security posture violations detected (Posture Score: `< 100/100`).
- `2`: Command-line usage error, missing argument, or file I/O error.

---

## Corporate Governance & Attribution

- **Organization**: Logihertz Systems (OPC) Private Limited
- **Creator, Founder, Director & Sole Developer**: **Sameer Tawade** (`ops@logihertz.com` / `security@logihertz.com`)
- **Website**: [https://logihertz.com/](https://logihertz.com/)
- **License**: Apache-2.0
