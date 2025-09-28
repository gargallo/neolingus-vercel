# Universal Exam Simulator - Complete Developer Documentation

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Universal Data Model](#universal-data-model)
3. [System Architecture](#system-architecture)
4. [Database Schema](#database-schema)
5. [API Specification](#api-specification)
6. [AI Integration & Scoring](#ai-integration--scoring)
7. [Multi-Site Deployment](#multi-site-deployment)
8. [Implementation Examples](#implementation-examples)

## Executive Summary

The Universal Exam Simulator is a comprehensive platform designed to handle multi-language, multi-level language proficiency exams across different educational institutions. Based on analysis of Cambridge English, EOI, and CIEACOVA exam formats, this system supports:

- **Languages**: English, Valenciano (extensible to other languages)
- **Levels**: A2, B1, B2, C1, C2 (CEFR framework)
- **Question Types**: Multiple choice, gap fill, essay writing, listening comprehension, speaking assessment
- **Institutions**: Cambridge, EOI, CIEACOVA, and custom institutions
- **Deployment**: Multi-site with centralized management and analytics

### Key Features
- ⏱️ **Real-time timer management** with auto-save
- 📊 **Progress tracking** across exam sections
- 🤖 **AI-powered scoring** for objective and subjective questions
- 🌐 **Multi-site deployment** with shared analytics
- 📱 **Responsive design** for all devices
- 🔒 **Secure data storage** with GDPR compliance
- 📈 **Analytics dashboard** for institutions and learners

## Universal Data Model

### Exam Configuration Schema

```json
{
  "examId": "cambridge_b2_first_2022",
  "metadata": {
    "title": "Cambridge B2 First (FCE)",
    "institution": "Cambridge English",
    "language": "english",
    "level": "B2",
    "year": 2022,
    "officialExam": true,
    "duration": 210,
    "totalQuestions": 52
  },
  "sections": [
    {
      "id": "reading_writing",
      "name": "Reading & Use of English",
      "duration": 75,
      "icon": "fas fa-book-open",
      "parts": [
        {
          "partId": "part1",
          "name": "Multiple Choice Cloze",
          "instructions": "For questions 1-8, read the text below and decide which answer (A, B, C or D) best fits each gap.",
          "questionType": "multiple_choice",
          "questionCount": 8,
          "text": {
            "title": "The Future of Work",
            "content": "The world of work is changing rapidly, and many experts believe that the changes we are witnessing today are just the beginning. Technological advances are <strong>(1) ____</strong> the way we work..."
          },
          "questions": [
            {
              "id": "q1",
              "number": 1,
              "options": [
                {"value": "A", "text": "converting"},
                {"value": "B", "text": "transforming"},
                {"value": "C", "text": "altering"},
                {"value": "D", "text": "modifying"}
              ],
              "correctAnswer": "B",
              "points": 1
            }
          ]
        }
      ]
    }
  ],
  "scoring": {
    "passingScore": 60,
    "maxScore": 100,
    "weightings": {
      "reading_writing": 0.25,
      "listening": 0.25,
      "writing": 0.25,
      "speaking": 0.25
    }
  }
}
```

### Valenciano Exam Example

```json
{
  "examId": "cieacova_c1_valencia_2025",
  "metadata": {
    "title": "Examen C1 Valencià",
    "institution": "CIEACOVA",
    "language": "valenciano",
    "level": "C1",
    "year": 2025,
    "duration": 150,
    "totalQuestions": 35
  },
  "sections": [
    {
      "id": "comprensio_lectora",
      "name": "Comprensió lectora",
      "duration": 45,
      "icon": "fas fa-book-open",
      "parts": [
        {
          "partId": "text1",
          "name": "La sostenibilitat en les ciutats valencianes",
          "questionType": "multiple_choice",
          "questionCount": 8,
          "text": {
            "title": "Cap a unes ciutats més sostenibles",
            "content": "La Comunitat Valenciana està <strong>(1) ____</strong> un procés de transformació urbana..."
          },
          "questions": [
            {
              "id": "p1",
              "number": 1,
              "options": [
                {"value": "A", "text": "iniciant"},
                {"value": "B", "text": "començant"},
                {"value": "C", "text": "desenvolupant"},
                {"value": "D", "text": "executant"}
              ],
              "correctAnswer": "C",
              "points": 1
            }
          ]
        }
      ]
    }
  ]
}
```

### Question Types Supported

```typescript
type QuestionType = 
  | 'multiple_choice'      // A, B, C, D options
  | 'gap_fill'            // Single word or phrase
  | 'essay'               // Long-form writing
  | 'listening_multiple'   // Audio + multiple choice
  | 'speaking_response'    // Audio recording
  | 'mediation'           // Language transfer task
  | 'reading_comprehension' // Text analysis

interface Question {
  id: string;
  number: number;
  type: QuestionType;
  points: number;
  correctAnswer?: string | string[];
  audioFile?: string;
  maxWords?: number;
  timeLimit?: number;
  rubric?: ScoringRubric;
}
```

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                            │
├─────────────────────────────────────────────────────────────┤
│  React/Vue/Vanilla JS │  Timer System  │  Progress Tracker  │
│  Exam Interface       │  Auto-save     │  Navigation        │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                              │
├─────────────────────────────────────────────────────────────┤
│  Authentication       │  Rate Limiting │  Request Router    │
│  Multi-tenant         │  Caching       │  API Versioning    │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                  Backend Services                           │
├─────────────────────────────────────────────────────────────┤
│  Exam Service    │  User Service    │  Scoring Service     │
│  Timer Service   │  Progress Service │  Analytics Service   │
│  Audio Service   │  AI Service      │  Notification Service│
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL      │  Redis Cache     │  File Storage (S3)   │
│  User Data       │  Session Data    │  Audio Files         │
│  Exam Results    │  Real-time Data  │  PDFs, Images        │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. Exam Engine
```typescript
class UniversalExamEngine {
  private examConfig: ExamConfiguration;
  private userSession: UserSession;
  private timer: ExamTimer;
  private progressTracker: ProgressTracker;
  private scorer: ScoringEngine;

  async loadExam(examId: string): Promise<void> {
    this.examConfig = await this.examService.getExam(examId);
    this.initializeSession();
  }

  async submitAnswer(questionId: string, answer: any): Promise<void> {
    await this.progressTracker.recordAnswer(questionId, answer);
    await this.autoSave();
  }

  async finishExam(): Promise<ExamResult> {
    const result = await this.scorer.calculateScore(
      this.userSession.answers,
      this.examConfig
    );
    await this.saveResult(result);
    return result;
  }
}
```

#### 2. Timer System
```typescript
class ExamTimer {
  private timeRemaining: number;
  private isPaused: boolean = false;
  private warnings: TimeWarning[];
  private callbacks: TimerCallback[];

  start(): void {
    this.interval = setInterval(() => {
      if (!this.isPaused && this.timeRemaining > 0) {
        this.timeRemaining--;
        this.checkWarnings();
        this.notifyCallbacks();
        
        if (this.timeRemaining === 0) {
          this.timeUp();
        }
      }
    }, 1000);
  }

  addWarning(minutesRemaining: number, message: string): void {
    this.warnings.push({
      triggerTime: minutesRemaining * 60,
      message,
      triggered: false
    });
  }
}
```

#### 3. Progress Tracker
```typescript
class ProgressTracker {
  private userAnswers: Map<string, Answer>;
  private sectionProgress: Map<string, SectionProgress>;
  private autoSaveInterval: number = 60; // seconds

  recordAnswer(questionId: string, answer: Answer): void {
    this.userAnswers.set(questionId, answer);
    this.updateProgress();
    this.scheduleAutoSave();
  }

  getSectionProgress(sectionId: string): SectionProgress {
    const section = this.examConfig.sections.find(s => s.id === sectionId);
    const totalQuestions = section.parts.reduce((sum, part) => sum + part.questionCount, 0);
    const answeredQuestions = this.getAnsweredQuestionsInSection(sectionId);
    
    return {
      sectionId,
      totalQuestions,
      answeredQuestions,
      percentage: (answeredQuestions / totalQuestions) * 100
    };
  }
}
```

## Database Schema

### PostgreSQL Schema

```sql
-- Institutions table
CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    language VARCHAR(10) NOT NULL,
    country VARCHAR(2) NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Exams table  
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id VARCHAR(100) UNIQUE NOT NULL,
    institution_id UUID REFERENCES institutions(id),
    title VARCHAR(255) NOT NULL,
    language VARCHAR(10) NOT NULL,
    level VARCHAR(5) NOT NULL,
    year INTEGER,
    duration INTEGER NOT NULL, -- minutes
    total_questions INTEGER NOT NULL,
    passing_score INTEGER NOT NULL,
    configuration JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    institution_id UUID REFERENCES institutions(id),
    role VARCHAR(50) DEFAULT 'student',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Exam sessions table
CREATE TABLE exam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    exam_id UUID REFERENCES exams(id),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'in_progress',
    started_at TIMESTAMP DEFAULT NOW(),
    finished_at TIMESTAMP,
    time_remaining INTEGER,
    current_section VARCHAR(100),
    auto_save_data JSONB DEFAULT '{}',
    browser_info JSONB DEFAULT '{}',
    ip_address INET
);

-- User answers table
CREATE TABLE user_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES exam_sessions(id),
    question_id VARCHAR(100) NOT NULL,
    answer JSONB NOT NULL,
    answered_at TIMESTAMP DEFAULT NOW(),
    time_spent INTEGER, -- seconds
    attempts INTEGER DEFAULT 1,
    is_final BOOLEAN DEFAULT false
);

-- Exam results table
CREATE TABLE exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES exam_sessions(id),
    user_id UUID REFERENCES users(id),
    exam_id UUID REFERENCES exams(id),
    total_score DECIMAL(5,2) NOT NULL,
    section_scores JSONB NOT NULL,
    detailed_scores JSONB NOT NULL,
    passed BOOLEAN NOT NULL,
    feedback JSONB DEFAULT '{}',
    ai_analysis JSONB DEFAULT '{}',
    graded_at TIMESTAMP DEFAULT NOW(),
    graded_by UUID REFERENCES users(id)
);

-- Audio recordings table (for speaking sections)
CREATE TABLE audio_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES exam_sessions(id),
    question_id VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    duration INTEGER, -- seconds
    transcription TEXT,
    ai_score DECIMAL(5,2),
    human_score DECIMAL(5,2),
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES exam_sessions(id),
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_exam_sessions_user_exam ON exam_sessions(user_id, exam_id);
CREATE INDEX idx_user_answers_session ON user_answers(session_id);
CREATE INDEX idx_exam_results_user ON exam_results(user_id);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);
```

### Redis Schema (Caching & Sessions)

```typescript
// Session data structure in Redis
interface SessionData {
  userId: string;
  examId: string;
  startTime: number;
  timeRemaining: number;
  currentSection: string;
  answers: Record<string, any>;
  progress: {
    totalQuestions: number;
    answeredQuestions: number;
    sectionProgress: Record<string, number>;
  };
  lastActivity: number;
}

// Cache keys pattern
const CACHE_KEYS = {
  session: (sessionId: string) => `session:${sessionId}`,
  examConfig: (examId: string) => `exam:${examId}`,
  userProgress: (userId: string, examId: string) => `progress:${userId}:${examId}`,
  leaderboard: (examId: string) => `leaderboard:${examId}`,
  analytics: (institutionId: string) => `analytics:${institutionId}`
};
```

## API Specification

### Authentication Endpoints

```typescript
// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
  institutionCode: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
  permissions: string[];
}

// POST /api/auth/refresh
interface RefreshRequest {
  refreshToken: string;
}
```

### Exam Management Endpoints

```typescript
// GET /api/exams
interface ExamListResponse {
  exams: ExamSummary[];
  pagination: PaginationInfo;
}

// GET /api/exams/:examId
interface ExamDetailResponse {
  exam: ExamConfiguration;
  userStats?: UserExamStats;
  institutionStats?: InstitutionExamStats;
}

// POST /api/exams/:examId/sessions
interface StartExamRequest {
  browserInfo: BrowserInfo;
  timezone: string;
}

interface StartExamResponse {
  sessionId: string;
  sessionToken: string;
  examConfig: ExamConfiguration;
  timeRemaining: number;
}
```

### Session Management Endpoints

```typescript
// GET /api/sessions/:sessionId
interface SessionStatusResponse {
  sessionId: string;
  status: 'in_progress' | 'paused' | 'completed' | 'expired';
  timeRemaining: number;
  currentSection: string;
  progress: ProgressInfo;
  answers: UserAnswers;
}

// POST /api/sessions/:sessionId/answers
interface SubmitAnswerRequest {
  questionId: string;
  answer: any;
  timeSpent: number;
}

// POST /api/sessions/:sessionId/pause
interface PauseSessionRequest {
  reason?: string;
}

// POST /api/sessions/:sessionId/resume
interface ResumeSessionRequest {
  browserInfo: BrowserInfo;
}

// POST /api/sessions/:sessionId/finish
interface FinishExamRequest {
  finalAnswers: UserAnswers;
}

interface FinishExamResponse {
  resultId: string;
  preliminaryScore?: number;
  estimatedGradingTime: number;
}
```

### Scoring & Results Endpoints

```typescript
// GET /api/results/:resultId
interface ExamResultResponse {
  result: ExamResult;
  detailedFeedback: DetailedFeedback;
  suggestions: LearningPath[];
}

// GET /api/users/:userId/results
interface UserResultsResponse {
  results: ExamResultSummary[];
  analytics: UserAnalytics;
  progression: LearningProgression;
}
```

### Analytics Endpoints

```typescript
// GET /api/analytics/institutions/:institutionId
interface InstitutionAnalyticsResponse {
  overview: InstitutionOverview;
  examPerformance: ExamPerformanceStats[];
  userEngagement: UserEngagementStats;
  commonMistakes: CommonMistake[];
}

// GET /api/analytics/exams/:examId
interface ExamAnalyticsResponse {
  overview: ExamOverview;
  questionDifficulty: QuestionDifficultyStats[];
  timeAnalysis: TimeAnalysisStats;
  improvementAreas: ImprovementArea[];
}
```

## AI Integration & Scoring

### Objective Question Scoring

```typescript
class ObjectiveScorer {
  async scoreMultipleChoice(
    answer: string,
    correctAnswer: string
  ): Promise<ScoreResult> {
    const isCorrect = answer.toLowerCase() === correctAnswer.toLowerCase();
    return {
      score: isCorrect ? 1 : 0,
      feedback: isCorrect ? 'Correct!' : `Incorrect. The correct answer is ${correctAnswer}`,
      confidence: 1.0
    };
  }

  async scoreGapFill(
    answer: string,
    correctAnswers: string[]
  ): Promise<ScoreResult> {
    const normalizedAnswer = this.normalizeAnswer(answer);
    const isCorrect = correctAnswers.some(correct => 
      this.normalizeAnswer(correct) === normalizedAnswer
    );

    return {
      score: isCorrect ? 1 : 0,
      feedback: this.generateGapFillFeedback(answer, correctAnswers, isCorrect),
      confidence: isCorrect ? 1.0 : 0.95
    };
  }

  private normalizeAnswer(answer: string): string {
    return answer.toLowerCase().trim().replace(/[^\w\s]/g, '');
  }
}
```

### AI-Assisted Essay Scoring

```typescript
interface EssayScoring {
  openai: OpenAIService;
  rubric: ScoringRubric;

  async scoreEssay(
    essay: string,
    prompt: string,
    rubric: ScoringRubric
  ): Promise<EssayScoreResult> {
    const analysis = await this.openai.analyze({
      text: essay,
      prompt: prompt,
      rubric: rubric,
      language: this.getLanguage(),
      level: this.getLevel()
    });

    return {
      totalScore: analysis.totalScore,
      criteriaScores: {
        content: analysis.content,
        organization: analysis.organization,
        language: analysis.language,
        mechanics: analysis.mechanics
      },
      strengths: analysis.strengths,
      improvementAreas: analysis.improvementAreas,
      detailedFeedback: analysis.feedback,
      confidence: analysis.confidence
    };
  }
}

// OpenAI Prompt for Essay Scoring
const ESSAY_SCORING_PROMPT = `
You are an expert language examiner for {language} at {level} level.

Please score this essay based on the following rubric:
{rubric}

Essay prompt: {prompt}
Student essay: {essay}

Provide:
1. Scores for each criteria (0-5 scale)
2. Overall score
3. Specific strengths
4. Areas for improvement
5. Detailed constructive feedback

Respond in JSON format.
`;
```

### Speaking Assessment AI

```typescript
class SpeakingAssessment {
  private speechToText: SpeechToTextService;
  private languageAnalyzer: LanguageAnalyzerService;

  async assessSpeaking(
    audioFile: string,
    prompt: string,
    rubric: SpeakingRubric
  ): Promise<SpeakingScoreResult> {
    // 1. Transcribe audio
    const transcription = await this.speechToText.transcribe(audioFile);
    
    // 2. Analyze pronunciation
    const pronunciationScore = await this.analyzePronunciation(audioFile);
    
    // 3. Analyze fluency and content
    const contentAnalysis = await this.languageAnalyzer.analyze({
      text: transcription.text,
      prompt: prompt,
      audioMetrics: transcription.metrics
    });

    return {
      transcription: transcription.text,
      pronunciationScore: pronunciationScore,
      fluencyScore: contentAnalysis.fluency,
      contentScore: contentAnalysis.content,
      grammarScore: contentAnalysis.grammar,
      totalScore: this.calculateTotalScore(rubric, {
        pronunciation: pronunciationScore,
        fluency: contentAnalysis.fluency,
        content: contentAnalysis.content,
        grammar: contentAnalysis.grammar
      }),
      feedback: this.generateSpeakingFeedback(contentAnalysis),
      confidence: Math.min(transcription.confidence, contentAnalysis.confidence)
    };
  }
}
```

### ML-Based Question Difficulty Analysis

```typescript
class QuestionDifficultyAnalyzer {
  private mlModel: MachineLearningService;

  async analyzeQuestionDifficulty(
    questionId: string,
    responses: UserResponse[]
  ): Promise<DifficultyAnalysis> {
    const features = this.extractFeatures(responses);
    
    const analysis = await this.mlModel.predict({
      model: 'question_difficulty',
      features: features
    });

    return {
      difficultyLevel: analysis.difficulty, // 'easy' | 'medium' | 'hard'
      successRate: this.calculateSuccessRate(responses),
      averageTimeSpent: this.calculateAverageTime(responses),
      commonMistakes: this.identifyCommonMistakes(responses),
      recommendedReview: analysis.needsReview,
      confidence: analysis.confidence
    };
  }

  private extractFeatures(responses: UserResponse[]): MLFeatures {
    return {
      totalResponses: responses.length,
      correctResponses: responses.filter(r => r.isCorrect).length,
      averageTimeSpent: responses.reduce((sum, r) => sum + r.timeSpent, 0) / responses.length,
      abandonmentRate: responses.filter(r => r.abandoned).length / responses.length,
      multipleAttempts: responses.filter(r => r.attempts > 1).length / responses.length
    };
  }
}
```

## Multi-Site Deployment

### Docker Configuration

```dockerfile
# Dockerfile for the main application
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS build
COPY . .
RUN npm run build

FROM base AS runtime
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml for full stack deployment
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/exams
      - REDIS_URL=redis://redis:6379
      - AWS_S3_BUCKET=${S3_BUCKET}
    depends_on:
      - postgres
      - redis
    volumes:
      - ./uploads:/app/uploads

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=exams
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  postgres_data:
  redis_data:
```

### Multi-Tenant Configuration

```typescript
// Multi-tenant middleware
class MultiTenantMiddleware {
  async identifyTenant(req: Request): Promise<Tenant> {
    // Method 1: Subdomain-based
    const subdomain = this.extractSubdomain(req.headers.host);
    if (subdomain) {
      return await this.tenantService.getBySubdomain(subdomain);
    }

    // Method 2: Custom domain
    const customDomain = req.headers.host;
    const tenant = await this.tenantService.getByCustomDomain(customDomain);
    if (tenant) return tenant;

    // Method 3: Institution code in header
    const institutionCode = req.headers['x-institution-code'];
    if (institutionCode) {
      return await this.tenantService.getByCode(institutionCode);
    }

    throw new Error('Unable to identify tenant');
  }

  async configureTenant(tenant: Tenant): Promise<TenantConfig> {
    return {
      database: {
        schema: tenant.databaseSchema,
        connectionPool: tenant.connectionPoolSize
      },
      features: tenant.enabledFeatures,
      branding: tenant.brandingConfig,
      localization: tenant.localizationSettings,
      integrations: tenant.integrationConfigs
    };
  }
}
```

### Environment Configuration

```typescript
// Environment-specific configurations
interface EnvironmentConfig {
  development: {
    database: {
      host: 'localhost';
      port: 5432;
      ssl: false;
    };
    redis: {
      host: 'localhost';
      port: 6379;
    };
    ai: {
      openaiKey: string;
      useCache: true;
    };
    features: {
      enableRecording: true;
      enableAnalytics: true;
      enableAI: true;
    };
  };
  production: {
    database: {
      host: process.env.DB_HOST;
      port: parseInt(process.env.DB_PORT);
      ssl: true;
      poolSize: 20;
    };
    redis: {
      cluster: string[];
      tls: true;
    };
    ai: {
      openaiKey: process.env.OPENAI_API_KEY;
      useCache: true;
      rateLimit: 100;
    };
    features: {
      enableRecording: true;
      enableAnalytics: true;
      enableAI: true;
    };
  };
}
```

### Load Balancing & Scaling

```yaml
# kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: exam-simulator
spec:
  replicas: 3
  selector:
    matchLabels:
      app: exam-simulator
  template:
    metadata:
      labels:
        app: exam-simulator
    spec:
      containers:
      - name: app
        image: exam-simulator:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: exam-simulator-service
spec:
  selector:
    app: exam-simulator
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## Implementation Examples

### Frontend Integration Example

```typescript
// React component for universal exam interface
import React, { useEffect, useState } from 'react';
import { ExamEngine } from '../services/ExamEngine';
import { TimerComponent } from '../components/Timer';
import { ProgressTracker } from '../components/ProgressTracker';
import { QuestionRenderer } from '../components/QuestionRenderer';

interface UniversalExamProps {
  examId: string;
  userId: string;
  sessionToken?: string;
}

export const UniversalExamSimulator: React.FC<UniversalExamProps> = ({
  examId,
  userId,
  sessionToken
}) => {
  const [examEngine] = useState(new ExamEngine());
  const [examConfig, setExamConfig] = useState(null);
  const [currentSection, setCurrentSection] = useState(null);
  const [progress, setProgress] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    initializeExam();
  }, [examId]);

  const initializeExam = async () => {
    try {
      if (sessionToken) {
        // Resume existing session
        await examEngine.resumeSession(sessionToken);
      } else {
        // Start new session
        await examEngine.startNewSession(examId, userId);
      }

      const config = await examEngine.getExamConfig();
      setExamConfig(config);
      setCurrentSection(config.sections[0]);
      
      // Initialize timer
      examEngine.onTimeUpdate((time) => setTimeRemaining(time));
      examEngine.onProgressUpdate((prog) => setProgress(prog));
      
      examEngine.startTimer();
    } catch (error) {
      console.error('Failed to initialize exam:', error);
    }
  };

  const handleAnswerSubmit = async (questionId: string, answer: any) => {
    try {
      await examEngine.submitAnswer(questionId, answer);
      // Progress will be updated via the callback
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  const handleSectionChange = (sectionId: string) => {
    const section = examConfig?.sections.find(s => s.id === sectionId);
    if (section) {
      setCurrentSection(section);
      examEngine.setCurrentSection(sectionId);
    }
  };

  if (!examConfig || !currentSection) {
    return <div>Loading exam...</div>;
  }

  return (
    <div className="universal-exam-simulator">
      <header className="exam-header">
        <div className="exam-info">
          <h1>{examConfig.metadata.title}</h1>
          <span className="exam-meta">
            {examConfig.metadata.institution} | {examConfig.metadata.level}
          </span>
        </div>
        <TimerComponent 
          timeRemaining={timeRemaining}
          onPause={() => examEngine.pauseTimer()}
          onResume={() => examEngine.resumeTimer()}
        />
      </header>

      <nav className="section-navigation">
        {examConfig.sections.map(section => (
          <button
            key={section.id}
            className={`nav-pill ${section.id === currentSection.id ? 'active' : ''}`}
            onClick={() => handleSectionChange(section.id)}
          >
            <i className={section.icon}></i>
            {section.name}
            <span className="section-time">{section.duration}m</span>
          </button>
        ))}
      </nav>

      <ProgressTracker 
        progress={progress}
        totalQuestions={examConfig.metadata.totalQuestions}
      />

      <main className="exam-content">
        {currentSection.parts.map(part => (
          <div key={part.partId} className="exam-part">
            <div className="part-header">
              <h3>{part.name}</h3>
              <p>{part.instructions}</p>
            </div>
            
            {part.text && (
              <div className="text-passage">
                <h4>{part.text.title}</h4>
                <div dangerouslySetInnerHTML={{ __html: part.text.content }} />
              </div>
            )}

            <div className="questions-container">
              {part.questions.map(question => (
                <QuestionRenderer
                  key={question.id}
                  question={question}
                  onAnswerChange={(answer) => handleAnswerSubmit(question.id, answer)}
                />
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};
```

### Backend API Implementation

```typescript
// Express.js API implementation
import express from 'express';
import { ExamService } from '../services/ExamService';
import { SessionService } from '../services/SessionService';
import { ScoringService } from '../services/ScoringService';
import { AnalyticsService } from '../services/AnalyticsService';

const router = express.Router();

// Start new exam session
router.post('/exams/:examId/sessions', async (req, res) => {
  try {
    const { examId } = req.params;
    const { userId } = req.user;
    const { browserInfo, timezone } = req.body;

    const examConfig = await ExamService.getExam(examId);
    if (!examConfig) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const session = await SessionService.createSession({
      userId,
      examId,
      browserInfo,
      timezone
    });

    // Initialize analytics tracking
    await AnalyticsService.trackEvent(session.id, 'exam_started', {
      examId,
      userId,
      timestamp: new Date()
    });

    res.json({
      sessionId: session.id,
      sessionToken: session.token,
      examConfig: examConfig,
      timeRemaining: examConfig.metadata.duration * 60
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit answer
router.post('/sessions/:sessionId/answers', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questionId, answer, timeSpent } = req.body;

    const session = await SessionService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await SessionService.recordAnswer(sessionId, {
      questionId,
      answer,
      timeSpent,
      timestamp: new Date()
    });

    // Auto-save session state
    await SessionService.autoSave(sessionId);

    // Track analytics
    await AnalyticsService.trackEvent(sessionId, 'answer_submitted', {
      questionId,
      timeSpent
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Finish exam
router.post('/sessions/:sessionId/finish', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await SessionService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Mark session as completed
    await SessionService.finishSession(sessionId);

    // Start scoring process
    const result = await ScoringService.scoreExam(session);

    // Track completion
    await AnalyticsService.trackEvent(sessionId, 'exam_completed', {
      finalScore: result.totalScore,
      completionTime: new Date()
    });

    res.json({
      resultId: result.id,
      preliminaryScore: result.totalScore,
      estimatedGradingTime: result.estimatedGradingTime
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### Database Operations

```typescript
// Database service implementation
import { Pool } from 'pg';
import { Redis } from 'ioredis';

export class DatabaseService {
  private pg: Pool;
  private redis: Redis;

  constructor() {
    this.pg = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production'
    });

    this.redis = new Redis(process.env.REDIS_URL);
  }

  // Create new exam session
  async createExamSession(data: CreateSessionData): Promise<ExamSession> {
    const client = await this.pg.connect();
    
    try {
      await client.query('BEGIN');
      
      const sessionResult = await client.query(`
        INSERT INTO exam_sessions (
          user_id, exam_id, session_token, time_remaining, 
          current_section, browser_info, ip_address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        data.userId,
        data.examId,
        data.sessionToken,
        data.timeRemaining,
        data.currentSection,
        JSON.stringify(data.browserInfo),
        data.ipAddress
      ]);

      // Cache session data in Redis
      const sessionData = sessionResult.rows[0];
      await this.redis.setex(
        `session:${sessionData.id}`,
        3600 * 4, // 4 hours TTL
        JSON.stringify(sessionData)
      );

      await client.query('COMMIT');
      return sessionData;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Record user answer
  async recordUserAnswer(data: RecordAnswerData): Promise<void> {
    const client = await this.pg.connect();
    
    try {
      await client.query(`
        INSERT INTO user_answers (
          session_id, question_id, answer, time_spent, answered_at
        ) VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (session_id, question_id) 
        DO UPDATE SET 
          answer = $3,
          time_spent = $4,
          answered_at = NOW(),
          attempts = user_answers.attempts + 1
      `, [
        data.sessionId,
        data.questionId,
        JSON.stringify(data.answer),
        data.timeSpent
      ]);

      // Update cached session data
      const sessionKey = `session:${data.sessionId}`;
      const sessionData = await this.redis.get(sessionKey);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.answers = session.answers || {};
        session.answers[data.questionId] = data.answer;
        session.lastActivity = Date.now();
        
        await this.redis.setex(sessionKey, 3600 * 4, JSON.stringify(session));
      }
    } finally {
      client.release();
    }
  }

  // Generate analytics report
  async getInstitutionAnalytics(institutionId: string): Promise<AnalyticsReport> {
    const client = await this.pg.connect();
    
    try {
      const query = `
        SELECT 
          e.title as exam_title,
          COUNT(es.id) as total_sessions,
          COUNT(CASE WHEN es.status = 'completed' THEN 1 END) as completed_sessions,
          AVG(er.total_score) as average_score,
          AVG(EXTRACT(EPOCH FROM (es.finished_at - es.started_at))/60) as avg_duration_minutes
        FROM exams e
        LEFT JOIN exam_sessions es ON e.id = es.exam_id
        LEFT JOIN exam_results er ON es.id = er.session_id
        WHERE e.institution_id = $1
        GROUP BY e.id, e.title
        ORDER BY total_sessions DESC
      `;

      const result = await client.query(query, [institutionId]);
      return {
        institutionId,
        examStats: result.rows,
        generatedAt: new Date()
      };
    } finally {
      client.release();
    }
  }
}
```

This comprehensive documentation provides everything a developer needs to implement a universal exam simulator that can handle multiple languages, exam formats, and deployment scenarios. The system is designed to be scalable, maintainable, and extensible for future requirements.