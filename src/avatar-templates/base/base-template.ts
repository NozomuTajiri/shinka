/**
 * デフォルトベーステンプレート
 * 全アバターが継承する基本設定
 */

import type {
  BaseAvatarTemplate,
  AvatarPersona,
  KnowledgeDomain,
  AvatarCapabilities,
  DatabasePermissions,
  CollaborationSettings,
  QualityStandards,
  LearningMechanism,
} from './types.js';

export const DEFAULT_PERSONA: Partial<AvatarPersona> = {
  communicationStyle: 'collaborative',
  tone: ['professional', 'supportive', 'clear'],
  principles: [
    'クライアントの成功を最優先',
    'データと事実に基づく提案',
    '継続的な価値提供',
    '透明性のあるコミュニケーション',
  ],
  limitations: [
    '法的アドバイスは提供しない',
    '最終意思決定は人間が行う',
    '機密情報の取り扱いに注意',
  ],
};

export const DEFAULT_CAPABILITIES: AvatarCapabilities = {
  core: [
    {
      id: 'dialogue',
      name: '対話処理',
      description: 'クライアントとの自然な対話',
      enabled: true,
      requiredKnowledge: [],
    },
    {
      id: 'analysis',
      name: '情報分析',
      description: '提供された情報の分析と洞察',
      enabled: true,
      requiredKnowledge: [],
    },
    {
      id: 'recommendation',
      name: '提案生成',
      description: '状況に応じた提案の生成',
      enabled: true,
      requiredKnowledge: [],
    },
  ],
  extended: [
    {
      id: 'report-generation',
      name: 'レポート生成',
      description: '構造化されたレポートの作成',
      enabled: false,
      conditions: ['報告対象が明確'],
      dependencies: ['analysis'],
    },
    {
      id: 'multi-avatar-coordination',
      name: '複数アバター連携',
      description: '他アバターとの協調作業',
      enabled: false,
      conditions: ['協調プロトコル設定済み'],
      dependencies: ['dialogue'],
    },
  ],
  limitations: [
    '同時に1クライアントのみ対応',
    '外部システムへの直接アクセス不可',
    'リアルタイムデータの取得制限',
  ],
  integrations: [],
};

export const DEFAULT_DATABASE_PERMISSIONS: DatabasePermissions = {
  read: [
    {
      database: 'knowledge-base',
      tables: ['frameworks', 'best-practices', 'industry-data'],
    },
  ],
  write: [
    {
      database: 'session-log',
      tables: ['conversations', 'insights', 'action-items'],
    },
  ],
  restricted: ['client-financials', 'personal-data', 'credentials'],
};

export const DEFAULT_COLLABORATION: CollaborationSettings = {
  canInitiate: ['hiraku'],
  canRespond: ['senryaku', 'eigyo', 'shijo', 'kanri'],
  reportingTo: ['mother-ai'],
  protocols: [
    { protocolId: 'report', enabled: true, role: 'both', priority: 1 },
    { protocolId: 'request', enabled: true, role: 'both', priority: 2 },
    { protocolId: 'insight-sharing', enabled: true, role: 'both', priority: 3 },
  ],
};

export const DEFAULT_QUALITY_STANDARDS: QualityStandards = {
  responseTime: {
    targetSeconds: 3,
    maxSeconds: 10,
    warningThreshold: 5,
  },
  accuracy: {
    minScore: 80,
    targetScore: 95,
    evaluationMethod: 'human-review',
  },
  satisfaction: {
    minScore: 4.0,
    targetScore: 4.5,
    surveyFrequency: 'session',
  },
  metrics: [
    { id: 'response-latency', name: '応答遅延', type: 'histogram', unit: 'ms', threshold: 3000 },
    { id: 'session-completion', name: 'セッション完了率', type: 'gauge', unit: '%', threshold: 95 },
    { id: 'recommendation-adoption', name: '提案採用率', type: 'gauge', unit: '%', threshold: 70 },
  ],
};

export const DEFAULT_LEARNING: LearningMechanism = {
  enabled: true,
  mode: 'hybrid',
  feedbackSources: [
    { id: 'explicit-rating', type: 'explicit', weight: 1.0, minSamples: 10 },
    { id: 'outcome-tracking', type: 'outcome', weight: 0.8, minSamples: 20 },
    { id: 'engagement-metrics', type: 'implicit', weight: 0.5, minSamples: 50 },
  ],
  updateFrequency: 'daily',
  retentionPolicy: {
    successfulPatterns: 365,
    failedPatterns: 90,
    clientContext: 180,
    sessionHistory: 90,
  },
};

export function createBaseTemplate(
  templateId: string,
  author: string
): BaseAvatarTemplate {
  const now = new Date();

  return {
    metadata: {
      templateId,
      version: '1.0.0',
      category: 'specialized',
      createdAt: now,
      updatedAt: now,
      author,
      status: 'draft',
    },
    persona: {
      id: templateId,
      name: '',
      nameJa: '',
      role: '',
      description: '',
      background: '',
      ...DEFAULT_PERSONA,
    } as AvatarPersona,
    knowledge: [],
    capabilities: { ...DEFAULT_CAPABILITIES },
    database: { ...DEFAULT_DATABASE_PERMISSIONS },
    collaboration: { ...DEFAULT_COLLABORATION },
    quality: { ...DEFAULT_QUALITY_STANDARDS },
    learning: { ...DEFAULT_LEARNING },
  };
}

export function mergeTemplates(
  base: BaseAvatarTemplate,
  override: Partial<BaseAvatarTemplate>
): BaseAvatarTemplate {
  return {
    metadata: { ...base.metadata, ...override.metadata },
    persona: { ...base.persona, ...override.persona },
    knowledge: [...base.knowledge, ...(override.knowledge ?? [])],
    capabilities: {
      core: [...base.capabilities.core, ...(override.capabilities?.core ?? [])],
      extended: [...base.capabilities.extended, ...(override.capabilities?.extended ?? [])],
      limitations: [...base.capabilities.limitations, ...(override.capabilities?.limitations ?? [])],
      integrations: [...base.capabilities.integrations, ...(override.capabilities?.integrations ?? [])],
    },
    database: {
      read: [...base.database.read, ...(override.database?.read ?? [])],
      write: [...base.database.write, ...(override.database?.write ?? [])],
      restricted: [...new Set([...base.database.restricted, ...(override.database?.restricted ?? [])])],
    },
    collaboration: { ...base.collaboration, ...override.collaboration },
    quality: { ...base.quality, ...override.quality },
    learning: { ...base.learning, ...override.learning },
  };
}
