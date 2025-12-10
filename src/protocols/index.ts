/**
 * アバター間協調プロトコル
 * @module protocols
 *
 * 5つの協調プロトコルを提供:
 * - Report: 週次報告・即時アラート・成果記録
 * - Request: 情報収集・分析依頼・参加支援
 * - Arbitration: コンフリクト解決・裁定
 * - JointSession: 複数アバター協働セッション
 * - InsightSharing: ベストプラクティス・学習共有
 */

// Report Protocol
export * from './report/index.js';
export { ReportEngine } from './report/report-engine.js';

// Request Protocol - Renamed AgendaItem to avoid conflict
export type {
  RequestType,
  RequestPriority,
  RequestStatus,
  RequestMetadata,
  InformationRequest,
  InformationResponse,
  AnalysisRequest,
  DataItem,
  AnalysisResponse,
  Finding,
  Recommendation,
  ParticipationRequest,
  ParticipationResponse,
  SupportRequest,
  SupportResponse,
  RequestSLA,
  RequestRouting,
} from './request/types.js';
export type { AgendaItem as RequestAgendaItem } from './request/types.js';
export { RequestEngine } from './request/request-engine.js';

// Arbitration Protocol
export * from './arbitration/index.js';
export { ArbitrationEngine } from './arbitration/arbitration-engine.js';

// Joint Session Protocol - AgendaItem exported here
export * from './joint-session/index.js';
export { SessionEngine } from './joint-session/session-engine.js';

// Insight Sharing Protocol
export * from './insight-sharing/index.js';
export { InsightEngine } from './insight-sharing/insight-engine.js';

/**
 * プロトコルファクトリー
 * 全プロトコルエンジンの一括初期化
 */
export interface ProtocolEngines {
  report: import('./report/report-engine.js').ReportEngine;
  request: import('./request/request-engine.js').RequestEngine;
  arbitration: import('./arbitration/arbitration-engine.js').ArbitrationEngine;
  session: import('./joint-session/session-engine.js').SessionEngine;
  insight: import('./insight-sharing/insight-engine.js').InsightEngine;
}

/**
 * 全プロトコルエンジンを初期化
 */
export async function initializeProtocols(): Promise<ProtocolEngines> {
  const { ReportEngine } = await import('./report/report-engine.js');
  const { RequestEngine } = await import('./request/request-engine.js');
  const { ArbitrationEngine } = await import('./arbitration/arbitration-engine.js');
  const { SessionEngine } = await import('./joint-session/session-engine.js');
  const { InsightEngine } = await import('./insight-sharing/insight-engine.js');

  return {
    report: new ReportEngine(),
    request: new RequestEngine(),
    arbitration: new ArbitrationEngine(),
    session: new SessionEngine(),
    insight: new InsightEngine(),
  };
}
