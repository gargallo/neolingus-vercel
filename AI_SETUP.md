# AI SDK Integration - Environment Setup

## Required Environment Variables

Add the following to your `.env.local` file:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Existing variables (keep these)
# SUPABASE_URL=your_supabase_url
# SUPABASE_ANON_KEY=your_supabase_anon_key
# UPDATE_ACCESS_TOKEN=your_update_access_token
```

## How to Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to the API Keys section
4. Create a new API key
5. Copy the key and add it to your `.env.local` file

## Testing the Integration

Once you have added the OpenAI API key:

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Navigate to the protected content page (requires premium subscription)

3. Test the AI features:
   - **AI Exam Generator**: Creates custom language exams
   - **AI Tutor**: Provides real-time language learning assistance

## Features Available

### AI Exam Generator

- Generates exams for multiple languages (English, Valenciano, Spanish)
- Supports all CEFR levels (A1-C2)
- Creates questions for Reading, Listening, Writing, Speaking
- Follows official exam standards (Cambridge, CIEACOVA, Cervantes)

### AI Tutor

- Real-time streaming responses
- Grammar explanations
- Vocabulary help
- Pronunciation guidance
- Study tips and strategies

## API Endpoints

- `POST /api/generator` - Generate AI exams
- `GET /api/generator?prompt=question` - Stream AI tutoring responses

## Error Handling

The integration includes comprehensive error handling:

- Missing API key detection
- Entitlement checking (premium subscription required)
- AI response validation
- Network error recovery
