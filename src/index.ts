/**
 * Claude Flow Dagger Module
 * A comprehensive Dagger wrapper for claude-flow CLI with non-interactive mode support
 */

import { connect, Container, Directory, Secret } from '@dagger.io/dagger';
import { ClaudeFlowConfig, validateConfig } from './config';
import { SparcModule } from './dagger/sparc';
import { SwarmModule } from './dagger/swarm';
import { MemoryModule } from './dagger/memory';
import { NeuralModule } from './dagger/neural';
import { GitHubModule } from './dagger/github';
import { UtilsModule } from './dagger/utils';
import { ClaudeFlowDagger } from './dagger/core';

export * from './types';
export * from './config';
export * from './dagger/core';
export * from './dagger/sparc';
export * from './dagger/swarm';
export * from './dagger/memory';
export * from './dagger/neural';
export * from './dagger/github';
export * from './dagger/utils';

/**
 * Main entry point for the Claude Flow Dagger module
 */
export class ClaudeFlow {
  private client: any;
  private container: Container;
  private config: ClaudeFlowConfig;
  
  // Module instances
  public sparc: SparcModule;
  public swarm: SwarmModule;
  public memory: MemoryModule;
  public neural: NeuralModule;
  public github: GitHubModule;
  public utils: UtilsModule;
  public core: ClaudeFlowDagger;

  constructor(config?: Partial<ClaudeFlowConfig>) {
    this.config = validateConfig(config);
  }

  /**
   * Initialize the Dagger client and modules
   */
  async init(): Promise<void> {
    // Connect to Dagger with optional configuration
    this.client = await connect({
      // Log level can be set via DAGGER_LOG_LEVEL env var
      logOutput: process.stderr
    });
    
    // Create base container with claude-flow
    this.container = await this.createBaseContainer();
    
    // Initialize modules with Dagger LLM configuration automatically applied
    this.core = new ClaudeFlowDagger(this.container, this.config);
    
    // Get the configured container from core module for other modules
    const configuredContainer = this.core.getContainer();
    
    this.sparc = new SparcModule(configuredContainer, this.config);
    this.swarm = new SwarmModule(configuredContainer, this.config);
    this.memory = new MemoryModule(configuredContainer, this.config);
    this.neural = new NeuralModule(configuredContainer, this.config);
    this.github = new GitHubModule(configuredContainer, this.config);
    this.utils = new UtilsModule(configuredContainer, this.config);
  }

  /**
   * Create the base container with claude-flow installed
   * Automatically inherits Dagger LLM configuration from engine
   */
  private async createBaseContainer(): Container {
    let container = this.client
      .container()
      .from('node:22-alpine')
      .withExec(['apk', 'add', '--no-cache', 'git', 'python3', 'make', 'g++', 'curl', 'bash'])
      .withExec(['npm', 'install', '-g', 'claude-flow@2.0.0-alpha.101'])
      .withWorkdir('/workspace');
    
    // Pass through Dagger LLM configuration if available
    const daggerLLMEnvVars = this.getDaggerLLMEnvironment();
    for (const [key, value] of Object.entries(daggerLLMEnvVars)) {
      if (value) {
        container = container.withEnvVariable(key, value);
      }
    }
    
    return container;
  }

  /**
   * Get Dagger LLM environment variables from the host
   */
  private getDaggerLLMEnvironment(): Record<string, string | undefined> {
    return {
      // Primary Anthropic configuration
      ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
      ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN,
      // Dagger-specific configuration
      DAGGER_ANTHROPIC_BASE_URL: process.env.DAGGER_ANTHROPIC_BASE_URL,
      DAGGER_ANTHROPIC_AUTH_TOKEN: process.env.DAGGER_ANTHROPIC_AUTH_TOKEN,
      // Legacy Claude configuration
      CLAUDE_BASE_URL: process.env.CLAUDE_BASE_URL,
      CLAUDE_API_KEY: process.env.CLAUDE_API_KEY || this.config.apiKey
    };
  }

  /**
   * Execute a claude-flow command
   */
  async execute(command: string, args: string[] = []): Promise<string> {
    const result = await this.container
      .withExec(['npx', 'claude-flow', command, ...args])
      .stdout();
    
    return result;
  }

  /**
   * Run SPARC TDD workflow
   */
  async runTdd(feature: string): Promise<string> {
    return this.sparc.tdd(feature);
  }

  /**
   * Initialize a swarm
   */
  async initSwarm(topology: string, objective: string): Promise<string> {
    return this.swarm.init(topology, objective);
  }

  /**
   * Store memory
   */
  async storeMemory(key: string, value: any): Promise<void> {
    await this.memory.store(key, value);
  }

  /**
   * Train neural model
   */
  async trainModel(modelType: string, data: any[]): Promise<void> {
    await this.neural.train(modelType, data);
  }

  /**
   * Analyze GitHub repository
   */
  async analyzeRepo(owner: string, repo: string): Promise<any> {
    return this.github.analyzeRepository(owner, repo);
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.client) {
      await this.client.close();
    }
  }

  /**
   * Build Docker image
   */
  async buildDockerImage(): Promise<string> {
    const dockerfile = await this.client.host().file('./docker/Dockerfile');
    
    const container = await this.client
      .container()
      .build(dockerfile, { 
        buildArgs: [
          { name: 'CLAUDE_FLOW_VERSION', value: '2.0.0-alpha.101' }
        ]
      });

    const imageRef = await container.export('./claude-flow.tar');
    
    return imageRef;
  }

  /**
   * Run tests
   */
  async runTests(category?: string): Promise<boolean> {
    const testCommand = category ? `test:${category}` : 'test';
    
    const result = await this.container
      .withWorkdir('/workspace')
      .withExec(['npm', 'run', testCommand])
      .exitCode();

    return result === 0;
  }
}

/**
 * Factory function to create and initialize a ClaudeFlow instance
 */
export async function createClaudeFlow(config?: Partial<ClaudeFlowConfig>): Promise<ClaudeFlow> {
  const claudeFlow = new ClaudeFlow(config);
  await claudeFlow.init();
  return claudeFlow;
}

// Export default for CLI usage
export default ClaudeFlow;