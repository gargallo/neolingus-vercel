# Research: Scoring Engine Implementation

**Date**: 2025-09-22
**Context**: Technical research for NeoLingus scoring engine implementation

## Technology Decisions

### AI Model Selection

**Decision**: Multi-model committee approach with GPT-4o-mini as primary and DeepSeek-R1 for consensus
**Rationale**:
- Reproducibility requirements (temperature=0) supported by both models
- Cost optimization through primary use of GPT-4o-mini
- Quality assurance through committee consensus and disagreement detection
- DeepSeek-R1 provides alternative perspective for complex scoring scenarios

**Alternatives considered**:
- Single model approach: Rejected due to lack of quality validation
- GPT-4 only: Rejected due to cost constraints for high-volume scoring
- Claude models: Considered but OpenAI models have better reproducibility controls

### Queue System Architecture

**Decision**: QStash/Upstash for managed queue processing with Next.js route handlers
**Rationale**:
- Serverless-first approach aligns with Vercel deployment
- Built-in retry mechanisms and dead letter queues
- Scales automatically with demand
- Integrates well with Next.js API routes

**Alternatives considered**:
- Redis Queue: Requires infrastructure management
- AWS SQS: Adds cloud provider dependency
- Database polling: Poor scalability and performance characteristics

### Database Schema Strategy

**Decision**: Dedicated scoring tables with optional foreign keys to existing exam_sessions
**Rationale**:
- Clean separation of concerns between exam simulation and scoring
- Maintains backward compatibility with existing system
- Enables independent evolution of scoring capabilities
- Supports multi-provider scoring requirements

**Alternatives considered**:
- Extended exam_sessions table: Rejected due to complexity and mixed concerns
- Separate database: Rejected due to transaction and consistency requirements
- NoSQL approach: Rejected due to relational requirements and existing PostgreSQL expertise

### Authentication & Authorization

**Decision**: JWT-based authentication with role-based scopes (score:read, score:write, rubric:admin)
**Rationale**:
- Aligns with existing Supabase auth patterns
- Granular permission control for different user types
- Stateless approach supports horizontal scaling
- Audit trail capabilities through token inspection

**Alternatives considered**:
- Session-based auth: Rejected due to scaling limitations
- API keys only: Rejected due to lack of user context
- OAuth integration: Considered for future external integrations

## Integration Patterns

### Supabase MCP Integration

**Decision**: Direct Supabase client usage with MCP tooling for complex operations
**Rationale**:
- Leverages existing project Supabase infrastructure
- MCP provides enhanced query capabilities for analytics
- Row Level Security policies align with multi-tenant requirements
- Real-time subscriptions support live scoring updates

**Implementation approach**:
- Primary operations through standard Supabase client
- Complex analytics and reporting through MCP queries
- Real-time updates for admin dashboards
- Backup/restore operations through MCP utilities

### AI SDK Integration

**Decision**: Vercel AI SDK for LLM interactions with custom prompt management
**Rationale**:
- Type-safe interactions with multiple model providers
- Built-in streaming and error handling
- Standardized prompt templating
- Performance monitoring and cost tracking

**Implementation strategy**:
- Versioned prompt templates stored in database
- Model-specific configuration per provider/level/task
- Fallback mechanisms for model unavailability
- Cost tracking per scoring attempt

## Performance Architecture

### Caching Strategy

**Decision**: Redis for hot data (active rubrics, model configurations) + PostgreSQL for persistence
**Rationale**:
- Sub-100ms response times for frequently accessed data
- Invalidation strategies for rubric updates
- Session data for long-running scoring operations
- Performance metrics aggregation

**Cache layers**:
- L1: In-memory Node.js cache (5 minutes TTL)
- L2: Redis cluster (1 hour TTL)
- L3: PostgreSQL with optimized indexes

### Scoring Pipeline Optimization

**Decision**: Async processing for Writing/Speaking, sync for Reading/Listening/UoE
**Rationale**:
- Complex tasks require AI processing time (10-30 seconds)
- Simple MCQ tasks can be scored immediately (<1 second)
- User experience optimization for different task types
- Resource utilization balancing

**Pipeline architecture**:
- Immediate feedback for objective tasks
- Progress tracking for subjective tasks
- Batch processing for efficiency gains
- Real-time updates through WebSocket/SSE

## Security & Privacy

### GDPR/LOPD Compliance

