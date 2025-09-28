/**
 * API Contract Test: POST /api/academia/exams/sessions
 * 
 * Tests the complete API contract for creating exam practice sessions
 * Following Test-Driven Development - MUST FAIL INITIALLY
 * 
 * Contract Definition: /specs/002-course-centric-academy/contracts/api.yaml
 * Implementation: app/api/academia/exams/sessions/route.ts
 * 
 * @group api-contracts
 * @group exams
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { ExamSession } from '@/lib/types/academia';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  single: vi.fn(() => mockSupabase),
  data: null as any,
  error: null,
  count: 0
};

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase)
}));

// Mock auth utilities
vi.mock('@/utils/auth', () => ({
  getCurrentUser: vi.fn(() => Promise.resolve({
    id: 'user_123',
    email: 'test@example.com'
  }))
}));

// Mock session validation
vi.mock('@/lib/types/academia', () => ({
  ...vi.importActual('@/lib/types/academia'),
  canStartSession: vi.fn(() => true)
}));

describe('API Contract: POST /api/academia/exams/sessions', () => {
  const API_ENDPOINT = '/api/academia/exams/sessions';
  
  // Valid request body matching OpenAPI CreateExamSession schema
  const validCreateRequest = {
    course_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    session_type: 'practice' as const,
    component: 'reading' as const
  };

  // Sample course for validation
  const sampleCourse = {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    language: 'english',
    level: 'b2',
    certification_type: 'eoi',
    is_active: true,
    components: [
      { skill_type: 'reading', weight: 0.25, time_limit_minutes: 75 },
      { skill_type: 'writing', weight: 0.25, time_limit_minutes: 90 },
      { skill_type: 'listening', weight: 0.25, time_limit_minutes: 45 },
      { skill_type: 'speaking', weight: 0.25, time_limit_minutes: 25 }
    ]
  };

  // Sample user enrollment/progress
  const sampleUserProgress = {
    id: 'progress_001',
    user_id: 'user_123',
    course_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    overall_progress: 0.65,
    enrollment_date: new Date('2024-01-15T10:30:00Z')
  };

  // Sample exam session response matching OpenAPI ExamSession schema
  const sampleExamSession: ExamSession = {
    id: 'session_001',
    user_id: 'user_123',
    course_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    session_type: 'practice',
    component: 'reading',
    started_at: new Date('2024-01-20T15:30:00Z'),
    completed_at: null,
    duration_seconds: 0,
    responses: {},
    score: null,
    is_completed: false,
    session_data: {
      questions_generated: 25,
      time_limit_minutes: 75,
      difficulty_level: 'intermediate',
      ai_tutor_enabled: false
    },
    created_at: new Date('2024-01-20T15:30:00Z'),
    updated_at: new Date('2024-01-20T15:30:00Z')
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock data
    mockSupabase.data = null;
    mockSupabase.error = null;
    mockSupabase.count = 0;
    
    // Reset auth mock to default authenticated state
    const { getCurrentUser } = vi.importMock('@/utils/auth');
    getCurrentUser.mockResolvedValue({
      id: 'user_123',
      email: 'test@example.com'
    });
    
    // Reset session validation
    const { canStartSession } = vi.importMock('@/lib/types/academia');
    canStartSession.mockReturnValue(true);
  });

  describe('Success Scenarios', () => {
    it('should return 201 with ExamSession when valid session request is provided', async () => {
      // Arrange: Mock successful course and enrollment validation, then session creation
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.single.mockImplementation(() => {
        const tableName = mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0];
        if (tableName === 'courses') {
          return Promise.resolve({ data: sampleCourse, error: null });
        }
        if (tableName === 'user_course_progress') {
          return Promise.resolve({ data: sampleUserProgress, error: null });
        }
        if (tableName === 'exam_sessions') {
          return Promise.resolve({ data: sampleExamSession, error: null });
        }
        return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
      });
      
      mockSupabase.insert.mockReturnValue(mockSupabase);

      // Act: Import and call the API route handler
      const { POST } = await import('@/app/api/academia/exams/sessions/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validCreateRequest)
      });
      const response = await POST(request);
      
      // Assert: Response structure matches OpenAPI ExamSession schema
      expect(response.status).toBe(201);
      
      const responseData = await response.json();
      
      // Verify ExamSession schema compliance
      expect(responseData).toHaveProperty('id');
      expect(responseData).toHaveProperty('user_id');
      expect(responseData).toHaveProperty('course_id');
      expect(responseData).toHaveProperty('session_type');
      expect(responseData).toHaveProperty('component');
      expect(responseData).toHaveProperty('started_at');
      expect(responseData).toHaveProperty('completed_at');
      expect(responseData).toHaveProperty('duration_seconds');
      expect(responseData).toHaveProperty('responses');
      expect(responseData).toHaveProperty('score');
      expect(responseData).toHaveProperty('is_completed');
      expect(responseData).toHaveProperty('session_data');
      
      // Verify data types and constraints
      expect(typeof responseData.id).toBe('string');
      expect(responseData.id).toMatch(/^[0-9a-f-]+$/i); // UUID format
      expect(typeof responseData.user_id).toBe('string');
      expect(typeof responseData.course_id).toBe('string');
      
      // Verify enum values match OpenAPI spec
      expect(['practice', 'mock_exam', 'diagnostic']).toContain(responseData.session_type);
      expect(['reading', 'writing', 'listening', 'speaking']).toContain(responseData.component);
      
      // Verify session state for new session
      expect(typeof responseData.started_at).toBe('string');
      expect(new Date(responseData.started_at)).toBeInstanceOf(Date);
      expect(responseData.completed_at).toBeNull(); // New session not completed
      expect(typeof responseData.duration_seconds).toBe('number');
      expect(responseData.duration_seconds).toBeGreaterThanOrEqual(0);
      expect(typeof responseData.responses).toBe('object');
      expect(responseData.score).toBeNull(); // No score until completion
      expect(typeof responseData.is_completed).toBe('boolean');
      expect(responseData.is_completed).toBe(false); // New session
      expect(typeof responseData.session_data).toBe('object');
      
      // Verify request values were applied
      expect(responseData.course_id).toBe(validCreateRequest.course_id);
      expect(responseData.session_type).toBe(validCreateRequest.session_type);
      expect(responseData.component).toBe(validCreateRequest.component);
      expect(responseData.user_id).toBe('user_123');
    });

    it('should handle different session types correctly', async () => {
      const sessionTypes = ['practice', 'mock_exam', 'diagnostic'] as const;
      
      for (const sessionType of sessionTypes) {
        // Arrange
        const requestForType = { ...validCreateRequest, session_type: sessionType };
        const sessionForType = { ...sampleExamSession, session_type: sessionType };
        
        mockSupabase.single.mockImplementation(() => {
          const tableName = mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0];
          if (tableName === 'courses') {
            return Promise.resolve({ data: sampleCourse, error: null });
          }
          if (tableName === 'user_course_progress') {
            return Promise.resolve({ data: sampleUserProgress, error: null });
          }
          if (tableName === 'exam_sessions') {
            return Promise.resolve({ data: sessionForType, error: null });
          }
          return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
        });
        
        mockSupabase.insert.mockReturnValue(mockSupabase);

        // Act
        const { POST } = await import('@/app/api/academia/exams/sessions/route');
        const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestForType)
        });
        const response = await POST(request);
        
        // Assert
        expect(response.status).toBe(201);
        
        const responseData = await response.json();
        expect(responseData.session_type).toBe(sessionType);
        
        vi.clearAllMocks();
      }
    });

    it('should handle different components correctly', async () => {
      const components = ['reading', 'writing', 'listening', 'speaking'] as const;
      
      for (const component of components) {
        // Arrange
        const requestForComponent = { ...validCreateRequest, component };
        const sessionForComponent = { ...sampleExamSession, component };
        
        mockSupabase.single.mockImplementation(() => {
          const tableName = mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0];
          if (tableName === 'courses') {
            return Promise.resolve({ data: sampleCourse, error: null });
          }
          if (tableName === 'user_course_progress') {
            return Promise.resolve({ data: sampleUserProgress, error: null });
          }
          if (tableName === 'exam_sessions') {
            return Promise.resolve({ data: sessionForComponent, error: null });
          }
          return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
        });
        
        mockSupabase.insert.mockReturnValue(mockSupabase);

        // Act
        const { POST } = await import('@/app/api/academia/exams/sessions/route');
        const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestForComponent)
        });
        const response = await POST(request);
        
        // Assert
        expect(response.status).toBe(201);
        
        const responseData = await response.json();
        expect(responseData.component).toBe(component);
        
        vi.clearAllMocks();
      }
    });

    it('should initialize session_data with appropriate configuration', async () => {
      // Arrange
      mockSupabase.single.mockImplementation(() => {
        const tableName = mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0];
        if (tableName === 'courses') {
          return Promise.resolve({ data: sampleCourse, error: null });
        }
        if (tableName === 'user_course_progress') {
          return Promise.resolve({ data: sampleUserProgress, error: null });
        }
        if (tableName === 'exam_sessions') {
          return Promise.resolve({ data: sampleExamSession, error: null });
        }
        return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
      });
      
      mockSupabase.insert.mockReturnValue(mockSupabase);

      // Act
      const { POST } = await import('@/app/api/academia/exams/sessions/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validCreateRequest)
      });
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(201);
      
      const responseData = await response.json();
      const sessionData = responseData.session_data;
      
      // Verify session_data contains expected configuration
      expect(sessionData).toHaveProperty('questions_generated');
      expect(sessionData).toHaveProperty('time_limit_minutes');
      expect(sessionData).toHaveProperty('difficulty_level');
      expect(sessionData).toHaveProperty('ai_tutor_enabled');
      
      expect(typeof sessionData.questions_generated).toBe('number');
      expect(sessionData.questions_generated).toBeGreaterThan(0);
      expect(typeof sessionData.time_limit_minutes).toBe('number');
      expect(sessionData.time_limit_minutes).toBeGreaterThan(0);
      expect(typeof sessionData.difficulty_level).toBe('string');
      expect(['beginner', 'intermediate', 'advanced']).toContain(sessionData.difficulty_level);
      expect(typeof sessionData.ai_tutor_enabled).toBe('boolean');
    });

    it('should include correct Content-Type header', async () => {
      // Arrange
      mockSupabase.single.mockImplementation(() => {
        const tableName = mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0];
        if (tableName === 'courses') {
          return Promise.resolve({ data: sampleCourse, error: null });
        }
        if (tableName === 'user_course_progress') {
          return Promise.resolve({ data: sampleUserProgress, error: null });
        }
        if (tableName === 'exam_sessions') {
          return Promise.resolve({ data: sampleExamSession, error: null });
        }
        return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
      });
      
      mockSupabase.insert.mockReturnValue(mockSupabase);

      // Act
      const { POST } = await import('@/app/api/academia/exams/sessions/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validCreateRequest)
      });
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(201);
      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('Error Scenarios', () => {
    it('should return 400 when request body is invalid JSON', async () => {
      // Act: Send invalid JSON
      const { POST } = await import('@/app/api/academia/exams/sessions/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{'
      });
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(400);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toContain('Invalid JSON');
    });

    it('should return 400 when required fields are missing', async () => {
      const requiredFields = ['course_id', 'session_type', 'component'];
      
      for (const missingField of requiredFields) {
        // Arrange: Create request missing one required field
        const incompleteRequest = { ...validCreateRequest };
        delete (incompleteRequest as any)[missingField];

        // Act
        const { POST } = await import('@/app/api/academia/exams/sessions/route');
        const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(incompleteRequest)
        });
        const response = await POST(request);
        
        // Assert
        expect(response.status).toBe(400);
        
        const responseData = await response.json();
        expect(responseData).toHaveProperty('error');
        expect(responseData.error).toContain(`${missingField} is required`);
        
        vi.clearAllMocks();
      }
    });

    it('should return 400 when course_id format is invalid', async () => {
      // Act: Send request with invalid UUID format
      const { POST } = await import('@/app/api/academia/exams/sessions/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validCreateRequest,
          course_id: 'invalid-uuid-format'
        })
      });
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(400);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toContain('Invalid course_id format');
    });

    it('should return 400 when session_type is invalid', async () => {
      // Act: Send request with invalid session type
      const { POST } = await import('@/app/api/academia/exams/sessions/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validCreateRequest,
          session_type: 'invalid_type'
        })
      });
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(400);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toContain('Invalid session_type');
    });

    it('should return 400 when component is invalid', async () => {
      // Act: Send request with invalid component
      const { POST } = await import('@/app/api/academia/exams/sessions/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validCreateRequest,
          component: 'invalid_component'
        })
      });
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(400);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toContain('Invalid component');
    });

    it('should return 401 when user is not authenticated', async () => {
      // Arrange: Mock unauthenticated user
      const { getCurrentUser } = await import('@/utils/auth');
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      // Act
      const { POST } = await import('@/app/api/academia/exams/sessions/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validCreateRequest)
      });
      const response = await POST(request);
      
      // Assert: Matches OpenAPI contract for 401 response
      expect(response.status).toBe(401);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toBe('Authentication required');
    });

    it('should return 404 when course does not exist', async () => {
      // Arrange: Mock course not found
      mockSupabase.single.mockImplementation(() => {
        const tableName = mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0];
        if (tableName === 'courses') {
          return Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'No rows returned' } });
        }
        return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
      });

      // Act
      const { POST } = await import('@/app/api/academia/exams/sessions/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validCreateRequest)
      });
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(404);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toContain('Course not found');
    });

    it('should return 404 when user is not enrolled in the course', async () => {
      // Arrange: Course exists but no enrollment
      mockSupabase.single.mockImplementation(() => {
        const tableName = mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0];
        if (tableName === 'courses') {
          return Promise.resolve({ data: sampleCourse, error: null });
        }
        if (tableName === 'user_course_progress') {
          return Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'No rows returned' } });
        }
        return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
      });

      // Act
      const { POST } = await import('@/app/api/academia/exams/sessions/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validCreateRequest)
      });
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(404);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toContain('User not enrolled in course');
    });

    it('should return 400 when component is not available for the course', async () => {
      // Arrange: Course without the requested component
      const courseWithoutReading = {
        ...sampleCourse,
        components: [
          { skill_type: 'writing', weight: 0.5, time_limit_minutes: 90 },
          { skill_type: 'listening', weight: 0.5, time_limit_minutes: 45 }
          // No reading component
        ]
      };
      
      mockSupabase.single.mockImplementation(() => {
        const tableName = mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0];
        if (tableName === 'courses') {
          return Promise.resolve({ data: courseWithoutReading, error: null });
        }
        if (tableName === 'user_course_progress') {
          return Promise.resolve({ data: sampleUserProgress, error: null });
        }
        return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
      });

      // Act: Request reading component for course that doesn't have it
      const { POST } = await import('@/app/api/academia/exams/sessions/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validCreateRequest,
          component: 'reading' // Not available in this course
        })
      });
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(400);
      
      const responseData = await response.json();
      expect(responseData.error).toContain('Component not available for this course');
    });

    it('should return 403 when user cannot start session due to validation rules', async () => {
      // Arrange: Mock session validation failure
      const { canStartSession } = await import('@/lib/types/academia');
      vi.mocked(canStartSession).mockReturnValue(false);
      
      mockSupabase.single.mockImplementation(() => {
        const tableName = mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0];
        if (tableName === 'courses') {
          return Promise.resolve({ data: sampleCourse, error: null });
        }
        if (tableName === 'user_course_progress') {
          return Promise.resolve({ data: sampleUserProgress, error: null });
        }
        return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
      });

      // Act
      const { POST } = await import('@/app/api/academia/exams/sessions/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validCreateRequest)
      });
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(403);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toContain('Cannot start session');
    });

    it('should return 500 when database session creation fails', async () => {
      // Arrange: Mock database error during session creation
      mockSupabase.single.mockImplementation(() => {
        const tableName = mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0];
        if (tableName === 'courses') {
          return Promise.resolve({ data: sampleCourse, error: null });
        }
        if (tableName === 'user_course_progress') {
          return Promise.resolve({ data: sampleUserProgress, error: null });
        }
        if (tableName === 'exam_sessions') {
          return Promise.resolve({
            data: null,
            error: { message: 'Database constraint violation', code: 'UNIQUE_VIOLATION' }
          });
        }
        return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
      });
      
      mockSupabase.insert.mockReturnValue(mockSupabase);

      // Act
      const { POST } = await import('@/app/api/academia/exams/sessions/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validCreateRequest)
      });
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(500);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
    });
  });

  describe('Request Body Validation', () => {
    it('should validate session_type enum values from OpenAPI spec', async () => {
      const validSessionTypes = ['practice', 'mock_exam', 'diagnostic'] as const;
      
      for (const sessionType of validSessionTypes) {
        // Arrange
        const requestForType = { ...validCreateRequest, session_type: sessionType };
        const sessionForType = { ...sampleExamSession, session_type: sessionType };
        
        mockSupabase.single.mockImplementation(() => {
          const tableName = mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0];
          if (tableName === 'courses') {
            return Promise.resolve({ data: sampleCourse, error: null });
          }
          if (tableName === 'user_course_progress') {
            return Promise.resolve({ data: sampleUserProgress, error: null });
          }
          if (tableName === 'exam_sessions') {
            return Promise.resolve({ data: sessionForType, error: null });
          }
          return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
        });
        
        mockSupabase.insert.mockReturnValue(mockSupabase);

        // Act
        const { POST } = await import('@/app/api/academia/exams/sessions/route');
        const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestForType)
        });
        const response = await POST(request);
        
        // Assert
        expect(response.status).toBe(201);
        
        const responseData = await response.json();
        expect(responseData.session_type).toBe(sessionType);
        
        vi.clearAllMocks();
      }
    });

    it('should validate component enum values from OpenAPI spec', async () => {
      const validComponents = ['reading', 'writing', 'listening', 'speaking'] as const;
      
      for (const component of validComponents) {
        // Arrange
        const requestForComponent = { ...validCreateRequest, component };
        const sessionForComponent = { ...sampleExamSession, component };
        
        mockSupabase.single.mockImplementation(() => {
          const tableName = mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0];
          if (tableName === 'courses') {
            return Promise.resolve({ data: sampleCourse, error: null });
          }
          if (tableName === 'user_course_progress') {
            return Promise.resolve({ data: sampleUserProgress, error: null });
          }
          if (tableName === 'exam_sessions') {
            return Promise.resolve({ data: sessionForComponent, error: null });
          }
          return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
        });
        
        mockSupabase.insert.mockReturnValue(mockSupabase);

        // Act
        const { POST } = await import('@/app/api/academia/exams/sessions/route');
        const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestForComponent)
        });
        const response = await POST(request);
        
        // Assert
        expect(response.status).toBe(201);
        
        const responseData = await response.json();
        expect(responseData.component).toBe(component);
        
        vi.clearAllMocks();
      }
    });

    it('should sanitize and validate request body against injection attacks', async () => {
      const maliciousRequests = [
        {
          ...validCreateRequest,
          course_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479; DROP TABLE users;'
        },
        {
          ...validCreateRequest,
          session_type: 'practice<script>alert("XSS")</script>'
        },
        {
          ...validCreateRequest,
          component: 'reading OR 1=1'
        },
        {
          ...validCreateRequest,
          malicious_field: '<img src=x onerror=alert("XSS")>'
        }
      ];

      for (const maliciousRequest of maliciousRequests) {
        // Act
        const { POST } = await import('@/app/api/academia/exams/sessions/route');
        const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(maliciousRequest)
        });
        const response = await POST(request);
        
        // Assert: Should reject malicious content
        expect(response.status).toBe(400);
        
        const responseData = await response.json();
        expect(responseData.error).toContain('Invalid');
        
        vi.clearAllMocks();
      }
    });

    it('should reject requests with extra unexpected fields', async () => {
      // Act: Send request with unexpected field
      const { POST } = await import('@/app/api/academia/exams/sessions/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validCreateRequest,
          unexpected_field: 'should not be allowed',
          admin_override: true,
          secret_token: 'malicious'
        })
      });
      const response = await POST(request);
      
      // Assert: Should reject request with unexpected fields
      expect(response.status).toBe(400);
      
      const responseData = await response.json();
      expect(responseData.error).toContain('Unexpected field');
    });
  });

  describe('Performance Requirements', () => {
    it('should complete session creation within 200ms under normal conditions', async () => {
      // Arrange
      mockSupabase.single.mockImplementation(() => {
        const tableName = mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0];
        if (tableName === 'courses') {
          return Promise.resolve({ data: sampleCourse, error: null });
        }
        if (tableName === 'user_course_progress') {
          return Promise.resolve({ data: sampleUserProgress, error: null });
        }
        if (tableName === 'exam_sessions') {
          return Promise.resolve({ data: sampleExamSession, error: null });
        }
        return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
      });
      
      mockSupabase.insert.mockReturnValue(mockSupabase);

      const startTime = Date.now();
      
      // Act
      const { POST } = await import('@/app/api/academia/exams/sessions/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validCreateRequest)
      });
      const response = await POST(request);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Assert
      expect(response.status).toBe(201);
      expect(responseTime).toBeLessThan(200); // Performance requirement
    });

    it('should handle concurrent session creation requests gracefully', async () => {
      // Arrange: Multiple users trying to create sessions simultaneously
      mockSupabase.single.mockImplementation(() => {
        const tableName = mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0];
        if (tableName === 'courses') {
          return Promise.resolve({ data: sampleCourse, error: null });
        }
        if (tableName === 'user_course_progress') {
          return Promise.resolve({ data: sampleUserProgress, error: null });
        }
        if (tableName === 'exam_sessions') {
          return Promise.resolve({ data: sampleExamSession, error: null });
        }
        return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
      });
      
      mockSupabase.insert.mockReturnValue(mockSupabase);

      // Act: Simulate concurrent session creation requests
      const { POST } = await import('@/app/api/academia/exams/sessions/route');
      const requests = Array.from({ length: 5 }, (_, i) => {
        const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...validCreateRequest,
            session_context: `concurrent_test_${i}` // Differentiate requests
          })
        });
        return POST(request);
      });

      const startTime = Date.now();
      const responses = await Promise.allSettled(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Assert: Should handle concurrent requests efficiently
      expect(totalTime).toBeLessThan(1000); // All requests in under 1 second
      
      // All requests should either succeed or fail gracefully (no crashes)
      responses.forEach(result => {
        expect(result.status).toBe('fulfilled');
      });
    });
  });

  describe('Security and Compliance', () => {
    it('should include security headers', async () => {
      // Arrange
      mockSupabase.single.mockImplementation(() => {
        const tableName = mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0];
        if (tableName === 'courses') {
          return Promise.resolve({ data: sampleCourse, error: null });
        }
        if (tableName === 'user_course_progress') {
          return Promise.resolve({ data: sampleUserProgress, error: null });
        }
        if (tableName === 'exam_sessions') {
          return Promise.resolve({ data: sampleExamSession, error: null });
        }
        return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
      });
      
      mockSupabase.insert.mockReturnValue(mockSupabase);

      // Act
      const { POST } = await import('@/app/api/academia/exams/sessions/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validCreateRequest)
      });
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(201);
      
      // Verify security headers
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
      expect(response.headers.get('x-frame-options')).toBeDefined();
      
      // Should not expose server information
      expect(response.headers.get('server')).toBeFalsy();
      expect(response.headers.get('x-powered-by')).toBeFalsy();
    });

    it('should not expose sensitive session creation details', async () => {
      // Arrange
      mockSupabase.single.mockImplementation(() => {
        const tableName = mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0];
        if (tableName === 'courses') {
          return Promise.resolve({ data: sampleCourse, error: null });
        }
        if (tableName === 'user_course_progress') {
          return Promise.resolve({ data: sampleUserProgress, error: null });
        }
        if (tableName === 'exam_sessions') {
          return Promise.resolve({ data: sampleExamSession, error: null });
        }
        return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
      });
      
      mockSupabase.insert.mockReturnValue(mockSupabase);

      // Act
      const { POST } = await import('@/app/api/academia/exams/sessions/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validCreateRequest)
      });
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(201);
      
      const responseData = await response.json();
      
      // Should not include sensitive system data
      expect(responseData).not.toHaveProperty('internal_session_key');
      expect(responseData).not.toHaveProperty('question_answers');
      expect(responseData).not.toHaveProperty('admin_metadata');
      expect(responseData).not.toHaveProperty('system_config');
      expect(responseData).not.toHaveProperty('db_transaction_id');
    });

    it('should enforce user isolation for session creation', async () => {
      // This test ensures users can only create sessions for their own enrollments
      // Arrange
      mockSupabase.single.mockImplementation(() => {
        const tableName = mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0];
        if (tableName === 'courses') {
          return Promise.resolve({ data: sampleCourse, error: null });
        }
        if (tableName === 'user_course_progress') {
          return Promise.resolve({ data: sampleUserProgress, error: null });
        }
        if (tableName === 'exam_sessions') {
          return Promise.resolve({ data: sampleExamSession, error: null });
        }
        return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
      });
      
      mockSupabase.insert.mockReturnValue(mockSupabase);

      // Act
      const { POST } = await import('@/app/api/academia/exams/sessions/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validCreateRequest)
      });
      const response = await POST(request);
      
      // Assert
      expect(response.status).toBe(201);
      
      // Verify user isolation was enforced in database queries
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user_123');
    });
  });
});