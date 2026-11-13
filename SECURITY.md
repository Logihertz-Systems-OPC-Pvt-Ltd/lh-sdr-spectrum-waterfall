# Security Policy — Logihertz SDR Spectrum & Waterfall Engine

## Supported Versions

Logihertz Systems (OPC) Private Limited maintains and publishes security updates for the following active releases of `lh-sdr-spectrum-waterfall`:

| Version | Supported          | Security Maintenance Tier |
|:-------:|:------------------:|:--------------------------|
| 0.1.x   | :white_check_mark: | Active Production Release |

## Threat Model & Scope

`lh-sdr-spectrum-waterfall` operates at the boundary of real-time Software Defined Radio (SDR) baseband telemetry ingestion, GPU shader rendering (WebGL2/WebGPU), and browser-based RF operational displays. Key security considerations include:

1. **Telemetry Transport Security**: Preventing unauthenticated or unencrypted WebSocket IQ/FFT stream interception (enforcing WSS with client token authentication).
2. **GPU Resource Protection**: Enforcing bounded circular texture ring buffers, avoiding GPU out-of-memory crashes or WebGL context starvation.
3. **Spectral Leakage Prevention**: Enforcing high-attenuation windowing (Blackman-Harris $-92\text{ dB}$) to prevent false signal spoofing or harmonic masking.
4. **RF Operational Privacy**: Enforcing redaction of sensitive operational frequency markers and masking receiver GPS locations.
5. **Web Origin Isolation**: Ensuring Cross-Origin Opener Policy (COOP), Cross-Origin Embedder Policy (COEP), and strict Content-Security-Policy (CSP) headers for high-performance memory buffers.

## Reporting a Vulnerability

If you discover a potential vulnerability or security flaw in `lh-sdr-spectrum-waterfall`, please submit a confidential disclosure:

- **Primary Security Channel**: `security@logihertz.com`
- **Operations & Founder Escalation**: `ops@logihertz.com` (Direct attention: Sameer Tawade)
- **Response SLA**: Initial triage and acknowledgment within 24–48 hours.
- **Remediation SLA**: Coordinated patch development, verification, and tagged release within 14 business days.

Please do not open public GitHub issues for undisclosed security vulnerabilities. All disclosures will be credited in release notes upon coordinated remediation.
