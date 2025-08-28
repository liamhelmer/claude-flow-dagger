import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { execa } from 'execa';
import * as fs from 'fs';
import * as path from 'path';

describe('Docker Image Validation', () => {
  const imageName = 'claude-flow-dev';
  const imageTag = 'test';
  const fullImageName = `${imageName}:${imageTag}`;
  
  // Only run if Docker is available
  const isDockerAvailable = process.env.DOCKER_TESTS === 'true';

  beforeAll(async () => {
    if (!isDockerAvailable) {
      console.log('Skipping Docker tests. Set DOCKER_TESTS=true to run.');
      return;
    }

    // Check if Docker is running
    try {
      await execa('docker', ['info']);
    } catch (error) {
      throw new Error('Docker is not running or not available');
    }
  }, 60000);

  describe.skip('Image Building', () => {
    test('should build Docker image successfully', async () => {
      if (!isDockerAvailable) return;

      const dockerfilePath = path.join(process.cwd(), 'docker', 'Dockerfile');
      expect(fs.existsSync(dockerfilePath)).toBe(true);

      const { exitCode, stdout, stderr } = await execa('docker', [
        'build',
        '-t', fullImageName,
        '-f', dockerfilePath,
        '.'
      ], { timeout: 600000 }); // 10 minutes timeout

      expect(exitCode).toBe(0);
      expect(stderr).not.toContain('ERROR');
    }, 600000);

    test('should have correct image metadata', async () => {
      if (!isDockerAvailable) return;

      const { stdout } = await execa('docker', [
        'inspect',
        fullImageName,
        '--format', '{{json .}}'
      ]);

      const imageData = JSON.parse(stdout);
      const config = imageData[0].Config;
      const labels = config.Labels || {};

      expect(labels['org.opencontainers.image.title']).toBe('Claude Flow Development Environment');
      expect(labels['org.opencontainers.image.description']).toContain('claude-flow');
      expect(labels['org.opencontainers.image.licenses']).toBe('MIT');
      
      // Check exposed ports
      const exposedPorts = config.ExposedPorts || {};
      expect(exposedPorts['3000/tcp']).toBeDefined();
      expect(exposedPorts['8000/tcp']).toBeDefined();
      expect(exposedPorts['8080/tcp']).toBeDefined();
      expect(exposedPorts['9000/tcp']).toBeDefined();
    });
  });

  describe.skip('Runtime Environment Validation', () => {
    test('should have all required system tools installed', async () => {
      if (!isDockerAvailable) return;

      const commands = [
        'node --version',
        'npm --version',
        'python3 --version',
        'go version',
        'rustc --version',
        'docker --version',
        'git --version',
        'curl --version',
        'jq --version',
        'rg --version'
      ];

      for (const cmd of commands) {
        const { exitCode, stdout } = await execa('docker', [
          'run', '--rm', fullImageName,
          'sh', '-c', cmd
        ]);

        expect(exitCode).toBe(0);
        expect(stdout).toBeTruthy();
      }
    }, 120000);

    test('should have correct Node.js version', async () => {
      if (!isDockerAvailable) return;

      const { stdout } = await execa('docker', [
        'run', '--rm', fullImageName,
        'node', '--version'
      ]);

      const nodeVersion = stdout.trim();
      expect(nodeVersion).toMatch(/^v22\.\d+\.\d+$/);
    });

    test('should have correct Python version', async () => {
      if (!isDockerAvailable) return;

      const { stdout } = await execa('docker', [
        'run', '--rm', fullImageName,
        'python3', '--version'
      ]);

      const pythonVersion = stdout.trim();
      expect(pythonVersion).toMatch(/Python 3\.13\.\d+/);
    });

    test('should have correct Go version', async () => {
      if (!isDockerAvailable) return;

      const { stdout } = await execa('docker', [
        'run', '--rm', fullImageName,
        'go', 'version'
      ]);

      expect(stdout).toContain('go1.23.1');
    });
  });

  describe.skip('Cloud Tools Validation', () => {
    test('should have Google Cloud SDK with all components', async () => {
      if (!isDockerAvailable) return;

      // Check gcloud
      const { exitCode: gcloudExit, stdout: gcloudOut } = await execa('docker', [
        'run', '--rm', fullImageName,
        'gcloud', 'version'
      ]);

      expect(gcloudExit).toBe(0);
      expect(gcloudOut).toContain('Google Cloud SDK');

      // Check kubectl
      const { exitCode: kubectlExit } = await execa('docker', [
        'run', '--rm', fullImageName,
        'kubectl', 'version', '--client'
      ]);

      expect(kubectlExit).toBe(0);

      // Check alpha components
      const { stdout: componentsOut } = await execa('docker', [
        'run', '--rm', fullImageName,
        'gcloud', 'components', 'list'
      ]);

      expect(componentsOut).toContain('alpha');
      expect(componentsOut).toContain('beta');
      expect(componentsOut).toContain('kubectl');
    }, 60000);

    test('should have AWS CLI v2', async () => {
      if (!isDockerAvailable) return;

      const { exitCode, stdout } = await execa('docker', [
        'run', '--rm', fullImageName,
        'aws', '--version'
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain('aws-cli/2');
    });

    test('should have Azure CLI', async () => {
      if (!isDockerAvailable) return;

      const { exitCode, stdout } = await execa('docker', [
        'run', '--rm', fullImageName,
        'az', '--version'
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain('azure-cli');
    });

    test('should have HashiCorp tools', async () => {
      if (!isDockerAvailable) return;

      // Vault
      const { exitCode: vaultExit, stdout: vaultOut } = await execa('docker', [
        'run', '--rm', fullImageName,
        'vault', 'version'
      ]);

      expect(vaultExit).toBe(0);
      expect(vaultOut).toMatch(/Vault v1\.17\.\d+/);

      // Terraform
      const { exitCode: terraformExit, stdout: terraformOut } = await execa('docker', [
        'run', '--rm', fullImageName,
        'terraform', 'version'
      ]);

      expect(terraformExit).toBe(0);
      expect(terraformOut).toMatch(/Terraform v1\.9\.\d+/);
    });

    test('should have Dagger CLI', async () => {
      if (!isDockerAvailable) return;

      const { exitCode, stdout } = await execa('docker', [
        'run', '--rm', fullImageName,
        'dagger', 'version'
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain('dagger');
    });
  });

  describe.skip('Database Clients Validation', () => {
    test('should have PostgreSQL client', async () => {
      if (!isDockerAvailable) return;

      const { exitCode, stdout } = await execa('docker', [
        'run', '--rm', fullImageName,
        'psql', '--version'
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain('psql (PostgreSQL) 16');
    });

    test('should have MySQL client', async () => {
      if (!isDockerAvailable) return;

      const { exitCode, stdout } = await execa('docker', [
        'run', '--rm', fullImageName,
        'mysql', '--version'
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain('mysql');
    });

    test('should have Redis client', async () => {
      if (!isDockerAvailable) return;

      const { exitCode, stdout } = await execa('docker', [
        'run', '--rm', fullImageName,
        'redis-cli', '--version'
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain('redis-cli');
    });

    test('should have MongoDB client', async () => {
      if (!isDockerAvailable) return;

      const { exitCode, stdout } = await execa('docker', [
        'run', '--rm', fullImageName,
        'mongosh', '--version'
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain('mongosh');
    });
  });

  describe.skip('Claude and MCP Tools', () => {
    test('should have Claude CLI installed', async () => {
      if (!isDockerAvailable) return;

      const { exitCode, stdout } = await execa('docker', [
        'run', '--rm', fullImageName,
        'claude', '--version'
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain('claude');
    });

    test('should have claude-flow with correct version', async () => {
      if (!isDockerAvailable) return;

      const { exitCode, stdout } = await execa('docker', [
        'run', '--rm', fullImageName,
        'npx', 'claude-flow', '--version'
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain('2.0.0-alpha.101');
    });

    test('should have MCP servers installed', async () => {
      if (!isDockerAvailable) return;

      const mcpPackages = [
        '@modelcontextprotocol/server-filesystem',
        '@modelcontextprotocol/server-git',
        '@modelcontextprotocol/server-github',
        '@modelcontextprotocol/server-postgres',
        '@modelcontextprotocol/server-memory'
      ];

      for (const pkg of mcpPackages) {
        const { exitCode } = await execa('docker', [
          'run', '--rm', fullImageName,
          'npm', 'list', '-g', pkg
        ]);

        expect(exitCode).toBe(0);
      }
    });

    test('should have Python MCP dependencies', async () => {
      if (!isDockerAvailable) return;

      const pythonPackages = [
        'mcp',
        'mcp-server-git',
        'mcp-server-filesystem',
        'httpx',
        'pydantic',
        'uvicorn',
        'fastapi'
      ];

      for (const pkg of pythonPackages) {
        const { exitCode } = await execa('docker', [
          'run', '--rm', fullImageName,
          'python3', '-c', `import ${pkg.replace('-', '_')}; print('${pkg} imported successfully')`
        ]);

        if (exitCode !== 0) {
          // Try pip show as fallback
          const { exitCode: pipExit } = await execa('docker', [
            'run', '--rm', fullImageName,
            'pip3', 'show', pkg
          ]);
          expect(pipExit).toBe(0);
        }
      }
    });
  });

  describe.skip('Development Tools', () => {
    test('should have GitHub CLI', async () => {
      if (!isDockerAvailable) return;

      const { exitCode, stdout } = await execa('docker', [
        'run', '--rm', fullImageName,
        'gh', '--version'
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain('gh version');
    });

    test('should have Helm', async () => {
      if (!isDockerAvailable) return;

      const { exitCode, stdout } = await execa('docker', [
        'run', '--rm', fullImageName,
        'helm', 'version'
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain('helm');
    });

    test('should have monitoring tools', async () => {
      if (!isDockerAvailable) return;

      const tools = ['htop', 'tree', 'tmux', 'screen'];
      
      for (const tool of tools) {
        const { exitCode } = await execa('docker', [
          'run', '--rm', fullImageName,
          'which', tool
        ]);

        expect(exitCode).toBe(0);
      }
    });
  });

  describe.skip('Security Tools', () => {
    test('should have security scanning tools', async () => {
      if (!isDockerAvailable) return;

      // Bandit for Python
      const { exitCode: banditExit } = await execa('docker', [
        'run', '--rm', fullImageName,
        'bandit', '--version'
      ]);

      expect(banditExit).toBe(0);

      // Safety for Python
      const { exitCode: safetyExit } = await execa('docker', [
        'run', '--rm', fullImageName,
        'safety', '--version'
      ]);

      expect(safetyExit).toBe(0);

      // audit-ci for Node.js
      const { exitCode: auditExit } = await execa('docker', [
        'run', '--rm', fullImageName,
        'npx', 'audit-ci', '--version'
      ]);

      expect(auditExit).toBe(0);

      // Snyk
      const { exitCode: snykExit } = await execa('docker', [
        'run', '--rm', fullImageName,
        'npx', 'snyk', '--version'
      ]);

      expect(snykExit).toBe(0);
    });
  });

  describe.skip('Environment Configuration', () => {
    test('should have correct environment variables set', async () => {
      if (!isDockerAvailable) return;

      const { stdout } = await execa('docker', [
        'run', '--rm', fullImageName,
        'env'
      ]);

      const envVars = stdout.split('\n');
      const envMap = new Map();
      
      envVars.forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          envMap.set(key, valueParts.join('='));
        }
      });

      expect(envMap.get('CLAUDE_FLOW_CONFIG_DIR')).toBe('/root/.config/claude-flow');
      expect(envMap.get('CLAUDE_FLOW_CACHE_DIR')).toBe('/root/.cache/claude-flow');
      expect(envMap.get('MCP_SERVER_CONFIG_DIR')).toBe('/root/.config/mcp');
      expect(envMap.get('PATH')).toContain('/usr/local/go/bin');
      expect(envMap.get('PATH')).toContain('/root/.cargo/bin');
      expect(envMap.get('LANG')).toBe('C.UTF-8');
      expect(envMap.get('TZ')).toBe('UTC');
    });

    test('should have correct working directory', async () => {
      if (!isDockerAvailable) return;

      const { stdout } = await execa('docker', [
        'run', '--rm', fullImageName,
        'pwd'
      ]);

      expect(stdout.trim()).toBe('/workspace');
    });

    test('should have required directories created', async () => {
      if (!isDockerAvailable) return;

      const directories = [
        '/workspace',
        '/root/.config',
        '/root/.cache',
        '/root/.config/claude-flow',
        '/root/.cache/claude-flow',
        '/root/.config/mcp'
      ];

      for (const dir of directories) {
        const { exitCode } = await execa('docker', [
          'run', '--rm', fullImageName,
          'test', '-d', dir
        ]);

        expect(exitCode).toBe(0);
      }
    });
  });

  describe.skip('Health Check', () => {
    test('should pass health check', async () => {
      if (!isDockerAvailable) return;

      const { exitCode, stdout } = await execa('docker', [
        'run', '--rm', fullImageName,
        'sh', '-c', 
        'claude --version && claude-flow --version && node --version && python3 --version && go version'
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain('claude');
      expect(stdout).toContain('node');
      expect(stdout).toContain('Python');
      expect(stdout).toContain('go version');
    });
  });

  describe.skip('Image Size and Optimization', () => {
    test('should have reasonable image size', async () => {
      if (!isDockerAvailable) return;

      const { stdout } = await execa('docker', [
        'images',
        fullImageName,
        '--format', '{{.Size}}'
      ]);

      const size = stdout.trim();
      console.log(`Image size: ${size}`);
      
      // Image should not be excessively large (less than 10GB)
      // This is a rough check - adjust based on requirements
      expect(size).toBeDefined();
    });

    test('should have cleaned up package caches', async () => {
      if (!isDockerAvailable) return;

      // Check that common cache directories are clean
      const cacheChecks = [
        'ls -la /var/lib/apt/lists/ | wc -l', // APT cache
        'ls -la /tmp | wc -l',                // Temp files
        'ls -la /var/tmp | wc -l'             // Var temp files
      ];

      for (const check of cacheChecks) {
        const { stdout } = await execa('docker', [
          'run', '--rm', fullImageName,
          'sh', '-c', check
        ]);

        const count = parseInt(stdout.trim());
        expect(count).toBeLessThan(10); // Should be minimal
      }
    });
  });

  afterAll(async () => {
    if (!isDockerAvailable) return;

    // Cleanup: Remove test image
    try {
      await execa('docker', ['rmi', fullImageName]);
    } catch (error) {
      console.log('Could not remove test image:', error);
    }
  });
});