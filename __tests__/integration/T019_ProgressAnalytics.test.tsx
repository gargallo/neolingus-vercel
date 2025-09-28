/**
 * T019: Progress Analytics - Integration Test
 * 
 * Tests comprehensive progress analytics and insights workflow.
 * This test validates:
 * - Learning analytics data visualization
 * - Performance trend analysis
 * - Comparative benchmarking
 * - Skill development tracking
 * - Predictive learning recommendations
 * - Interactive data exploration
 * - Export and sharing capabilities
 * 
 * NOTE: This test will FAIL initially (TDD approach) until components are implemented.
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import ProgressAnalytics from '@/components/academia/progress-analytics'

// Mock dependencies
jest.mock('next/navigation')
jest.mock('@supabase/auth-helpers-nextjs')

// Mock chart libraries
jest.mock('recharts', () => ({
  LineChart: ({ children, ...props }: any) => <div data-testid="line-chart" {...props}>{children}</div>,
  BarChart: ({ children, ...props }: any) => <div data-testid="bar-chart" {...props}>{children}</div>,
  RadarChart: ({ children, ...props }: any) => <div data-testid="radar-chart" {...props}>{children}</div>,
  PieChart: ({ children, ...props }: any) => <div data-testid="pie-chart" {...props}>{children}</div>,
  Line: ({ dataKey, ...props }: any) => <div data-testid="chart-line" data-key={dataKey} {...props} />,
  Bar: ({ dataKey, ...props }: any) => <div data-testid="chart-bar" data-key={dataKey} {...props} />,
  XAxis: (props: any) => <div data-testid="x-axis" {...props} />,
  YAxis: (props: any) => <div data-testid="y-axis" {...props} />,
  CartesianGrid: (props: any) => <div data-testid="grid" {...props} />,
  Tooltip: (props: any) => <div data-testid="tooltip" {...props} />,
  Legend: (props: any) => <div data-testid="legend" {...props} />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}))

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
}

const mockSupabase = {
  auth: {
    getSession: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            order: jest.fn(() => ({
              data: [],
              error: null,
            })),
          })),
        })),
        order: jest.fn(() => ({
          data: [],
          error: null,
        })),
        single: jest.fn(),
      })),
      in: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    })),
  })),
  rpc: jest.fn(),
}

const mockUserSession = {
  access_token: 'token-123',
  user: {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: {
      name: 'Test User'
    }
  }
}

const mockProgressData = {
  overall_progress: {
    completion_percentage: 73,
    lessons_completed: 22,
    total_lessons: 30,
    hours_studied: 45.5,
    current_streak: 12,
    longest_streak: 18,
    certificates_earned: 2
  },
  skill_breakdown: [
    { skill: 'Reading', level: 85, improvement: +5 },
    { skill: 'Writing', level: 78, improvement: +3 },
    { skill: 'Listening', level: 67, improvement: -2 },
    { skill: 'Speaking', level: 71, improvement: +7 },
    { skill: 'Grammar', level: 82, improvement: +4 },
    { skill: 'Vocabulary', level: 89, improvement: +6 }
  ],
  performance_trends: [
    { date: '2024-01-01', score: 65, session_count: 2, study_time: 90 },
    { date: '2024-01-02', score: 68, session_count: 1, study_time: 45 },
    { date: '2024-01-03', score: 72, session_count: 3, study_time: 120 },
    { date: '2024-01-04', score: 69, session_count: 2, study_time: 75 },
    { date: '2024-01-05', score: 75, session_count: 2, study_time: 90 },
    { date: '2024-01-06', score: 78, session_count: 4, study_time: 150 },
    { date: '2024-01-07', score: 81, session_count: 3, study_time: 105 }
  ]
}

const mockBenchmarkData = {
  peer_comparison: {
    user_percentile: 78,
    average_score: 71,
    user_score: 78,
    peer_group: 'B2 English Learners',
    total_peers: 1247
  },
  skill_comparison: [
    { skill: 'Reading', user: 85, peer_avg: 79, percentile: 82 },
    { skill: 'Writing', user: 78, peer_avg: 74, percentile: 71 },
    { skill: 'Listening', user: 67, peer_avg: 72, percentile: 34 },
    { skill: 'Speaking', user: 71, peer_avg: 69, percentile: 58 },
    { skill: 'Grammar', user: 82, peer_avg: 76, percentile: 75 },
    { skill: 'Vocabulary', user: 89, peer_avg: 80, percentile: 91 }
  ],
  regional_ranking: {
    position: 94,
    total: 312,
    region: 'Valencia, Spain'
  }
}

const mockLearningInsights = {
  study_patterns: {
    best_time: '18:00-20:00',
    most_productive_day: 'Tuesday',
    average_session_length: 42,
    preferred_content_type: 'Interactive Exercises',
    attention_span_trend: 'Increasing'
  },
  recommendations: [
    {
      id: 'rec-1',
      type: 'skill_focus',
      priority: 'high',
      title: 'Focus on Listening Skills',
      description: 'Your listening scores are below peer average. Spend 15 minutes daily on audio exercises.',
      action: 'Start Daily Listening Challenge',
      estimated_improvement: '+8 points in 2 weeks'
    },
    {
      id: 'rec-2',
      type: 'study_schedule',
      priority: 'medium',
      title: 'Optimize Study Schedule',
      description: 'You perform best in the evening. Schedule complex topics between 6-8 PM.',
      action: 'Update Study Calendar',
      estimated_improvement: '+12% efficiency'
    },
    {
      id: 'rec-3',
      type: 'content_variation',
      priority: 'low',
      title: 'Mix Content Types',
      description: 'Try adding video content to improve engagement and retention.',
      action: 'Explore Video Lessons',
      estimated_improvement: '+5% retention'
    }
  ],
  predicted_milestones: [
    { milestone: 'B2 Certification Ready', date: '2024-03-15', confidence: 0.87 },
    { milestone: 'Listening Proficiency', date: '2024-02-28', confidence: 0.73 },
    { milestone: 'Speaking Confidence', date: '2024-04-01', confidence: 0.65 }
  ]
}

const mockGoalsData = [
  {
    id: 'goal-1',
    title: 'Pass B2 Exam',
    target_score: 80,
    current_score: 78,
    deadline: '2024-03-01',
    progress: 97.5,
    status: 'on_track'
  },
  {
    id: 'goal-2',
    title: 'Improve Listening',
    target_score: 75,
    current_score: 67,
    deadline: '2024-02-15',
    progress: 67,
    status: 'behind'
  },
  {
    id: 'goal-3',
    title: 'Daily Study Streak',
    target_value: 30,
    current_value: 12,
    deadline: '2024-01-31',
    progress: 40,
    status: 'at_risk'
  }
]

describe('T019: Progress Analytics and Insights', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  it('should display comprehensive learning analytics dashboard', async () => {
    // Mock authenticated user
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockUserSession },
      error: null
    })

    // Mock analytics data
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'user_progress') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockProgressData.overall_progress,
              error: null
            })
          })
        }
      }
      if (table === 'skill_assessments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockProgressData.skill_breakdown,
                error: null
              })
            })
          })
        }
      }
      if (table === 'exam_sessions') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                lte: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: mockProgressData.performance_trends,
                    error: null
                  })
                })
              })
            })
          })
        }
      }
      return mockSupabase.from()
    })

    render(<ProgressAnalytics courseId="eoi-english-b2" />)

    // Loading state
    expect(screen.getByText('Loading analytics...')).toBeInTheDocument()

    // Main dashboard should load
    await waitFor(() => {
      expect(screen.getByText('Learning Analytics')).toBeInTheDocument()
    })

    // Overall progress cards
    expect(screen.getByText('73%')).toBeInTheDocument()
    expect(screen.getByText('Complete')).toBeInTheDocument()
    expect(screen.getByText('22/30 Lessons')).toBeInTheDocument()
    expect(screen.getByText('45.5 hours studied')).toBeInTheDocument()
    expect(screen.getByText('12 day streak')).toBeInTheDocument()

    // Skill breakdown should be displayed
    expect(screen.getByText('Skill Performance')).toBeInTheDocument()
    expect(screen.getByText('Reading: 85%')).toBeInTheDocument()
    expect(screen.getByText('Vocabulary: 89%')).toBeInTheDocument()
    expect(screen.getByText('Listening: 67%')).toBeInTheDocument()

    // Performance trend chart
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    expect(screen.getByText('Performance Trends')).toBeInTheDocument()

    // Skill radar chart
    expect(screen.getByTestId('radar-chart')).toBeInTheDocument()

    // Study time distribution
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    expect(screen.getByText('Study Time Distribution')).toBeInTheDocument()
  })

  it('should provide interactive data exploration and filtering', async () => {
    // Setup analytics data
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockUserSession },
      error: null
    })

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'exam_sessions') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                lte: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: mockProgressData.performance_trends,
                    error: null
                  })
                })
              })
            })
          })
        }
      }
      return mockSupabase.from()
    })

    render(<ProgressAnalytics courseId="eoi-english-b2" />)

    await waitFor(() => {
      expect(screen.getByText('Learning Analytics')).toBeInTheDocument()
    })

    // Test time period filters
    const timeFilters = screen.getByText('Time Period')
    fireEvent.click(timeFilters)

    expect(screen.getByText('Last 7 days')).toBeInTheDocument()
    expect(screen.getByText('Last 30 days')).toBeInTheDocument()
    expect(screen.getByText('Last 90 days')).toBeInTheDocument()
    expect(screen.getByText('All time')).toBeInTheDocument()

    // Change to 30 days
    const thirtyDaysFilter = screen.getByText('Last 30 days')
    fireEvent.click(thirtyDaysFilter)

    // Should update charts with new data
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('exam_sessions')
    })

    // Test skill filter
    const skillFilter = screen.getByText('All Skills')
    fireEvent.click(skillFilter)

    expect(screen.getByText('Reading')).toBeInTheDocument()
    expect(screen.getByText('Listening')).toBeInTheDocument()
    expect(screen.getByText('Speaking')).toBeInTheDocument()

    // Filter by Listening
    const listeningFilter = screen.getByText('Listening')
    fireEvent.click(listeningFilter)

    // Should update charts to show only listening data
    await waitFor(() => {
      expect(screen.getByText('Listening Performance Trends')).toBeInTheDocument()
    })

    // Test chart interaction
    const chartPoint = screen.getByTestId('line-chart')
    fireEvent.click(chartPoint)

    // Should show detailed tooltip
    expect(screen.getByText('January 6, 2024')).toBeInTheDocument()
    expect(screen.getByText('Score: 78')).toBeInTheDocument()
    expect(screen.getByText('Study Time: 150 min')).toBeInTheDocument()

    // Test data export
    const exportButton = screen.getByText('📊 Export Data')
    fireEvent.click(exportButton)

    expect(screen.getByText('Export Options')).toBeInTheDocument()
    expect(screen.getByText('CSV Format')).toBeInTheDocument()
    expect(screen.getByText('PDF Report')).toBeInTheDocument()
    expect(screen.getByText('Excel Workbook')).toBeInTheDocument()
  })

  it('should display comparative benchmarking against peers', async () => {
    // Setup user and benchmark data
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockUserSession },
      error: null
    })

    // Mock benchmark RPC call
    mockSupabase.rpc.mockImplementation((fn) => {
      if (fn === 'get_peer_benchmarks') {
        return Promise.resolve({
          data: mockBenchmarkData,
          error: null
        })
      }
      return Promise.resolve({ data: null, error: null })
    })

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: mockProgressData.overall_progress,
          error: null
        })
      })
    })

    render(<ProgressAnalytics courseId="eoi-english-b2" showBenchmarks={true} />)

    await waitFor(() => {
      expect(screen.getByText('Learning Analytics')).toBeInTheDocument()
    })

    // Should display benchmark section
    expect(screen.getByText('Peer Comparison')).toBeInTheDocument()
    
    // Overall ranking
    expect(screen.getByText('78th Percentile')).toBeInTheDocument()
    expect(screen.getByText('Better than 978 of 1,247 peers')).toBeInTheDocument()

    // Skill comparison chart
    expect(screen.getByText('Skill vs. Peer Average')).toBeInTheDocument()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()

    // Individual skill comparisons
    expect(screen.getByText('Reading: +6 above average')).toBeInTheDocument()
    expect(screen.getByText('Vocabulary: +9 above average')).toBeInTheDocument()
    expect(screen.getByText('Listening: -5 below average')).toBeInTheDocument()

    // Regional ranking
    expect(screen.getByText('Regional Ranking')).toBeInTheDocument()
    expect(screen.getByText('#94 of 312')).toBeInTheDocument()
    expect(screen.getByText('Valencia, Spain')).toBeInTheDocument()

    // Benchmark achievements
    expect(screen.getByText('Top 25% in Vocabulary')).toBeInTheDocument()
    expect(screen.getByText('Above Average in 4/6 Skills')).toBeInTheDocument()

    // Interactive peer group selection
    const peerGroupSelect = screen.getByText('B2 English Learners')
    fireEvent.click(peerGroupSelect)

    expect(screen.getByText('All B2 Students')).toBeInTheDocument()
    expect(screen.getByText('Same Country')).toBeInTheDocument()
    expect(screen.getByText('Similar Progress')).toBeInTheDocument()
  })

  it('should provide AI-powered learning insights and recommendations', async () => {
    // Setup user session and insights
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockUserSession },
      error: null
    })

    // Mock AI insights RPC call
    mockSupabase.rpc.mockImplementation((fn) => {
      if (fn === 'generate_learning_insights') {
        return Promise.resolve({
          data: mockLearningInsights,
          error: null
        })
      }
      return Promise.resolve({ data: null, error: null })
    })

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: mockProgressData.overall_progress,
          error: null
        })
      })
    })

    render(<ProgressAnalytics courseId="eoi-english-b2" showInsights={true} />)

    await waitFor(() => {
      expect(screen.getByText('Learning Analytics')).toBeInTheDocument()
    })

    // Should show insights section
    expect(screen.getByText('AI Insights')).toBeInTheDocument()

    // Study pattern insights
    expect(screen.getByText('Study Patterns')).toBeInTheDocument()
    expect(screen.getByText('Best study time: 6:00-8:00 PM')).toBeInTheDocument()
    expect(screen.getByText('Most productive: Tuesday')).toBeInTheDocument()
    expect(screen.getByText('Average session: 42 minutes')).toBeInTheDocument()

    // Personalized recommendations
    expect(screen.getByText('Personalized Recommendations')).toBeInTheDocument()
    
    // High priority recommendation
    const highPriorityRec = screen.getByText('Focus on Listening Skills')
    expect(highPriorityRec).toBeInTheDocument()
    expect(screen.getByText('🔴 High Priority')).toBeInTheDocument()
    expect(screen.getByText('+8 points in 2 weeks')).toBeInTheDocument()

    // Action buttons for recommendations
    expect(screen.getByText('Start Daily Listening Challenge')).toBeInTheDocument()

    // Predictive milestones
    expect(screen.getByText('Predicted Milestones')).toBeInTheDocument()
    expect(screen.getByText('B2 Certification Ready')).toBeInTheDocument()
    expect(screen.getByText('March 15, 2024')).toBeInTheDocument()
    expect(screen.getByText('87% confidence')).toBeInTheDocument()

    // Accept recommendation
    const acceptButton = screen.getByText('Start Daily Listening Challenge')
    fireEvent.click(acceptButton)

    // Should create personalized plan
    await waitFor(() => {
      expect(screen.getByText('Listening Challenge Created!')).toBeInTheDocument()
    })

    expect(screen.getByText('Added to your learning plan')).toBeInTheDocument()
    expect(screen.getByText('View Challenge')).toBeInTheDocument()

    // Dismiss recommendation
    const dismissButton = screen.getAllByText('✕')[0]
    fireEvent.click(dismissButton)

    expect(screen.queryByText('Focus on Listening Skills')).not.toBeInTheDocument()
  })

  it('should track and display learning goals progress', async () => {
    // Setup with goals data
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockUserSession },
      error: null
    })

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'learning_goals') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockGoalsData,
              error: null
            })
          })
        }
      }
      return mockSupabase.from()
    })

    render(<ProgressAnalytics courseId="eoi-english-b2" showGoals={true} />)

    await waitFor(() => {
      expect(screen.getByText('Learning Analytics')).toBeInTheDocument()
    })

    // Goals section
    expect(screen.getByText('Learning Goals')).toBeInTheDocument()

    // Goal cards with progress
    expect(screen.getByText('Pass B2 Exam')).toBeInTheDocument()
    expect(screen.getByText('97.5% complete')).toBeInTheDocument()
    expect(screen.getByText('✅ On Track')).toBeInTheDocument()

    expect(screen.getByText('Improve Listening')).toBeInTheDocument()
    expect(screen.getByText('67% complete')).toBeInTheDocument()
    expect(screen.getByText('⚠️ Behind')).toBeInTheDocument()

    expect(screen.getByText('Daily Study Streak')).toBeInTheDocument()
    expect(screen.getByText('40% complete')).toBeInTheDocument()
    expect(screen.getByText('🔴 At Risk')).toBeInTheDocument()

    // Goal progress charts
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()

    // Create new goal
    const newGoalButton = screen.getByText('+ Add Goal')
    fireEvent.click(newGoalButton)

    expect(screen.getByText('Create New Goal')).toBeInTheDocument()
    expect(screen.getByLabelText('Goal Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Target Score')).toBeInTheDocument()
    expect(screen.getByLabelText('Deadline')).toBeInTheDocument()

    // Fill goal form
    const titleInput = screen.getByLabelText('Goal Title')
    fireEvent.change(titleInput, { target: { value: 'Master Speaking Skills' } })

    const targetInput = screen.getByLabelText('Target Score')
    fireEvent.change(targetInput, { target: { value: '80' } })

    const deadlineInput = screen.getByLabelText('Deadline')
    fireEvent.change(deadlineInput, { target: { value: '2024-03-01' } })

    const createButton = screen.getByText('Create Goal')
    fireEvent.click(createButton)

    // Should add new goal
    await waitFor(() => {
      expect(screen.getByText('Goal created successfully!')).toBeInTheDocument()
    })

    // Modify existing goal
    const editButton = screen.getAllByText('✏️')[0]
    fireEvent.click(editButton)

    expect(screen.getByText('Edit Goal')).toBeInTheDocument()

    // Update deadline
    const newDeadline = screen.getByLabelText('Deadline')
    fireEvent.change(newDeadline, { target: { value: '2024-03-15' } })

    const saveButton = screen.getByText('Save Changes')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Goal updated!')).toBeInTheDocument()
    })
  })

  it('should handle data visualization errors and loading states', async () => {
    // Setup authenticated user
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockUserSession },
      error: null
    })

    // Mock data loading error
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'exam_sessions') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                lte: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Failed to load performance data' }
                  })
                })
              })
            })
          })
        }
      }
      return mockSupabase.from()
    })

    render(<ProgressAnalytics courseId="eoi-english-b2" />)

    // Should show loading state
    expect(screen.getByText('Loading analytics...')).toBeInTheDocument()

    // Should handle error state
    await waitFor(() => {
      expect(screen.getByText('Unable to load analytics data')).toBeInTheDocument()
    })

    expect(screen.getByText('Failed to load performance data')).toBeInTheDocument()
    expect(screen.getByText('Retry')).toBeInTheDocument()

    // Test retry functionality
    const retryButton = screen.getByText('Retry')
    
    // Mock successful retry
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'exam_sessions') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                lte: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: mockProgressData.performance_trends,
                    error: null
                  })
                })
              })
            })
          })
        }
      }
      return mockSupabase.from()
    })

    fireEvent.click(retryButton)

    // Should reload successfully
    await waitFor(() => {
      expect(screen.getByText('Performance Trends')).toBeInTheDocument()
    })

    // Test partial data scenarios
    expect(screen.getByText('Limited data available')).toBeInTheDocument()
    expect(screen.getByText('Complete more exercises for better insights')).toBeInTheDocument()
  })

  it('should provide responsive design and accessibility features', async () => {
    // Setup analytics data
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockUserSession },
      error: null
    })

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: mockProgressData.overall_progress,
          error: null
        })
      })
    })

    render(<ProgressAnalytics courseId="eoi-english-b2" />)

    await waitFor(() => {
      expect(screen.getByText('Learning Analytics')).toBeInTheDocument()
    })

    // Test keyboard navigation
    const chartContainer = screen.getByTestId('line-chart')
    chartContainer.focus()
    
    // Should be focusable
    expect(chartContainer).toHaveFocus()

    // Test ARIA labels
    expect(screen.getByLabelText('Performance trends chart')).toBeInTheDocument()
    expect(screen.getByLabelText('Skill breakdown chart')).toBeInTheDocument()

    // Test high contrast mode
    const themeToggle = screen.getByText('🎨')
    fireEvent.click(themeToggle)

    expect(screen.getByText('High Contrast')).toBeInTheDocument()
    fireEvent.click(screen.getByText('High Contrast'))

    // Should apply high contrast theme
    expect(document.body).toHaveClass('high-contrast')

    // Test screen reader announcements
    const liveRegion = screen.getByRole('status', { name: /analytics update/i })
    expect(liveRegion).toBeInTheDocument()

    // Test data table alternative
    const tableToggle = screen.getByText('📋 Table View')
    fireEvent.click(tableToggle)

    // Should show accessible data table
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('Date')).toBeInTheDocument()
    expect(screen.getByText('Score')).toBeInTheDocument()
    expect(screen.getByText('Study Time')).toBeInTheDocument()

    // Should be sortable
    const scoreHeader = screen.getByText('Score')
    fireEvent.click(scoreHeader)

    expect(screen.getByText('Sorted by score (descending)')).toBeInTheDocument()
  })
})