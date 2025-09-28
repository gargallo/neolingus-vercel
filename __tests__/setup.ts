import { vi } from 'vitest';
import '@testing-library/jest-dom';
import React from 'react';

// Add vi to global scope for test helpers
global.vi = vi;

// Mock fetch globally
global.fetch = vi.fn();

// Mock Next.js components
vi.mock('next/link', () => {
  return {
    default: ({ children, href, ...props }: any) => React.createElement('a', { href, ...props }, children)
  };
});

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';

// Mock the AI services
vi.mock('@/lib/ai-agents/services/ai-tutor-service', () => ({
  AITutorService: vi.fn().mockImplementation(() => ({
    createSession: vi.fn(),
    sendMessage: vi.fn(),
    endSession: vi.fn(),
    getConversationHistory: vi.fn(),
  })),
}));

// Mock the Anthropic client
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ text: 'Test AI response' }],
        role: 'assistant',
      }),
    },
  })),
  Anthropic: vi.fn(),
}));