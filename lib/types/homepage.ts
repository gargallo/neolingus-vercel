// TypeScript interfaces for construction homepage components
export interface HeroSection {
  title: string;
  subtitle: string;
  ctaButtons: CTAButton[];
  backgroundImage?: string;
  showVideo?: boolean;
}

export interface CTAButton {
  text: string;
  href: string;
  variant: 'primary' | 'secondary' | 'outline';
  icon?: string;
}

export interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  link: string;
  badge?: string;
}

export interface TestimonialCard {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  avatar?: string;
  rating: number;
}

export interface StatsCard {
  label: string;
  value: string;
  icon: string;
  description?: string;
}

export interface AuthButtons {
  loginText: string;
  signupText: string;
  loginHref: string;
  signupHref: string;
}

export interface ConstructionHomepageProps {
  hero: HeroSection;
  features: FeatureCard[];
  testimonials: TestimonialCard[];
  stats: StatsCard[];
  authButtons: AuthButtons;
  showDemoMode?: boolean;
}

export interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
}

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export interface SocialLink {
  platform: string;
  href: string;
  icon: string;
}