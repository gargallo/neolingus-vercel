# Real-time Features - Phase 3.5

This directory contains the real-time features implementation for the Neolingus academy system, providing live data synchronization across all components.

## 🚀 Features

### 1. Real-time Progress Updates (`progress-updates.ts`)
- **Live progress synchronization** across all user sessions
- **Intelligent debouncing and throttling** for performance optimization
- **Connection management** with automatic reconnection
- **Offline support** with sync queue
- **Multi-user progress synchronization**
- **Performance optimization** with batching

### 2. Real-time Exam Session Management (`exam-sessions.ts`)
- **Live exam session synchronization** across multiple users
- **Real-time state transitions** and progress tracking
- **Concurrent session management** with collision detection
- **Performance optimization** with intelligent caching
- **Comprehensive security** and integrity validation
- **Session analytics** and monitoring

### 3. AI Tutor Streaming (`ai-tutor-stream.ts`)
- **Streaming AI responses** with natural conversation flow
- **Multi-provider support** (OpenAI, Anthropic, Google)
- **Real-time typing indicators** and response streaming
- **Context-aware tutoring** with session persistence
- **Error handling** and retry mechanisms
- **Rate limiting** and usage monitoring

### 4. Unified Management (`index.ts`)
- **Centralized real-time manager** with cross-component coordination
- **Performance monitoring** and optimization
- **Error handling** and recovery coordination
- **Resource management** and cleanup

## 📦 Installation & Setup

The real-time features are already integrated into the Neolingus academy system. They use:

- **Supabase** for real-time database subscriptions
- **AI SDK** for streaming AI responses
- **Native WebSocket APIs** for network monitoring

## 🎯 Quick Start

### Basic Usage

```typescript
import { getUnifiedRealtimeManager } from '@/lib/realtime';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Get unified real-time manager
const realtimeManager = getUnifiedRealtimeManager(supabase);

// Subscribe to user progress updates
await realtimeManager.subscribeToUserProgress(userId, (update) => {
  console.log('Progress update:', update);
  // Update UI with new progress
});

// Subscribe to exam session updates
await realtimeManager.subscribeToExamSession(sessionId, (update) => {
  console.log('Session update:', update);
  // Update exam UI
});

// Start AI tutor conversation
await realtimeManager.startTutorConversation(context, userMessage, {
  onToken: (token, messageId) => {
    // Stream token to UI
    console.log('New token:', token);
  },
  onComplete: (message) => {
    // Handle complete response
    console.log('Complete message:', message);
  }
});
```

### React Integration

```tsx
import { useEffect, useState } from 'react';
import { getUnifiedRealtimeManager } from '@/lib/realtime';

function ProgressComponent({ userId, courseId }) {
  const [progress, setProgress] = useState(null);
  const [realtimeManager] = useState(() => getUnifiedRealtimeManager(supabase));

  useEffect(() => {
    // Subscribe to progress updates
    const subscription = realtimeManager.subscribeToUserCourseProgress(
      userId,
      courseId,
      (update) => {
        setProgress(update);
      }
    );

    return () => {
      // Cleanup on unmount
      realtimeManager.unsubscribe(subscription);
    };
  }, [userId, courseId]);

  return (
    <div>
      <h2>Progress: {progress?.overall_progress}%</h2>
      {/* Progress visualization */}
    </div>
  );
}
```

## 🔧 Configuration

### Progress Updates Options

```typescript
const progressOptions = {
  debounce_ms: 300,        // Debounce updates
  throttle_ms: 1000,       // Throttle updates  
  enable_batching: true,   // Batch multiple updates
  batch_size: 10,          // Maximum batch size
  offline_queue: true      // Enable offline support
};
```

### Exam Session Options

```typescript
const sessionOptions = {
  include_responses: true,      // Include response data
  include_presence: true,       // Enable presence tracking
  enable_collision_detection: true,  // Detect conflicts
  sync_interval_ms: 2000,      // Sync frequency
  heartbeat_interval_ms: 30000  // Heartbeat frequency
};
```

### AI Tutor Options

```typescript
const tutorOptions = {
  provider: 'openai',          // AI provider
  model: 'gpt-4o-mini',       // Model to use
  temperature: 0.7,           // Response creativity
  max_tokens: 1000,           // Maximum response length
  streaming: true,            // Enable streaming
  language: 'en',             // Response language
  rate_limit_rpm: 60          // Rate limit
};
```

## 📊 Monitoring & Health Checks

### Health Monitoring

```typescript
// Get comprehensive health status
const health = await realtimeManager.performHealthCheck();

console.log('Overall status:', health.overall_status);
console.log('Component status:', health.components);
console.log('Performance metrics:', health.performance);
console.log('Issues:', health.issues);
```

### Performance Stats

```typescript
// Get comprehensive statistics
const stats = realtimeManager.getComprehensiveStats();

console.log('Progress stats:', stats.progress);
console.log('Exam session stats:', stats.examSessions);
console.log('AI tutor stats:', stats.aiTutor);
console.log('Unified stats:', stats.unified);
```

## 🔄 Real-time Data Flow

### Progress Updates Flow
1. User completes exam question → Database updated
2. Supabase real-time trigger → Progress subscription notified
3. Update processed with debouncing → UI updated across all sessions
4. Cross-component sync → Related components notified

### Exam Session Flow
1. User starts/continues exam → Session state updated
2. Real-time subscription → All connected clients notified
3. Collision detection → Conflicts resolved
4. Presence tracking → Other users see activity

### AI Tutor Flow
1. User sends message → Streaming request initiated
2. AI response tokens → Streamed in real-time to UI
3. Complete response → Saved to conversation history
4. Context updated → Available for next interaction

