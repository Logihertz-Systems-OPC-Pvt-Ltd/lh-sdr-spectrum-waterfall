# Engineering & Technical Architecture Specification

**Specification ID**: `LH-SPEC-2026-038`  
**Repository**: `lh-sdr-spectrum-waterfall`  
**CLI Executable**: `lh-waterfall`  
**Standard Release Version**: `0.1.0`  
**Standard License**: `Apache-2.0`  
**Classification**: `Industrial Sovereign Cybersecurity & Critical Infrastructure Telemetry`

---

## Section 1: Document Control & Specification Metadata

| Metadata Attribute | Value |
| :--- | :--- |
| **Document Identification** | `LH-SPEC-2026-038` |
| **System Name** | `Logihertz Systems Sovereign Ecosystem` |
| **Target Component** | `lh-sdr-spectrum-waterfall` (`lh-waterfall`) |
| **Target Language / Platform** | `TypeScript` |
| **Legal Entity** | Logihertz Systems (OPC) Private Limited |
| **Corporate Identity (CIN)** | `U72100MH2025OPC463857` |
| **GSTIN Registration** | `27AAGCL6394P1ZL` |
| **Principal Architect** | Sameer Tawade (`ops@logihertz.com` / `security@logihertz.com`) |
| **Headquarters & Registered Office** | Mumbai, Maharashtra, Republic of India |
| **Official Portal** | [https://www.logihertz.com](https://www.logihertz.com) |
| **Repository URL** | [https://github.com/Logihertz-Systems-OPC-Pvt-Ltd/lh-sdr-spectrum-waterfall](https://github.com/Logihertz-Systems-OPC-Pvt-Ltd/lh-sdr-spectrum-waterfall) |
| **Document Status** | `APPROVED FOR PRODUCTION & INDUSTRIAL CERTIFICATION` |
| **Effective Release Date** | `2026-11-16` |

---

## Section 2: Normative RFC 2119 Requirements & System Invariants

This technical architecture specification enforces strict deterministic execution invariants in accordance with **RFC 2119** (`MUST`, `MUST NOT`, `REQUIRED`, `SHALL`, `SHALL NOT`, `SHOULD`, `RECOMMENDED`, `MAY`).

1. **Zero-Daemon Execution Invariant**:
   - The CLI binary `lh-waterfall` `MUST` execute as a clean, self-contained, stateless, zero-daemon process.
   - It `MUST NOT` spawn background daemons, fork unmonitored worker processes, or establish persistent Unix domain socket listeners unless explicitly invoked in daemon mode.
   - All state transitions `MUST` be deterministic, ephemeral, and strictly bounded by the execution lifecycle.

2. **Zero External Runtime Dependency Mandate**:
   - The software `MUST NOT` load, link, or depend upon third-party runtime package registries (e.g. PyPI, npm, Packagist, crates.io, Maven) at runtime.
   - For `TypeScript`, all cryptographic, mathematical, serialization, and networking primitives `MUST` be implemented exclusively via language standard libraries or clean-room internal zero-dependency modules.

3. **Deterministic Air-Gapped Operation**:
   - The system `MUST` function with 100% feature parity in air-gapped, isolated, and offline enclaves.
   - The software `MUST NOT` initiate unsolicited network calls, telemetry telemetry pings, phone-home beacons, or external CDN queries.
   - All verification baselines, heuristics, and schemas `MUST` be packaged locally within the distribution.

4. **Constant-Time Cryptographic Comparison**:
   - All cryptographic comparison routines (hashes, HMAC tags, signatures, secret tokens, and commitments) `MUST` execute in constant time (`subtle.ConstantTimeCompare`, `CRYPTO_memcmp`, or equivalent).
   - The implementation `MUST NOT` short-circuit string comparisons when evaluating sensitive keys, thereby mitigating timing side-channel attacks.

5. **Memory Safety & Explicit Zeroization**:
   - All transient buffers containing sensitive key material, decrypted plaintexts, seeds, and cryptographic nonces `MUST` be explicitly overwritten with zeroes immediately following completion of the cryptographic operation.
   - For C/C++ implementations, bounds checks and safe buffer wrappers `MUST` prevent stack/heap overflows. For Rust implementations, `#![forbid(unsafe_code)]` `MUST` be enforced.

6. **Standardized Telemetry Interoperability**:
   - All security assessment outputs `MUST` support machine-readable ingestion via OASIS SARIF v2.1.0 JSON and Canonical Indented JSON schemas, alongside ANSI console tables.

---

## Section 3: Core Mathematical & Algorithmic Specification

### 3.1 Domain Engine Mathematical Foundation: Radix-2 Cooley-Tukey FFT & Ring-Buffer Texture Coordinate

The underlying computational core of `lh-sdr-spectrum-waterfall` is formally governed by the following mathematical and algorithmic formulations:

$$X[k] = \sum_{n=0}^{N/2-1} x[2n] W_{N/2}^{kn} + W_N^k \sum_{n=0}^{N/2-1} x[2n+1] W_{N/2}^{kn}, \quad v = \frac{(y + \text{head}) \bmod H}{H}$$

### 3.2 Standardized Logihertz Security Posture Score Formulation

To achieve absolute cross-tool normalization across all 60 repositories in the Logihertz Systems Ecosystem, the security posture score $S_{\text{posture}}$ is evaluated on a standardized continuous integer scale $[0, 100]$:

$$S_{\text{posture}} = \max\left(0, \; 100 - \left(25 \cdot c_{\text{CRITICAL}} + 10 \cdot c_{\text{HIGH}} + 4 \cdot c_{\text{MEDIUM}} + 1 \cdot c_{\text{LOW}}\right)\right)$$

Where:
- $c_{\text{CRITICAL}}$ represents the total count of triggered Critical-severity normative rules (deduction: $-25$ per finding).
- $c_{\text{HIGH}}$ represents the total count of triggered High-severity normative rules (deduction: $-10$ per finding).
- $c_{\text{MEDIUM}}$ represents the total count of triggered Medium-severity normative rules (deduction: $-4$ per finding).
- $c_{\text{LOW}}$ represents the total count of triggered Low-severity normative rules (deduction: $-1$ per finding).

The final compliance verdict is strictly bifurcated:
$$\text{Verdict} = \begin{cases} \text{PASS} & \text{if } S_{\text{posture}} = 100 \land \sum c_i = 0 \\ \text{FAIL} & \text{otherwise} \end{cases}$$

---

## Section 4: Normative 10-Rule Detection Matrix

The detection engine evaluates configurations, manifests, firmware, protocols, and streams against the following 10 deterministic security rules:

| Rule ID | Severity | Weight | CWE ID | Trigger Predicate / Condition | Remediation Guideline |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `LH-SPEC-001` | `CRITICAL` | `25` | `CWE-319` | 25 | Unencrypted (ws://) or unauthenticated WebSocket IQ/FFT stream (websocket_tls_enabled: false or websocket_auth_required: false) |
| `LH-SPEC-002` | `CRITICAL` | `25` | `CWE-400` | 25 | Invalid or excessive FFT bin size (fft_size not power of two or outside $[256, 16384]$), risking GPU starvation |
| `LH-SPEC-003` | `CRITICAL` | `25` | `CWE-770` | 25 | Unbounded GPU waterfall ring-buffer or missing WebGL context-loss handler (max_waterfall_history_rows > 2048 or webgl_context_loss_handler: false) |
| `LH-SPEC-004` | `HIGH` | `10` | `CWE-682` | 10 | Rectangular ("rectangular"/"none") window or insufficient suppression (sidelobe_suppression_db < 40), causing severe spectral leakage |
| `LH-SPEC-005` | `HIGH` | `10` | `CWE-400` | 10 | Target frame rate exceeds 60fps ceiling or unbounded WebSocket ingress rate (target_fps > 60 or max_websocket_mbps > 50.0) |
| `LH-SPEC-006` | `HIGH` | `10` | `CWE-682` | 10 | Invalid dBFS dynamic range bounds (min_dbfs >= max_dbfs, max_dbfs > 0.0, or (max_dbfs - min_dbfs) < 30.0) |
| `LH-SPEC-007` | `HIGH` | `10` | `CWE-200` | 10 | Sensitive RF frequency markers unredacted or raw receiver GPS coordinates exposed (redact_sensitive_freq_labels: false or expose_receiver_gps_coords: true) |
| `LH-SPEC-008` | `MEDIUM` | `4` | `CWE-682` | 4 | Missing DC-center FFT shift or uncompensated window coherent gain (fft_shift_dc_centered: false or apply_coherent_gain_correction: false) |
| `LH-SPEC-009` | `MEDIUM` | `4` | `CWE-693` | 4 | Missing Content-Security-Policy (CSP) or Cross-Origin Isolation headers (strict_csp_enabled: false or shared_array_buffer_coop_coep: false) |
| `LH-SPEC-010` | `LOW` | `1` | `CWE-755` | 1 | Invalid EMA smoothing factor (ema_alpha <= 0.0 or ema_alpha > 1.0) or missing ADC overload visual alert banner (adc_overload_banner_enabled: false) |

---

## Section 5: CLI Contract, Exit Codes & OASIS SARIF v2.1.0 Specification

### 5.1 Command-Line Interface Syntax

The primary entrypoint `lh-waterfall` conforms to standard POSIX argument conventions:

```text
USAGE:
  lh-waterfall <command> [flags] [arguments]

CORE COMMANDS:
  scan <target> [--format table|json|sarif] [--output <file>]
      Execute deterministic security evaluation against target manifest or telemetry stream.
  verify <target>
      Validate operational parameters, cryptographic checksums, and structural invariants.
  --version, version
      Output release version, architecture, and legal attribution.
  --help, help
      Display comprehensive operational usage and command reference.
```

### 5.2 Deterministic Exit Code Protocol

| Exit Code | Classification | Operational Semantics |
| :---: | :--- | :--- |
| `0` | **SUCCESS / PASS** | Target passed all checks; zero Critical/High violations detected; $S_{\text{posture}} = 100$. |
| `1` | **FINDINGS / FAIL** | Target triggered one or more security rule violations; policy threshold breached. |
| `2` | **ERROR / USAGE** | Invalid CLI invocation, syntax error, missing input file, or fatal I/O failure. |

### 5.3 OASIS SARIF v2.1.0 Schema Compliance

Exported SARIF documents validate against the official OASIS schema (`sarif-schema-2.1.0.json`). Each result object maps:
- `ruleId`: Standardized identifier (`LH-SPEC-001` .. `LH-SPEC-010`).
- `level`: SARIF severity levels (`error` for Critical/High, `warning` for Medium, `note` for Low).
- `message.text`: Comprehensive explanation, CWE mapping, and actionable remediation steps.
- `locations[].physicalLocation.artifactLocation.uri`: Absolute or normalized relative path of target artifact.

---

## 6. Standalone Future Development Roadmap (`v0.2.0` — `v0.5.0`)

`lh-sdr-spectrum-waterfall` is developed as an independent, standalone open-source project. The following roadmap defines the planned architectural, algorithmic, and protocol enhancements for upcoming point releases of `lh-sdr-spectrum-waterfall`:

| Target Release | Milestone Focus | Planned Technical Deliverables for `lh-sdr-spectrum-waterfall` |
|---|---|---|
| **`v0.2.0`** | Parser & Protocol Expansion | Add a Polyphase Filter Bank (PFB) channelizer mode (eliminating FFT scallop loss) and interactive frequency-band marker overlay shaders. |
| **`v0.3.0`** | Deep Algorithmic & Stateful Analysis | Implement WebWorker + SharedArrayBuffer lock-free ring-buffer DSP offloading and automated spur/harmonic peak tracking. |
| **`v0.4.0`** | Remediation, Synthesis & Format Interop | Add SigMF (Signal Metadata Format) annotation layer import/export and waterfall frame-rate adaptive dynamic range compression. |
| **`v0.5.0`** | High-Throughput Performance & Formal Verification | Implement Cyclostationary Spectral Correlation Density (SCD) visualization and WebCodecs waterfall session recording. |

### 6.1 `v0.2.0` — Parser & Protocol Expansion
- **Format & Protocol Ingestion**: Add a Polyphase Filter Bank (PFB) channelizer mode (eliminating FFT scallop loss) and interactive frequency-band marker overlay shaders.
- **Zero-Dependency Architecture**: Pure standard library implementation with deterministic parsing guarantees and strict error handling.
- **Verification & Telemetry**: Regression test suites verifying schema edge-cases, malformed payload rejections, and SARIF v2.1.0 output fidelity.

### 6.2 `v0.3.0` — Deep Algorithmic & Stateful Analysis
- **Algorithmic Core**: Implement WebWorker + SharedArrayBuffer lock-free ring-buffer DSP offloading and automated spur/harmonic peak tracking.
- **State Machine & Analysis Engine**: High-fidelity state tracking, cycle detection, and invariant checking with minimal computational overhead.
- **Differential & Regression Verification**: Comprehensive test harnesses covering stateful transitions, edge conditions, and mathematical boundary constraints.

### 6.3 `v0.4.0` — Remediation, Synthesis & Format Interoperability
- **Synthesis & Interoperability**: Add SigMF (Signal Metadata Format) annotation layer import/export and waterfall frame-rate adaptive dynamic range compression.
- **Automated Remediation Workflows**: Idempotent generation of verified configuration patches, policy rules, and standardized cross-format exports.
- **Contract & Artifact Validation**: Cryptographic baseline verification and end-to-end integration testing for synthesized deliverables.

### 6.4 `v0.5.0` — High-Throughput Performance & Formal Verification
- **High-Throughput Optimization**: Implement Cyclostationary Spectral Correlation Density (SCD) visualization and WebCodecs waterfall session recording.
- **Hardware & Kernel Acceleration**: Vectorized SIMD/eBPF/sub-millisecond streaming execution with bounded memory allocation.
- **Formal Verification & Assurance**: Mathematical proof of invariant preservation, false-positive calibration, and high-assurance certification baselines.

---

## Section 7: Verification, Quality Assurance & Legal Attribution

### 7.1 Automated Verification Protocol

Prior to distribution, all builds must execute the standardized Logihertz test suite:
- Unit and mathematical property tests verifying all equations and edge cases.
- Static analysis with zero warnings under standard strict linters.
- Subprocess CLI verification covering exit codes `0`, `1`, and `2`.

### 7.2 Copyright & Governance Notice

```text
Copyright 2025-2026 Logihertz Systems (OPC) Private Limited.
Creator, Founder, Director & Sole Developer: Sameer Tawade <ops@logihertz.com> / <security@logihertz.com>
Official Corporate Portal: https://www.logihertz.com
```

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this software except in compliance with the License. You may obtain a copy of the License at `http://www.apache.org/licenses/LICENSE-2.0`.
