import { describe, test, expect } from '@jest/globals';
import {
  SparceMode,
  AgentType,
  SwarmTopology,
  ClaudeFlowConfig,
  SwarmConfig,
  TaskConfig,
  MemoryConfig,
  GitHubConfig,
  TaskResult,
  SwarmStatus,
  MemoryEntry,
  NeuralStatus
} from '../../src/dagger/types.js';

describe('Types Validation', () => {
  describe('SparceMode', () => {
    test('should accept valid SPARC modes', () => {
      const validModes = [
        'spec-pseudocode',
        'architect', 
        'integration',
        'backend-dev',
        'mobile-dev',
        'ml-developer',
        'cicd-engineer',
        'api-docs',
        'system-architect',
        'code-analyzer',
        'base-template-generator'
      ];

      validModes.forEach(mode => {
        expect(() => SparceMode.parse(mode)).not.toThrow();
      });
    });

    test('should reject invalid SPARC modes', () => {
      const invalidModes = ['invalid-mode', 'unknown', ''];
      
      invalidModes.forEach(mode => {
        expect(() => SparceMode.parse(mode)).toThrow();
      });
    });
  });

  describe('AgentType', () => {
    test('should accept all valid agent types', () => {
      const validTypes = [
        'coder', 'reviewer', 'tester', 'planner', 'researcher',
        'hierarchical-coordinator', 'mesh-coordinator',
        'byzantine-coordinator', 'raft-manager',
        'github-modes', 'pr-manager', 'sparc-coord'
      ];

      validTypes.forEach(type => {
        expect(() => AgentType.parse(type)).not.toThrow();
      });
    });

    test('should reject invalid agent types', () => {
      const invalidTypes = ['invalid-agent', 'unknown-type', ''];
      
      invalidTypes.forEach(type => {
        expect(() => AgentType.parse(type)).toThrow();
      });
    });
  });

  describe('SwarmTopology', () => {
    test('should accept valid topologies', () => {
      const validTopologies = ['mesh', 'hierarchical', 'star', 'ring', 'adaptive'];
      
      validTopologies.forEach(topology => {
        expect(() => SwarmTopology.parse(topology)).not.toThrow();
      });
    });

    test('should reject invalid topologies', () => {
      expect(() => SwarmTopology.parse('invalid')).toThrow();
    });
  });

  describe('ClaudeFlowConfig', () => {
    test('should create config with default values', () => {
      const config = ClaudeFlowConfig.parse({});
      
      expect(config.modelName).toBe('claude-3-sonnet-20240229');
      expect(config.maxTokens).toBe(4096);
      expect(config.temperature).toBe(0.7);
      expect(config.timeout).toBe(300000);
      expect(config.retries).toBe(3);
      expect(config.enableHooks).toBe(true);
      expect(config.enableMemory).toBe(true);
      expect(config.enableNeural).toBe(true);
    });

    test('should validate temperature range', () => {
      expect(() => ClaudeFlowConfig.parse({ temperature: -0.1 })).toThrow();
      expect(() => ClaudeFlowConfig.parse({ temperature: 1.1 })).toThrow();
      expect(() => ClaudeFlowConfig.parse({ temperature: 0.5 })).not.toThrow();
    });

    test('should validate URL format for baseUrl', () => {
      expect(() => ClaudeFlowConfig.parse({ baseUrl: 'invalid-url' })).toThrow();
      expect(() => ClaudeFlowConfig.parse({ baseUrl: 'https://api.anthropic.com' })).not.toThrow();
    });
  });

  describe('SwarmConfig', () => {
    test('should create config with valid constraints', () => {
      const config = SwarmConfig.parse({
        topology: 'mesh',
        maxAgents: 25,
        parallelTasks: 10
      });
      
      expect(config.maxAgents).toBe(25);
      expect(config.parallelTasks).toBe(10);
      expect(config.enableMetrics).toBe(true);
      expect(config.autoHeal).toBe(true);
    });

    test('should enforce maxAgents limits', () => {
      expect(() => SwarmConfig.parse({ topology: 'mesh', maxAgents: 0 })).toThrow();
      expect(() => SwarmConfig.parse({ topology: 'mesh', maxAgents: 51 })).toThrow();
    });

    test('should enforce parallelTasks limits', () => {
      expect(() => SwarmConfig.parse({ topology: 'mesh', parallelTasks: 0 })).toThrow();
      expect(() => SwarmConfig.parse({ topology: 'mesh', parallelTasks: 21 })).toThrow();
    });
  });

  describe('TaskConfig', () => {
    test('should create valid task configuration', () => {
      const taskConfig = {
        id: 'task-1',
        description: 'Test task',
        agent: 'coder' as const,
        priority: 'high' as const,
        dependencies: ['task-0']
      };

      const result = TaskConfig.parse(taskConfig);
      expect(result.id).toBe('task-1');
      expect(result.priority).toBe('high');
      expect(result.dependencies).toEqual(['task-0']);
    });

    test('should use default values', () => {
      const minimal = {
        id: 'task-1',
        description: 'Test task',
        agent: 'coder' as const
      };

      const result = TaskConfig.parse(minimal);
      expect(result.priority).toBe('medium');
      expect(result.timeout).toBe(300000);
      expect(result.retries).toBe(2);
      expect(result.dependencies).toEqual([]);
      expect(result.metadata).toEqual({});
    });
  });

  describe('TaskResult', () => {
    test('should validate task result structure', () => {
      const taskResult = {
        taskId: 'task-1',
        status: 'completed' as const,
        result: { data: 'test' },
        startTime: '2025-08-28T10:00:00Z',
        endTime: '2025-08-28T10:05:00Z',
        duration: 300000
      };

      expect(() => TaskResult.parse(taskResult)).not.toThrow();
    });

    test('should require essential fields', () => {
      expect(() => TaskResult.parse({})).toThrow();
      expect(() => TaskResult.parse({ taskId: 'test' })).toThrow();
    });
  });

  describe('GitHubConfig', () => {
    test('should validate required GitHub fields', () => {
      const config = {
        token: 'github-token',
        owner: 'test-owner',
        repo: 'test-repo'
      };

      const result = GitHubConfig.parse(config);
      expect(result.baseBranch).toBe('main');
      expect(result.enableWebhooks).toBe(false);
      expect(result.enableActions).toBe(true);
    });

    test('should require token, owner, and repo', () => {
      expect(() => GitHubConfig.parse({})).toThrow();
      expect(() => GitHubConfig.parse({ token: 'test' })).toThrow();
      expect(() => GitHubConfig.parse({ token: 'test', owner: 'owner' })).toThrow();
    });
  });
});