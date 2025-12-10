# Event Bus System

Event Bus for component communication in the Shinka framework.

## Overview

The Event Bus provides a centralized, type-safe mechanism for components to communicate asynchronously through events. It supports priority-based event processing, filtering, retry logic, and event history tracking.

## Features

- **Type-safe events**: Strongly typed event payloads with TypeScript
- **Priority-based processing**: Events can be prioritized (critical, high, normal, low)
- **Event categories**: Organized into system, session, avatar, protocol, quality, and audit categories
- **Filtering**: Subscribe to events based on categories, sources, and priority levels
- **Retry mechanism**: Automatic retry with exponential backoff for failed handlers
- **Event history**: Track recent events for debugging and analysis
- **Wildcard subscriptions**: Subscribe to all events with `*`
- **Promise support**: Wait for specific events with `waitFor()`
- **Queue management**: Priority-based event queue with configurable size

## Usage

### Basic Usage

```typescript
import { getEventBus } from './core/events';

const eventBus = getEventBus();

// Subscribe to an event
const subscriptionId = eventBus.subscribe('session:created', (event) => {
  console.log('Session created:', event.payload);
});

// Emit an event
eventBus.emit('session:created', {
  sessionId: 'sess-123',
  clientId: 'client-456',
  avatarId: 'avatar-789',
}, {
  category: 'session',
  priority: 'high',
  source: 'SessionManager',
});

// Unsubscribe
eventBus.unsubscribe(subscriptionId);
```

### Advanced Features

#### Priority-based Subscriptions

```typescript
eventBus.subscribe('quality:alert', handleAlert, {
  priority: 'critical',
  filter: {
    minPriority: 'high',
    categories: ['quality'],
  },
});
```

#### Wildcard Subscriptions

```typescript
// Subscribe to all events
eventBus.subscribe('*', (event) => {
  console.log('Event received:', event.metadata.type);
});
```

#### One-time Subscriptions

```typescript
eventBus.once('system:shutdown', (event) => {
  console.log('System shutting down:', event.payload.reason);
});
```

#### Wait for Events

```typescript
try {
  const event = await eventBus.waitFor('session:completed', 5000);
  console.log('Session completed:', event.payload);
} catch (error) {
  console.error('Timeout waiting for session completion');
}
```

### Event Categories

- **system**: System-level events (startup, shutdown)
- **session**: Session lifecycle events
- **avatar**: Avatar-related events (responses, insights)
- **protocol**: Protocol events (reports, requests, conflicts)
- **quality**: Quality monitoring events
- **audit**: Audit logging events

### Event Priorities

Events are processed in priority order:

1. **critical**: Immediate processing required
2. **high**: High priority
3. **normal**: Standard priority (default)
4. **low**: Low priority

### Configuration

```typescript
import { createEventBus } from './core/events';

const eventBus = createEventBus({
  maxQueueSize: 2000,
  asyncProcessing: true,
  retryOnError: true,
  maxRetries: 5,
  enableLogging: false,
});
```

## Event Types

### System Events

```typescript
eventBus.emit('system:started', {
  version: '1.0.0',
  environment: 'production',
  components: ['SessionManager', 'AvatarEngine'],
}, { category: 'system' });

eventBus.emit('system:shutdown', {
  reason: 'maintenance',
  graceful: true,
}, { category: 'system', priority: 'critical' });
```

### Session Events

```typescript
eventBus.emit('session:created', {
  sessionId: 'sess-123',
  clientId: 'client-456',
  avatarId: 'avatar-789',
}, { category: 'session' });

eventBus.emit('session:completed', {
  sessionId: 'sess-123',
  duration: 3600000,
  satisfactionScore: 4.5,
}, { category: 'session' });

eventBus.emit('avatar:switched', {
  sessionId: 'sess-123',
  fromAvatarId: 'avatar-789',
  toAvatarId: 'avatar-012',
  reason: 'quality',
}, { category: 'session', priority: 'high' });
```

### Avatar Events

```typescript
eventBus.emit('avatar:response', {
  sessionId: 'sess-123',
  avatarId: 'avatar-789',
  responseTime: 250,
  tokensUsed: 150,
}, { category: 'avatar' });

eventBus.emit('insight:generated', {
  sessionId: 'sess-123',
  avatarId: 'avatar-789',
  insightId: 'insight-345',
  category: 'behavior',
  confidence: 0.85,
}, { category: 'avatar' });
```

### Protocol Events