**Decision**: Data minimization with configurable retention periods and pseudonymization
**Rationale**:
- Legal requirement for European users
- User trust and data protection
- Audit trail requirements for educational assessment
- Right to erasure implementation

**Implementation approach**:
- PII minimization in scoring payloads
- Configurable data retention policies
- Pseudonymization of user identifiers
- Audit logging for all data access

### Audit Trail Requirements

**Decision**: Immutable event log with cryptographic hashing for scoring decisions
**Rationale**:
- Educational assessment requires evidence trail
- Appeal processes need detailed decision history
- Regulatory compliance for certification bodies
- Fraud detection and prevention

**Event tracking**:
- All scoring attempt state transitions
- Rubric changes and versioning
- User access patterns
- Model decision factors and evidence

## Quality Assurance

### Reproducibility Controls

**Decision**: Fixed seeds, versioned prompts, and deterministic model configurations
**Rationale**:
- Educational fairness requires consistent scoring
- Debugging and appeal processes need reproducible results
- A/B testing for model improvements
- Compliance with certification body requirements

**Implementation controls**:
- Seed value stored per attempt
- Prompt version tracking
- Model configuration snapshots
- Environment variable controls

### Calibration Strategy

**Decision**: Gold standard dataset with periodic model performance validation
**Rationale**:
- Maintains scoring accuracy over time
- Detects model drift and performance degradation
- Enables continuous improvement of scoring quality
- Provides confidence metrics for educational institutions

**Validation approach**:
- Expert-scored reference dataset
- Automated performance monitoring
- Alert systems for quality degradation
- Model update triggers based on performance metrics

## Cost Optimization

### Model Usage Patterns

**Decision**: Tiered model usage based on complexity and cost constraints
**Rationale**:
- Balance between quality and operational costs
- Scalable approach for different user tiers
- Resource allocation based on task complexity
- Performance guarantees within budget constraints

**Cost controls**:
- Token usage monitoring and alerting
- Model selection based on task complexity
- Batch processing for efficiency
- Circuit breakers for cost overruns

### Infrastructure Scaling

**Decision**: Serverless-first with managed services for operational simplicity
**Rationale**:
- Pay-per-use model aligns with variable workloads
- Automatic scaling without infrastructure management
- High availability through managed service guarantees
- Focus on application logic rather than operations

**Scaling strategy**:
- Vercel for application hosting
- Supabase for database and auth
- Upstash for queue and cache
- AI model provider APIs for processing

## Risk Mitigation

### Model Provider Dependencies

**Decision**: Multi-provider strategy with graceful degradation
**Rationale**:
- Reduces single point of failure risk
- Maintains service availability during provider outages
- Enables cost optimization through provider competition
- Quality improvement through model diversity

**Fallback strategy**:
- Primary model failure → Secondary model
- All models unavailable → Queue for later processing
- Partial results better than no results
- User notification of degraded service

### Data Loss Prevention

**Decision**: Immutable audit logs with distributed backup strategy
**Rationale**:
- Educational assessment data has long-term value
- Regulatory compliance requires data retention
- Business continuity during disasters
- User trust through data protection

**Backup approach**:
- Real-time replication to secondary region
- Daily encrypted backups to object storage
- Point-in-time recovery capabilities
- Disaster recovery procedures testing

## Implementation Timeline

### Phase Dependency Analysis

**Critical path dependencies**:
1. Database schema → API implementation → Frontend integration
2. Basic scoring → AI integration → Quality assurance
3. Authentication → Admin interface → Analytics dashboard

**Parallel development opportunities**:
- Frontend components while API is in development
- Test suite development alongside implementation
- Documentation creation during implementation
- Performance testing setup in parallel

### Risk Assessment

**High risk items**:
- AI model integration complexity
- Performance requirements under load
- GDPR compliance implementation
- Multi-provider scoring consistency

**Mitigation strategies**:
- Early prototype validation
- Load testing with realistic data
- Legal review of privacy implementation
- A/B testing of scoring algorithms

## Conclusion

The research validates the feasibility of implementing a comprehensive scoring engine with the chosen technology stack. Key technical decisions prioritize reproducibility, scalability, and compliance while maintaining development velocity and operational simplicity. The multi-model approach provides quality assurance while the serverless architecture ensures cost-effective scaling.

**Ready for Phase 1**: Data model design and API contracts can proceed with confidence in the technical foundation.