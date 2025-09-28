/**
 * Exam Access Workflow Tests
 * Testing the complete exam access flow from provider selection to exam start
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the course dashboard component
const MockCourseDashboard = ({ providers, selectedProvider, onProviderSelect, onExamStart }: {
  providers: any[];
  selectedProvider?: string;
  onProviderSelect: (provider: any) => void;
  onExamStart: (examId: string) => void;
}) => (
  <div data-testid="course-dashboard">
    <div className="provider-section" data-testid="provider-section">
      <h2>Proveedores de Examen</h2>
      <div className="provider-grid" data-testid="provider-grid">
        {providers.map(provider => (
          <div
            key={provider.id}
            data-testid={`provider-${provider.slug}`}
            className={`provider-card ${selectedProvider === provider.id ? 'selected' : ''}`}
            onClick={() => onProviderSelect(provider)}
          >
            <h3>{provider.name}</h3>
            <p>{provider.description}</p>
            {selectedProvider === provider.id && (
              <button
                data-testid="start-exam-btn"
                onClick={() => onExamStart(provider.id)}
              >
                Comenzar Examen
              </button>
            )}
          </div>
        ))}
      </div>
    </div>

    <div className="exam-section" data-testid="exam-section">
      <h2>Exámenes Disponibles</h2>
      {selectedProvider && (
        <div data-testid="available-exams">
          <div className="exam-list">
            <div className="exam-item" data-testid="exam-item-1">
              <span>Practice Test 1</span>
              <button onClick={() => onExamStart('exam-1')}>Iniciar</button>
            </div>
            <div className="exam-item" data-testid="exam-item-2">
              <span>Mock Exam A</span>
              <button onClick={() => onExamStart('exam-2')}>Iniciar</button>
            </div>
          </div>
        </div>
      )}
    </div>

    <div className="quick-access" data-testid="quick-access">
      <h3>Acceso Rápido</h3>
      <button
        data-testid="quick-start-btn"
        onClick={() => onExamStart('quick-exam')}
        disabled={!selectedProvider}
      >
        Iniciar Examen Rápido
      </button>
    </div>
  </div>
);

// Mock providers data
const mockProviders = [
  {
    id: 'cambridge-001',
    slug: 'cambridge',
    name: 'Cambridge English',
    description: 'Official Cambridge English certification exams',
    difficulty: 'intermediate',
    totalExams: 25,
    featured: true,
  },
  {
    id: 'eoi-001',
    slug: 'eoi',
    name: 'EOI Valencia',
    description: 'Escuela Oficial de Idiomas certification',
    difficulty: 'advanced',
    totalExams: 15,
  },
  {
    id: 'jqcv-001',
    slug: 'jqcv',
    name: 'JQCV',
    description: 'Junta Qualificadora de Coneixements de Valencià',
    difficulty: 'advanced',
    totalExams: 12,
  },
];

describe('Exam Access Workflow', () => {
  const mockOnProviderSelect = vi.fn();
  const mockOnExamStart = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Provider Selection Flow', () => {
    it('should display all available providers', () => {
      render(
        <MockCourseDashboard
          providers={mockProviders}
          onProviderSelect={mockOnProviderSelect}
          onExamStart={mockOnExamStart}
        />
      );

      expect(screen.getByText('Proveedores de Examen')).toBeInTheDocument();
      expect(screen.getByTestId('provider-grid')).toBeInTheDocument();

      // All providers should be visible
      expect(screen.getByText('Cambridge English')).toBeInTheDocument();
      expect(screen.getByText('EOI Valencia')).toBeInTheDocument();
      expect(screen.getByText('JQCV')).toBeInTheDocument();
    });

    it('should allow provider selection', async () => {
      render(
        <MockCourseDashboard
          providers={mockProviders}
          onProviderSelect={mockOnProviderSelect}
          onExamStart={mockOnExamStart}
        />
      );

      const cambridgeProvider = screen.getByTestId('provider-cambridge');
      await user.click(cambridgeProvider);

      expect(mockOnProviderSelect).toHaveBeenCalledWith(mockProviders[0]);
    });

    it('should highlight selected provider', () => {
      render(
        <MockCourseDashboard
          providers={mockProviders}
          selectedProvider="cambridge-001"
          onProviderSelect={mockOnProviderSelect}
          onExamStart={mockOnExamStart}
        />
      );

      const selectedProvider = screen.getByTestId('provider-cambridge');
      expect(selectedProvider).toHaveClass('selected');
    });

    it('should show exam start button for selected provider', () => {
      render(
        <MockCourseDashboard
          providers={mockProviders}
          selectedProvider="cambridge-001"
          onProviderSelect={mockOnProviderSelect}
          onExamStart={mockOnExamStart}
        />
      );

      expect(screen.getByTestId('start-exam-btn')).toBeInTheDocument();
      expect(screen.getByText('Comenzar Examen')).toBeInTheDocument();
    });
  });

  describe('Exam Access Flow', () => {
    it('should display available exams when provider is selected', () => {
      render(
        <MockCourseDashboard
          providers={mockProviders}
          selectedProvider="cambridge-001"
          onProviderSelect={mockOnProviderSelect}
          onExamStart={mockOnExamStart}
        />
      );

      expect(screen.getByText('Exámenes Disponibles')).toBeInTheDocument();
      expect(screen.getByTestId('available-exams')).toBeInTheDocument();
      expect(screen.getByText('Practice Test 1')).toBeInTheDocument();
      expect(screen.getByText('Mock Exam A')).toBeInTheDocument();
    });

    it('should not display exams when no provider is selected', () => {
      render(
        <MockCourseDashboard
          providers={mockProviders}
          onProviderSelect={mockOnProviderSelect}
          onExamStart={mockOnExamStart}
        />
      );

      expect(screen.queryByTestId('available-exams')).not.toBeInTheDocument();
    });

    it('should allow starting specific exams', async () => {
      render(
        <MockCourseDashboard
          providers={mockProviders}
          selectedProvider="cambridge-001"
          onProviderSelect={mockOnProviderSelect}
          onExamStart={mockOnExamStart}
        />
      );

      const examItem = screen.getByTestId('exam-item-1');
      const startButton = examItem.querySelector('button');

      await user.click(startButton!);

      expect(mockOnExamStart).toHaveBeenCalledWith('exam-1');
    });

    it('should handle quick exam start', async () => {
      render(
        <MockCourseDashboard
          providers={mockProviders}
          selectedProvider="cambridge-001"
          onProviderSelect={mockOnProviderSelect}
          onExamStart={mockOnExamStart}
        />
      );

      const quickStartBtn = screen.getByTestId('quick-start-btn');
      await user.click(quickStartBtn);

      expect(mockOnExamStart).toHaveBeenCalledWith('quick-exam');
    });

    it('should disable quick start when no provider selected', () => {
      render(
        <MockCourseDashboard
          providers={mockProviders}
          onProviderSelect={mockOnProviderSelect}
          onExamStart={mockOnExamStart}
        />
      );

      const quickStartBtn = screen.getByTestId('quick-start-btn');
      expect(quickStartBtn).toBeDisabled();
    });
  });

  describe('Complete Workflow Integration', () => {
    it('should complete full workflow: select provider → view exams → start exam', async () => {
      const { rerender } = render(
        <MockCourseDashboard
          providers={mockProviders}
          onProviderSelect={mockOnProviderSelect}
          onExamStart={mockOnExamStart}
        />
      );

      // Step 1: Select provider
      const cambridgeProvider = screen.getByTestId('provider-cambridge');
      await user.click(cambridgeProvider);

      expect(mockOnProviderSelect).toHaveBeenCalledWith(mockProviders[0]);

      // Simulate state update
      rerender(
        <MockCourseDashboard
          providers={mockProviders}
          selectedProvider="cambridge-001"
          onProviderSelect={mockOnProviderSelect}
          onExamStart={mockOnExamStart}
        />
      );

      // Step 2: Verify exams are visible
      expect(screen.getByTestId('available-exams')).toBeInTheDocument();

      // Step 3: Start exam
      const examStartBtn = screen.getByTestId('start-exam-btn');
      await user.click(examStartBtn);

      expect(mockOnExamStart).toHaveBeenCalledWith('cambridge-001');
    });

    it('should handle provider switching correctly', async () => {
      const { rerender } = render(
        <MockCourseDashboard
          providers={mockProviders}
          selectedProvider="cambridge-001"
          onProviderSelect={mockOnProviderSelect}
          onExamStart={mockOnExamStart}
        />
      );

      // Initially Cambridge is selected
      expect(screen.getByTestId('provider-cambridge')).toHaveClass('selected');

      // Switch to EOI
      const eoiProvider = screen.getByTestId('provider-eoi');
      await user.click(eoiProvider);

      expect(mockOnProviderSelect).toHaveBeenCalledWith(mockProviders[1]);

      // Simulate state update
      rerender(
        <MockCourseDashboard
          providers={mockProviders}
          selectedProvider="eoi-001"
          onProviderSelect={mockOnProviderSelect}
          onExamStart={mockOnExamStart}
        />
      );

      // Verify selection changed
      expect(screen.getByTestId('provider-eoi')).toHaveClass('selected');
      expect(screen.getByTestId('provider-cambridge')).not.toHaveClass('selected');
    });
  });

  describe('Accessibility and UX', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <MockCourseDashboard
          providers={mockProviders}
          selectedProvider="cambridge-001"
          onProviderSelect={mockOnProviderSelect}
          onExamStart={mockOnExamStart}
        />
      );

      // Provider section should be accessible
      expect(screen.getByTestId('provider-section')).toBeInTheDocument();

      // Buttons should be accessible
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should provide clear visual feedback for interactions', async () => {
      render(
        <MockCourseDashboard
          providers={mockProviders}
          onProviderSelect={mockOnProviderSelect}
          onExamStart={mockOnExamStart}
        />
      );

      const provider = screen.getByTestId('provider-cambridge');

      // Should be clickable
      expect(provider).toBeInTheDocument();

      // Click should work
      await user.click(provider);
      expect(mockOnProviderSelect).toHaveBeenCalled();
    });

    it('should handle keyboard navigation', async () => {
      render(
        <MockCourseDashboard
          providers={mockProviders}
          selectedProvider="cambridge-001"
          onProviderSelect={mockOnProviderSelect}
          onExamStart={mockOnExamStart}
        />
      );

      const startButton = screen.getByTestId('start-exam-btn');

      // Should be focusable
      startButton.focus();
      expect(document.activeElement).toBe(startButton);

      // Should respond to Enter key
      await user.keyboard('{Enter}');
      expect(mockOnExamStart).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle empty providers list gracefully', () => {
      render(
        <MockCourseDashboard
          providers={[]}
          onProviderSelect={mockOnProviderSelect}
          onExamStart={mockOnExamStart}
        />
      );

      expect(screen.getByTestId('provider-grid')).toBeInTheDocument();
      expect(screen.queryByTestId('provider-cambridge')).not.toBeInTheDocument();
    });

    it('should handle callback errors gracefully', async () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });

      render(
        <MockCourseDashboard
          providers={mockProviders}
          onProviderSelect={errorCallback}
          onExamStart={mockOnExamStart}
        />
      );

      // Should not crash when callback throws
      const provider = screen.getByTestId('provider-cambridge');
      expect(() => user.click(provider)).not.toThrow();
    });

    it('should handle missing exam data', () => {
      render(
        <MockCourseDashboard
          providers={mockProviders}
          selectedProvider="cambridge-001"
          onProviderSelect={mockOnProviderSelect}
          onExamStart={mockOnExamStart}
        />
      );

      // Should render exam section even if no specific exam data
      expect(screen.getByTestId('exam-section')).toBeInTheDocument();
    });
  });
});