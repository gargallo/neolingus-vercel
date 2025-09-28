# Data Model: Course-Centric Academy Architecture

## Core Entities

### Language

- **id**: string (ISO 639-1 code: 'en', 'ca')
- **name**: string ('English', 'Valenciano')
- **certification_body**: string ('EOI', 'JQCV')
- **cultural_context**: object (colors, fonts, imagery preferences)
- **status**: enum ('active', 'coming_soon', 'maintenance')
- **supported_levels**: array of level IDs

**Relationships**: One-to-many with Level, Course

**Validation Rules**:

- ID must be valid ISO code
- Name must be localized for each supported language
- Cultural context must include UI theme configuration

### Level

- **id**: string ('B2', 'C1', 'mitjà', 'superior')
- **language_id**: string (foreign key to Language)
- **name**: string ('Intermediate B2', 'Mitjà')
- **description**: text (level requirements and goals)
- **cefr_equivalent**: string (for standardization)
- **certification_requirements**: object (official requirements)
- **estimated_duration**: number (study hours)
- **prerequisite_level_id**: string (optional, foreign key)

**Relationships**: Belongs-to Language, One-to-many with Course

**Validation Rules**:

- CEFR equivalent must be valid framework level
- Duration must be positive integer
- Prerequisites must exist and be of same language

### Course

- **id**: string (composite: 'en-B2', 'ca-mitja')
- **language_id**: string (foreign key)
- **level_id**: string (foreign key)
- **title**: string ('English B2 Preparation', 'Preparació Valencià Mitjà')
- **description**: text (course overview)
- **certification_target**: string (target exam name)
- **curriculum**: object (structured learning path)
- **ui_theme**: object (course-specific theming)
- **content_language**: string (interface language for this course)
- **status**: enum ('active', 'beta', 'coming_soon')

**Relationships**: Belongs-to Language and Level, One-to-many with ExamType, UserProgress

**Validation Rules**:

- ID must be unique combination of language and level
- UI theme must override default language theme
- Content language must match course language

### ExamType

- **id**: string (composite: 'en-B2-reading', 'ca-mitja-oral')
- **course_id**: string (foreign key)
- **name**: string ('Reading Comprehension', 'Comprensió Oral')
- **skill_type**: enum ('reading', 'writing', 'listening', 'speaking')
- **official_format**: object (exam structure, timing, scoring)
- **questions_config**: object (question types, distribution)
- **ai_tutor_config**: object (AI assistance parameters)
- **time_limit**: number (minutes)
- **passing_score**: number (percentage)

**Relationships**: Belongs-to Course, One-to-many with ExamSession, Question

**Validation Rules**:

- Format must match official certification standards
- Time limits must be realistic and official
- Scoring must align with certification rubrics

### UserProgress

- **id**: uuid
- **user_id**: uuid (foreign key to auth.users)
- **course_id**: string (foreign key)
- **enrollment_date**: timestamp
- **current_level**: string (progress within course)
- **completion_percentage**: number (0-100)
- **study_hours**: number (tracked time)
- **exam_scores**: object (performance by exam type)
- **learning_preferences**: object (AI tutor settings)
- **target_exam_date**: date (optional)
- **last_activity**: timestamp

**Relationships**: Belongs-to User and Course, One-to-many with ExamSession

**Validation Rules**:

- Completion percentage must be 0-100
- Study hours must be non-negative
- Target exam date must be in future

### ExamSession

- **id**: uuid
- **user_id**: uuid (foreign key)
- **exam_type_id**: string (foreign key)
- **started_at**: timestamp
- **completed_at**: timestamp (optional)
- **status**: enum ('in_progress', 'completed', 'abandoned')
- **score**: number (optional, percentage)
- **detailed_results**: object (per-section scoring)
- **ai_feedback**: text (personalized feedback)
- **time_taken**: number (seconds)
- **answers**: object (user responses)

**Relationships**: Belongs-to User and ExamType

**Validation Rules**:

- Started_at must be before completed_at
- Score only valid when status is 'completed'
- Time taken must be within exam time limits

### Question

- **id**: uuid
- **exam_type_id**: string (foreign key)
- **question_number**: number
- **question_type**: enum ('multiple_choice', 'essay', 'listening', 'speaking')
- **content**: object (question text, media, options)
- **correct_answer**: object (varies by type)
- **difficulty**: enum ('easy', 'medium', 'hard')
- **skill_tags**: array (specific skills tested)
- **official_source**: string (reference to official materials)

**Relationships**: Belongs-to ExamType

**Validation Rules**:

- Question number must be unique within exam type
- Content must match question type structure
- Official source must be traceable

## State Transitions

### Course Enrollment Flow

1. **Browse** → User selects language
2. **Language Selected** → User selects level
3. **Level Selected** → Course dashboard activated
4. **Enrolled** → Progress tracking begins

### Exam Session Flow

1. **Available** → User starts exam
2. **In Progress** → User answers questions
3. **Paused** → Session can be resumed (optional)
4. **Completed** → AI feedback generated
5. **Reviewed** → Results stored in progress

### User Progress Flow

1. **New** → Initial assessment (optional)
2. **Active** → Regular study and practice
3. **Paused** → Temporary inactivity
4. **Completed** → Course objectives met
5. **Certified** → Official exam passed (external)

## Data Relationships Summary

```
Language (1) ←→ (N) Level (1) ←→ (N) Course
Course (1) ←→ (N) ExamType (1) ←→ (N) Question
User (1) ←→ (N) UserProgress (N) ←→ (1) Course
User (1) ←→ (N) ExamSession (N) ←→ (1) ExamType
```

## Privacy and Compliance

**GDPR/LOPD Requirements**:

- All user data must support deletion
- Progress data must be exportable
- AI interactions must be logged for transparency
- Course preferences must respect regional privacy laws

**Educational Data Protection**:

- Exam responses stored encrypted
- Performance analytics anonymized
- AI feedback generation logged for audit
- Official certification alignment documented
