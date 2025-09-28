/**
 * T015: Course Selection Journey - Integration Test
 * 
 * Tests the complete workflow of a new user selecting and enrolling in a course.
 * This test validates:
 * - Course discovery and browsing
 * - Course details viewing
 * - Authentication flow
 * - Enrollment process
 * - Dashboard redirection
 * 
 * NOTE: This test will FAIL initially (TDD approach) until components are implemented.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import CourseSelection from '@/components/academia/course-selection'
import CourseDashboard from '@/components/academia/course-dashboard'

// Mock dependencies
jest.mock('next/navigation')
jest.mock('@supabase/auth-helpers-nextjs')

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
}

const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
      order: jest.fn(() => ({
        data: [],
        error: null,
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  })),
  rpc: jest.fn(),
}

const mockCourses = [
  {
    id: 'eoi-english-b2',
    name: 'English B2',
    description: 'Intermediate English course for EOI certification',
    language: 'english',
    level: 'b2',
    provider: 'eoi',
    total_questions: 120,
    exam_duration: 180,
    passing_score: 70,
    is_active: true,
    created_at: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'jqcv-valenciano-c1',
    name: 'Valenciano C1',
    description: 'Advanced Valenciano course for JQCV certification',
    language: 'valenciano',
    level: 'c1',
    provider: 'jqcv',
    total_questions: 100,
    exam_duration: 150,
    passing_score: 75,
    is_active: true,
    created_at: '2024-01-01T00:00:00.000Z'
  }
]

describe('T015: Course Selection Journey', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  it('should complete the full course selection and enrollment journey', async () => {
    // Mock unauthenticated user initially
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    // Mock courses data
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockCourses,
            error: null
          })
        })
      })
    })

    // Render course selection component
    render(<CourseSelection />)

    // Step 1: Verify course listing is displayed
    await waitFor(() => {
      expect(screen.getByText('Available Courses')).toBeInTheDocument()
    })

    expect(screen.getByText('English B2')).toBeInTheDocument()
    expect(screen.getByText('Valenciano C1')).toBeInTheDocument()

    // Step 2: User clicks on English B2 course
    const englishCourse = screen.getByTestId('course-card-eoi-english-b2')
    fireEvent.click(englishCourse)

    // Step 3: Course details modal/page should open
    await waitFor(() => {
      expect(screen.getByText('Course Details')).toBeInTheDocument()
    })

    expect(screen.getByText('120 questions')).toBeInTheDocument()
    expect(screen.getByText('180 minutes')).toBeInTheDocument()
    expect(screen.getByText('70% passing score')).toBeInTheDocument()

    // Step 4: User clicks "Enroll Now" - should trigger authentication
    const enrollButton = screen.getByText('Enroll Now')
    fireEvent.click(enrollButton)

    // Step 5: Authentication modal should appear for unauthenticated user
    await waitFor(() => {
      expect(screen.getByText('Sign In to Continue')).toBeInTheDocument()
    })

    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()

    // Step 6: User fills in authentication form
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    // Mock successful authentication
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com'
        },
        session: {
          access_token: 'token-123',
          user: {
            id: 'user-123',
            email: 'test@example.com'
          }
        }
      },
      error: null
    })

    // Step 7: Submit authentication form
    const signInButton = screen.getByText('Sign In')
    fireEvent.click(signInButton)

    // Step 8: After authentication, enrollment should proceed
    await waitFor(() => {
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    // Mock enrollment insertion
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'course_enrollments') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'enrollment-123',
                  user_id: 'user-123',
                  course_id: 'eoi-english-b2',
                  enrolled_at: new Date().toISOString(),
                  status: 'active'
                },
                error: null
              })
            })
          })
        }
      }
      return mockSupabase.from()
    })

    // Step 9: Verify enrollment success and redirect to dashboard
    await waitFor(() => {
      expect(screen.getByText('Enrollment Successful!')).toBeInTheDocument()
    })

    // Step 10: Verify navigation to course dashboard
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/english/b2')
    })
  })

  it('should handle course selection with existing authenticated user', async () => {
    // Mock authenticated user
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'token-123',
          user: {
            id: 'user-123',
            email: 'test@example.com'
          }
        }
      },
      error: null
    })

    // Mock courses data
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockCourses,
            error: null
          })
        })
      })
    })

    render(<CourseSelection />)

    // Verify course listing
    await waitFor(() => {
      expect(screen.getByText('Available Courses')).toBeInTheDocument()
    })

    // Select Valenciano course
    const valencianoCard = screen.getByTestId('course-card-jqcv-valenciano-c1')
    fireEvent.click(valencianoCard)

    // Course details should appear
    await waitFor(() => {
      expect(screen.getByText('Course Details')).toBeInTheDocument()
    })

    // Mock enrollment for authenticated user
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'course_enrollments') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'enrollment-456',
                  user_id: 'user-123',
                  course_id: 'jqcv-valenciano-c1',
                  enrolled_at: new Date().toISOString(),
                  status: 'active'
                },
                error: null
              })
            })
          })
        }
      }
      return mockSupabase.from()
    })

    // Click enroll - should skip authentication
    const enrollButton = screen.getByText('Enroll Now')
    fireEvent.click(enrollButton)

    // Should directly proceed to enrollment
    await waitFor(() => {
      expect(screen.getByText('Enrollment Successful!')).toBeInTheDocument()
    })

    // Verify navigation
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/valenciano/c1')
  })

  it('should handle course selection errors gracefully', async () => {
    // Mock course loading error
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Failed to load courses' }
          })
        })
      })
    })

    render(<CourseSelection />)

    // Should display error state
    await waitFor(() => {
      expect(screen.getByText('Failed to load courses')).toBeInTheDocument()
    })

    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })

  it('should handle enrollment errors', async () => {
    // Mock authenticated user
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'token-123',
          user: { id: 'user-123', email: 'test@example.com' }
        }
      },
      error: null
    })

    // Mock courses data
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockCourses,
            error: null
          })
        })
      })
    })

    render(<CourseSelection />)

    await waitFor(() => {
      expect(screen.getByText('Available Courses')).toBeInTheDocument()
    })

    // Select course
    const courseCard = screen.getByTestId('course-card-eoi-english-b2')
    fireEvent.click(courseCard)

    // Mock enrollment error
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'course_enrollments') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Already enrolled in this course' }
              })
            })
          })
        }
      }
      return mockSupabase.from()
    })

    // Try to enroll
    const enrollButton = screen.getByText('Enroll Now')
    fireEvent.click(enrollButton)

    // Should display error
    await waitFor(() => {
      expect(screen.getByText('Already enrolled in this course')).toBeInTheDocument()
    })
  })

  it('should handle authentication failures', async () => {
    // Mock unauthenticated user
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockCourses,
            error: null
          })
        })
      })
    })

    render(<CourseSelection />)

    await waitFor(() => {
      expect(screen.getByText('Available Courses')).toBeInTheDocument()
    })

    // Select course and trigger auth
    const courseCard = screen.getByTestId('course-card-eoi-english-b2')
    fireEvent.click(courseCard)

    const enrollButton = screen.getByText('Enroll Now')
    fireEvent.click(enrollButton)

    // Fill auth form
    await waitFor(() => {
      expect(screen.getByText('Sign In to Continue')).toBeInTheDocument()
    })

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    
    fireEvent.change(emailInput, { target: { value: 'invalid@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })

    // Mock auth failure
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' }
    })

    // Submit form
    const signInButton = screen.getByText('Sign In')
    fireEvent.click(signInButton)

    // Should display auth error
    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument()
    })

    // Should not proceed with enrollment
    expect(mockRouter.push).not.toHaveBeenCalled()
  })
})