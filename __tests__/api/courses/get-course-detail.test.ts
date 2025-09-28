/**
 * API Contract Test: GET /api/academia/courses/{language}/{level}
 * 
 * Tests the complete API contract for retrieving specific course details
 * Following Test-Driven Development - MUST FAIL INITIALLY
 * 
 * Contract Definition: /specs/002-course-centric-academy/contracts/api.yaml
 * Implementation: app/api/academia/courses/by-language/[language]/[level]/route.ts
 * 
 * @group api-contracts
 * @group courses
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { Course } from '@/lib/types/academia';

// Extended course type for CourseDetail response
interface CourseDetail extends Course {
  assessment_rubric: Record<string, unknown>;
  exam_structure: Record<string, unknown>;
  content_config: Record<string, unknown>;
}

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  single: vi.fn(() => mockSupabase),
  data: null as CourseDetail | null,
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

describe('API Contract: GET /api/academia/courses/{language}/{level}', () => {
  const API_BASE = '/api/academia/courses';
  
  // Sample course detail data
  const sampleCourseDetail: CourseDetail = {
    id: 'course_001',
    language: 'english',
    level: 'b2',
    certification_type: 'eoi',
    title: 'English B2 - EOI Preparation',
    description: 'Complete preparation for English B2 EOI certification exam with comprehensive practice materials and AI-powered tutoring.',
    components: [
      { skill_type: 'reading', weight: 0.25, time_limit_minutes: 75 },
      { skill_type: 'writing', weight: 0.25, time_limit_minutes: 90 },
      { skill_type: 'listening', weight: 0.25, time_limit_minutes: 45 },
      { skill_type: 'speaking', weight: 0.25, time_limit_minutes: 25 }
    ],
    is_active: true,
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
    // CourseDetail-specific fields
    assessment_rubric: {
      reading: {
        band_descriptors: {
          5: 'Can understand detailed argumentative texts',
          4: 'Can understand main ideas and details',
          3: 'Can understand straightforward factual texts',
          2: 'Can understand simple texts on familiar topics',
          1: 'Can understand very basic texts'
        },
        scoring_criteria: ['accuracy', 'range', 'coherence', 'appropriateness']
      },
      writing: {
        band_descriptors: {
          5: 'Can write clear, detailed texts on complex subjects',
          4: 'Can write clear texts on familiar subjects',
          3: 'Can write connected text on familiar topics',
          2: 'Can write simple connected text',
          1: 'Can write simple phrases and sentences'
        },
        scoring_criteria: ['task_achievement', 'coherence', 'lexical_resource', 'grammatical_accuracy']
      }
    },
    exam_structure: {
      total_duration_minutes: 235,
      components: {
        reading: {
          duration_minutes: 75,
          parts: 4,
          questions: 30,
          text_types: ['academic', 'professional', 'general']
        },
        writing: {
          duration_minutes: 90,
          parts: 2,
          tasks: [
            { type: 'essay', word_count: 180, topic_type: 'argumentative' },
            { type: 'formal_letter', word_count: 150, topic_type: 'complaint_request' }
          ]
        },
        listening: {
          duration_minutes: 45,
          parts: 4,
          recordings: 5,
          question_types: ['multiple_choice', 'completion', 'matching']
        },
        speaking: {
          duration_minutes: 25,
          parts: 3,
          tasks: [
            { type: 'interview', duration_minutes: 5 },
            { type: 'individual_presentation', duration_minutes: 10 },
            { type: 'paired_discussion', duration_minutes: 10 }
          ]
        }
      }
    },
    content_config: {
      difficulty_progression: 'adaptive',
      practice_modes: ['guided', 'timed', 'mock_exam'],
      ai_features: {
        enabled: true,
        tutoring_modes: ['explanatory', 'socratic', 'corrective'],
        feedback_types: ['immediate', 'detailed', 'comparative']
      },
      accessibility: {
        screen_reader_compatible: true,
        keyboard_navigation: true,
        high_contrast_mode: true,
        font_size_adjustment: true
      },
      localization: {
        interface_language: 'en',
        content_language: 'en',
        cultural_adaptation: 'european'
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock data
    mockSupabase.data = null;
    mockSupabase.error = null;
  });

  describe('Success Scenarios', () => {
    it('should return 200 with complete CourseDetail when valid language and level provided', async () => {
      // Arrange: Mock successful course detail response
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.single.mockReturnValue(Promise.resolve({
        data: sampleCourseDetail,
        error: null
      }));

      // Act: Import and call the API route handler
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`);
      const params = { language: 'english', level: 'b2' };
      const response = await GET(request, { params });
      
      // Assert: Response structure matches OpenAPI CourseDetail schema
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      
      // Verify base Course properties
      expect(responseData).toHaveProperty('id');
      expect(responseData).toHaveProperty('language');
      expect(responseData).toHaveProperty('level');
      expect(responseData).toHaveProperty('certification_type');
      expect(responseData).toHaveProperty('title');
      expect(responseData).toHaveProperty('description');
      expect(responseData).toHaveProperty('components');
      expect(responseData).toHaveProperty('is_active');
      
      // Verify CourseDetail-specific properties (allOf extension)
      expect(responseData).toHaveProperty('assessment_rubric');
      expect(responseData).toHaveProperty('exam_structure');
      expect(responseData).toHaveProperty('content_config');
      
      // Verify parameter values match
      expect(responseData.language).toBe('english');
      expect(responseData.level).toBe('b2');
      
      // Verify complex nested structures
      expect(typeof responseData.assessment_rubric).toBe('object');
      expect(typeof responseData.exam_structure).toBe('object');
      expect(typeof responseData.content_config).toBe('object');
      
      // Verify database was queried with both parameters
      expect(mockSupabase.eq).toHaveBeenCalledWith('language', 'english');
      expect(mockSupabase.eq).toHaveBeenCalledWith('level', 'b2');
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should return detailed assessment rubric information', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: sampleCourseDetail,
        error: null
      });

      // Act
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`);
      const params = { language: 'english', level: 'b2' };
      const response = await GET(request, { params });
      
      // Assert: Verify assessment rubric structure
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      const rubric = responseData.assessment_rubric;
      
      // Verify rubric contains skill-specific criteria
      expect(rubric).toHaveProperty('reading');
      expect(rubric).toHaveProperty('writing');
      expect(rubric.reading).toHaveProperty('band_descriptors');
      expect(rubric.reading).toHaveProperty('scoring_criteria');
      
      // Verify band descriptors are properly structured
      expect(typeof rubric.reading.band_descriptors).toBe('object');
      expect(Array.isArray(rubric.reading.scoring_criteria)).toBe(true);
    });

    it('should return detailed exam structure information', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: sampleCourseDetail,
        error: null
      });

      // Act
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`);
      const params = { language: 'english', level: 'b2' };
      const response = await GET(request, { params });
      
      // Assert: Verify exam structure
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      const examStructure = responseData.exam_structure;
      
      // Verify overall exam structure
      expect(examStructure).toHaveProperty('total_duration_minutes');
      expect(examStructure).toHaveProperty('components');
      expect(typeof examStructure.total_duration_minutes).toBe('number');
      
      // Verify component-specific structures
      expect(examStructure.components).toHaveProperty('reading');
      expect(examStructure.components).toHaveProperty('writing');
      expect(examStructure.components).toHaveProperty('listening');
      expect(examStructure.components).toHaveProperty('speaking');
      
      // Verify component details
      const readingComponent = examStructure.components.reading;
      expect(readingComponent).toHaveProperty('duration_minutes');
      expect(readingComponent).toHaveProperty('parts');
      expect(readingComponent).toHaveProperty('questions');
    });

    it('should return comprehensive content configuration', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: sampleCourseDetail,
        error: null
      });

      // Act
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`);
      const params = { language: 'english', level: 'b2' };
      const response = await GET(request, { params });
      
      // Assert: Verify content configuration
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      const contentConfig = responseData.content_config;
      
      // Verify main configuration areas
      expect(contentConfig).toHaveProperty('difficulty_progression');
      expect(contentConfig).toHaveProperty('practice_modes');
      expect(contentConfig).toHaveProperty('ai_features');
      expect(contentConfig).toHaveProperty('accessibility');
      expect(contentConfig).toHaveProperty('localization');
      
      // Verify AI features configuration
      expect(contentConfig.ai_features).toHaveProperty('enabled');
      expect(contentConfig.ai_features).toHaveProperty('tutoring_modes');
      expect(Array.isArray(contentConfig.ai_features.tutoring_modes)).toBe(true);
      
      // Verify accessibility features
      expect(contentConfig.accessibility).toHaveProperty('screen_reader_compatible');
      expect(typeof contentConfig.accessibility.screen_reader_compatible).toBe('boolean');
    });

    it('should include correct Content-Type header', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: sampleCourseDetail,
        error: null
      });

      // Act
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`);
      const params = { language: 'english', level: 'b2' };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('Error Scenarios', () => {
    it('should return 404 when course with language and level combination does not exist', async () => {
      // Arrange: Mock no course found
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' }
      });

      // Act
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/a1`);
      const params = { language: 'english', level: 'a1' };
      const response = await GET(request, { params });
      
      // Assert: Should return 404 for non-existent course
      expect(response.status).toBe(404);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toContain('Course not found');
    });

    it('should return 404 when language parameter is invalid', async () => {
      // Act: Request with invalid language
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/german/b2`);
      const params = { language: 'german', level: 'b2' };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(404);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
    });

    it('should return 404 when level parameter is invalid', async () => {
      // Act: Request with invalid level
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/d1`);
      const params = { language: 'english', level: 'd1' };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(404);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
    });

    it('should return 401 when user is not authenticated', async () => {
      // Arrange: Mock unauthenticated user
      const { getCurrentUser } = await import('@/utils/auth');
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      // Act
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`);
      const params = { language: 'english', level: 'b2' };
      const response = await GET(request, { params });
      
      // Assert: Matches OpenAPI contract for 401 response
      expect(response.status).toBe(401);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toBe('Authentication required');
    });

    it('should return 500 when database query fails', async () => {
      // Arrange: Mock database error
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'CONNECTION_ERROR' }
      });

      // Act
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`);
      const params = { language: 'english', level: 'b2' };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(500);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
    });

    it('should return 404 when course is inactive', async () => {
      // Arrange: Mock inactive course
      const inactiveCourse = { ...sampleCourseDetail, is_active: false };
      mockSupabase.single.mockResolvedValue({
        data: null, // Database should not return inactive courses
        error: { code: 'PGRST116', message: 'No rows returned' }
      });

      // Act
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`);
      const params = { language: 'english', level: 'b2' };
      const response = await GET(request, { params });
      
      // Assert: Inactive courses should not be accessible
      expect(response.status).toBe(404);
    });
  });

  describe('Path Parameters Validation', () => {
    it('should validate language enum values from OpenAPI spec', async () => {
      // Test valid language values
      const validLanguages = ['english', 'valenciano'];
      
      for (const language of validLanguages) {
        // Arrange
        const courseForLanguage = { 
          ...sampleCourseDetail, 
          language: language as 'english' | 'valenciano',
          id: `course_${language}_b2`
        };
        mockSupabase.single.mockResolvedValue({
          data: courseForLanguage,
          error: null
        });

        // Act
        const { GET } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
        const request = new NextRequest(`http://localhost:3000${API_BASE}/${language}/b2`);
        const params = { language, level: 'b2' };
        const response = await GET(request, { params });
        
        // Assert
        expect(response.status).toBe(200);
        
        const responseData = await response.json();
        expect(responseData.language).toBe(language);
      }
    });

    it('should validate level enum values from OpenAPI spec', async () => {
      // Test valid level values
      const validLevels = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
      
      for (const level of validLevels) {
        // Arrange
        const courseForLevel = { 
          ...sampleCourseDetail, 
          level: level as 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'c2',
          id: `course_english_${level}`
        };
        mockSupabase.single.mockResolvedValue({
          data: courseForLevel,
          error: null
        });

        // Act
        const { GET } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
        const request = new NextRequest(`http://localhost:3000${API_BASE}/english/${level}`);
        const params = { language: 'english', level };
        const response = await GET(request, { params });
        
        // Assert
        expect(response.status).toBe(200);
        
        const responseData = await response.json();
        expect(responseData.level).toBe(level);
      }
    });

    it('should handle case insensitive parameters', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: sampleCourseDetail,
        error: null
      });

      // Act: Request with mixed case
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/ENGLISH/B2`);
      const params = { language: 'ENGLISH', level: 'B2' };
      const response = await GET(request, { params });
      
      // Assert: Should normalize to lowercase
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.language).toBe('english');
      expect(responseData.level).toBe('b2');
    });

    it('should reject malicious path parameters', async () => {
      const maliciousInputs = [
        { language: 'english; DROP TABLE courses;', level: 'b2' },
        { language: 'english<script>', level: 'b2' },
        { language: 'english', level: 'b2; SELECT * FROM users;' },
        { language: '../../../etc/passwd', level: 'b2' },
        { language: 'english%00', level: 'b2%00' }
      ];

      for (const { language, level } of maliciousInputs) {
        // Act
        const { GET } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
        const request = new NextRequest(`http://localhost:3000${API_BASE}/${encodeURIComponent(language)}/${encodeURIComponent(level)}`);
        const params = { language, level };
        const response = await GET(request, { params });
        
        // Assert: Should reject malicious input
        expect(response.status).toBe(404);
        
        const responseData = await response.json();
        expect(responseData.error).toContain('not found');
      }
    });
  });

  describe('Performance Requirements', () => {
    it('should respond within 200ms under normal conditions', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: sampleCourseDetail,
        error: null
      });

      const startTime = Date.now();
      
      // Act
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`);
      const params = { language: 'english', level: 'b2' };
      const response = await GET(request, { params });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Assert
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(200); // Performance requirement
    });

    it('should handle large CourseDetail responses efficiently', async () => {
      // Arrange: Create large course detail with extensive configuration
      const largeCourseDetail: CourseDetail = {
        ...sampleCourseDetail,
        content_config: {
          ...sampleCourseDetail.content_config,
          practice_questions_bank: Array.from({ length: 1000 }, (_, i) => ({
            id: `question_${i}`,
            type: 'multiple_choice',
            difficulty: Math.floor(Math.random() * 5) + 1,
            metadata: { category: 'reading', subcategory: `type_${i % 10}` }
          }))
        }
      };
      
      mockSupabase.single.mockResolvedValue({
        data: largeCourseDetail,
        error: null
      });

      const startTime = Date.now();
      
      // Act
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`);
      const params = { language: 'english', level: 'b2' };
      const response = await GET(request, { params });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Assert: Should handle large responses efficiently
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(500); // Allow more time for large responses
      
      // Verify response contains all data
      const responseData = await response.json();
      expect(responseData.content_config.practice_questions_bank).toHaveLength(1000);
    });
  });

  describe('Data Integrity and Security', () => {
    it('should validate CourseDetail schema integrity', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: sampleCourseDetail,
        error: null
      });

      // Act
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`);
      const params = { language: 'english', level: 'b2' };
      const response = await GET(request, { params });
      
      // Assert: Verify complete schema compliance
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      
      // Verify all required CourseDetail fields are present and properly typed
      expect(typeof responseData.assessment_rubric).toBe('object');
      expect(responseData.assessment_rubric).not.toBeNull();
      
      expect(typeof responseData.exam_structure).toBe('object');
      expect(responseData.exam_structure).not.toBeNull();
      
      expect(typeof responseData.content_config).toBe('object');
      expect(responseData.content_config).not.toBeNull();
      
      // Verify components array structure integrity
      expect(Array.isArray(responseData.components)).toBe(true);
      responseData.components.forEach((component: any) => {
        expect(component).toHaveProperty('skill_type');
        expect(component).toHaveProperty('weight');
        expect(component).toHaveProperty('time_limit_minutes');
        expect(typeof component.weight).toBe('number');
        expect(component.weight).toBeGreaterThan(0);
        expect(component.weight).toBeLessThanOrEqual(1);
      });
    });

    it('should sanitize CourseDetail content to prevent XSS', async () => {
      // Arrange: Course with potentially dangerous content
      const maliciousCourseDetail: CourseDetail = {
        ...sampleCourseDetail,
        title: 'English B2 <script>alert("XSS")</script>',
        description: 'Course with <img src=x onerror=alert("XSS")> content',
        assessment_rubric: {
          reading: {
            instructions: '<script>document.cookie="stolen"</script>Legitimate instructions'
          }
        }
      };
      
      mockSupabase.single.mockResolvedValue({
        data: maliciousCourseDetail,
        error: null
      });

      // Act
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`);
      const params = { language: 'english', level: 'b2' };
      const response = await GET(request, { params });
      
      // Assert: XSS content should be sanitized
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.title).not.toContain('<script>');
      expect(responseData.description).not.toContain('<img');
      
      // Verify nested objects are also sanitized
      const rubricInstructions = JSON.stringify(responseData.assessment_rubric);
      expect(rubricInstructions).not.toContain('<script>');
      expect(rubricInstructions).not.toContain('document.cookie');
    });

    it('should include security headers', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: sampleCourseDetail,
        error: null
      });

      // Act
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`);
      const params = { language: 'english', level: 'b2' };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(200);
      
      // Verify security headers
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
      expect(response.headers.get('x-frame-options')).toBeDefined();
      expect(response.headers.get('x-robots-tag')).toBeDefined();
      
      // Should not expose server information
      expect(response.headers.get('server')).toBeFalsy();
      expect(response.headers.get('x-powered-by')).toBeFalsy();
    });
  });

  describe('GDPR/LOPD Compliance', () => {
    it('should not expose sensitive course development information', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: sampleCourseDetail,
        error: null
      });

      // Act
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`);
      const params = { language: 'english', level: 'b2' };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      
      // Should not include sensitive internal fields
      expect(responseData).not.toHaveProperty('created_by');
      expect(responseData).not.toHaveProperty('internal_notes');
      expect(responseData).not.toHaveProperty('development_status');
      expect(responseData).not.toHaveProperty('author_contact');
      expect(responseData).not.toHaveProperty('licensing_info');
    });

    it('should implement proper data caching with privacy considerations', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: sampleCourseDetail,
        error: null
      });

      // Act
      const { GET } = await import('@/app/api/academia/courses/by-language/[language]/[level]/route');
      const request = new NextRequest(`http://localhost:3000${API_BASE}/english/b2`);
      const params = { language: 'english', level: 'b2' };
      const response = await GET(request, { params });
      
      // Assert
      expect(response.status).toBe(200);
      
      // Verify appropriate caching headers for public course data
      const cacheControl = response.headers.get('cache-control');
      expect(cacheControl).toBeDefined();
      
      // Should allow caching for public course information but with appropriate limits
      if (cacheControl) {
        // Should not cache indefinitely to allow for content updates
        expect(cacheControl).toMatch(/max-age=\d+/);
      }
    });
  });
});