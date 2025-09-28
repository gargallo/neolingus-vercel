import { test, expect, Page } from '@playwright/test';

/**
 * Firefox-Specific Issue Detection Tests
 * Tests for known Firefox/Gecko rendering quirks and compatibility issues
 */

test.describe('Firefox-Specific Issues', () => {
  test.beforeEach(async ({ page, browserName }) => {
    // Skip if not Firefox
    test.skip(browserName !== 'firefox', 'Firefox-specific tests');

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="modern-dashboard"]', { timeout: 10000 });
  });

  test('Backdrop-filter performance and fallbacks @firefox-filters', async ({ page }) => {
    // Firefox has limited backdrop-filter support and performance issues
    const backdropFilterTest = await page.evaluate(() => {
      const testEl = document.createElement('div');
      testEl.style.backdropFilter = 'blur(10px)';
      testEl.style.webkitBackdropFilter = 'blur(10px)'; // Fallback
      document.body.appendChild(testEl);

      const computed = window.getComputedStyle(testEl);
      const backdropFilter = computed.backdropFilter || computed.webkitBackdropFilter;

      document.body.removeChild(testEl);

      return {
        backdropFilter,
        supportsBackdropFilter: backdropFilter !== 'none' && backdropFilter !== '',
      };
    });

    // Check dashboard glass elements
    const glassElements = page.locator('.glass-card, .backdrop-blur');
    const glassCount = await glassElements.count();

    if (glassCount > 0) {
      for (let i = 0; i < glassCount; i++) {
        const element = glassElements.nth(i);
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            backdropFilter: computed.backdropFilter,
            backgroundColor: computed.backgroundColor,
            opacity: computed.opacity,
            border: computed.border,
          };
        });

        if (!backdropFilterTest.supportsBackdropFilter) {
          // Should have fallback styling for better visibility
          expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');

          // Opacity should be reasonable for readability
          const opacity = parseFloat(styles.opacity);
          expect(opacity).toBeGreaterThan(0.7);
        }
      }
    }
  });

  test('CSS subgrid support and fallbacks @firefox-grid', async ({ page }) => {
    // Firefox was first to implement subgrid
    const subgridTest = await page.evaluate(() => {
      const testEl = document.createElement('div');
      testEl.style.display = 'grid';
      testEl.style.gridTemplateColumns = 'subgrid';
      document.body.appendChild(testEl);

      const computed = window.getComputedStyle(testEl);
      const gridTemplateColumns = computed.gridTemplateColumns;

      document.body.removeChild(testEl);

      return {
        gridTemplateColumns,
        supportsSubgrid: gridTemplateColumns === 'subgrid',
      };
    });

    console.log(`Firefox subgrid support: ${subgridTest.supportsSubgrid}`);

    // Test main dashboard grid
    const dashboardGrid = page.locator('.dashboard-grid');
    if (await dashboardGrid.count() > 0) {
      const gridStyles = await dashboardGrid.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          display: computed.display,
          gridTemplateColumns: computed.gridTemplateColumns,
          gridGap: computed.gridGap || computed.gap,
        };
      });

      expect(gridStyles.display).toBe('grid');
      expect(gridStyles.gridTemplateColumns).not.toBe('none');
    }
  });

  test('Font rendering and text smoothing @firefox-fonts', async ({ page }) => {
    // Firefox has different font rendering than other browsers
    const textElements = page.locator([
      '.dashboard-card__title',
      '.dashboard-card__value',
      'h1, h2, h3, h4, h5, h6',
    ].join(', '));

    const count = await textElements.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const element = textElements.nth(i);

      if (await element.isVisible()) {
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            fontFamily: computed.fontFamily,
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            textRendering: computed.textRendering,
            fontSmooth: computed.fontSmooth,
            mozOsxFontSmoothing: computed.mozOsxFontSmoothing,
          };
        });

        // Font family should be properly resolved
        expect(styles.fontFamily).toBeTruthy();
        expect(styles.fontFamily).not.toBe('');

        // Font size should be reasonable
        const fontSize = parseFloat(styles.fontSize);
        expect(fontSize).toBeGreaterThan(10);
        expect(fontSize).toBeLessThan(100);

        // Text rendering should be optimized
        if (styles.textRendering) {
          expect(['auto', 'optimizeSpeed', 'optimizeLegibility', 'geometricPrecision'])
            .toContain(styles.textRendering);
        }
      }
    }
  });

  test('Flexbox implementation quirks @firefox-flexbox', async ({ page }) => {
    // Firefox had some historical flexbox quirks
    await page.setContent(`
      <div id="flex-test" style="
        display: flex;
        flex-direction: column;
        min-height: 200px;
        border: 1px solid #ccc;
      ">
        <div style="flex: 0 0 auto; background: red; height: 50px;">Header</div>
        <div style="flex: 1 1 auto; background: blue;">Content</div>
        <div style="flex: 0 0 auto; background: green; height: 50px;">Footer</div>
      </div>
    `);

    const flexContainer = page.locator('#flex-test');
    const flexItems = flexContainer.locator('> div');

    // Check container styles
    const containerStyles = await flexContainer.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        flexDirection: computed.flexDirection,
        minHeight: computed.minHeight,
      };
    });

    expect(containerStyles.display).toBe('flex');
    expect(containerStyles.flexDirection).toBe('column');
    expect(containerStyles.minHeight).toBe('200px');

    // Check flex item properties
    const itemCount = await flexItems.count();
    for (let i = 0; i < itemCount; i++) {
      const item = flexItems.nth(i);
      const itemStyles = await item.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          flex: computed.flex,
          flexGrow: computed.flexGrow,
          flexShrink: computed.flexShrink,
          flexBasis: computed.flexBasis,
        };
      });

      // Flex properties should be properly parsed
      expect(itemStyles.flexGrow).toBeDefined();
      expect(itemStyles.flexShrink).toBeDefined();
      expect(itemStyles.flexBasis).toBeDefined();
    }

    // Check layout result
    const containerBox = await flexContainer.boundingBox();
    const itemBoxes = await Promise.all(
      Array.from({ length: itemCount }, (_, i) => flexItems.nth(i).boundingBox())
    );

    if (containerBox && itemBoxes.every(box => box !== null)) {
      // Middle item should expand to fill space
      const middleItem = itemBoxes[1]!;
      expect(middleItem.height).toBeGreaterThan(50); // Should be larger than fixed items
    }
  });

  test('CSS containment support @firefox-containment', async ({ page }) => {
    // Test CSS containment support (performance optimization)
    const containmentTest = await page.evaluate(() => {
      const testEl = document.createElement('div');
      testEl.style.contain = 'layout style paint';
      document.body.appendChild(testEl);

      const computed = window.getComputedStyle(testEl);
      const contain = computed.contain;

      document.body.removeChild(testEl);

      return {
        contain,
        supportsContainment: contain !== 'none' && contain !== '',
      };
    });

    console.log(`Firefox CSS containment support: ${containmentTest.supportsContainment}`);

    // Test dashboard widgets for containment
    const widgets = page.locator('.dashboard-card, [data-testid="dashboard-widget"]');
    const widgetCount = await widgets.count();

    for (let i = 0; i < Math.min(widgetCount, 3); i++) {
      const widget = widgets.nth(i);
      const containStyles = await widget.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          contain: computed.contain,
          isolation: computed.isolation,
        };
      });

      // Containment might be applied for performance
      if (containStyles.contain && containStyles.contain !== 'none') {
        console.log(`Widget ${i} has containment: ${containStyles.contain}`);
      }
    }
  });

  test('Image optimization and loading @firefox-images', async ({ page }) => {
    // Firefox image handling and optimization
    await page.setContent(`
      <div style="padding: 20px;">
        <img id="test-img" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='blue'/%3E%3C/svg%3E"
             alt="Test image"
             loading="lazy"
             style="width: 100px; height: 100px;">
        <picture id="test-picture">
          <source media="(min-width: 800px)" srcset="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='100'%3E%3Crect width='200' height='100' fill='red'/%3E%3C/svg%3E">
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='green'/%3E%3C/svg%3E"
               alt="Responsive image"
               style="width: 100px; height: 100px;">
        </picture>
      </div>
    `);

    const testImg = page.locator('#test-img');
    const testPicture = page.locator('#test-picture img');

    // Check image loading
    await testImg.waitFor({ state: 'visible' });
    await testPicture.waitFor({ state: 'visible' });

    const imgProps = await testImg.evaluate((el: HTMLImageElement) => ({
      complete: el.complete,
      naturalWidth: el.naturalWidth,
      naturalHeight: el.naturalHeight,
      loading: el.loading,
      currentSrc: el.currentSrc,
    }));

    expect(imgProps.complete).toBeTruthy();
    expect(imgProps.naturalWidth).toBeGreaterThan(0);
    expect(imgProps.naturalHeight).toBeGreaterThan(0);

    // Check picture element
    const pictureProps = await testPicture.evaluate((el: HTMLImageElement) => ({
      complete: el.complete,
      currentSrc: el.currentSrc,
    }));

    expect(pictureProps.complete).toBeTruthy();

    // Check computed styles
    const imgStyles = await testImg.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        width: computed.width,
        height: computed.height,
        objectFit: computed.objectFit,
      };
    });

    expect(imgStyles.width).toBe('100px');
    expect(imgStyles.height).toBe('100px');
  });

  test('Form element styling and validation @firefox-forms', async ({ page }) => {
    // Firefox form element behavior
    await page.setContent(`
      <form style="padding: 20px;">
        <input type="email" id="email-input" placeholder="Email" required
               style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
        <input type="number" id="number-input" min="0" max="100" placeholder="Number"
               style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
        <select id="select-input" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
          <option value="">Choose...</option>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </select>
        <button type="submit" style="padding: 8px 16px; background: blue; color: white; border: none; border-radius: 4px;">
          Submit
        </button>
      </form>
    `);

    const emailInput = page.locator('#email-input');
    const numberInput = page.locator('#number-input');
    const selectInput = page.locator('#select-input');

    // Test form validation
    await emailInput.fill('invalid-email');
    await numberInput.fill('150'); // Above max

    // Check validation state
    const emailValidity = await emailInput.evaluate((el: HTMLInputElement) => ({
      valid: el.validity.valid,
      valueMissing: el.validity.valueMissing,
      typeMismatch: el.validity.typeMismatch,
      validationMessage: el.validationMessage,
    }));

    const numberValidity = await numberInput.evaluate((el: HTMLInputElement) => ({
      valid: el.validity.valid,
      rangeOverflow: el.validity.rangeOverflow,
      validationMessage: el.validationMessage,
    }));

    expect(emailValidity.valid).toBeFalsy();
    expect(emailValidity.typeMismatch).toBeTruthy();

    expect(numberValidity.valid).toBeFalsy();
    expect(numberValidity.rangeOverflow).toBeTruthy();

    // Test styling preservation
    const inputStyles = await emailInput.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        padding: computed.padding,
        borderRadius: computed.borderRadius,
        border: computed.border,
      };
    });

    expect(inputStyles.padding).toMatch(/8px/);
    expect(inputStyles.borderRadius).toBe('4px');

    // Test select element
    await selectInput.selectOption('1');
    const selectedValue = await selectInput.inputValue();
    expect(selectedValue).toBe('1');
  });

  test('Animation and transition performance @firefox-animations', async ({ page }) => {
    // Firefox animation performance characteristics
    await page.setContent(`
      <div style="padding: 20px;">
        <div id="css-animation" style="
          width: 100px;
          height: 100px;
          background: red;
          animation: bounce 1s ease-in-out;
        "></div>
        <div id="css-transition" style="
          width: 100px;
          height: 100px;
          background: blue;
          transition: transform 0.3s ease, background-color 0.3s ease;
          margin-top: 20px;
        "></div>
      </div>

      <style>
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      </style>
    `);

    const animationEl = page.locator('#css-animation');
    const transitionEl = page.locator('#css-transition');

    // Check animation properties
    const animationStyles = await animationEl.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        animationName: computed.animationName,
        animationDuration: computed.animationDuration,
        animationTimingFunction: computed.animationTimingFunction,
        animationPlayState: computed.animationPlayState,
      };
    });

    expect(animationStyles.animationName).toBe('bounce');
    expect(animationStyles.animationDuration).toBe('1s');

    // Test transition
    await transitionEl.evaluate((el) => {
      el.style.transform = 'scale(1.5)';
      el.style.backgroundColor = 'green';
    });

    await page.waitForTimeout(100);

    const transitionStyles = await transitionEl.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        transform: computed.transform,
        backgroundColor: computed.backgroundColor,
        transitionProperty: computed.transitionProperty,
        transitionDuration: computed.transitionDuration,
      };
    });

    expect(transitionStyles.transform).toContain('scale');
    expect(transitionStyles.backgroundColor).toContain('green');
    expect(transitionStyles.transitionDuration).toBe('0.3s');
  });

  test('WebP and modern image format support @firefox-webp', async ({ page }) => {
    // Firefox WebP support
    const webpSupport = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;

      return canvas.toDataURL('image/webp').indexOf('image/webp') !== -1;
    });

    console.log(`Firefox WebP support: ${webpSupport}`);

    // Test WebP image if supported
    if (webpSupport) {
      await page.setContent(`
        <img id="webp-test" src="data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA"
             alt="WebP test" style="width: 50px; height: 50px;">
      `);

      const webpImg = page.locator('#webp-test');
      await webpImg.waitFor({ state: 'visible' });

      const imgProps = await webpImg.evaluate((el: HTMLImageElement) => ({
        complete: el.complete,
        naturalWidth: el.naturalWidth,
        naturalHeight: el.naturalHeight,
      }));

      expect(imgProps.complete).toBeTruthy();
      expect(imgProps.naturalWidth).toBeGreaterThan(0);
    }
  });

  test('Print styles and media queries @firefox-print', async ({ page }) => {
    // Firefox print media query handling
    await page.setContent(`
      <div id="print-test" style="
        color: blue;
        background: yellow;
        padding: 20px;
      ">
        Print test content
      </div>

      <style>
        @media print {
          #print-test {
            color: black !important;
            background: white !important;
            font-size: 12pt;
          }
        }

        @media screen {
          #print-test {
            border: 2px solid red;
          }
        }
      </style>
    `);

    const printEl = page.locator('#print-test');

    // Check screen styles
    const screenStyles = await printEl.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        border: computed.border,
      };
    });

    expect(screenStyles.color).toBeTruthy();
    expect(screenStyles.backgroundColor).toBeTruthy();
    expect(screenStyles.border).toContain('red');

    // Emulate print media
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(100);

    const printStyles = await printEl.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        fontSize: computed.fontSize,
      };
    });

    // Print styles should be applied
    expect(printStyles.color).toContain('rgb(0, 0, 0)'); // black
    expect(printStyles.backgroundColor).toContain('rgb(255, 255, 255)'); // white

    // Reset to screen
    await page.emulateMedia({ media: 'screen' });
  });
});