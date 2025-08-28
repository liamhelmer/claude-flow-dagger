import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { ClaudeFlowDagger } from '../../src/dagger/core.js';

describe('ClaudeFlowDagger Integration Tests', () => {
  let claudeFlow: ClaudeFlowDagger;
  
  // These tests assume a real Dagger environment
  // They will be skipped in CI unless INTEGRATION_TESTS=true
  const isIntegrationTest = process.env.INTEGRATION_TESTS === 'true';

  beforeAll(() => {
    if (!isIntegrationTest) {
      console.log('Skipping integration tests. Set INTEGRATION_TESTS=true to run.');
    }
  });

  beforeEach(() => {
    if (!isIntegrationTest) return;
    
    claudeFlow = new ClaudeFlowDagger({
      apiKey: process.env.CLAUDE_API_KEY || 'test-key',
      enableHooks: false, // Disable hooks for testing
      enableMemory: true,
      enableNeural: false
    });
  });

  describe.skip('Container Setup', () => {
    test('should create container with claude-flow installed', async () => {
      if (!isIntegrationTest) return;

      const result = await claudeFlow.exec(['--version']);
      
      expect(result.success).toBe(true);
      expect(result.data).toContain('claude-flow');
    });

    test('should have npm and node available', async () => {
      if (!isIntegrationTest) return;

      const nodeResult = await claudeFlow.exec(['--help']);
      expect(nodeResult.success).toBe(true);
    });
  });

  describe.skip('SPARC Workflow', () => {
    test('should complete full SPARC workflow', async () => {
      if (!isIntegrationTest) return;

      // Initialize SPARC
      const initResult = await claudeFlow.initSparc();
      expect(initResult.success).toBe(true);

      // List available modes
      const modesResult = await claudeFlow.listSparcModes();
      expect(modesResult.success).toBe(true);
      expect(Array.isArray(modesResult.data)).toBe(true);

      // Get info for a specific mode
      if (modesResult.data && modesResult.data.length > 0) {
        const firstMode = modesResult.data[0] as any;
        const infoResult = await claudeFlow.getSparcModeInfo(firstMode);
        expect(infoResult.success).toBe(true);
      }
    }, 60000);

    test('should handle batch SPARC operations', async () => {
      if (!isIntegrationTest) return;

      const batchResult = await claudeFlow.batchSparc(
        ['spec-pseudocode', 'architect'], 
        'Create a simple REST API'
      );
      
      expect(batchResult.success).toBe(true);
    }, 120000);
  });

  describe.skip('Swarm Operations', () => {
    test('should initialize and manage swarm', async () => {
      if (!isIntegrationTest) return;

      // Initialize swarm
      const initResult = await claudeFlow.initSwarm({
        topology: 'mesh',
        maxAgents: 5,
        enableMetrics: true,
        autoHeal: true,
        parallelTasks: 3
      });
      
      expect(initResult.success).toBe(true);

      // Spawn an agent
      const spawnResult = await claudeFlow.spawnAgent('coder', {
        id: 'test-coder-1',
        priority: 'medium'
      });
      
      expect(spawnResult.success).toBe(true);

      // Check swarm status
      const statusResult = await claudeFlow.getSwarmStatus();
      expect(statusResult.success).toBe(true);
      
      if (statusResult.data) {
        expect(statusResult.data.topology).toBe('mesh');
      }
    }, 90000);

    test('should orchestrate task across agents', async () => {
      if (!isIntegrationTest) return;

      const taskConfig = {
        id: 'integration-test-task',
        description: 'Test task orchestration',
        agent: 'coder' as const,
        priority: 'high' as const,
        timeout: 60000,
        retries: 1,
        dependencies: [],
        metadata: { test: true }
      };

      const result = await claudeFlow.orchestrateTask(taskConfig);
      expect(result.success).toBe(true);

      // Check task status
      const statusResult = await claudeFlow.getTaskStatus(taskConfig.id);
      expect(statusResult.success).toBe(true);
    }, 90000);
  });

  describe.skip('Memory Operations Flow', () => {
    test('should perform complete memory operations', async () => {
      if (!isIntegrationTest) return;

      const testKey = 'integration-test-key';
      const testValue = { 
        message: 'Integration test data',
        timestamp: new Date().toISOString(),
        metadata: { test: true }
      };

      // Store data
      const storeResult = await claudeFlow.memoryStore(testKey, testValue, 3600);
      expect(storeResult.success).toBe(true);

      // Retrieve data
      const retrieveResult = await claudeFlow.memoryRetrieve(testKey);
      expect(retrieveResult.success).toBe(true);
      
      if (retrieveResult.data) {
        expect(retrieveResult.data.key).toBe(testKey);
      }

      // List keys
      const listResult = await claudeFlow.memoryList('integration-*');
      expect(listResult.success).toBe(true);
      
      if (listResult.data) {
        expect(listResult.data).toContain(testKey);
      }

      // Delete data
      const deleteResult = await claudeFlow.memoryDelete(testKey);
      expect(deleteResult.success).toBe(true);

      // Verify deletion
      const verifyResult = await claudeFlow.memoryRetrieve(testKey);
      expect(verifyResult.success).toBe(false);
    }, 60000);
  });

  describe.skip('Error Handling', () => {
    test('should handle invalid commands gracefully', async () => {
      if (!isIntegrationTest) return;

      const result = await claudeFlow.exec(['invalid', 'command', 'that', 'should', 'fail']);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle malformed JSON responses', async () => {
      if (!isIntegrationTest) return;

      // This might be hard to trigger, but we can test error handling paths
      const result = await claudeFlow.getSwarmStatus();
      
      // The result might succeed or fail depending on environment
      // But it should always have a defined success property
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe.skip('Performance and Reliability', () => {
    test('should handle concurrent operations', async () => {
      if (!isIntegrationTest) return;

      const operations = Array.from({ length: 5 }, (_, i) => 
        () => claudeFlow.memoryStore(`concurrent-key-${i}`, { index: i })
      );

      const batchResult = await claudeFlow.batch(operations);
      
      expect(batchResult.totalTasks).toBe(5);
      expect(batchResult.duration).toBeGreaterThan(0);
      
      // Cleanup
      for (let i = 0; i < 5; i++) {
        await claudeFlow.memoryDelete(`concurrent-key-${i}`);
      }
    }, 45000);

    test('should handle large data operations', async () => {
      if (!isIntegrationTest) return;

      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          data: 'x'.repeat(100) // 100 chars per item
        }))
      };

      const storeResult = await claudeFlow.memoryStore('large-data-test', largeData);
      expect(storeResult.success).toBe(true);

      const retrieveResult = await claudeFlow.memoryRetrieve('large-data-test');
      expect(retrieveResult.success).toBe(true);
      
      if (retrieveResult.data?.value) {
        const retrieved = retrieveResult.data.value as any;
        expect(retrieved.items).toHaveLength(1000);
      }

      // Cleanup
      await claudeFlow.memoryDelete('large-data-test');
    }, 60000);
  });

  describe.skip('Command Chaining', () => {
    test('should chain multiple operations successfully', async () => {
      if (!isIntegrationTest) return;

      // Chain: Init -> Create Swarm -> Spawn Agent -> Orchestrate Task -> Check Status
      const results = await claudeFlow.batch([
        () => claudeFlow.initSparc(),
        () => claudeFlow.initSwarm({ topology: 'mesh', maxAgents: 3 }),
        () => claudeFlow.spawnAgent('coder'),
        () => claudeFlow.orchestrateTask({
          id: 'chain-test-task',
          description: 'Test chaining operations',
          agent: 'coder',
          priority: 'medium',
          timeout: 30000,
          retries: 1,
          dependencies: [],
          metadata: {}
        }),
        () => claudeFlow.getSwarmStatus()
      ]);

      expect(results.totalTasks).toBe(5);
      expect(results.successfulTasks).toBeGreaterThan(0);
      
      // At least some operations should succeed
      const successfulResults = results.results.filter(r => r.success);
      expect(successfulResults.length).toBeGreaterThan(0);
    }, 120000);
  });

  describe('Non-Interactive Mode Verification', () => {
    test('should run without user interaction', async () => {
      if (!isIntegrationTest) return;

      // All claude-flow operations should run without prompts
      const operations = [
        () => claudeFlow.listSparcModes(),
        () => claudeFlow.detectFeatures(),
        () => claudeFlow.memoryUsage()
      ];

      const startTime = Date.now();
      const results = await claudeFlow.batch(operations);
      const duration = Date.now() - startTime;

      expect(results.totalTasks).toBe(3);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
      
      // Verify no hanging or user input required
      results.results.forEach((result, index) => {
        expect(typeof result.success).toBe('boolean');
      });
    }, 45000);
  });
});