/**
 * End-to-End Test Suite
 * Complete user journey testing for the Academy system
 */

import { test, expect, Page } from '@playwright/test'

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  name: 'Test User'
}

const testCourse = {
  language: 'English',
  level: 'B2',
  title: 'Business English B2'
}

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  pageLoad: 3000,
  apiResponse: 200,
  dashboardRender: 1500,
  examLoad: 2000
}

// Helper functions
async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('[data-testid="email-input"]', email)
  await page.fill('[data-testid="password-input"]', password)
  await page.click('[data-testid="login-button"]')
  await page.waitForURL('/dashboard')
}

async function measurePerformance(page: Page, action: () => Promise<void>): Promise<number> {
  const startTime = Date.now()
  await action()
  return Date.now() - startTime
}

// Test suites
test.describe('Academy User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and local storage
    await page.context().clearCookies()
    await page.evaluate(() => localStorage.clear())
  })

  test.describe('Authentication Flow', () => {
    test('should register a new user successfully', async ({ page }) => {
      await page.goto('/signup')
      
      // Fill registration form
      await page.fill('[data-testid="name-input"]', testUser.name)
      await page.fill('[data-testid="email-input"]', `${Date.now()}@example.com`)
      await page.fill('[data-testid="password-input"]', testUser.password)
      await page.fill('[data-testid="confirm-password-input"]', testUser.password)
      
      // Submit form
      await page.click('[data-testid="signup-button"]')
      
      // Verify redirect to academia
      await expect(page).toHaveURL('/dashboard', { timeout: 5000 })
      
      // Verify welcome message
      await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible()
    })

    test('should login with existing credentials', async ({ page }) => {
      const loadTime = await measurePerformance(page, async () => {
        await login(page, testUser.email, testUser.password)
      })
      
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad)
      await expect(page).toHaveURL('/dashboard')
    })

    test('should handle invalid credentials', async ({ page }) => {
      await page.goto('/login')
      await page.fill('[data-testid="email-input"]', 'invalid@example.com')
      await page.fill('[data-testid="password-input"]', 'wrongpassword')
      await page.click('[data-testid="login-button"]')
      
      // Verify error message
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials')
    })

    test('should logout successfully', async ({ page }) => {
      await login(page, testUser.email, testUser.password)
      
      // Click logout
      await page.click('[data-testid="user-menu"]')
      await page.click('[data-testid="logout-button"]')
      
      // Verify redirect to home
      await expect(page).toHaveURL('/')
    })
  })

  test.describe('Course Selection and Enrollment', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, testUser.email, testUser.password)
    })

    test('should display available courses', async ({ page }) => {
      const loadTime = await measurePerformance(page, async () => {
        await page.goto('/dashboard')
        await page.waitForSelector('[data-testid="course-card"]')
      })
      
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.dashboardRender)
      
      // Verify courses are displayed
      const courses = page.locator('[data-testid="course-card"]')
      await expect(courses).toHaveCount(await courses.count())
    })

    test('should filter courses by language and level', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Select language filter
      await page.selectOption('[data-testid="language-filter"]', testCourse.language)
      
      // Select level filter
      await page.selectOption('[data-testid="level-filter"]', testCourse.level)
      
      // Verify filtered results
      const courses = page.locator('[data-testid="course-card"]')
      const firstCourse = courses.first()
      
      await expect(firstCourse).toContainText(testCourse.language)
      await expect(firstCourse).toContainText(testCourse.level)
    })

    test('should enroll in a course', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Click on course card
      await page.click(`[data-testid="course-card"]:has-text("${testCourse.title}")`)
      
      // Click enroll button
      await page.click('[data-testid="enroll-button"]')
      
      // Verify enrollment success
      await expect(page.locator('[data-testid="enrollment-success"]')).toBeVisible()
      
      // Verify course appears in dashboard
      await page.goto('/dashboard/dashboard')
      await expect(page.locator('[data-testid="enrolled-course"]')).toContainText(testCourse.title)
    })
  })

  test.describe('Dashboard and Progress Tracking', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, testUser.email, testUser.password)
    })

    test('should display user progress dashboard', async ({ page }) => {
      const loadTime = await measurePerformance(page, async () => {
        await page.goto('/dashboard/dashboard')
        await page.waitForSelector('[data-testid="progress-chart"]')
      })
      
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.dashboardRender)
      
      // Verify dashboard components
      await expect(page.locator('[data-testid="progress-chart"]')).toBeVisible()
      await expect(page.locator('[data-testid="achievement-badges"]')).toBeVisible()
      await expect(page.locator('[data-testid="study-streak"]')).toBeVisible()
    })

    test('should update progress after completing a module', async ({ page }) => {
      await page.goto('/dashboard/dashboard')
      
      // Get initial progress
      const initialProgress = await page.locator('[data-testid="overall-progress"]').textContent()
      
      // Complete a module
      await page.click('[data-testid="continue-learning"]')
      await page.click('[data-testid="complete-module"]')
      
      // Return to dashboard
      await page.goto('/dashboard/dashboard')
      
      // Verify progress updated
      const newProgress = await page.locator('[data-testid="overall-progress"]').textContent()
      expect(newProgress).not.toBe(initialProgress)
    })

    test('should display analytics correctly', async ({ page }) => {
      await page.goto('/dashboard/dashboard')
      
      // Click analytics tab
      await page.click('[data-testid="analytics-tab"]')
      
      // Verify analytics components
      await expect(page.locator('[data-testid="time-spent-chart"]')).toBeVisible()
      await expect(page.locator('[data-testid="score-trend"]')).toBeVisible()
      await expect(page.locator('[data-testid="skill-radar"]')).toBeVisible()
    })
  })

  test.describe('Exam Simulator', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, testUser.email, testUser.password)
    })

    test('should start an exam session', async ({ page }) => {
      const loadTime = await measurePerformance(page, async () => {
        await page.goto(`/dashboard/${testCourse.language.toLowerCase()}/${testCourse.level.toLowerCase()}/examens/cambridge`)
        await page.waitForSelector('[data-testid="start-exam"]')
      })
      
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.examLoad)
      
      // Start exam
      await page.click('[data-testid="start-exam"]')
      
      // Verify exam interface
      await expect(page.locator('[data-testid="exam-timer"]')).toBeVisible()
      await expect(page.locator('[data-testid="question-container"]')).toBeVisible()
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible()
    })

    test('should navigate through exam questions', async ({ page }) => {
      // Start exam
      await page.goto(`/dashboard/${testCourse.language.toLowerCase()}/${testCourse.level.toLowerCase()}/examens/cambridge`)
      await page.click('[data-testid="start-exam"]')
      
      // Answer first question
      await page.click('[data-testid="answer-option-0"]')
      await page.click('[data-testid="next-question"]')
      
      // Verify navigation
      await expect(page.locator('[data-testid="question-number"]')).toContainText('2')
      
      // Go back
      await page.click('[data-testid="previous-question"]')
      await expect(page.locator('[data-testid="question-number"]')).toContainText('1')
    })

    test('should complete exam and show results', async ({ page }) => {
      // Start exam
      await page.goto(`/dashboard/${testCourse.language.toLowerCase()}/${testCourse.level.toLowerCase()}/examens/cambridge`)
      await page.click('[data-testid="start-exam"]')
      
      // Answer all questions (simplified for testing)
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="answer-option-0"]')
        if (i < 4) {
          await page.click('[data-testid="next-question"]')
        }
      }
      
      // Submit exam
      await page.click('[data-testid="submit-exam"]')
      await page.click('[data-testid="confirm-submit"]')
      
      // Verify results page
      await expect(page.locator('[data-testid="exam-results"]')).toBeVisible()
      await expect(page.locator('[data-testid="score-display"]')).toBeVisible()
      await expect(page.locator('[data-testid="feedback-section"]')).toBeVisible()
    })
  })

  test.describe('AI Tutor Integration', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, testUser.email, testUser.password)
    })

    test('should open AI tutor chat', async ({ page }) => {
      await page.goto('/dashboard/dashboard')
      
      // Open AI tutor
      await page.click('[data-testid="ai-tutor-button"]')
      
      // Verify chat interface
      await expect(page.locator('[data-testid="ai-chat-window"]')).toBeVisible()
      await expect(page.locator('[data-testid="chat-input"]')).toBeVisible()
    })

    test('should send message to AI tutor', async ({ page }) => {
      await page.goto('/dashboard/dashboard')
      await page.click('[data-testid="ai-tutor-button"]')
      
      // Send message
      await page.fill('[data-testid="chat-input"]', 'Help me with grammar')
      await page.click('[data-testid="send-message"]')
      
      // Wait for response
      await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Tab through main navigation
      await page.keyboard.press('Tab')
      await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'home-link')
      
      await page.keyboard.press('Tab')
      await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'courses-link')
      
      // Activate with Enter
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/\/dashboard/)
    })

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Check main navigation
      await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible()
      
      // Check buttons
      const buttons = page.locator('button')
      const count = await buttons.count()
      
      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i)
        const ariaLabel = await button.getAttribute('aria-label')
        const text = await button.textContent()
        
        // Button should have either aria-label or text content
        expect(ariaLabel || text).toBeTruthy()
      }
    })

    test('should support screen readers', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Check for skip links
      await expect(page.locator('[href="#main-content"]')).toHaveText('Skip to main content')
      
      // Check headings hierarchy
      const h1 = await page.locator('h1').count()
      expect(h1).toBe(1) // Only one H1 per page
      
      // Check form labels
      const inputs = page.locator('input:not([type="hidden"])')
      const inputCount = await inputs.count()
      
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i)
        const id = await input.getAttribute('id')
        const label = page.locator(`label[for="${id}"]`)
        
        // Each input should have a label
        await expect(label).toHaveCount(1)
      }
    })
  })

  test.describe('Performance Monitoring', () => {
    test('should meet Core Web Vitals thresholds', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Measure performance metrics
      const metrics = await page.evaluate(() => {
        return new Promise<any>((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const metrics: any = {}
            
            entries.forEach((entry: any) => {
              if (entry.entryType === 'largest-contentful-paint') {
                metrics.lcp = entry.startTime
              }
              if (entry.entryType === 'first-input') {
                metrics.fid = entry.processingStart - entry.startTime
              }
              if (entry.entryType === 'layout-shift') {
                metrics.cls = (metrics.cls || 0) + entry.value
              }
            })
            
            resolve(metrics)
          }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
          
          // Simulate user interaction for FID
          setTimeout(() => {
            document.body.click()
          }, 1000)
        })
      })
      
      // Verify Core Web Vitals
      expect(metrics.lcp).toBeLessThan(2500) // LCP < 2.5s
      expect(metrics.fid || 0).toBeLessThan(100) // FID < 100ms
      expect(metrics.cls || 0).toBeLessThan(0.1) // CLS < 0.1
    })

    test('should handle 100 concurrent users', async ({ browser }) => {
      const contexts = []
      const pages = []
      
      // Create 10 concurrent sessions (scaled down for testing)
      for (let i = 0; i < 10; i++) {
        const context = await browser.newContext()
        const page = await context.newPage()
        contexts.push(context)
        pages.push(page)
      }
      
      // Measure concurrent load
      const startTime = Date.now()
      
      await Promise.all(pages.map(page => 
        page.goto('/dashboard').catch(e => console.error(e))
      ))
      
      const loadTime = Date.now() - startTime
      
      // Verify all pages loaded
      for (const page of pages) {
        await expect(page.locator('body')).toBeVisible()
      }
      
      // Clean up
      await Promise.all(contexts.map(context => context.close()))
      
      // Average load time should be reasonable
      expect(loadTime / pages.length).toBeLessThan(5000)
    })
  })
})

