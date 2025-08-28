/**
 * Example: Using Claude Flow Dagger Module with Dagger LLM Integration
 * 
 * This example demonstrates how the module automatically detects and uses
 * ANTHROPIC_BASE_URL and ANTHROPIC_AUTH_TOKEN from the Dagger engine
 */

import { createClaudeFlow } from '../src/index';
import { dag, Container, object, func } from '@dagger.io/dagger';

/**
 * Example Dagger module that uses Claude Flow with LLM integration
 */
@object()
class ClaudeFlowLLMModule {
  /**
   * Run a SPARC TDD workflow using Dagger LLM configuration
   * 
   * Usage:
   *   dagger call --with-llm anthropic:claude-3-opus sparc-tdd --feature "user authentication"
   */
  @func()
  async sparcTdd(feature: string): Promise<string> {
    // Initialize Claude Flow - it will automatically detect and use
    // ANTHROPIC_BASE_URL and ANTHROPIC_AUTH_TOKEN from Dagger engine
    const claudeFlow = await createClaudeFlow({
      environment: 'production',
      // No need to provide apiKey - it will use ANTHROPIC_AUTH_TOKEN
    });

    try {
      // Run SPARC TDD workflow
      const result = await claudeFlow.runTdd(feature);
      return result;
    } finally {
      await claudeFlow.cleanup();
    }
  }

  /**
   * Initialize and run a swarm with automatic LLM configuration
   * 
   * Usage:
   *   dagger call --with-llm anthropic:claude-3-opus run-swarm \
   *     --topology hierarchical \
   *     --objective "Build a REST API"
   */
  @func()
  async runSwarm(topology: string, objective: string): Promise<string> {
    const claudeFlow = await createClaudeFlow({
      environment: 'production',
      // Dagger LLM configuration is automatically applied
    });

    try {
      // Initialize swarm
      await claudeFlow.initSwarm(topology, objective);
      
      // Execute task
      const result = await claudeFlow.swarm.execute(objective);
      return result;
    } finally {
      await claudeFlow.cleanup();
    }
  }

  /**
   * Analyze a GitHub repository using Dagger LLM
   * 
   * Usage:
   *   dagger call --with-llm anthropic:claude-3-opus analyze-repo \
   *     --owner "microsoft" \
   *     --repo "vscode"
   */
  @func()
  async analyzeRepo(owner: string, repo: string): Promise<string> {
    const claudeFlow = await createClaudeFlow({
      environment: 'production',
      github: {
        owner,
        repo,
        // GitHub token can be provided separately
        token: process.env.GITHUB_TOKEN,
      },
    });

    try {
      const analysis = await claudeFlow.analyzeRepo(owner, repo);
      return JSON.stringify(analysis, null, 2);
    } finally {
      await claudeFlow.cleanup();
    }
  }

  /**
   * Run a complete SPARC workflow with all phases
   * 
   * Usage:
   *   dagger call --with-llm anthropic:claude-3-opus complete-workflow \
   *     --task "Create a user authentication system"
   */
  @func()
  async completeWorkflow(task: string): Promise<string> {
    const claudeFlow = await createClaudeFlow({
      environment: 'production',
      features: {
        sparc: true,
        swarm: true,
        neural: true,
        memory: true,
      },
    });

    try {
      // Run complete SPARC workflow
      const result = await claudeFlow.sparc.completeWorkflow(task);
      
      if (result.success) {
        return `Workflow completed successfully:\n${result.output}`;
      } else {
        throw new Error(`Workflow failed: ${result.error}`);
      }
    } finally {
      await claudeFlow.cleanup();
    }
  }

  /**
   * Demonstrate automatic Dagger LLM configuration detection
   * 
   * Usage:
   *   dagger call --with-llm anthropic:claude-3-opus show-config
   */
  @func()
  async showConfig(): Promise<string> {
    const config = {
      // These are automatically detected from Dagger engine
      ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL || 'Not set',
      ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN ? 'Set (hidden)' : 'Not set',
      DAGGER_ANTHROPIC_BASE_URL: process.env.DAGGER_ANTHROPIC_BASE_URL || 'Not set',
      DAGGER_ANTHROPIC_AUTH_TOKEN: process.env.DAGGER_ANTHROPIC_AUTH_TOKEN ? 'Set (hidden)' : 'Not set',
      // Legacy support
      CLAUDE_API_KEY: process.env.CLAUDE_API_KEY ? 'Set (hidden)' : 'Not set',
      CLAUDE_BASE_URL: process.env.CLAUDE_BASE_URL || 'Not set',
      // Dagger LLM integration flag
      DAGGER_LLM_INTEGRATION: 'true',
    };

    return JSON.stringify(config, null, 2);
  }

  /**
   * Run with custom LLM configuration override
   * 
   * Usage:
   *   dagger call --with-llm anthropic:claude-3-opus custom-llm \
   *     --base-url "https://custom.anthropic.com" \
   *     --task "Build a chat application"
   */
  @func()
  async customLlm(baseUrl: string, task: string): Promise<string> {
    const claudeFlow = await createClaudeFlow({
      environment: 'production',
      // Override with custom base URL
      baseUrl: baseUrl,
      // Auth token still comes from Dagger LLM
    });

    try {
      const result = await claudeFlow.runTdd(task);
      return result;
    } finally {
      await claudeFlow.cleanup();
    }
  }

  /**
   * Test LLM connectivity and configuration
   * 
   * Usage:
   *   dagger call --with-llm anthropic:claude-3-opus test-connection
   */
  @func()
  async testConnection(): Promise<string> {
    const claudeFlow = await createClaudeFlow({
      environment: 'development',
      logging: {
        level: 'debug',
        format: 'text',
        destination: 'console',
      },
    });

    try {
      // Test basic connectivity
      const healthCheck = await claudeFlow.utils.healthCheck();
      const version = await claudeFlow.utils.getVersion();
      
      return `
Claude Flow Connection Test:
- Health Check: ${healthCheck ? 'PASS' : 'FAIL'}
- Version: ${version}
- LLM Integration: ${process.env.DAGGER_LLM_INTEGRATION === 'true' ? 'Enabled' : 'Disabled'}
- Base URL: ${process.env.ANTHROPIC_BASE_URL || 'Default'}
- Auth: ${process.env.ANTHROPIC_AUTH_TOKEN ? 'Configured' : 'Not configured'}
      `.trim();
    } finally {
      await claudeFlow.cleanup();
    }
  }
}

// Export for Dagger
export default ClaudeFlowLLMModule;