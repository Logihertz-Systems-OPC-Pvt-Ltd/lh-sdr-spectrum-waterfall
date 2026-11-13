// ==============================================================================
// Product:       Logihertz SDR Spectrum & Waterfall Engine (lh-sdr-spectrum-waterfall)
// Module:        src/colormap.ts
// Role:          Scientific 256-Entry RGBA8 Colormaps & Normalization LUT Generator
// Organization:  Logihertz Systems (OPC) Private Limited
// Developer:     Sameer Tawade (Creator, Founder, Director & Sole Developer)
// Contact:       ops@logihertz.com / security@logihertz.com
// License:       Apache-2.0
// ==============================================================================

import { ColormapName } from './types';

/**
 * Generate 256-entry RGBA8 Lookup Table (1024 bytes) for scientific visualization.
 */
export function generateColormapLut(name: ColormapName): Uint8Array {
  const lut = new Uint8Array(256 * 4);

  for (let i = 0; i < 256; ++i) {
    const t = i / 255.0;
    let r = 0;
    let g = 0;
    let b = 0;

    switch (name) {
      case 'turbo': {
        // High-contrast, monotonic lightness Google Turbo polynomial approximation
        const rVal = 0.1357 + t * (4.61539 - t * (42.6603 - t * (132.131 - t * (152.552 - t * 59.2863))));
        const gVal = 0.0914 + t * (2.19418 + t * (4.84297 - t * (14.185 - t * (4.2773 - t * 2.82956))));
        const bVal = 0.1067 + t * (12.5833 - t * (78.0833 - t * (187.922 - t * (213.682 - t * 89.281))));

        r = Math.min(255, Math.max(0, Math.round(rVal * 255)));
        g = Math.min(255, Math.max(0, Math.round(gVal * 255)));
        b = Math.min(255, Math.max(0, Math.round(bVal * 255)));
        break;
      }

      case 'viridis': {
        // Matplotlib Viridis colormap approximation
        r = Math.min(255, Math.max(0, Math.round((0.267 + 0.704 * t * t) * 255)));
        g = Math.min(255, Math.max(0, Math.round((0.004 + 0.88 * Math.sin(t * Math.PI)) * 255)));
        b = Math.min(255, Math.max(0, Math.round((0.329 + 0.65 * (1.0 - t)) * 255)));
        break;
      }

      case 'inferno': {
        // Perceptually uniform black-red-yellow-white
        r = Math.min(255, Math.max(0, Math.round(Math.pow(t, 0.7) * 255)));
        g = Math.min(255, Math.max(0, Math.round(Math.pow(t, 2.0) * 255)));
        b = Math.min(255, Math.max(0, Math.round((0.5 * Math.sin(t * Math.PI) + 0.5 * Math.pow(t, 4.0)) * 255)));
        break;
      }

      case 'radar-green':
      default: {
        // Classic tactical SDR phosphor green gradient with peak intensity saturation
        r = Math.min(255, Math.max(0, Math.round(Math.pow(t, 3.5) * 255)));
        g = Math.min(255, Math.max(0, Math.round(Math.pow(t, 0.85) * 255)));
        b = Math.min(255, Math.max(0, Math.round(Math.pow(t, 3.0) * 180)));
        break;
      }
    }

    const offset = i * 4;
    lut[offset] = r;
    lut[offset + 1] = g;
    lut[offset + 2] = b;
    lut[offset + 3] = 255; // Full opacity
  }

  return lut;
}

/**
 * Map a single power value (dBFS) to RGBA color components via normalized LUT.
 */
export function mapPowerToRgba(
  powerDbfs: number,
  minDbfs: number,
  maxDbfs: number,
  lut: Uint8Array
): [number, number, number, number] {
  if (maxDbfs <= minDbfs) {
    maxDbfs = minDbfs + 30.0;
  }

  const normalized = (powerDbfs - minDbfs) / (maxDbfs - minDbfs);
  const clampedIdx = Math.min(255, Math.max(0, Math.floor(normalized * 255)));
  const offset = clampedIdx * 4;

  return [lut[offset], lut[offset + 1], lut[offset + 2], lut[offset + 3]];
}

/**
 * Convert an entire PSD row (dBFS) into an RGBA8 Uint8Array row for GPU texture uploading.
 */
export function psdRowToRgba(
  psd: Float32Array,
  minDbfs: number,
  maxDbfs: number,
  lut: Uint8Array
): Uint8Array {
  const n = psd.length;
  const out = new Uint8Array(n * 4);
  const range = (maxDbfs > minDbfs) ? (maxDbfs - minDbfs) : 30.0;

  for (let i = 0; i < n; ++i) {
    const norm = (psd[i] - minDbfs) / range;
    const idx = Math.min(255, Math.max(0, Math.floor(norm * 255))) * 4;
    const outOffset = i * 4;

    out[outOffset] = lut[idx];
    out[outOffset + 1] = lut[idx + 1];
    out[outOffset + 2] = lut[idx + 2];
    out[outOffset + 3] = lut[idx + 3];
  }

  return out;
}
