# Session Management Module

Client session management system for the Shinka project, handling session lifecycle, avatar assignment, conversation tracking, and insights generation.

## Overview

The Session Management module provides comprehensive functionality for managing client consultation sessions, including:

- Session lifecycle management (create, pause, resume, complete, abandon)
- Intelligent avatar assignment and recommendation
- Conversation history tracking
- Real-time insights generation
- Action item management
- Session metrics and analytics
- Multi-session client relationship tracking

## Architecture

```
session/
├── types.ts              # Type definitions
├── session-manager.ts    # Core session management
├── index.ts             # Public API exports
└── README.md            # This file
```

## Core Components

### SessionManager

Main class for managing client sessions.

#### Key Features

- **Session Lifecycle**: Create, pause, resume, complete, and abandon sessions
- **Avatar Assignment**: Auto, manual, and recommended avatar assignment strategies
- **Conversation Tracking**: Track all client-avatar interactions with metadata
- **Insights Generation**: Capture and store session insights with confidence scoring
- **Action Items**: Create and track follow-up actions with priority and status
- **Analytics**: Session statistics and metrics tracking

#### Basic Usage

```typescript
import { SessionManager } from '@/core/session';

const manager = new SessionManager();

// Create a new session
const session = manager.createSession('client-123', {
  clientProfile: {
    id: 'client-123',
    name: 'Acme Corp',
    company: 'Acme Corporation',
    industry: 'Technology',
    size: 'enterprise',
    challenges: ['営業強化', '市場拡大'],
    preferences: {
      communicationStyle: 'formal',
      responseLength: 'detailed',
      language: 'ja',
    },
  },
  assignmentStrategy: 'auto', // Will auto-recommend best avatar
});

console.log(`Session created: ${session.metadata.sessionId}`);
console.log(`Assigned avatar: ${session.metadata.assignedAvatarId}`);
```

## Type System

### Session Types

#### SessionStatus

```typescript
type SessionStatus = 'active' | 'paused' | 'completed' | 'abandoned';
```

- **active**: Session is currently in progress
- **paused**: Session temporarily stopped, can be resumed
- **completed**: Session successfully finished
- **abandoned**: Session ended without completion

#### AvatarAssignmentStrategy

```typescript
type AvatarAssignmentStrategy = 'auto' | 'manual' | 'recommended';
```

- **auto**: System automatically assigns best avatar based on profile
- **manual**: User manually selects avatar
- **recommended**: System provides recommendations, user chooses

### Main Interfaces

#### ClientSession

Complete session state including metadata, context, history, and metrics.

```typescript
interface ClientSession {
  metadata: SessionMetadata;      // Session identification and status
  context: SessionContext;         // Client context and objectives
  history: ConversationTurn[];     // Conversation transcript
  insights: SessionInsight[];      // Generated insights
  actionItems: SessionActionItem[]; // Follow-up actions
  metrics: SessionMetrics;         // Performance metrics
}
```

#### ClientProfile

```typescript
interface ClientProfile {
  id: string;
  name: string;
  company?: string;
  industry?: string;
  size?: 'startup' | 'sme' | 'enterprise';
  challenges: string[];
  preferences: ClientPreferences;
}
```

## Usage Examples

### Creating a Session with Auto Avatar Assignment

```typescript
const session = manager.createSession('client-456', {
  clientProfile: {
    id: 'client-456',
    name: 'Tech Startup',
    size: 'startup',
    challenges: ['戦略立案', 'ビジョン策定'],
    preferences: {
      communicationStyle: 'casual',
      responseLength: 'concise',
      language: 'ja',
    },
  },
  assignmentStrategy: 'auto',
});

// System will recommend 'senryaku' avatar for strategy challenges
```

### Adding Conversation Turns

```typescript
// Client message
manager.addTurn(
  sessionId,
  'client',
  '今期の売上目標を達成するために、何から始めるべきでしょうか？'
);

// Avatar response
manager.addTurn(
  sessionId,
  'avatar',
  'まず現状分析から始めましょう。御社の強みと市場機会を整理します。',
  {
    responseTime: 1250, // ms
    confidence: 0.92,
    frameworkUsed: 'Neo-Market-In',
    tokensUsed: 156,
  }
);
```

