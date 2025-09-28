/**
 * Baseline Management System for Visual Regression Testing
 * Utilities for managing and comparing baseline screenshots
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export interface BaselineMetadata {
  version: string;
  timestamp: string;
  branch: string;
  commit: string;
  environment: {
    os: string;
    browser: string;
    viewport: string;
  };
  checksum: string;
}

export interface BaselineComparison {
  baseline: string;
  current: string;
  diff?: string;
  similarity: number;
  pixelDifference: number;
  isSignificant: boolean;
}

export class BaselineManager {
  private baselineDir: string;
  private metadataDir: string;

  constructor(baseDir: string = 'tests/visual/test-results/visual-snapshots') {
    this.baselineDir = baseDir;
    this.metadataDir = path.join(baseDir, '.metadata');
  }

  /**
   * Initialize baseline management directories
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.baselineDir, { recursive: true });
    await fs.mkdir(this.metadataDir, { recursive: true });
  }

  /**
   * Generate checksum for an image file
   */
  private async generateChecksum(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  /**
   * Get current git information
   */
  private getCurrentGitInfo(): { branch: string; commit: string } {
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
      const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      return { branch, commit };
    } catch (error) {
      return { branch: 'unknown', commit: 'unknown' };
    }
  }

  /**
   * Create metadata for a baseline image
   */
  async createMetadata(
    imagePath: string,
    browser: string,
    viewport: string
  ): Promise<BaselineMetadata> {
    const checksum = await this.generateChecksum(imagePath);
    const gitInfo = this.getCurrentGitInfo();

    const metadata: BaselineMetadata = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      branch: gitInfo.branch,
      commit: gitInfo.commit,
      environment: {
        os: process.platform,
        browser,
        viewport,
      },
      checksum,
    };

    const metadataPath = path.join(
      this.metadataDir,
      path.basename(imagePath, '.png') + '.json'
    );

    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    return metadata;
  }

  /**
   * Get metadata for a baseline image
   */
  async getMetadata(imageName: string): Promise<BaselineMetadata | null> {
    try {
      const metadataPath = path.join(this.metadataDir, imageName + '.json');
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      return JSON.parse(metadataContent);
    } catch (error) {
      return null;
    }
  }

  /**
   * List all available baselines
   */
  async listBaselines(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.baselineDir);
      return files
        .filter(file => file.endsWith('.png'))
        .map(file => path.basename(file, '.png'));
    } catch (error) {
      return [];
    }
  }

  /**
   * Copy baseline from one environment to another
   */
  async copyBaseline(
    sourceName: string,
    targetName: string,
    newBrowser: string,
    newViewport: string
  ): Promise<void> {
    const sourcePath = path.join(this.baselineDir, sourceName + '.png');
    const targetPath = path.join(this.baselineDir, targetName + '.png');

    await fs.copyFile(sourcePath, targetPath);

    // Update metadata for new environment
    await this.createMetadata(targetPath, newBrowser, newViewport);
  }

  /**
   * Archive old baselines
   */
  async archiveBaselines(olderThanDays: number = 30): Promise<void> {
    const archiveDir = path.join(this.baselineDir, '.archive');
    await fs.mkdir(archiveDir, { recursive: true });

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const files = await fs.readdir(this.baselineDir);

    for (const file of files) {
      if (!file.endsWith('.png')) continue;

      const filePath = path.join(this.baselineDir, file);
      const stats = await fs.stat(filePath);

      if (stats.mtime < cutoffDate) {
        const archivePath = path.join(archiveDir, file);
        await fs.rename(filePath, archivePath);

        // Archive metadata too
        const metadataFile = path.basename(file, '.png') + '.json';
        const metadataPath = path.join(this.metadataDir, metadataFile);
        const archiveMetadataPath = path.join(archiveDir, metadataFile);

        try {
          await fs.rename(metadataPath, archiveMetadataPath);
        } catch (error) {
          // Metadata might not exist, ignore
        }
      }
    }
  }

  /**
   * Validate baseline integrity
   */
  async validateBaselines(): Promise<Array<{ name: string; issues: string[] }>> {
    const results: Array<{ name: string; issues: string[] }> = [];
    const baselines = await this.listBaselines();

    for (const baseline of baselines) {
      const issues: string[] = [];
      const imagePath = path.join(this.baselineDir, baseline + '.png');
      const metadata = await this.getMetadata(baseline);

      // Check if image file exists
      try {
        await fs.access(imagePath);
      } catch (error) {
        issues.push('Image file missing');
        continue;
      }

      // Check metadata exists
      if (!metadata) {
        issues.push('Metadata missing');
      } else {
        // Verify checksum
        const currentChecksum = await this.generateChecksum(imagePath);
        if (currentChecksum !== metadata.checksum) {
          issues.push('Checksum mismatch - image may have been modified');
        }

        // Check for old baselines
        const age = Date.now() - new Date(metadata.timestamp).getTime();
        const ageInDays = age / (1000 * 60 * 60 * 24);
        if (ageInDays > 90) {
          issues.push(`Baseline is ${Math.round(ageInDays)} days old`);
        }
      }

      if (issues.length > 0) {
        results.push({ name: baseline, issues });
      }
    }

    return results;
  }

  /**
   * Generate baseline report
   */
  async generateReport(): Promise<{
    totalBaselines: number;
    byBrowser: Record<string, number>;
    byEnvironment: Record<string, number>;
    issues: Array<{ name: string; issues: string[] }>;
    oldestBaseline: string | null;
    newestBaseline: string | null;
  }> {
    const baselines = await this.listBaselines();
    const byBrowser: Record<string, number> = {};
    const byEnvironment: Record<string, number> = {};
    let oldestDate = new Date();
    let newestDate = new Date(0);
    let oldestBaseline: string | null = null;
    let newestBaseline: string | null = null;

    for (const baseline of baselines) {
      const metadata = await this.getMetadata(baseline);
      if (metadata) {
        // Count by browser
        byBrowser[metadata.environment.browser] =
          (byBrowser[metadata.environment.browser] || 0) + 1;

        // Count by environment
        const envKey = `${metadata.environment.os}-${metadata.environment.browser}-${metadata.environment.viewport}`;
        byEnvironment[envKey] = (byEnvironment[envKey] || 0) + 1;

        // Track oldest and newest
        const timestamp = new Date(metadata.timestamp);
        if (timestamp < oldestDate) {
          oldestDate = timestamp;
          oldestBaseline = baseline;
        }
        if (timestamp > newestDate) {
          newestDate = timestamp;
          newestBaseline = baseline;
        }
      }
    }

    const issues = await this.validateBaselines();

    return {
      totalBaselines: baselines.length,
      byBrowser,
      byEnvironment,
      issues,
      oldestBaseline,
      newestBaseline,
    };
  }

  /**
   * Clean up unused baselines
   */
  async cleanup(): Promise<{ removed: string[]; kept: string[] }> {
    const removed: string[] = [];
    const kept: string[] = [];

    // Get list of test files to determine which baselines are still needed
    const testFiles = await this.getTestFiles();
    const expectedBaselines = this.extractExpectedBaselines(testFiles);

    const existingBaselines = await this.listBaselines();

    for (const baseline of existingBaselines) {
      if (!expectedBaselines.includes(baseline)) {
        // This baseline is no longer used by any test
        const imagePath = path.join(this.baselineDir, baseline + '.png');
        const metadataPath = path.join(this.metadataDir, baseline + '.json');

        try {
          await fs.unlink(imagePath);
          removed.push(baseline);
        } catch (error) {
          // File might not exist
        }

        try {
          await fs.unlink(metadataPath);
        } catch (error) {
          // Metadata might not exist
        }
      } else {
        kept.push(baseline);
      }
    }

    return { removed, kept };
  }

  /**
   * Get all test files that might contain screenshot expectations
   */
  private async getTestFiles(): Promise<string[]> {
    const testDir = path.dirname(this.baselineDir);
    const testFiles: string[] = [];

    async function scanDirectory(dir: string): Promise<void> {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          await scanDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.spec.ts')) {
          testFiles.push(fullPath);
        }
      }
    }

    await scanDirectory(testDir);
    return testFiles;
  }

  /**
   * Extract expected baseline names from test files
   */
  private extractExpectedBaselines(testFiles: string[]): string[] {
    const expectedBaselines: string[] = [];

    for (const testFile of testFiles) {
      try {
        const content = require('fs').readFileSync(testFile, 'utf8');

        // Look for screenshot calls
        const screenshotMatches = content.match(/toHaveScreenshot\(['"`]([^'"`]+)['"`]\)/g);
        if (screenshotMatches) {
          for (const match of screenshotMatches) {
            const nameMatch = match.match(/toHaveScreenshot\(['"`]([^'"`]+)['"`]\)/);
            if (nameMatch) {
              const baseName = nameMatch[1].replace('.png', '');
              expectedBaselines.push(baseName);
            }
          }
        }

        // Look for takeScreenshot calls
        const takeScreenshotMatches = content.match(/takeScreenshot\(\s*\{[^}]*name:\s*['"`]([^'"`]+)['"`]/g);
        if (takeScreenshotMatches) {
          for (const match of takeScreenshotMatches) {
            const nameMatch = match.match(/name:\s*['"`]([^'"`]+)['"`]/);
            if (nameMatch) {
              expectedBaselines.push(nameMatch[1]);
            }
          }
        }
      } catch (error) {
        // Error reading file, skip
      }
    }

    return [...new Set(expectedBaselines)]; // Remove duplicates
  }
}

// CLI interface for baseline management
if (require.main === module) {
  const manager = new BaselineManager();

  async function main() {
    const command = process.argv[2];

    switch (command) {
      case 'init':
        await manager.initialize();
        console.log('Baseline management initialized');
        break;

      case 'list':
        const baselines = await manager.listBaselines();
        console.log('Available baselines:');
        baselines.forEach(name => console.log(`  ${name}`));
        break;

      case 'validate':
        const validation = await manager.validateBaselines();
        if (validation.length === 0) {
          console.log('✅ All baselines are valid');
        } else {
          console.log('❌ Issues found:');
          validation.forEach(({ name, issues }) => {
            console.log(`  ${name}:`);
            issues.forEach(issue => console.log(`    - ${issue}`));
          });
        }
        break;

      case 'report':
        const report = await manager.generateReport();
        console.log('Baseline Report:');
        console.log(`  Total baselines: ${report.totalBaselines}`);
        console.log(`  By browser: ${JSON.stringify(report.byBrowser, null, 2)}`);
        console.log(`  Oldest: ${report.oldestBaseline}`);
        console.log(`  Newest: ${report.newestBaseline}`);
        if (report.issues.length > 0) {
          console.log(`  Issues: ${report.issues.length}`);
        }
        break;

      case 'cleanup':
        const cleanupResult = await manager.cleanup();
        console.log(`Removed ${cleanupResult.removed.length} unused baselines`);
        console.log(`Kept ${cleanupResult.kept.length} baselines`);
        break;

      case 'archive':
        const days = parseInt(process.argv[3]) || 30;
        await manager.archiveBaselines(days);
        console.log(`Archived baselines older than ${days} days`);
        break;

      default:
        console.log('Usage: node baseline-management.js <command>');
        console.log('Commands:');
        console.log('  init      - Initialize baseline management');
        console.log('  list      - List all baselines');
        console.log('  validate  - Validate baseline integrity');
        console.log('  report    - Generate baseline report');
        console.log('  cleanup   - Remove unused baselines');
        console.log('  archive   - Archive old baselines');
    }
  }

  main().catch(console.error);
}