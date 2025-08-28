import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { execa } from 'execa';
import { ClaudeFlowDagger } from '../../src/dagger/core.js';
import * as fs from 'fs';
import * as path from 'path';

describe('Performance Benchmarks', () => {
  const isPerformanceTest = process.env.PERFORMANCE_TESTS === 'true';
  const isDockerAvailable = process.env.DOCKER_TESTS === 'true';
  
  let claudeFlow: ClaudeFlowDagger;
  const imageName = 'claude-flow-dev:test';

  beforeAll(async () => {
    if (!isPerformanceTest) {
      console.log('Skipping performance tests. Set PERFORMANCE_TESTS=true to run.');
      return;
    }

    claudeFlow = new ClaudeFlowDagger({
      enableHooks: false,
      enableMemory: false,
      enableNeural: false
    });
  });

  describe('Container Performance', () => {
    test.skip('should measure container startup time', async () => {
      if (!isPerformanceTest || !isDockerAvailable) return;

      const iterations = 5;
      const startupTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        const { exitCode } = await execa('docker', [
          'run', '--rm', imageName,
          'echo', 'startup test'
        ]);

        const endTime = Date.now();
        const duration = endTime - startTime;
        
        expect(exitCode).toBe(0);
        startupTimes.push(duration);
      }

      const avgStartupTime = startupTimes.reduce((a, b) => a + b) / startupTimes.length;
      const maxStartupTime = Math.max(...startupTimes);
      const minStartupTime = Math.min(...startupTimes);

      console.log(`Container startup times (ms):`);
      console.log(`  Average: ${avgStartupTime.toFixed(2)}`);
      console.log(`  Min: ${minStartupTime}`);
      console.log(`  Max: ${maxStartupTime}`);
      console.log(`  All times: ${startupTimes.join(', ')}`);

      // Container should start within reasonable time (10 seconds)
      expect(avgStartupTime).toBeLessThan(10000);
      expect(maxStartupTime).toBeLessThan(15000);
    }, 120000);

    test.skip('should measure command execution overhead', async () => {
      if (!isPerformanceTest || !isDockerAvailable) return;

      const commands = [
        ['echo', 'test'],
        ['node', '--version'],
        ['python3', '--version'],
        ['npx', 'claude-flow', '--help']
      ];

      const results: Array<{cmd: string, time: number}> = [];

      for (const cmd of commands) {
        const iterations = 3;
        const times: number[] = [];

        for (let i = 0; i < iterations; i++) {
          const startTime = Date.now();
          
          await execa('docker', [
            'run', '--rm', imageName,
            ...cmd
          ]);

          const endTime = Date.now();
          times.push(endTime - startTime);
        }

        const avgTime = times.reduce((a, b) => a + b) / times.length;
        results.push({ cmd: cmd.join(' '), time: avgTime });
      }

      console.log('Command execution times:');
      results.forEach(result => {
        console.log(`  ${result.cmd}: ${result.time.toFixed(2)}ms`);
      });

      // Basic commands should complete quickly
      const echoResult = results.find(r => r.cmd === 'echo test');
      expect(echoResult?.time).toBeLessThan(3000);

      const nodeResult = results.find(r => r.cmd === 'node --version');
      expect(nodeResult?.time).toBeLessThan(5000);
    }, 180000);
  });

  describe('Dagger Module Performance', () => {
    test('should measure method execution times', async () => {
      if (!isPerformanceTest) return;

      const operations = [
        { name: 'initSparc', fn: () => claudeFlow.initSparc() },
        { name: 'listSparcModes', fn: () => claudeFlow.listSparcModes() },
        { name: 'detectFeatures', fn: () => claudeFlow.detectFeatures() },
        { name: 'memoryUsage', fn: () => claudeFlow.memoryUsage() }
      ];

      const results: Array<{name: string, time: number, success: boolean}> = [];

      for (const op of operations) {
        const startTime = Date.now();
        
        try {
          const result = await op.fn();
          const endTime = Date.now();
          
          results.push({
            name: op.name,
            time: endTime - startTime,
            success: result.success
          });
        } catch (error) {
          const endTime = Date.now();
          results.push({
            name: op.name,
            time: endTime - startTime,
            success: false
          });
        }
      }

      console.log('Dagger method performance:');
      results.forEach(result => {
        console.log(`  ${result.name}: ${result.time}ms (${result.success ? 'success' : 'failed'})`);
      });

      // Methods should complete within reasonable time
      results.forEach(result => {
        expect(result.time).toBeLessThan(30000); // 30 seconds max
      });

      const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
      expect(avgTime).toBeLessThan(15000); // 15 seconds average
    }, 150000);

    test('should measure batch operation performance', async () => {
      if (!isPerformanceTest) return;

      const batchSizes = [1, 3, 5, 10];
      const results: Array<{size: number, time: number, successRate: number}> = [];

      for (const size of batchSizes) {
        const operations = Array.from({ length: size }, (_, i) => 
          () => claudeFlow.exec(['echo', `test-${i}`])
        );

        const startTime = Date.now();
        const batchResult = await claudeFlow.batch(operations);
        const endTime = Date.now();

        const successRate = batchResult.successfulTasks / batchResult.totalTasks;
        
        results.push({
          size,
          time: endTime - startTime,
          successRate
        });
      }

      console.log('Batch operation performance:');
      results.forEach(result => {
        console.log(`  Size ${result.size}: ${result.time}ms, ${(result.successRate * 100).toFixed(1)}% success`);
      });

      // Batch operations should scale reasonably
      const timePerOperation = results.map(r => r.time / r.size);
      const avgTimePerOp = timePerOperation.reduce((a, b) => a + b) / timePerOperation.length;
      
      expect(avgTimePerOp).toBeLessThan(10000); // 10 seconds per operation on average
      
      // Success rate should be high
      results.forEach(result => {
        expect(result.successRate).toBeGreaterThan(0.8); // 80% success rate minimum
      });
    }, 180000);
  });

  describe('Memory Usage', () => {
    test.skip('should measure container memory consumption', async () => {
      if (!isPerformanceTest || !isDockerAvailable) return;

      // Run a long-running container and monitor memory
      const containerName = 'claude-flow-memory-test';
      
      try {
        // Start container
        const containerProcess = execa('docker', [
          'run', '--name', containerName,
          '--memory=2g', // Limit memory for testing
          imageName,
          'sleep', '60'
        ]);

        // Wait a moment for container to start
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Check memory stats
        const { stdout } = await execa('docker', [
          'stats', containerName, '--no-stream', '--format',
          '{{.MemUsage}}\t{{.MemPerc}}'
        ]);

        const [memUsage, memPerc] = stdout.trim().split('\t');
        
        console.log(`Memory usage: ${memUsage} (${memPerc})`);

        // Parse memory usage (format: "123.4MiB / 2GiB")
        const usageMB = parseFloat(memUsage.split('/')[0].replace(/[^\d.]/g, ''));
        const usagePercent = parseFloat(memPerc.replace('%', ''));

        expect(usageMB).toBeLessThan(1500); // Less than 1.5GB
        expect(usagePercent).toBeLessThan(75); // Less than 75% of allocated

        // Stop container
        containerProcess.kill();
        await containerProcess.catch(() => {}); // Ignore kill error

      } finally {
        // Cleanup
        try {
          await execa('docker', ['rm', '-f', containerName]);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }, 90000);

    test('should monitor JavaScript heap usage', async () => {
      if (!isPerformanceTest) return;

      // Monitor memory usage during heavy operations
      const initialMemory = process.memoryUsage();
      
      const operations = Array.from({ length: 20 }, (_, i) => 
        () => claudeFlow.memoryStore(`perf-test-${i}`, { 
          data: 'x'.repeat(1000),
          index: i,
          timestamp: new Date().toISOString()
        })
      );

      await claudeFlow.batch(operations);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const heapGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log(`Memory usage (bytes):`);
      console.log(`  Initial heap: ${initialMemory.heapUsed}`);
      console.log(`  Final heap: ${finalMemory.heapUsed}`);
      console.log(`  Heap growth: ${heapGrowth}`);
      console.log(`  RSS: ${finalMemory.rss}`);

      // Memory growth should be reasonable
      expect(heapGrowth).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
      expect(finalMemory.rss).toBeLessThan(500 * 1024 * 1024); // Less than 500MB RSS

      // Cleanup
      for (let i = 0; i < 20; i++) {
        await claudeFlow.memoryDelete(`perf-test-${i}`);
      }
    }, 120000);
  });

  describe('Concurrent Operations', () => {
    test('should handle concurrent requests efficiently', async () => {
      if (!isPerformanceTest) return;

      const concurrencyLevels = [1, 5, 10, 20];
      const results: Array<{concurrency: number, totalTime: number, avgTime: number}> = [];

      for (const concurrency of concurrencyLevels) {
        const operations = Array.from({ length: concurrency }, (_, i) => 
          async () => {
            const start = Date.now();
            const result = await claudeFlow.exec(['echo', `concurrent-${i}`]);
            return {
              success: result.success,
              time: Date.now() - start
            };
          }
        );

        const startTime = Date.now();
        const responses = await Promise.all(operations.map(op => op()));
        const totalTime = Date.now() - startTime;

        const avgTime = responses.reduce((sum, r) => sum + r.time, 0) / responses.length;
        const successCount = responses.filter(r => r.success).length;

        results.push({ concurrency, totalTime, avgTime });

        console.log(`Concurrency ${concurrency}: ${totalTime}ms total, ${avgTime.toFixed(2)}ms avg, ${successCount}/${concurrency} success`);

        // All operations should succeed
        expect(successCount).toBe(concurrency);
      }

      // Performance should scale reasonably with concurrency
      // Higher concurrency shouldn't dramatically increase average time per operation
      const maxAvgTime = Math.max(...results.map(r => r.avgTime));
      const minAvgTime = Math.min(...results.map(r => r.avgTime));
      
      expect(maxAvgTime / minAvgTime).toBeLessThan(5); // Max 5x difference
    }, 120000);

    test('should not leak resources under load', async () => {
      if (!isPerformanceTest) return;

      const iterations = 50;
      const memorySnapshots: number[] = [];

      // Take initial memory snapshot
      memorySnapshots.push(process.memoryUsage().heapUsed);

      // Run many operations
      for (let i = 0; i < iterations; i++) {
        await claudeFlow.exec(['echo', `load-test-${i}`]);
        
        if (i % 10 === 0) {
          // Take memory snapshot every 10 iterations
          if (global.gc) global.gc();
          memorySnapshots.push(process.memoryUsage().heapUsed);
        }
      }

      console.log('Memory snapshots:', memorySnapshots.map(m => `${(m/1024/1024).toFixed(2)}MB`));

      // Memory should not grow unboundedly
      const initialMemory = memorySnapshots[0];
      const finalMemory = memorySnapshots[memorySnapshots.length - 1];
      const memoryGrowth = finalMemory - initialMemory;

      expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024); // Less than 100MB growth

      // Memory should stabilize (not continuously growing)
      const lastThreeSnapshots = memorySnapshots.slice(-3);
      const memoryTrend = lastThreeSnapshots[2] - lastThreeSnapshots[0];
      expect(Math.abs(memoryTrend)).toBeLessThan(20 * 1024 * 1024); // Less than 20MB trend
    }, 300000);
  });

  describe('Performance Regression Tests', () => {
    test('should maintain baseline performance metrics', async () => {
      if (!isPerformanceTest) return;

      // Define baseline performance expectations
      const baselines = {
        simpleExec: 5000,        // 5 seconds for simple command
        sparcInit: 15000,        // 15 seconds for SPARC init
        memoryStore: 3000,       // 3 seconds for memory store
        batchOperation: 20000    // 20 seconds for 5 operations
      };

      const tests = [
        {
          name: 'simpleExec',
          fn: () => claudeFlow.exec(['echo', 'baseline-test']),
          baseline: baselines.simpleExec
        },
        {
          name: 'sparcInit',
          fn: () => claudeFlow.initSparc(),
          baseline: baselines.sparcInit
        },
        {
          name: 'memoryStore',
          fn: () => claudeFlow.memoryStore('baseline-key', { test: 'data' }),
          baseline: baselines.memoryStore
        },
        {
          name: 'batchOperation',
          fn: () => claudeFlow.batch([
            () => claudeFlow.exec(['echo', '1']),
            () => claudeFlow.exec(['echo', '2']),
            () => claudeFlow.exec(['echo', '3']),
            () => claudeFlow.exec(['echo', '4']),
            () => claudeFlow.exec(['echo', '5'])
          ]),
          baseline: baselines.batchOperation
        }
      ];

      const results: Array<{name: string, time: number, baseline: number, ratio: number}> = [];

      for (const test of tests) {
        const startTime = Date.now();
        
        try {
          await test.fn();
          const endTime = Date.now();
          const time = endTime - startTime;
          const ratio = time / test.baseline;

          results.push({
            name: test.name,
            time,
            baseline: test.baseline,
            ratio
          });

        } catch (error) {
          console.log(`Test ${test.name} failed:`, error);
          // Still record the time for failed tests
          const endTime = Date.now();
          results.push({
            name: test.name,
            time: endTime - startTime,
            baseline: test.baseline,
            ratio: (endTime - startTime) / test.baseline
          });
        }
      }

      console.log('Performance baseline comparison:');
      results.forEach(result => {
        const status = result.ratio <= 1.5 ? '✓' : '✗';
        console.log(`  ${status} ${result.name}: ${result.time}ms (${result.ratio.toFixed(2)}x baseline)`);
      });

      // Performance should not regress significantly
      results.forEach(result => {
        expect(result.ratio).toBeLessThan(2.0); // No more than 2x baseline
      });

      // Cleanup
      await claudeFlow.memoryDelete('baseline-key');
    }, 300000);
  });

  afterAll(async () => {
    if (!isPerformanceTest) return;

    // Generate performance report
    const reportPath = path.join(process.cwd(), 'performance-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage()
      },
      note: 'See test output for detailed performance metrics'
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Performance report saved to ${reportPath}`);
  });
});