/**
 * Memory Module for Claude Flow Dagger
 * Manages distributed memory and state persistence
 */

import { Container } from '@dagger.io/dagger';
import { ClaudeFlowConfig } from '../config';
import { MemoryConfig, MemoryEntry } from '../types';

export class MemoryModule {
  constructor(
    private container: Container,
    private config: ClaudeFlowConfig
  ) {}

  /**
   * Store value in memory
   */
  async store(key: string, value: any, ttl?: number): Promise<void> {
    const args = ['memory', 'store', key, JSON.stringify(value)];
    if (ttl) args.push('--ttl', ttl.toString());

    await this.container
      .withEnvVariable('CLAUDE_API_KEY', this.config.apiKey || '')
      .withExec(['npx', 'claude-flow', ...args])
      .stdout();
  }

  /**
   * Retrieve value from memory
   */
  async retrieve(key: string): Promise<any> {
    const result = await this.container
      .withExec(['npx', 'claude-flow', 'memory', 'get', key, '--json'])
      .stdout();

    return JSON.parse(result);
  }

  /**
   * Delete value from memory
   */
  async delete(key: string): Promise<void> {
    await this.container
      .withExec(['npx', 'claude-flow', 'memory', 'delete', key])
      .stdout();
  }

  /**
   * List all memory keys
   */
  async list(pattern?: string): Promise<string[]> {
    const args = ['memory', 'list'];
    if (pattern) args.push('--pattern', pattern);

    const result = await this.container
      .withExec(['npx', 'claude-flow', ...args])
      .stdout();

    return result.split('\n').filter(line => line.trim());
  }

  /**
   * Clear all memory
   */
  async clear(): Promise<void> {
    await this.container
      .withExec(['npx', 'claude-flow', 'memory', 'clear', '--force'])
      .stdout();
  }

  /**
   * Store agent state
   */
  async storeAgentState(agentId: string, state: any): Promise<void> {
    const key = `agents/${agentId}/state`;
    await this.store(key, state);
  }

  /**
   * Retrieve agent state
   */
  async retrieveAgentState(agentId: string): Promise<any> {
    const key = `agents/${agentId}/state`;
    return this.retrieve(key);
  }

  /**
   * Store workflow state
   */
  async storeWorkflowState(workflowId: string, state: any): Promise<void> {
    const key = `workflows/${workflowId}/state`;
    await this.store(key, state);
  }

  /**
   * Retrieve workflow state
   */
  async retrieveWorkflowState(workflowId: string): Promise<any> {
    const key = `workflows/${workflowId}/state`;
    return this.retrieve(key);
  }

  /**
   * Distributed locking
   */
  async acquireLock(resource: string, ttl: number = 30000): Promise<boolean> {
    try {
      const result = await this.container
        .withExec(['npx', 'claude-flow', 'memory', 'lock', resource, '--ttl', ttl.toString()])
        .stdout();

      return result.includes('acquired');
    } catch {
      return false;
    }
  }

  async releaseLock(resource: string): Promise<void> {
    await this.container
      .withExec(['npx', 'claude-flow', 'memory', 'unlock', resource])
      .stdout();
  }

  /**
   * Pub/Sub messaging
   */
  async publish(channel: string, message: any): Promise<void> {
    await this.container
      .withExec(['npx', 'claude-flow', 'memory', 'publish', channel, JSON.stringify(message)])
      .stdout();
  }

  async subscribe(channel: string, callback?: (message: any) => void): Promise<string> {
    const result = await this.container
      .withExec(['npx', 'claude-flow', 'memory', 'subscribe', channel, '--once'])
      .stdout();

    if (callback) {
      callback(JSON.parse(result));
    }
    return result;
  }

  /**
   * Memory providers configuration
   */
  async configureProvider(config: MemoryConfig): Promise<void> {
    const args = ['memory', 'configure', '--provider', config.provider];

    if (config.connectionUrl) args.push('--url', config.connectionUrl);
    if (config.ttl) args.push('--default-ttl', config.ttl.toString());
    if (config.maxSize) args.push('--max-size', config.maxSize);
    if (config.compression) args.push('--compression');
    if (config.encryption) args.push('--encryption');

    await this.container
      .withExec(['npx', 'claude-flow', ...args])
      .stdout();
  }

  /**
   * Backup and restore
   */
  async backup(path: string): Promise<void> {
    await this.container
      .withExec(['npx', 'claude-flow', 'memory', 'backup', path])
      .stdout();
  }

  async restore(path: string): Promise<void> {
    await this.container
      .withExec(['npx', 'claude-flow', 'memory', 'restore', path])
      .stdout();
  }

  /**
   * Memory statistics
   */
  async getStats(): Promise<any> {
    const result = await this.container
      .withExec(['npx', 'claude-flow', 'memory', 'stats', '--json'])
      .stdout();

    return JSON.parse(result);
  }

  /**
   * Memory compaction
   */
  async compact(): Promise<void> {
    await this.container
      .withExec(['npx', 'claude-flow', 'memory', 'compact'])
      .stdout();
  }

  /**
   * Namespace operations
   */
  async storeInNamespace(namespace: string, key: string, value: any): Promise<void> {
    const fullKey = `${namespace}/${key}`;
    await this.store(fullKey, value);
  }

  async retrieveFromNamespace(namespace: string, key: string): Promise<any> {
    const fullKey = `${namespace}/${key}`;
    return this.retrieve(fullKey);
  }

  async listNamespace(namespace: string): Promise<string[]> {
    return this.list(`${namespace}/*`);
  }

  async clearNamespace(namespace: string): Promise<void> {
    const keys = await this.listNamespace(namespace);
    for (const key of keys) {
      await this.delete(key);
    }
  }

  /**
   * Memory replication
   */
  async replicate(targetUrl: string): Promise<void> {
    await this.container
      .withExec(['npx', 'claude-flow', 'memory', 'replicate', '--target', targetUrl])
      .stdout();
  }

  /**
   * Memory transactions
   */
  async transaction(operations: Array<{ op: 'set' | 'delete'; key: string; value?: any }>): Promise<void> {
    const txData = JSON.stringify(operations);
    await this.container
      .withExec(['npx', 'claude-flow', 'memory', 'transaction', '--operations', txData])
      .stdout();
  }
}