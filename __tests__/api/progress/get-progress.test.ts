/**
 * API Contract Test: GET /api/academia/progress/{courseId}
 * 
 * Tests the complete API contract for retrieving user's course progress
 * Following Test-Driven Development - MUST FAIL INITIALLY
 * 
 * Contract Definition: /specs/002-course-centric-academy/contracts/api.yaml
 * Implementation: app/api/academia/progress/[courseId]/route.ts
 * 
 * @group api-contracts
 * @group progress
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { UserCourseProgress } from '@/lib/types/academia';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  single: vi.fn(() => mockSupabase),
  data: null as UserCourseProgress | null,
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

describe('API Contract: GET /api/academia/progress/{courseId}', () => {
  const API_BASE = '/api/academia/progress';
  const VALID_COURSE_ID = 'course_001';
  
  // Sample progress data matching OpenAPI UserCourseProgress schema
  const sampleUserProgress: UserCourseProgress = {
    id: 'progress_001',
    user_id: 'user_123',
    course_id: 'course_001',
    enrollment_date: new Date('2024-01-15T10:30:00Z'),
    last_activity: new Date('2024-01-20T14:45:30Z'),
    overall_progress: 0.65,
    component_progress: {
      reading: 0.75,
      writing: 0.60,
      listening: 0.70,
      speaking: 0.55
    },
    readiness_score: 0.68,
    target_exam_date: new Date('2024-06-15T00:00:00Z'),
    created_at: new Date('2024-01-15T10:30:00Z'),
    updated_at: new Date('2024-01-20T14:45:30Z')
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
    it('should return 200 with UserCourseProgress when valid courseId provided', async () => {
      // Arrange: Mock successful progress retrieval
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValue({
        data: sampleUserProgress,
        error: null
      });

      // Act: Import and call the API route handler
      const { GET } = await import('@/app/api/academia/progress/[courseId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_COURSE_ID}`);
      const params = { courseId: VALID_COURSE_ID };
      const response = await GET(request, { params });
      
      // Assert: Response structure matches OpenAPI contract
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      
      // Verify UserCourseProgress schema compliance
      expect(responseData).toHaveProperty('id');
      expect(responseData).toHaveProperty('user_id');
      expect(responseData).toHaveProperty('course_id');
      expect(responseData).toHaveProperty('enrollment_date');
      expect(responseData).toHaveProperty('last_activity');
      expect(responseData).toHaveProperty('overall_progress');
      expect(responseData).toHaveProperty('component_progress');
      expect(responseData).toHaveProperty('readiness_score');
      expect(responseData).toHaveProperty('target_exam_date');
      
      // Verify data types and UUID format
      expect(typeof responseData.id).toBe('string');
      expect(responseData.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(typeof responseData.user_id).toBe('string');
      expect(responseData.user_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(typeof responseData.course_id).toBe('string');
      expect(responseData.course_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      // Verify date fields are ISO strings
      expect(typeof responseData.enrollment_date).toBe('string');
      expect(new Date(responseData.enrollment_date)).toBeInstanceOf(Date);
      expect(typeof responseData.last_activity).toBe('string');
      expect(new Date(responseData.last_activity)).toBeInstanceOf(Date);
      
      // Verify progress values are within valid range (0.0-1.0)
      expect(typeof responseData.overall_progress).toBe('number');
      expect(responseData.overall_progress).toBeGreaterThanOrEqual(0);
      expect(responseData.overall_progress).toBeLessThanOrEqual(1);
      
      expect(typeof responseData.readiness_score).toBe('number');
      expect(responseData.readiness_score).toBeGreaterThanOrEqual(0);
      expect(responseData.readiness_score).toBeLessThanOrEqual(1);
      
      // Verify component_progress structure and values
      expect(typeof responseData.component_progress).toBe('object');
      const componentProgress = responseData.component_progress;
      
      // Must have all skill components
      ['reading', 'writing', 'listening', 'speaking'].forEach(component => {
        expect(componentProgress).toHaveProperty(component);
        expect(typeof componentProgress[component]).toBe('number');
        expect(componentProgress[component]).toBeGreaterThanOrEqual(0);
        expect(componentProgress[component]).toBeLessThanOrEqual(1);
      });
      
      // Verify target_exam_date can be null or valid date
      if (responseData.target_exam_date !== null) {
        expect(typeof responseData.target_exam_date).toBe('string');
        expect(new Date(responseData.target_exam_date)).toBeInstanceOf(Date);
      }
      
      // Verify database was queried with correct parameters
      expect(mockSupabase.from).toHaveBeenCalledWith('user_course_progress');
      expect(mockSupabase.eq).toHaveBeenCalledWith('course_id', VALID_COURSE_ID);
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user_123');
    });

    it('should return progress with null target_exam_date when not set', async () => {
      // Arrange: Progress without target exam date
      const progressWithoutTarget = {
        ...sampleUserProgress,
        target_exam_date: null
      };
      
      mockSupabase.single.mockResolvedValue({
        data: progressWithoutTarget,
        error: null
      });

      // Act
      const { GET } = await import('@/app/api/academia/progress/[courseId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_COURSE_ID}`);
      const params = { courseId: VALID_COURSE_ID };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.target_exam_date).toBeNull();
    });

    it('should return progress with different completion levels', async () => {
      const progressLevels = [
        { overall_progress: 0.0, readiness_score: 0.0 }, // Just started
        { overall_progress: 0.25, readiness_score: 0.15 }, // Beginner
        { overall_progress: 0.50, readiness_score: 0.45 }, // Intermediate
        { overall_progress: 0.80, readiness_score: 0.75 }, // Advanced
        { overall_progress: 1.0, readiness_score: 0.95 }  // Completed
      ];

      for (const level of progressLevels) {
        // Arrange
        const progressAtLevel = {
          ...sampleUserProgress,
          ...level,
          component_progress: {
            reading: level.overall_progress,
            writing: level.overall_progress,
            listening: level.overall_progress,
            speaking: level.overall_progress
          }
        };
        
        mockSupabase.single.mockResolvedValue({
          data: progressAtLevel,
          error: null
        });

        // Act
        const { GET } = await import('@/app/api/academia/progress/[courseId]/route');
        const request = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_COURSE_ID}`);
        const params = { courseId: VALID_COURSE_ID };
        const response = await GET(request, { params });
        
        // Assert
        expect(response.status).toBe(200);
        
        const responseData = await response.json();
        expect(responseData.overall_progress).toBe(level.overall_progress);
        expect(responseData.readiness_score).toBe(level.readiness_score);
        
        vi.clearAllMocks();
      }
    });

    it('should include correct Content-Type header', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: sampleUserProgress,
        error: null
      });

      // Act
      const { GET } = await import('@/app/api/academia/progress/[courseId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_COURSE_ID}`);
      const params = { courseId: VALID_COURSE_ID };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should handle varying component progress patterns', async () => {
      // Arrange: User with uneven progress across components
      const unevenProgress = {
        ...sampleUserProgress,
        overall_progress: 0.58,
        component_progress: {
          reading: 0.85,  // Strong in reading
          writing: 0.40,  // Weak in writing
          listening: 0.60, // Average in listening
          speaking: 0.45   // Weak in speaking
        },
        readiness_score: 0.52 // Reflects uneven skills
      };
      
      mockSupabase.single.mockResolvedValue({
        data: unevenProgress,
        error: null
      });

      // Act
      const { GET } = await import('@/app/api/academia/progress/[courseId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_COURSE_ID}`);
      const params = { courseId: VALID_COURSE_ID };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.component_progress.reading).toBe(0.85);
      expect(responseData.component_progress.writing).toBe(0.40);
      expect(responseData.component_progress.listening).toBe(0.60);
      expect(responseData.component_progress.speaking).toBe(0.45);
      
      // Overall progress should reflect the mixed levels
      expect(responseData.overall_progress).toBe(0.58);
      expect(responseData.readiness_score).toBe(0.52);
    });
  });

  describe('Error Scenarios', () => {
    it('should return 404 when user has no progress for the course', async () => {
      // Arrange: Mock no progress found
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' }
      });

      // Act
      const { GET } = await import('@/app/api/academia/progress/[courseId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/nonexistent_course`);
      const params = { courseId: 'nonexistent_course' };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(404);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toContain('Progress not found');
    });

    it('should return 404 when courseId format is invalid', async () => {
      // Act: Request with invalid UUID format
      const { GET } = await import('@/app/api/academia/progress/[courseId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/invalid-uuid-format`);
      const params = { courseId: 'invalid-uuid-format' };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(404);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toContain('Invalid course ID format');
    });

    it('should return 401 when user is not authenticated', async () => {
      // Arrange: Mock unauthenticated user
      const { getCurrentUser } = await import('@/utils/auth');
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      // Act
      const { GET } = await import('@/app/api/academia/progress/[courseId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_COURSE_ID}`);
      const params = { courseId: VALID_COURSE_ID };
      const response = await GET(request, { params });
      
      // Assert: Matches OpenAPI contract for 401 response
      expect(response.status).toBe(401);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toBe('Authentication required');
    });

    it('should return 403 when user tries to access another user\'s progress', async () => {
      // Arrange: Progress belongs to different user
      const otherUserProgress = {
        ...sampleUserProgress,
        user_id: 'different_user_456'
      };
      
      mockSupabase.single.mockResolvedValue({
        data: otherUserProgress,
        error: null
      });

      // Act
      const { GET } = await import('@/app/api/academia/progress/[courseId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_COURSE_ID}`);
      const params = { courseId: VALID_COURSE_ID };
      const response = await GET(request, { params });
      
      // Assert: Should deny access to other user's progress
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
      const { GET } = await import('@/app/api/academia/progress/[courseId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_COURSE_ID}`);
      const params = { courseId: VALID_COURSE_ID };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(500);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
    });

    it('should return 500 when Supabase client creation fails', async () => {
      // Arrange: Mock Supabase client failure
      const { createClient } = await import('@/utils/supabase/server');
      vi.mocked(createClient).mockImplementation(() => {
        throw new Error('Supabase initialization failed');
      });

      // Act
      const { GET } = await import('@/app/api/academia/progress/[courseId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_COURSE_ID}`);
      const params = { courseId: VALID_COURSE_ID };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(500);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
    });
  });

  describe('Path Parameter Validation', () => {
    it('should validate courseId as UUID format', async () => {
      const validUUIDs = [
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        '00000000-0000-0000-0000-000000000000'
      ];

      for (const uuid of validUUIDs) {
        // Arrange
        const progressForUUID = { ...sampleUserProgress, course_id: uuid };
        mockSupabase.single.mockResolvedValue({
          data: progressForUUID,
          error: null
        });

        // Act
        const { GET } = await import('@/app/api/academia/progress/[courseId]/route');
        const request = new NextRequest(`http://localhost:3000${API_BASE}/${uuid}`);
        const params = { courseId: uuid };
        const response = await GET(request, { params });
        
        // Assert
        expect(response.status).toBe(200);
        
        const responseData = await response.json();
        expect(responseData.course_id).toBe(uuid);
        
        vi.clearAllMocks();
      }
    });

    it('should reject malformed UUID formats', async () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '12345',
        'f47ac10b-58cc-4372-a567', // Too short
        'f47ac10b-58cc-4372-a567-0e02b2c3d479-extra', // Too long
        'g47ac10b-58cc-4372-a567-0e02b2c3d479', // Invalid character
        '', // Empty string
        null,
        undefined
      ];

      for (const invalidId of invalidUUIDs) {
        // Act
        const { GET } = await import('@/app/api/academia/progress/[courseId]/route');
        const request = new NextRequest(`http://localhost:3000${API_BASE}/${invalidId || 'undefined'}`);
        const params = { courseId: invalidId || 'undefined' };
        const response = await GET(request, { params });
        
        // Assert: Should reject invalid UUID format
        expect(response.status).toBe(404);
        
        const responseData = await response.json();
        expect(responseData.error).toContain('Invalid course ID format');
        
        vi.clearAllMocks();
      }
    });

    it('should handle URL-encoded courseId parameters', async () => {
      // Arrange: Valid UUID that needs URL decoding
      const encodedUUID = encodeURIComponent('f47ac10b-58cc-4372-a567-0e02b2c3d479');
      const decodedUUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      
      const progressForEncodedUUID = { ...sampleUserProgress, course_id: decodedUUID };
      mockSupabase.single.mockResolvedValue({
        data: progressForEncodedUUID,
        error: null
      });

      // Act
      const { GET } = await import('@/app/api/academia/progress/[courseId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/${encodedUUID}`);
      const params = { courseId: encodedUUID };
      const response = await GET(request, { params });
      
      // Assert: Should properly decode and process UUID
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.course_id).toBe(decodedUUID);
    });

    it('should reject injection attempts in courseId', async () => {
      const maliciousInputs = [
        'f47ac10b-58cc-4372-a567-0e02b2c3d479; DROP TABLE users;',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479<script>alert("XSS")</script>',
        '../../../etc/passwd',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479%00',
        'UNION SELECT * FROM users'
      ];

      for (const maliciousInput of maliciousInputs) {
        // Act
        const { GET } = await import('@/app/api/academia/progress/[courseId]/route');
        const request = new NextRequest(`http://localhost:3000${API_BASE}/${encodeURIComponent(maliciousInput)}`);
        const params = { courseId: maliciousInput };
        const response = await GET(request, { params });
        
        // Assert: Should reject malicious input
        expect(response.status).toBe(404);
        
        const responseData = await response.json();
        expect(responseData.error).toContain('Invalid course ID format');
        
        vi.clearAllMocks();
      }
    });
  });

  describe('Performance Requirements', () => {
    it('should respond within 200ms under normal conditions', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: sampleUserProgress,
        error: null
      });

      const startTime = Date.now();
      
      // Act
      const { GET } = await import('@/app/api/academia/progress/[courseId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_COURSE_ID}`);
      const params = { courseId: VALID_COURSE_ID };
      const response = await GET(request, { params });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Assert
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(200); // Performance requirement
    });

    it('should handle multiple concurrent progress requests efficiently', async () => {
      // Arrange
      const differentCourseIds = [
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        'b2c3d4e5-f6g7-8901-bcde-f23456789012'
      ];
      
      mockSupabase.single.mockImplementation(() => {
        return Promise.resolve({
          data: sampleUserProgress,
          error: null
        });
      });

      // Act: Make concurrent requests for different courses
      const { GET } = await import('@/app/api/academia/progress/[courseId]/route');
      const requests = differentCourseIds.map(courseId => {
        const request = new NextRequest(`http://localhost:3000${API_BASE}/${courseId}`);
        const params = { courseId };
        return GET(request, { params });
      });

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Assert: All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Should handle concurrent requests efficiently
      expect(totalTime).toBeLessThan(500); // Multiple requests in under 500ms
    });

    it('should implement appropriate caching for progress data', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: sampleUserProgress,
        error: null
      });

      // Act: Make same request twice to test caching
      const { GET } = await import('@/app/api/academia/progress/[courseId]/route');
      
      const request1 = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_COURSE_ID}`);
      const params1 = { courseId: VALID_COURSE_ID };
      const response1 = await GET(request1, { params: params1 });
      
      const request2 = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_COURSE_ID}`);
      const params2 = { courseId: VALID_COURSE_ID };
      const response2 = await GET(request2, { params: params2 });
      
      // Assert: Both requests should succeed
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      
      // Should have appropriate cache headers for user-specific data
      const cacheControl1 = response1.headers.get('cache-control');
      expect(cacheControl1).toBeDefined();
      // User progress should have limited caching due to frequent updates
      if (cacheControl1) {
        expect(cacheControl1).toMatch(/private|no-cache|max-age=(?:[0-9]|[1-5][0-9]|60)$/); // Max 60 seconds
      }
    });
  });

  describe('Data Integrity and Security', () => {
    it('should validate progress data consistency', async () => {
      // Arrange: Progress data with potential integrity issues
      const progressToValidate = {
        ...sampleUserProgress,
        overall_progress: 0.70,
        component_progress: {
          reading: 0.80,
          writing: 0.65,
          listening: 0.75,
          speaking: 0.60
        },
        readiness_score: 0.68
      };
      
      mockSupabase.single.mockResolvedValue({
        data: progressToValidate,
        error: null
      });

      // Act
      const { GET } = await import('@/app/api/academia/progress/[courseId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_COURSE_ID}`);
      const params = { courseId: VALID_COURSE_ID };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      
      // Verify component progress consistency
      const components = Object.values(responseData.component_progress);
      const avgComponentProgress = components.reduce((sum, val) => sum + val, 0) / components.length;
      
      // Overall progress should be reasonably close to component average
      const progressDifference = Math.abs(responseData.overall_progress - avgComponentProgress);
      expect(progressDifference).toBeLessThan(0.2); // Allow some variance for weighting
      
      // Readiness score should be correlated with overall progress
      const readinessDifference = Math.abs(responseData.readiness_score - responseData.overall_progress);
      expect(readinessDifference).toBeLessThan(0.3); // Allow some variance for readiness calculation
    });

    it('should ensure progress values are within valid bounds', async () => {
      // Arrange: Test various edge cases for progress values
      const edgeCaseProgresses = [
        { overall_progress: 0.0, readiness_score: 0.0 }, // Minimum values
        { overall_progress: 1.0, readiness_score: 1.0 }, // Maximum values
        { overall_progress: 0.5, readiness_score: 0.5 }  // Mid values
      ];

      for (const edgeCase of edgeCaseProgresses) {
        // Arrange
        const edgeCaseProgress = {
          ...sampleUserProgress,
          ...edgeCase,
          component_progress: {
            reading: edgeCase.overall_progress,
            writing: edgeCase.overall_progress,
            listening: edgeCase.overall_progress,
            speaking: edgeCase.overall_progress
          }
        };
        
        mockSupabase.single.mockResolvedValue({
          data: edgeCaseProgress,
          error: null
        });

        // Act
        const { GET } = await import('@/app/api/academia/progress/[courseId]/route');
        const request = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_COURSE_ID}`);
        const params = { courseId: VALID_COURSE_ID };
        const response = await GET(request, { params });
        
        // Assert
        expect(response.status).toBe(200);
        
        const responseData = await response.json();
        
        // Verify all progress values are within valid bounds
        expect(responseData.overall_progress).toBeGreaterThanOrEqual(0);
        expect(responseData.overall_progress).toBeLessThanOrEqual(1);
        expect(responseData.readiness_score).toBeGreaterThanOrEqual(0);
        expect(responseData.readiness_score).toBeLessThanOrEqual(1);
        
        Object.values(responseData.component_progress).forEach((progress: any) => {
          expect(progress).toBeGreaterThanOrEqual(0);
          expect(progress).toBeLessThanOrEqual(1);
        });
        
        vi.clearAllMocks();
      }
    });

    it('should include security headers', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: sampleUserProgress,
        error: null
      });

      // Act
      const { GET } = await import('@/app/api/academia/progress/[courseId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_COURSE_ID}`);
      const params = { courseId: VALID_COURSE_ID };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(200);
      
      // Verify security headers
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
      expect(response.headers.get('x-frame-options')).toBeDefined();
      
      // Should not expose server information
      expect(response.headers.get('server')).toBeFalsy();
      expect(response.headers.get('x-powered-by')).toBeFalsy();
    });

    it('should not expose sensitive internal progress data', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: sampleUserProgress,
        error: null
      });

      // Act
      const { GET } = await import('@/app/api/academia/progress/[courseId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_COURSE_ID}`);
      const params = { courseId: VALID_COURSE_ID };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      
      // Should not include sensitive internal fields
      expect(responseData).not.toHaveProperty('internal_tracking_id');
      expect(responseData).not.toHaveProperty('payment_status');
      expect(responseData).not.toHaveProperty('admin_notes');
      expect(responseData).not.toHaveProperty('system_metadata');
      expect(responseData).not.toHaveProperty('raw_analytics_data');
    });
  });

  describe('GDPR/LOPD Compliance', () => {
    it('should implement proper access control for personal data', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: sampleUserProgress,
        error: null
      });

      // Act
      const { GET } = await import('@/app/api/academia/progress/[courseId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_COURSE_ID}`);
      const params = { courseId: VALID_COURSE_ID };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(200);
      
      // Verify access control was applied (user can only see their own progress)
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user_123');
    });

    it('should include privacy-compliant headers', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: sampleUserProgress,
        error: null
      });

      // Act
      const { GET } = await import('@/app/api/academia/progress/[courseId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_COURSE_ID}`);
      const params = { courseId: VALID_COURSE_ID };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(200);
      
      // Should include privacy compliance headers
      const cacheControl = response.headers.get('cache-control');
      expect(cacheControl).toBeDefined();
      
      // Personal data should have private caching
      if (cacheControl) {
        expect(cacheControl).toContain('private');
      }
      
      // Should not index personal data
      expect(response.headers.get('x-robots-tag')).toBeDefined();
    });

    it('should handle data minimization principles', async () => {
      // This test verifies that only necessary progress data is returned
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: sampleUserProgress,
        error: null
      });

      // Act
      const { GET } = await import('@/app/api/academia/progress/[courseId]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/${VALID_COURSE_ID}`);
      const params = { courseId: VALID_COURSE_ID };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      
      // Should only include fields defined in the OpenAPI schema
      const allowedFields = [
        'id', 'user_id', 'course_id', 'enrollment_date', 'last_activity',
        'overall_progress', 'component_progress', 'readiness_score', 'target_exam_date'
      ];
      
      Object.keys(responseData).forEach(field => {
        expect(allowedFields).toContain(field);
      });
      
      // Should not include any additional personal information
      expect(Object.keys(responseData)).toHaveLength(allowedFields.length);
    });
  });
});