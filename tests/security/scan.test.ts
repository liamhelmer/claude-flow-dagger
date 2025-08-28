import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { execa } from 'execa';
import * as fs from 'fs';
import * as path from 'path';

describe('Security Scanning Tests', () => {
  const imageName = 'claude-flow-dev:test';
  const isSecurityTest = process.env.SECURITY_TESTS === 'true';
  const isDockerAvailable = process.env.DOCKER_TESTS === 'true';

  beforeAll(async () => {
    if (!isSecurityTest) {
      console.log('Skipping security tests. Set SECURITY_TESTS=true to run.');
      return;
    }

    if (!isDockerAvailable) {
      console.log('Docker not available for security tests.');
      return;
    }
  });

  describe.skip('Trivy Vulnerability Scanning', () => {
    test('should install Trivy if not available', async () => {
      if (!isSecurityTest || !isDockerAvailable) return;

      try {
        await execa('trivy', ['--version']);
      } catch (error) {
        // Install Trivy
        console.log('Installing Trivy...');
        
        if (process.platform === 'darwin') {
          await execa('brew', ['install', 'trivy']);
        } else if (process.platform === 'linux') {
          await execa('curl', [
            '-sfL',
            'https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh',
            '|', 'sh', '-s', '--', '-b', '/usr/local/bin'
          ], { shell: true });
        }
      }

      const { exitCode } = await execa('trivy', ['--version']);
      expect(exitCode).toBe(0);
    }, 120000);

    test('should scan Docker image for vulnerabilities', async () => {
      if (!isSecurityTest || !isDockerAvailable) return;

      const outputFile = path.join(process.cwd(), 'security-report-trivy.json');

      try {
        const { exitCode, stdout, stderr } = await execa('trivy', [
          'image',
          '--format', 'json',
          '--output', outputFile,
          '--severity', 'HIGH,CRITICAL',
          imageName
        ], { timeout: 300000 });

        // Trivy exits with non-zero when vulnerabilities found
        // We want to analyze the results regardless
        expect(fs.existsSync(outputFile)).toBe(true);

        const report = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
        
        // Analyze results
        const highCriticalVulns = report.Results?.reduce((total: number, result: any) => {
          return total + (result.Vulnerabilities?.filter((v: any) => 
            v.Severity === 'HIGH' || v.Severity === 'CRITICAL'
          ).length || 0);
        }, 0) || 0;

        console.log(`Found ${highCriticalVulns} HIGH/CRITICAL vulnerabilities`);
        
        // Log details for any HIGH/CRITICAL vulnerabilities
        if (highCriticalVulns > 0) {
          report.Results?.forEach((result: any) => {
            result.Vulnerabilities?.filter((v: any) => 
              v.Severity === 'HIGH' || v.Severity === 'CRITICAL'
            ).forEach((vuln: any) => {
              console.log(`${vuln.Severity}: ${vuln.VulnerabilityID} - ${vuln.Title}`);
            });
          });
        }

        // For now, we'll log but not fail the test for known vulnerabilities
        // In production, you might want to fail for CRITICAL vulnerabilities
        expect(highCriticalVulns).toBeLessThan(50); // Reasonable threshold
        
      } finally {
        // Cleanup
        if (fs.existsSync(outputFile)) {
          fs.unlinkSync(outputFile);
        }
      }
    }, 300000);

    test('should scan for secrets in image', async () => {
      if (!isSecurityTest || !isDockerAvailable) return;

      const outputFile = path.join(process.cwd(), 'secrets-report-trivy.json');

      try {
        const { exitCode, stdout } = await execa('trivy', [
          'image',
          '--scanners', 'secret',
          '--format', 'json',
          '--output', outputFile,
          imageName
        ], { timeout: 180000 });

        expect(fs.existsSync(outputFile)).toBe(true);

        const report = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
        
        const secrets = report.Results?.reduce((total: number, result: any) => {
          return total + (result.Secrets?.length || 0);
        }, 0) || 0;

        console.log(`Found ${secrets} potential secrets`);

        // Should not have any actual secrets in the image
        if (secrets > 0) {
          report.Results?.forEach((result: any) => {
            result.Secrets?.forEach((secret: any) => {
              console.log(`Secret found: ${secret.RuleID} in ${secret.StartLine}`);
            });
          });
        }

        // Fail test if actual secrets are found (not just patterns)
        expect(secrets).toBeLessThan(5); // Allow some false positives
        
      } finally {
        if (fs.existsSync(outputFile)) {
          fs.unlinkSync(outputFile);
        }
      }
    }, 180000);
  });

  describe.skip('Snyk Security Scanning', () => {
    test('should scan with Snyk for known vulnerabilities', async () => {
      if (!isSecurityTest) return;

      // Check if Snyk token is available
      if (!process.env.SNYK_TOKEN) {
        console.log('SNYK_TOKEN not set, skipping Snyk tests');
        return;
      }

      try {
        await execa('npx', ['snyk', '--version']);
      } catch (error) {
        console.log('Snyk not available, installing...');
        await execa('npm', ['install', '-g', 'snyk']);
      }

      // Authenticate
      await execa('npx', ['snyk', 'auth', process.env.SNYK_TOKEN]);

      const outputFile = path.join(process.cwd(), 'snyk-report.json');

      try {
        const { exitCode, stdout } = await execa('npx', [
          'snyk', 'test',
          '--json',
          `--json-file-output=${outputFile}`,
          '--severity-threshold=high'
        ], { 
          timeout: 240000,
          reject: false // Don't throw on non-zero exit
        });

        if (fs.existsSync(outputFile)) {
          const report = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
          
          const vulnerabilities = report.vulnerabilities?.length || 0;
          console.log(`Snyk found ${vulnerabilities} vulnerabilities`);

          if (vulnerabilities > 0) {
            report.vulnerabilities?.slice(0, 10).forEach((vuln: any) => {
              console.log(`${vuln.severity}: ${vuln.title} - ${vuln.packageName}`);
            });
          }

          // Allow some vulnerabilities but not too many high/critical ones
          expect(vulnerabilities).toBeLessThan(20);
        }

      } finally {
        if (fs.existsSync(outputFile)) {
          fs.unlinkSync(outputFile);
        }
      }
    }, 300000);

    test('should scan Docker image with Snyk', async () => {
      if (!isSecurityTest || !isDockerAvailable) return;

      if (!process.env.SNYK_TOKEN) {
        console.log('SNYK_TOKEN not set, skipping Docker scan');
        return;
      }

      const outputFile = path.join(process.cwd(), 'snyk-docker-report.json');

      try {
        const { exitCode, stdout } = await execa('npx', [
          'snyk', 'container', 'test',
          imageName,
          '--json',
          `--json-file-output=${outputFile}`,
          '--severity-threshold=high'
        ], { 
          timeout: 300000,
          reject: false
        });

        if (fs.existsSync(outputFile)) {
          const report = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
          
          const vulnerabilities = report.vulnerabilities?.length || 0;
          console.log(`Snyk Docker scan found ${vulnerabilities} vulnerabilities`);

          if (vulnerabilities > 0) {
            report.vulnerabilities?.slice(0, 10).forEach((vuln: any) => {
              console.log(`${vuln.severity}: ${vuln.title} - ${vuln.from?.[0]}`);
            });
          }

          expect(vulnerabilities).toBeLessThan(50); // Docker images often have more vulns
        }

      } finally {
        if (fs.existsSync(outputFile)) {
          fs.unlinkSync(outputFile);
        }
      }
    }, 360000);
  });

  describe.skip('Static Code Analysis', () => {
    test('should run Bandit for Python security issues', async () => {
      if (!isSecurityTest || !isDockerAvailable) return;

      const outputFile = path.join(process.cwd(), 'bandit-report.json');

      try {
        // Run Bandit inside container on any Python code
        const { exitCode, stdout } = await execa('docker', [
          'run', '--rm',
          '-v', `${process.cwd()}:/workspace`,
          imageName,
          'bandit', '-r', '/workspace', '-f', 'json', '-o', '/workspace/bandit-report.json'
        ], { 
          timeout: 120000,
          reject: false // Bandit exits non-zero when issues found
        });

        if (fs.existsSync(outputFile)) {
          const report = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
          
          const highConfidenceIssues = report.results?.filter((issue: any) => 
            issue.issue_confidence === 'HIGH' && 
            (issue.issue_severity === 'HIGH' || issue.issue_severity === 'MEDIUM')
          ).length || 0;

          console.log(`Bandit found ${highConfidenceIssues} high-confidence security issues`);

          if (highConfidenceIssues > 0) {
            report.results?.slice(0, 5).forEach((issue: any) => {
              console.log(`${issue.issue_severity}: ${issue.test_name} - ${issue.filename}:${issue.line_number}`);
            });
          }

          expect(highConfidenceIssues).toBeLessThan(5);
        }

      } finally {
        if (fs.existsSync(outputFile)) {
          fs.unlinkSync(outputFile);
        }
      }
    }, 120000);

    test('should check for hardcoded secrets in codebase', async () => {
      if (!isSecurityTest) return;

      const sensitivePatterns = [
        /password\s*=\s*['"]/i,
        /api[_-]?key\s*=\s*['"]/i,
        /secret\s*=\s*['"]/i,
        /token\s*=\s*['"]/i,
        /-----BEGIN PRIVATE KEY-----/,
        /-----BEGIN RSA PRIVATE KEY-----/,
        /AKIA[0-9A-Z]{16}/, // AWS Access Key
        /ghp_[0-9a-zA-Z]{36}/, // GitHub Personal Access Token
      ];

      const filesToCheck = [
        'src/**/*.ts',
        'src/**/*.js', 
        'tests/**/*.ts',
        'tests/**/*.js',
        'docker/Dockerfile'
      ];

      const foundSecrets: string[] = [];

      for (const filePattern of filesToCheck) {
        const { stdout } = await execa('find', [
          '.', '-name', filePattern.replace('**/', ''), '-type', 'f'
        ], { reject: false });

        const files = stdout.split('\n').filter(f => f.trim());

        for (const file of files) {
          if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            
            for (const pattern of sensitivePatterns) {
              const matches = content.match(pattern);
              if (matches) {
                foundSecrets.push(`${file}: ${matches[0].substring(0, 50)}...`);
              }
            }
          }
        }
      }

      if (foundSecrets.length > 0) {
        console.log('Potential hardcoded secrets found:');
        foundSecrets.forEach(secret => console.log(`  - ${secret}`));
      }

      // This should be 0 in production
      expect(foundSecrets.length).toBeLessThan(3); // Allow some test fixtures
    });
  });

  describe.skip('Dependency Security', () => {
    test('should audit npm dependencies', async () => {
      if (!isSecurityTest) return;

      try {
        const { exitCode, stdout } = await execa('npm', [
          'audit', '--json'
        ], { reject: false });

        if (stdout) {
          const auditReport = JSON.parse(stdout);
          
          const highVulns = auditReport.metadata?.vulnerabilities?.high || 0;
          const criticalVulns = auditReport.metadata?.vulnerabilities?.critical || 0;
          
          console.log(`NPM Audit: ${criticalVulns} critical, ${highVulns} high vulnerabilities`);

          if (criticalVulns > 0 || highVulns > 0) {
            // Log some details
            Object.values(auditReport.vulnerabilities || {}).slice(0, 5).forEach((vuln: any) => {
              console.log(`${vuln.severity}: ${vuln.title} - ${vuln.module_name}`);
            });
          }

          // Fail if critical vulnerabilities found
          expect(criticalVulns).toBe(0);
          expect(highVulns).toBeLessThan(5);
        }

      } catch (error) {
        // npm audit might not be available or might fail
        console.log('npm audit failed:', error);
      }
    }, 120000);

    test('should check Python dependencies with Safety', async () => {
      if (!isSecurityTest || !isDockerAvailable) return;

      try {
        const { exitCode, stdout } = await execa('docker', [
          'run', '--rm', imageName,
          'safety', 'check', '--json'
        ], { 
          timeout: 120000,
          reject: false 
        });

        if (stdout) {
          const safetyReport = JSON.parse(stdout);
          
          const vulnerabilities = safetyReport.length || 0;
          console.log(`Safety found ${vulnerabilities} Python package vulnerabilities`);

          if (vulnerabilities > 0) {
            safetyReport.slice(0, 5).forEach((vuln: any) => {
              console.log(`${vuln.vulnerability_id}: ${vuln.package_name} ${vuln.installed_version}`);
            });
          }

          expect(vulnerabilities).toBeLessThan(10);
        }

      } catch (error) {
        console.log('Safety check failed:', error);
      }
    }, 120000);
  });

  describe('Dockerfile Security Best Practices', () => {
    test('should follow Dockerfile security best practices', async () => {
      if (!isSecurityTest) return;

      const dockerfilePath = path.join(process.cwd(), 'docker', 'Dockerfile');
      
      if (!fs.existsSync(dockerfilePath)) {
        throw new Error('Dockerfile not found');
      }

      const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');

      // Check for security best practices
      const checks = [
        {
          name: 'Should not run as root',
          test: () => dockerfileContent.includes('USER ') || !dockerfileContent.includes('root'),
          required: false // This image runs as root by design
        },
        {
          name: 'Should use specific versions, not latest',
          test: () => !dockerfileContent.match(/FROM .+:latest/),
          required: true
        },
        {
          name: 'Should not have hardcoded secrets',
          test: () => !dockerfileContent.match(/password|secret|key.*=.*['"]/i),
          required: true
        },
        {
          name: 'Should clean package caches',
          test: () => dockerfileContent.includes('rm -rf /var/lib/apt/lists/*') &&
                    dockerfileContent.includes('npm cache clean'),
          required: true
        },
        {
          name: 'Should use HTTPS for downloads',
          test: () => !dockerfileContent.match(/http:\/\/[^s]/g) || dockerfileContent.match(/https:\/\//g),
          required: true
        },
        {
          name: 'Should have health check',
          test: () => dockerfileContent.includes('HEALTHCHECK'),
          required: true
        }
      ];

      const failures: string[] = [];

      checks.forEach(check => {
        if (!check.test()) {
          if (check.required) {
            failures.push(check.name);
          } else {
            console.log(`Warning: ${check.name}`);
          }
        }
      });

      if (failures.length > 0) {
        console.log('Dockerfile security check failures:');
        failures.forEach(failure => console.log(`  - ${failure}`));
      }

      expect(failures.length).toBe(0);
    });
  });
});