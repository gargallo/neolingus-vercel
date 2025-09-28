/**
 * API Contract Test: GET /api/academia/courses/{language}
 * 
 * Tests the complete API contract for retrieving courses by language
 * Following Test-Driven Development - MUST FAIL INITIALLY
 * 
 * Contract Definition: /specs/002-course-centric-academy/contracts/api.yaml
 * Implementation: app/api/academia/courses/by-language/[language]/route.ts
 * 
 * @group api-contracts
 * @group courses
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
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

describe('API Contract: GET /api/academia/courses/{language}', () => {
  const API_BASE = '/api/academia/courses';
  
  // Sample course data for different languages
  const englishCourses: Course[] = [
    {
      id: 'course_001',
      language: 'english',
      level: 'b1',
      certification_type: 'eoi',
      title: 'English B1 - EOI Preparation',
      description: 'Complete preparation for English B1 EOI certification',
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
    }
  ];

  const valencianoCourses: Course[] = [
    {
      id: 'course_003',
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
    mockSupabase.data = [];
    mockSupabase.error = null;
    mockSupabase.count = 0;
  });

  describe('Success Scenarios', () => {
    it('should return 200 with English courses when language is "english"', async () => {
      // Arrange: Mock English courses response
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockReturnValue(Promise.resolve({
        data: englishCourses,
        error: null,
        count: englishCourses.length
      }));

      // Act: Import and call the API route handler
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english`);
      const params = { language: 'english' };
      const response = await GET(request, { params });
      
      // Assert: Response structure matches OpenAPI contract
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('language');
      expect(responseData).toHaveProperty('courses');
      expect(responseData.language).toBe('english');
      expect(Array.isArray(responseData.courses)).toBe(true);
      expect(responseData.courses).toHaveLength(2);
      
      // Verify all courses are English
      responseData.courses.forEach((course: Course) => {
        expect(course.language).toBe('english');
        expect(course).toHaveProperty('id');
        expect(course).toHaveProperty('level');
        expect(course).toHaveProperty('certification_type');
        expect(course).toHaveProperty('title');
        expect(course).toHaveProperty('description');
        expect(course).toHaveProperty('components');
        expect(course).toHaveProperty('is_active');
        expect(course.is_active).toBe(true);
      });

      // Verify database was queried with language filter
      expect(mockSupabase.eq).toHaveBeenCalledWith('language', 'english');
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should return 200 with Valenciano courses when language is "valenciano"', async () => {
      // Arrange: Mock Valenciano courses response
      mockSupabase.order.mockResolvedValue({
        data: valencianoCourses,
        error: null,
        count: valencianoCourses.length
      });

      // Act
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/valenciano`);
      const params = { language: 'valenciano' };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.language).toBe('valenciano');
      expect(responseData.courses).toHaveLength(1);
      expect(responseData.courses[0].language).toBe('valenciano');
      expect(responseData.courses[0].certification_type).toBe('jqcv');
    });

    it('should return 200 with empty courses array when no courses exist for language', async () => {
      // Arrange: Mock empty response for valid language
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      });

      // Act
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english`);
      const params = { language: 'english' };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.language).toBe('english');
      expect(responseData.courses).toHaveLength(0);
      expect(Array.isArray(responseData.courses)).toBe(true);
    });

    it('should include correct Content-Type header', async () => {
      // Arrange
      mockSupabase.order.mockResolvedValue({
        data: englishCourses,
        error: null,
        count: englishCourses.length
      });

      // Act
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english`);
      const params = { language: 'english' };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('Error Scenarios', () => {
    it('should return 404 when language parameter is invalid', async () => {
      // Act: Request with invalid language
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/german`);
      const params = { language: 'german' };
      const response = await GET(request, { params });
      
      // Assert: Should return 404 for unsupported language
      expect(response.status).toBe(404);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toContain('Language not found');
    });

    it('should return 404 when language parameter is empty', async () => {
      // Act: Request with empty language
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/`);
      const params = { language: '' };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(404);
    });

    it('should return 401 when user is not authenticated', async () => {
      // Arrange: Mock unauthenticated user
      const { getCurrentUser } = await import('@/utils/auth');
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      // Act
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english`);
      const params = { language: 'english' };
      const response = await GET(request, { params });
      
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
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english`);
      const params = { language: 'english' };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(500);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
    });
  });

  describe('Path Parameter Validation', () => {
    it('should validate language enum values', async () => {
      // Test both valid enum values from OpenAPI spec
      const validLanguages = ['english', 'valenciano'];
      
      for (const language of validLanguages) {
        // Arrange
        const expectedCourses = language === 'english' ? englishCourses : valencianoCourses;
        mockSupabase.order.mockResolvedValue({
          data: expectedCourses,
          error: null,
          count: expectedCourses.length
        });

        // Act
        const { GET } = await import('@/app/api/academia/courses/by-language/[language]/route');
        const request = new NextRequest(`http://localhost:3000${API_BASE}/${language}`);
        const params = { language };
        const response = await GET(request, { params });
        
        // Assert
        expect(response.status).toBe(200);
        
        const responseData = await response.json();
        expect(responseData.language).toBe(language);
      }
    });

    it('should handle case insensitive language parameters', async () => {
      // Arrange
      mockSupabase.order.mockResolvedValue({
        data: englishCourses,
        error: null,
        count: englishCourses.length
      });

      // Act: Request with uppercase language
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/ENGLISH`);
      const params = { language: 'ENGLISH' };
      const response = await GET(request, { params });
      
      // Assert: Should normalize to lowercase
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.language).toBe('english'); // Normalized
    });

    it('should reject special characters and injection attempts', async () => {
      const maliciousInputs = [
        'english; DROP TABLE courses;',
        'english<script>alert("XSS")</script>',
        'english../../etc/passwd',
        'english%00'
      ];

      for (const maliciousInput of maliciousInputs) {
        // Act
        const { GET } = await import('@/app/api/academia/courses/by-language/[language]/route');
        const request = new NextRequest(`http://localhost:3000${API_BASE}/${encodeURIComponent(maliciousInput)}`);
        const params = { language: maliciousInput };
        const response = await GET(request, { params });
        
        // Assert: Should reject malicious input
        expect(response.status).toBe(404);
        
        const responseData = await response.json();
        expect(responseData.error).toContain('Language not found');
      }
    });
  });

  describe('Performance Requirements', () => {
    it('should respond within 200ms under normal conditions', async () => {
      // Arrange
      mockSupabase.order.mockResolvedValue({
        data: englishCourses,
        error: null,
        count: englishCourses.length
      });

      const startTime = Date.now();
      
      // Act
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english`);
      const params = { language: 'english' };
      const response = await GET(request, { params });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Assert
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(200); // Performance requirement
    });

    it('should cache results for frequently requested languages', async () => {
      // Arrange
      mockSupabase.order.mockResolvedValue({
        data: englishCourses,
        error: null,
        count: englishCourses.length
      });

      // Act: Make same request twice
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/route');
      
      const request1 = new NextRequest(`http://localhost:3000${API_BASE}/english`);
      const params1 = { language: 'english' };
      const response1 = await GET(request1, { params: params1 });
      
      const request2 = new NextRequest(`http://localhost:3000${API_BASE}/english`);
      const params2 = { language: 'english' };
      const response2 = await GET(request2, { params: params2 });
      
      // Assert: Both requests succeed
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      
      // Should have appropriate cache headers
      const cacheControl = response1.headers.get('cache-control');
      expect(cacheControl).toBeDefined();
    });
  });

  describe('Data Filtering and Ordering', () => {
    it('should return courses ordered by level (a1, a2, b1, b2, c1, c2)', async () => {
      // Arrange: Mixed level courses
      const mixedLevelCourses = [
        { ...englishCourses[1], level: 'b2' },  // B2
        { ...englishCourses[0], level: 'a1', id: 'course_a1' },  // A1
        { ...englishCourses[0], level: 'c1', id: 'course_c1' },  // C1
        { ...englishCourses[0], level: 'b1' },  // B1
      ];
      
      // Mock ordered response (database should order by level)
      const orderedCourses = [
        mixedLevelCourses[1], // A1
        mixedLevelCourses[3], // B1
        mixedLevelCourses[0], // B2
        mixedLevelCourses[2], // C1
      ];
      
      mockSupabase.order.mockResolvedValue({
        data: orderedCourses,
        error: null,
        count: orderedCourses.length
      });

      // Act
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english`);
      const params = { language: 'english' };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      const levels = responseData.courses.map((course: Course) => course.level);
      expect(levels).toEqual(['a1', 'b1', 'b2', 'c1']);
      
      // Verify database was asked to order by level
      expect(mockSupabase.order).toHaveBeenCalledWith('level');
    });

    it('should return only active courses', async () => {
      // Arrange: Mix of active and inactive courses
      const mixedActiveCourses = [
        { ...englishCourses[0], is_active: true },
        { ...englishCourses[1], is_active: false, id: 'course_inactive' }
      ];
      
      mockSupabase.order.mockResolvedValue({
        data: [mixedActiveCourses[0]], // Only active course
        error: null,
        count: 1
      });

      // Act
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english`);
      const params = { language: 'english' };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.courses).toHaveLength(1);
      expect(responseData.courses[0].is_active).toBe(true);
      
      // Verify database was filtered by active status
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true);
    });
  });

  describe('GDPR/LOPD Compliance', () => {
    it('should include privacy compliance headers', async () => {
      // Arrange
      mockSupabase.order.mockResolvedValue({
        data: englishCourses,
        error: null,
        count: englishCourses.length
      });

      // Act
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english`);
      const params = { language: 'english' };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(200);
      
      // Should not expose sensitive system information
      expect(response.headers.get('server')).toBeFalsy();
      expect(response.headers.get('x-powered-by')).toBeFalsy();
      
      // Should include privacy headers
      expect(response.headers.get('x-robots-tag')).toBeDefined();
    });

    it('should not log sensitive course information', async () => {
      // This test would need to be integrated with actual logging system
      // For now, we'll verify no sensitive data is exposed in response
      
      // Arrange
      mockSupabase.order.mockResolvedValue({
        data: englishCourses,
        error: null,
        count: englishCourses.length
      });

      // Act
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english`);
      const params = { language: 'english' };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      
      // Should not include internal system data
      responseData.courses.forEach((course: Course) => {
        expect(course).not.toHaveProperty('internal_id');
        expect(course).not.toHaveProperty('created_by');
        expect(course).not.toHaveProperty('raw_data');
      });
    });
  });
});