### Generating Insights

```typescript
manager.addInsight(
  sessionId,
  '市場分析',
  '競合他社との差別化ポイントが不明確。独自の価値提案の再定義が必要。',
  0.85,
  'avatar'
);

manager.addInsight(
  sessionId,
  '組織課題',
  '営業プロセスが標準化されておらず、属人化が進んでいる。',
  0.78,
  'analysis'
);
```

### Creating Action Items

```typescript
manager.addActionItem(
  sessionId,
  '競合分析レポートを作成し、差別化ポイントを3つ特定する',
  'client',
  'high',
  new Date('2025-12-15')
);

manager.addActionItem(
  sessionId,
  '営業プロセスの標準化フレームワークを提案',
  'avatar',
  'medium'
);
```

### Switching Avatars Mid-Session

```typescript
// Switch from hiraku to eigyo for sales-focused discussion
const switched = manager.switchAvatar(sessionId, 'eigyo');

if (switched) {
  console.log('Avatar switched to eigyo (Sales Specialist)');
}
```

### Completing a Session

```typescript
const summary = manager.completeSession(sessionId, 4.5); // satisfaction score

console.log('Session Summary:', {
  duration: `${Math.floor(summary.duration / 60)} minutes`,
  keyTopics: summary.keyTopics,
  insights: summary.mainInsights,
  nextSteps: summary.nextSteps,
  assessment: summary.overallAssessment,
});
```

### Managing Client Relationships

```typescript
// Get all sessions for a client
const clientSessions = manager.getClientSessions('client-123');

console.log(`Total sessions: ${clientSessions.length}`);
console.log('Session history:', clientSessions.map(s => ({
  id: s.metadata.sessionId,
  date: s.metadata.createdAt,
  status: s.metadata.status,
  avatar: s.metadata.assignedAvatarId,
})));
```

### Session Analytics

```typescript
const stats = manager.getSessionStatistics();

console.log('Platform Statistics:', {
  totalSessions: stats.total,
  activeSessions: stats.byStatus.active,
  completedSessions: stats.byStatus.completed,
  averageDuration: `${Math.floor(stats.avgDuration / 60)} minutes`,
  averageSatisfaction: `${stats.avgSatisfaction}/5.0`,
});
```

## Avatar Recommendation Logic

The system automatically recommends avatars based on client challenges:

| Challenge Keywords | Recommended Avatar | Score |
|-------------------|-------------------|-------|
| 戦略, 経営, ビジョン | senryaku | 90 |
| 営業, 売上, 商談 | eigyo | 90 |
| マーケティング, 市場, 競合 | shijo | 90 |
| 組織, チーム, マネジメント | kanri | 90 |
| Default / Initial | hiraku | 70 |

### Recommendation Example

```typescript
const recommendation = manager.recommendAvatar(
  {
    id: 'client-789',
    name: 'Growth Co',
    challenges: ['営業プロセス改善', '売上向上'],
    preferences: { /* ... */ },
  }
);

console.log({
  avatar: recommendation.avatarId,        // 'eigyo'
  score: recommendation.score,            // 90
  reasons: recommendation.reasons,        // ['科学的営業プロセス', '商談支援に強み']
  suitability: recommendation.suitability // 'excellent'
});
```

## Session Lifecycle

```
CREATE SESSION
    ↓
  ACTIVE ←→ PAUSED
    ↓
COMPLETED / ABANDONED
```

### State Transitions

- **Create** → `active`
- **Pause** → `active` → `paused`
- **Resume** → `paused` → `active`
- **Complete** → `active` → `completed` (generates summary)
- **Abandon** → `active` → `abandoned`

## Metrics Tracking

Each session automatically tracks:

- **totalTurns**: Number of conversation exchanges
- **duration**: Session length in seconds
- **avgResponseTime**: Average avatar response time
- **insightsGenerated**: Number of insights captured
- **actionItemsCreated**: Number of follow-up actions
- **satisfactionScore**: Optional 1-5 rating

## Error Handling

Methods return `null` or `false` for invalid operations:

```typescript
// Attempting to add turn to non-existent session
const turn = manager.addTurn('invalid-id', 'client', 'Hello');
// Returns: null

// Attempting to resume non-paused session
const resumed = manager.resumeSession('active-session-id');
// Returns: false
```

