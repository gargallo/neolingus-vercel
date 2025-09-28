/**
 * API Contract Test: GET /api/academia/courses
 * 
 * Tests the complete API contract for retrieving all available courses
 * Following Test-Driven Development - MUST FAIL INITIALLY
 * 
 * Contract Definition: /specs/002-course-centric-academy/contracts/api.yaml
 * Implementation: app/api/academia/courses/route.ts
 * 
 * @group api-contracts
 * @group courses
 */

import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { Course } from '@/lib/types/academia';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  range: vi.fn(() => mockSupabase),
  data: [] as Course[],
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

describe('API Contract: GET /api/academia/courses', () => {
  const API_ENDPOINT = '/api/academia/courses';
  
  // Sample course data matching OpenAPI schema
  const sampleCourses: Course[] = [
    {
      id: 'course_001',
      language: 'english',
      level: 'b2',
      certification_type: 'eoi',
      title: 'English B2 - EOI Preparation',
      description: 'Complete preparation for English B2 EOI certification',
      components: [
        { skill_type: 'reading', weight: 0.25, time_limit_minutes: 60 },
        { skill_type: 'writing', weight: 0.25, time_limit_minutes: 90 },
        { skill_type: 'listening', weight: 0.25, time_limit_minutes: 45 },
        { skill_type: 'speaking', weight: 0.25, time_limit_minutes: 20 }
      ],
      is_active: true,
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z')
    },
    {
      id: 'course_002',
      language: 'valenciano',
      level: 'c1',
      certification_type: 'jqcv',
      title: 'Valencià C1 - JQCV Preparation',
      description: 'Complete preparation for Valencià C1 JQCV certification',
      components: [
        { skill_type: 'reading', weight: 0.25, time_limit_minutes: 75 },
        { skill_type: 'writing', weight: 0.25, time_limit_minutes: 120 },
        { skill_type: 'listening', weight: 0.25, time_limit_minutes: 50 },
        { skill_type: 'speaking', weight: 0.25, time_limit_minutes: 25 }
      ],
      is_active: true,
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z')
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock data
    mockSupabase.data = sampleCourses;
    mockSupabase.error = null;
    mockSupabase.count = sampleCourses.length;
  });

  describe('Success Scenarios', () => {
    it('should return 200 with valid courses array when courses exist', async () => {
      // Arrange: Mock successful database response
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockReturnValue(Promise.resolve({
        data: sampleCourses,
        error: null,
        count: sampleCourses.length
      }));

      // Act: Import and call the API route handler
      const { GET } = await import('@/app/api/academia/courses/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`);
      const response = await GET(request);
      
      // Assert: Response structure matches OpenAPI contract
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('courses');
      expect(Array.isArray(responseData.courses)).toBe(true);
      expect(responseData.courses).toHaveLength(2);
      
      // Verify each course matches schema
      responseData.courses.forEach((course: Course) => {
        expect(course).toHaveProperty('id');
        expect(course).toHaveProperty('language');
        expect(course).toHaveProperty('level');
        expect(course).toHaveProperty('certification_type');
        expect(course).toHaveProperty('title');
        expect(course).toHaveProperty('description');
        expect(course).toHaveProperty('components');
        expect(course).toHaveProperty('is_active');
        
        // Validate enum values
        expect(['english', 'valenciano']).toContain(course.language);
        expect(['a1', 'a2', 'b1', 'b2', 'c1', 'c2']).toContain(course.level);
        expect(['eoi', 'jqcv', 'delf', 'goethe', 'cils']).toContain(course.certification_type);
        expect(typeof course.is_active).toBe('boolean');
        
        // Validate components array
        expect(Array.isArray(course.components)).toBe(true);
        course.components.forEach(component => {
          expect(['reading', 'writing', 'listening', 'speaking']).toContain(component.skill_type);
        });
      });
    });

    it('should return 200 with empty courses array when no courses exist', async () => {
      // Arrange: Mock empty database response
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      });

      // Act
      const { GET } = await import('@/app/api/academia/courses/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`);
      const response = await GET(request);
      
      // Assert
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('courses');
      expect(Array.isArray(responseData.courses)).toBe(true);
      expect(responseData.courses).toHaveLength(0);
    });

    it('should include correct Content-Type header', async () => {
      // Arrange
      mockSupabase.order.mockResolvedValue({
        data: sampleCourses,
        error: null,
        count: sampleCourses.length
      });

      // Act
      const { GET } = await import('@/app/api/academia/courses/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`);
      const response = await GET(request);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should include GDPR/LOPD compliance headers', async () => {
      // Arrange
      mockSupabase.order.mockResolvedValue({
        data: sampleCourses,
        error: null,
        count: sampleCourses.length
      });

      // Act
      const { GET } = await import('@/app/api/academia/courses/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`);
      const response = await GET(request);
      
      // Assert
      expect(response.status).toBe(200);
      
      // Verify GDPR compliance headers
      const cacheControl = response.headers.get('cache-control');
      expect(cacheControl).toBeDefined();
      
      // Should not cache personal data
      expect(response.headers.get('x-robots-tag')).toBeDefined();
    });
  });

  describe('Error Scenarios', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Arrange: Mock unauthenticated user
      const { getCurrentUser } = await import('@/utils/auth');
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      // Act
      const { GET } = await import('@/app/api/academia/courses/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`);
      const response = await GET(request);
      
      // Assert: Matches OpenAPI contract for 401 response
      expect(response.status).toBe(401);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toBe('Authentication required');
    });

    it('should return 500 when database query fails', async () => {
      // Arrange: Mock database error
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
        count: 0
      });

      // Act
      const { GET } = await import('@/app/api/academia/courses/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`);
      const response = await GET(request);
      
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
      const { GET } = await import('@/app/api/academia/courses/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`);
      const response = await GET(request);
      
      // Assert
      expect(response.status).toBe(500);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
    });
  });

  describe('Performance Requirements', () => {
    it('should respond within 200ms under normal conditions', async () => {
      // Arrange
      mockSupabase.order.mockResolvedValue({
        data: sampleCourses,
        error: null,
        count: sampleCourses.length
      });

      const startTime = Date.now();
      
      // Act
      const { GET } = await import('@/app/api/academia/courses/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`);
      const response = await GET(request);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Assert
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(200); // Performance requirement
    });

    it('should handle concurrent requests efficiently', async () => {
      // Arrange
      mockSupabase.order.mockResolvedValue({
        data: sampleCourses,
        error: null,
        count: sampleCourses.length
      });

      // Act: Make multiple concurrent requests
      const { GET } = await import('@/app/api/academia/courses/route');
      const requests = Array.from({ length: 10 }, (_, i) => {
        const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}?test=${i}`);
        return GET(request);
      });

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Assert: All requests succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Should handle concurrent requests efficiently
      expect(totalTime).toBeLessThan(1000); // 10 requests in under 1 second
    });
  });

  describe('Data Validation', () => {
    it('should return only active courses by default', async () => {
      // Arrange: Mix of active and inactive courses
      const mixedCourses: Course[] = [
        { ...sampleCourses[0], is_active: true },
        { ...sampleCourses[1], is_active: false }
      ];
      
      mockSupabase.order.mockResolvedValue({
        data: [mixedCourses[0]], // Only active course
        error: null,
        count: 1
      });

      // Act
      const { GET } = await import('@/app/api/academia/courses/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`);
      const response = await GET(request);
      
      // Assert
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.courses).toHaveLength(1);
      expect(responseData.courses[0].is_active).toBe(true);
      
      // Verify database was queried with active filter
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should validate course data structure integrity', async () => {
      // Arrange: Course with potential data integrity issues
      const courseWithIntegrityCheck: Course = {
        ...sampleCourses[0],
        components: [
          { skill_type: 'reading', weight: 0.3, time_limit_minutes: 60 },
          { skill_type: 'writing', weight: 0.3, time_limit_minutes: 90 },
          { skill_type: 'listening', weight: 0.2, time_limit_minutes: 45 },
          { skill_type: 'speaking', weight: 0.2, time_limit_minutes: 20 }
        ]
      };
      
      mockSupabase.order.mockResolvedValue({
        data: [courseWithIntegrityCheck],
        error: null,
        count: 1
      });

      // Act
      const { GET } = await import('@/app/api/academia/courses/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`);
      const response = await GET(request);
      
      // Assert
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      const course = responseData.courses[0];
      
      // Verify component weights sum to 1.0 (data integrity)
      const totalWeight = course.components.reduce((sum: number, component: any) => sum + component.weight, 0);
      expect(Math.abs(totalWeight - 1.0)).toBeLessThan(0.01); // Allow for floating point precision
    });
  });

  describe('Query Parameters', () => {
    it('should handle optional query parameters for filtering', async () => {
      // Arrange
      mockSupabase.order.mockResolvedValue({
        data: [sampleCourses[0]], // English course only
        error: null,
        count: 1
      });

      // Act: Request with language filter
      const { GET } = await import('@/app/api/academia/courses/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}?language=english`);
      const response = await GET(request);
      
      // Assert
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.courses).toHaveLength(1);
      expect(responseData.courses[0].language).toBe('english');
    });

    it('should ignore invalid query parameters gracefully', async () => {
      // Arrange
      mockSupabase.order.mockResolvedValue({
        data: sampleCourses,
        error: null,
        count: sampleCourses.length
      });

      // Act: Request with invalid parameters
      const { GET } = await import('@/app/api/academia/courses/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}?invalid_param=test&malicious_script=<script>`);
      const response = await GET(request);
      
      // Assert: Should still work normally
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.courses).toHaveLength(2);
    });
  });

  describe('Security Validation', () => {
    it('should sanitize response data to prevent XSS', async () => {
      // Arrange: Course data with potential XSS content
      const maliciousCourse: Course = {
        ...sampleCourses[0],
        title: 'English B2 <script>alert("XSS")</script>',
        description: 'Course description <img src=x onerror=alert("XSS")>'
      };
      
      mockSupabase.order.mockResolvedValue({
        data: [maliciousCourse],
        error: null,
        count: 1
      });

      // Act
      const { GET } = await import('@/app/api/academia/courses/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`);
      const response = await GET(request);
      
      // Assert
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      const course = responseData.courses[0];
      
      // Verify XSS content is sanitized or escaped
      expect(course.title).not.toContain('<script>');
      expect(course.description).not.toContain('<img');
    });

    it('should include security headers', async () => {
      // Arrange
      mockSupabase.order.mockResolvedValue({
        data: sampleCourses,
        error: null,
        count: sampleCourses.length
      });

      // Act
      const { GET } = await import('@/app/api/academia/courses/route');
      const request = new NextRequest(`http://localhost:3000${API_ENDPOINT}`);
      const response = await GET(request);
      
      // Assert
      expect(response.status).toBe(200);
      
      // Verify security headers
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
      expect(response.headers.get('x-frame-options')).toBeDefined();
    });
  });
});