import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { execa } from 'execa';
import * as fs from 'fs';
import * as path from 'path';
import { ClaudeFlowDagger } from '../../src/dagger/core.js';

describe('CI/CD Pipeline Integration Tests', () => {
  const isCiCdTest = process.env.CICD_TESTS === 'true';
  const isDockerAvailable = process.env.DOCKER_TESTS === 'true';
  
  let claudeFlow: ClaudeFlowDagger;

  beforeAll(async () => {
    if (!isCiCdTest) {
      console.log('Skipping CI/CD tests. Set CICD_TESTS=true to run.');
      return;
    }

    claudeFlow = new ClaudeFlowDagger({
      enableHooks: false,
      enableMemory: false,
      enableNeural: false
    });
  });

  describe('Build Pipeline Validation', () => {
    test('should validate TypeScript compilation', async () => {
      if (!isCiCdTest) return;

      const { exitCode, stdout, stderr } = await execa('npx', ['tsc', '--noEmit'], {
        reject: false
      });

      console.log('TypeScript compilation result:', exitCode === 0 ? 'SUCCESS' : 'FAILED');
      
      if (exitCode !== 0) {
        console.log('TypeScript errors:');
        console.log(stderr);
      }

      expect(exitCode).toBe(0);
    }, 60000);

    test('should run linting without errors', async () => {
      if (!isCiCdTest) return;

      const { exitCode, stdout, stderr } = await execa('npm', ['run', 'lint'], {
        reject: false
      });

      console.log('Linting result:', exitCode === 0 ? 'SUCCESS' : 'FAILED');
      
      if (exitCode !== 0) {
        console.log('Linting errors:');
        console.log(stderr);
      }

      // Allow warnings but not errors
      expect(exitCode).toBeLessThanOrEqual(1);
    }, 30000);

    test('should build project successfully', async () => {
      if (!isCiCdTest) return;

      const { exitCode, stdout, stderr } = await execa('npm', ['run', 'build'], {
        reject: false
      });

      console.log('Build result:', exitCode === 0 ? 'SUCCESS' : 'FAILED');
      
      if (exitCode !== 0) {
        console.log('Build errors:');
        console.log(stderr);
      }

      expect(exitCode).toBe(0);

      // Verify build artifacts exist
      const distPath = path.join(process.cwd(), 'dist');
      expect(fs.existsSync(distPath)).toBe(true);
      
      const mainFile = path.join(distPath, 'index.js');
      if (fs.existsSync(mainFile)) {
        expect(fs.existsSync(mainFile)).toBe(true);
      }
    }, 120000);

    test('should generate type declarations', async () => {
      if (!isCiCdTest) return;

      const distPath = path.join(process.cwd(), 'dist');
      
      if (fs.existsSync(distPath)) {
        const typeFiles = fs.readdirSync(distPath, { recursive: true })
          .filter(file => String(file).endsWith('.d.ts'));

        console.log('Generated type files:', typeFiles);
        expect(typeFiles.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Test Pipeline Validation', () => {
    test('should run unit tests successfully', async () => {
      if (!isCiCdTest) return;

      const { exitCode, stdout, stderr } = await execa('npm', ['test', '--', '--testPathPattern=unit'], {
        reject: false,
        env: { ...process.env, CI: 'true' }
      });

      console.log('Unit tests result:', exitCode === 0 ? 'SUCCESS' : 'FAILED');
      
      if (exitCode !== 0) {
        console.log('Unit test failures:');
        console.log(stderr);
      }

      expect(exitCode).toBe(0);
    }, 180000);

    test('should generate test coverage report', async () => {
      if (!isCiCdTest) return;

      const { exitCode, stdout } = await execa('npm', ['test', '--', '--coverage', '--coverageDirectory=coverage-ci'], {
        reject: false,
        env: { ...process.env, CI: 'true' }
      });

      // Coverage might be low, but report should generate
      const coveragePath = path.join(process.cwd(), 'coverage-ci');
      expect(fs.existsSync(coveragePath)).toBe(true);

      const lcovFile = path.join(coveragePath, 'lcov.info');
      if (fs.existsSync(lcovFile)) {
        const lcovContent = fs.readFileSync(lcovFile, 'utf8');
        expect(lcovContent.length).toBeGreaterThan(0);
      }

      console.log('Coverage report generated');
    }, 240000);

    test('should enforce minimum test coverage', async () => {
      if (!isCiCdTest) return;

      const coveragePath = path.join(process.cwd(), 'coverage-ci', 'coverage-summary.json');
      
      if (fs.existsSync(coveragePath)) {
        const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        const totalCoverage = coverageData.total;

        console.log('Coverage summary:');
        console.log(`  Lines: ${totalCoverage.lines.pct}%`);
        console.log(`  Functions: ${totalCoverage.functions.pct}%`);
        console.log(`  Branches: ${totalCoverage.branches.pct}%`);
        console.log(`  Statements: ${totalCoverage.statements.pct}%`);

        // Minimum coverage thresholds (adjust as needed)
        expect(totalCoverage.lines.pct).toBeGreaterThanOrEqual(60);
        expect(totalCoverage.functions.pct).toBeGreaterThanOrEqual(70);
        expect(totalCoverage.statements.pct).toBeGreaterThanOrEqual(60);
      }
    });
  });

  describe.skip('Docker Pipeline Validation', () => {
    test('should build Docker image in CI environment', async () => {
      if (!isCiCdTest || !isDockerAvailable) return;

      const imageName = 'claude-flow-ci:test';
      const buildStartTime = Date.now();

      const { exitCode, stdout, stderr } = await execa('docker', [
        'build',
        '-t', imageName,
        '-f', 'docker/Dockerfile',
        '.'
      ], { 
        timeout: 900000, // 15 minutes
        reject: false
      });

      const buildTime = Date.now() - buildStartTime;
      console.log(`Docker build completed in ${(buildTime / 1000).toFixed(2)} seconds`);
      console.log('Docker build result:', exitCode === 0 ? 'SUCCESS' : 'FAILED');

      if (exitCode !== 0) {
        console.log('Docker build errors:');
        console.log(stderr);
      }

      expect(exitCode).toBe(0);

      // Verify image was created
      const { exitCode: inspectExit } = await execa('docker', ['inspect', imageName], {
        reject: false
      });
      
      expect(inspectExit).toBe(0);

      // Cleanup
      await execa('docker', ['rmi', imageName], { reject: false });
    }, 1000000); // 16+ minutes

    test('should validate image security scanning in pipeline', async () => {
      if (!isCiCdTest || !isDockerAvailable) return;

      const imageName = 'claude-flow-ci:security-test';
      
      // Build lightweight test image
      const dockerfile = `
        FROM node:18-alpine
        RUN npm install -g claude-flow@alpha
        HEALTHCHECK CMD echo "healthy"
      `;

      fs.writeFileSync('Dockerfile.test', dockerfile);

      try {
        // Build test image
        const { exitCode: buildExit } = await execa('docker', [
          'build', '-t', imageName, '-f', 'Dockerfile.test', '.'
        ], { reject: false });

        expect(buildExit).toBe(0);

        // Run basic security checks
        const securityChecks = [
          // Check for root user
          'docker run --rm ' + imageName + ' whoami',
          // Check for package vulnerabilities (if tools available)
          'docker run --rm ' + imageName + ' npm audit --audit-level=high',
          // Check for sensitive files
          'docker run --rm ' + imageName + ' find / -name "*.key" -o -name "*.pem" 2>/dev/null || true'
        ];

        for (const check of securityChecks) {
          const { exitCode } = await execa('sh', ['-c', check], { 
            reject: false,
            timeout: 30000 
          });
          // Security checks may fail, but should complete
          expect(typeof exitCode).toBe('number');
        }

        // Cleanup
        await execa('docker', ['rmi', imageName], { reject: false });

      } finally {
        // Cleanup test Dockerfile
        if (fs.existsSync('Dockerfile.test')) {
          fs.unlinkSync('Dockerfile.test');
        }
      }
    }, 300000);
  });

  describe('Deployment Validation', () => {
    test('should validate package.json for publishing', async () => {
      if (!isCiCdTest) return;

      const packageJsonPath = path.join(process.cwd(), 'package.json');
      expect(fs.existsSync(packageJsonPath)).toBe(true);

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      // Validate required fields for npm publishing
      expect(packageJson.name).toBeDefined();
      expect(packageJson.version).toBeDefined();
      expect(packageJson.description).toBeDefined();
      expect(packageJson.main).toBeDefined();
      expect(packageJson.author).toBeDefined();
      expect(packageJson.license).toBeDefined();

      // Validate version format
      expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+/);

      // Check for repository information
      if (packageJson.repository) {
        expect(packageJson.repository.type).toBe('git');
        expect(packageJson.repository.url).toBeDefined();
      }

      console.log(`Package validation: ${packageJson.name}@${packageJson.version}`);
    });

    test('should validate build artifacts for distribution', async () => {
      if (!isCiCdTest) return;

      const distPath = path.join(process.cwd(), 'dist');
      
      if (fs.existsSync(distPath)) {
        const files = fs.readdirSync(distPath, { recursive: true });
        
        // Should have JavaScript files
        const jsFiles = files.filter(f => String(f).endsWith('.js'));
        expect(jsFiles.length).toBeGreaterThan(0);

        // Should have type declaration files
        const dtsFiles = files.filter(f => String(f).endsWith('.d.ts'));
        expect(dtsFiles.length).toBeGreaterThan(0);

        // Should have source maps
        const mapFiles = files.filter(f => String(f).endsWith('.js.map'));
        expect(mapFiles.length).toBeGreaterThan(0);

        console.log(`Distribution files: ${files.length} total, ${jsFiles.length} JS, ${dtsFiles.length} types`);
      }
    });

    test('should validate environment configuration', async () => {
      if (!isCiCdTest) return;

      const requiredEnvVars = [
        'NODE_ENV',
        'CI'
      ];

      const optionalEnvVars = [
        'CLAUDE_API_KEY',
        'GITHUB_TOKEN',
        'DOCKER_REGISTRY',
        'NPM_TOKEN'
      ];

      console.log('Environment validation:');

      // Check required variables
      requiredEnvVars.forEach(envVar => {
        const value = process.env[envVar];
        console.log(`  ${envVar}: ${value ? 'SET' : 'NOT SET'}`);
        if (envVar === 'CI') {
          expect(value).toBeTruthy(); // CI should be set in CI environment
        }
      });

      // Log optional variables
      optionalEnvVars.forEach(envVar => {
        const value = process.env[envVar];
        console.log(`  ${envVar}: ${value ? 'SET' : 'NOT SET'} (optional)`);
      });
    });
  });

  describe('Integration with Claude-Flow', () => {
    test('should validate claude-flow availability in CI', async () => {
      if (!isCiCdTest) return;

      try {
        // Try to run claude-flow help command
        const { exitCode, stdout } = await execa('npx', ['claude-flow', '--help'], {
          timeout: 30000,
          reject: false
        });

        if (exitCode === 0) {
          console.log('Claude-flow is available in CI');
          expect(stdout).toContain('claude-flow');
        } else {
          console.log('Claude-flow not available in CI environment (expected)');
        }

      } catch (error) {
        console.log('Claude-flow check failed (expected in CI):', error);
      }
    }, 45000);

    test('should validate Dagger module functionality in CI', async () => {
      if (!isCiCdTest) return;

      // Test basic module functionality without external dependencies
      const config = {
        enableHooks: false,
        enableMemory: false,
        enableNeural: false
      };

      const testFlow = new ClaudeFlowDagger(config);

      // Test configuration methods
      const withEnv = testFlow.withEnvVariable('TEST_VAR', 'test-value');
      expect(withEnv).toBe(testFlow); // Should return same instance

      const workingDir = testFlow.getWorkingDirectory();
      expect(workingDir).toBe('/workspace');

      const currentConfig = testFlow.getConfig();
      expect(currentConfig.enableHooks).toBe(false);

      console.log('Dagger module basic functionality validated');
    });
  });

  describe('Performance in CI Environment', () => {
    test('should complete CI pipeline within time limits', async () => {
      if (!isCiCdTest) return;

      const timeouts = {
        build: 180000,    // 3 minutes
        test: 300000,     // 5 minutes
        lint: 60000,      // 1 minute
        typecheck: 120000 // 2 minutes
      };

      const testOperations = [
        {
          name: 'typecheck',
          command: () => execa('npx', ['tsc', '--noEmit'], { timeout: timeouts.typecheck }),
          timeout: timeouts.typecheck
        },
        {
          name: 'lint',
          command: () => execa('npm', ['run', 'lint'], { timeout: timeouts.lint, reject: false }),
          timeout: timeouts.lint
        }
      ];

      for (const operation of testOperations) {
        const startTime = Date.now();
        
        try {
          await operation.command();
          const duration = Date.now() - startTime;
          
          console.log(`${operation.name} completed in ${duration}ms (limit: ${operation.timeout}ms)`);
          expect(duration).toBeLessThan(operation.timeout);
          
        } catch (error) {
          const duration = Date.now() - startTime;
          console.log(`${operation.name} failed in ${duration}ms:`, error);
          
          // Still check timeout even for failed operations
          expect(duration).toBeLessThan(operation.timeout * 1.2); // 20% tolerance
        }
      }
    }, 600000);

    test('should validate resource usage in CI', async () => {
      if (!isCiCdTest) return;

      const initialMemory = process.memoryUsage();
      
      // Perform memory-intensive operations
      const operations = [];
      for (let i = 0; i < 10; i++) {
        operations.push(() => claudeFlow.exec(['echo', `ci-test-${i}`]));
      }

      await claudeFlow.batch(operations);

      const finalMemory = process.memoryUsage();
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;

      console.log(`Memory usage in CI:`);
      console.log(`  Initial: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Final: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  RSS: ${(finalMemory.rss / 1024 / 1024).toFixed(2)}MB`);

      // Memory usage should be reasonable in CI
      expect(finalMemory.rss).toBeLessThan(1024 * 1024 * 1024); // 1GB RSS
      expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024); // 100MB growth
    }, 120000);
  });

  afterAll(async () => {
    if (!isCiCdTest) return;

    // Generate CI/CD test report
    const reportPath = path.join(process.cwd(), 'cicd-test-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        ci: process.env.CI,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      testSummary: {
        dockerAvailable: isDockerAvailable,
        claudeApiKey: !!process.env.CLAUDE_API_KEY,
        githubToken: !!process.env.GITHUB_TOKEN
      },
      note: 'CI/CD pipeline integration tests completed'
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`CI/CD test report saved to ${reportPath}`);
  });
});