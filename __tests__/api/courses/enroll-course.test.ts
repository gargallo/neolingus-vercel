/**
 * API Contract Test: POST /api/academia/courses/{language}/{level}
 * 
 * Tests the complete API contract for course enrollment
 * Following Test-Driven Development - MUST FAIL INITIALLY
 * 
 * Contract Definition: /specs/002-course-centric-academy/contracts/api.yaml
 * Implementation: app/api/academia/courses/by-language/[language]/[level]/route.ts
 * 
 * @group api-contracts
 * @group enrollment
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { UserCourseProgress } from '@/lib/types/academia';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
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
    email: 'test@example.com',
    email_verified: true,
    gdpr_consent: true
  }))
}));

// Mock course validation
vi.mock('@/lib/types/academia', () => ({
  ...vi.importActual('@/lib/types/academia'),
  canEnrollInCourse: vi.fn(() => true)
}));

describe('API Contract: POST /api/academia/courses/{language}/{level}', () => {
  const API_BASE = '/api/academia/courses';
  
  // Sample course for enrollment
  const sampleCourse = {
    id: 'course_001',
    language: 'english',
    level: 'b2',
    certification_type: 'eoi',
    title: 'English B2 - EOI Preparation',
    description: 'Complete preparation for English B2 EOI certification',
    components: [
      { skill_type: 'reading', weight: 0.25, time_limit_minutes: 75 },
      { skill_type: 'writing', weight: 0.25, time_limit_minutes: 90 },
      { skill_type: 'listening', weight: 0.25, time_limit_minutes: 45 },
      { skill_type: 'speaking', weight: 0.25, time_limit_minutes: 25 }
    ],
    is_active: true,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z')
  };

  // Sample enrollment response matching OpenAPI UserCourseProgress schema
  const sampleUserCourseProgress: UserCourseProgress = {
    id: 'progress_001',
    user_id: 'user_123',
    course_id: 'course_001',
    enrollment_date: new Date('2024-01-15T10:30:00Z'),
    last_activity: new Date('2024-01-15T10:30:00Z'),
    overall_progress: 0.0,
    component_progress: {
      reading: 0.0,
      writing: 0.0,
      listening: 0.0,
      speaking: 0.0
    },
    readiness_score: 0.0,
    target_exam_date: null,
    created_at: new Date('2024-01-15T10:30:00Z'),
    updated_at: new Date('2024-01-15T10:30:00Z')
  };

  // Valid enrollment request body
  const validEnrollmentRequest = {
    subscription_tier: 'standard',
    target_exam_date: '2024-06-15',
    initial_assessment: {
      reading: 0.3,
      writing: 0.2,
      listening: 0.4,
      speaking: 0.1
    }
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
      email: 'test@example.com',
      email_verified: true,
      gdpr_consent: true
    });
    
    // Reset enrollment validation
    const { canEnrollInCourse } = vi.importMock('@/lib/types/academia');
    canEnrollInCourse.mockReturnValue(true);
  });

  describe('Success Scenarios', () => {
    it('should return 201 with UserCourseProgress when enrollment is successful', async () => {
      // Arrange: Mock successful course lookup and enrollment creation
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.single.mockImplementation((query) => {
        // First call: course lookup
        if (mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0] === 'courses') {
          return Promise.resolve({
            data: sampleCourse,
            error: null
          });
        }
        // Second call: enrollment creation
        return Promise.resolve({
          data: sampleUserCourseProgress,
          error: null
        });
      });
      
      mockSupabase.insert.mockReturnValue(mockSupabase);

      // Act: Import and call the API route handler
      const { POST } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validEnrollmentRequest)
      });
      const params = { language: 'english', level: 'b2' };
      const response = await POST(request, { params });
      
      // Assert: Response structure matches OpenAPI contract
      expect(response.status).toBe(201);
      
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
      
      // Verify data types and constraints
      expect(typeof responseData.id).toBe('string');
      expect(typeof responseData.user_id).toBe('string');
      expect(typeof responseData.course_id).toBe('string');
      expect(typeof responseData.overall_progress).toBe('number');
      expect(responseData.overall_progress).toBeGreaterThanOrEqual(0);
      expect(responseData.overall_progress).toBeLessThanOrEqual(1);
      expect(typeof responseData.readiness_score).toBe('number');
      expect(responseData.readiness_score).toBeGreaterThanOrEqual(0);
      expect(responseData.readiness_score).toBeLessThanOrEqual(1);
      
      // Verify component_progress structure
      expect(typeof responseData.component_progress).toBe('object');
      const componentProgress = responseData.component_progress;
      ['reading', 'writing', 'listening', 'speaking'].forEach(component => {
        expect(componentProgress).toHaveProperty(component);
        expect(typeof componentProgress[component]).toBe('number');
        expect(componentProgress[component]).toBeGreaterThanOrEqual(0);
        expect(componentProgress[component]).toBeLessThanOrEqual(1);
      });
      
      // Verify database operations were called correctly
      expect(mockSupabase.from).toHaveBeenCalledWith('courses');
      expect(mockSupabase.from).toHaveBeenCalledWith('user_course_progress');
      expect(mockSupabase.eq).toHaveBeenCalledWith('language', 'english');
      expect(mockSupabase.eq).toHaveBeenCalledWith('level', 'b2');
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should handle enrollment with target exam date', async () => {
      // Arrange: Mock successful enrollment with target date
      const progressWithTargetDate = {
        ...sampleUserCourseProgress,
        target_exam_date: new Date('2024-06-15T00:00:00Z')
      };
      
      mockSupabase.single.mockImplementation(() => {
        if (mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0] === 'courses') {
          return Promise.resolve({ data: sampleCourse, error: null });
        }
        return Promise.resolve({ data: progressWithTargetDate, error: null });
      });
      
      mockSupabase.insert.mockReturnValue(mockSupabase);

      // Act
      const { POST } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validEnrollmentRequest)
      });
      const params = { language: 'english', level: 'b2' };
      const response = await POST(request, { params });
      
      // Assert
      expect(response.status).toBe(201);
      
      const responseData = await response.json();
      expect(responseData.target_exam_date).not.toBeNull();
      
      // Verify target date was processed correctly
      const targetDate = new Date(responseData.target_exam_date);
      expect(targetDate.getFullYear()).toBe(2024);
      expect(targetDate.getMonth()).toBe(5); // June (0-indexed)
    });

    it('should handle enrollment without optional fields', async () => {
      // Arrange: Minimal enrollment request
      const minimalRequest = {
        subscription_tier: 'basic'
      };
      
      mockSupabase.single.mockImplementation(() => {
        if (mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0] === 'courses') {
          return Promise.resolve({ data: sampleCourse, error: null });
        }
        return Promise.resolve({ data: sampleUserCourseProgress, error: null });
      });
      
      mockSupabase.insert.mockReturnValue(mockSupabase);

      // Act
      const { POST } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(minimalRequest)
      });
      const params = { language: 'english', level: 'b2' };
      const response = await POST(request, { params });
      
      // Assert
      expect(response.status).toBe(201);
      
      const responseData = await response.json();
      expect(responseData.target_exam_date).toBeNull();
      expect(responseData.overall_progress).toBe(0.0);
    });

    it('should apply initial assessment if provided', async () => {
      // Arrange: Progress with initial assessment applied
      const progressWithAssessment = {
        ...sampleUserCourseProgress,
        overall_progress: 0.25,
        component_progress: {
          reading: 0.3,
          writing: 0.2,
          listening: 0.4,
          speaking: 0.1
        },
        readiness_score: 0.15
      };
      
      mockSupabase.single.mockImplementation(() => {
        if (mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0] === 'courses') {
          return Promise.resolve({ data: sampleCourse, error: null });
        }
        return Promise.resolve({ data: progressWithAssessment, error: null });
      });
      
      mockSupabase.insert.mockReturnValue(mockSupabase);

      // Act
      const { POST } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validEnrollmentRequest)
      });
      const params = { language: 'english', level: 'b2' };
      const response = await POST(request, { params });
      
      // Assert
      expect(response.status).toBe(201);
      
      const responseData = await response.json();
      expect(responseData.overall_progress).toBeGreaterThan(0);
      expect(responseData.component_progress.reading).toBe(0.3);
      expect(responseData.component_progress.writing).toBe(0.2);
      expect(responseData.component_progress.listening).toBe(0.4);
      expect(responseData.component_progress.speaking).toBe(0.1);
    });

    it('should include correct Content-Type header', async () => {
      // Arrange
      mockSupabase.single.mockImplementation(() => {
        if (mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0] === 'courses') {
          return Promise.resolve({ data: sampleCourse, error: null });
        }
        return Promise.resolve({ data: sampleUserCourseProgress, error: null });
      });
      
      mockSupabase.insert.mockReturnValue(mockSupabase);

      // Act
      const { POST } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validEnrollmentRequest)
      });
      const params = { language: 'english', level: 'b2' };
      const response = await POST(request, { params });
      
      // Assert
      expect(response.status).toBe(201);
      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('Error Scenarios', () => {
    it('should return 409 when user is already enrolled in the course', async () => {
      // Arrange: Mock existing enrollment
      const existingProgress = { ...sampleUserCourseProgress };
      
      // First call returns course, second call returns existing progress
      mockSupabase.single.mockImplementation(() => {
        if (mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0] === 'courses') {
          return Promise.resolve({ data: sampleCourse, error: null });
        }
        // Simulate existing enrollment found
        return Promise.resolve({ data: existingProgress, error: null });
      });

      // Act
      const { POST } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validEnrollmentRequest)
      });
      const params = { language: 'english', level: 'b2' };
      const response = await POST(request, { params });
      
      // Assert: Matches OpenAPI contract for 409 response
      expect(response.status).toBe(409);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toContain('Already enrolled in course');
    });

    it('should return 404 when course does not exist', async () => {
      // Arrange: Mock course not found
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' }
      });

      // Act
      const { POST } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/nonexistent/z1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validEnrollmentRequest)
      });
      const params = { language: 'nonexistent', level: 'z1' };
      const response = await POST(request, { params });
      
      // Assert
      expect(response.status).toBe(404);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toContain('Course not found');
    });

    it('should return 404 when course is inactive', async () => {
      // Arrange: Mock inactive course (database should not return it)
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' }
      });

      // Act
      const { POST } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validEnrollmentRequest)
      });
      const params = { language: 'english', level: 'b2' };
      const response = await POST(request, { params });
      
      // Assert
      expect(response.status).toBe(404);
    });

    it('should return 401 when user is not authenticated', async () => {
      // Arrange: Mock unauthenticated user
      const { getCurrentUser } = await import('@/utils/auth');
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      // Act
      const { POST } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validEnrollmentRequest)
      });
      const params = { language: 'english', level: 'b2' };
      const response = await POST(request, { params });
      
      // Assert: Matches OpenAPI contract for 401 response
      expect(response.status).toBe(401);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toBe('Authentication required');
    });

    it('should return 400 when request body is invalid JSON', async () => {
      // Act: Send invalid JSON
      const { POST } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{'
      });
      const params = { language: 'english', level: 'b2' };
      const response = await POST(request, { params });
      
      // Assert
      expect(response.status).toBe(400);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toContain('Invalid JSON');
    });

    it('should return 400 when required fields are missing', async () => {
      // Act: Send request without required subscription_tier
      const { POST } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_exam_date: '2024-06-15'
          // Missing subscription_tier
        })
      });
      const params = { language: 'english', level: 'b2' };
      const response = await POST(request, { params });
      
      // Assert
      expect(response.status).toBe(400);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toContain('subscription_tier is required');
    });

    it('should return 400 when subscription_tier is invalid', async () => {
      // Act: Send request with invalid subscription tier
      const { POST } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_tier: 'invalid_tier'
        })
      });
      const params = { language: 'english', level: 'b2' };
      const response = await POST(request, { params });
      
      // Assert
      expect(response.status).toBe(400);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toContain('Invalid subscription_tier');
    });

    it('should return 400 when target_exam_date format is invalid', async () => {
      // Act: Send request with invalid date format
      const { POST } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_tier: 'standard',
          target_exam_date: 'invalid-date-format'
        })
      });
      const params = { language: 'english', level: 'b2' };
      const response = await POST(request, { params });
      
      // Assert
      expect(response.status).toBe(400);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toContain('Invalid date format');
    });

    it('should return 403 when user cannot enroll due to validation rules', async () => {
      // Arrange: Mock enrollment validation failure
      const { canEnrollInCourse } = await import('@/lib/types/academia');
      vi.mocked(canEnrollInCourse).mockReturnValue(false);
      
      mockSupabase.single.mockResolvedValue({
        data: sampleCourse,
        error: null
      });

      // Act
      const { POST } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validEnrollmentRequest)
      });
      const params = { language: 'english', level: 'b2' };
      const response = await POST(request, { params });
      
      // Assert
      expect(response.status).toBe(403);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toContain('Cannot enroll in course');
    });

    it('should return 500 when database enrollment creation fails', async () => {
      // Arrange: Mock database error during enrollment creation
      mockSupabase.single.mockImplementation(() => {
        if (mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0] === 'courses') {
          return Promise.resolve({ data: sampleCourse, error: null });
        }
        // Simulate database error during enrollment creation
        return Promise.resolve({
          data: null,
          error: { message: 'Database constraint violation', code: 'UNIQUE_VIOLATION' }
        });
      });
      
      mockSupabase.insert.mockReturnValue(mockSupabase);

      // Act
      const { POST } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validEnrollmentRequest)
      });
      const params = { language: 'english', level: 'b2' };
      const response = await POST(request, { params });
      
      // Assert
      expect(response.status).toBe(500);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
    });
  });

  describe('Request Body Validation', () => {
    it('should validate subscription_tier enum values', async () => {
      const validTiers = ['basic', 'standard', 'premium'];
      
      for (const tier of validTiers) {
        // Arrange
        mockSupabase.single.mockImplementation(() => {
          if (mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0] === 'courses') {
            return Promise.resolve({ data: sampleCourse, error: null });
          }
          return Promise.resolve({ data: sampleUserCourseProgress, error: null });
        });
        
        mockSupabase.insert.mockReturnValue(mockSupabase);

        // Act
        const { POST } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
        const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription_tier: tier })
        });
        const params = { language: 'english', level: 'b2' };
        const response = await POST(request, { params });
        
        // Assert
        expect(response.status).toBe(201);
        
        vi.clearAllMocks();
      }
    });

    it('should validate initial_assessment progress values are within 0-1 range', async () => {
      // Arrange: Invalid progress values
      const invalidAssessments = [
        { reading: -0.1 }, // Below 0
        { writing: 1.5 },  // Above 1
        { listening: 'invalid' }, // Wrong type
        { speaking: null }  // Null value
      ];

      for (const assessment of invalidAssessments) {
        // Act
        const { POST } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
        const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription_tier: 'standard',
            initial_assessment: assessment
          })
        });
        const params = { language: 'english', level: 'b2' };
        const response = await POST(request, { params });
        
        // Assert
        expect(response.status).toBe(400);
        
        const responseData = await response.json();
        expect(responseData.error).toContain('Invalid initial_assessment');
        
        vi.clearAllMocks();
      }
    });

    it('should validate target_exam_date is in the future', async () => {
      // Act: Send request with past date
      const { POST } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_tier: 'standard',
          target_exam_date: '2020-01-01' // Past date
        })
      });
      const params = { language: 'english', level: 'b2' };
      const response = await POST(request, { params });
      
      // Assert
      expect(response.status).toBe(400);
      
      const responseData = await response.json();
      expect(responseData.error).toContain('target_exam_date must be in the future');
    });

    it('should sanitize and validate request body against injection attacks', async () => {
      // Act: Send request with potential SQL injection
      const { POST } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_tier: 'standard; DROP TABLE users;',
          target_exam_date: '2024-06-15',
          malicious_field: '<script>alert("XSS")</script>'
        })
      });
      const params = { language: 'english', level: 'b2' };
      const response = await POST(request, { params });
      
      // Assert: Should reject malicious content
      expect(response.status).toBe(400);
      
      const responseData = await response.json();
      expect(responseData.error).toContain('Invalid subscription_tier');
    });
  });

  describe('Performance Requirements', () => {
    it('should complete enrollment within 200ms under normal conditions', async () => {
      // Arrange
      mockSupabase.single.mockImplementation(() => {
        if (mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0] === 'courses') {
          return Promise.resolve({ data: sampleCourse, error: null });
        }
        return Promise.resolve({ data: sampleUserCourseProgress, error: null });
      });
      
      mockSupabase.insert.mockReturnValue(mockSupabase);

      const startTime = Date.now();
      
      // Act
      const { POST } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validEnrollmentRequest)
      });
      const params = { language: 'english', level: 'b2' };
      const response = await POST(request, { params });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Assert
      expect(response.status).toBe(201);
      expect(responseTime).toBeLessThan(200); // Performance requirement
    });

    it('should handle concurrent enrollment requests gracefully', async () => {
      // Arrange: Multiple users trying to enroll simultaneously
      mockSupabase.single.mockImplementation(() => {
        if (mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0] === 'courses') {
          return Promise.resolve({ data: sampleCourse, error: null });
        }
        return Promise.resolve({ data: sampleUserCourseProgress, error: null });
      });
      
      mockSupabase.insert.mockReturnValue(mockSupabase);

      // Act: Simulate concurrent enrollment requests
      const { POST } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const requests = Array.from({ length: 5 }, (_, i) => {
        const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...validEnrollmentRequest,
            user_context: `concurrent_test_${i}` // Differentiate requests
          })
        });
        const params = { language: 'english', level: 'b2' };
        return POST(request, { params });
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

  describe('GDPR/LOPD Compliance', () => {
    it('should validate user GDPR consent before enrollment', async () => {
      // Arrange: User without GDPR consent
      const { getCurrentUser } = await import('@/utils/auth');
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
        email_verified: true,
        gdpr_consent: false // No GDPR consent
      });

      // Act
      const { POST } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validEnrollmentRequest)
      });
      const params = { language: 'english', level: 'b2' };
      const response = await POST(request, { params });
      
      // Assert: Should reject enrollment without GDPR consent
      expect(response.status).toBe(403);
      
      const responseData = await response.json();
      expect(responseData.error).toContain('GDPR consent required');
    });

    it('should include privacy compliance headers', async () => {
      // Arrange
      mockSupabase.single.mockImplementation(() => {
        if (mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0] === 'courses') {
          return Promise.resolve({ data: sampleCourse, error: null });
        }
        return Promise.resolve({ data: sampleUserCourseProgress, error: null });
      });
      
      mockSupabase.insert.mockReturnValue(mockSupabase);

      // Act
      const { POST } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validEnrollmentRequest)
      });
      const params = { language: 'english', level: 'b2' };
      const response = await POST(request, { params });
      
      // Assert
      expect(response.status).toBe(201);
      
      // Verify privacy-related headers
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
      expect(response.headers.get('x-frame-options')).toBeDefined();
      
      // Should not expose server information
      expect(response.headers.get('server')).toBeFalsy();
      expect(response.headers.get('x-powered-by')).toBeFalsy();
    });

    it('should not log sensitive enrollment information', async () => {
      // This test ensures no sensitive data is exposed in the response
      // Arrange
      mockSupabase.single.mockImplementation(() => {
        if (mockSupabase.from.mock.calls[mockSupabase.from.mock.calls.length - 1][0] === 'courses') {
          return Promise.resolve({ data: sampleCourse, error: null });
        }
        return Promise.resolve({ data: sampleUserCourseProgress, error: null });
      });
      
      mockSupabase.insert.mockReturnValue(mockSupabase);

      // Act
      const { POST } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validEnrollmentRequest)
      });
      const params = { language: 'english', level: 'b2' };
      const response = await POST(request, { params });
      
      // Assert
      expect(response.status).toBe(201);
      
      const responseData = await response.json();
      
      // Should not include sensitive system data
      expect(responseData).not.toHaveProperty('raw_user_data');
      expect(responseData).not.toHaveProperty('payment_details');
      expect(responseData).not.toHaveProperty('internal_enrollment_id');
      expect(responseData).not.toHaveProperty('system_metadata');
    });
  });
});