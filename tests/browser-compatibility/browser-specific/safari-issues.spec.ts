import { test, expect, Page } from '@playwright/test';

/**
 * Safari-Specific Issue Detection Tests
 * Tests for known Safari/WebKit rendering quirks and compatibility issues
 */

test.describe('Safari-Specific Issues', () => {
  test.beforeEach(async ({ page, browserName }) => {
    // Skip if not Safari/WebKit
    test.skip(browserName !== 'webkit', 'Safari-specific tests');

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="modern-dashboard"]', { timeout: 10000 });
  });

  test('CSS Custom Properties work correctly @safari-css', async ({ page }) => {
    // Test CSS custom properties (CSS variables) support
    const customPropertiesTest = await page.evaluate(() => {
      // Create test element
      const testEl = document.createElement('div');
      testEl.style.setProperty('--test-color', '#ff0000');
      testEl.style.backgroundColor = 'var(--test-color)';
      document.body.appendChild(testEl);

      const computed = window.getComputedStyle(testEl);
      const bgColor = computed.backgroundColor;

      document.body.removeChild(testEl);

      return {
        backgroundColor: bgColor,
        supportsCustomProperties: bgColor === 'rgb(255, 0, 0)',
      };
    });

    expect(customPropertiesTest.supportsCustomProperties).toBeTruthy();

    // Test dashboard custom properties
    const dashboardCard = page.locator('.dashboard-card').first();
    if (await dashboardCard.count() > 0) {
      const cardStyles = await dashboardCard.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          borderRadius: computed.borderRadius,
          padding: computed.padding,
          backgroundColor: computed.backgroundColor,
        };
      });

      // Custom properties should be resolved
      expect(cardStyles.borderRadius).not.toBe('');
      expect(cardStyles.padding).not.toBe('');
      expect(cardStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    }
  });

  test('Flexbox gap property support @safari-flexbox', async ({ page }) => {
    // Safari had delayed support for flexbox gap property
    const flexGapTest = await page.evaluate(() => {
      const testEl = document.createElement('div');
      testEl.style.display = 'flex';
      testEl.style.gap = '16px';

      const child1 = document.createElement('div');
      const child2 = document.createElement('div');
      testEl.appendChild(child1);
      testEl.appendChild(child2);

      document.body.appendChild(testEl);

      const computed = window.getComputedStyle(testEl);
      const gap = computed.gap;

      document.body.removeChild(testEl);

      return {
        gap,
        supportsFlexGap: gap === '16px',
      };
    });

    // Modern Safari should support flexbox gap
    expect(flexGapTest.supportsFlexGap).toBeTruthy();

    // Test dashboard flex layouts
    const flexElements = page.locator('.flex, .dashboard-flex');
    const count = await flexElements.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const element = flexElements.nth(i);
      const styles = await element.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          display: computed.display,
          gap: computed.gap,
          flexDirection: computed.flexDirection,
        };
      });

      if (styles.display === 'flex') {
        // If gap is set, it should be properly applied
        if (styles.gap && styles.gap !== 'normal' && styles.gap !== '0px') {
          expect(styles.gap).toMatch(/\d+px/);
        }
      }
    }
  });

  test('Date input styling and functionality @safari-inputs', async ({ page }) => {
    // Safari has specific behaviors with date inputs
    await page.setContent(`
      <div style="padding: 20px;">
        <input type="date" id="test-date" style="padding: 8px; border: 1px solid #ccc;">
        <input type="datetime-local" id="test-datetime" style="padding: 8px; border: 1px solid #ccc;">
        <input type="time" id="test-time" style="padding: 8px; border: 1px solid #ccc;">
      </div>
    `);

    const dateInput = page.locator('#test-date');
    const datetimeInput = page.locator('#test-datetime');
    const timeInput = page.locator('#test-time');

    // Test date input functionality
    await dateInput.fill('2024-12-25');
    const dateValue = await dateInput.inputValue();
    expect(dateValue).toBe('2024-12-25');

    // Test datetime-local input
    await datetimeInput.fill('2024-12-25T10:30');
    const datetimeValue = await datetimeInput.inputValue();
    expect(datetimeValue).toBe('2024-12-25T10:30');

    // Test time input
    await timeInput.fill('14:30');
    const timeValue = await timeInput.inputValue();
    expect(timeValue).toBe('14:30');

    // Check styling is preserved
    const dateStyles = await dateInput.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        padding: computed.padding,
        border: computed.border,
        height: computed.height,
      };
    });

    expect(dateStyles.padding).toMatch(/8px/);
    expect(dateStyles.border).toContain('1px');
  });

  test('Backdrop filter support and fallbacks @safari-filters', async ({ page }) => {
    // Test backdrop-filter support (available in newer Safari)
    const backdropFilterTest = await page.evaluate(() => {
      const testEl = document.createElement('div');
      testEl.style.backdropFilter = 'blur(10px)';
      document.body.appendChild(testEl);

      const computed = window.getComputedStyle(testEl);
      const backdropFilter = computed.backdropFilter;

      document.body.removeChild(testEl);

      return {
        backdropFilter,
        supportsBackdropFilter: backdropFilter !== 'none',
      };
    });

    // Check for glass-card elements that use backdrop-filter
    const glassCards = page.locator('.glass-card, .backdrop-blur');
    const glassCount = await glassCards.count();

    if (glassCount > 0) {
      for (let i = 0; i < glassCount; i++) {
        const card = glassCards.nth(i);
        const cardStyles = await card.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            backdropFilter: computed.backdropFilter,
            backgroundColor: computed.backgroundColor,
            border: computed.border,
          };
        });

        if (backdropFilterTest.supportsBackdropFilter) {
          // Should have backdrop filter applied
          expect(cardStyles.backdropFilter).not.toBe('none');
        } else {
          // Should have fallback styling
          expect(cardStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
        }
      }
    }
  });

  test('Viewport units behavior (vh, vw) @safari-viewport', async ({ page }) => {
    // Safari has specific viewport unit behaviors, especially on mobile
    await page.setContent(`
      <div id="vh-test" style="height: 100vh; background: red;">
        <div id="vw-test" style="width: 100vw; height: 50px; background: blue;"></div>
      </div>
    `);

    const viewport = page.viewportSize();
    const vhElement = page.locator('#vh-test');
    const vwElement = page.locator('#vw-test');

    const vhBox = await vhElement.boundingBox();
    const vwBox = await vwElement.boundingBox();

    // Check viewport units are calculated correctly
    if (vhBox && viewport) {
      // 100vh should be close to viewport height (allowing for browser UI)
      const heightRatio = vhBox.height / viewport.height;
      expect(heightRatio).toBeGreaterThan(0.8);
      expect(heightRatio).toBeLessThanOrEqual(1.1);
    }

    if (vwBox && viewport) {
      // 100vw should be viewport width
      const widthRatio = vwBox.width / viewport.width;
      expect(widthRatio).toBeGreaterThan(0.95);
      expect(widthRatio).toBeLessThanOrEqual(1.05);
    }
  });

  test('Transform and animation performance @safari-performance', async ({ page }) => {
    // Safari can have performance issues with certain transforms
    await page.setContent(`
      <div style="padding: 20px;">
        <div id="transform-test" style="
          width: 100px;
          height: 100px;
          background: blue;
          transition: transform 0.3s ease;
          transform: translateX(0px);
        "></div>
      </div>
    `);

    const transformElement = page.locator('#transform-test');

    // Test initial transform
    const initialTransform = await transformElement.evaluate((el) =>
      window.getComputedStyle(el).transform
    );

    // Apply transform
    await transformElement.evaluate((el) => {
      el.style.transform = 'translateX(100px) translateY(50px) scale(1.2)';
    });

    await page.waitForTimeout(100);

    const finalTransform = await transformElement.evaluate((el) =>
      window.getComputedStyle(el).transform
    );

    // Transform should be applied
    expect(finalTransform).not.toBe(initialTransform);
    expect(finalTransform).not.toBe('none');

    // Test 3D transforms
    await transformElement.evaluate((el) => {
      el.style.transform = 'translateZ(0) rotateY(45deg)';
    });

    await page.waitForTimeout(100);

    const transform3D = await transformElement.evaluate((el) =>
      window.getComputedStyle(el).transform
    );

    expect(transform3D).not.toBe('none');
  });

  test('Touch event handling @safari-touch', async ({ page }) => {
    // Safari has specific touch event behaviors
    await page.setContent(`
      <div id="touch-test" style="
        width: 200px;
        height: 200px;
        background: lightblue;
        touch-action: manipulation;
        user-select: none;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
      ">
        Touch Test Area
      </div>
    `);

    const touchElement = page.locator('#touch-test');

    // Check touch-action support
    const touchAction = await touchElement.evaluate((el) =>
      window.getComputedStyle(el).touchAction
    );

    expect(touchAction).toBe('manipulation');

    // Check user-select support
    const userSelect = await touchElement.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return computed.userSelect || computed.webkitUserSelect;
    });

    expect(userSelect).toBe('none');

    // Test touch events if on mobile
    const isMobile = await page.evaluate(() => 'ontouchstart' in window);

    if (isMobile) {
      let touchEvents: string[] = [];

      await page.evaluate(() => {
        const element = document.getElementById('touch-test');
        (window as any).touchEvents = [];

        element?.addEventListener('touchstart', () => {
          (window as any).touchEvents.push('touchstart');
        });

        element?.addEventListener('touchmove', () => {
          (window as any).touchEvents.push('touchmove');
        });

        element?.addEventListener('touchend', () => {
          (window as any).touchEvents.push('touchend');
        });
      });

      // Simulate touch
      await touchElement.tap();
      await page.waitForTimeout(100);

      touchEvents = await page.evaluate(() => (window as any).touchEvents || []);

      // Should have touch events
      expect(touchEvents.length).toBeGreaterThan(0);
      expect(touchEvents).toContain('touchstart');
    }
  });

  test('Audio and video element behavior @safari-media', async ({ page }) => {
    // Safari has specific policies for media playback
    await page.setContent(`
      <div style="padding: 20px;">
        <video id="test-video" controls width="300" height="200" muted>
          <source src="data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=" type="video/mp4">
        </video>
        <audio id="test-audio" controls muted>
          <source src="data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA" type="audio/mpeg">
        </audio>
      </div>
    `);

    const videoElement = page.locator('#test-video');
    const audioElement = page.locator('#test-audio');

    // Check video element properties
    const videoProps = await videoElement.evaluate((el: HTMLVideoElement) => ({
      muted: el.muted,
      controls: el.controls,
      readyState: el.readyState,
      networkState: el.networkState,
      canPlayType: {
        mp4: el.canPlayType('video/mp4'),
        webm: el.canPlayType('video/webm'),
      },
    }));

    expect(videoProps.muted).toBeTruthy();
    expect(videoProps.controls).toBeTruthy();

    // Check audio element properties
    const audioProps = await audioElement.evaluate((el: HTMLAudioElement) => ({
      muted: el.muted,
      controls: el.controls,
      canPlayType: {
        mp3: el.canPlayType('audio/mpeg'),
        aac: el.canPlayType('audio/aac'),
      },
    }));

    expect(audioProps.muted).toBeTruthy();
    expect(audioProps.controls).toBeTruthy();
  });

  test('CSS Grid layout edge cases @safari-grid', async ({ page }) => {
    // Safari has had various CSS Grid implementation quirks
    await page.setContent(`
      <div id="grid-test" style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        grid-gap: 16px;
        padding: 20px;
      ">
        <div style="background: red; height: 100px;">Item 1</div>
        <div style="background: blue; height: 100px;">Item 2</div>
        <div style="background: green; height: 100px;">Item 3</div>
      </div>
    `);

    const gridContainer = page.locator('#grid-test');

    const gridStyles = await gridContainer.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        gridTemplateColumns: computed.gridTemplateColumns,
        gap: computed.gap || computed.gridGap,
        gridAutoRows: computed.gridAutoRows,
      };
    });

    expect(gridStyles.display).toBe('grid');
    expect(gridStyles.gridTemplateColumns).not.toBe('none');
    expect(gridStyles.gap).toBe('16px');

    // Check grid items positioning
    const gridItems = page.locator('#grid-test > div');
    const itemCount = await gridItems.count();

    for (let i = 0; i < itemCount; i++) {
      const item = gridItems.nth(i);
      const boundingBox = await item.boundingBox();

      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThan(150); // Should respect minmax
        expect(boundingBox.height).toBe(100);
      }
    }
  });

  test('Scroll behavior and momentum @safari-scroll', async ({ page }) => {
    // Safari has specific scroll behaviors, especially momentum scrolling
    await page.setContent(`
      <div id="scroll-container" style="
        height: 200px;
        width: 300px;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        border: 1px solid #ccc;
      ">
        <div style="height: 800px; background: linear-gradient(red, blue);">
          Scrollable content
        </div>
      </div>
    `);

    const scrollContainer = page.locator('#scroll-container');

    // Check overflow scrolling support
    const scrollStyles = await scrollContainer.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        overflowY: computed.overflowY,
        webkitOverflowScrolling: computed.webkitOverflowScrolling,
      };
    });

    expect(scrollStyles.overflowY).toBe('auto');

    // Test scroll functionality
    await scrollContainer.evaluate((el) => {
      el.scrollTop = 100;
    });

    await page.waitForTimeout(100);

    const scrollTop = await scrollContainer.evaluate((el) => el.scrollTop);
    expect(scrollTop).toBe(100);

    // Test scroll events
    let scrollEventFired = false;

    await page.evaluate(() => {
      const container = document.getElementById('scroll-container');
      (window as any).scrollEventFired = false;

      container?.addEventListener('scroll', () => {
        (window as any).scrollEventFired = true;
      });
    });

    await scrollContainer.evaluate((el) => {
      el.scrollTop = 200;
    });

    await page.waitForTimeout(100);

    scrollEventFired = await page.evaluate(() => (window as any).scrollEventFired);
    expect(scrollEventFired).toBeTruthy();
  });
});