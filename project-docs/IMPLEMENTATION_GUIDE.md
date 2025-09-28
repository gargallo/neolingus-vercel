# Implementation Guide - Universal Exam Simulator

## Quick Start Guide for Developers

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (optional but recommended)

### 1. Project Setup

```bash
# Clone or create project structure
mkdir exam-simulator
cd exam-simulator

# Initialize project
npm init -y
npm install express typescript tsx
npm install @types/node @types/express --save-dev

# Create directory structure
mkdir -p {src/{services,models,controllers,middleware},config,scripts,tests}
```

### 2. Environment Configuration

```bash
# Create environment files
cp .env.example .env
```

```env
# .env file
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/exam_simulator
REDIS_URL=redis://localhost:6379

# AI Services
OPENAI_API_KEY=your_openai_key_here

# File Storage
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=exam-simulator-files

# Security
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
```

### 3. Database Setup

```bash
# Install database dependencies
npm install pg redis ioredis
npm install @types/pg --save-dev

# Run database setup
npm run db:setup
```

```sql
-- scripts/setup-database.sql
-- Run this in PostgreSQL
CREATE DATABASE exam_simulator;
CREATE USER exam_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE exam_simulator TO exam_user;

-- Run the schema from the main documentation
\i schema.sql
```

### 4. Core Implementation Steps

#### Step 1: Set up the basic Express server

```typescript
// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRouter } from './controllers/auth';
import { examRouter } from './controllers/exams';
import { sessionRouter } from './controllers/sessions';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/exams', examRouter);
app.use('/api/sessions', sessionRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

#### Step 2: Implement the ExamService

```typescript
// src/services/ExamService.ts
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { ExamConfiguration, ExamSummary } from '../models/Exam';

export class ExamService {
  private db: Pool;
  private cache: Redis;

  constructor() {
    this.db = new Pool({ connectionString: process.env.DATABASE_URL });
    this.cache = new Redis(process.env.REDIS_URL);
  }

