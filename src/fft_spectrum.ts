// ==============================================================================
// Product:       Logihertz SDR Spectrum & Waterfall Engine (lh-sdr-spectrum-waterfall)
// Module:        src/fft_spectrum.ts
// Role:          Radix-2 Cooley-Tukey FFT, Windowing & PSD Telemetry Engine
// Organization:  Logihertz Systems (OPC) Private Limited
// Developer:     Sameer Tawade (Creator, Founder, Director & Sole Developer)
// Contact:       ops@logihertz.com / security@logihertz.com
// License:       Apache-2.0
// ==============================================================================

import { IQSample, WindowFunction, FFTConfig, SpectrumMetrics, SpectrumResult } from './types';

/**
 * Generate window function coefficients and compute its coherent gain G_coh.
 */
export function generateWindow(name: WindowFunction, n: number): { window: Float32Array; coherentGain: number } {
  if (n <= 0) {
    throw new Error(`Invalid window length: ${n}`);
  }

  const w = new Float32Array(n);
  const denom = (n > 1) ? (n - 1) : 1;
  const twoPi = 2.0 * Math.PI;

  switch (name) {
    case 'blackman-harris': {
      // 4-term Blackman-Harris window (-92 dB sidelobes)
      const a0 = 0.35875;
      const a1 = 0.48829;
      const a2 = 0.14128;
      const a3 = 0.01168;
      for (let i = 0; i < n; ++i) {
        const phi = (twoPi * i) / denom;
        w[i] = a0 - a1 * Math.cos(phi) + a2 * Math.cos(2.0 * phi) - a3 * Math.cos(3.0 * phi);
      }
      break;
    }

    case 'hann': {
      for (let i = 0; i < n; ++i) {
        w[i] = 0.5 * (1.0 - Math.cos((twoPi * i) / denom));
      }
      break;
    }

    case 'hamming': {
      for (let i = 0; i < n; ++i) {
        w[i] = 0.54 - 0.46 * Math.cos((twoPi * i) / denom);
      }
      break;
    }

    case 'flattop': {
      // 5-term Flat-Top window for high amplitude measurement accuracy
      const a0 = 0.21557895;
      const a1 = 0.41663158;
      const a2 = 0.277263158;
      const a3 = 0.083578947;
      const a4 = 0.006947368;
      for (let i = 0; i < n; ++i) {
        const phi = (twoPi * i) / denom;
        w[i] = a0 - a1 * Math.cos(phi) + a2 * Math.cos(2.0 * phi) - a3 * Math.cos(3.0 * phi) + a4 * Math.cos(4.0 * phi);
      }
      break;
    }

    case 'rectangular':
    default: {
      for (let i = 0; i < n; ++i) {
        w[i] = 1.0;
      }
      break;
    }
  }

  let sum = 0.0;
  for (let i = 0; i < n; ++i) {
    sum += w[i];
  }
  const coherentGain = sum / n;

  return { window: w, coherentGain };
}

/**
 * Validate that an integer is a positive power of two (2^m).
 */
export function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

/**
 * In-place Radix-2 Decimation-In-Time Cooley-Tukey Complex FFT.
 * Operates on separate real and imaginary Float32Array buffers.
 */
