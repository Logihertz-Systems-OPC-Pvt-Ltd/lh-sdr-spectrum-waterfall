import { RuleDefinition, WaterfallDashboardConfig, AuditReport } from './types';
/**
 * Official registry of all 10 normative SDR spectrum/waterfall posture rules.
 */
export declare const NORMATIVE_RULES: RuleDefinition[];
/**
 * Deterministically evaluate an SDR waterfall dashboard configuration against the 10 normative rules.
 */
export declare function auditWaterfallConfig(config: WaterfallDashboardConfig, manifestPath?: string): AuditReport;
