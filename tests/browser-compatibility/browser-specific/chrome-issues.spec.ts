import { test, expect, Page } from '@playwright/test';

/**
 * Chrome-Specific Issue Detection Tests
 * Tests for known Chrome/Chromium rendering quirks and compatibility issues
 */

test.describe('Chrome-Specific Issues', () => {
  test.beforeEach(async ({ page, browserName }) => {
    // Skip if not Chrome/Chromium
    test.skip(!['chromium', 'chrome'].includes(browserName), 'Chrome-specific tests');

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="modern-dashboard"]', { timeout: 10000 });
  });

  test('WebKit/Blink rendering optimizations @chrome-rendering', async ({ page }) => {
    // Chrome-specific rendering optimizations
    const renderingTest = await page.evaluate(() => {
      const testEl = document.createElement('div');
      testEl.style.willChange = 'transform';
      testEl.style.transform = 'translateZ(0)';
      testEl.style.backfaceVisibility = 'hidden';
      document.body.appendChild(testEl);

      const computed = window.getComputedStyle(testEl);
      const willChange = computed.willChange;
      const backfaceVisibility = computed.backfaceVisibility;
      const transform = computed.transform;

      document.body.removeChild(testEl);

      return {
        willChange,
        backfaceVisibility,
        transform,
        supportsWillChange: willChange === 'transform',
        supportsBackfaceVisibility: backfaceVisibility === 'hidden',
      };
    });

    expect(renderingTest.supportsWillChange).toBeTruthy();
    expect(renderingTest.supportsBackfaceVisibility).toBeTruthy();

    // Check dashboard elements for performance optimizations
    const animatedElements = page.locator('.dashboard-card, [data-testid="dashboard-widget"]');
    const count = await animatedElements.count();

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const element = animatedElements.nth(i);
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            willChange: computed.willChange,
            transform: computed.transform,
            isolation: computed.isolation,
          };
        });

        // Elements with animations might have performance optimizations
        if (styles.willChange && styles.willChange !== 'auto') {
          console.log(`Element ${i} has will-change: ${styles.willChange}`);
        }
      }
    }
  });

  test('CSS containment and layout performance @chrome-containment', async ({ page }) => {
    // Chrome has strong CSS containment support
    const containmentTest = await page.evaluate(() => {
      const testEl = document.createElement('div');
      testEl.style.contain = 'layout style paint size';
      document.body.appendChild(testEl);

      const computed = window.getComputedStyle(testEl);
      const contain = computed.contain;

      document.body.removeChild(testEl);

      return {
        contain,
        supportsContainment: contain !== 'none' && contain !== '',
        supportsFullContainment: contain.includes('layout') && contain.includes('style'),
      };
    });

    console.log(`Chrome CSS containment support: ${containmentTest.supportsFullContainment}`);

    // Test containment on dashboard widgets
    const widgets = page.locator('.dashboard-card, [data-testid="dashboard-widget"]');
    const widgetCount = await widgets.count();

    for (let i = 0; i < Math.min(widgetCount, 3); i++) {
      const widget = widgets.nth(i);

      // Apply containment for testing
      await widget.evaluate((el) => {
        el.style.contain = 'layout style';
      });

      const containStyles = await widget.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          contain: computed.contain,
          overflow: computed.overflow,
          isolation: computed.isolation,
        };
      });

      if (containmentTest.supportsContainment) {
        expect(containStyles.contain).toContain('layout');
        expect(containStyles.contain).toContain('style');
      }
    }
  });

  test('Modern JavaScript features and performance @chrome-js', async ({ page }) => {
    // Chrome's V8 engine features
    const jsFeatureTest = await page.evaluate(() => {
      const features = {
        asyncAwait: typeof (async () => {})().then === 'function',
        es6Modules: typeof Symbol !== 'undefined',
        classes: typeof class {} === 'function',
        arrowFunctions: (() => true)(),
        destructuring: (() => {
          try {
            const [a] = [1];
            return a === 1;
          } catch {
            return false;
          }
        })(),
        templateLiterals: (() => {
          try {
            return `test` === 'test';
          } catch {
            return false;
          }
        })(),
        weakMap: typeof WeakMap !== 'undefined',
        weakSet: typeof WeakSet !== 'undefined',
        proxy: typeof Proxy !== 'undefined',
        promises: typeof Promise !== 'undefined',
      };

      return features;
    });

    // Chrome should support all modern features
    expect(jsFeatureTest.asyncAwait).toBeTruthy();
    expect(jsFeatureTest.es6Modules).toBeTruthy();
    expect(jsFeatureTest.classes).toBeTruthy();
    expect(jsFeatureTest.arrowFunctions).toBeTruthy();
    expect(jsFeatureTest.destructuring).toBeTruthy();
    expect(jsFeatureTest.templateLiterals).toBeTruthy();
    expect(jsFeatureTest.weakMap).toBeTruthy();
    expect(jsFeatureTest.weakSet).toBeTruthy();
    expect(jsFeatureTest.proxy).toBeTruthy();
    expect(jsFeatureTest.promises).toBeTruthy();

    // Test performance API
    const performanceFeatures = await page.evaluate(() => ({
      performanceObserver: typeof PerformanceObserver !== 'undefined',
      performanceMark: typeof performance.mark === 'function',
      performanceMeasure: typeof performance.measure === 'function',
      performanceNow: typeof performance.now === 'function',
      performanceMemory: !!(performance as any).memory,
    }));

    expect(performanceFeatures.performanceObserver).toBeTruthy();
    expect(performanceFeatures.performanceMark).toBeTruthy();
    expect(performanceFeatures.performanceMeasure).toBeTruthy();
    expect(performanceFeatures.performanceNow).toBeTruthy();
  });

  test('Web APIs and modern features @chrome-apis', async ({ page }) => {
    // Chrome's comprehensive Web API support
    const webApiTest = await page.evaluate(() => ({
      intersectionObserver: typeof IntersectionObserver !== 'undefined',
      resizeObserver: typeof ResizeObserver !== 'undefined',
      mutationObserver: typeof MutationObserver !== 'undefined',
      requestIdleCallback: typeof requestIdleCallback !== 'undefined',
      requestAnimationFrame: typeof requestAnimationFrame !== 'undefined',
      fetch: typeof fetch !== 'undefined',
      webGL: (() => {
        try {
          const canvas = document.createElement('canvas');
          return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch {
          return false;
        }
      })(),
      webGL2: (() => {
        try {
          const canvas = document.createElement('canvas');
          return !!canvas.getContext('webgl2');
        } catch {
          return false;
        }
      })(),
      serviceWorker: 'serviceWorker' in navigator,
      webAssembly: typeof WebAssembly !== 'undefined',
    }));

    // Chrome should support most modern Web APIs
    expect(webApiTest.intersectionObserver).toBeTruthy();
    expect(webApiTest.resizeObserver).toBeTruthy();
    expect(webApiTest.mutationObserver).toBeTruthy();
    expect(webApiTest.requestAnimationFrame).toBeTruthy();
    expect(webApiTest.fetch).toBeTruthy();
    expect(webApiTest.webGL).toBeTruthy();
    expect(webApiTest.serviceWorker).toBeTruthy();
    expect(webApiTest.webAssembly).toBeTruthy();

    // Test if Intersection Observer works with dashboard elements
    const intersectionTest = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new IntersectionObserver((entries) => {
          resolve(entries.length > 0);
          observer.disconnect();
        });

        const testEl = document.createElement('div');
        testEl.style.height = '100px';
        document.body.appendChild(testEl);
        observer.observe(testEl);

        setTimeout(() => {
          document.body.removeChild(testEl);
          resolve(false);
        }, 1000);
      });
    });

    expect(intersectionTest).toBeTruthy();
  });

  test('CSS Grid and Flexbox advanced features @chrome-layout', async ({ page }) => {
    // Chrome's advanced layout features
    await page.setContent(`
      <div id="grid-advanced" style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        grid-template-rows: masonry;
        gap: 16px;
        padding: 20px;
        height: 300px;
      ">
        <div style="background: red; height: 80px;">Item 1</div>
        <div style="background: blue; height: 120px;">Item 2</div>
        <div style="background: green; height: 60px;">Item 3</div>
        <div style="background: yellow; height: 100px;">Item 4</div>
      </div>

      <div id="flex-gap-test" style="
        display: flex;
        gap: 20px;
        padding: 20px;
        flex-wrap: wrap;
      ">
        <div style="background: purple; width: 100px; height: 50px;">Flex Item 1</div>
        <div style="background: orange; width: 100px; height: 50px;">Flex Item 2</div>
        <div style="background: pink; width: 100px; height: 50px;">Flex Item 3</div>
      </div>
    `);

    const gridContainer = page.locator('#grid-advanced');
    const flexContainer = page.locator('#flex-gap-test');

    // Test CSS Grid advanced features
    const gridStyles = await gridContainer.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        gridTemplateColumns: computed.gridTemplateColumns,
        gridTemplateRows: computed.gridTemplateRows,
        gap: computed.gap,
      };
    });

    expect(gridStyles.display).toBe('grid');
    expect(gridStyles.gridTemplateColumns).toContain('minmax');
    expect(gridStyles.gap).toBe('16px');

    // Test Flexbox gap
    const flexStyles = await flexContainer.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        gap: computed.gap,
        flexWrap: computed.flexWrap,
      };
    });

    expect(flexStyles.display).toBe('flex');
    expect(flexStyles.gap).toBe('20px');
    expect(flexStyles.flexWrap).toBe('wrap');

    // Check layout results
    const gridItems = gridContainer.locator('> div');
    const gridItemCount = await gridItems.count();

    for (let i = 0; i < gridItemCount; i++) {
      const item = gridItems.nth(i);
      const boundingBox = await item.boundingBox();

      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThan(100); // Should respect minmax
      }
    }
  });

  test('Shadow DOM and Web Components @chrome-components', async ({ page }) => {
    // Chrome's Web Components support
    const webComponentsTest = await page.evaluate(() => {
      const features = {
        customElements: typeof customElements !== 'undefined',
        shadowDOM: typeof Element.prototype.attachShadow === 'function',
        htmlTemplates: 'content' in document.createElement('template'),
        htmlImports: 'import' in document.createElement('link'),
      };

      // Test Shadow DOM functionality
      if (features.shadowDOM) {
        try {
          const host = document.createElement('div');
          const shadow = host.attachShadow({ mode: 'open' });
          shadow.innerHTML = '<p>Shadow DOM content</p>';
          features.shadowDOMWorks = shadow.children.length > 0;
        } catch {
          features.shadowDOMWorks = false;
        }
      }

      return features;
    });

    expect(webComponentsTest.customElements).toBeTruthy();
    expect(webComponentsTest.shadowDOM).toBeTruthy();
    expect(webComponentsTest.htmlTemplates).toBeTruthy();

    if (webComponentsTest.shadowDOM) {
      expect(webComponentsTest.shadowDOMWorks).toBeTruthy();
    }
  });

  test('Image and media format support @chrome-media', async ({ page }) => {
    // Chrome's comprehensive media format support
    const mediaFormatTest = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;

      const video = document.createElement('video');
      const audio = document.createElement('audio');

      return {
        webp: canvas.toDataURL('image/webp').indexOf('image/webp') !== -1,
        avif: canvas.toDataURL('image/avif').indexOf('image/avif') !== -1,
        webm: video.canPlayType('video/webm') !== '',
        mp4: video.canPlayType('video/mp4') !== '',
        h264: video.canPlayType('video/mp4; codecs="avc1.42E01E"') !== '',
        vp9: video.canPlayType('video/webm; codecs="vp9"') !== '',
        av1: video.canPlayType('video/mp4; codecs="av01.0.05M.08"') !== '',
        opus: audio.canPlayType('audio/ogg; codecs="opus"') !== '',
        aac: audio.canPlayType('audio/mp4; codecs="mp4a.40.2"') !== '',
      };
    });

    // Chrome should support modern formats
    expect(mediaFormatTest.webp).toBeTruthy();
    expect(mediaFormatTest.webm).toBeTruthy();
    expect(mediaFormatTest.mp4).toBeTruthy();
    expect(mediaFormatTest.h264).toBeTruthy();
    expect(mediaFormatTest.aac).toBeTruthy();

    console.log('Chrome media format support:', mediaFormatTest);

    // Test image loading with modern formats
    if (mediaFormatTest.webp) {
      await page.setContent(`
        <img id="webp-test" src="data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA"
             alt="WebP test" style="width: 50px; height: 50px;">
      `);

      const webpImg = page.locator('#webp-test');
      await webpImg.waitFor({ state: 'visible' });

      const imgProps = await webpImg.evaluate((el: HTMLImageElement) => ({
        complete: el.complete,
        naturalWidth: el.naturalWidth,
      }));

      expect(imgProps.complete).toBeTruthy();
      expect(imgProps.naturalWidth).toBeGreaterThan(0);
    }
  });

  test('Performance and memory management @chrome-performance', async ({ page }) => {
    // Chrome's performance monitoring capabilities
    const performanceTest = await page.evaluate(() => {
      // Test memory API
      const memory = (performance as any).memory;
      const memoryInfo = memory ? {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      } : null;

      // Test performance timing
      const timing = performance.timing;
      const navigation = performance.navigation;

      return {
        memoryInfo,
        hasPerformanceTiming: !!timing,
        hasNavigationTiming: !!navigation,
        supportsPaintTiming: 'PerformancePaintTiming' in window,
        supportsLongTasks: 'PerformanceLongTaskTiming' in window,
      };
    });

    if (performanceTest.memoryInfo) {
      expect(performanceTest.memoryInfo.usedJSHeapSize).toBeGreaterThan(0);
      expect(performanceTest.memoryInfo.totalJSHeapSize).toBeGreaterThan(0);
      expect(performanceTest.memoryInfo.jsHeapSizeLimit).toBeGreaterThan(0);

      // Memory usage should be reasonable
      expect(performanceTest.memoryInfo.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024); // < 100MB
    }

    expect(performanceTest.hasPerformanceTiming).toBeTruthy();
    expect(performanceTest.hasNavigationTiming).toBeTruthy();

    // Test performance observers
    const observerTest = await page.evaluate(() => {
      return new Promise((resolve) => {
        try {
          const observer = new PerformanceObserver((list) => {
            observer.disconnect();
            resolve(list.getEntries().length > 0);
          });

          observer.observe({ entryTypes: ['measure'] });

          // Create a performance measure
          performance.mark('test-start');
          setTimeout(() => {
            performance.mark('test-end');
            performance.measure('test-measure', 'test-start', 'test-end');
          }, 10);

          setTimeout(() => resolve(false), 1000);
        } catch {
          resolve(false);
        }
      });
    });

    expect(observerTest).toBeTruthy();
  });

  test('CSS paint worklets and advanced features @chrome-paint', async ({ page }) => {
    // Chrome's CSS Paint API support
    const paintApiTest = await page.evaluate(() => {
      const features = {
        cssPaintAPI: 'CSS' in window && 'paintWorklet' in (window as any).CSS,
        cssTypedOM: 'CSS' in window && 'number' in (window as any).CSS,
        worklets: 'Worklet' in window,
        offscreenCanvas: 'OffscreenCanvas' in window,
      };

      return features;
    });

    console.log('Chrome Paint API support:', paintApiTest);

    // CSS Paint API is an advanced Chrome feature
    if (paintApiTest.cssPaintAPI) {
      await page.addStyleTag({
        content: `
          .paint-test {
            width: 100px;
            height: 100px;
            background: paint(test-pattern);
          }
        `,
      });

      // Even if paint worklet isn't registered, CSS should parse correctly
      await page.setContent(`
        <div class="paint-test"></div>
      `);

      const paintElement = page.locator('.paint-test');
      const styles = await paintElement.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          width: computed.width,
          height: computed.height,
          background: computed.background,
        };
      });

      expect(styles.width).toBe('100px');
      expect(styles.height).toBe('100px');
    }

    // Test OffscreenCanvas if available
    if (paintApiTest.offscreenCanvas) {
      const offscreenTest = await page.evaluate(() => {
        try {
          const canvas = new OffscreenCanvas(100, 100);
          const ctx = canvas.getContext('2d');
          return !!ctx;
        } catch {
          return false;
        }
      });

      expect(offscreenTest).toBeTruthy();
    }
  });

  test('Modern CSS features support @chrome-css-features', async ({ page }) => {
    // Chrome's cutting-edge CSS features
    await page.setContent(`
      <div id="modern-css-test" style="
        aspect-ratio: 16/9;
        container-type: inline-size;
        width: 320px;
        background: linear-gradient(45deg, red, blue);
        border-radius: 16px;
        backdrop-filter: blur(10px);
      ">
        <div style="
          writing-mode: vertical-rl;
          text-orientation: mixed;
          font-size: clamp(14px, 4vw, 24px);
        ">
          Modern CSS Test
        </div>
      </div>

      <style>
        @container (min-width: 300px) {
          #modern-css-test div {
            color: green;
          }
        }

        @supports (aspect-ratio: 1) {
          #modern-css-test {
            border: 2px solid purple;
          }
        }
      </style>
    `);

    const modernElement = page.locator('#modern-css-test');

    const modernStyles = await modernElement.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        aspectRatio: computed.aspectRatio,
        containerType: computed.containerType,
        backdropFilter: computed.backdropFilter,
        borderRadius: computed.borderRadius,
        background: computed.background,
        border: computed.border,
      };
    });

    // Check aspect ratio support
    if (modernStyles.aspectRatio && modernStyles.aspectRatio !== 'auto') {
      expect(modernStyles.aspectRatio).toBe('16 / 9');
    }

    // Check backdrop filter
    expect(modernStyles.backdropFilter).toContain('blur');

    // Check gradient background
    expect(modernStyles.background).toContain('linear-gradient');

    // Check border radius
    expect(modernStyles.borderRadius).toBe('16px');

    // Test child element with modern features
    const childElement = modernElement.locator('div');
    const childStyles = await childElement.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        writingMode: computed.writingMode,
        fontSize: computed.fontSize,
        color: computed.color,
      };
    });

    expect(childStyles.writingMode).toBe('vertical-rl');
    expect(childStyles.fontSize).toMatch(/\d+px/);

    // Container query should apply green color
    if (modernStyles.containerType) {
      expect(childStyles.color).toContain('green');
    }
  });
});