export function complexFftRadix2(re: Float32Array, im: Float32Array): void {
  const n = re.length;
  if (n !== im.length) {
    throw new Error(`Real and imaginary buffer lengths must match: ${n} vs ${im.length}`);
  }
  if (!isPowerOfTwo(n)) {
    throw new Error(`FFT size must be a power of two: received ${n}`);
  }

  // 1. In-place bit-reversal permutation
  let j = 0;
  for (let i = 0; i < n - 1; ++i) {
    if (i < j) {
      const tempR = re[i];
      re[i] = re[j];
      re[j] = tempR;

      const tempI = im[i];
      im[i] = im[j];
      im[j] = tempI;
    }
    let k = n >> 1;
    while (k <= j) {
      j -= k;
      k >>= 1;
    }
    j += k;
  }

  // 2. Butterfly stages
  for (let halfSize = 1; halfSize < n; halfSize <<= 1) {
    const step = halfSize << 1;
    const angle = -Math.PI / halfSize;
    const wStepR = Math.cos(angle);
    const wStepI = Math.sin(angle);

    for (let group = 0; group < n; group += step) {
      let wR = 1.0;
      let wI = 0.0;

      for (let k = 0; k < halfSize; ++k) {
        const pos1 = group + k;
        const pos2 = pos1 + halfSize;

        const vR = re[pos2] * wR - im[pos2] * wI;
        const vI = re[pos2] * wI + im[pos2] * wR;

        re[pos2] = re[pos1] - vR;
        im[pos2] = im[pos1] - vI;
        re[pos1] = re[pos1] + vR;
        im[pos1] = im[pos1] + vI;

        const nextWR = wR * wStepR - wI * wStepI;
        wI = wR * wStepI + wI * wStepR;
        wR = nextWR;
      }
    }
  }
}

/**
 * Circular DC-centered FFT shift swapping quadrants [0, N/2 - 1] and [N/2, N - 1].
 */
export function fftShift(buffer: Float32Array): Float32Array {
  const n = buffer.length;
  const half = n >> 1;
  const shifted = new Float32Array(n);

  for (let i = 0; i < half; ++i) {
    shifted[i] = buffer[half + i];
    shifted[half + i] = buffer[i];
  }

  return shifted;
}

/**
 * Exponential Moving Average (EMA) Spectrum Smoother and Peak-Hold Tracker.
 */
export class ExponentialSpectrumAverager {
  private smoothed: Float32Array | null = null;
  private peakHold: Float32Array | null = null;

  constructor(private alpha: number = 0.25) {
    if (alpha <= 0.0 || alpha > 1.0) {
      this.alpha = 0.25;
    }
  }

  public setAlpha(alpha: number): void {
    if (alpha > 0.0 && alpha <= 1.0) {
      this.alpha = alpha;
    }
  }

  public update(currentPsd: Float32Array): { smoothed: Float32Array; peakHold: Float32Array } {
    const n = currentPsd.length;
    if (!this.smoothed || this.smoothed.length !== n) {
      this.smoothed = new Float32Array(currentPsd);
      this.peakHold = new Float32Array(currentPsd);
      return {
        smoothed: new Float32Array(this.smoothed),
        peakHold: new Float32Array(this.peakHold)
      };
    }

    const oneMinusAlpha = 1.0 - this.alpha;
    const peak = this.peakHold!;

    for (let i = 0; i < n; ++i) {
      const val = currentPsd[i];
      this.smoothed[i] = this.alpha * val + oneMinusAlpha * this.smoothed[i];
      if (val > peak[i]) {
        peak[i] = val;
      }
    }

    return {
      smoothed: new Float32Array(this.smoothed),
      peakHold: new Float32Array(peak)
    };
  }

  public reset(): void {
    this.smoothed = null;
    this.peakHold = null;
  }
}

/**
 * Calculate median noise floor, peak carrier offset, SNR, and SFDR.
 */
export function extractSpectrumMetrics(
  psd: Float32Array,
  frequenciesHz: Float32Array
): SpectrumMetrics {
  const n = psd.length;
  if (n === 0) {
    return {
      peakPowerDbfs: -100,
      peakFrequencyHz: 0,
      noiseFloorDbfs: -100,
      snrDb: 0,
      sfdrDbc: 0,
      totalEnergy: 0
    };
  }

  let peakPower = -Infinity;
  let peakIdx = 0;
  let totalEnergy = 0.0;

  for (let i = 0; i < n; ++i) {
    const p = psd[i];
    totalEnergy += Math.pow(10.0, p / 10.0);
    if (p > peakPower) {
      peakPower = p;
      peakIdx = i;
    }
  }

  // Median noise floor
  const sorted = new Float32Array(psd).sort();
  const noiseFloor = sorted[Math.floor(n / 2)];

  // Spurious-Free Dynamic Range (SFDR): Find highest peak outside carrier mainlobe (+/- 4 bins)
  const exclusionBins = 4;
  let spurPower = -Infinity;

  for (let i = 0; i < n; ++i) {
    if (Math.abs(i - peakIdx) > exclusionBins) {
      if (psd[i] > spurPower) {
        spurPower = psd[i];
      }
    }
  }

  const sfdrDbc = (spurPower > -Infinity) ? (peakPower - spurPower) : (peakPower - noiseFloor);
  const snrDb = Math.max(0.0, peakPower - noiseFloor);

  return {
    peakPowerDbfs: Math.round(peakPower * 100) / 100,
    peakFrequencyHz: Math.round((frequenciesHz[peakIdx] || 0) * 100) / 100,
    noiseFloorDbfs: Math.round(noiseFloor * 100) / 100,
    snrDb: Math.round(snrDb * 100) / 100,
    sfdrDbc: Math.round(sfdrDbc * 100) / 100,
    totalEnergy
  };
}

