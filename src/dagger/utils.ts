/**
 * Utils Module for Claude Flow Dagger
 * Utility functions and helpers
 */

import { Container } from '@dagger.io/dagger';
import { ClaudeFlowConfig } from '../config';

export class UtilsModule {
  constructor(
    private container: Container,
    private config: ClaudeFlowConfig
  ) {}

  /**
   * Batch process multiple tasks
   */
  async batchProcess(tasks: string[]): Promise<string[]> {
    const results: string[] = [];
    
    for (const task of tasks) {
      const result = await this.container
        .withEnvVariable('CLAUDE_API_KEY', this.config.apiKey || '')
        .withExec(['npx', 'claude-flow', 'process', task, '--non-interactive'])
        .stdout();
      results.push(result);
    }
    
    return results;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.container
        .withExec(['npx', 'claude-flow', 'health'])
        .exitCode();
      
      return result === 0;
    } catch {
      return false;
    }
  }

  /**
   * Get version
   */
  async getVersion(): Promise<string> {
    const result = await this.container
      .withExec(['npx', 'claude-flow', 'version'])
      .stdout();
    
    return result.trim();
  }

  /**
   * Benchmark performance
   */
  async benchmark(task: string): Promise<any> {
    const result = await this.container
      .withEnvVariable('CLAUDE_API_KEY', this.config.apiKey || '')
      .withExec(['npx', 'claude-flow', 'benchmark', task, '--json'])
      .stdout();
    
    return JSON.parse(result);
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    await this.container
      .withExec(['npx', 'claude-flow', 'cleanup', '--all', '--force'])
      .stdout();
  }

  /**
   * Export configuration
   */
  async exportConfig(path: string): Promise<void> {
    await this.container
      .withExec(['npx', 'claude-flow', 'config', 'export', path])
      .stdout();
  }

  /**
   * Import configuration
   */
  async importConfig(path: string): Promise<void> {
    await this.container
      .withExec(['npx', 'claude-flow', 'config', 'import', path])
      .stdout();
  }

  /**
   * Circuit breaker pattern
   */
  async withCircuitBreaker<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    timeout: number = 30000
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const timeoutPromise = new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error('Operation timed out')), timeout)
        );
        
        const result = await Promise.race([fn(), timeoutPromise]);
        return result;
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Progress tracking
   */
  async trackProgress(taskId: string): Promise<any> {
    const result = await this.container
      .withExec(['npx', 'claude-flow', 'progress', taskId, '--json'])
      .stdout();
    
    return JSON.parse(result);
  }

  /**
   * Resource monitoring
   */
  async getResourceUsage(): Promise<any> {
    const result = await this.container
      .withExec(['npx', 'claude-flow', 'resources', '--json'])
      .stdout();
    
    return JSON.parse(result);
  }
}