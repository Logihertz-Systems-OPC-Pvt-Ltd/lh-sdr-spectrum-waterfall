import { WaterfallDashboardConfig } from './types';
/**
 * Generate WebGL2 (GLSL ES 3.0) 60fps O(1) circular ring-buffer shaders.
 */
export declare function generateWebGL2Shaders(): {
    vertex: string;
    fragment: string;
};
/**
 * Generate WebGPU (WGSL) 60fps O(1) circular ring-buffer shaders.
 */
export declare function generateWebGPUShaders(): string;
/**
 * Generate a standalone, self-contained HTML5/Canvas WebGL2 60fps dashboard.
 */
export declare function generateStandaloneDashboardHtml(config?: WaterfallDashboardConfig): string;
