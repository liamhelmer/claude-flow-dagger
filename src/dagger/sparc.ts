/**
 * SPARC Module for Claude Flow Dagger
 * Implements SPARC methodology (Specification, Pseudocode, Architecture, Refinement, Completion)
 */

import { Container } from '@dagger.io/dagger';
import { ClaudeFlowConfig } from '../config';
import { SparcMode, ExecutionResult } from '../types';

export class SparcModule {
  constructor(
    private container: Container,
    private config: ClaudeFlowConfig
  ) {}

  /**
   * Run a specific SPARC mode
   */
  async run(mode: SparcMode, task: string): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Container already has Dagger LLM configuration from initialization
      const result = await this.container
        .withExec(['npx', 'claude-flow', 'sparc', 'run', mode, task, '--non-interactive'])
        .stdout();
      
      return {
        success: true,
        output: result,
        duration: Date.now() - startTime,
        metadata: { mode, task }
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        metadata: { mode, task }
      };
    }
  }

  /**
   * Run complete TDD workflow
   */
  async tdd(feature: string): Promise<string> {
    // Container already has Dagger LLM configuration from initialization
    const result = await this.container
      .withExec(['npx', 'claude-flow', 'sparc', 'tdd', feature, '--non-interactive'])
      .stdout();
    
    return result;
  }

  /**
   * Run complete SPARC workflow (all phases)
   */
  async completeWorkflow(task: string): Promise<ExecutionResult> {
    const phases: SparcMode[] = [
      'specification',
      'pseudocode',
      'architecture',
      'refinement',
      'completion'
    ];
    
    const results: ExecutionResult[] = [];
    const startTime = Date.now();
    
    for (const phase of phases) {
      const result = await this.run(phase, task);
      results.push(result);
      
      if (!result.success) {
        return {
          success: false,
          output: JSON.stringify(results),
          error: `Failed at phase: ${phase}`,
          duration: Date.now() - startTime,
          metadata: { phase, task, results }
        };
      }
    }
    
    return {
      success: true,
      output: JSON.stringify(results),
      duration: Date.now() - startTime,
      metadata: { task, results }
    };
  }

  /**
   * Run batch SPARC operations
   */
  async batch(modes: SparcMode[], task: string): Promise<ExecutionResult[]> {
    const modesString = modes.join(',');
    
    // Container already has Dagger LLM configuration from initialization
    const result = await this.container
      .withExec(['npx', 'claude-flow', 'sparc', 'batch', modesString, task, '--non-interactive'])
      .stdout();
    
    // Parse results and return
    const results: ExecutionResult[] = modes.map(mode => ({
      success: true,
      output: result,
      metadata: { mode, task }
    }));
    
    return results;
  }

  /**
   * Run pipeline (full SPARC pipeline)
   */
  async pipeline(task: string): Promise<string> {
    // Container already has Dagger LLM configuration from initialization
    const result = await this.container
      .withExec(['npx', 'claude-flow', 'sparc', 'pipeline', task, '--non-interactive'])
      .stdout();
    
    return result;
  }

  /**
   * Run concurrent tasks from file
   */
  async concurrent(mode: SparcMode, tasksFile: string): Promise<string> {
    // Container already has Dagger LLM configuration from initialization
    const result = await this.container
      .withExec(['npx', 'claude-flow', 'sparc', 'concurrent', mode, tasksFile, '--non-interactive'])
      .stdout();
    
    return result;
  }

  /**
   * Get information about a specific mode
   */
  async info(mode: SparcMode): Promise<string> {
    const result = await this.container
      .withExec(['npx', 'claude-flow', 'sparc', 'info', mode])
      .stdout();
    
    return result;
  }

  /**
   * List available SPARC modes
   */
  async listModes(): Promise<string[]> {
    const result = await this.container
      .withExec(['npx', 'claude-flow', 'sparc', 'modes'])
      .stdout();
    
    return result.split('\n').filter(line => line.trim());
  }

  /**
   * Run specification and pseudocode phases
   */
  async specPseudocode(task: string): Promise<ExecutionResult> {
    return this.run('spec-pseudocode', task);
  }

  /**
   * Run architect mode
   */
  async architect(task: string): Promise<ExecutionResult> {
    return this.run('architect', task);
  }

  /**
   * Run integration mode
   */
  async integration(task: string): Promise<ExecutionResult> {
    return this.run('integration', task);
  }

  /**
   * Run backend development mode
   */
  async backend(task: string): Promise<ExecutionResult> {
    return this.run('backend', task);
  }

  /**
   * Run mobile development mode
   */
  async mobile(task: string): Promise<ExecutionResult> {
    return this.run('mobile', task);
  }

  /**
   * Run ML development mode
   */
  async ml(task: string): Promise<ExecutionResult> {
    return this.run('ml', task);
  }

  /**
   * Run CI/CD mode
   */
  async cicd(task: string): Promise<ExecutionResult> {
    return this.run('cicd', task);
  }

  /**
   * Run API documentation mode
   */
  async api(task: string): Promise<ExecutionResult> {
    return this.run('api', task);
  }

  /**
   * Run security mode
   */
  async security(task: string): Promise<ExecutionResult> {
    return this.run('security', task);
  }

  /**
   * Run full-stack mode
   */
  async fullstack(task: string): Promise<ExecutionResult> {
    return this.run('fullstack', task);
  }
}