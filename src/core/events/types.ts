/**
 * イベントバス型定義
 */

export type EventPriority = 'low' | 'normal' | 'high' | 'critical';
export type EventCategory = 'system' | 'session' | 'avatar' | 'protocol' | 'quality' | 'audit';

export interface EventMetadata {
  eventId: string;
  type: string;
  category: EventCategory;
  priority: EventPriority;
  timestamp: Date;
  source: string;
  correlationId?: string;
}

export interface SystemEvent<T = unknown> {
  metadata: EventMetadata;
  payload: T;
}

// System Events
export interface SystemStartedEvent {
  version: string;
  environment: string;
  components: string[];
}

export interface SystemShutdownEvent {
  reason: string;
  graceful: boolean;
}

// Session Events
export interface SessionCreatedEvent {
  sessionId: string;
  clientId: string;
  avatarId: string;
}

export interface SessionCompletedEvent {
  sessionId: string;
  duration: number;
  satisfactionScore?: number;
}

export interface AvatarSwitchedEvent {
  sessionId: string;
  fromAvatarId: string;
  toAvatarId: string;
  reason?: string;
}

// Avatar Events
export interface AvatarResponseEvent {
  sessionId: string;
  avatarId: string;
  responseTime: number;
  tokensUsed: number;
}

export interface InsightGeneratedEvent {
  sessionId: string;
  avatarId: string;
  insightId: string;
  category: string;
  confidence: number;
}

// Protocol Events
export interface ReportSubmittedEvent {
  reportId: string;
  type: string;
  fromAvatarId: string;
  toAvatarIds: string[];
}

export interface RequestCreatedEvent {
  requestId: string;
  type: string;
  fromAvatarId: string;
  toAvatarId: string;
  priority: string;
}

export interface ConflictDetectedEvent {
  conflictId: string;
  type: string;
  parties: string[];
  severity: string;
}

// Quality Events
export interface QualityAlertEvent {
  alertId: string;
  avatarId: string;
  metric: string;
  value: number;
  threshold: number;
  severity: string;
}

// Audit Events
export interface AuditLogEvent {
  action: string;
  actor: string;
  resource: string;
  details: Record<string, unknown>;
}

export type EventHandler<T = unknown> = (event: SystemEvent<T>) => void | Promise<void>;

export interface EventSubscription {
  id: string;
  eventType: string;
  handler: EventHandler;
  filter?: EventFilter;
  priority: EventPriority;
}

export interface EventFilter {
  categories?: EventCategory[];
  sources?: string[];
  minPriority?: EventPriority;
}

export interface EventBusConfig {
  maxQueueSize: number;
  asyncProcessing: boolean;
  retryOnError: boolean;
  maxRetries: number;
  enableLogging: boolean;
}
