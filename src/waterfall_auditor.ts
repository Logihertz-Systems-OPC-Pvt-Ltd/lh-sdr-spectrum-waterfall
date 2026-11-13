// ==============================================================================
// Product:       Logihertz SDR Spectrum & Waterfall Engine (lh-sdr-spectrum-waterfall)
// Module:        src/waterfall_auditor.ts
// Role:          10-Rule Deterministic SDR Telemetry Dashboard Posture Auditor
// Organization:  Logihertz Systems (OPC) Private Limited
// Developer:     Sameer Tawade (Creator, Founder, Director & Sole Developer)
// Contact:       ops@logihertz.com / security@logihertz.com
// License:       Apache-2.0
// ==============================================================================

import {
  RuleDefinition,
  WaterfallDashboardConfig,
  Finding,
  AuditReport
} from './types';
import { isPowerOfTwo } from './fft_spectrum';

/**
 * Official registry of all 10 normative SDR spectrum/waterfall posture rules.
 */
export const NORMATIVE_RULES: RuleDefinition[] = [
  {
    id: 'LH-SPEC-001',
    name: 'Unencrypted or Unauthenticated Telemetry WebSocket',
    severity: 'CRITICAL',
    cwe: 'CWE-319',
    weight: 25,
    description: 'WebSocket IQ/FFT stream is unencrypted (ws://) or lacks mandatory client token authentication.',
    remediation: 'Enable websocket_tls_enabled: true (wss://) and enforce websocket_auth_required: true.'
  },
  {
    id: 'LH-SPEC-002',
    name: 'Invalid or Excessive FFT Buffer Size',
    severity: 'CRITICAL',
    cwe: 'CWE-400',
    weight: 25,
    description: 'FFT bin size is not a power of two (2^m) or falls outside the safe boundary [256, 16384].',
    remediation: 'Constrain fft_size to a valid power of two within [256, 16384] (e.g. 1024 or 2048).'
  },
  {
    id: 'LH-SPEC-003',
    name: 'Unbounded GPU Ring-Buffer or Missing Context-Loss Handler',
    severity: 'CRITICAL',
    cwe: 'CWE-770',
    weight: 25,
    description: 'Waterfall texture history exceeds 2048 rows or WebGL context restoration handler is disabled.',
    remediation: 'Set max_waterfall_history_rows <= 2048 and ensure webgl_context_loss_handler: true.'
  },
  {
    id: 'LH-SPEC-004',
    name: 'Severe Spectral Leakage via Rectangular Windowing',
    severity: 'HIGH',
    cwe: 'CWE-682',
    weight: 10,
    description: 'Window function is rectangular/none or sidelobe suppression is less than 40 dB.',
    remediation: 'Use a high-suppression window (blackman-harris or hann) with sidelobe_suppression_db >= 40.'
  },
  {
    id: 'LH-SPEC-005',
    name: 'Unconstrained Refresh Rate or Telemetry Ingress Throughput',
    severity: 'HIGH',
    cwe: 'CWE-400',
    weight: 10,
    description: 'Target frame rate exceeds 60fps or maximum websocket ingress rate exceeds 50.0 Mbps.',
    remediation: 'Cap target_fps <= 60 and restrict max_websocket_mbps <= 50.0 to prevent thread starvation.'
  },
  {
    id: 'LH-SPEC-006',
    name: 'Invalid dBFS Dynamic Range Bounds',
    severity: 'HIGH',
    cwe: 'CWE-682',
    weight: 10,
    description: 'min_dbfs >= max_dbfs, max_dbfs > 0.0, or the dynamic span is less than 30.0 dB.',
    remediation: 'Ensure min_dbfs < max_dbfs <= 0.0 with a dynamic span (max_dbfs - min_dbfs) >= 30.0 dB.'
  },
  {
    id: 'LH-SPEC-007',
    name: 'Sensitive RF Frequency Markers or GPS Location Exposed',
    severity: 'HIGH',
    cwe: 'CWE-200',
    weight: 10,
    description: 'Sensitive operational frequency labels are unredacted or receiver GPS coordinates are exposed.',
    remediation: 'Set redact_sensitive_freq_labels: true and expose_receiver_gps_coords: false.'
  },
  {
    id: 'LH-SPEC-008',
    name: 'Missing DC-Centered Shift or Window Coherent Gain Correction',
    severity: 'MEDIUM',
    cwe: 'CWE-682',
    weight: 4,
    description: 'FFT shift (DC centering) is disabled or window coherent gain correction is omitted.',
    remediation: 'Enable fft_shift_dc_centered: true and apply_coherent_gain_correction: true.'
  },
  {
    id: 'LH-SPEC-009',
    name: 'Missing Content-Security-Policy or Origin Isolation Headers',
    severity: 'MEDIUM',
    cwe: 'CWE-693',
    weight: 4,
    description: 'Strict CSP is disabled or Cross-Origin Opener/Embedder Isolation (COOP/COEP) is missing.',
    remediation: 'Enable strict_csp_enabled: true and shared_array_buffer_coop_coep: true.'
  },
  {
    id: 'LH-SPEC-010',
    name: 'Invalid EMA Smoothing Factor or Missing ADC Overload Alert',
    severity: 'LOW',
    cwe: 'CWE-755',
    weight: 1,
    description: 'ema_alpha is invalid (<= 0.0 or > 1.0) or ADC overload visual banner is disabled.',
    remediation: 'Set 0.0 < ema_alpha <= 1.0 and enable adc_overload_banner_enabled: true.'
  }
];

