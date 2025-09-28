/**
 * API Contract Test: GET /api/academia/exams/sessions/{sessionId}
 * 
 * Tests the complete API contract for retrieving exam session details
 * Following Test-Driven Development - MUST FAIL INITIALLY
 * 
 * Contract Definition: /specs/002-course-centric-academy/contracts/api.yaml
 * Implementation: app/api/academia/exams/sessions/[sessionId]/route.ts
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
  eq: vi.fn(() => mockSupabase),
  single: vi.fn(() => mockSupabase),
  data: null as ExamSession | null,
  error: null
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

describe('API Contract: GET /api/academia/exams/sessions/{sessionId}', () => {
  const API_BASE = '/api/academia/exams/sessions';
  const VALID_SESSION_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
  
  // Sample exam session matching OpenAPI ExamSession schema
  const sampleExamSession: ExamSession = {
    id: VALID_SESSION_ID,
    user_id: 'user_123',
    course_id: 'course_001',
    session_type: 'practice',
    component: 'reading',
    started_at: new Date('2024-01-20T15:30:00Z'),
    completed_at: new Date('2024-01-20T16:45:00Z'),
    duration_seconds: 4500, // 75 minutes
    responses: {
      question_1: { answer: 'A', time_spent: 120 },
      question_2: { answer: 'B', time_spent: 95 },
      question_3: { answer: 'C', time_spent: 110 }
    },
    score: 0.85,
    is_completed: true,
    session_data: {
      questions_generated: 25,
      time_limit_minutes: 75,
      difficulty_level: 'intermediate',
      ai_tutor_enabled: false,
      completion_percentage: 100
    },
    created_at: new Date('2024-01-20T15:30:00Z'),
    updated_at: new Date('2024-01-20T16:45:00Z')
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock data
    mockSupabase.data = null;
    mockSupabase.error = null;
    
    // Reset auth mock to default authenticated state
    const { getCurrentUser } = vi.importMock('@/utils/auth');
    getCurrentUser.mockResolvedValue({
      id: 'user_123',
      email: 'test@example.com'
    });
  });

  describe('Success Scenarios', () => {
    it('should return 200 with ExamSession when valid sessionId provided', async () => {
      // Arrange: Mock successful session retrieval
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValue({
        data: sampleExamSession,
        error: null
      });

      // Act: Import and call the API route handler
      const { GET } = await import('@/app/api/academia/exams/sessions/[sessionId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_SESSION_ID}`);
      const params = { sessionId: VALID_SESSION_ID };
      const response = await GET(request, { params });
      
      // Assert: Response structure matches OpenAPI ExamSession schema
      expect(response.status).toBe(200);
      
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
      
      // Verify data types and values
      expect(responseData.id).toBe(VALID_SESSION_ID);
      expect(responseData.user_id).toBe('user_123');
      expect(['practice', 'mock_exam', 'diagnostic']).toContain(responseData.session_type);
      expect(['reading', 'writing', 'listening', 'speaking']).toContain(responseData.component);
      expect(typeof responseData.duration_seconds).toBe('number');
      expect(responseData.duration_seconds).toBeGreaterThan(0);
      expect(typeof responseData.responses).toBe('object');
      expect(typeof responseData.score).toBe('number');
      expect(responseData.score).toBeGreaterThanOrEqual(0);
      expect(responseData.score).toBeLessThanOrEqual(1);
      expect(typeof responseData.is_completed).toBe('boolean');
      expect(typeof responseData.session_data).toBe('object');
      
      // Verify database was queried correctly
      expect(mockSupabase.from).toHaveBeenCalledWith('exam_sessions');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', VALID_SESSION_ID);
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user_123');
    });

    it('should return active session with null completed_at and score', async () => {
      // Arrange: Active (incomplete) session
      const activeSession = {
        ...sampleExamSession,
        completed_at: null,
        score: null,
        is_completed: false,
        duration_seconds: 1800 // 30 minutes in progress
      };
      
      mockSupabase.single.mockResolvedValue({
        data: activeSession,
        error: null
      });

      // Act
      const { GET } = await import('@/app/api/academia/exams/sessions/[sessionId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_SESSION_ID}`);
      const params = { sessionId: VALID_SESSION_ID };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.completed_at).toBeNull();
      expect(responseData.score).toBeNull();
      expect(responseData.is_completed).toBe(false);
      expect(responseData.duration_seconds).toBe(1800);
    });

    it('should include correct Content-Type header', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: sampleExamSession,
        error: null
      });

      // Act
      const { GET } = await import('@/app/api/academia/exams/sessions/[sessionId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_SESSION_ID}`);
      const params = { sessionId: VALID_SESSION_ID };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('Error Scenarios', () => {
    it('should return 404 when session does not exist', async () => {
      // Arrange: Mock session not found
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' }
      });

      // Act
      const { GET } = await import('@/app/api/academia/exams/sessions/[sessionId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/nonexistent-session`);
      const params = { sessionId: 'nonexistent-session' };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(404);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toContain('Session not found');
    });

    it('should return 404 when sessionId format is invalid', async () => {
      // Act: Request with invalid UUID format
      const { GET } = await import('@/app/api/academia/exams/sessions/[sessionId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/invalid-uuid`);
      const params = { sessionId: 'invalid-uuid' };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(404);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toContain('Invalid session ID format');
    });

    it('should return 401 when user is not authenticated', async () => {
      // Arrange: Mock unauthenticated user
      const { getCurrentUser } = await import('@/utils/auth');
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      // Act
      const { GET } = await import('@/app/api/academia/exams/sessions/[sessionId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_SESSION_ID}`);
      const params = { sessionId: VALID_SESSION_ID };
      const response = await GET(request, { params });
      
      // Assert: Matches OpenAPI contract for 401 response
      expect(response.status).toBe(401);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toBe('Authentication required');
    });

    it('should return 403 when user tries to access another user\'s session', async () => {
      // Arrange: Session belongs to different user
      const otherUserSession = {
        ...sampleExamSession,
        user_id: 'different_user_456'
      };
      
      mockSupabase.single.mockResolvedValue({
        data: otherUserSession,
        error: null
      });

      // Act
      const { GET } = await import('@/app/api/academia/exams/sessions/[sessionId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_SESSION_ID}`);
      const params = { sessionId: VALID_SESSION_ID };
      const response = await GET(request, { params });
      
      // Assert: Should deny access to other user's session
      expect(response.status).toBe(403);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toContain('Access denied');
    });

    it('should return 500 when database query fails', async () => {
      // Arrange: Mock database error
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'CONNECTION_ERROR' }
      });

      // Act
      const { GET } = await import('@/app/api/academia/exams/sessions/[sessionId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_SESSION_ID}`);
      const params = { sessionId: VALID_SESSION_ID };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(500);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
    });
  });

  describe('Performance Requirements', () => {
    it('should respond within 200ms under normal conditions', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: sampleExamSession,
        error: null
      });

      const startTime = Date.now();
      
      // Act
      const { GET } = await import('@/app/api/academia/exams/sessions/[sessionId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_SESSION_ID}`);
      const params = { sessionId: VALID_SESSION_ID };
      const response = await GET(request, { params });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Assert
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(200); // Performance requirement
    });
  });

  describe('Security and Data Integrity', () => {
    it('should include security headers', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: sampleExamSession,
        error: null
      });

      // Act
      const { GET } = await import('@/app/api/academia/exams/sessions/[sessionId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_SESSION_ID}`);
      const params = { sessionId: VALID_SESSION_ID };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(200);
      
      // Verify security headers
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
      expect(response.headers.get('x-frame-options')).toBeDefined();
    });

    it('should not expose sensitive session data', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: sampleExamSession,
        error: null
      });

      // Act
      const { GET } = await import('@/app/api/academia/exams/sessions/[sessionId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_SESSION_ID}`);
      const params = { sessionId: VALID_SESSION_ID };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      
      // Should not include sensitive internal fields
      expect(responseData).not.toHaveProperty('question_answers_key');
      expect(responseData).not.toHaveProperty('internal_session_config');
      expect(responseData).not.toHaveProperty('admin_notes');
    });
  });
});