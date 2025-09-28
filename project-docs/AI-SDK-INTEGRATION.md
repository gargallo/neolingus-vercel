# AI SDK Core Integration Documentation

## Overview

This document describes the integration of Vercel's AI SDK Core into the Neolingus language learning platform. The integration provides AI-powered exam generation and real-time tutoring capabilities.

## Architecture

### Components Added

```
src/
├── app/api/generator/route.ts          # AI API endpoints
├── hooks/use-exam-generator.ts         # React hooks for AI features
├── components/
│   ├── ai-exam-generator.tsx          # Exam generation UI
│   └── ai-tutor.tsx                   # AI tutoring interface
└── app/protected/paid-content/page.tsx # Updated UI showcase
```

### Dependencies

- `ai` (^3.4.32) - Core AI SDK
- `@ai-sdk/openai` (^0.0.66) - OpenAI provider
- `@radix-ui/react-tabs` (^1.1.2) - UI components

## API Endpoints

### POST /api/generator

Generates AI-powered language exams.

**Request Body:**

```typescript
interface ExamGenerationRequest {
  examType: "reading" | "listening" | "writing" | "speaking";
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  language: "english" | "valenciano" | "spanish";
  topic?: string;
  questionCount?: number;
  provider?: "cambridge" | "cieacova" | "cervantes";
}
```

**Response:**

```typescript
interface GeneratedExam {
  success: boolean;
  exam: ExamContent;
  metadata: {
    examType: string;
    level: string;
    language: string;
    provider: string;
    generatedAt: string;
    questionCount: number;
  };
}
```

**Example Usage:**

```javascript
const response = await fetch("/api/generator", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    examType: "reading",
    level: "B2",
    language: "english",
    questionCount: 15,
    provider: "cambridge",
  }),
});
```

### GET /api/generator

Streams AI tutoring responses in real-time.

**Query Parameters:**

- `prompt` (string) - The question to ask the AI tutor

**Response:**

- Streaming text response using AI SDK's `streamText()`

**Example Usage:**

```javascript
const response = await fetch(
  "/api/generator?prompt=Explain past perfect tense"
);
const reader = response.body.getReader();
// Handle streaming response...
```

## React Hooks

### useExamGenerator()

Manages state for AI exam generation.

**Returns:**

```typescript
{
  generateExam: (request: ExamGenerationRequest) => Promise<GeneratedExam | null>;
  isGenerating: boolean;
  error: string | null;
  generatedExam: GeneratedExam | null;
  reset: () => void;
}
```

### useAIStreaming()

Handles real-time AI response streaming.

**Returns:**

```typescript
{
  streamResponse: (prompt: string) => Promise<void>;
  isStreaming: boolean;
  streamedContent: string;
  error: string | null;
  resetStream: () => void;
}
```

## Components

### AIExamGenerator

Full-featured exam generation interface with form controls and result display.

**Features:**

- Form inputs for exam configuration
- Real-time generation status
- Question preview with answers and explanations
- Error handling and validation

### AITutor

Interactive AI tutoring component with streaming responses.

**Features:**

- Text input for custom questions
- Predefined quick questions
- Real-time streaming responses
- Session history tracking

## Security & Access Control

- **Authentication**: Requires valid Supabase session
- **Authorization**: Premium subscription required (Update.dev entitlements)
- **API Key**: OpenAI API key must be configured in environment variables
- **Rate Limiting**: Handled by OpenAI API limits

## Error Handling

### API Level

- Missing API key validation
- Entitlement checking
- AI response parsing validation
- Network error responses

### UI Level

- Loading states during generation/streaming
- Error message display
- Form validation
- Graceful degradation

## Environment Configuration

Required environment variables:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-...

# Existing variables
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
UPDATE_ACCESS_TOKEN=upd_...
```

## Performance Considerations

- **Streaming**: Real-time responses for better UX
- **Caching**: AI responses could be cached for repeated questions
- **Rate Limiting**: Consider implementing client-side rate limiting
- **Token Usage**: Monitor OpenAI token consumption

## Future Enhancements

1. **Caching Layer**: Redis for frequently generated exams
2. **Custom Models**: Fine-tuned models for specific exam types
3. **Voice Integration**: Text-to-speech for pronunciation help
4. **Analytics**: Track AI usage and effectiveness
5. **Multi-modal**: Image and audio question support

## Testing

### Manual Testing

1. Start dev server: `npm run dev`
2. Navigate to protected content (premium required)
3. Test exam generation with various parameters
4. Test AI tutor with different questions

### Automated Testing

```bash
# Test API endpoints
curl -X POST http://localhost:3001/api/generator \
  -H "Content-Type: application/json" \
  -d '{"examType":"reading","level":"B2","language":"english"}'
```

## Troubleshooting

### Common Issues

1. **"OpenAI API key not configured"**

   - Add `OPENAI_API_KEY` to `.env.local`

2. **"Premium subscription required"**

   - Ensure user has active premium subscription
   - Check Update.dev entitlement configuration

3. **"Failed to generate valid exam content"**

   - Check OpenAI API key validity
   - Verify network connectivity
   - Review AI prompt structure

4. **Streaming not working**
   - Ensure browser supports streaming
   - Check network proxy settings
   - Verify API endpoint accessibility

## Monitoring & Analytics

Consider tracking:

- Exam generation success/failure rates
- Average generation time
- Popular exam types and levels
- AI tutor question patterns
- Token usage and costs

## Compliance & Privacy

- AI responses are not stored by default
- User questions may be logged for debugging
- OpenAI usage follows their data usage policies
- Consider implementing data retention policies
