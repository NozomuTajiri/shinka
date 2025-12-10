/**
 * 統廃合エンジン型定義エクスポート
 */

export type {
  AvatarMetrics,
  UsageMetrics,
  EffectivenessMetrics,
  CostMetrics,
  ConsolidationCandidate,
  ImpactAssessment,
  MergeProposal,
  TargetAvatarSpec,
  MergeStrategy,
  MergeTimeline,
  TimelinePhase,
  Risk,
  ProposalStatus,
  DeprecationPlan,
  DeprecationTimeline,
  MigrationPlan,
  DataTransferSpec,
  NotificationStrategy,
  CommunicationPlan,
  CommunicationMessage,
  CommunicationSchedule,
  ConsolidationReport,
  ReportSummary,
} from './types.js';

export { ConsolidationEngine } from './index.js';
