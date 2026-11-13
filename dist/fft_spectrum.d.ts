import { IQSample, WindowFunction, FFTConfig, SpectrumMetrics, SpectrumResult } from './types';
/**
 * Generate window function coefficients and compute its coherent gain G_coh.
 */
export declare function generateWindow(name: WindowFunction, n: number): {
    window: Float32Array;
    coherentGain: number;
};
/**
 * Validate that an integer is a positive power of two (2^m).
 */
export declare function isPowerOfTwo(n: number): boolean;
/**
 * In-place Radix-2 Decimation-In-Time Cooley-Tukey Complex FFT.
 * Operates on separate real and imaginary Float32Array buffers.
 */
export declare function complexFftRadix2(re: Float32Array, im: Float32Array): void;
/**
 * Circular DC-centered FFT shift swapping quadrants [0, N/2 - 1] and [N/2, N - 1].
 */
export declare function fftShift(buffer: Float32Array): Float32Array;
/**
 * Exponential Moving Average (EMA) Spectrum Smoother and Peak-Hold Tracker.
 */
export declare class ExponentialSpectrumAverager {
    private alpha;
    private smoothed;
    private peakHold;
    constructor(alpha?: number);
    setAlpha(alpha: number): void;
    update(currentPsd: Float32Array): {
        smoothed: Float32Array;
        peakHold: Float32Array;
    };
    reset(): void;
}
/**
 * Calculate median noise floor, peak carrier offset, SNR, and SFDR.
 */
export declare function extractSpectrumMetrics(psd: Float32Array, frequenciesHz: Float32Array): SpectrumMetrics;
/**
 * End-to-end Spectral Processor: Windowing -> FFT -> Shift -> PSD -> Smoothing -> Metrics.
 */
export declare class SpectrumProcessor {
    private config;
    private averager;
    private windowCache;
    constructor(config: FFTConfig);
    updateConfig(newConfig: Partial<FFTConfig>): void;
    processIQ(samples: IQSample[]): SpectrumResult;
    reset(): void;
}
