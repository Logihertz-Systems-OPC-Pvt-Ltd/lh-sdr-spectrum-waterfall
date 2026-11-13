// ==============================================================================
// Product:       Logihertz SDR Spectrum & Waterfall Engine (lh-sdr-spectrum-waterfall)
// Module:        src/cli.ts
// Role:          CLI Application Entrypoint & Subcommand Router
// Organization:  Logihertz Systems (OPC) Private Limited
// Developer:     Sameer Tawade (Creator, Founder, Director & Sole Developer)
// Contact:       ops@logihertz.com / security@logihertz.com
// License:       Apache-2.0
// ==============================================================================

import * as fs from 'fs';
import { WaterfallDashboardConfig, WindowFunction, IQSample } from './types';
import { auditWaterfallConfig } from './waterfall_auditor';
import { formatTable, formatJson, formatSarif } from './exporters';
import { SpectrumProcessor } from './fft_spectrum';
import { generateWebGL2Shaders, generateWebGPUShaders, generateStandaloneDashboardHtml } from './waterfall_shaders';

function printVersion(): void {
  console.log('lh-waterfall v0.1.0 (Logihertz Systems (OPC) Private Limited)');
  console.log('Clean-room TypeScript 60fps WebGL2/WebGPU Spectrum & Waterfall Engine');
  console.log('Author: Sameer Tawade <ops@logihertz.com>');
  console.log('License: Apache-2.0');
}

function printUsage(): void {
  console.log('Usage: lh-waterfall <command> [options]\n');
  console.log('Commands:');
  console.log('  scan <config.json>         Audit waterfall telemetry config against 10 posture rules');
  console.log('      [--format table|json|sarif] Output report format (default: table)');
  console.log('      [--output <file>]           Write output to destination file\n');
  console.log('  analyze-iq <frame.json>    Compute Radix-2 FFT, PSD, noise floor, and SFDR');
  console.log('      [--fft-size <N>]            FFT bin size (default: 1024)');
  console.log('      [--window <func>]           Window function (default: blackman-harris)');
  console.log('                                  Options: blackman-harris, hann, hamming, flattop, rectangular\n');
  console.log('  gen-shaders                Synthesize 60fps O(1) circular ring-buffer GPU shaders');
  console.log('      [--backend webgl2|webgpu]   Shader backend (default: webgl2)');
  console.log('      [--output <file>]           Save shader source to file\n');
  console.log('  gen-dashboard              Generate standalone interactive HTML5 60fps dashboard');
  console.log('      [--output <file.html>]      Destination HTML file (default: stdout)\n');
  console.log('Options:');
  console.log('  -h, --help                 Display this help message and exit');
  console.log('  -v, --version              Display version information and exit');
}

function handleScan(args: string[]): number {
  if (args.length < 1) {
    console.error('Error: "scan" requires a path to configuration JSON file.');
    return 2;
  }

  const configFile = args[0];
  let format = 'table';
  let outputPath = '';

  for (let i = 1; i < args.length; ++i) {
    if (args[i] === '--format' && i + 1 < args.length) {
      format = args[++i];
    } else if (args[i] === '--output' && i + 1 < args.length) {
      outputPath = args[++i];
    } else {
      console.error(`Error: Unknown argument for scan: ${args[i]}`);
      return 2;
    }
  }

  if (format !== 'table' && format !== 'json' && format !== 'sarif') {
    console.error(`Error: Invalid format "${format}". Supported: table, json, sarif.`);
    return 2;
  }

  if (!fs.existsSync(configFile)) {
    console.error(`Error: Configuration file not found: ${configFile}`);
    return 2;
  }

  let config: WaterfallDashboardConfig;
  try {
    const raw = fs.readFileSync(configFile, 'utf-8');
    config = JSON.parse(raw) as WaterfallDashboardConfig;
  } catch (err) {
    console.error(`Error: Failed to read or parse JSON config: ${(err as Error).message}`);
    return 2;
  }

  const report = auditWaterfallConfig(config, configFile);

  let outputStr = '';
  if (format === 'table') {
    outputStr = formatTable(report);
  } else if (format === 'json') {
    outputStr = formatJson(report);
  } else if (format === 'sarif') {
    outputStr = formatSarif(report);
  }

  if (outputPath) {
    try {
      fs.writeFileSync(outputPath, outputStr, 'utf-8');
    } catch (err) {
      console.error(`Error: Failed to write output file: ${(err as Error).message}`);
      return 2;
    }
  } else {
    process.stdout.write(outputStr);
  }

  return (report.score === 100) ? 0 : 1;
}

