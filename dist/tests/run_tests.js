"use strict";
// ==============================================================================
// Product:       Logihertz SDR Spectrum & Waterfall Engine (lh-sdr-spectrum-waterfall)
// Module:        tests/run_tests.ts
// Role:          Zero-Dependency TypeScript Comprehensive Unit & Regression Test Suite
// Organization:  Logihertz Systems (OPC) Private Limited
// Developer:     Sameer Tawade (Creator, Founder, Director & Sole Developer)
// Contact:       ops@logihertz.com / security@logihertz.com
// License:       Apache-2.0
// ==============================================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process = __importStar(require("child_process"));
const index_1 = require("../src/index");
let gPassed = 0;
let gFailed = 0;
function assert(cond, msg) {
    if (cond) {
        gPassed++;
    }
    else {
        gFailed++;
        console.error(`  [ASSERTION FAILED] ${msg}`);
    }
}
function assertNear(actual, expected, eps, msg) {
    const diff = Math.abs(actual - expected);
    if (diff <= eps) {
        gPassed++;
    }
    else {
        gFailed++;
        console.error(`  [ASSERTION FAILED] ${msg} (actual=${actual}, expected=${expected}, eps=${eps}, diff=${diff})`);
    }
}
// -----------------------------------------------------------------------------
// Test Suite 1: Window Functions & Coherent Gain
// -----------------------------------------------------------------------------
function testWindowFunctions() {
    console.log('[RUNNING] Test Suite 1: Window Functions & Coherent Gain Compensation...');
    const n = 1024;
    // 1. Rectangular window
    const rect = (0, index_1.generateWindow)('rectangular', n);
    assert(rect.window.length === n, 'Rectangular window length matches n');
    assertNear(rect.coherentGain, 1.0, 1e-6, 'Rectangular coherent gain == 1.0');
    assert(rect.window[0] === 1.0 && rect.window[n - 1] === 1.0, 'Rectangular window values are 1.0');
    // 2. Hann window: G_coh ~ 0.5, symmetric, ends at 0
    const hann = (0, index_1.generateWindow)('hann', n);
    assert(hann.window.length === n, 'Hann window length matches n');
    assertNear(hann.coherentGain, 0.5, 0.01, 'Hann window coherent gain ~ 0.5');
    assertNear(hann.window[0], 0.0, 1e-4, 'Hann window starts near 0.0');
    assertNear(hann.window[n - 1], 0.0, 1e-4, 'Hann window ends near 0.0');
    assertNear(hann.window[n >> 1], 1.0, 0.01, 'Hann window center near 1.0');
    // 3. Hamming window: G_coh ~ 0.54
    const hamm = (0, index_1.generateWindow)('hamming', n);
    assert(hamm.window.length === n, 'Hamming window length matches n');
    assertNear(hamm.coherentGain, 0.54, 0.01, 'Hamming window coherent gain ~ 0.54');
    assertNear(hamm.window[0], 0.08, 1e-3, 'Hamming starts at 0.08');
    // 4. Blackman-Harris 4-term: G_coh ~ 0.35875
    const bh = (0, index_1.generateWindow)('blackman-harris', n);
    assert(bh.window.length === n, 'Blackman-Harris window length matches n');
    assertNear(bh.coherentGain, 0.35875, 0.01, 'Blackman-Harris coherent gain ~ 0.35875');
    assertNear(bh.window[0], 0.0, 1e-3, 'Blackman-Harris starts near 0.0');
    assertNear(bh.window[n >> 1], 1.0, 0.01, 'Blackman-Harris center near 1.0');
    // Symmetry test for Blackman-Harris
    for (let i = 0; i < n >> 1; ++i) {
        assertNear(bh.window[i], bh.window[n - 1 - i], 1e-5, `Window symmetry at index ${i}`);
    }
    // 5. Flat-Top window: G_coh ~ 0.21558
    const ft = (0, index_1.generateWindow)('flattop', n);
    assert(ft.window.length === n, 'Flat-Top window length matches n');
    assertNear(ft.coherentGain, 0.21558, 0.02, 'Flat-Top coherent gain ~ 0.21558');
    // Negative test
    let caught = false;
    try {
        (0, index_1.generateWindow)('hann', -10);
    }
    catch {
        caught = true;
    }
    assert(caught, 'Negative window length throws error');
}
// -----------------------------------------------------------------------------
// Test Suite 2: Radix-2 Cooley-Tukey Complex FFT & FFT-Shift
// -----------------------------------------------------------------------------
function testComplexFFT() {
    console.log('[RUNNING] Test Suite 2: In-Place Radix-2 Complex FFT & Parseval Energy...');
    // Power of two checks
    assert((0, index_1.isPowerOfTwo)(256), '256 is power of two');
    assert((0, index_1.isPowerOfTwo)(1024), '1024 is power of two');
    assert((0, index_1.isPowerOfTwo)(4096), '4096 is power of two');
    assert(!(0, index_1.isPowerOfTwo)(500), '500 is not power of two');
    assert(!(0, index_1.isPowerOfTwo)(0), '0 is not power of two');
    assert(!(0, index_1.isPowerOfTwo)(-1024), '-1024 is not power of two');
    // Non-power of two throws error
    let caught = false;
    try {
        const r = new Float32Array(500);
        const i = new Float32Array(500);
        (0, index_1.complexFftRadix2)(r, i);
    }
    catch {
        caught = true;
    }
    assert(caught, 'Non-power-of-two buffer throws error in complexFftRadix2');
    // Parseval's energy conservation test:
    // sum(|z[n]|^2) * N == sum(|X[k]|^2)
    const n = 512;
    const re = new Float32Array(n);
    const im = new Float32Array(n);
    let timeEnergy = 0.0;
    for (let i = 0; i < n; ++i) {
        re[i] = Math.cos((2.0 * Math.PI * 16.0 * i) / n);
        im[i] = Math.sin((2.0 * Math.PI * 16.0 * i) / n);
        timeEnergy += re[i] * re[i] + im[i] * im[i];
    }
    (0, index_1.complexFftRadix2)(re, im);
    let freqEnergy = 0.0;
    for (let i = 0; i < n; ++i) {
        freqEnergy += re[i] * re[i] + im[i] * im[i];
    }
    freqEnergy /= n;
    assertNear(freqEnergy, timeEnergy, 1e-2, "Parseval's theorem energy conservation");
    // Single-tone peak localization: tone at bin 16
    let maxBin = 0;
    let maxMag = 0;
    for (let i = 0; i < n; ++i) {
        const mag = re[i] * re[i] + im[i] * im[i];
        if (mag > maxMag) {
            maxMag = mag;
            maxBin = i;
        }
    }
    assert(maxBin === 16, 'Pure complex exponential at bin 16 localizes to bin 16');
    // FFT shift test: quadrant swap
    const testArr = new Float32Array([1, 2, 3, 4, 10, 20, 30, 40]);
    const shifted = (0, index_1.fftShift)(testArr);
    assert(shifted[0] === 10 && shifted[1] === 20 && shifted[2] === 30 && shifted[3] === 40, 'Lower half swapped');
    assert(shifted[4] === 1 && shifted[5] === 2 && shifted[6] === 3 && shifted[7] === 4, 'Upper half swapped');
}
// -----------------------------------------------------------------------------
// Test Suite 3: End-to-End Spectrum Processing & PSD Metrics
// -----------------------------------------------------------------------------
function testSpectrumProcessing() {
    console.log('[RUNNING] Test Suite 3: Spectrum Processor, PSD (dBFS), SFDR & EMA Smoothing...');
    const n = 1024;
    const fs = 2400000;
    const toneOffset = 300000; // Bin: 300000 / (2400000 / 1024) = 128
    const amp = 0.7071; // Expected peak power: 20*log10(0.7071) = -3.01 dBFS
    const samples = [];
    for (let i = 0; i < n; ++i) {
        const phase = (2.0 * Math.PI * toneOffset * i) / fs;
        samples.push({
            i: amp * Math.cos(phase),
            q: amp * Math.sin(phase)
        });
    }
    const proc = new index_1.SpectrumProcessor({
        fftSize: n,
        sampleRateHz: fs,
        window: 'blackman-harris',
        applyCoherentGainCorrection: true,
        fftShiftDcCentered: true,
        minDbfs: -120,
        maxDbfs: 0,
        emaAlpha: 0.25
    });
    const res1 = proc.processIQ(samples);
    assert(res1.frequenciesHz.length === n, 'Frequency axis length matches N');
    assert(res1.psdDbfs.length === n, 'PSD array length matches N');
    assert(res1.averagedPsdDbfs.length === n, 'Averaged PSD array length matches N');
    assert(res1.peakHoldPsdDbfs.length === n, 'Peak hold PSD array length matches N');
    // DC center is bin 512, Tone at +128 bins -> bin 640
    assertNear(res1.metrics.peakPowerDbfs, -3.01, 0.15, 'Peak carrier amplitude accurate to within 0.15 dBFS');
    assertNear(res1.metrics.peakFrequencyHz, 300000, 100, 'Peak carrier frequency offset resolves to +300000 Hz');
    assert(res1.metrics.snrDb > 80, 'Peak SNR > 80 dB with 4-term Blackman-Harris window');
    assert(res1.metrics.sfdrDbc > 80, 'Spurious-Free Dynamic Range > 80 dBc');
    // Verify Blackman-Harris sidelobe suppression vs Rectangular
    const rectProc = new index_1.SpectrumProcessor({
        fftSize: n,
        sampleRateHz: fs,
        window: 'rectangular',
        applyCoherentGainCorrection: true,
        fftShiftDcCentered: true,
        minDbfs: -120,
        maxDbfs: 0,
        emaAlpha: 0.25
    });
    const rectRes = rectProc.processIQ(samples);
    assert(res1.metrics.snrDb > rectRes.metrics.snrDb - 10, 'Spectral dynamic range verified');
    // EMA Averaging test across consecutive frames
    const res2 = proc.processIQ(samples);
    assert(res2.averagedPsdDbfs.length === n, 'Averaged PSD preserved across frames');
    proc.reset();
}
// -----------------------------------------------------------------------------
// Test Suite 4: Scientific Colormaps & Normalization LUTs
// -----------------------------------------------------------------------------
function testColormaps() {
    console.log('[RUNNING] Test Suite 4: Scientific 256-Entry RGBA8 Colormaps...');
    const maps = ['turbo', 'viridis', 'inferno', 'radar-green'];
    for (const mapName of maps) {
        const lut = (0, index_1.generateColormapLut)(mapName);
        assert(lut.length === 1024, `Colormap "${mapName}" produces 1024 bytes (256 RGBA8)`);
        // Alpha channel must be 255 for all 256 entries
        let allOpaque = true;
        for (let i = 0; i < 256; ++i) {
            if (lut[i * 4 + 3] !== 255) {
                allOpaque = false;
                break;
            }
        }
        assert(allOpaque, `Colormap "${mapName}" has 100% alpha opacity`);
        // Map min, mid, and max power
        const minColor = (0, index_1.mapPowerToRgba)(-120, -120, 0, lut);
        const midColor = (0, index_1.mapPowerToRgba)(-60, -120, 0, lut);
        const maxColor = (0, index_1.mapPowerToRgba)(0, -120, 0, lut);
        assert(minColor[3] === 255 && midColor[3] === 255 && maxColor[3] === 255, 'RGBA alpha is 255');
        assert(minColor[0] === lut[0] && minColor[1] === lut[1] && minColor[2] === lut[2], 'Min power maps to LUT index 0');
        assert(maxColor[0] === lut[1020] && maxColor[1] === lut[1021] && maxColor[2] === lut[1022], 'Max power maps to LUT index 255');
        // Clamping tests below min and above max
        const underColor = (0, index_1.mapPowerToRgba)(-150, -120, 0, lut);
        const overColor = (0, index_1.mapPowerToRgba)(50, -120, 0, lut);
        assert(underColor[0] === minColor[0], 'Underflow clamps to index 0');
        assert(overColor[0] === maxColor[0], 'Overflow clamps to index 255');
    }
    // Row conversion test
    const lut = (0, index_1.generateColormapLut)('turbo');
    const dummyPsd = new Float32Array([-120, -60, 0]);
    const rowRgba = (0, index_1.psdRowToRgba)(dummyPsd, -120, 0, lut);
    assert(rowRgba.length === 12, 'psdRowToRgba produces 3 * 4 = 12 bytes');
}
// -----------------------------------------------------------------------------
// Test Suite 5: WebGL2 & WebGPU Shader Generators
// -----------------------------------------------------------------------------
function testShaders() {
    console.log('[RUNNING] Test Suite 5: 60fps WebGL2 & WebGPU Circular Ring-Buffer Shaders...');
    // WebGL2 Shaders
    const gl2 = (0, index_1.generateWebGL2Shaders)();
    assert(gl2.vertex.includes('#version 300 es'), 'WebGL2 vertex shader has version 300 es');
    assert(gl2.fragment.includes('#version 300 es'), 'WebGL2 fragment shader has version 300 es');
    assert(gl2.fragment.includes('u_ring_offset'), 'WebGL2 fragment shader contains u_ring_offset uniform');
    assert(gl2.fragment.includes('fract(v_texcoord.y + u_ring_offset)'), 'WebGL2 fragment contains circular ring wrapping math');
    assert(gl2.fragment.includes('u_lut_tex'), 'WebGL2 fragment contains colormap LUT sampler');
    // WebGPU Shaders
    const wgsl = (0, index_1.generateWebGPUShaders)();
    assert(wgsl.includes('@vertex'), 'WebGPU WGSL contains @vertex entrypoint');
    assert(wgsl.includes('@fragment'), 'WebGPU WGSL contains @fragment entrypoint');
    assert(wgsl.includes('@group(0) @binding(0)'), 'WebGPU WGSL contains uniform buffer binding');
    assert(wgsl.includes('fract(input.texCoord.y + uniforms.ringOffset)'), 'WebGPU WGSL contains circular UV wrapping');
    // Standalone Dashboard HTML
    const html = (0, index_1.generateStandaloneDashboardHtml)({
        fft_size: 2048,
        sample_rate_hz: 2000000,
        colormap: 'inferno'
    });
    assert(html.includes('<!DOCTYPE html>'), 'Dashboard is HTML5');
    assert(html.includes('Content-Security-Policy'), 'Dashboard contains strict CSP meta tag');
    assert(html.includes('spectrum-canvas'), 'Dashboard contains spectrum canvas');
    assert(html.includes('waterfall-canvas'), 'Dashboard contains waterfall canvas');
    assert(html.includes('requestAnimationFrame'), 'Dashboard implements 60fps render loop');
}
// -----------------------------------------------------------------------------
// Test Suite 6: 10-Rule Auditor & Posture Scoring
// -----------------------------------------------------------------------------
function testAuditor() {
    console.log('[RUNNING] Test Suite 6: 10-Rule Deterministic SDR Posture Auditor...');
    assert(index_1.NORMATIVE_RULES.length === 10, 'Rule registry contains exactly 10 rules');
    // 1. Hardened config test
    const hardenedRaw = fs.readFileSync('fixtures/hardened_waterfall_config.json', 'utf-8');
    const hardenedConfig = JSON.parse(hardenedRaw);
    const reportH = (0, index_1.auditWaterfallConfig)(hardenedConfig, 'fixtures/hardened_waterfall_config.json');
    assert(reportH.score === 100, 'Hardened config receives Posture Score 100/100');
    assert(reportH.status === 'PASSED', 'Hardened config status is PASSED');
    assert(reportH.findings.length === 0, 'Hardened config has 0 findings');
    assert(reportH.passedRules === 10, 'All 10 rules passed');
    // 2. Vulnerable config test
    const vulnRaw = fs.readFileSync('fixtures/vulnerable_waterfall_config.json', 'utf-8');
    const vulnConfig = JSON.parse(vulnRaw);
    const reportV = (0, index_1.auditWaterfallConfig)(vulnConfig, 'fixtures/vulnerable_waterfall_config.json');
    assert(reportV.score === 0, 'Vulnerable config receives Posture Score 0/100');
    assert(reportV.status === 'FAILED', 'Vulnerable config status is FAILED');
    assert(reportV.findings.length === 10, 'Vulnerable config triggers all 10 rules');
    assert(reportV.criticalCount === 3, '3 Critical findings (LH-SPEC-001..003)');
    assert(reportV.highCount === 4, '4 High findings (LH-SPEC-004..007)');
    assert(reportV.mediumCount === 2, '2 Medium findings (LH-SPEC-008..009)');
    assert(reportV.lowCount === 1, '1 Low finding (LH-SPEC-010)');
    // 3. Isolated Single Rule Tests
    // LH-SPEC-001
    const r1 = (0, index_1.auditWaterfallConfig)({ ...hardenedConfig, websocket_tls_enabled: false });
    assert(r1.findings.length === 1 && r1.findings[0].ruleId === 'LH-SPEC-001', 'LH-SPEC-001 isolated');
    assert(r1.score === 75, 'Rule 1 deduction: 100 - 25 = 75');
    // LH-SPEC-002
    const r2 = (0, index_1.auditWaterfallConfig)({ ...hardenedConfig, fft_size: 500 });
    assert(r2.findings.length === 1 && r2.findings[0].ruleId === 'LH-SPEC-002', 'LH-SPEC-002 isolated');
    // LH-SPEC-003
    const r3 = (0, index_1.auditWaterfallConfig)({ ...hardenedConfig, max_waterfall_history_rows: 4096 });
    assert(r3.findings.length === 1 && r3.findings[0].ruleId === 'LH-SPEC-003', 'LH-SPEC-003 isolated');
    // LH-SPEC-004
    const r4 = (0, index_1.auditWaterfallConfig)({ ...hardenedConfig, window_function: 'rectangular' });
    assert(r4.findings.length === 1 && r4.findings[0].ruleId === 'LH-SPEC-004', 'LH-SPEC-004 isolated');
    assert(r4.score === 90, 'Rule 4 deduction: 100 - 10 = 90');
    // LH-SPEC-005
    const r5 = (0, index_1.auditWaterfallConfig)({ ...hardenedConfig, target_fps: 120 });
    assert(r5.findings.length === 1 && r5.findings[0].ruleId === 'LH-SPEC-005', 'LH-SPEC-005 isolated');
    // LH-SPEC-006
    const r6 = (0, index_1.auditWaterfallConfig)({ ...hardenedConfig, max_dbfs: 5.0 });
    assert(r6.findings.length === 1 && r6.findings[0].ruleId === 'LH-SPEC-006', 'LH-SPEC-006 isolated');
    // LH-SPEC-007
    const r7 = (0, index_1.auditWaterfallConfig)({ ...hardenedConfig, expose_receiver_gps_coords: true });
    assert(r7.findings.length === 1 && r7.findings[0].ruleId === 'LH-SPEC-007', 'LH-SPEC-007 isolated');
    // LH-SPEC-008
    const r8 = (0, index_1.auditWaterfallConfig)({ ...hardenedConfig, fft_shift_dc_centered: false });
    assert(r8.findings.length === 1 && r8.findings[0].ruleId === 'LH-SPEC-008', 'LH-SPEC-008 isolated');
    assert(r8.score === 96, 'Rule 8 deduction: 100 - 4 = 96');
    // LH-SPEC-009
    const r9 = (0, index_1.auditWaterfallConfig)({ ...hardenedConfig, strict_csp_enabled: false });
    assert(r9.findings.length === 1 && r9.findings[0].ruleId === 'LH-SPEC-009', 'LH-SPEC-009 isolated');
    // LH-SPEC-010
    const r10 = (0, index_1.auditWaterfallConfig)({ ...hardenedConfig, ema_alpha: 0.0 });
    assert(r10.findings.length === 1 && r10.findings[0].ruleId === 'LH-SPEC-010', 'LH-SPEC-010 isolated');
    assert(r10.score === 99, 'Rule 10 deduction: 100 - 1 = 99');
    // Partial combined score test: 1 CRITICAL + 1 HIGH = 100 - 35 = 65
    const rComb = (0, index_1.auditWaterfallConfig)({
        ...hardenedConfig,
        websocket_tls_enabled: false,
        window_function: 'rectangular'
    });
    assert(rComb.score === 65, 'Combined score: 100 - (25 + 10) = 65');
}
// -----------------------------------------------------------------------------
// Test Suite 7: Table, JSON, and SARIF Exporters
// -----------------------------------------------------------------------------
function testExporters() {
    console.log('[RUNNING] Test Suite 7: Exporters (ANSI Table, JSON, OASIS SARIF v2.1.0)...');
    const vulnRaw = fs.readFileSync('fixtures/vulnerable_waterfall_config.json', 'utf-8');
    const vulnConfig = JSON.parse(vulnRaw);
    const report = (0, index_1.auditWaterfallConfig)(vulnConfig, 'fixtures/vulnerable_waterfall_config.json');
    // Table
    const table = (0, index_1.formatTable)(report);
    assert(table.includes('Logihertz SDR Telemetry & Waterfall Posture Auditor'), 'Table contains header banner');
    assert(table.includes('0/100'), 'Table displays score 0/100');
    assert(table.includes('LH-SPEC-001'), 'Table contains Rule 1');
    assert(table.includes('CWE-319'), 'Table contains CWE-319');
    // JSON
    const jsonStr = (0, index_1.formatJson)(report);
    const jsonObj = JSON.parse(jsonStr);
    assert(jsonObj.score === 0, 'JSON report score is 0');
    assert(jsonObj.status === 'FAILED', 'JSON report status is FAILED');
    assert(jsonObj.findings.length === 10, 'JSON report has 10 findings');
    // SARIF
    const sarifStr = (0, index_1.formatSarif)(report);
    const sarifObj = JSON.parse(sarifStr);
    assert(sarifObj.version === '2.1.0', 'SARIF version is 2.1.0');
    assert(sarifObj.runs[0].tool.driver.name === 'lh-waterfall', 'Driver name is lh-waterfall');
    assert(sarifObj.runs[0].tool.driver.rules.length === 10, 'SARIF contains 10 rules definitions');
    assert(sarifObj.runs[0].results.length === 10, 'SARIF contains 10 results');
}
// -----------------------------------------------------------------------------
// Test Suite 8: CLI Subprocess Smoke Tests & Exit Codes
// -----------------------------------------------------------------------------
function testCliSubprocess() {
    console.log('[RUNNING] Test Suite 8: CLI Subprocess Invocations & Deterministic Exit Codes...');
    const binPath = path.resolve('bin/lh-waterfall');
    // 1. --version (Exit 0)
    const resV = child_process.spawnSync(process.execPath, [binPath, '--version'], { encoding: 'utf-8' });
    assert(resV.status === 0, 'CLI --version exits with 0');
    assert(resV.stdout.includes('lh-waterfall v0.1.0'), 'CLI --version output contains version string');
    // 2. --help (Exit 0)
    const resH = child_process.spawnSync(process.execPath, [binPath, '--help'], { encoding: 'utf-8' });
    assert(resH.status === 0, 'CLI --help exits with 0');
    assert(resH.stdout.includes('Usage: lh-waterfall'), 'CLI --help output contains usage');
    // 3. scan hardened fixture (Exit 0)
    const resSh = child_process.spawnSync(process.execPath, [binPath, 'scan', 'fixtures/hardened_waterfall_config.json'], { encoding: 'utf-8' });
    assert(resSh.status === 0, 'CLI scan hardened fixture exits with 0');
    assert(resSh.stdout.includes('100/100'), 'CLI scan hardened fixture outputs 100/100');
    // 4. scan vulnerable fixture (Exit 1)
    const resSv = child_process.spawnSync(process.execPath, [binPath, 'scan', 'fixtures/vulnerable_waterfall_config.json'], { encoding: 'utf-8' });
    assert(resSv.status === 1, 'CLI scan vulnerable fixture exits with 1');
    assert(resSv.stdout.includes('0/100'), 'CLI scan vulnerable fixture outputs 0/100');
    // 5. analyze-iq (Exit 0)
    const resIq = child_process.spawnSync(process.execPath, [binPath, 'analyze-iq', 'fixtures/sample_iq_frame.json', '--fft-size', '1024'], { encoding: 'utf-8' });
    assert(resIq.status === 0, 'CLI analyze-iq exits with 0');
    assert(resIq.stdout.includes('Peak Carrier Freq: +300000.0 Hz'), 'CLI analyze-iq detects carrier frequency');
    // 6. gen-shaders (Exit 0)
    const resShader = child_process.spawnSync(process.execPath, [binPath, 'gen-shaders', '--backend', 'webgl2'], { encoding: 'utf-8' });
    assert(resShader.status === 0, 'CLI gen-shaders exits with 0');
    assert(resShader.stdout.includes('#version 300 es'), 'CLI gen-shaders outputs GLSL ES 3.0');
    // 7. gen-dashboard (Exit 0)
    const tmpDashboard = '/tmp/test_dashboard_gen.html';
    const resDash = child_process.spawnSync(process.execPath, [binPath, 'gen-dashboard', '--output', tmpDashboard], { encoding: 'utf-8' });
    assert(resDash.status === 0, 'CLI gen-dashboard exits with 0');
    assert(fs.existsSync(tmpDashboard), 'Dashboard file created');
    if (fs.existsSync(tmpDashboard))
        fs.unlinkSync(tmpDashboard);
    // 8. Invalid command (Exit 2)
    const resInv = child_process.spawnSync(process.execPath, [binPath, 'unknown-subcommand'], { encoding: 'utf-8' });
    assert(resInv.status === 2, 'CLI unknown command exits with 2');
    // 9. Missing file (Exit 2)
    const resMis = child_process.spawnSync(process.execPath, [binPath, 'scan', 'nonexistent.json'], { encoding: 'utf-8' });
    assert(resMis.status === 2, 'CLI scan nonexistent file exits with 2');
}
// -----------------------------------------------------------------------------
// Main Test Runner
// -----------------------------------------------------------------------------
function main() {
    console.log('==============================================================================');
    console.log('  Logihertz SDR Spectrum & Waterfall Engine Test Suite (lh-sdr-spectrum-waterfall)');
    console.log('==============================================================================');
    testWindowFunctions();
    testComplexFFT();
    testSpectrumProcessing();
    testColormaps();
    testShaders();
    testAuditor();
    testExporters();
    testCliSubprocess();
    console.log('==============================================================================');
    console.log(`  Summary: ${gPassed} passed, ${gFailed} failed.`);
    console.log('==============================================================================');
    if (gFailed > 0) {
        console.error(`TEST SUITE FAILED with ${gFailed} failure(s)!`);
        process.exit(1);
    }
    console.log('ALL TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
}
main();
