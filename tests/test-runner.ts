#!/usr/bin/env ts-node

/**
 * Test Runner for Claude Flow Dagger
 * Orchestrates different test suites based on environment and configuration
 */

import { execa } from 'execa';
import * as fs from 'fs';
import * as path from 'path';

interface TestSuite {
  name: string;
  pattern: string;
  envFlag?: string;
  description: string;
  timeout?: number;
  requiredEnv?: string[];
}

const testSuites: TestSuite[] = [
  {
    name: 'unit',
    pattern: 'tests/unit/**/*.test.ts',
    description: 'Unit tests for core functionality',
    timeout: 120000
  },
  {
    name: 'integration',
    pattern: 'tests/integration/**/*.test.ts',
    envFlag: 'INTEGRATION_TESTS',
    description: 'Integration tests with real Dagger containers',
    timeout: 300000,
    requiredEnv: ['INTEGRATION_TESTS']
  },
  {
    name: 'docker',
    pattern: 'tests/docker/**/*.test.ts',
    envFlag: 'DOCKER_TESTS',
    description: 'Docker image validation tests',
    timeout: 900000,
    requiredEnv: ['DOCKER_TESTS']
  },
  {
    name: 'security',
    pattern: 'tests/security/**/*.test.ts',
    envFlag: 'SECURITY_TESTS',
    description: 'Security scanning and vulnerability tests',
    timeout: 600000,
    requiredEnv: ['SECURITY_TESTS']
  },
  {
    name: 'performance',
    pattern: 'tests/performance/**/*.test.ts',
    envFlag: 'PERFORMANCE_TESTS',
    description: 'Performance and benchmarking tests',
    timeout: 600000,
    requiredEnv: ['PERFORMANCE_TESTS']
  },
  {
    name: 'e2e',
    pattern: 'tests/e2e/**/*.test.ts',
    envFlag: 'E2E_TESTS',
    description: 'End-to-end complete workflow tests',
    timeout: 1200000,
    requiredEnv: ['E2E_TESTS', 'CLAUDE_API_KEY']
  },
  {
    name: 'cicd',
    pattern: 'tests/ci-cd/**/*.test.ts',
    envFlag: 'CICD_TESTS',
    description: 'CI/CD pipeline integration tests',
    timeout: 600000,
    requiredEnv: ['CICD_TESTS', 'CI']
  }
];

class TestRunner {
  private results: Array<{
    suite: string;
    success: boolean;
    duration: number;
    error?: string;
  }> = [];

  async run() {
    console.log('🚀 Claude Flow Dagger Test Runner');
    console.log('=====================================\n');

    const args = process.argv.slice(2);
    const suitesToRun = this.determineSuitesToRun(args);

    if (suitesToRun.length === 0) {
      console.log('No test suites to run. Available suites:');
      this.listAvailableSuites();
      return;
    }

    console.log(`Running ${suitesToRun.length} test suite(s):\n`);

    for (const suite of suitesToRun) {
      await this.runSuite(suite);
    }

    this.generateReport();
    this.exitWithCode();
  }

  private determineSuitesToRun(args: string[]): TestSuite[] {
    // If specific suites requested
    if (args.length > 0) {
      return testSuites.filter(suite => args.includes(suite.name));
    }

    // Auto-detect based on environment
    return testSuites.filter(suite => {
      if (!suite.requiredEnv) return true; // Always run suites without requirements
      
      return suite.requiredEnv.every(envVar => {
        const value = process.env[envVar];
        return value && value.toLowerCase() === 'true';
      });
    });
  }

