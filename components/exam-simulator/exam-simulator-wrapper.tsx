"use client";

import { useRouter } from 'next/navigation';
import { UniversalExamSimulator } from './universal-exam-simulator';
import type { ExamContent, ExamMode } from '@/types/exam-system';
import type { Question, SimpleExamTemplate } from '@/lib/services/exam-data.service';

interface ExamSimulatorWrapperProps {
  examTemplate: SimpleExamTemplate;
  examContent: ExamContent[];
  questions: Question[];
  userId: string;
  mode: ExamMode;
  language: string;
  level: string;
  provider: string;
}

export function ExamSimulatorWrapper({
  examTemplate,
  examContent,
  questions,
  userId,
  mode,
  language,
  level,
  provider
}: ExamSimulatorWrapperProps) {
  const router = useRouter();

  const handleExamComplete = (result: any) => {
    // Handle exam completion
    console.log('Exam completed:', result);
    // TODO: Save results to database
  };

  const handleExamExit = () => {
    // Handle exam exit - navigate back to provider page
    router.push(`/dashboard/${language}/${level}/examens/${provider}`);
  };

  return (
    <UniversalExamSimulator
      examTemplate={examTemplate}
      examContent={examContent}
      questions={questions}
      userId={userId}
      mode={mode}
      onExamComplete={handleExamComplete}
      onExamExit={handleExamExit}
    />
  );
}