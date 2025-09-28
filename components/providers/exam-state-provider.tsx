"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ExamState {
  isExamActive: boolean;
  examId: string | null;
  startExam: (examId: string) => void;
  endExam: () => void;
}

const ExamStateContext = createContext<ExamState | undefined>(undefined);

export function ExamStateProvider({ children }: { children: ReactNode }) {
  const [isExamActive, setIsExamActive] = useState(false);
  const [examId, setExamId] = useState<string | null>(null);

  const startExam = (newExamId: string) => {
    setIsExamActive(true);
    setExamId(newExamId);
    // Enviar evento para colapsar el menú
    window.dispatchEvent(new CustomEvent('examStarted', { detail: { examId: newExamId } }));
  };

  const endExam = () => {
    setIsExamActive(false);
    setExamId(null);
    // Enviar evento para expandir el menú
    window.dispatchEvent(new CustomEvent('examEnded'));
  };

  // Limpiar estado del examen cuando el usuario navega fuera del simulador
  useEffect(() => {
    const handleRouteChange = () => {
      if (isExamActive && !window.location.pathname.includes('/simulador')) {
        endExam();
      }
    };

    // Observar cambios en la URL
    const observer = new MutationObserver(() => {
      handleRouteChange();
    });

    observer.observe(document, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });

    // También escuchar eventos de navegación
    window.addEventListener('beforeunload', endExam);
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('beforeunload', endExam);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [isExamActive]);

  return (
    <ExamStateContext.Provider value={{
      isExamActive,
      examId,
      startExam,
      endExam
    }}>
      {children}
    </ExamStateContext.Provider>
  );
}

export function useExamState() {
  const context = useContext(ExamStateContext);
  if (context === undefined) {
    throw new Error('useExamState must be used within an ExamStateProvider');
  }
  return context;
}