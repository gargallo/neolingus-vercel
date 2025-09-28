import { test, expect, Page } from '@playwright/test';

test.describe('Course Dashboard User Flow', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Mock authentication and course enrollment
    await page.route('**/auth/user', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
              user_metadata: { name: 'Test User' }
            }
          }
        })
      });
    });

    // Mock course enrollment data
    await page.route('**/api/courses/valenciano/b2/enrollment', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'enrollment-1',
            course_id: 'valenciano_b2',
            subscription_tier: 'premium',
            is_active: true,
            progress: {
              completion_percentage: 65,
              exams_completed: 12,
              total_study_time: 2400
            }
          }
        })
      });
    });

    // Mock dashboard statistics
    await page.route('**/api/courses/valenciano/b2/statistics', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            total_exams: 45,
            completed_exams: 12,
            average_score: 78,
            study_streak: 7,
            total_study_time: 2400,
            recent_activity: [
              {
                id: 'activity-1',
                type: 'exam_completed',
                exam_title: 'Gramàtica Avançada',
                score: 85,
                completed_at: new Date().toISOString()
              },
              {
                id: 'activity-2',
                type: 'lesson_completed',
                lesson_title: 'Vocabulari Professional',
                completed_at: new Date(Date.now() - 86400000).toISOString()
              }
            ]
          }
        })
      });
    });

    // Mock exam providers data
    await page.route('**/api/courses/valenciano/b2/providers', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'jqcv',
              name: 'Junta Qualificadora',
              description: 'Exàmens oficials de la Junta Qualificadora',
              exam_count: 25
            },
            {
              id: 'avl',
              name: 'Acadèmia Valenciana',
              description: 'Proves de l\'Acadèmia Valenciana de la Llengua',
              exam_count: 20
            }
          ]
        })
      });
    });
  });

  test.describe('Complete User Journey', () => {
    test('should navigate to course dashboard and display new card-based layout', async () => {
      await page.goto('/dashboard/valenciano/b2');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // This should initially FAIL as the redesign isn't implemented yet
      // Verify new card-based layout structure
      await expect(page.locator('[data-testid="statistics-cards"]')).toBeVisible();
      await expect(page.locator('[data-testid="activity-timeline"]')).toBeVisible();
      await expect(page.locator('[data-testid="quick-actions"]')).toBeVisible();

      // Verify statistics cards are displayed
      const statsCards = page.locator('[data-testid="stats-card"]');
      await expect(statsCards).toHaveCount(4); // completion, exams, avg score, streak

      // Check specific statistics
      await expect(page.locator('[data-testid="completion-percentage"]')).toContainText('65%');
      await expect(page.locator('[data-testid="completed-exams"]')).toContainText('12');
      await expect(page.locator('[data-testid="average-score"]')).toContainText('78');
      await expect(page.locator('[data-testid="study-streak"]')).toContainText('7');
    });

    test('should confirm provider section is removed from main dashboard', async () => {
      await page.goto('/dashboard/valenciano/b2');
      await page.waitForLoadState('networkidle');

      // This should initially PASS as old layout likely still exists
      // Verify old provider section is NOT present
      await expect(page.locator('[data-testid="exam-providers-section"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="provider-cards"]')).not.toBeVisible();
    });

    test('should have provider selection accessible from header dropdown', async () => {
      await page.goto('/dashboard/valenciano/b2');
      await page.waitForLoadState('networkidle');

      // Check if header dropdown exists and contains provider options
      const headerDropdown = page.locator('[data-testid="provider-dropdown"]');
      await expect(headerDropdown).toBeVisible();

      await headerDropdown.click();

      // Verify providers are listed in dropdown
      await expect(page.locator('[data-testid="provider-option-jqcv"]')).toBeVisible();
      await expect(page.locator('[data-testid="provider-option-avl"]')).toBeVisible();

      // Test navigation to provider
      await page.locator('[data-testid="provider-option-jqcv"]').click();
      await expect(page).toHaveURL('/dashboard/valenciano/b2/examens/jqcv');
    });
  });

  test.describe('Dashboard Interaction Flow', () => {
    test('should display and interact with activity timeline', async () => {
      await page.goto('/dashboard/valenciano/b2');
      await page.waitForLoadState('networkidle');

      // This should initially FAIL as the timeline isn't implemented yet
      const timeline = page.locator('[data-testid="activity-timeline"]');
      await expect(timeline).toBeVisible();

      // Check timeline items
      const timelineItems = page.locator('[data-testid="timeline-item"]');
      await expect(timelineItems).toHaveCount(2);

      // Verify recent activities are displayed
      await expect(timelineItems.first()).toContainText('Gramàtica Avançada');
      await expect(timelineItems.first()).toContainText('85');

      // Test timeline item interaction
      await timelineItems.first().click();
      // Should show activity details modal or navigate to activity
      await expect(page.locator('[data-testid="activity-details"]')).toBeVisible();
    });

    test('should provide quick action buttons to start exams', async () => {
      await page.goto('/dashboard/valenciano/b2');
      await page.waitForLoadState('networkidle');

      // This should initially FAIL as quick actions aren't implemented yet
      const quickActions = page.locator('[data-testid="quick-actions"]');
      await expect(quickActions).toBeVisible();

      // Check for action buttons
      await expect(page.locator('[data-testid="start-practice-exam"]')).toBeVisible();
      await expect(page.locator('[data-testid="continue-study"]')).toBeVisible();
      await expect(page.locator('[data-testid="view-progress"]')).toBeVisible();

      // Test quick action functionality
      await page.locator('[data-testid="start-practice-exam"]').click();

      // Should navigate to exam selection or start exam directly
      await expect(page.locator('[data-testid="exam-selection-modal"]')).toBeVisible();
    });

    test('should update statistics when new activities are added', async () => {
      await page.goto('/dashboard/valenciano/b2');
      await page.waitForLoadState('networkidle');

      // Simulate completing a new exam (this would normally trigger real-time updates)
      await page.route('**/api/courses/valenciano/b2/statistics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              total_exams: 45,
              completed_exams: 13, // Updated count
              average_score: 79,   // Updated average
              study_streak: 8,     // Updated streak
              total_study_time: 2500,
              recent_activity: [
                {
                  id: 'activity-new',
                  type: 'exam_completed',
                  exam_title: 'Nova Prova',
                  score: 90,
                  completed_at: new Date().toISOString()
                }
              ]
            }
          })
        });
      });

      // Trigger statistics update
      await page.locator('[data-testid="refresh-stats"]').click();

      // Verify updated statistics
      await expect(page.locator('[data-testid="completed-exams"]')).toContainText('13');
      await expect(page.locator('[data-testid="average-score"]')).toContainText('79');
      await expect(page.locator('[data-testid="study-streak"]')).toContainText('8');
    });
  });

  test.describe('Mobile Experience', () => {
    test('should display responsive layout on mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
      await page.goto('/dashboard/valenciano/b2');
      await page.waitForLoadState('networkidle');

      // This should initially FAIL as mobile responsive design isn't implemented
      // Verify mobile layout adaptations
      await expect(page.locator('[data-testid="statistics-cards"]')).toHaveClass(/mobile-grid/);

      // Check that cards stack vertically on mobile
      const statsCards = page.locator('[data-testid="stats-card"]');
      const firstCardBox = await statsCards.first().boundingBox();
      const secondCardBox = await statsCards.nth(1).boundingBox();

      // Cards should stack vertically (second card below first)
      expect(secondCardBox?.y).toBeGreaterThan(firstCardBox?.y);

      // Timeline should be condensed for mobile
      await expect(page.locator('[data-testid="activity-timeline"]')).toHaveClass(/mobile-timeline/);
    });

    test('should support touch interactions properly', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard/valenciano/b2');
      await page.waitForLoadState('networkidle');

      // Test touch gestures
      const statsCard = page.locator('[data-testid="stats-card"]').first();

      // Test tap interaction
      await statsCard.tap();
      await expect(page.locator('[data-testid="stats-detail-modal"]')).toBeVisible();

      // Test swipe gesture on timeline (if implemented)
      const timeline = page.locator('[data-testid="activity-timeline"]');
      await timeline.hover();
      await page.mouse.down();
      await page.mouse.move(100, 0); // Swipe right
      await page.mouse.up();

      // Verify timeline scrolled horizontally
      const scrollLeft = await timeline.evaluate(el => el.scrollLeft);
      expect(scrollLeft).toBeGreaterThan(0);
    });

    test('should maintain intuitive mobile navigation', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard/valenciano/b2');
      await page.waitForLoadState('networkidle');

      // Test mobile menu functionality
      const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
      await expect(mobileMenuButton).toBeVisible();

      await mobileMenuButton.tap();
      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();

      // Test provider selection on mobile
      await page.locator('[data-testid="mobile-provider-menu"]').tap();
      await expect(page.locator('[data-testid="provider-option-jqcv"]')).toBeVisible();
    });
  });

  test.describe('Accessibility E2E', () => {
    test('should support keyboard-only navigation', async () => {
      await page.goto('/dashboard/valenciano/b2');
      await page.waitForLoadState('networkidle');

      // Test tab navigation through dashboard elements
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="stats-card"]:first-child')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="stats-card"]:nth-child(2)')).toBeFocused();

      // Test Enter key activation
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-testid="stats-detail-modal"]')).toBeVisible();

      // Test Escape to close modal
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="stats-detail-modal"]')).not.toBeVisible();

      // Continue tab navigation to quick actions
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="start-practice-exam"]')).toBeFocused();
    });

    test('should be compatible with screen readers', async () => {
      await page.goto('/dashboard/valenciano/b2');
      await page.waitForLoadState('networkidle');

      // Check ARIA labels and roles
      await expect(page.locator('[data-testid="statistics-cards"]')).toHaveAttribute('role', 'region');
      await expect(page.locator('[data-testid="statistics-cards"]')).toHaveAttribute('aria-label', 'Course statistics');

      // Check statistics have proper labels
      await expect(page.locator('[data-testid="completion-percentage"]')).toHaveAttribute('aria-label', /completion percentage/i);
      await expect(page.locator('[data-testid="completed-exams"]')).toHaveAttribute('aria-label', /exams completed/i);

      // Check timeline accessibility
      await expect(page.locator('[data-testid="activity-timeline"]')).toHaveAttribute('role', 'log');
      await expect(page.locator('[data-testid="activity-timeline"]')).toHaveAttribute('aria-label', 'Recent activity timeline');

      // Check quick actions accessibility
      const quickActionButtons = page.locator('[data-testid="quick-actions"] button');
      for (const button of await quickActionButtons.all()) {
        await expect(button).toHaveAttribute('aria-label');
      }
    });

    test('should maintain proper focus management', async () => {
      await page.goto('/dashboard/valenciano/b2');
      await page.waitForLoadState('networkidle');

      // Test focus trap in modals
      await page.locator('[data-testid="stats-card"]').first().click();
      await expect(page.locator('[data-testid="stats-detail-modal"]')).toBeVisible();

      // Focus should be on modal close button or first focusable element
      await expect(page.locator('[data-testid="modal-close-button"]')).toBeFocused();

      // Tab should cycle within modal
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should return to close button (focus trap)
      await expect(page.locator('[data-testid="modal-close-button"]')).toBeFocused();
    });
  });

  test.describe('Performance Validation', () => {
    test('should load dashboard within performance budget', async () => {
      const startTime = Date.now();

      await page.goto('/dashboard/valenciano/b2');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Should load faster without provider section
      expect(loadTime).toBeLessThan(3000); // 3 seconds max

      // Measure Core Web Vitals
      const vitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const vitals = {};

            entries.forEach((entry) => {
              if (entry.name === 'largest-contentful-paint') {
                vitals.lcp = entry.startTime;
              }
              if (entry.name === 'first-input-delay') {
                vitals.fid = entry.duration;
              }
              if (entry.name === 'cumulative-layout-shift') {
                vitals.cls = entry.value;
              }
            });

            resolve(vitals);
          }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });

          // Timeout after 5 seconds
          setTimeout(() => resolve({}), 5000);
        });
      });

      // Assert Core Web Vitals thresholds
      if (vitals.lcp) expect(vitals.lcp).toBeLessThan(2500); // 2.5s
      if (vitals.fid) expect(vitals.fid).toBeLessThan(100);  // 100ms
      if (vitals.cls) expect(vitals.cls).toBeLessThan(0.1);  // 0.1
    });

    test('should have responsive interactions under 200ms', async () => {
      await page.goto('/dashboard/valenciano/b2');
      await page.waitForLoadState('networkidle');

      // Test stats card interaction response time
      const startTime = Date.now();
      await page.locator('[data-testid="stats-card"]').first().click();
      await page.waitForSelector('[data-testid="stats-detail-modal"]', { state: 'visible' });
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(200);

      // Test quick action response time
      await page.locator('[data-testid="modal-close-button"]').click();

      const actionStartTime = Date.now();
      await page.locator('[data-testid="start-practice-exam"]').click();
      await page.waitForSelector('[data-testid="exam-selection-modal"]', { state: 'visible' });
      const actionResponseTime = Date.now() - actionStartTime;

      expect(actionResponseTime).toBeLessThan(200);
    });

    test('should not have memory leaks during navigation', async () => {
      await page.goto('/dashboard/valenciano/b2');
      await page.waitForLoadState('networkidle');

      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      // Navigate through different sections multiple times
      for (let i = 0; i < 5; i++) {
        await page.locator('[data-testid="stats-card"]').first().click();
        await page.waitForSelector('[data-testid="stats-detail-modal"]', { state: 'visible' });
        await page.locator('[data-testid="modal-close-button"]').click();

        await page.locator('[data-testid="start-practice-exam"]').click();
        await page.waitForSelector('[data-testid="exam-selection-modal"]', { state: 'visible' });
        await page.keyboard.press('Escape');
      }

      // Force garbage collection if available
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });

      // Check final memory usage
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      // Memory should not grow excessively (allow 20% increase)
      const memoryGrowth = (finalMemory - initialMemory) / initialMemory;
      expect(memoryGrowth).toBeLessThan(0.2);
    });
  });

  test.describe('Error Scenarios', () => {
    test('should handle network failures gracefully', async () => {
      await page.goto('/dashboard/valenciano/b2');

      // Simulate network failure
      await page.route('**/api/courses/valenciano/b2/statistics', async route => {
        await route.abort('failed');
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should display error state for statistics
      await expect(page.locator('[data-testid="statistics-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="statistics-error"]')).toContainText('Unable to load statistics');

      // Should provide retry option
      await expect(page.locator('[data-testid="retry-statistics"]')).toBeVisible();

      // Other sections should still work
      await expect(page.locator('[data-testid="quick-actions"]')).toBeVisible();
    });

    test('should display appropriate error states', async () => {
      // Simulate empty data response
      await page.route('**/api/courses/valenciano/b2/statistics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              total_exams: 0,
              completed_exams: 0,
              average_score: null,
              study_streak: 0,
              total_study_time: 0,
              recent_activity: []
            }
          })
        });
      });

      await page.goto('/dashboard/valenciano/b2');
      await page.waitForLoadState('networkidle');

      // Should display empty state for activity timeline
      await expect(page.locator('[data-testid="empty-activity-timeline"]')).toBeVisible();
      await expect(page.locator('[data-testid="empty-activity-timeline"]')).toContainText('No recent activity');

      // Should show beginner-friendly message
      await expect(page.locator('[data-testid="getting-started-message"]')).toBeVisible();
    });

    test('should recover from error conditions', async () => {
      await page.goto('/dashboard/valenciano/b2');

      // Simulate temporary API failure
      let failCount = 0;
      await page.route('**/api/courses/valenciano/b2/statistics', async route => {
        failCount++;
        if (failCount <= 2) {
          await route.abort('failed');
        } else {
          // Success on third try
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                total_exams: 45,
                completed_exams: 12,
                average_score: 78,
                study_streak: 7,
                total_study_time: 2400,
                recent_activity: []
              }
            })
          });
        }
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should show error initially
      await expect(page.locator('[data-testid="statistics-error"]')).toBeVisible();

      // Click retry button
      await page.locator('[data-testid="retry-statistics"]').click();

      // Should still show error on second try
      await expect(page.locator('[data-testid="statistics-error"]')).toBeVisible();

      // Third retry should succeed
      await page.locator('[data-testid="retry-statistics"]').click();
      await page.waitForTimeout(1000);

      // Should now show statistics
      await expect(page.locator('[data-testid="statistics-cards"]')).toBeVisible();
      await expect(page.locator('[data-testid="completed-exams"]')).toContainText('12');
    });

    test('should ensure degraded functionality still works', async () => {
      // Simulate partial API failures
      await page.route('**/api/courses/valenciano/b2/statistics', async route => {
        await route.abort('failed');
      });

      await page.goto('/dashboard/valenciano/b2');
      await page.waitForLoadState('networkidle');

      // Statistics should show error, but quick actions should still work
      await expect(page.locator('[data-testid="statistics-error"]')).toBeVisible();

      // Quick actions should still be functional
      await page.locator('[data-testid="start-practice-exam"]').click();
      await expect(page.locator('[data-testid="exam-selection-modal"]')).toBeVisible();

      // Provider dropdown should still work
      await page.keyboard.press('Escape');
      await page.locator('[data-testid="provider-dropdown"]').click();
      await expect(page.locator('[data-testid="provider-option-jqcv"]')).toBeVisible();
    });
  });

  test.afterEach(async () => {
    await page.close();
  });
});