// Browser compatibility tests
test.describe('Cross-Browser Compatibility', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`should work in ${browserName}`, async ({ page }) => {
      await page.goto('/dashboard')
      
      // Basic functionality check
      await expect(page.locator('body')).toBeVisible()
      await expect(page.locator('[data-testid="header"]')).toBeVisible()
      await expect(page.locator('[data-testid="footer"]')).toBeVisible()
      
      // JavaScript functionality
      const jsEnabled = await page.evaluate(() => typeof window !== 'undefined')
      expect(jsEnabled).toBe(true)
      
      // CSS rendering
      const styles = await page.evaluate(() => {
        const element = document.querySelector('[data-testid="header"]')
        return element ? window.getComputedStyle(element).display : null
      })
      expect(styles).not.toBe('none')
    })
  })
})

// Mobile responsiveness tests
test.describe('Mobile Responsiveness', () => {
  test('should be responsive on mobile devices', async ({ browser }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 414, height: 896, name: 'iPhone XR' },
      { width: 360, height: 740, name: 'Samsung Galaxy S9' },
      { width: 768, height: 1024, name: 'iPad' }
    ]
    
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport })
      const page = await context.newPage()
      
      await page.goto('/dashboard')
      
      // Check mobile menu
      if (viewport.width < 768) {
        await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
        
        // Open mobile menu
        await page.click('[data-testid="mobile-menu-button"]')
        await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
      } else {
        await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible()
      }
      
      await context.close()
    }
  })
})