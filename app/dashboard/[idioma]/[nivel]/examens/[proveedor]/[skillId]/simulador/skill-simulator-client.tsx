"use client";

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UniversalExamSimulator } from '@/components/exam-simulator/universal-exam-simulator';
import { createSupabaseClient } from '@/utils/supabase/client';
import type { ExamContent } from '@/types/exam-system';
import type { Question, SimpleExamTemplate } from '@/lib/services/exam-data.service';

interface ExamResult {
  correct: number;
  total: number;
  percentage: number;
  answers: Record<string, any>;
  pendingManual: number;
  pendingPoints: number;
}

interface SkillSimulatorClientProps {
  examTemplate: SimpleExamTemplate;
  examContent: ExamContent[];
  questions: Question[];
  userId: string;
  courseId: string;
  skillId: string;
  language: string;
  level: string;
  provider: string;
}

export function SkillSimulatorClient({
  examTemplate,
  examContent,
  questions,
  userId,
  courseId,
  skillId,
  language,
  level,
  provider
}: SkillSimulatorClientProps) {
  const router = useRouter();

  const handleExamComplete = useCallback(async (result: ExamResult) => {
    try {
      const supabase = createSupabaseClient();

      // Calculate duration (we'll use a default for now, can be enhanced later)
      const durationSeconds = examTemplate.estimated_duration * 60;

      // Create session data with skill information
      const sessionData = {
        skill_id: skillId,
        skillId: skillId,
        component_id: skillId,
        language,
        level,
        provider,
        answers: result.answers,
        total_questions: result.total,
        correct_answers: result.correct,
        pending_manual: result.pendingManual
      };

      // Save exam session to database
      const { error } = await supabase
        .from('exam_sessions')
        .insert({
          user_id: userId,
          course_id: courseId,
          component: skillId,
          session_type: 'practice',
          started_at: new Date(Date.now() - durationSeconds * 1000).toISOString(),
          completed_at: new Date().toISOString(),
          duration_seconds: durationSeconds,
          score: result.percentage / 100, // Store as decimal (0-1)
          session_data: sessionData,
          is_completed: true,
          ai_feedback: `Examen completado con ${result.percentage}% de acierto (${result.correct}/${result.total} preguntas correctas).`
        });

      if (error) {
        console.error('Error saving exam session:', error);
        // Continue showing results even if save fails
      } else {
        console.log('Exam session saved successfully');
        // Force refresh the page data after a short delay
        setTimeout(() => {
          router.refresh();
        }, 2000);
      }
    } catch (error) {
      console.error('Error in handleExamComplete:', error);
      // Continue showing results even if save fails
    }
  }, [userId, courseId, skillId, language, level, provider, examTemplate.estimated_duration, router]);

  return (
    <UniversalExamSimulator
      examTemplate={examTemplate}
      examContent={examContent}
      questions={questions}
      userId={userId}
      mode="practice"
      onExamComplete={handleExamComplete}
    />
  );
}