function handleAnalyzeIq(args: string[]): number {
  if (args.length < 1) {
    console.error('Error: "analyze-iq" requires a path to IQ frame JSON file.');
    return 2;
  }

  const iqFile = args[0];
  let fftSize = 1024;
  let windowName: WindowFunction = 'blackman-harris';

  for (let i = 1; i < args.length; ++i) {
    if (args[i] === '--fft-size' && i + 1 < args.length) {
      fftSize = parseInt(args[++i], 10);
    } else if (args[i] === '--window' && i + 1 < args.length) {
      windowName = args[++i] as WindowFunction;
    } else {
      console.error(`Error: Unknown argument for analyze-iq: ${args[i]}`);
      return 2;
    }
  }

  if (!fs.existsSync(iqFile)) {
    console.error(`Error: IQ frame file not found: ${iqFile}`);
    return 2;
  }

  let rawData: { sample_rate_hz?: number; samples?: IQSample[] };
  try {
    const content = fs.readFileSync(iqFile, 'utf-8');
    rawData = JSON.parse(content);
  } catch (err) {
    console.error(`Error: Failed to read or parse IQ file: ${(err as Error).message}`);
    return 2;
  }

  const samples = rawData.samples || [];
  const sampleRateHz = rawData.sample_rate_hz || 2400000;

  if (samples.length === 0) {
    console.error('Error: IQ frame contains 0 samples.');
    return 2;
  }

  const processor = new SpectrumProcessor({
    fftSize,
    sampleRateHz,
    window: windowName,
    applyCoherentGainCorrection: true,
    fftShiftDcCentered: true,
    minDbfs: -120,
    maxDbfs: 0,
    emaAlpha: 0.25
  });

  const result = processor.processIQ(samples);
  const m = result.metrics;

  console.log('==============================================================================');
  console.log('  Logihertz SDR IQ Frame Spectral Analysis');
  console.log('==============================================================================');
  console.log(`  Input Samples:     ${samples.length}`);
  console.log(`  Sample Rate:       ${(sampleRateHz / 1e6).toFixed(3)} MHz (${sampleRateHz} Hz)`);
  console.log(`  FFT Size:          ${fftSize} bins (${(sampleRateHz / fftSize).toFixed(1)} Hz/bin)`);
  console.log(`  Window Function:   ${windowName} (Coherent Gain Compensated)`);
  console.log('------------------------------------------------------------------------------');
  console.log(`  Peak Carrier Freq: ${m.peakFrequencyHz > 0 ? '+' : ''}${m.peakFrequencyHz.toFixed(1)} Hz (relative to center)`);
  console.log(`  Peak Power:        ${m.peakPowerDbfs.toFixed(2)} dBFS`);
  console.log(`  Noise Floor:       ${m.noiseFloorDbfs.toFixed(2)} dBFS`);
  console.log(`  Peak SNR:          ${m.snrDb.toFixed(2)} dB`);
  console.log(`  SFDR:              ${m.sfdrDbc.toFixed(2)} dBc`);
  console.log('==============================================================================');

  return 0;
}

function handleGenShaders(args: string[]): number {
  let backend = 'webgl2';
  let outputPath = '';

  for (let i = 0; i < args.length; ++i) {
    if (args[i] === '--backend' && i + 1 < args.length) {
      backend = args[++i];
    } else if (args[i] === '--output' && i + 1 < args.length) {
      outputPath = args[++i];
    } else {
      console.error(`Error: Unknown argument for gen-shaders: ${args[i]}`);
      return 2;
    }
  }

  let code = '';
  if (backend === 'webgl2') {
    const s = generateWebGL2Shaders();
    code = `// === WebGL2 Vertex Shader (GLSL ES 3.0) ===\n${s.vertex}\n// === WebGL2 Fragment Shader (GLSL ES 3.0) ===\n${s.fragment}`;
  } else if (backend === 'webgpu') {
    code = generateWebGPUShaders();
  } else {
    console.error(`Error: Invalid backend "${backend}". Supported: webgl2, webgpu.`);
    return 2;
  }

  if (outputPath) {
    try {
      fs.writeFileSync(outputPath, code, 'utf-8');
      console.log(`[SUCCESS] Shaders written to ${outputPath}`);
    } catch (err) {
      console.error(`Error: Failed to write shader file: ${(err as Error).message}`);
      return 2;
    }
  } else {
    console.log(code);
  }

  return 0;
}

function handleGenDashboard(args: string[]): number {
  let outputPath = '';

  for (let i = 0; i < args.length; ++i) {
    if (args[i] === '--output' && i + 1 < args.length) {
      outputPath = args[++i];
    } else {
      console.error(`Error: Unknown argument for gen-dashboard: ${args[i]}`);
      return 2;
    }
  }

  const html = generateStandaloneDashboardHtml();

  if (outputPath) {
    try {
      fs.writeFileSync(outputPath, html, 'utf-8');
      console.log(`[SUCCESS] Dashboard written to ${outputPath}`);
    } catch (err) {
      console.error(`Error: Failed to write dashboard file: ${(err as Error).message}`);
      return 2;
    }
  } else {
    console.log(html);
  }

  return 0;
}

export function main(): void {
  const argv = process.argv.slice(2);
  if (argv.length === 0) {
    printUsage();
    process.exit(2);
  }

  const cmd = argv[0];

  if (cmd === '-h' || cmd === '--help' || cmd === 'help') {
    printUsage();
    process.exit(0);
  }

  if (cmd === '-v' || cmd === '--version' || cmd === 'version') {
    printVersion();
    process.exit(0);
  }

  if (cmd === 'scan') {
    const code = handleScan(argv.slice(1));
    process.exit(code);
  }

  if (cmd === 'analyze-iq') {
    const code = handleAnalyzeIq(argv.slice(1));
    process.exit(code);
  }

  if (cmd === 'gen-shaders') {
    const code = handleGenShaders(argv.slice(1));
    process.exit(code);
  }

  if (cmd === 'gen-dashboard') {
    const code = handleGenDashboard(argv.slice(1));
    process.exit(code);
  }

  console.error(`Error: Unknown command "${cmd}".`);
  printUsage();
  process.exit(2);
}

if (require.main === module) {
  main();
}