```typescript
eventBus.emit('report:submitted', {
  reportId: 'report-123',
  type: 'session',
  fromAvatarId: 'avatar-789',
  toAvatarIds: ['avatar-012', 'avatar-345'],
}, { category: 'protocol' });

eventBus.emit('request:created', {
  requestId: 'req-123',
  type: 'consultation',
  fromAvatarId: 'avatar-789',
  toAvatarId: 'avatar-012',
  priority: 'high',
}, { category: 'protocol', priority: 'high' });

eventBus.emit('conflict:detected', {
  conflictId: 'conflict-123',
  type: 'insight',
  parties: ['avatar-789', 'avatar-012'],
  severity: 'medium',
}, { category: 'protocol', priority: 'high' });
```

### Quality Events

```typescript
eventBus.emit('quality:alert', {
  alertId: 'alert-123',
  avatarId: 'avatar-789',
  metric: 'responseTime',
  value: 5000,
  threshold: 3000,
  severity: 'warning',
}, { category: 'quality', priority: 'high' });
```

### Audit Events

```typescript
eventBus.emit('audit:log', {
  action: 'session:start',
  actor: 'client-456',
  resource: 'sess-123',
  details: {
    avatarId: 'avatar-789',
    timestamp: new Date().toISOString(),
  },
}, { category: 'audit' });
```

## API Reference

### EventBus Methods

- `subscribe<T>(eventType, handler, options?)`: Subscribe to events
- `unsubscribe(subscriptionId)`: Remove subscription
- `emit<T>(type, payload, options?)`: Emit an event
- `once<T>(eventType, handler)`: One-time subscription
- `waitFor<T>(eventType, timeout?)`: Wait for event with timeout
- `getQueueSize()`: Get current queue size
- `getSubscriptionCount(eventType?)`: Get subscription count
- `getRecentEvents(limit?)`: Get recent event history
- `getEventsByType(type, limit?)`: Get events by type
- `clear()`: Clear queue and history
- `clearSubscriptions()`: Remove all subscriptions

### Helper Functions

- `getEventBus()`: Get singleton instance
- `createEventBus(config?)`: Create new instance with config

## Best Practices

1. **Use specific event types**: Prefer `'session:created'` over generic types
2. **Set appropriate priorities**: Reserve `critical` for urgent events
3. **Use categories for filtering**: Group related events by category
4. **Handle errors gracefully**: Event handlers should not throw
5. **Clean up subscriptions**: Unsubscribe when components unmount
6. **Use correlation IDs**: Track related events across the system
7. **Avoid synchronous processing**: Let the event bus handle async processing

## Integration Example

```typescript
import { getEventBus } from './core/events';
import type { SessionCreatedEvent, AvatarResponseEvent } from './core/events';

class SessionManager {
  private eventBus = getEventBus();
  private subscriptionIds: string[] = [];

  initialize() {
    // Subscribe to avatar responses
    const sub1 = this.eventBus.subscribe<AvatarResponseEvent>(
      'avatar:response',
      this.handleAvatarResponse.bind(this),
      {
        filter: { categories: ['avatar'] },
        priority: 'normal',
      }
    );

    this.subscriptionIds.push(sub1);
  }

  async createSession(clientId: string, avatarId: string) {
    const sessionId = this.generateSessionId();

    // Emit session created event
    this.eventBus.emit<SessionCreatedEvent>(
      'session:created',
      { sessionId, clientId, avatarId },
      {
        category: 'session',
        priority: 'high',
        source: 'SessionManager',
      }
    );

    return sessionId;
  }

  private handleAvatarResponse(event: SystemEvent<AvatarResponseEvent>) {
    const { sessionId, responseTime } = event.payload;
    console.log(`Avatar response for ${sessionId}: ${responseTime}ms`);
  }

  cleanup() {
    // Unsubscribe all
    this.subscriptionIds.forEach(id => this.eventBus.unsubscribe(id));
  }
}
```

## Testing

```typescript
import { createEventBus } from './core/events';
import { describe, it, expect, beforeEach } from 'vitest';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = createEventBus({ enableLogging: false });
  });

  it('should emit and receive events', async () => {
    let received = false;

    eventBus.subscribe('test:event', () => {
      received = true;
    });

    eventBus.emit('test:event', { data: 'test' });

    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(received).toBe(true);
  });

  it('should respect event priorities', async () => {
    const order: string[] = [];

    eventBus.subscribe('*', (event) => {
      order.push(event.metadata.priority);
    });

    eventBus.emit('event1', {}, { priority: 'low' });
    eventBus.emit('event2', {}, { priority: 'critical' });
    eventBus.emit('event3', {}, { priority: 'normal' });

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(order).toEqual(['critical', 'normal', 'low']);
  });
});
```
