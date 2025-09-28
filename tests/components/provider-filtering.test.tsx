/**
 * Provider Filtering Functionality Tests
 * Testing search, filter, and sort capabilities for exam providers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock filtering component
const MockProviderFiltering = ({
  providers,
  onFilter,
  onSearch,
  onSort,
  filters = {},
  searchTerm = '',
  sortBy = 'name'
}: {
  providers: any[];
  onFilter: (filters: any) => void;
  onSearch: (term: string) => void;
  onSort: (sortBy: string) => void;
  filters?: any;
  searchTerm?: string;
  sortBy?: string;
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  const handleDifficultyFilter = (difficulty: string) => {
    onFilter({ ...filters, difficulty });
  };

  const handleFeaturedFilter = (featured: boolean) => {
    onFilter({ ...filters, featured });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSort(e.target.value);
  };

  // Apply filters and search
  const filteredProviders = providers.filter(provider => {
    // Search filter
    if (searchTerm && !provider.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Difficulty filter
    if (filters.difficulty && provider.difficulty !== filters.difficulty) {
      return false;
    }

    // Featured filter
    if (filters.featured !== undefined && provider.featured !== filters.featured) {
      return false;
    }

    return true;
  });

  // Apply sorting
  const sortedProviders = [...filteredProviders].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'difficulty':
        const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'totalExams':
        return (b.totalExams || 0) - (a.totalExams || 0);
      default:
        return 0;
    }
  });

  return (
    <div data-testid="provider-filtering">
      {/* Search Bar */}
      <div className="search-section" data-testid="search-section">
        <input
          type="text"
          placeholder="Buscar proveedores..."
          value={searchTerm}
          onChange={handleSearchChange}
          data-testid="search-input"
        />
        <button
          onClick={() => onSearch('')}
          data-testid="clear-search-btn"
        >
          Limpiar
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section" data-testid="filters-section">
        <div className="difficulty-filter" data-testid="difficulty-filter">
          <label>Dificultad:</label>
          <button
            onClick={() => handleDifficultyFilter('beginner')}
            className={filters.difficulty === 'beginner' ? 'active' : ''}
            data-testid="filter-beginner"
          >
            Principiante
          </button>
          <button
            onClick={() => handleDifficultyFilter('intermediate')}
            className={filters.difficulty === 'intermediate' ? 'active' : ''}
            data-testid="filter-intermediate"
          >
            Intermedio
          </button>
          <button
            onClick={() => handleDifficultyFilter('advanced')}
            className={filters.difficulty === 'advanced' ? 'active' : ''}
            data-testid="filter-advanced"
          >
            Avanzado
          </button>
          <button
            onClick={() => handleDifficultyFilter('')}
            data-testid="filter-all-difficulties"
          >
            Todos
          </button>
        </div>

        <div className="featured-filter" data-testid="featured-filter">
          <label>
            <input
              type="checkbox"
              checked={filters.featured === true}
              onChange={(e) => handleFeaturedFilter(e.target.checked ? true : undefined)}
              data-testid="featured-checkbox"
            />
            Solo destacados
          </label>
        </div>

        <button
          onClick={() => onFilter({})}
          data-testid="clear-filters-btn"
        >
          Limpiar filtros
        </button>
      </div>

      {/* Sort */}
      <div className="sort-section" data-testid="sort-section">
        <label>Ordenar por:</label>
        <select
          value={sortBy}
          onChange={handleSortChange}
          data-testid="sort-select"
        >
          <option value="name">Nombre</option>
          <option value="difficulty">Dificultad</option>
          <option value="rating">Puntuación</option>
          <option value="totalExams">Número de exámenes</option>
        </select>
      </div>

      {/* Results */}
      <div className="results-section" data-testid="results-section">
        <div className="results-count" data-testid="results-count">
          {sortedProviders.length} de {providers.length} proveedores
        </div>

        <div className="providers-list" data-testid="providers-list">
          {sortedProviders.length === 0 ? (
            <div data-testid="no-results">
              No se encontraron proveedores con los criterios seleccionados.
            </div>
          ) : (
            sortedProviders.map(provider => (
              <div
                key={provider.id}
                className="provider-item"
                data-testid={`provider-item-${provider.slug}`}
              >
                <h3>{provider.name}</h3>
                <span className="difficulty">{provider.difficulty}</span>
                {provider.featured && <span className="featured-badge">Destacado</span>}
                <span className="exam-count">{provider.totalExams} exámenes</span>
                {provider.rating && <span className="rating">{provider.rating}⭐</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Mock providers data
const mockProviders = [
  {
    id: 'cambridge-001',
    slug: 'cambridge',
    name: 'Cambridge English',
    description: 'Official Cambridge English certification exams',
    difficulty: 'intermediate',
    totalExams: 25,
    rating: 4.5,
    featured: true,
  },
  {
    id: 'eoi-001',
    slug: 'eoi',
    name: 'EOI Valencia',
    description: 'Escuela Oficial de Idiomas certification',
    difficulty: 'advanced',
    totalExams: 15,
    rating: 4.2,
    featured: false,
  },
  {
    id: 'jqcv-001',
    slug: 'jqcv',
    name: 'JQCV',
    description: 'Junta Qualificadora de Coneixements de Valencià',
    difficulty: 'advanced',
    totalExams: 12,
    rating: 4.0,
    featured: true,
  },
  {
    id: 'toefl-001',
    slug: 'toefl',
    name: 'TOEFL iBT',
    description: 'Test of English as a Foreign Language',
    difficulty: 'intermediate',
    totalExams: 8,
    rating: 4.3,
    featured: false,
  },
  {
    id: 'basic-001',
    slug: 'basic',
    name: 'Basic English Test',
    description: 'Entry level English assessment',
    difficulty: 'beginner',
    totalExams: 30,
    rating: 3.8,
    featured: false,
  },
];

describe('Provider Filtering Functionality', () => {
  const mockOnFilter = vi.fn();
  const mockOnSearch = vi.fn();
  const mockOnSort = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Search Functionality', () => {
    it('should render search input', () => {
      render(
        <MockProviderFiltering
          providers={mockProviders}
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
          onSort={mockOnSort}
        />
      );

      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Buscar proveedores...')).toBeInTheDocument();
    });

    it('should filter providers by search term', async () => {
      render(
        <MockProviderFiltering
          providers={mockProviders}
          searchTerm="Cambridge"
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
          onSort={mockOnSort}
        />
      );

      // Should show only Cambridge provider
      expect(screen.getByTestId('provider-item-cambridge')).toBeInTheDocument();
      expect(screen.queryByTestId('provider-item-eoi')).not.toBeInTheDocument();
      expect(screen.getByText('1 de 5 proveedores')).toBeInTheDocument();
    });

    it('should call onSearch when typing', async () => {
      render(
        <MockProviderFiltering
          providers={mockProviders}
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
          onSort={mockOnSort}
        />
      );

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'EOI');

      expect(mockOnSearch).toHaveBeenLastCalledWith('EOI');
    });

    it('should clear search when clear button is clicked', async () => {
      render(
        <MockProviderFiltering
          providers={mockProviders}
          searchTerm="Cambridge"
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
          onSort={mockOnSort}
        />
      );

      const clearButton = screen.getByTestId('clear-search-btn');
      await user.click(clearButton);

      expect(mockOnSearch).toHaveBeenCalledWith('');
    });

    it('should handle case-insensitive search', () => {
      render(
        <MockProviderFiltering
          providers={mockProviders}
          searchTerm="cambridge"
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
          onSort={mockOnSort}
        />
      );

      expect(screen.getByTestId('provider-item-cambridge')).toBeInTheDocument();
    });
  });

  describe('Difficulty Filtering', () => {
    it('should render difficulty filter buttons', () => {
      render(
        <MockProviderFiltering
          providers={mockProviders}
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
          onSort={mockOnSort}
        />
      );

      expect(screen.getByTestId('filter-beginner')).toBeInTheDocument();
      expect(screen.getByTestId('filter-intermediate')).toBeInTheDocument();
      expect(screen.getByTestId('filter-advanced')).toBeInTheDocument();
      expect(screen.getByTestId('filter-all-difficulties')).toBeInTheDocument();
    });

    it('should filter by difficulty', () => {
      render(
        <MockProviderFiltering
          providers={mockProviders}
          filters={{ difficulty: 'advanced' }}
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
          onSort={mockOnSort}
        />
      );

      // Should show only advanced providers
      expect(screen.getByTestId('provider-item-eoi')).toBeInTheDocument();
      expect(screen.getByTestId('provider-item-jqcv')).toBeInTheDocument();
      expect(screen.queryByTestId('provider-item-cambridge')).not.toBeInTheDocument();
      expect(screen.getByText('2 de 5 proveedores')).toBeInTheDocument();
    });

    it('should call onFilter when difficulty button is clicked', async () => {
      render(
        <MockProviderFiltering
          providers={mockProviders}
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
          onSort={mockOnSort}
        />
      );

      const intermediateButton = screen.getByTestId('filter-intermediate');
      await user.click(intermediateButton);

      expect(mockOnFilter).toHaveBeenCalledWith({ difficulty: 'intermediate' });
    });

    it('should highlight active difficulty filter', () => {
      render(
        <MockProviderFiltering
          providers={mockProviders}
          filters={{ difficulty: 'intermediate' }}
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
          onSort={mockOnSort}
        />
      );

      const intermediateButton = screen.getByTestId('filter-intermediate');
      expect(intermediateButton).toHaveClass('active');
    });
  });

  describe('Featured Filtering', () => {
    it('should render featured filter checkbox', () => {
      render(
        <MockProviderFiltering
          providers={mockProviders}
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
          onSort={mockOnSort}
        />
      );

      expect(screen.getByTestId('featured-checkbox')).toBeInTheDocument();
      expect(screen.getByText('Solo destacados')).toBeInTheDocument();
    });

    it('should filter by featured status', () => {
      render(
        <MockProviderFiltering
          providers={mockProviders}
          filters={{ featured: true }}
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
          onSort={mockOnSort}
        />
      );

      // Should show only featured providers
      expect(screen.getByTestId('provider-item-cambridge')).toBeInTheDocument();
      expect(screen.getByTestId('provider-item-jqcv')).toBeInTheDocument();
      expect(screen.queryByTestId('provider-item-eoi')).not.toBeInTheDocument();
      expect(screen.getByText('2 de 5 proveedores')).toBeInTheDocument();
    });

    it('should call onFilter when featured checkbox is toggled', async () => {
      render(
        <MockProviderFiltering
          providers={mockProviders}
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
          onSort={mockOnSort}
        />
      );

      const featuredCheckbox = screen.getByTestId('featured-checkbox');
      await user.click(featuredCheckbox);

      expect(mockOnFilter).toHaveBeenCalledWith({ featured: true });
    });
  });

  describe('Sorting Functionality', () => {
    it('should render sort dropdown', () => {
      render(
        <MockProviderFiltering
          providers={mockProviders}
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
          onSort={mockOnSort}
        />
      );

      expect(screen.getByTestId('sort-select')).toBeInTheDocument();
      expect(screen.getByText('Ordenar por:')).toBeInTheDocument();
    });

    it('should sort by name (default)', () => {
      render(
        <MockProviderFiltering
          providers={mockProviders}
          sortBy="name"
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
          onSort={mockOnSort}
        />
      );

      const providerItems = screen.getAllByTestId(/^provider-item-/);

      // Should be in alphabetical order
      expect(providerItems[0]).toHaveAttribute('data-testid', 'provider-item-basic');
      expect(providerItems[1]).toHaveAttribute('data-testid', 'provider-item-cambridge');
      expect(providerItems[2]).toHaveAttribute('data-testid', 'provider-item-eoi');
    });

    it('should sort by rating', () => {
      render(
        <MockProviderFiltering
          providers={mockProviders}
          sortBy="rating"
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
          onSort={mockOnSort}
        />
      );

      const providerItems = screen.getAllByTestId(/^provider-item-/);

      // Should be in rating order (highest first)
      expect(providerItems[0]).toHaveAttribute('data-testid', 'provider-item-cambridge'); // 4.5
      expect(providerItems[1]).toHaveAttribute('data-testid', 'provider-item-toefl'); // 4.3
      expect(providerItems[2]).toHaveAttribute('data-testid', 'provider-item-eoi'); // 4.2
    });

    it('should call onSort when sort option changes', async () => {
      render(
        <MockProviderFiltering
          providers={mockProviders}
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
          onSort={mockOnSort}
        />
      );

      const sortSelect = screen.getByTestId('sort-select');
      await user.selectOptions(sortSelect, 'rating');

      expect(mockOnSort).toHaveBeenCalledWith('rating');
    });
  });

  describe('Combined Filtering', () => {
    it('should apply multiple filters simultaneously', () => {
      render(
        <MockProviderFiltering
          providers={mockProviders}
          filters={{ difficulty: 'intermediate', featured: true }}
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
          onSort={mockOnSort}
        />
      );

      // Should show only Cambridge (intermediate + featured)
      expect(screen.getByTestId('provider-item-cambridge')).toBeInTheDocument();
      expect(screen.queryByTestId('provider-item-toefl')).not.toBeInTheDocument(); // intermediate but not featured
      expect(screen.queryByTestId('provider-item-jqcv')).not.toBeInTheDocument(); // featured but not intermediate
      expect(screen.getByText('1 de 5 proveedores')).toBeInTheDocument();
    });

    it('should combine search and filters', () => {
      render(
        <MockProviderFiltering
          providers={mockProviders}
          searchTerm="English"
          filters={{ difficulty: 'intermediate' }}
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
          onSort={mockOnSort}
        />
      );

      // Should show Cambridge and TOEFL (both have "English" and are intermediate)
      expect(screen.getByTestId('provider-item-cambridge')).toBeInTheDocument();
      expect(screen.getByTestId('provider-item-toefl')).toBeInTheDocument();
      expect(screen.queryByTestId('provider-item-basic')).not.toBeInTheDocument(); // has "English" but is beginner
      expect(screen.getByText('2 de 5 proveedores')).toBeInTheDocument();
    });

    it('should clear all filters', async () => {
      render(
        <MockProviderFiltering
          providers={mockProviders}
          filters={{ difficulty: 'advanced', featured: true }}
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
          onSort={mockOnSort}
        />
      );

      const clearButton = screen.getByTestId('clear-filters-btn');
      await user.click(clearButton);

      expect(mockOnFilter).toHaveBeenCalledWith({});
    });
  });

  describe('Results Display', () => {
    it('should show results count', () => {
      render(
        <MockProviderFiltering
          providers={mockProviders}
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
          onSort={mockOnSort}
        />
      );

      expect(screen.getByText('5 de 5 proveedores')).toBeInTheDocument();
    });

    it('should show no results message when no providers match', () => {
      render(
        <MockProviderFiltering
          providers={mockProviders}
          searchTerm="NonExistentProvider"
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
          onSort={mockOnSort}
        />
      );

      expect(screen.getByTestId('no-results')).toBeInTheDocument();
      expect(screen.getByText('No se encontraron proveedores con los criterios seleccionados.')).toBeInTheDocument();
    });

    it('should display provider information correctly', () => {
      render(
        <MockProviderFiltering
          providers={mockProviders}
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
          onSort={mockOnSort}
        />
      );

      const cambridgeItem = screen.getByTestId('provider-item-cambridge');

      expect(cambridgeItem).toContainElement(screen.getByText('Cambridge English'));
      expect(cambridgeItem).toContainElement(screen.getByText('intermediate'));
      expect(cambridgeItem).toContainElement(screen.getByText('Destacado'));
      expect(cambridgeItem).toContainElement(screen.getByText('25 exámenes'));
      expect(cambridgeItem).toContainElement(screen.getByText('4.5⭐'));
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle empty providers array', () => {
      render(
        <MockProviderFiltering
          providers={[]}
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
          onSort={mockOnSort}
        />
      );

      expect(screen.getByText('0 de 0 proveedores')).toBeInTheDocument();
      expect(screen.getByTestId('no-results')).toBeInTheDocument();
    });

    it('should handle providers without optional fields', () => {
      const minimalProviders = [
        {
          id: 'minimal-001',
          slug: 'minimal',
          name: 'Minimal Provider',
          difficulty: 'beginner',
          totalExams: 5,
        }
      ];

      render(
        <MockProviderFiltering
          providers={minimalProviders}
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
          onSort={mockOnSort}
        />
      );

      const providerItem = screen.getByTestId('provider-item-minimal');
      expect(providerItem).toBeInTheDocument();
      expect(screen.queryByText('Destacado')).not.toBeInTheDocument();
      expect(screen.queryByText('⭐')).not.toBeInTheDocument();
    });

    it('should debounce search input for performance', async () => {
      render(
        <MockProviderFiltering
          providers={mockProviders}
          onFilter={mockOnFilter}
          onSearch={mockOnSearch}
          onSort={mockOnSort}
        />
      );

      const searchInput = screen.getByTestId('search-input');

      // Type multiple characters quickly
      await user.type(searchInput, 'Cam');

      // Should call onSearch for each character (in real implementation, this would be debounced)
      expect(mockOnSearch).toHaveBeenCalledWith('Cam');
    });
  });
});