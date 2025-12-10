/**
 * イベントバス
 * コンポーネント間の非同期通信
 */

import type {
  EventMetadata,
  SystemEvent,
  EventHandler,
  EventSubscription,
  EventFilter,
  EventBusConfig,
  EventCategory,
  EventPriority,
} from './types.js';

const PRIORITY_ORDER: Record<EventPriority, number> = {
  critical: 4,
  high: 3,
  normal: 2,
  low: 1,
};

const DEFAULT_CONFIG: EventBusConfig = {
  maxQueueSize: 1000,
  asyncProcessing: true,
  retryOnError: true,
  maxRetries: 3,
  enableLogging: true,
};

export class EventBus {
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private wildcardSubscriptions: EventSubscription[] = [];
  private eventQueue: SystemEvent[] = [];
  private processing: boolean = false;
  private config: EventBusConfig;
  private eventHistory: SystemEvent[] = [];
  private maxHistorySize: number = 100;

  constructor(config: Partial<EventBusConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  generateEventId(): string {
    return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateSubscriptionId(): string {
    return `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  subscribe<T = unknown>(
    eventType: string,
    handler: EventHandler<T>,
    options: {
      filter?: EventFilter;
      priority?: EventPriority;
    } = {}
  ): string {
    const subscription: EventSubscription = {
      id: this.generateSubscriptionId(),
      eventType,
      handler: handler as EventHandler,
      filter: options.filter,
      priority: options.priority ?? 'normal',
    };

    if (eventType === '*') {
      this.wildcardSubscriptions.push(subscription);
      this.sortSubscriptions(this.wildcardSubscriptions);
    } else {
      const subs = this.subscriptions.get(eventType) ?? [];
      subs.push(subscription);
      this.sortSubscriptions(subs);
      this.subscriptions.set(eventType, subs);
    }

    if (this.config.enableLogging) {
      console.log(`[EventBus] Subscribed to ${eventType}: ${subscription.id}`);
    }

    return subscription.id;
  }

  private sortSubscriptions(subs: EventSubscription[]): void {
    subs.sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]);
  }

  unsubscribe(subscriptionId: string): boolean {
    // Check wildcard subscriptions
    const wildcardIndex = this.wildcardSubscriptions.findIndex(s => s.id === subscriptionId);
    if (wildcardIndex >= 0) {
      this.wildcardSubscriptions.splice(wildcardIndex, 1);
      return true;
    }

    // Check regular subscriptions
    for (const [eventType, subs] of this.subscriptions) {
      const index = subs.findIndex(s => s.id === subscriptionId);
      if (index >= 0) {
        subs.splice(index, 1);
        if (subs.length === 0) {
          this.subscriptions.delete(eventType);
        }
        return true;
      }
    }

    return false;
  }

  emit<T = unknown>(
    type: string,
    payload: T,
    options: {
      category?: EventCategory;
      priority?: EventPriority;
      source?: string;
      correlationId?: string;
    } = {}
  ): string {
    const event: SystemEvent<T> = {
      metadata: {
        eventId: this.generateEventId(),
        type,
        category: options.category ?? 'system',
        priority: options.priority ?? 'normal',
        timestamp: new Date(),
        source: options.source ?? 'unknown',
        correlationId: options.correlationId,
      },
      payload,
    };

    if (this.config.asyncProcessing) {
      this.enqueue(event);
    } else {
      this.processEvent(event);
    }

    // Store in history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    if (this.config.enableLogging) {
      console.log(`[EventBus] Emitted ${type}: ${event.metadata.eventId}`);
    }

    return event.metadata.eventId;
  }

  private enqueue(event: SystemEvent): void {
    if (this.eventQueue.length >= this.config.maxQueueSize) {
      console.warn('[EventBus] Queue full, dropping oldest event');
      this.eventQueue.shift();
    }

    // Insert based on priority
    const priority = PRIORITY_ORDER[event.metadata.priority];
    let insertIndex = this.eventQueue.length;

    for (let i = 0; i < this.eventQueue.length; i++) {
      if (PRIORITY_ORDER[this.eventQueue[i].metadata.priority] < priority) {
        insertIndex = i;
        break;
      }
    }

    this.eventQueue.splice(insertIndex, 0, event);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.eventQueue.length === 0) return;

    this.processing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      await this.processEvent(event);
    }

    this.processing = false;
  }

  private async processEvent(event: SystemEvent): Promise<void> {
    const handlers = this.getHandlers(event);

    for (const subscription of handlers) {
      if (!this.matchesFilter(event, subscription.filter)) continue;

      try {
        await this.executeHandler(subscription.handler, event);
      } catch (error) {
        console.error(`[EventBus] Handler error for ${event.metadata.type}:`, error);

        if (this.config.retryOnError) {
          await this.retryHandler(subscription.handler, event);
        }
      }
    }
  }

  private getHandlers(event: SystemEvent): EventSubscription[] {
    const typeHandlers = this.subscriptions.get(event.metadata.type) ?? [];
    return [...typeHandlers, ...this.wildcardSubscriptions];
  }

  private matchesFilter(event: SystemEvent, filter?: EventFilter): boolean {
    if (!filter) return true;

    if (filter.categories && !filter.categories.includes(event.metadata.category)) {
      return false;
    }

    if (filter.sources && !filter.sources.includes(event.metadata.source)) {
      return false;
    }

    if (filter.minPriority) {
      const minPriorityValue = PRIORITY_ORDER[filter.minPriority];
      const eventPriorityValue = PRIORITY_ORDER[event.metadata.priority];
      if (eventPriorityValue < minPriorityValue) {
        return false;
      }
    }

    return true;
  }

  private async executeHandler(handler: EventHandler, event: SystemEvent): Promise<void> {
    const result = handler(event);
    if (result instanceof Promise) {
      await result;
    }
  }

  private async retryHandler(handler: EventHandler, event: SystemEvent, attempt: number = 1): Promise<void> {
    if (attempt > this.config.maxRetries) {
      console.error(`[EventBus] Max retries exceeded for ${event.metadata.type}`);
      return;
    }

    const delay = Math.pow(2, attempt) * 100; // Exponential backoff
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      await this.executeHandler(handler, event);
    } catch (error) {
      console.warn(`[EventBus] Retry ${attempt} failed for ${event.metadata.type}`);
      await this.retryHandler(handler, event, attempt + 1);
    }
  }

  once<T = unknown>(eventType: string, handler: EventHandler<T>): string {
    const wrappedHandler: EventHandler<T> = (event) => {
      this.unsubscribe(subscriptionId);
      return handler(event);
    };

    const subscriptionId = this.subscribe(eventType, wrappedHandler);
    return subscriptionId;
  }

  waitFor<T = unknown>(eventType: string, timeout: number = 30000): Promise<SystemEvent<T>> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.unsubscribe(subscriptionId);
        reject(new Error(`Timeout waiting for event: ${eventType}`));
      }, timeout);

      const subscriptionId = this.once<T>(eventType, (event) => {
        clearTimeout(timeoutId);
        resolve(event as SystemEvent<T>);
      });
    });
  }

  getQueueSize(): number {
    return this.eventQueue.length;
  }

  getSubscriptionCount(eventType?: string): number {
    if (eventType) {
      return (this.subscriptions.get(eventType)?.length ?? 0) + this.wildcardSubscriptions.length;
    }

    let total = this.wildcardSubscriptions.length;
    for (const subs of this.subscriptions.values()) {
      total += subs.length;
    }
    return total;
  }

  getRecentEvents(limit: number = 10): SystemEvent[] {
    return this.eventHistory.slice(-limit);
  }

  getEventsByType(type: string, limit: number = 10): SystemEvent[] {
    return this.eventHistory
      .filter(e => e.metadata.type === type)
      .slice(-limit);
  }

  clear(): void {
    this.eventQueue = [];
    this.eventHistory = [];
  }

  clearSubscriptions(): void {
    this.subscriptions.clear();
    this.wildcardSubscriptions = [];
  }
}

// Singleton instance
let eventBusInstance: EventBus | null = null;

export function getEventBus(): EventBus {
  if (!eventBusInstance) {
    eventBusInstance = new EventBus();
  }
  return eventBusInstance;
}

export function createEventBus(config?: Partial<EventBusConfig>): EventBus {
  eventBusInstance = new EventBus(config);
  return eventBusInstance;
}
