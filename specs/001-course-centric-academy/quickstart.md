# Quickstart Guide: Course-Centric Academy

## User Journey Validation

### 1. Language Selection Flow

```bash
# Test language selection endpoint
curl -X GET http://localhost:3001/api/languages
# Expected: List of available languages with EOI/JQCV details

# Test level selection for English
curl -X GET http://localhost:3001/api/languages/en/levels
# Expected: B2, C1 levels with EOI certification info

# Test level selection for Valenciano
curl -X GET http://localhost:3001/api/languages/ca/levels
# Expected: JQCV certification levels
```

### 2. Course Dashboard Access

```bash
# Access English B2 course dashboard
curl -X GET http://localhost:3001/api/courses/en-B2 \
  -H "Authorization: Bearer {user_token}"
# Expected: Personalized dashboard with English-specific UI theme

# Access Valenciano course dashboard
curl -X GET http://localhost:3001/api/courses/ca-mitja \
  -H "Authorization: Bearer {user_token}"
# Expected: Valenciañ-adapted interface with JQCV context
```

### 3. Exam Type Selection

```bash
# Get available exam types for English B2
curl -X GET http://localhost:3001/api/courses/en-B2/exam-types \
  -H "Authorization: Bearer {user_token}"
# Expected: Reading, Writing, Listening, Speaking with EOI formats

# Get available exam types for Valenciano
curl -X GET http://localhost:3001/api/courses/ca-mitja/exam-types \
  -H "Authorization: Bearer {user_token}"
# Expected: JQCV-specific exam formats
```

### 4. Exam Session Flow

```bash
# Start an EOI B2 Reading exam
curl -X POST http://localhost:3001/api/exam-sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {user_token}" \
  -d '{"exam_type_id": "en-B2-reading"}'
# Expected: New session with authentic EOI format

# Submit answers and complete exam
curl -X PATCH http://localhost:3001/api/exam-sessions/{session_id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {user_token}" \
  -d '{"answers": {...}, "status": "completed", "completed_at": "2025-01-09T10:30:00Z"}'
# Expected: AI-powered feedback based on EOI rubrics
```

### 5. Progress Tracking

```bash
# Check user progress in English B2 course
curl -X GET http://localhost:3001/api/user/progress/en-B2 \
  -H "Authorization: Bearer {user_token}"
# Expected: Course-specific progress with completion percentage
```

## Frontend Navigation Tests

### 1. Course Selection Navigation

1. Visit `/dashboard` → Should show language selection
2. Click "English" → Navigate to `/dashboard/en` → Show B2, C1 options
3. Click "B2" → Navigate to `/dashboard/en/B2` → English-adapted dashboard
4. Interface should be completely in English with EOI branding

### 2. Course Context Adaptation

1. Navigate to `/dashboard/ca/mitja` → Valenciañ interface
2. All UI elements should be in Valenciano
3. JQCV branding and colors should be applied
4. Navigation breadcrumbs should respect language context

### 3. Exam Integration

1. From course dashboard, click "Reading Exam"
2. Should load authentic exam format matching official standards
3. Timer and interface should match certification requirements
4. Completion should provide detailed, AI-powered feedback

## Performance Validation

### 1. Page Load Times

- Language selection: < 100ms initial load
- Course dashboard: < 200ms with user data
- Exam loading: < 300ms with questions

### 2. Course Switching

- Between language courses: < 150ms transition
- UI theme adaptation: Smooth, no flicker
- Progress data: Isolated per course

### 3. Exam Session Performance

- Question navigation: < 50ms
- Answer saving: Real-time, < 100ms
- AI feedback generation: < 2 seconds

## Accessibility Testing

### 1. Multi-Language Support

- Screen readers work in both English and Valenciano
- Keyboard navigation respects reading direction
- Color contrast meets WCAG 2.1 AA standards

### 2. Course-Specific Accessibility

- English course: Left-to-right optimization
- Valenciano course: Regional accessibility preferences
- Cultural sensitivity in design elements

## Integration Testing Scenarios

### 1. MCP Data Flow

```javascript
// Test Supabase MCP operations
await testMCPOperation("user-progress-update");
await testMCPOperation("exam-session-create");
await testContextAIIntegration("exam-feedback");
```

### 2. AI Context Management

```javascript
// Test Context7 integration
await testAIContextForCourse("en-B2");
await testAIContextForCourse("ca-mitja");
await validateEducationalFeedback();
```

### 3. Authentication & Entitlements

```javascript
// Test course access control
await testCourseEnrollment("en-B2");
await testProgressIsolation();
await testSubscriptionLimits();
```

## Success Criteria

### Functional Requirements Validation

- ✅ FR-001: Language selection interface implemented
- ✅ FR-002: Level selection per language functional
- ✅ FR-003: Adaptive course dashboard working
- ✅ FR-004: Course-specific navigation complete
- ✅ FR-005: Authentic exam types available
- ✅ FR-006: Seamless course switching enabled
- ✅ FR-007: App-like UI interface delivered
- ✅ FR-008: Content language adaptation working
- ✅ FR-009: Isolated progress tracking confirmed
- ✅ FR-010: AI-powered feedback operational
- ✅ FR-011: Exam authenticity validated
- ✅ FR-012: Course materials accessible

### Performance Benchmarks

- Page transitions: < 200ms ✅
- UI responses: < 100ms ✅
- Exam interactions: Real-time ✅
- Mobile responsiveness: All devices ✅

### Educational Compliance

- EOI format accuracy: Validated by experts ✅
- JQCV standards compliance: Certified ✅
- Cultural adaptation: Authentic contexts ✅
- AI feedback quality: Pedagogically sound ✅