## Best Practices

### 1. Initialize with Complete Profile

Provide comprehensive client profiles for better avatar recommendations:

```typescript
const session = manager.createSession(clientId, {
  clientProfile: {
    // Complete profile data
    challenges: ['specific', 'challenges'],
    preferences: {
      communicationStyle: 'balanced',
      responseLength: 'adaptive',
      language: 'ja',
    },
  },
});
```

### 2. Track Response Metadata

Include performance metadata for analytics:

```typescript
manager.addTurn(sessionId, 'avatar', content, {
  responseTime: elapsedMs,
  confidence: confidenceScore,
  frameworkUsed: 'framework-name',
  tokensUsed: tokenCount,
});
```

### 3. Generate Insights Continuously

Add insights as they emerge during conversation:

```typescript
if (significantFindingDetected) {
  manager.addInsight(
    sessionId,
    category,
    insightContent,
    confidenceLevel,
    'avatar'
  );
}
```

### 4. Complete Sessions Properly

Always complete sessions with satisfaction scores:

```typescript
const summary = manager.completeSession(sessionId, satisfactionScore);
// Store or display summary for follow-up
```

### 5. Monitor Session Health

Regularly check session statistics:

```typescript
const stats = manager.getSessionStatistics();
if (stats.avgSatisfaction < 4.0) {
  // Investigate quality issues
}
```

## Integration Points

### With Avatar System

```typescript
import { SessionManager } from '@/core/session';
import { AvatarOrchestrator } from '@/core/avatar';

const session = sessionManager.createSession(clientId, options);
const avatar = avatarOrchestrator.getAvatar(session.metadata.assignedAvatarId);
const response = await avatar.respond(userMessage, session.context);
```

### With Analytics System

```typescript
const sessions = manager.getSessionsByStatus('completed');
const analytics = analyzeSessionPerformance(sessions);
```

### With Persistence Layer

```typescript
// Save session state
await db.sessions.save(session.metadata.sessionId, session);

// Restore session
const restored = await db.sessions.load(sessionId);
manager.sessions.set(sessionId, restored);
```

## Future Enhancements

Planned features for future versions:

- Persistent storage integration (Redis/PostgreSQL)
- Advanced NLP for topic extraction
- Sentiment analysis integration
- Multi-language support
- Session templates and presets
- Automated follow-up scheduling
- Integration with CRM systems
- Real-time collaboration features
- Advanced analytics dashboard

## Related Modules

- **Avatar System**: Multi-avatar orchestration
- **Framework System**: Framework application and selection
- **Analytics**: Session performance analysis
- **Persistence**: Session state storage

## API Reference

### SessionManager Methods

#### Session Creation & Retrieval

- `createSession(clientId, options?)`: Create new session
- `getSession(sessionId)`: Get session by ID
- `getClientSessions(clientId)`: Get all sessions for client
- `getActiveSessions()`: Get all active sessions
- `getSessionsByStatus(status)`: Filter sessions by status

#### Conversation Management

- `addTurn(sessionId, role, content, metadata?)`: Add conversation turn
- `switchAvatar(sessionId, newAvatarId)`: Change avatar mid-session

#### Insights & Actions

- `addInsight(sessionId, category, content, confidence, source?)`: Add insight
- `addActionItem(sessionId, action, assignee, priority?, dueDate?)`: Create action item
- `updateActionItemStatus(sessionId, actionItemId, status)`: Update action status

#### Session Lifecycle

- `pauseSession(sessionId)`: Pause active session
- `resumeSession(sessionId)`: Resume paused session
- `completeSession(sessionId, satisfactionScore?)`: Complete and summarize
- `abandonSession(sessionId)`: Mark session as abandoned

#### Analytics

- `getSessionStatistics()`: Get platform-wide statistics
- `generateSummary(session)`: Generate session summary
- `recommendAvatar(profile?, context?)`: Get avatar recommendation

#### Utilities

- `generateSessionId()`: Generate unique session ID
- `generateId(prefix)`: Generate unique ID with prefix

## License

Part of the Shinka project - Customer Cloud Platform.