  async getExam(examId: string): Promise<ExamConfiguration | null> {
    // Try cache first
    const cached = await this.cache.get(`exam:${examId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Query database
    const result = await this.db.query(
      'SELECT * FROM exams WHERE exam_id = $1 AND is_active = true',
      [examId]
    );

    if (result.rows.length === 0) return null;

    const examData = result.rows[0];
    const examConfig: ExamConfiguration = {
      examId: examData.exam_id,
      metadata: {
        title: examData.title,
        institution: examData.institution_name,
        language: examData.language,
        level: examData.level,
        year: examData.year,
        duration: examData.duration,
        totalQuestions: examData.total_questions
      },
      sections: examData.configuration.sections,
      scoring: examData.configuration.scoring
    };

    // Cache for 1 hour
    await this.cache.setex(`exam:${examId}`, 3600, JSON.stringify(examConfig));

    return examConfig;
  }

  async listExams(institutionId?: string): Promise<ExamSummary[]> {
    let query = `
      SELECT e.*, i.name as institution_name 
      FROM exams e 
      JOIN institutions i ON e.institution_id = i.id 
      WHERE e.is_active = true
    `;
    const params: any[] = [];

    if (institutionId) {
      query += ' AND e.institution_id = $1';
      params.push(institutionId);
    }

    query += ' ORDER BY e.created_at DESC';

    const result = await this.db.query(query, params);
    return result.rows.map(row => ({
      examId: row.exam_id,
      title: row.title,
      institution: row.institution_name,
      language: row.language,
      level: row.level,
      duration: row.duration,
      totalQuestions: row.total_questions
    }));
  }
}
```

#### Step 3: Implement the SessionService

```typescript
// src/services/SessionService.ts
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { ExamSession, CreateSessionData } from '../models/Session';

export class SessionService {
  private db: Pool;
  private cache: Redis;

  constructor() {
    this.db = new Pool({ connectionString: process.env.DATABASE_URL });
    this.cache = new Redis(process.env.REDIS_URL);
  }

  async createSession(data: CreateSessionData): Promise<ExamSession> {
    const sessionId = uuidv4();
    const sessionToken = uuidv4();

    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');
      
      const result = await client.query(`
        INSERT INTO exam_sessions (
          id, user_id, exam_id, session_token, time_remaining, 
          current_section, browser_info, ip_address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        sessionId,
        data.userId,
        data.examId,
        sessionToken,
        data.timeRemaining,
        data.currentSection || 'reading',
        JSON.stringify(data.browserInfo),
        data.ipAddress
      ]);

      const session = result.rows[0];

      // Cache session data
      await this.cache.setex(
        `session:${sessionId}`,
        4 * 3600, // 4 hours
        JSON.stringify({
          ...session,
          answers: {},
          progress: { answeredQuestions: 0, totalQuestions: data.totalQuestions }
        })
      );

      await client.query('COMMIT');
      return session;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async recordAnswer(sessionId: string, answerData: any): Promise<void> {
    const client = await this.db.connect();
    
    try {
      await client.query(`
        INSERT INTO user_answers (session_id, question_id, answer, time_spent)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (session_id, question_id) 
        DO UPDATE SET 
          answer = $3,
          time_spent = $4,
          answered_at = NOW(),
          attempts = user_answers.attempts + 1
      `, [
        sessionId,
        answerData.questionId,
        JSON.stringify(answerData.answer),
        answerData.timeSpent
      ]);

      // Update cache
      const sessionData = await this.getSessionFromCache(sessionId);
      if (sessionData) {
        sessionData.answers[answerData.questionId] = answerData.answer;
        sessionData.progress.answeredQuestions = Object.keys(sessionData.answers).length;
        sessionData.lastActivity = Date.now();
        
        await this.cache.setex(
          `session:${sessionId}`,
          4 * 3600,
          JSON.stringify(sessionData)
        );
      }
    } finally {
      client.release();
    }
  }

  private async getSessionFromCache(sessionId: string): Promise<any> {
    const cached = await this.cache.get(`session:${sessionId}`);
    return cached ? JSON.parse(cached) : null;
  }
}
```

#### Step 4: Implement the ScoringService

```typescript
// src/services/ScoringService.ts
import OpenAI from 'openai';
import { ExamSession } from '../models/Session';
import { ExamResult, ScoreResult } from '../models/Score';

export class ScoringService {
  private openai: OpenAI;
  private db: Pool;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.db = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  async scoreExam(session: ExamSession): Promise<ExamResult> {
    const exam = await this.getExamConfig(session.exam_id);
    const answers = await this.getUserAnswers(session.id);
    
    const sectionScores: Record<string, number> = {};
    const detailedScores: any[] = [];

    for (const section of exam.sections) {
      const sectionScore = await this.scoreSection(section, answers, exam);
      sectionScores[section.id] = sectionScore.score;
      detailedScores.push(...sectionScore.details);
    }

    const totalScore = this.calculateTotalScore(sectionScores, exam.scoring.weightings);
    const passed = totalScore >= exam.scoring.passingScore;

    const result: ExamResult = {
      sessionId: session.id,
      userId: session.user_id,
      examId: session.exam_id,
      totalScore,
      sectionScores,
      detailedScores,
      passed,
      feedback: await this.generateFeedback(detailedScores, totalScore),
      gradedAt: new Date()
    };

    await this.saveResult(result);
    return result;
  }

  private async scoreObjectiveQuestion(
    question: any,
    userAnswer: any
  ): Promise<ScoreResult> {
    if (question.type === 'multiple_choice') {
      const isCorrect = userAnswer?.toString().toLowerCase() === 
                       question.correctAnswer?.toString().toLowerCase();
      return {
        score: isCorrect ? question.points : 0,
        maxScore: question.points,
        feedback: isCorrect ? 'Correct!' : `Incorrect. The correct answer is ${question.correctAnswer}`,
        confidence: 1.0
      };
    }

    if (question.type === 'gap_fill') {
      const userText = userAnswer?.toString().toLowerCase().trim();
      const correctAnswers = Array.isArray(question.correctAnswer) 
        ? question.correctAnswer 
        : [question.correctAnswer];
      
      const isCorrect = correctAnswers.some(correct => 
        correct.toString().toLowerCase().trim() === userText
      );

      return {
        score: isCorrect ? question.points : 0,
        maxScore: question.points,
        feedback: isCorrect ? 'Correct!' : `Possible answers: ${correctAnswers.join(', ')}`,
        confidence: 1.0
      };
    }

    return { score: 0, maxScore: question.points, feedback: 'Unknown question type', confidence: 0 };
  }

