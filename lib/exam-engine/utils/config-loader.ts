import { CourseConfiguration } from '../types/course-config';
import { valencianoC1Config } from '../configs/courses/valenciano-c1.config';
import { valencianoB2Config } from '../configs/courses/valenciano-b2.config';
import { inglesB2Config } from '../configs/courses/ingles-b2.config';
import { englishB2Config } from '../configs/courses/english-b2.config';
import { englishC1Config } from '../configs/courses/english-c1.config';

// Registry of all available course configurations
const courseConfigurations: Record<string, CourseConfiguration> = {
  'valenciano_c1': valencianoC1Config,
  'valenciano_b2': valencianoB2Config,
  'english_b2': englishB2Config,
  'english_c1': englishC1Config,
  'ingles_b2': inglesB2Config, // Legacy support
  'ingles_c1': englishC1Config, // Legacy support
  // Add more courses here as they are implemented
};

/**
 * Load course configuration by courseId
 * @param courseId - The unique identifier for the course (e.g., 'valenciano_c1')
 * @returns Promise<CourseConfiguration>
 */
export async function loadCourseConfiguration(courseId: string): Promise<CourseConfiguration> {
  const config = courseConfigurations[courseId];
  
  if (!config) {
    throw new Error(`Course configuration not found: ${courseId}. Available courses: ${Object.keys(courseConfigurations).join(', ')}`);
  }

  return config;
}

/**
 * Get all available courses
 * @returns Array of course metadata
 */
export function getAvailableCourses() {
  return Object.values(courseConfigurations).map(config => ({
    courseId: config.courseId,
    title: config.metadata.title,
    language: config.metadata.language,
    level: config.metadata.level,
    institution: config.metadata.institution,
    description: config.metadata.description,
    region: config.metadata.region
  }));
}

/**
 * Get courses by language
 * @param language - The language to filter by
 * @returns Array of course configurations for the specified language
 */
export function getCoursesByLanguage(language: string): CourseConfiguration[] {
  return Object.values(courseConfigurations)
    .filter(config => config.metadata.language === language);
}

/**
 * Get courses by level
 * @param level - The CEFR level to filter by
 * @returns Array of course configurations for the specified level
 */
export function getCoursesByLevel(level: string): CourseConfiguration[] {
  return Object.values(courseConfigurations)
    .filter(config => config.metadata.level === level);
}

/**
 * Check if a course exists
 * @param courseId - The course identifier to check
 * @returns boolean
 */
export function courseExists(courseId: string): boolean {
  return courseId in courseConfigurations;
}

/**
 * Get exam configuration for a specific course and exam
 * @param courseId - The course identifier
 * @param examId - The exam identifier
 * @returns ExamConfiguration or null if not found
 */
export async function getExamConfiguration(courseId: string, examId: string) {
  const courseConfig = await loadCourseConfiguration(courseId);
  return courseConfig.examConfigs[examId] || null;
}

/**
 * Get all providers for a course
 * @param courseId - The course identifier
 * @returns Object with provider configurations
 */
export async function getCourseProviders(courseId: string) {
  const courseConfig = await loadCourseConfiguration(courseId);
  return courseConfig.providers;
}

/**
 * Get provider-specific exams
 * @param courseId - The course identifier
 * @param providerId - The provider identifier
 * @returns Array of exam configurations for the provider
 */
export async function getProviderExams(courseId: string, providerId: string) {
  const courseConfig = await loadCourseConfiguration(courseId);
  const provider = courseConfig.providers[providerId];
  
  if (!provider) {
    throw new Error(`Provider not found: ${providerId}`);
  }

  return provider.examIds.map(examId => ({
    examId,
    config: courseConfig.examConfigs[examId]
  })).filter(exam => exam.config);
}

/**
 * Validate course configuration
 * @param config - The course configuration to validate
 * @returns boolean - true if valid, throws error if invalid
 */
export function validateCourseConfiguration(config: CourseConfiguration): boolean {
  // Basic validation
  if (!config.courseId) {
    throw new Error('Course configuration must have a courseId');
  }

  if (!config.metadata) {
    throw new Error('Course configuration must have metadata');
  }

  if (!config.ui) {
    throw new Error('Course configuration must have UI configuration');
  }

  if (!config.examConfigs || Object.keys(config.examConfigs).length === 0) {
    throw new Error('Course configuration must have at least one exam configuration');
  }

  if (!config.providers || Object.keys(config.providers).length === 0) {
    throw new Error('Course configuration must have at least one provider');
  }

  // Validate that all provider exam IDs exist in examConfigs
  Object.values(config.providers).forEach(provider => {
    provider.examIds.forEach(examId => {
      if (!config.examConfigs[examId]) {
        throw new Error(`Provider references non-existent exam: ${examId}`);
      }
    });
  });

  return true;
}

/**
 * Register a new course configuration
 * @param config - The course configuration to register
 */
export function registerCourseConfiguration(config: CourseConfiguration): void {
  validateCourseConfiguration(config);
  courseConfigurations[config.courseId] = config;
}

/**
 * Get legacy simulator integration info
 * @param courseId - The course identifier
 * @returns SimulatorIntegration configuration
 */
export async function getLegacySimulatorInfo(courseId: string) {
  const courseConfig = await loadCourseConfiguration(courseId);
  return courseConfig.simulatorIntegration;
}