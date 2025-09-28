'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { CourseConfiguration } from '@/lib/exam-engine/types/course-config';

export interface ProviderOption {
  slug: string;
  name: string;
  description?: string;
  total_exams?: number;
}

interface CourseContextValue {
  courseConfig: CourseConfiguration;
  userId: string;
  currentSection?: string;
  isLoading: boolean;
  error?: string;
  // Provider selection state
  availableProviders: ProviderOption[];
  selectedProvider: string | null;
  setSelectedProvider: (provider: string) => void;
}

export const CourseContext = createContext<CourseContextValue | null>(null);

interface CourseContextProviderProps {
  courseConfig: CourseConfiguration;
  userId: string;
  children: ReactNode;
}

export function CourseContextProvider({
  courseConfig,
  userId,
  children
}: CourseContextProviderProps) {
  // Extract available providers from course configuration
  const availableProviders: ProviderOption[] = Object.entries(courseConfig.providers || {}).map(([slug, provider]) => ({
    slug,
    name: provider.name || slug.toUpperCase(),
    description: provider.description,
    total_exams: provider.examIds?.length || 0
  }));

  // DEBUG: Log provider information
  console.log('🔍 CourseContextProvider Debug:', {
    courseId: courseConfig.courseId,
    availableProviders,
    providersCount: availableProviders.length,
    rawProviders: courseConfig.providers
  });

  // Provider selection state with persistence
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  // Initialize provider selection from localStorage on mount
  useEffect(() => {
    const courseKey = `${courseConfig.language}_${courseConfig.level}`;
    const storageKey = `neolingus_provider_${courseKey}`;

    try {
      const savedProvider = localStorage.getItem(storageKey);
      if (savedProvider && availableProviders.some(p => p.slug === savedProvider)) {
        setSelectedProvider(savedProvider);
      } else {
        // Default to first available provider
        const defaultProvider = availableProviders.length > 0 ? availableProviders[0].slug : null;
        setSelectedProvider(defaultProvider);
        if (defaultProvider) {
          localStorage.setItem(storageKey, defaultProvider);
        }
      }
    } catch (error) {
      console.warn('Error loading provider from localStorage:', error);
      // Fallback to first available provider
      const defaultProvider = availableProviders.length > 0 ? availableProviders[0].slug : null;
      setSelectedProvider(defaultProvider);
    }
  }, [courseConfig.language, courseConfig.level, availableProviders]);

  // Persist provider selection to localStorage
  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);

    try {
      const courseKey = `${courseConfig.language}_${courseConfig.level}`;
      const storageKey = `neolingus_provider_${courseKey}`;
      localStorage.setItem(storageKey, provider);
    } catch (error) {
      console.warn('Error saving provider to localStorage:', error);
    }
  };

  const contextValue: CourseContextValue = {
    courseConfig,
    userId,
    isLoading: false,
    error: undefined,
    availableProviders,
    selectedProvider,
    setSelectedProvider: handleProviderChange
  };

  return (
    <CourseContext.Provider value={contextValue}>
      {children}
    </CourseContext.Provider>
  );
}

export function useCourseContext(): CourseContextValue {
  const context = useContext(CourseContext);
  
  if (!context) {
    throw new Error('useCourseContext must be used within a CourseContextProvider');
  }
  
  return context;
}