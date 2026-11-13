// ==============================================================================
// Product:       Logihertz SDR Spectrum & Waterfall Engine (lh-sdr-spectrum-waterfall)
// Module:        src/types.ts
// Role:          Core Type Definitions, DSP Configs & Auditor Models
// Organization:  Logihertz Systems (OPC) Private Limited
// Developer:     Sameer Tawade (Creator, Founder, Director & Sole Developer)
// Contact:       ops@logihertz.com / security@logihertz.com
// License:       Apache-2.0
// ==============================================================================

/** Complex IQ sample pair representing in-phase and quadrature baseband components */
export interface IQSample {
  i: number;
  q: number;
}

/** Supported mathematical window functions */
export type WindowFunction = 'blackman-harris' | 'hann' | 'hamming' | 'flattop' | 'rectangular';

/** Supported scientific 256-entry colormap names */
export type ColormapName = 'turbo' | 'viridis' | 'inferno' | 'radar-green';

/** Configuration for Radix-2 FFT and Power Spectral Density processor */
export interface FFTConfig {
  fftSize: number;
  sampleRateHz: number;
  window: WindowFunction;
  applyCoherentGainCorrection: boolean;
  fftShiftDcCentered: boolean;
  minDbfs: number;
  maxDbfs: number;
  emaAlpha: number;
}

/** Extracted spectral metrics from a Power Spectral Density frame */
export interface SpectrumMetrics {
  peakPowerDbfs: number;
  peakFrequencyHz: number;
  noiseFloorDbfs: number;
  snrDb: number;
  sfdrDbc: number;
  totalEnergy: number;
}

/** Output result of FFT and PSD analysis */
export interface SpectrumResult {
  frequenciesHz: Float32Array;
  psdDbfs: Float32Array;
  averagedPsdDbfs: Float32Array;
  peakHoldPsdDbfs: Float32Array;
  metrics: SpectrumMetrics;
}

/** Severity levels for security and operational rules */
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/** Specification for a normative posture rule */
export interface RuleDefinition {
  id: string;
  name: string;
  severity: Severity;
  cwe: string;
  weight: number;
  description: string;
  remediation: string;
}

/** Individual rule violation finding */
export interface Finding {
  ruleId: string;
  ruleName: string;
  severity: Severity;
  weight: number;
  cwe: string;
  message: string;
  remediation: string;
}

/** SDR Telemetry Dashboard Configuration manifest */
export interface WaterfallDashboardConfig {
  dashboard_id?: string;
  organization?: string;
  websocket_url?: string;
  websocket_tls_enabled?: boolean;
  websocket_auth_required?: boolean;
  fft_size?: number;
  sample_rate_hz?: number;
  max_waterfall_history_rows?: number;
  webgl_context_loss_handler?: boolean;
  window_function?: WindowFunction;
  sidelobe_suppression_db?: number;
  target_fps?: number;
  max_websocket_mbps?: number;
  min_dbfs?: number;
  max_dbfs?: number;
  redact_sensitive_freq_labels?: boolean;
  expose_receiver_gps_coords?: boolean;
  fft_shift_dc_centered?: boolean;
  apply_coherent_gain_correction?: boolean;
  strict_csp_enabled?: boolean;
  shared_array_buffer_coop_coep?: boolean;
  ema_alpha?: number;
  adc_overload_banner_enabled?: boolean;
  colormap?: ColormapName;
  [key: string]: unknown;
}

/** Comprehensive audit evaluation report */
export interface AuditReport {
  manifestPath: string;
  score: number;
  status: 'PASSED' | 'FAILED';
  totalRules: number;
  passedRules: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  findings: Finding[];
}