  private async scoreEssayQuestion(
    question: any,
    userAnswer: string,
    examLanguage: string
  ): Promise<ScoreResult> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert ${examLanguage} language examiner. Score this essay on a scale of 0-${question.points} based on content, organization, language use, and mechanics. Provide detailed feedback.`
          },
          {
            role: "user",
            content: `Essay prompt: ${question.prompt}\n\nStudent essay: ${userAnswer}\n\nProvide a JSON response with: score (number), feedback (string), strengths (array), improvements (array)`
          }
        ],
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content);
      
      return {
        score: Math.min(Math.max(result.score, 0), question.points),
        maxScore: question.points,
        feedback: result.feedback,
        strengths: result.strengths,
        improvements: result.improvements,
        confidence: 0.85
      };
    } catch (error) {
      console.error('AI scoring error:', error);
      return {
        score: 0,
        maxScore: question.points,
        feedback: 'Unable to score essay automatically. Manual review required.',
        confidence: 0
      };
    }
  }
}
```

### 5. Frontend Implementation

#### React Component Structure

```typescript
// src/components/UniversalExam/index.tsx
import React, { useEffect, useState } from 'react';
import { ExamHeader } from './ExamHeader';
import { ExamNavigation } from './ExamNavigation';
import { ExamSection } from './ExamSection';
import { ProgressBar } from './ProgressBar';
import { ExamTimer } from './ExamTimer';
import { useExamEngine } from '../hooks/useExamEngine';

interface UniversalExamProps {
  examId: string;
  sessionToken?: string;
}

export const UniversalExam: React.FC<UniversalExamProps> = ({
  examId,
  sessionToken
}) => {
  const {
    examConfig,
    currentSection,
    progress,
    timeRemaining,
    isLoading,
    error,
    initializeExam,
    navigateToSection,
    submitAnswer,
    finishExam
  } = useExamEngine(examId, sessionToken);

  useEffect(() => {
    initializeExam();
  }, [examId]);

  if (isLoading) {
    return <div className="exam-loading">Loading exam...</div>;
  }

  if (error) {
    return <div className="exam-error">Error: {error}</div>;
  }

  if (!examConfig) {
    return <div className="exam-error">Exam not found</div>;
  }

  return (
    <div className="universal-exam">
      <ExamHeader 
        title={examConfig.metadata.title}
        institution={examConfig.metadata.institution}
        level={examConfig.metadata.level}
      />
      
      <ExamTimer 
        timeRemaining={timeRemaining}
        totalTime={examConfig.metadata.duration * 60}
      />

      <ExamNavigation
        sections={examConfig.sections}
        currentSection={currentSection?.id}
        onSectionChange={navigateToSection}
      />

      <ProgressBar 
        current={progress.answeredQuestions}
        total={progress.totalQuestions}
      />

      {currentSection && (
        <ExamSection
          section={currentSection}
          onAnswerSubmit={submitAnswer}
          onFinishExam={finishExam}
        />
      )}
    </div>
  );
};
```

#### Custom Hook for Exam Logic

```typescript
// src/hooks/useExamEngine.ts
import { useState, useCallback } from 'react';
import { ExamAPI } from '../services/ExamAPI';
import { ExamConfiguration, Section, Progress } from '../types/exam';

export const useExamEngine = (examId: string, sessionToken?: string) => {
  const [examConfig, setExamConfig] = useState<ExamConfiguration | null>(null);
  const [currentSection, setCurrentSection] = useState<Section | null>(null);
  const [progress, setProgress] = useState<Progress>({ answeredQuestions: 0, totalQuestions: 0 });
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const initializeExam = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      let session;
      
      if (sessionToken) {
        // Resume existing session
        session = await ExamAPI.resumeSession(sessionToken);
      } else {
        // Start new session
        session = await ExamAPI.startSession(examId);
      }

      setSessionId(session.sessionId);
      setExamConfig(session.examConfig);
      setCurrentSection(session.examConfig.sections[0]);
      setTimeRemaining(session.timeRemaining);
      setProgress({
        answeredQuestions: session.progress?.answeredQuestions || 0,
        totalQuestions: session.examConfig.metadata.totalQuestions
      });

      // Start timer
      startTimer(session.timeRemaining);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [examId, sessionToken]);

  const submitAnswer = useCallback(async (questionId: string, answer: any) => {
    try {
      await ExamAPI.submitAnswer(sessionId, questionId, answer);
      setProgress(prev => ({
        ...prev,
        answeredQuestions: prev.answeredQuestions + 1
      }));
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
  }, [sessionId]);

  const navigateToSection = useCallback((sectionId: string) => {
    const section = examConfig?.sections.find(s => s.id === sectionId);
    if (section) {
      setCurrentSection(section);
    }
  }, [examConfig]);

  const finishExam = useCallback(async () => {
    try {
      const result = await ExamAPI.finishExam(sessionId);
      // Navigate to results page
      window.location.href = `/results/${result.resultId}`;
    } catch (err) {
      setError('Failed to finish exam');
    }
  }, [sessionId]);

  const startTimer = (initialTime: number) => {
    let time = initialTime;
    const interval = setInterval(() => {
      time -= 1;
      setTimeRemaining(time);
      
      if (time <= 0) {
        clearInterval(interval);
        finishExam(); // Auto-finish when time is up
      }
    }, 1000);
  };

  return {
    examConfig,
    currentSection,
    progress,
    timeRemaining,
    isLoading,
    error,
    initializeExam,
    navigateToSection,
    submitAnswer,
    finishExam
  };
};
```

### 6. Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime

WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/exam_simulator
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: exam_simulator
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/setup-database.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

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
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 7. Testing Strategy

```typescript
// tests/services/ExamService.test.ts
import { ExamService } from '../../src/services/ExamService';
import { Pool } from 'pg';
import { Redis } from 'ioredis';

// Mock dependencies
jest.mock('pg');
jest.mock('ioredis');

describe('ExamService', () => {
  let examService: ExamService;
  let mockDb: jest.Mocked<Pool>;
  let mockCache: jest.Mocked<Redis>;

  beforeEach(() => {
    mockDb = new Pool() as jest.Mocked<Pool>;
    mockCache = new Redis() as jest.Mocked<Redis>;
    examService = new ExamService();
  });

  describe('getExam', () => {
    it('should return exam from cache if available', async () => {
      const examData = { examId: 'test-exam', title: 'Test Exam' };
      mockCache.get.mockResolvedValue(JSON.stringify(examData));

      const result = await examService.getExam('test-exam');
      
      expect(result).toEqual(examData);
      expect(mockCache.get).toHaveBeenCalledWith('exam:test-exam');
      expect(mockDb.query).not.toHaveBeenCalled();
    });

    it('should fetch from database if not in cache', async () => {
      mockCache.get.mockResolvedValue(null);
      mockDb.query.mockResolvedValue({
        rows: [{
          exam_id: 'test-exam',
          title: 'Test Exam',
          language: 'english',
          level: 'B2'
        }]
      });

      const result = await examService.getExam('test-exam');
      
      expect(mockDb.query).toHaveBeenCalled();
      expect(mockCache.setex).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
```

### 8. Deployment Scripts

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

echo "Starting deployment..."

# Build the application
npm run build

# Run database migrations
npm run migrate

# Build and push Docker image
docker build -t exam-simulator:latest .
docker tag exam-simulator:latest your-registry/exam-simulator:latest
docker push your-registry/exam-simulator:latest

# Deploy to production
kubectl apply -f k8s/
kubectl rollout status deployment/exam-simulator

echo "Deployment completed successfully!"
```

This implementation guide provides a complete roadmap for building the universal exam simulator with all the key components needed for a production-ready system.