/**
 * Deterministically evaluate an SDR waterfall dashboard configuration against the 10 normative rules.
 */
export function auditWaterfallConfig(
  config: WaterfallDashboardConfig,
  manifestPath: string = ''
): AuditReport {
  const findings: Finding[] = [];
  const rules = NORMATIVE_RULES;

  // Rule 1: LH-SPEC-001 (CRITICAL, 25)
  const tls = config.websocket_tls_enabled ?? false;
  const auth = config.websocket_auth_required ?? false;
  const wsUrl = config.websocket_url || '';
  if (!tls || !auth || wsUrl.startsWith('ws://')) {
    findings.push({
      ruleId: rules[0].id,
      ruleName: rules[0].name,
      severity: rules[0].severity,
      weight: rules[0].weight,
      cwe: rules[0].cwe,
      message: `websocket_tls_enabled=${tls}, websocket_auth_required=${auth}, websocket_url='${wsUrl}' (WSS and authentication required).`,
      remediation: rules[0].remediation
    });
  }

  // Rule 2: LH-SPEC-002 (CRITICAL, 25)
  const fftSize = config.fft_size ?? 0;
  if (!isPowerOfTwo(fftSize) || fftSize < 256 || fftSize > 16384) {
    findings.push({
      ruleId: rules[1].id,
      ruleName: rules[1].name,
      severity: rules[1].severity,
      weight: rules[1].weight,
      cwe: rules[1].cwe,
      message: `fft_size=${fftSize} is invalid (must be power of two within [256, 16384]).`,
      remediation: rules[1].remediation
    });
  }

  // Rule 3: LH-SPEC-003 (CRITICAL, 25)
  const maxRows = config.max_waterfall_history_rows ?? 4096;
  const ctxLoss = config.webgl_context_loss_handler ?? false;
  if (maxRows > 2048 || !ctxLoss) {
    findings.push({
      ruleId: rules[2].id,
      ruleName: rules[2].name,
      severity: rules[2].severity,
      weight: rules[2].weight,
      cwe: rules[2].cwe,
      message: `max_waterfall_history_rows=${maxRows} (> 2048) or webgl_context_loss_handler=${ctxLoss}.`,
      remediation: rules[2].remediation
    });
  }

  // Rule 4: LH-SPEC-004 (HIGH, 10)
  const win = config.window_function ?? 'rectangular';
  const sidelobe = config.sidelobe_suppression_db ?? 0;
  if (win === 'rectangular' || (win as string) === 'none' || sidelobe < 40) {
    findings.push({
      ruleId: rules[3].id,
      ruleName: rules[3].name,
      severity: rules[3].severity,
      weight: rules[3].weight,
      cwe: rules[3].cwe,
      message: `window_function='${win}' with sidelobe_suppression_db=${sidelobe} (< 40 dB).`,
      remediation: rules[3].remediation
    });
  }

  // Rule 5: LH-SPEC-005 (HIGH, 10)
  const fps = config.target_fps ?? 120;
  const mbps = config.max_websocket_mbps ?? 100.0;
  if (fps > 60 || mbps > 50.0) {
    findings.push({
      ruleId: rules[4].id,
      ruleName: rules[4].name,
      severity: rules[4].severity,
      weight: rules[4].weight,
      cwe: rules[4].cwe,
      message: `target_fps=${fps} (> 60) or max_websocket_mbps=${mbps} (> 50.0 Mbps).`,
      remediation: rules[4].remediation
    });
  }

  // Rule 6: LH-SPEC-006 (HIGH, 10)
  const minDb = config.min_dbfs ?? -100;
  const maxDb = config.max_dbfs ?? 10;
  if (minDb >= maxDb || maxDb > 0.0 || (maxDb - minDb) < 30.0) {
    findings.push({
      ruleId: rules[5].id,
      ruleName: rules[5].name,
      severity: rules[5].severity,
      weight: rules[5].weight,
      cwe: rules[5].cwe,
      message: `min_dbfs=${minDb}, max_dbfs=${maxDb} (span=${maxDb - minDb} dB, must be >= 30 dB and max_dbfs <= 0.0).`,
      remediation: rules[5].remediation
    });
  }

  // Rule 7: LH-SPEC-007 (HIGH, 10)
  const redactLabels = config.redact_sensitive_freq_labels ?? false;
  const exposeGps = config.expose_receiver_gps_coords ?? true;
  if (!redactLabels || exposeGps) {
    findings.push({
      ruleId: rules[6].id,
      ruleName: rules[6].name,
      severity: rules[6].severity,
      weight: rules[6].weight,
      cwe: rules[6].cwe,
      message: `redact_sensitive_freq_labels=${redactLabels} or expose_receiver_gps_coords=${exposeGps}.`,
      remediation: rules[6].remediation
    });
  }

  // Rule 8: LH-SPEC-008 (MEDIUM, 4)
  const shift = config.fft_shift_dc_centered ?? false;
  const coherent = config.apply_coherent_gain_correction ?? false;
  if (!shift || !coherent) {
    findings.push({
      ruleId: rules[7].id,
      ruleName: rules[7].name,
      severity: rules[7].severity,
      weight: rules[7].weight,
      cwe: rules[7].cwe,
      message: `fft_shift_dc_centered=${shift}, apply_coherent_gain_correction=${coherent}.`,
      remediation: rules[7].remediation
    });
  }

  // Rule 9: LH-SPEC-009 (MEDIUM, 4)
  const csp = config.strict_csp_enabled ?? false;
  const coopCoep = config.shared_array_buffer_coop_coep ?? false;
  if (!csp || !coopCoep) {
    findings.push({
      ruleId: rules[8].id,
      ruleName: rules[8].name,
      severity: rules[8].severity,
      weight: rules[8].weight,
      cwe: rules[8].cwe,
      message: `strict_csp_enabled=${csp}, shared_array_buffer_coop_coep=${coopCoep}.`,
      remediation: rules[8].remediation
    });
  }

  // Rule 10: LH-SPEC-010 (LOW, 1)
  const alpha = config.ema_alpha ?? 0.0;
  const banner = config.adc_overload_banner_enabled ?? false;
  if (alpha <= 0.0 || alpha > 1.0 || !banner) {
    findings.push({
      ruleId: rules[9].id,
      ruleName: rules[9].name,
      severity: rules[9].severity,
      weight: rules[9].weight,
      cwe: rules[9].cwe,
      message: `ema_alpha=${alpha} (must be in (0.0, 1.0]) or adc_overload_banner_enabled=${banner}.`,
      remediation: rules[9].remediation
    });
  }

  let totalDeduction = 0;
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  for (const f of findings) {
    totalDeduction += f.weight;
    if (f.severity === 'CRITICAL') criticalCount++;
    else if (f.severity === 'HIGH') highCount++;
    else if (f.severity === 'MEDIUM') mediumCount++;
    else if (f.severity === 'LOW') lowCount++;
  }

  const score = Math.max(0, 100 - totalDeduction);
  const passedRules = 10 - findings.length;
  const status = (score === 100) ? 'PASSED' : 'FAILED';

  return {
    manifestPath,
    score,
    status,
    totalRules: 10,
    passedRules,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    findings
  };
}
