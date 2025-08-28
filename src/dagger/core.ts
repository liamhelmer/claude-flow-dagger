/**
 * Core Dagger module for Claude Flow
 */

import { Container, Directory, Secret } from '@dagger.io/dagger';
import { ClaudeFlowConfig } from '../config';
import { SparcMode, SwarmTopology, AgentType } from '../types';

export class ClaudeFlowDagger {
  constructor(
    private container: Container,
    private config: ClaudeFlowConfig
  ) {
    // Automatically configure container with Dagger LLM environment variables
    this.container = this.configureDaggerLLMEnvironment(container);
  }

  /**
   * Configure container with Dagger engine LLM environment variables
   * Automatically passes ANTHROPIC_BASE_URL and ANTHROPIC_AUTH_TOKEN
   */
  private configureDaggerLLMEnvironment(container: Container): Container {
    let configuredContainer = container;

    // Check for Dagger LLM configuration environment variables
    // These are typically set by the Dagger engine when LLM is configured
    const daggerLLMVars = {
      // Dagger engine LLM configuration
      ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
      ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN,
      // Also check for DAGGER_ prefixed versions
      DAGGER_ANTHROPIC_BASE_URL: process.env.DAGGER_ANTHROPIC_BASE_URL,
      DAGGER_ANTHROPIC_AUTH_TOKEN: process.env.DAGGER_ANTHROPIC_AUTH_TOKEN,
      // Legacy support for CLAUDE_ prefix
      CLAUDE_BASE_URL: process.env.CLAUDE_BASE_URL,
      CLAUDE_AUTH_TOKEN: process.env.CLAUDE_AUTH_TOKEN
    };

    // Determine which variables to use (prefer ANTHROPIC_ over DAGGER_ over CLAUDE_)
    const baseUrl = daggerLLMVars.ANTHROPIC_BASE_URL || 
                    daggerLLMVars.DAGGER_ANTHROPIC_BASE_URL || 
                    daggerLLMVars.CLAUDE_BASE_URL || 
                    this.config.baseUrl;
    
    const authToken = daggerLLMVars.ANTHROPIC_AUTH_TOKEN || 
                     daggerLLMVars.DAGGER_ANTHROPIC_AUTH_TOKEN || 
                     daggerLLMVars.CLAUDE_AUTH_TOKEN || 
                     this.config.apiKey;

    // Set environment variables for claude-flow
    if (baseUrl) {
      configuredContainer = configuredContainer
        .withEnvVariable('ANTHROPIC_BASE_URL', baseUrl)
        .withEnvVariable('CLAUDE_BASE_URL', baseUrl); // Compatibility
    }

    if (authToken) {
      configuredContainer = configuredContainer
        .withEnvVariable('ANTHROPIC_AUTH_TOKEN', authToken)
        .withEnvVariable('CLAUDE_API_KEY', authToken); // Compatibility
    }

    // Set flag to indicate Dagger LLM integration
    configuredContainer = configuredContainer
      .withEnvVariable('DAGGER_LLM_INTEGRATION', 'true');

    return configuredContainer;
  }

  /**
   * Execute a claude-flow command with non-interactive mode
   * Automatically includes Dagger LLM configuration
   */
  async execute(command: string, args: string[] = []): Promise<string> {
    // Add non-interactive flags
    const nonInteractiveArgs = ['--non-interactive', '--json', ...args];
    
    // Container already has Dagger LLM environment variables from constructor
    const result = await this.container
      .withEnvVariable('CLAUDE_FLOW_NON_INTERACTIVE', 'true')
      .withExec(['npx', 'claude-flow', command, ...nonInteractiveArgs])
      .stdout();
    
    return result;
  }

  /**
   * Execute with workspace mounted
   * Automatically includes Dagger LLM configuration
   */
  async executeWithWorkspace(
    command: string,
    args: string[] = [],
    workspaceDir: Directory
  ): Promise<string> {
    // Container already has Dagger LLM environment variables from constructor
    const result = await this.container
      .withDirectory('/workspace', workspaceDir)
      .withWorkdir('/workspace')
      .withExec(['npx', 'claude-flow', command, ...args])
      .stdout();
    
    return result;
  }

  /**
   * Execute with secrets
   */
  async executeWithSecrets(
    command: string,
    args: string[] = [],
    secrets: Record<string, Secret>
  ): Promise<string> {
    let containerWithSecrets = this.container;
    
    for (const [key, secret] of Object.entries(secrets)) {
      containerWithSecrets = containerWithSecrets.withSecretVariable(key, secret);
    }
    
    const result = await containerWithSecrets
      .withExec(['npx', 'claude-flow', command, ...args])
      .stdout();
    
    return result;
  }

  /**
   * Run a batch of commands
   */
  async executeBatch(commands: Array<{ command: string; args?: string[] }>): Promise<string[]> {
    const results: string[] = [];
    
    for (const { command, args = [] } of commands) {
      const result = await this.execute(command, args);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Run commands in parallel
   */
  async executeParallel(
    commands: Array<{ command: string; args?: string[] }>
  ): Promise<string[]> {
    const promises = commands.map(({ command, args = [] }) =>
      this.execute(command, args)
    );
    
    return Promise.all(promises);
  }

  /**
   * Run with custom environment variables
   */
  async executeWithEnv(
    command: string,
    args: string[] = [],
    env: Record<string, string>
  ): Promise<string> {
    let containerWithEnv = this.container;
    
    for (const [key, value] of Object.entries(env)) {
      containerWithEnv = containerWithEnv.withEnvVariable(key, value);
    }
    
    const result = await containerWithEnv
      .withExec(['npx', 'claude-flow', command, ...args])
      .stdout();
    
    return result;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.container
        .withExec(['npx', 'claude-flow', 'version'])
        .exitCode();
      
      return result === 0;
    } catch {
      return false;
    }
  }

  /**
   * Get version info
   */
  async getVersion(): Promise<string> {
    return this.execute('version', ['--json']);
  }

  /**
   * Initialize configuration
   */
  async initConfig(): Promise<void> {
    await this.execute('config', ['init', '--force']);
  }

  /**
   * Run with timeout
   */
  async executeWithTimeout(
    command: string,
    args: string[] = [],
    timeoutMs: number
  ): Promise<string> {
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error(`Command timed out after ${timeoutMs}ms`)), timeoutMs)
    );
    
    const commandPromise = this.execute(command, args);
    
    return Promise.race([commandPromise, timeoutPromise]);
  }

  /**
   * Run with retries
   */
  async executeWithRetry(
    command: string,
    args: string[] = [],
    maxRetries: number = 3
  ): Promise<string> {
    let lastError: Error | undefined;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.execute(command, args);
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Export container for advanced usage
   */
  getContainer(): Container {
    return this.container;
  }
}