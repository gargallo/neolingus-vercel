/**
 * Provider Card Component Tests
 * Testing the provider card component for proper rendering and interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProviderCard, ProviderComparison, ProviderStatsWidget } from '@/components/academia/provider-card';
import type { ExamProvider } from '@/components/academia/provider-card';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock UI components
vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: any) => <div data-testid="progress" data-value={value} />,
}));

// Mock widget utils
vi.mock('@/lib/academia/widget-utils', () => ({
  getProviderClasses: () => ({
    gradient: 'from-blue-500 to-blue-700',
    background: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-900',
    accent: 'text-blue-600',
  }),
  formatNumber: (num: number) => num.toString(),
  formatPercentage: (num: number) => `${num}%`,
}));

// Test data
const mockProvider: ExamProvider = {
  id: 'cambridge-001',
  slug: 'cambridge',
  name: 'Cambridge English',
  description: 'Official Cambridge English certification exams',
  difficulty: 'intermediate',
  totalExams: 25,
  completedExams: 10,
  averageScore: 75,
  estimatedTime: 120,
  rating: 4.5,
  studentsCount: 12500,
  tags: ['Official', 'International', 'Academic'],
  featured: true,
  certification: {
    type: 'Cambridge Certificate',
    validity: 'Permanent',
    recognized: ['UK', 'EU', 'Australia'],
  },
  pricing: {
    examFee: 180,
    currency: 'EUR',
    freeRetakes: 1,
  },
  stats: {
    passRate: 85,
    averagePreparationTime: 12,
    satisfactionScore: 4.3,
  },
};

const mockProviders: ExamProvider[] = [
  mockProvider,
  {
    id: 'eoi-001',
    slug: 'eoi',
    name: 'EOI Valencia',
    description: 'Escuela Oficial de Idiomas certification',
    difficulty: 'advanced',
    totalExams: 15,
    rating: 4.2,
    studentsCount: 8500,
  },
];

describe('ProviderCard', () => {
  const mockOnSelect = vi.fn();
  const mockOnStartExam = vi.fn();
  const mockOnViewDetails = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render provider basic information', () => {
    render(
      <ProviderCard
        provider={mockProvider}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Cambridge English')).toBeInTheDocument();
    expect(screen.getByText('Official Cambridge English certification exams')).toBeInTheDocument();
    expect(screen.getByText('intermediate')).toBeInTheDocument();
  });

  it('should display featured badge for featured providers', () => {
    render(
      <ProviderCard
        provider={mockProvider}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('should show provider statistics', () => {
    render(
      <ProviderCard
        provider={mockProvider}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('25 exams')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('12500')).toBeInTheDocument();
    expect(screen.getByText('120min')).toBeInTheDocument();
  });

  it('should display progress when showProgress is true and progress data exists', () => {
    render(
      <ProviderCard
        provider={mockProvider}
        showProgress={true}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Progreso')).toBeInTheDocument();
    expect(screen.getByText('10/25')).toBeInTheDocument();
    expect(screen.getByTestId('progress')).toHaveAttribute('data-value', '40');
  });

  it('should show pricing information when showPricing is true', () => {
    render(
      <ProviderCard
        provider={mockProvider}
        showPricing={true}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Precio del examen')).toBeInTheDocument();
    expect(screen.getByText('180€')).toBeInTheDocument();
    expect(screen.getByText('1 repetición gratis')).toBeInTheDocument();
  });

  it('should display provider stats when showStats is true', () => {
    render(
      <ProviderCard
        provider={mockProvider}
        showStats={true}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Tasa de aprobados')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('Satisfacción')).toBeInTheDocument();
    expect(screen.getByText('4.3/5')).toBeInTheDocument();
  });

  it('should show tags up to limit', () => {
    render(
      <ProviderCard
        provider={mockProvider}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Official')).toBeInTheDocument();
    expect(screen.getByText('International')).toBeInTheDocument();
    expect(screen.getByText('Academic')).toBeInTheDocument();
  });

  it('should call onSelect when card is clicked', () => {
    render(
      <ProviderCard
        provider={mockProvider}
        onSelect={mockOnSelect}
      />
    );

    const card = screen.getByText('Cambridge English').closest('div');
    fireEvent.click(card!);

    expect(mockOnSelect).toHaveBeenCalledWith(mockProvider);
  });

  it('should call onSelect when "Seleccionar Proveedor" button is clicked', () => {
    render(
      <ProviderCard
        provider={mockProvider}
        onSelect={mockOnSelect}
      />
    );

    const selectButton = screen.getByText('Seleccionar Proveedor');
    fireEvent.click(selectButton);

    expect(mockOnSelect).toHaveBeenCalledWith(mockProvider);
  });

  it('should show "Comenzar Examen" button when provider is selected', () => {
    render(
      <ProviderCard
        provider={mockProvider}
        isSelected={true}
        onStartExam={mockOnStartExam}
      />
    );

    expect(screen.getByText('Comenzar Examen')).toBeInTheDocument();
  });

  it('should call onStartExam when "Comenzar Examen" button is clicked', () => {
    render(
      <ProviderCard
        provider={mockProvider}
        isSelected={true}
        onStartExam={mockOnStartExam}
      />
    );

    const startButton = screen.getByText('Comenzar Examen');
    fireEvent.click(startButton);

    expect(mockOnStartExam).toHaveBeenCalledWith(mockProvider.id);
  });

  it('should call onViewDetails when "Detalles" button is clicked', () => {
    render(
      <ProviderCard
        provider={mockProvider}
        onViewDetails={mockOnViewDetails}
      />
    );

    const detailsButton = screen.getByText('Detalles');
    fireEvent.click(detailsButton);

    expect(mockOnViewDetails).toHaveBeenCalledWith(mockProvider.id);
  });

  it('should render in compact mode when compact prop is true', () => {
    render(
      <ProviderCard
        provider={mockProvider}
        compact={true}
        onSelect={mockOnSelect}
      />
    );

    // Compact mode should hide description and secondary actions
    expect(screen.queryByText('Official Cambridge English certification exams')).not.toBeInTheDocument();
    expect(screen.queryByText('Detalles')).not.toBeInTheDocument();
  });

  it('should show certification info when available', () => {
    render(
      <ProviderCard
        provider={mockProvider}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Cambridge Certificate')).toBeInTheDocument();
  });

  it('should handle providers without optional data gracefully', () => {
    const minimalProvider: ExamProvider = {
      id: 'minimal-001',
      slug: 'minimal',
      name: 'Minimal Provider',
      description: 'Basic provider',
      difficulty: 'beginner',
      totalExams: 5,
    };

    render(
      <ProviderCard
        provider={minimalProvider}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Minimal Provider')).toBeInTheDocument();
    expect(screen.getByText('5 exams')).toBeInTheDocument();
    // Should not show rating, students count, etc.
    expect(screen.queryByText('4.5')).not.toBeInTheDocument();
  });
});

describe('ProviderComparison', () => {
  const mockOnProviderSelect = vi.fn();

  it('should render multiple provider cards', () => {
    render(
      <ProviderComparison
        providers={mockProviders}
        onProviderSelect={mockOnProviderSelect}
      />
    );

    expect(screen.getByText('Cambridge English')).toBeInTheDocument();
    expect(screen.getByText('EOI Valencia')).toBeInTheDocument();
  });

  it('should highlight selected provider', () => {
    render(
      <ProviderComparison
        providers={mockProviders}
        selectedProvider={mockProviders[0].id}
        onProviderSelect={mockOnProviderSelect}
      />
    );

    // The selected provider should show "Comenzar Examen" button
    expect(screen.getByText('Comenzar Examen')).toBeInTheDocument();
  });
});

describe('ProviderStatsWidget', () => {
  it('should display aggregated statistics', () => {
    render(
      <ProviderStatsWidget providers={mockProviders} />
    );

    expect(screen.getByText('Proveedores de Examen')).toBeInTheDocument();
    expect(screen.getByText('Estadísticas de todos los proveedores disponibles')).toBeInTheDocument();

    // Should show total exams (25 + 15 = 40)
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('Exámenes')).toBeInTheDocument();

    // Should show average rating ((4.5 + 4.2) / 2 = 4.4)
    expect(screen.getByText('4.4')).toBeInTheDocument();
    expect(screen.getByText('Puntuación')).toBeInTheDocument();

    // Should show total students (12500 + 8500 = 21000)
    expect(screen.getByText('21000')).toBeInTheDocument();
    expect(screen.getByText('Estudiantes')).toBeInTheDocument();
  });

  it('should handle empty providers array', () => {
    render(
      <ProviderStatsWidget providers={[]} />
    );

    expect(screen.getByText('Proveedores de Examen')).toBeInTheDocument();
    // Should show 0 for all stats
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});

describe('Provider Card Accessibility', () => {
  it('should have proper ARIA labels and roles', () => {
    render(
      <ProviderCard
        provider={mockProvider}
        onSelect={vi.fn()}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);

    // Main action button should be accessible
    const selectButton = screen.getByText('Seleccionar Proveedor');
    expect(selectButton).toBeInTheDocument();
  });

  it('should support keyboard navigation', () => {
    render(
      <ProviderCard
        provider={mockProvider}
        onSelect={vi.fn()}
      />
    );

    const selectButton = screen.getByText('Seleccionar Proveedor');
    selectButton.focus();
    expect(document.activeElement).toBe(selectButton);
  });
});

describe('Provider Card Error Handling', () => {
  it('should handle missing provider data gracefully', () => {
    const incompleteProvider = {
      id: 'incomplete',
      slug: 'incomplete',
      name: 'Incomplete Provider',
      description: '',
      difficulty: 'beginner' as const,
      totalExams: 0,
    };

    render(
      <ProviderCard
        provider={incompleteProvider}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('Incomplete Provider')).toBeInTheDocument();
    expect(screen.getByText('0 exams')).toBeInTheDocument();
  });

  it('should handle callback errors gracefully', () => {
    const errorCallback = vi.fn(() => {
      throw new Error('Callback error');
    });

    render(
      <ProviderCard
        provider={mockProvider}
        onSelect={errorCallback}
      />
    );

    // Should not crash when callback throws
    const selectButton = screen.getByText('Seleccionar Proveedor');
    expect(() => fireEvent.click(selectButton)).not.toThrow();
  });
});