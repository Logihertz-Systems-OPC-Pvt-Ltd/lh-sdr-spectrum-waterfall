import { AuditReport } from './types';
/**
 * Format audit report into an ANSI terminal table with score banner.
 */
export declare function formatTable(report: AuditReport): string;
/**
 * Format audit report into Canonical JSON.
 */
export declare function formatJson(report: AuditReport): string;
/**
 * Format audit report into an OASIS SARIF v2.1.0 document.
 */
export declare function formatSarif(report: AuditReport): string;
