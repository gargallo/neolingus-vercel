/**
 * TypeScript types for UserCourseProgress entity
 * Tracks user progress through courses with detailed analytics
 */

// Base UUID type for database references
export type UUID = string;

// Progress value constraint (0.0 to 1.0)
export type ProgressValue = number; // Constrained to 0.0-1.0

// Course component types that can be tracked
export type CourseComponent = 
  | 'reading'
  | 'writing' 
  | 'listening'
  | 'speaking'
  | 'grammar'
  | 'vocabulary'
  | 'pronunciation'
  | 'comprehension';

// Component progress mapping
export type ComponentProgress = Record<CourseComponent, ProgressValue>;

// User progress states in the learning journey
export type ProgressState = 
  | 'enrolled'     // Just enrolled, minimal activity
  | 'active'       // Regular learning activity
  | 'proficient'   // Achieved base proficiency
  | 'exam_ready'   // Ready for official examination
  | 'inactive'     // No activity > 30 days
  | 'completed';   // Achieved target proficiency

// Skill strength and weakness areas
export type SkillArea = {
  component: CourseComponent;
  score: ProgressValue;
  confidence: ProgressValue;
  last_assessed: Date;
};

// Main UserCourseProgress interface
export interface UserCourseProgress {
  // Primary identifiers
  id: UUID;
  user_id: UUID;
  course_id: UUID;
  
  // Temporal tracking
  enrollment_date: Date;
  last_activity: Date;
  target_exam_date?: Date;
  
  // Progress metrics
  overall_progress: ProgressValue;
  component_progress: ComponentProgress;
  readiness_score: ProgressValue;
  
  // Analytics and insights
  strengths: SkillArea[];
  weaknesses: SkillArea[];
  estimated_study_hours: number;
  
  // State management
  current_state: ProgressState;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}

// Progress creation input (for new enrollments)
export interface CreateUserCourseProgressInput {
  user_id: UUID;
  course_id: UUID;
  target_exam_date?: Date;
  initial_assessment?: Partial<ComponentProgress>;
}

// Progress update input (for activity tracking)
export interface UpdateUserCourseProgressInput {
  overall_progress?: ProgressValue;
  component_progress?: Partial<ComponentProgress>;
  strengths?: SkillArea[];
  weaknesses?: SkillArea[];
  readiness_score?: ProgressValue;
  estimated_study_hours?: number;
  target_exam_date?: Date;
  last_activity?: Date;
}

// Progress analytics and insights
export interface ProgressAnalytics {
  // Progress velocity
  daily_progress_rate: number;
  weekly_progress_rate: number;
  projected_completion_date: Date;
  
  // Component analysis
  strongest_component: CourseComponent;
  weakest_component: CourseComponent;
  most_improved_component: CourseComponent;
  
  // Study patterns
  total_study_hours: number;
  average_session_duration: number;
  study_frequency: number; // sessions per week
  
  // Recommendations
  recommended_focus_areas: CourseComponent[];
  suggested_study_hours_per_week: number;
  exam_readiness_timeline: Date;
}

// Progress validation utilities
export interface ProgressValidation {
  isValidProgress: (progress: ProgressValue) => boolean;
  isValidComponentProgress: (components: ComponentProgress, courseComponents: CourseComponent[]) => boolean;
  canTransitionToState: (currentState: ProgressState, targetState: ProgressState, progress: UserCourseProgress) => boolean;
  calculateReadinessScore: (componentProgress: ComponentProgress) => ProgressValue;
}

// Progress query filters and sorting
export interface ProgressQueryOptions {
  user_id?: UUID;
  course_id?: UUID;
  state?: ProgressState | ProgressState[];
  min_progress?: ProgressValue;
  max_progress?: ProgressValue;
  inactive_days?: number;
  sort_by?: 'enrollment_date' | 'last_activity' | 'overall_progress' | 'readiness_score';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Batch progress operations
export interface BatchProgressUpdate {
  user_id: UUID;
  updates: Array<{
    course_id: UUID;
    progress_data: UpdateUserCourseProgressInput;
  }>;
}

// Progress milestone tracking
export interface ProgressMilestone {
  id: UUID;
  user_course_progress_id: UUID;
  milestone_type: 'component_mastery' | 'overall_progress' | 'exam_readiness' | 'study_goal';
  component?: CourseComponent;
  target_value: ProgressValue;
  achieved_value: ProgressValue;
  achieved_at?: Date;
  is_achieved: boolean;
}

// Real-time progress tracking
export interface ProgressActivityLog {
  id: UUID;
  user_course_progress_id: UUID;
  activity_type: 'lesson_completed' | 'quiz_taken' | 'exercise_finished' | 'assessment_completed';
  component: CourseComponent;
  progress_before: ProgressValue;
  progress_after: ProgressValue;
  duration_minutes: number;
  score?: ProgressValue;
  timestamp: Date;
}

// Progress recommendations engine
export interface ProgressRecommendation {
  type: 'focus_area' | 'study_schedule' | 'resource' | 'exam_timing';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action_items: string[];
  estimated_impact: ProgressValue;
  confidence: ProgressValue;
}

// Export utility types for type guards and validation
export type ProgressStateTransition = {
  from: ProgressState;
  to: ProgressState;
  required_conditions: Array<{
    field: keyof UserCourseProgress;
    operator: '>=' | '<=' | '>' | '<' | '==' | '!=';
    value: any;
  }>;
};

// Predefined state transition rules
export const PROGRESS_STATE_TRANSITIONS: ProgressStateTransition[] = [
  {
    from: 'enrolled',
    to: 'active',
    required_conditions: [
      { field: 'overall_progress', operator: '>', value: 0.0 }
    ]
  },
  {
    from: 'active',
    to: 'proficient',
    required_conditions: [
      { field: 'overall_progress', operator: '>=', value: 0.6 }
    ]
  },
  {
    from: 'proficient',
    to: 'exam_ready',
    required_conditions: [
      { field: 'readiness_score', operator: '>=', value: 0.8 },
      { field: 'overall_progress', operator: '>=', value: 0.8 }
    ]
  },
  {
    from: 'exam_ready',
    to: 'completed',
    required_conditions: [
      { field: 'overall_progress', operator: '>=', value: 0.95 }
    ]
  }
];

// Type guards for runtime validation
export const isValidProgressValue = (value: any): value is ProgressValue => {
  return typeof value === 'number' && value >= 0.0 && value <= 1.0;
};

export const isValidProgressState = (state: any): state is ProgressState => {
  return ['enrolled', 'active', 'proficient', 'exam_ready', 'inactive', 'completed'].includes(state);
};

export const isValidCourseComponent = (component: any): component is CourseComponent => {
  return ['reading', 'writing', 'listening', 'speaking', 'grammar', 'vocabulary', 'pronunciation', 'comprehension'].includes(component);
};