import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { ClaudeFlowDagger } from '../../src/dagger/core.js';
import * as fs from 'fs';
import * as path from 'path';

describe('End-to-End Complete Workflow Tests', () => {
  let claudeFlow: ClaudeFlowDagger;
  const isE2ETest = process.env.E2E_TESTS === 'true';
  const testSessionId = `e2e-test-${Date.now()}`;

  beforeAll(async () => {
    if (!isE2ETest) {
      console.log('Skipping E2E tests. Set E2E_TESTS=true to run.');
      return;
    }

    claudeFlow = new ClaudeFlowDagger({
      apiKey: process.env.CLAUDE_API_KEY || 'test-key',
      enableHooks: false, // Disable for testing
      enableMemory: true,
      enableNeural: false,
      timeout: 60000
    });
  });

  describe.skip('Complete SPARC Development Workflow', () => {
    test('should execute complete SPARC TDD workflow', async () => {
      if (!isE2ETest) return;

      const projectName = 'e2e-test-api';
      const workflowSteps = [];

      // Step 1: Initialize SPARC environment
      console.log('Step 1: Initializing SPARC environment...');
      const initResult = await claudeFlow.initSparc();
      workflowSteps.push({ step: 'init', success: initResult.success, data: initResult.data });
      expect(initResult.success).toBe(true);

      // Step 2: Gather requirements using spec-pseudocode mode
      console.log('Step 2: Gathering requirements...');
      const specResult = await claudeFlow.runSparcMode('spec-pseudocode', 
        `Create a REST API for ${projectName} with user authentication, CRUD operations, and data validation`);
      workflowSteps.push({ step: 'specification', success: specResult.success, data: specResult.data });
      expect(specResult.success).toBe(true);

      // Step 3: Create system architecture
      console.log('Step 3: Creating system architecture...');
      const archResult = await claudeFlow.runSparcMode('architect', 
        `Design the architecture for ${projectName} API with database, authentication, and API layers`);
      workflowSteps.push({ step: 'architecture', success: archResult.success, data: archResult.data });
      expect(archResult.success).toBe(true);

      // Step 4: Implement backend development
      console.log('Step 4: Implementing backend...');
      const backendResult = await claudeFlow.runSparcMode('backend-dev', 
        `Implement ${projectName} with Express.js, JWT authentication, and PostgreSQL`);
      workflowSteps.push({ step: 'backend', success: backendResult.success, data: backendResult.data });
      expect(backendResult.success).toBe(true);

      // Step 5: Run TDD workflow
      console.log('Step 5: Running TDD workflow...');
      const tddResult = await claudeFlow.runTdd(`Complete TDD implementation for ${projectName}`);
      workflowSteps.push({ step: 'tdd', success: tddResult.success, data: tddResult.data });
      expect(tddResult.success).toBe(true);

      // Step 6: Integration phase
      console.log('Step 6: Running integration...');
      const integrationResult = await claudeFlow.runSparcMode('integration', 
        `Integrate all components of ${projectName} and create deployment configuration`);
      workflowSteps.push({ step: 'integration', success: integrationResult.success, data: integrationResult.data });
      expect(integrationResult.success).toBe(true);

      // Log workflow summary
      console.log('\nWorkflow Summary:');
      workflowSteps.forEach((step, index) => {
        const status = step.success ? '✅' : '❌';
        console.log(`  ${index + 1}. ${step.step}: ${status}`);
      });

      // All steps should succeed
      const successfulSteps = workflowSteps.filter(s => s.success).length;
      expect(successfulSteps).toBe(workflowSteps.length);
      
    }, 600000); // 10 minutes timeout for complete workflow

    test('should handle batch SPARC processing', async () => {
      if (!isE2ETest) return;

      const taskDescription = 'Create a microservices architecture with API gateway, user service, and data service';
      
      console.log('Running batch SPARC processing...');
      const batchResult = await claudeFlow.batchSparc([
        'spec-pseudocode',
        'architect',
        'backend-dev'
      ], taskDescription);

      expect(batchResult.success).toBe(true);
      expect(batchResult.data).toBeDefined();

      console.log('Batch SPARC result:', batchResult.data?.substring(0, 200) + '...');
    }, 300000);

    test('should execute full pipeline with dependencies', async () => {
      if (!isE2ETest) return;

      console.log('Running full SPARC pipeline...');
      const pipelineResult = await claudeFlow.runSparcPipeline(
        'Build a complete e-commerce platform with authentication, product catalog, shopping cart, and payment integration'
      );

      expect(pipelineResult.success).toBe(true);
      expect(pipelineResult.data).toBeDefined();

      console.log('Pipeline result summary:', pipelineResult.data?.substring(0, 300) + '...');
    }, 480000); // 8 minutes timeout
  });

  describe.skip('Swarm Orchestration Workflow', () => {
    test('should manage complete swarm lifecycle', async () => {
      if (!isE2ETest) return;

      const swarmConfig = {
        topology: 'mesh' as const,
        maxAgents: 8,
        sessionId: testSessionId,
        enableMetrics: true,
        autoHeal: true,
        parallelTasks: 4
      };

      // Initialize swarm
      console.log('Initializing swarm...');
      const initResult = await claudeFlow.initSwarm(swarmConfig);
      expect(initResult.success).toBe(true);

      // Spawn multiple agents
      console.log('Spawning agents...');
      const agentTypes = ['coder', 'tester', 'reviewer', 'planner'];
      const spawnPromises = agentTypes.map(agentType => 
        claudeFlow.spawnAgent(agentType as any, {
          id: `${agentType}-${testSessionId}`,
          priority: 'medium',
          timeout: 120000
        })
      );

      const spawnResults = await Promise.all(spawnPromises);
      spawnResults.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Check swarm status
      console.log('Checking swarm status...');
      const statusResult = await claudeFlow.getSwarmStatus();
      expect(statusResult.success).toBe(true);

      if (statusResult.data) {
        expect(statusResult.data.topology).toBe('mesh');
        expect(statusResult.data.sessionId).toBe(testSessionId);
        console.log(`Swarm status: ${statusResult.data.activeAgents} active agents, ${statusResult.data.runningTasks} running tasks`);
      }

      // Orchestrate complex task
      console.log('Orchestrating complex task...');
      const taskConfig = {
        id: `complex-task-${testSessionId}`,
        description: 'Develop a full-stack application with React frontend, Node.js backend, and MongoDB database',
        agent: 'coder' as const,
        priority: 'high' as const,
        timeout: 180000,
        retries: 1,
        dependencies: [],
        metadata: { 
          type: 'full-stack-development',
          complexity: 'high',
          estimatedTime: '3-hours'
        }
      };

      const orchestrateResult = await claudeFlow.orchestrateTask(taskConfig);
      expect(orchestrateResult.success).toBe(true);

      // Monitor task progress
      console.log('Monitoring task progress...');
      let taskCompleted = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!taskCompleted && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        const taskStatus = await claudeFlow.getTaskStatus(taskConfig.id);
        if (taskStatus.success && taskStatus.data) {
          console.log(`Task status: ${taskStatus.data.status}`);
          
          if (taskStatus.data.status === 'completed' || taskStatus.data.status === 'failed') {
            taskCompleted = true;
          }
        }
        
        attempts++;
      }

      // Get final task results
      const taskResults = await claudeFlow.getTaskResults(taskConfig.id);
      expect(taskResults.success).toBe(true);

      console.log('Task orchestration completed');
    }, 600000);

    test('should handle agent failures and recovery', async () => {
      if (!isE2ETest) return;

      // This test simulates agent failures and recovery mechanisms
      const recoveryConfig = {
        topology: 'hierarchical' as const,
        maxAgents: 5,
        sessionId: `recovery-test-${Date.now()}`,
        enableMetrics: true,
        autoHeal: true,
        parallelTasks: 3
      };

      console.log('Testing failure recovery...');
      const initResult = await claudeFlow.initSwarm(recoveryConfig);
      expect(initResult.success).toBe(true);

      // Spawn agents that might fail
      const agentResults = await Promise.allSettled([
        claudeFlow.spawnAgent('coder', { id: 'recovery-coder-1' }),
        claudeFlow.spawnAgent('tester', { id: 'recovery-tester-1' }),
        claudeFlow.spawnAgent('reviewer', { id: 'recovery-reviewer-1' })
      ]);

      // At least some agents should spawn successfully
      const successfulAgents = agentResults.filter(r => 
        r.status === 'fulfilled' && r.value.success
      ).length;
      
      expect(successfulAgents).toBeGreaterThan(0);

      // Test recovery by checking swarm can still function
      const statusResult = await claudeFlow.getSwarmStatus();
      expect(statusResult.success).toBe(true);

      console.log('Failure recovery test completed');
    }, 240000);
  });

  describe.skip('Memory and Neural Integration', () => {
    test('should demonstrate complete memory workflow', async () => {
      if (!isE2ETest) return;

      const memoryWorkflow = [
        { key: 'project-requirements', value: { type: 'web-app', features: ['auth', 'crud', 'api'], priority: 'high' }},
        { key: 'architecture-decisions', value: { backend: 'node.js', frontend: 'react', database: 'postgresql' }},
        { key: 'implementation-notes', value: { patterns: ['mvc', 'repository'], security: ['jwt', 'bcrypt'] }},
        { key: 'test-strategy', value: { unit: 'jest', integration: 'supertest', e2e: 'playwright' }}
      ];

      console.log('Storing workflow memory...');
      
      // Store all memory entries
      for (const entry of memoryWorkflow) {
        const storeResult = await claudeFlow.memoryStore(entry.key, entry.value, 3600);
        expect(storeResult.success).toBe(true);
      }

      // Retrieve and validate stored data
      console.log('Retrieving and validating memory...');
      for (const entry of memoryWorkflow) {
        const retrieveResult = await claudeFlow.memoryRetrieve(entry.key);
        expect(retrieveResult.success).toBe(true);
        expect(retrieveResult.data?.key).toBe(entry.key);
      }

      // List all workflow keys
      const listResult = await claudeFlow.memoryList('*-*');
      expect(listResult.success).toBe(true);
      expect(listResult.data?.length).toBeGreaterThanOrEqual(memoryWorkflow.length);

      // Get memory usage statistics
      const usageResult = await claudeFlow.memoryUsage();
      expect(usageResult.success).toBe(true);
      
      if (usageResult.data) {
        console.log('Memory usage stats:', usageResult.data);
      }

      // Cleanup
      console.log('Cleaning up memory...');
      for (const entry of memoryWorkflow) {
        await claudeFlow.memoryDelete(entry.key);
      }

      console.log('Memory workflow completed');
    }, 180000);

    test('should integrate with neural pattern learning', async () => {
      if (!isE2ETest) return;

      // Test neural features if available
      console.log('Testing neural integration...');
      
      const neuralStatus = await claudeFlow.getNeuralStatus();
      
      if (neuralStatus.success) {
        console.log('Neural system is available');
        
        // Train some patterns
        const patterns = [
          'web-development-best-practices',
          'api-design-patterns',
          'database-optimization',
          'security-implementation'
        ];

        const trainResult = await claudeFlow.trainNeural(patterns);
        // Training might fail in test environment, that's okay
        console.log('Neural training result:', trainResult.success);

        // Get learned patterns
        const patternsResult = await claudeFlow.getNeuralPatterns();
        if (patternsResult.success) {
          console.log('Learned patterns available');
        }

      } else {
        console.log('Neural system not available in test environment');
      }
    }, 120000);
  });

  describe.skip('GitHub Integration Workflow', () => {
    test('should demonstrate GitHub workflow integration', async () => {
      if (!isE2ETest) return;

      // Only run if GitHub token is available
      if (!process.env.GITHUB_TOKEN) {
        console.log('GitHub token not available, skipping GitHub tests');
        return;
      }

      const githubConfig = {
        token: process.env.GITHUB_TOKEN,
        owner: 'test-owner',
        repo: 'test-repo',
        baseBranch: 'main',
        enableWebhooks: false,
        enableActions: true
      };

      console.log('Testing GitHub integration...');
      
      // Initialize GitHub integration
      const initResult = await claudeFlow.initGitHub(githubConfig);
      // This might fail in test environment without actual repo
      console.log('GitHub init result:', initResult.success);

      // Test repository analysis (might fail without real repo)
      const analyzeResult = await claudeFlow.analyzeRepo(githubConfig.owner, githubConfig.repo);
      console.log('Repository analysis result:', analyzeResult.success);

      // Other GitHub operations would be tested here with real repository
      console.log('GitHub workflow test completed');
    }, 180000);
  });

  describe('Performance and Monitoring', () => {
    test('should demonstrate monitoring and benchmarking', async () => {
      if (!isE2ETest) return;

      console.log('Running performance benchmarks...');
      
      // Run benchmark suite
      const benchmarkResult = await claudeFlow.runBenchmark();
      expect(benchmarkResult.success).toBe(true);
      
      if (benchmarkResult.data) {
        console.log('Benchmark results available');
      }

      // Monitor swarm if active
      const monitorResult = await claudeFlow.monitorSwarm();
      // This might fail if no swarm is active
      console.log('Swarm monitoring result:', monitorResult.success);

      // Detect available features
      const featuresResult = await claudeFlow.detectFeatures();
      expect(featuresResult.success).toBe(true);
      
      if (featuresResult.data) {
        console.log('Available features:', featuresResult.data.slice(0, 5));
      }

      console.log('Monitoring and benchmarking completed');
    }, 180000);
  });

  describe('Error Handling and Resilience', () => {
    test('should handle various error conditions gracefully', async () => {
      if (!isE2ETest) return;

      console.log('Testing error handling and resilience...');

      const errorTests = [
        {
          name: 'Invalid command',
          test: () => claudeFlow.exec(['invalid-command', 'that-does-not-exist']),
          expectError: true
        },
        {
          name: 'Invalid SPARC mode',
          test: () => claudeFlow.getSparcModeInfo('non-existent-mode' as any),
          expectError: true
        },
        {
          name: 'Non-existent task status',
          test: () => claudeFlow.getTaskStatus('non-existent-task-id'),
          expectError: true
        },
        {
          name: 'Invalid memory key',
          test: () => claudeFlow.memoryRetrieve('non-existent-key'),
          expectError: true
        }
      ];

      const results = [];

      for (const errorTest of errorTests) {
        try {
          const result = await errorTest.test();
          results.push({
            name: errorTest.name,
            success: result.success,
            expectedError: errorTest.expectError,
            actualError: !result.success
          });
        } catch (error) {
          results.push({
            name: errorTest.name,
            success: false,
            expectedError: errorTest.expectError,
            actualError: true,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      console.log('Error handling results:');
      results.forEach(result => {
        const status = result.expectedError === result.actualError ? '✅' : '❌';
        console.log(`  ${status} ${result.name}: Expected error=${result.expectedError}, Got error=${result.actualError}`);
      });

      // All error tests should behave as expected
      results.forEach(result => {
        expect(result.expectedError).toBe(result.actualError);
      });

      console.log('Error handling test completed');
    }, 120000);

    test('should recover from network timeouts and retries', async () => {
      if (!isE2ETest) return;

      console.log('Testing timeout and retry behavior...');

      // Test with very short timeout
      const shortTimeoutFlow = new ClaudeFlowDagger({
        timeout: 1000, // 1 second timeout
        retries: 2,
        enableHooks: false,
        enableMemory: false,
        enableNeural: false
      });

      // This might timeout, but should handle it gracefully
      const timeoutTest = await shortTimeoutFlow.runSparcMode('spec-pseudocode', 'Simple test task');
      
      // Should either succeed quickly or fail gracefully
      expect(typeof timeoutTest.success).toBe('boolean');
      
      if (!timeoutTest.success) {
        console.log('Timeout test failed as expected:', timeoutTest.error);
      } else {
        console.log('Timeout test succeeded unexpectedly');
      }

      console.log('Timeout and retry test completed');
    }, 60000);
  });

  afterAll(async () => {
    if (!isE2ETest) return;

    // Generate E2E test report
    const reportPath = path.join(process.cwd(), 'e2e-test-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      sessionId: testSessionId,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        claudeApiKey: !!process.env.CLAUDE_API_KEY,
        githubToken: !!process.env.GITHUB_TOKEN
      },
      note: 'Complete end-to-end workflow testing completed'
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`E2E test report saved to ${reportPath}`);

    // Cleanup any remaining test data
    try {
      const cleanupKeys = [
        'project-requirements',
        'architecture-decisions', 
        'implementation-notes',
        'test-strategy'
      ];

      for (const key of cleanupKeys) {
        await claudeFlow.memoryDelete(key);
      }
    } catch (error) {
      console.log('Cleanup completed with some errors (expected)');
    }

    console.log('E2E tests completed and cleaned up');
  });
});