"use strict";
// ==============================================================================
// Product:       Logihertz SDR Spectrum & Waterfall Engine (lh-sdr-spectrum-waterfall)
// Module:        src/exporters.ts
// Role:          ANSI Box Table, Canonical JSON, and OASIS SARIF v2.1.0 Exporters
// Organization:  Logihertz Systems (OPC) Private Limited
// Developer:     Sameer Tawade (Creator, Founder, Director & Sole Developer)
// Contact:       ops@logihertz.com / security@logihertz.com
// License:       Apache-2.0
// ==============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatTable = formatTable;
exports.formatJson = formatJson;
exports.formatSarif = formatSarif;
const waterfall_auditor_1 = require("./waterfall_auditor");
/**
 * Format audit report into an ANSI terminal table with score banner.
 */
function formatTable(report) {
    const line = '='.repeat(80);
    const subline = '-'.repeat(80);
    const bannerStatus = report.status === 'PASSED' ? '[PASSED]' : '[FAILED]';
    let out = `\n${line}\n`;
    out += `   Logihertz SDR Telemetry & Waterfall Posture Auditor (lh-waterfall)\n`;
    out += `   Manifest:      ${report.manifestPath || '(in-memory config)'}\n`;
    out += `   Posture Score: ${report.score}/100   ${bannerStatus}\n`;
    out += `   Summary:       ${report.passedRules} passed, ${report.findings.length} violations ` +
        `(CRIT: ${report.criticalCount}, HIGH: ${report.highCount}, MED: ${report.mediumCount}, LOW: ${report.lowCount})\n`;
    out += `${line}\n\n`;
    if (report.findings.length === 0) {
        out += ` [OK] All 10 SDR telemetry & waterfall posture controls are fully satisfied.\n`;
        out += `      Dashboard configuration satisfies production sovereign edge standards.\n\n`;
        return out;
    }
    out += `+----------------+----------+--------+----------+--------------------------------------+\n`;
    out += `| Rule ID        | Severity | Weight | CWE      | Rule Title                           |\n`;
    out += `+----------------+----------+--------+----------+--------------------------------------+\n`;
    for (const f of report.findings) {
        const id = f.ruleId.padEnd(14);
        const sev = f.severity.padEnd(8);
        const w = String(f.weight).padEnd(6);
        const cwe = f.cwe.padEnd(8);
        const title = f.ruleName.length > 36 ? f.ruleName.substring(0, 33) + '...' : f.ruleName.padEnd(36);
        out += `| ${id} | ${sev} | ${w} | ${cwe} | ${title} |\n`;
        out += `| Detail:        ${f.message.padEnd(68)} |\n`;
        out += `| Remediation:   ${f.remediation.padEnd(68)} |\n`;
        out += `+----------------+----------+--------+----------+--------------------------------------+\n`;
    }
    out += '\n';
    return out;
}
/**
 * Format audit report into Canonical JSON.
 */
function formatJson(report) {
    return JSON.stringify({
        manifest_path: report.manifestPath,
        score: report.score,
        status: report.status,
        total_rules: report.totalRules,
        passed_rules: report.passedRules,
        violations_count: report.findings.length,
        critical_count: report.criticalCount,
        high_count: report.highCount,
        medium_count: report.mediumCount,
        low_count: report.lowCount,
        findings: report.findings.map(f => ({
            rule_id: f.ruleId,
            rule_name: f.ruleName,
            severity: f.severity,
            weight: f.weight,
            cwe: f.cwe,
            message: f.message,
            remediation: f.remediation
        }))
    }, null, 2) + '\n';
}
/**
 * Format audit report into an OASIS SARIF v2.1.0 document.
 */
function formatSarif(report) {
    const sarifRules = waterfall_auditor_1.NORMATIVE_RULES.map(r => ({
        id: r.id,
        name: r.name,
        fullDescription: {
            text: r.description
        },
        help: {
            text: r.remediation
        },
        properties: {
            cwe: r.cwe,
            severity: r.severity,
            weight: r.weight
        }
    }));
    const results = report.findings.map(f => {
        let level = 'error';
        if (f.severity === 'MEDIUM')
            level = 'warning';
        else if (f.severity === 'LOW')
            level = 'note';
        return {
            ruleId: f.ruleId,
            level,
            message: {
                text: f.message
            },
            locations: [
                {
                    physicalLocation: {
                        artifactLocation: {
                            uri: report.manifestPath || 'waterfall_config.json'
                        }
                    }
                }
            ]
        };
    });
    const sarifDoc = {
        $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
        version: '2.1.0',
        runs: [
            {
                tool: {
                    driver: {
                        name: 'lh-waterfall',
                        version: '0.1.0',
                        informationUri: 'https://logihertz.com',
                        rules: sarifRules
                    }
                },
                results
            }
        ]
    };
    return JSON.stringify(sarifDoc, null, 2) + '\n';
}
//# sourceMappingURL=exporters.js.map