/**
 * End-to-end Spectral Processor: Windowing -> FFT -> Shift -> PSD -> Smoothing -> Metrics.
 */
export class SpectrumProcessor {
  private averager: ExponentialSpectrumAverager;
  private windowCache: { [key: string]: { window: Float32Array; coherentGain: number } } = {};

  constructor(private config: FFTConfig) {
    this.averager = new ExponentialSpectrumAverager(config.emaAlpha);
  }

  public updateConfig(newConfig: Partial<FFTConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.emaAlpha !== undefined) {
      this.averager.setAlpha(newConfig.emaAlpha);
    }
  }

  public processIQ(samples: IQSample[]): SpectrumResult {
    const n = this.config.fftSize;
    if (!isPowerOfTwo(n)) {
      throw new Error(`FFT size must be a power of two: ${n}`);
    }

    const re = new Float32Array(n);
    const im = new Float32Array(n);

    // Retrieve or generate window
    const winKey = `${this.config.window}_${n}`;
    if (!this.windowCache[winKey]) {
      this.windowCache[winKey] = generateWindow(this.config.window, n);
    }
    const { window, coherentGain } = this.windowCache[winKey];

    const copyLen = Math.min(samples.length, n);
    for (let i = 0; i < copyLen; ++i) {
      const w = window[i];
      re[i] = samples[i].i * w;
      im[i] = samples[i].q * w;
    }

    // Radix-2 Complex FFT
    complexFftRadix2(re, im);

    // Compute raw PSD: |X[k]|^2 / (N^2 * G_coh^2)
    const gainFactor = this.config.applyCoherentGainCorrection ? (n * coherentGain) : n;
    const normFactor = gainFactor * gainFactor;
    const rawPsd = new Float32Array(n);

    for (let i = 0; i < n; ++i) {
      const magSq = (re[i] * re[i] + im[i] * im[i]) / normFactor;
      rawPsd[i] = 10.0 * Math.log10(magSq + 1e-15);
    }

    // DC-centered FFT shift
    const psdDbfs = this.config.fftShiftDcCentered ? fftShift(rawPsd) : rawPsd;

    // Generate frequency axis centered around 0 Hz (DC)
    const frequenciesHz = new Float32Array(n);
    const fs = this.config.sampleRateHz;
    const df = fs / n;

    if (this.config.fftShiftDcCentered) {
      const halfN = n >> 1;
      for (let i = 0; i < n; ++i) {
        frequenciesHz[i] = (i - halfN) * df;
      }
    } else {
      for (let i = 0; i < n; ++i) {
        frequenciesHz[i] = i * df;
      }
    }

    // Temporal smoothing
    const { smoothed: averagedPsdDbfs, peakHold: peakHoldPsdDbfs } = this.averager.update(psdDbfs);

    // Metrics extraction
    const metrics = extractSpectrumMetrics(psdDbfs, frequenciesHz);

    return {
      frequenciesHz,
      psdDbfs,
      averagedPsdDbfs,
      peakHoldPsdDbfs,
      metrics
    };
  }

  public reset(): void {
    this.averager.reset();
  }
}