  private async runSuite(suite: TestSuite): Promise<void> {
    console.log(`\n📦 Running ${suite.name} tests`);
    console.log(`Description: ${suite.description}`);
    
    if (suite.requiredEnv) {
      console.log(`Required env: ${suite.requiredEnv.join(', ')}`);
    }

    console.log(`Pattern: ${suite.pattern}`);
    console.log('─'.repeat(50));

    const startTime = Date.now();

    try {
      // Check if test files exist
      const testFiles = await this.findTestFiles(suite.pattern);
      if (testFiles.length === 0) {
        console.log(`⚠️  No test files found for pattern: ${suite.pattern}`);
        this.results.push({
          suite: suite.name,
          success: false,
          duration: Date.now() - startTime,
          error: 'No test files found'
        });
        return;
      }

      console.log(`Found ${testFiles.length} test file(s)`);

      // Run Jest with specific pattern
      const jestArgs = [
        '--testPathPattern', suite.pattern,
        '--verbose',
        '--no-cache'
      ];

      if (suite.timeout) {
        jestArgs.push('--testTimeout', suite.timeout.toString());
      }

      // Set environment variable if specified
      const env = { ...process.env };
      if (suite.envFlag) {
        env[suite.envFlag] = 'true';
      }

      const { exitCode, stdout, stderr } = await execa('npx', ['jest', ...jestArgs], {
        env,
        timeout: (suite.timeout || 300000) + 30000, // Add 30s buffer
        reject: false
      });

      const duration = Date.now() - startTime;
      const success = exitCode === 0;

      console.log(`\n${success ? '✅' : '❌'} ${suite.name} tests ${success ? 'PASSED' : 'FAILED'}`);
      console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);

      if (!success) {
        console.log('\nTest output:');
        console.log(stdout);
        if (stderr) {
          console.log('\nErrors:');
          console.log(stderr);
        }
      }

      this.results.push({
        suite: suite.name,
        success,
        duration,
        error: success ? undefined : stderr || 'Tests failed'
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`\n❌ ${suite.name} tests FAILED (error)`);
      console.log(`Error: ${error}`);
      
      this.results.push({
        suite: suite.name,
        success: false,
        duration,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async findTestFiles(pattern: string): Promise<string[]> {
    try {
      const { stdout } = await execa('find', ['.', '-path', `*/${pattern}`], {
        reject: false
      });
      return stdout.split('\n').filter(file => file.trim() && file.endsWith('.test.ts'));
    } catch {
      // Fallback to glob pattern matching
      const glob = pattern.replace('**/', '');
      try {
        const { stdout } = await execa('find', ['.', '-name', glob], {
          reject: false
        });
        return stdout.split('\n').filter(file => file.trim() && file.includes('tests/'));
      } catch {
        return [];
      }
    }
  }

  private listAvailableSuites(): void {
    console.log('\n📋 Available test suites:');
    testSuites.forEach(suite => {
      const envStatus = suite.requiredEnv 
        ? suite.requiredEnv.every(env => process.env[env] === 'true') ? '✅' : '❌'
        : '✅';
      
      console.log(`  ${envStatus} ${suite.name.padEnd(12)} - ${suite.description}`);
      
      if (suite.requiredEnv) {
        console.log(`      ${''.padEnd(12)}   Requires: ${suite.requiredEnv.join(', ')}`);
      }
    });

    console.log('\n💡 Usage:');
    console.log('  npm test                    # Run all available suites');
    console.log('  npm run test:unit          # Run unit tests only');
    console.log('  npm run test:integration   # Run integration tests');
    console.log('  npm run test:all           # Run all suites (requires all env vars)');
    console.log('\n🔧 Environment variables:');
    console.log('  INTEGRATION_TESTS=true     # Enable integration tests');
    console.log('  DOCKER_TESTS=true         # Enable Docker tests');
    console.log('  SECURITY_TESTS=true       # Enable security tests');
    console.log('  PERFORMANCE_TESTS=true    # Enable performance tests');
    console.log('  E2E_TESTS=true            # Enable end-to-end tests');
    console.log('  CICD_TESTS=true           # Enable CI/CD tests');
    console.log('  CLAUDE_API_KEY=<key>      # Required for E2E tests');
  }

  private generateReport(): void {
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    const successCount = this.results.filter(r => r.success).length;
    const failureCount = this.results.length - successCount;

    console.log('\n\n📊 Test Results Summary');
    console.log('========================');
    console.log(`Total suites: ${this.results.length}`);
    console.log(`Passed: ${successCount}`);
    console.log(`Failed: ${failureCount}`);
    console.log(`Duration: ${(totalDuration / 1000).toFixed(2)}s`);

    console.log('\n📋 Details:');
    this.results.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      const duration = `${(result.duration / 1000).toFixed(2)}s`;
      console.log(`  ${status} ${result.suite.padEnd(12)} (${duration})`);
      
      if (!result.success && result.error) {
        console.log(`       ${result.error.split('\n')[0]}`);
      }
    });

    // Generate JSON report
    const reportPath = path.join(process.cwd(), 'test-results.json');
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        passed: successCount,
        failed: failureCount,
        duration: totalDuration
      },
      results: this.results,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        ci: process.env.CI || false
      }
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  private exitWithCode(): void {
    const hasFailures = this.results.some(r => !r.success);
    process.exit(hasFailures ? 1 : 0);
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.run().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export default TestRunner;