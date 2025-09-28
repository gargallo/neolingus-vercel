import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ConstructionHomepage } from '@/components/homepage/construction-homepage';
import { ConstructionHomepageProps } from '@/lib/types/homepage';

// Mock data for tests
const mockProps: ConstructionHomepageProps = {
  hero: {
    title: 'Build Your Future with NeoLingus',
    subtitle: 'Master languages with our construction-themed academy platform',
    ctaButtons: [
      { text: 'Start Learning', href: '/signup', variant: 'primary', icon: 'play' },
      { text: 'Login', href: '/login', variant: 'outline', icon: 'user' }
    ]
  },
  features: [
    {
      id: 'feature-1',
      title: 'Structured Learning',
      description: 'Built on solid foundations with progressive skill development',
      icon: 'building',
      link: '/dashboard'
    }
  ],
  testimonials: [
    {
      id: 'testimonial-1',
      name: 'Maria Construction',
      role: 'Language Student',
      company: 'BuildCorp',
      content: 'Excellent platform for learning!',
      rating: 5
    }
  ],
  stats: [
    { label: 'Students', value: '1000+', icon: 'users', description: 'Active learners' }
  ],
  authButtons: {
    loginText: 'Login',
    signupText: 'Sign Up',
    loginHref: '/login',
    signupHref: '/signup'
  },
  showDemoMode: false
};

describe('ConstructionHomepage', () => {
  it('should render hero section with title and subtitle', () => {
    render(<ConstructionHomepage {...mockProps} />);
    
    expect(screen.getByText('Build Your Future with NeoLingus')).toBeInTheDocument();
    expect(screen.getByText('Master languages with our construction-themed academy platform')).toBeInTheDocument();
  });

  it('should render CTA buttons with correct links', () => {
    render(<ConstructionHomepage {...mockProps} />);
    
    const startButton = screen.getByRole('link', { name: /start learning/i });
    const loginButtons = screen.getAllByRole('link', { name: /login/i });
    
    expect(startButton).toHaveAttribute('href', '/signup');
    expect(loginButtons.length).toBeGreaterThan(0);
    expect(loginButtons[0]).toHaveAttribute('href', '/login');
  });

  it('should render feature cards', () => {
    render(<ConstructionHomepage {...mockProps} />);
    
    expect(screen.getByText('Structured Learning')).toBeInTheDocument();
    expect(screen.getByText('Built on solid foundations with progressive skill development')).toBeInTheDocument();
  });

  it('should render testimonials section', () => {
    render(<ConstructionHomepage {...mockProps} />);
    
    // Check for testimonials section presence
    expect(screen.getByText('Built by the Community')).toBeInTheDocument();
    expect(screen.getByText('See what our learners are building with NeoLingus')).toBeInTheDocument();
    
    // Check that testimonials are rendered (at least one testimonial name should exist)
    expect(screen.getByText('Maria Construction')).toBeInTheDocument();
  });

  it('should render statistics', () => {
    render(<ConstructionHomepage {...mockProps} />);
    
    expect(screen.getByText('1000+')).toBeInTheDocument();
    expect(screen.getByText('Students')).toBeInTheDocument();
  });

  it('should show demo mode banner when enabled', () => {
    const propsWithDemo = { ...mockProps, showDemoMode: true };
    render(<ConstructionHomepage {...propsWithDemo} />);
    
    expect(screen.getByText(/demo mode/i)).toBeInTheDocument();
  });

  it('should apply construction theme classes', () => {
    render(<ConstructionHomepage {...mockProps} />);
    
    const heroSections = screen.getAllByRole('banner');
    // Find the main hero section (not the header)
    const heroSection = heroSections.find(section => section.tagName === 'SECTION');
    expect(heroSection).toHaveClass('py-16');
  });

  it('should be accessible with proper ARIA labels', () => {
    render(<ConstructionHomepage {...mockProps} />);
    
    expect(screen.getAllByRole('banner').length).toBeGreaterThan(0);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});