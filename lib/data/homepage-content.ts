import { ConstructionHomepageProps } from '@/lib/types/homepage';

export const constructionHomepageContent: ConstructionHomepageProps = {
  hero: {
    title: 'Build Your Future with NeoLingus',
    subtitle: 'Master languages with our construction-themed academy platform. From foundation to fluency, we\'ll help you construct the perfect learning experience.',
    ctaButtons: [
      { 
        text: 'Start Building', 
        href: '/dashboard', 
        variant: 'primary',
        icon: 'hardhat'
      },
      { 
        text: 'View Blueprints', 
        href: '/courses', 
        variant: 'outline',
        icon: 'building'
      }
    ]
  },
  features: [
    {
      id: 'structured-learning',
      title: 'Structured Learning Path',
      description: 'Build your language skills brick by brick with our carefully designed curriculum that ensures solid foundations.',
      icon: 'building',
      link: '/dashboard',
      badge: 'Core Feature'
    },
    {
      id: 'exam-preparation',
      title: 'Exam Preparation Workshop',
      description: 'Get your skills construction-ready with comprehensive exam simulation and detailed performance analytics.',
      icon: 'wrench',
      link: '/dashboard/examens',
      badge: 'Most Popular'
    },
    {
      id: 'ai-tutoring',
      title: 'AI Construction Foreman',
      description: 'Your personal AI tutor guides you through each learning phase, providing instant feedback and customized instruction.',
      icon: 'hardhat',
      link: '/dashboard/tutor'
    },
    {
      id: 'progress-tracking',
      title: 'Blueprint Progress',
      description: 'Visual progress tracking shows exactly where you are in your learning journey and what to build next.',
      icon: 'hammer',
      link: '/dashboard/progress'
    },
    {
      id: 'certification',
      title: 'Quality Certificates',
      description: 'Earn industry-recognized certifications that prove your language construction skills are built to last.',
      icon: 'award',
      link: '/dashboard/certificates'
    },
    {
      id: 'mobile-ready',
      title: 'Mobile Construction Site',
      description: 'Learn anywhere with our mobile-optimized platform. Your construction site fits in your pocket.',
      icon: 'truck',
      link: '/mobile'
    }
  ],
  testimonials: [
    {
      id: 'maria-testimonial',
      name: 'María González',
      role: 'Construction Manager',
      company: 'BuildTech Solutions',
      content: 'NeoLingus helped me build my English skills from the ground up. The construction theme made everything click for me as a professional in the industry.',
      rating: 5
    },
    {
      id: 'ahmed-testimonial',
      name: 'Ahmed Hassan',
      role: 'Civil Engineer',
      company: 'Infrastructure Corp',
      content: 'The structured approach and AI tutoring made learning Spanish feel like managing a construction project - organized, measurable, and successful.',
      rating: 5
    },
    {
      id: 'sofia-testimonial',
      name: 'Sofia Petrov',
      role: 'Project Coordinator',
      company: 'Global Construction',
      content: 'I loved how the exam preparation felt like planning a major build. Every detail was covered and I felt completely prepared for my certification.',
      rating: 5
    }
  ],
  stats: [
    {
      label: 'Active Builders',
      value: '2,500+',
      icon: 'users',
      description: 'Learning daily'
    },
    {
      label: 'Skills Constructed',
      value: '15,000+',
      icon: 'building',
      description: 'Competencies built'
    },
    {
      label: 'Certificates Earned',
      value: '850+',
      icon: 'award',
      description: 'Industry recognized'
    },
    {
      label: 'Success Rate',
      value: '94%',
      icon: 'zap',
      description: 'Exam pass rate'
    }
  ],
  authButtons: {
    loginText: 'Enter Site',
    signupText: 'Join Crew',
    loginHref: '/sign-in',
    signupHref: '/sign-up'
  },
  showDemoMode: false
};