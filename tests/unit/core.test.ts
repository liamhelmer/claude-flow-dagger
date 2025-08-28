import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { ClaudeFlowDagger } from '../../src/dagger/core.js';
import { dag } from '@dagger.io/dagger';

// Mock the Dagger SDK
jest.mock('@dagger.io/dagger');

const mockDag = dag as jest.Mocked<typeof dag>;

describe('ClaudeFlowDagger Core', () => {
  let claudeFlow: ClaudeFlowDagger;
  let mockContainer: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock container chain
    mockContainer = {
      from: jest.fn().mockReturnThis(),
      withWorkdir: jest.fn().mockReturnThis(),
      withExec: jest.fn().mockReturnThis(),
      withEnvVariable: jest.fn().mockReturnThis(),
      withSecretVariable: jest.fn().mockReturnThis(),
      withDirectory: jest.fn().mockReturnThis(),
      stdout: jest.fn().mockResolvedValue('mocked output')
    };

    mockDag.container.mockReturnValue(mockContainer);
    mockDag.host.mockReturnValue({
      directory: jest.fn().mockReturnValue('mocked-directory')
    });
    mockDag.setSecret.mockReturnValue('mocked-secret' as any);

    claudeFlow = new ClaudeFlowDagger(global.testUtils.createMockConfig());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    test('should initialize with default configuration', () => {
      const cf = new ClaudeFlowDagger();
      
      expect(mockDag.container).toHaveBeenCalled();
      expect(mockContainer.from).toHaveBeenCalledWith('node:18-alpine');
      expect(mockContainer.withWorkdir).toHaveBeenCalledWith('/workspace');
      expect(mockContainer.withExec).toHaveBeenCalledWith(['npm', 'install', '-g', 'claude-flow@alpha']);
    });

    test('should set environment variables from config', () => {
      const config = {
        apiKey: 'test-key',
        modelName: 'claude-3-opus-20240229',
        maxTokens: 8192,
        temperature: 0.5,
        timeout: 600000,
        retries: 5,
        enableHooks: false,
        enableMemory: false,
        enableNeural: false
      };

      new ClaudeFlowDagger(config);

      expect(mockContainer.withEnvVariable).toHaveBeenCalledWith('CLAUDE_API_KEY', 'test-key');
      expect(mockContainer.withEnvVariable).toHaveBeenCalledWith('CLAUDE_MODEL', 'claude-3-opus-20240229');
      expect(mockContainer.withEnvVariable).toHaveBeenCalledWith('CLAUDE_MAX_TOKENS', '8192');
      expect(mockContainer.withEnvVariable).toHaveBeenCalledWith('CLAUDE_TEMPERATURE', '0.5');
      expect(mockContainer.withEnvVariable).toHaveBeenCalledWith('CLAUDE_TIMEOUT', '600000');
      expect(mockContainer.withEnvVariable).toHaveBeenCalledWith('CLAUDE_RETRIES', '5');
      expect(mockContainer.withEnvVariable).toHaveBeenCalledWith('CLAUDE_ENABLE_HOOKS', 'false');
      expect(mockContainer.withEnvVariable).toHaveBeenCalledWith('CLAUDE_ENABLE_MEMORY', 'false');
      expect(mockContainer.withEnvVariable).toHaveBeenCalledWith('CLAUDE_ENABLE_NEURAL', 'false');
    });

    test('should use custom working directory', () => {
      new ClaudeFlowDagger({}, '/custom/workspace');
      
      expect(mockContainer.withWorkdir).toHaveBeenCalledWith('/custom/workspace');
    });
  });

  describe('Container Configuration Methods', () => {
    test('withSource should mount source directory', () => {
      const result = claudeFlow.withSource('/local/source');
      
      expect(mockDag.host().directory).toHaveBeenCalledWith('/local/source');
      expect(mockContainer.withDirectory).toHaveBeenCalledWith('/workspace', 'mocked-directory');
      expect(result).toBe(claudeFlow); // Should return this for chaining
    });

    test('withEnvVariable should set environment variable', () => {
      const result = claudeFlow.withEnvVariable('TEST_VAR', 'test-value');
      
      expect(mockContainer.withEnvVariable).toHaveBeenCalledWith('TEST_VAR', 'test-value');
      expect(result).toBe(claudeFlow);
    });

    test('withSecret should set secret variable', () => {
      const result = claudeFlow.withSecret('SECRET_KEY', 'secret-value');
      
      expect(mockDag.setSecret).toHaveBeenCalledWith('SECRET_KEY', 'secret-value');
      expect(mockContainer.withSecretVariable).toHaveBeenCalledWith('SECRET_KEY', 'mocked-secret');
      expect(result).toBe(claudeFlow);
    });
  });

  describe('Command Execution', () => {
    test('exec should execute claude-flow command successfully', async () => {
      mockContainer.stdout.mockResolvedValue('  command output  ');
      
      const result = await claudeFlow.exec(['test', 'command']);
      
      expect(mockContainer.withExec).toHaveBeenCalledWith(['npx', 'claude-flow', 'test', 'command']);
      expect(result).toEqual({
        success: true,
        data: 'command output',
        stdout: 'command output',
        exitCode: 0
      });
    });

    test('exec should handle command execution errors', async () => {
      const error = new Error('Command failed');
      mockContainer.stdout.mockRejectedValue(error);
      
      const result = await claudeFlow.exec(['failing', 'command']);
      
      expect(result).toEqual({
        success: false,
        error: 'Command failed',
        exitCode: 1
      });
    });

    test('exec should handle non-Error rejections', async () => {
      mockContainer.stdout.mockRejectedValue('String error');
      
      const result = await claudeFlow.exec(['failing', 'command']);
      
      expect(result).toEqual({
        success: false,
        error: 'String error',
        exitCode: 1
      });
    });
  });

  describe('SPARC Methods', () => {
    test('initSparc should execute init command with sparc flag', async () => {
      mockContainer.stdout.mockResolvedValue('SPARC initialized');
      
      const result = await claudeFlow.initSparc();
      
      expect(mockContainer.withExec).toHaveBeenCalledWith(['npx', 'claude-flow', 'init', '--sparc']);
      expect(result.success).toBe(true);
      expect(result.data).toBe('SPARC initialized');
    });

    test('listSparcModes should parse mode list', async () => {
      mockContainer.stdout.mockResolvedValue(`• Available modes:
spec-pseudocode
architect
integration
backend-dev`);
      
      const result = await claudeFlow.listSparcModes();
      
      expect(mockContainer.withExec).toHaveBeenCalledWith(['npx', 'claude-flow', 'sparc', 'modes']);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(['spec-pseudocode', 'architect', 'integration', 'backend-dev']);
    });

    test('getSparcModeInfo should get mode information', async () => {
      mockContainer.stdout.mockResolvedValue('Mode info for architect');
      
      const result = await claudeFlow.getSparcModeInfo('architect');
      
      expect(mockContainer.withExec).toHaveBeenCalledWith(['npx', 'claude-flow', 'sparc', 'info', 'architect']);
      expect(result.success).toBe(true);
      expect(result.data).toBe('Mode info for architect');
    });

    test('runSparcMode should execute specific mode', async () => {
      mockContainer.stdout.mockResolvedValue('Mode executed');
      
      const result = await claudeFlow.runSparcMode('backend-dev', 'create api');
      
      expect(mockContainer.withExec).toHaveBeenCalledWith(['npx', 'claude-flow', 'sparc', 'run', 'backend-dev', 'create api']);
      expect(result.success).toBe(true);
    });

    test('runTdd should execute TDD workflow', async () => {
      mockContainer.stdout.mockResolvedValue('TDD workflow started');
      
      const result = await claudeFlow.runTdd('user authentication');
      
      expect(mockContainer.withExec).toHaveBeenCalledWith(['npx', 'claude-flow', 'sparc', 'tdd', 'user authentication']);
      expect(result.success).toBe(true);
    });

    test('batchSparc should execute multiple modes', async () => {
      mockContainer.stdout.mockResolvedValue('Batch execution complete');
      
      const result = await claudeFlow.batchSparc(['architect', 'backend-dev'], 'build system');
      
      expect(mockContainer.withExec).toHaveBeenCalledWith(['npx', 'claude-flow', 'sparc', 'batch', 'architect,backend-dev', 'build system']);
      expect(result.success).toBe(true);
    });

    test('runSparcPipeline should execute full pipeline', async () => {
      mockContainer.stdout.mockResolvedValue('Pipeline complete');
      
      const result = await claudeFlow.runSparcPipeline('complete system');
      
      expect(mockContainer.withExec).toHaveBeenCalledWith(['npx', 'claude-flow', 'sparc', 'pipeline', 'complete system']);
      expect(result.success).toBe(true);
    });
  });

  describe('Swarm Management', () => {
    test('initSwarm should initialize with minimal config', async () => {
      mockContainer.stdout.mockResolvedValue('Swarm initialized');
      
      const config = { topology: 'mesh' as const };
      const result = await claudeFlow.initSwarm(config);
      
      expect(mockContainer.withExec).toHaveBeenCalledWith(['npx', 'claude-flow', 'swarm', 'init', '--topology', 'mesh']);
      expect(result.success).toBe(true);
    });

    test('initSwarm should handle full configuration', async () => {
      mockContainer.stdout.mockResolvedValue('Swarm initialized');
      
      const config = global.testUtils.createMockSwarmConfig();
      const result = await claudeFlow.initSwarm(config);
      
      expect(mockContainer.withExec).toHaveBeenCalledWith([
        'npx', 'claude-flow', 'swarm', 'init',
        '--topology', 'mesh',
        '--max-agents', '10',
        '--session-id', 'test-session',
        '--enable-metrics',
        '--auto-heal',
        '--parallel-tasks', '5'
      ]);
      expect(result.success).toBe(true);
    });

    test('spawnAgent should spawn agent with minimal config', async () => {
      mockContainer.stdout.mockResolvedValue('Agent spawned');
      
      const result = await claudeFlow.spawnAgent('coder');
      
      expect(mockContainer.withExec).toHaveBeenCalledWith(['npx', 'claude-flow', 'agent', 'spawn', 'coder']);
      expect(result.success).toBe(true);
    });

    test('spawnAgent should spawn agent with full config', async () => {
      mockContainer.stdout.mockResolvedValue('Agent spawned');
      
      const config = {
        id: 'agent-1',
        priority: 'high' as const,
        timeout: 600000,
        retries: 3
      };
      
      const result = await claudeFlow.spawnAgent('tester', config);
      
      expect(mockContainer.withExec).toHaveBeenCalledWith([
        'npx', 'claude-flow', 'agent', 'spawn', 'tester',
        '--id', 'agent-1',
        '--priority', 'high',
        '--timeout', '600000',
        '--retries', '3'
      ]);
      expect(result.success).toBe(true);
    });

    test('orchestrateTask should orchestrate task', async () => {
      mockContainer.stdout.mockResolvedValue('Task orchestrated');
      
      const task = global.testUtils.createMockTaskConfig();
      task.dependencies = ['dep-1', 'dep-2'];
      
      const result = await claudeFlow.orchestrateTask(task);
      
      expect(mockContainer.withExec).toHaveBeenCalledWith([
        'npx', 'claude-flow', 'task', 'orchestrate',
        '--id', 'test-task-1',
        '--description', 'Test task description',
        '--agent', 'coder',
        '--priority', 'medium',
        '--timeout', '300000',
        '--retries', '2',
        '--dependencies', 'dep-1,dep-2'
      ]);
      expect(result.success).toBe(true);
    });
  });

  describe('Status and Monitoring', () => {
    test('getSwarmStatus should parse JSON response', async () => {
      const mockStatus = {
        sessionId: 'session-1',
        topology: 'mesh',
        activeAgents: 5,
        runningTasks: 3,
        completedTasks: 10,
        failedTasks: 1,
        uptime: 3600,
        metrics: {}
      };
      
      mockContainer.stdout.mockResolvedValue(JSON.stringify(mockStatus));
      
      const result = await claudeFlow.getSwarmStatus();
      
      expect(mockContainer.withExec).toHaveBeenCalledWith(['npx', 'claude-flow', 'swarm', 'status', '--format', 'json']);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStatus);
    });

    test('getSwarmStatus should handle JSON parse error', async () => {
      mockContainer.stdout.mockResolvedValue('invalid json');
      
      const result = await claudeFlow.getSwarmStatus();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to parse swarm status JSON');
    });

    test('listAgents should parse agents list', async () => {
      const mockAgents = ['coder', 'tester', 'reviewer'];
      mockContainer.stdout.mockResolvedValue(JSON.stringify(mockAgents));
      
      const result = await claudeFlow.listAgents();
      
      expect(mockContainer.withExec).toHaveBeenCalledWith(['npx', 'claude-flow', 'agent', 'list', '--format', 'json']);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAgents);
    });
  });

  describe('Memory Operations', () => {
    test('memoryStore should store data', async () => {
      mockContainer.stdout.mockResolvedValue('Data stored');
      
      const result = await claudeFlow.memoryStore('key1', { data: 'value' }, 3600);
      
      expect(mockContainer.withExec).toHaveBeenCalledWith([
        'npx', 'claude-flow', 'memory', 'store', 'key1', '{"data":"value"}', '--ttl', '3600'
      ]);
      expect(result.success).toBe(true);
    });

    test('memoryRetrieve should retrieve and parse data', async () => {
      const mockEntry = {
        key: 'key1',
        value: { data: 'value' },
        timestamp: '2025-08-28T10:00:00Z',
        metadata: {}
      };
      
      mockContainer.stdout.mockResolvedValue(JSON.stringify(mockEntry));
      
      const result = await claudeFlow.memoryRetrieve('key1');
      
      expect(mockContainer.withExec).toHaveBeenCalledWith(['npx', 'claude-flow', 'memory', 'retrieve', 'key1', '--format', 'json']);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEntry);
    });

    test('memoryDelete should delete data', async () => {
      mockContainer.stdout.mockResolvedValue('Data deleted');
      
      const result = await claudeFlow.memoryDelete('key1');
      
      expect(mockContainer.withExec).toHaveBeenCalledWith(['npx', 'claude-flow', 'memory', 'delete', 'key1']);
      expect(result.success).toBe(true);
    });

    test('memoryList should list keys with pattern', async () => {
      const mockKeys = ['key1', 'key2', 'key3'];
      mockContainer.stdout.mockResolvedValue(JSON.stringify(mockKeys));
      
      const result = await claudeFlow.memoryList('key*');
      
      expect(mockContainer.withExec).toHaveBeenCalledWith(['npx', 'claude-flow', 'memory', 'list', '--pattern', 'key*', '--format', 'json']);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockKeys);
    });
  });

  describe('Batch Operations', () => {
    test('batch should execute operations in parallel', async () => {
      const operations = [
        () => claudeFlow.initSparc(),
        () => claudeFlow.listSparcModes(),
        () => claudeFlow.getSwarmStatus()
      ];

      // Mock successful responses
      mockContainer.stdout
        .mockResolvedValueOnce('SPARC initialized')
        .mockResolvedValueOnce('spec-pseudocode\narchitect')
        .mockResolvedValueOnce('{"sessionId":"test"}');

      const result = await claudeFlow.batch(operations);

      expect(result.totalTasks).toBe(3);
      expect(result.successfulTasks).toBe(3);
      expect(result.failedTasks).toBe(0);
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
      expect(typeof result.duration).toBe('number');
    });

    test('batch should handle mixed success/failure results', async () => {
      const operations = [
        () => claudeFlow.initSparc(),
        () => claudeFlow.listSparcModes()
      ];

      // Mock one success, one failure
      mockContainer.stdout
        .mockResolvedValueOnce('SPARC initialized')
        .mockRejectedValueOnce(new Error('Command failed'));

      const result = await claudeFlow.batch(operations);

      expect(result.totalTasks).toBe(2);
      expect(result.successfulTasks).toBe(1);
      expect(result.failedTasks).toBe(1);
      expect(result.success).toBe(false);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(false);
    });
  });

  describe('Utility Methods', () => {
    test('getContainer should return container instance', () => {
      const container = claudeFlow.getContainer();
      expect(container).toBe(mockContainer);
    });

    test('getWorkingDirectory should return working directory', () => {
      const workdir = claudeFlow.getWorkingDirectory();
      expect(workdir).toBe('/workspace');
    });

    test('getConfig should return configuration', () => {
      const config = claudeFlow.getConfig();
      expect(config).toEqual(global.testUtils.createMockConfig());
    });
  });
});