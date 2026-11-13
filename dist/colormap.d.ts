import { ColormapName } from './types';
/**
 * Generate 256-entry RGBA8 Lookup Table (1024 bytes) for scientific visualization.
 */
export declare function generateColormapLut(name: ColormapName): Uint8Array;
/**
 * Map a single power value (dBFS) to RGBA color components via normalized LUT.
 */
export declare function mapPowerToRgba(powerDbfs: number, minDbfs: number, maxDbfs: number, lut: Uint8Array): [number, number, number, number];
/**
 * Convert an entire PSD row (dBFS) into an RGBA8 Uint8Array row for GPU texture uploading.
 */
export declare function psdRowToRgba(psd: Float32Array, minDbfs: number, maxDbfs: number, lut: Uint8Array): Uint8Array;
