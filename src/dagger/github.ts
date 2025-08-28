/**
 * GitHub Module for Claude Flow Dagger
 * Manages GitHub repository operations and integrations
 */

import { Container } from '@dagger.io/dagger';
import { ClaudeFlowConfig } from '../config';
import { GitHubConfig } from '../types';

export class GitHubModule {
  constructor(
    private container: Container,
    private config: ClaudeFlowConfig
  ) {}

  /**
   * Analyze repository
   */
  async analyzeRepository(owner: string, repo: string): Promise<any> {
    const result = await this.container
      .withEnvVariable('GITHUB_TOKEN', this.config.github?.token || '')
      .withExec(['npx', 'claude-flow', 'github', 'analyze', owner, repo, '--json'])
      .stdout();
    
    return JSON.parse(result);
  }

  /**
   * Create pull request
   */
  async createPR(title: string, body: string, branch?: string): Promise<string> {
    const args = ['github', 'pr', 'create', title, '--body', body];
    if (branch) args.push('--branch', branch);
    
    const result = await this.container
      .withEnvVariable('GITHUB_TOKEN', this.config.github?.token || '')
      .withExec(['npx', 'claude-flow', ...args])
      .stdout();
    
    return result;
  }

  /**
   * Review pull request
   */
  async reviewPR(prNumber: number): Promise<any> {
    const result = await this.container
      .withEnvVariable('GITHUB_TOKEN', this.config.github?.token || '')
      .withEnvVariable('CLAUDE_API_KEY', this.config.apiKey || '')
      .withExec(['npx', 'claude-flow', 'github', 'pr', 'review', prNumber.toString(), '--json'])
      .stdout();
    
    return JSON.parse(result);
  }

  /**
   * Triage issues
   */
  async triageIssues(): Promise<any> {
    const result = await this.container
      .withEnvVariable('GITHUB_TOKEN', this.config.github?.token || '')
      .withEnvVariable('CLAUDE_API_KEY', this.config.apiKey || '')
      .withExec(['npx', 'claude-flow', 'github', 'issues', 'triage', '--json'])
      .stdout();
    
    return JSON.parse(result);
  }

  /**
   * Create release
   */
  async createRelease(version: string, notes: string): Promise<string> {
    const result = await this.container
      .withEnvVariable('GITHUB_TOKEN', this.config.github?.token || '')
      .withExec(['npx', 'claude-flow', 'github', 'release', 'create', version, '--notes', notes])
      .stdout();
    
    return result;
  }

  /**
   * Run security scan
   */
  async securityScan(): Promise<any> {
    const result = await this.container
      .withEnvVariable('GITHUB_TOKEN', this.config.github?.token || '')
      .withExec(['npx', 'claude-flow', 'github', 'security', 'scan', '--json'])
      .stdout();
    
    return JSON.parse(result);
  }

  /**
   * Sync project board
   */
  async syncProjectBoard(): Promise<void> {
    await this.container
      .withEnvVariable('GITHUB_TOKEN', this.config.github?.token || '')
      .withExec(['npx', 'claude-flow', 'github', 'project', 'sync'])
      .stdout();
  }

  /**
   * Generate documentation
   */
  async generateDocs(): Promise<string> {
    const result = await this.container
      .withEnvVariable('GITHUB_TOKEN', this.config.github?.token || '')
      .withEnvVariable('CLAUDE_API_KEY', this.config.apiKey || '')
      .withExec(['npx', 'claude-flow', 'github', 'docs', 'generate'])
      .stdout();
    
    return result;
  }
}