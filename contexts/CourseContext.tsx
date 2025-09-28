'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { CourseConfiguration } from '@/lib/exam-engine/types/course-config';
import { ExamSession } from '@/lib/exam-engine/types/session-types';

interface CourseContextValue {
  courseConfig: CourseConfiguration | null;
  currentSession: ExamSession | null;
  isLoading: boolean;
  error: string | null;
  
  // Course management
  loadCourse: (courseId: string) => Promise<void>;
  updateProgress: (sectionId: string, progress: number) => Promise<void>;
  
  // Session management
  startSession: (examId: string) => Promise<void>;
  endSession: () => Promise<void>;
  updateSessionProgress: (questionIndex: number, answer: any) => Promise<void>;
}

export const CourseContext = createContext<CourseContextValue | null>(null);

interface CourseProviderProps {
  children: ReactNode;
  initialCourseId?: string;
}

export function CourseProvider({ children, initialCourseId }: CourseProviderProps) {
  const [courseConfig, setCourseConfig] = useState<CourseConfiguration | null>(null);
  const [currentSession, setCurrentSession] = useState<ExamSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCourseId) {
      loadCourse(initialCourseId);
    }
  }, [initialCourseId]);

  const loadCourse = async (courseId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/academia/courses/${courseId}`);
      if (!response.ok) {
        throw new Error('Failed to load course');
      }
      
      const course = await response.json();
      setCourseConfig(course);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProgress = async (sectionId: string, progress: number) => {
    if (!courseConfig) return;
    
    try {
      const response = await fetch(`/api/academia/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: courseConfig.id,
          sectionId,
          progress,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update progress');
      }
    } catch (err) {
      console.error('Progress update failed:', err);
    }
  };

  const startSession = async (examId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/academia/exams/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to start session');
      }
      
      const session = await response.json();
      setCurrentSession(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const endSession = async () => {
    if (!currentSession) return;
    
    try {
      await fetch(`/api/academia/exams/sessions/${currentSession.id}`, {
        method: 'DELETE',
      });
      
      setCurrentSession(null);
    } catch (err) {
      console.error('End session failed:', err);
    }
  };

  const updateSessionProgress = async (questionIndex: number, answer: any) => {
    if (!currentSession) return;
    
    try {
      const response = await fetch(`/api/academia/exams/sessions/${currentSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionIndex,
          answer,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update session progress');
      }
      
      const updatedSession = await response.json();
      setCurrentSession(updatedSession);
    } catch (err) {
      console.error('Session progress update failed:', err);
    }
  };

  const contextValue: CourseContextValue = {
    courseConfig,
    currentSession,
    isLoading,
    error,
    loadCourse,
    updateProgress,
    startSession,
    endSession,
    updateSessionProgress,
  };

  return (
    <CourseContext.Provider value={contextValue}>
      {children}
    </CourseContext.Provider>
  );
}

export function useCourse(): CourseContextValue {
  const context = useContext(CourseContext);
  
  if (!context) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  
  return context;
}