## 🛡️ Error Handling & Recovery

### Automatic Recovery
- **Connection drops**: Automatic reconnection with exponential backoff
- **Rate limits**: Intelligent queuing and retry logic
- **Network issues**: Offline support with sync queue
- **Server errors**: Graceful degradation and fallback

### Error Callbacks
```typescript
const callbacks = {
  onError: (error, context) => {
    console.error('Real-time error:', error);
    // Handle error appropriately
  },
  onReconnect: () => {
    console.log('Connection restored');
    // Update UI state
  }
};
```

## 🎨 UI Integration Examples

### Progress Bar with Real-time Updates
```tsx
function RealtimeProgressBar({ userId, courseId }) {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const manager = getUnifiedRealtimeManager(supabase);
    
    manager.subscribeToUserCourseProgress(userId, courseId, (update) => {
      // Animate progress bar
      setProgress(update.overall_progress);
    });
  }, []);

  return (
    <div className="progress-bar">
      <div 
        className="progress-fill" 
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
```

### Streaming AI Responses
```tsx
function StreamingChatMessage({ message, isStreaming }) {
  return (
    <div className={`message ${isStreaming ? 'streaming' : 'complete'}`}>
      {message}
      {isStreaming && <TypingIndicator />}
    </div>
  );
}
```

### Live Exam Session Status
```tsx
function ExamSessionStatus({ sessionId }) {
  const [sessionState, setSessionState] = useState('unknown');
  const [participants, setParticipants] = useState([]);
  
  useEffect(() => {
    const manager = getUnifiedRealtimeManager(supabase);
    
    manager.subscribeToExamSession(sessionId, (update) => {
      setSessionState(update.current_state);
    });
    
    // Get presence data
    const presence = manager.getSessionPresence?.(sessionId) || [];
    setParticipants(presence);
  }, []);

  return (
    <div className="session-status">
      <span>Status: {sessionState}</span>
      <span>Participants: {participants.length}</span>
    </div>
  );
}
```

## 🔧 Advanced Configuration

### Custom Provider Setup
```typescript
// Custom AI provider configuration
const customTutorOptions = {
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.8,
  personality: 'encouraging',
  language: 'es',
  context_window: 15,
  enable_analytics: true
};
```

### Performance Optimization
```typescript
// High-performance configuration
const optimizedOptions = {
  progress: {
    debounce_ms: 100,     // Faster updates
    enable_batching: true,
    batch_size: 20        // Larger batches
  },
  examSessions: {
    sync_interval_ms: 1000,  // More frequent sync
    enable_collision_detection: true
  },
  enablePerformanceMonitoring: true,
  cleanupIntervalMs: 120000  // 2-minute cleanup
};
```

## 📈 Performance Considerations

### Memory Management
- **Automatic cleanup** of old subscriptions and cached data
- **Garbage collection** hints for optimal memory usage
- **Resource monitoring** with alerts for high usage

### Network Optimization
- **Intelligent batching** of updates to reduce network calls
- **Compression** of large data payloads
- **Connection pooling** for efficient resource usage

### Scalability Features
- **Multi-user support** with presence tracking
- **Horizontal scaling** ready architecture
- **Load balancing** across multiple connections

## 🚨 Troubleshooting

### Common Issues

**Connection Issues**
```typescript
// Check connection state
const health = await manager.performHealthCheck();
if (health.overall_status === 'unhealthy') {
  // Handle connection problems
}
```

**Rate Limiting**
```typescript
// Monitor rate limits
const rateLimits = manager.getRateLimitStatus?.() || {};
for (const [provider, status] of Object.entries(rateLimits)) {
  if (status.blocked_until) {
    console.warn(`Rate limited: ${provider}`);
  }
}
```

**Memory Issues**
```typescript
// Monitor memory usage
const stats = manager.getComprehensiveStats();
if (stats.unified.memory_usage > 100 * 1024 * 1024) { // 100MB
  console.warn('High memory usage detected');
}
```

## 🔒 Security Considerations

- **Authentication** required for all real-time subscriptions
- **Row-level security** enforced through Supabase policies
- **Rate limiting** to prevent abuse
- **Input validation** for all streaming content
- **Error sanitization** to prevent information leakage

## 📝 Migration Guide

If migrating from a previous version:

1. Update import paths to use the new unified manager
2. Replace individual manager instances with the unified manager
3. Update callback signatures to match new interfaces
4. Test real-time functionality across all components

## 🤝 Contributing

When adding new real-time features:

1. Follow the established patterns in existing managers
2. Add comprehensive error handling and recovery
3. Include performance monitoring hooks
4. Add TypeScript types and documentation
5. Test with multiple concurrent users
6. Consider offline scenarios

## 📚 API Reference

### Core Classes
- **`UnifiedRealtimeManager`**: Central coordination and management
- **`RealtimeProgressManager`**: Progress update synchronization
- **`RealtimeExamSessionManager`**: Exam session real-time management  
- **`AiTutorStreamManager`**: AI streaming conversation management

### Key Methods
- `subscribeToUserProgress()`: Subscribe to user progress updates
- `subscribeToExamSession()`: Subscribe to exam session changes
- `startTutorConversation()`: Begin streaming AI conversation
- `performHealthCheck()`: Get system health status
- `getComprehensiveStats()`: Get performance statistics

### Type Definitions
- **`ProgressUpdate`**: Progress change notification
- **`SessionUpdate`**: Exam session change notification
- **`StreamingMessage`**: AI tutor message with streaming state
- **`RealtimeHealthStatus`**: System health information

For detailed API documentation, see the TypeScript definitions in each component file.