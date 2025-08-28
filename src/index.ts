/**
 * Claude Flow Dagger Module
 * 
 * This module provides a complete Dagger integration for Claude Flow CLI,
 * using the Docker container to run all commands with full CLI capabilities
 * and automatic LLM configuration passthrough from Dagger.
 */

import { dag, Container, Directory, object, func, field } from "@dagger.io/dagger";

// Type definitions
export interface ClaudeFlowConfig {
  env?: Record<string, string>;
  secrets?: Record<string, string>;
  mounts?: Array<{ source: Directory; target: string }>;
  workdir?: string;
  labels?: Record<string, string>;
  nonInteractive?: boolean;
  apiKey?: string;
  baseUrl?: string;
}

export interface DaggerLLMConfig {
  ANTHROPIC_BASE_URL?: string;
  ANTHROPIC_AUTH_TOKEN?: string;
  DAGGER_ANTHROPIC_BASE_URL?: string;
  DAGGER_ANTHROPIC_AUTH_TOKEN?: string;
  CLAUDE_API_KEY?: string;
  CLAUDE_BASE_URL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_BASE_URL?: string;
}

@object()
export class ClaudeFlowDagger {
  @field()
  dockerImage: string = "ghcr.io/liamhelmer/claude-flow-dagger:latest";

  @field()
  version: string = "2.0.0-alpha.101";

  /**
   * Creates a configured Claude Flow container with LLM settings
   * automatically passed through from Dagger environment
   */
  @func()
  async container(
    workspace?: Directory,
    config?: ClaudeFlowConfig
  ): Promise<Container> {
    // Get the base container
    let container = dag
      .container()
      .from(this.dockerImage);

    // Configure LLM environment variables from Dagger
    container = this.configureLLMEnvironment(container);

    // Mount workspace if provided
    if (workspace) {
      container = container.withMountedDirectory("/workspace", workspace);
      container = container.withWorkdir("/workspace");
    }

    // Apply custom configuration if provided
    if (config) {
      container = this.applyConfiguration(container, config);
    }

    // Set non-interactive mode by default
    if (config?.nonInteractive !== false) {
      container = container.withEnvVariable("CLAUDE_FLOW_NON_INTERACTIVE", "true");
    }
    
    return container;
  }

  /**
   * Run a claude-flow command with all CLI capabilities
   */
  @func()
  async run(
    command: string,
    args: string[] = [],
    workspace?: Directory,
    config?: ClaudeFlowConfig
  ): Promise<string> {
    const container = await this.container(workspace, config);
    
    // Build the full command
    const fullCommand = ["claude-flow", command, ...args];
    
    // Execute and return output
    const result = await container
      .withExec(fullCommand)
      .stdout();
    
    return result;
  }

  /**
   * Execute SPARC methodology commands
   */
  @func()
  async sparc(
    mode: string,
    task: string,
    workspace?: Directory,
    config?: ClaudeFlowConfig
  ): Promise<string> {
    return this.run("sparc", ["run", mode, task], workspace, config);
  }

  /**
   * Execute swarm commands
   */
  @func()
  async swarm(
    action: string,
    args: string[] = [],
    workspace?: Directory,
    config?: ClaudeFlowConfig
  ): Promise<string> {
    return this.run("swarm", [action, ...args], workspace, config);
  }

  /**
   * Execute agent commands
   */
  @func()
  async agent(
    action: string,
    args: string[] = [],
    workspace?: Directory,
    config?: ClaudeFlowConfig
  ): Promise<string> {
    return this.run("agent", [action, ...args], workspace, config);
  }

  /**
   * Execute memory commands
   */
  @func()
  async memory(
    action: string,
    args: string[] = [],
    workspace?: Directory,
    config?: ClaudeFlowConfig
  ): Promise<string> {
    return this.run("memory", [action, ...args], workspace, config);
  }

  /**
   * Execute neural commands
   */
  @func()
  async neural(
    action: string,
    args: string[] = [],
    workspace?: Directory,
    config?: ClaudeFlowConfig
  ): Promise<string> {
    return this.run("neural", [action, ...args], workspace, config);
  }

  /**
   * Execute GitHub integration commands
   */
  @func()
  async github(
    action: string,
    args: string[] = [],
    workspace?: Directory,
    config?: ClaudeFlowConfig
  ): Promise<string> {
    return this.run("github", [action, ...args], workspace, config);
  }

  /**
   * Execute TDD workflow
   */
  @func()
  async tdd(
    feature: string,
    workspace?: Directory,
    config?: ClaudeFlowConfig
  ): Promise<string> {
    return this.run("sparc", ["tdd", feature], workspace, config);
  }

  /**
   * Execute pipeline commands
   */
  @func()
  async pipeline(
    task: string,
    workspace?: Directory,
    config?: ClaudeFlowConfig
  ): Promise<string> {
    return this.run("sparc", ["pipeline", task], workspace, config);
  }

  /**
   * Execute batch commands for parallel processing
   */
  @func()
  async batch(
    modes: string[],
    task: string,
    workspace?: Directory,
    config?: ClaudeFlowConfig
  ): Promise<string> {
    return this.run("sparc", ["batch", modes.join(","), task], workspace, config);
  }

  /**
   * Execute MCP server commands
   */
  @func()
  async mcp(
    action: string,
    args: string[] = [],
    workspace?: Directory,
    config?: ClaudeFlowConfig
  ): Promise<string> {
    return this.run("mcp", [action, ...args], workspace, config);
  }

  /**
   * Execute hooks commands
   */
  @func()
  async hooks(
    action: string,
    args: string[] = [],
    workspace?: Directory,
    config?: ClaudeFlowConfig
  ): Promise<string> {
    return this.run("hooks", [action, ...args], workspace, config);
  }

  /**
   * Execute features detection
   */
  @func()
  async features(
    workspace?: Directory,
    config?: ClaudeFlowConfig
  ): Promise<string> {
    return this.run("features", ["detect"], workspace, config);
  }

  /**
   * Execute benchmark commands
   */
  @func()
  async benchmark(
    type: string = "all",
    workspace?: Directory,
    config?: ClaudeFlowConfig
  ): Promise<string> {
    return this.run("benchmark", ["run", type], workspace, config);
  }

  /**
   * Get claude-flow version information
   */
  @func()
  async getVersion(
    workspace?: Directory,
    config?: ClaudeFlowConfig
  ): Promise<string> {
    return this.run("--version", [], workspace, config);
  }

  /**
   * Execute custom claude-flow command with full flexibility
   */
  @func()
  async custom(
    fullCommand: string[],
    workspace?: Directory,
    config?: ClaudeFlowConfig
  ): Promise<string> {
    const container = await this.container(workspace, config);
    
    // Execute custom command
    const result = await container
      .withExec(["claude-flow", ...fullCommand])
      .stdout();
    
    return result;
  }

  /**
   * Build and push a custom Docker image with claude-flow
   */
  @func()
  async buildImage(
    registry: string,
    tag: string = "latest",
    workspace?: Directory
  ): Promise<string> {
    if (!workspace) {
      throw new Error("Workspace directory is required for building images");
    }

    const container = dag
      .container()
      .build(workspace, { dockerfile: "docker/Dockerfile" });

    const imageRef = `${registry}:${tag}`;
    await container.publish(imageRef);

    return `Successfully published image to ${imageRef}`;
  }

  /**
   * Configure LLM environment variables from Dagger
   */
  private configureLLMEnvironment(container: Container): Container {
    const llmVars = this.getDaggerLLMConfig();
    
    // Primary Anthropic configuration
    if (llmVars.ANTHROPIC_BASE_URL) {
      container = container.withEnvVariable("ANTHROPIC_BASE_URL", llmVars.ANTHROPIC_BASE_URL);
    }
    if (llmVars.ANTHROPIC_AUTH_TOKEN) {
      container = container.withEnvVariable("ANTHROPIC_AUTH_TOKEN", llmVars.ANTHROPIC_AUTH_TOKEN);
      container = container.withSecretVariable("ANTHROPIC_API_KEY", dag.setSecret("anthropic-key", llmVars.ANTHROPIC_AUTH_TOKEN));
    }
    
    // Alternative Dagger-specific variables
    if (llmVars.DAGGER_ANTHROPIC_BASE_URL) {
      container = container.withEnvVariable("DAGGER_ANTHROPIC_BASE_URL", llmVars.DAGGER_ANTHROPIC_BASE_URL);
    }
    if (llmVars.DAGGER_ANTHROPIC_AUTH_TOKEN) {
      container = container.withEnvVariable("DAGGER_ANTHROPIC_AUTH_TOKEN", llmVars.DAGGER_ANTHROPIC_AUTH_TOKEN);
    }
    
    // Claude-specific variables
    if (llmVars.CLAUDE_API_KEY) {
      container = container.withSecretVariable("CLAUDE_API_KEY", dag.setSecret("claude-key", llmVars.CLAUDE_API_KEY));
    }
    if (llmVars.CLAUDE_BASE_URL) {
      container = container.withEnvVariable("CLAUDE_BASE_URL", llmVars.CLAUDE_BASE_URL);
    }

    // OpenAI compatibility
    if (llmVars.OPENAI_API_KEY) {
      container = container.withSecretVariable("OPENAI_API_KEY", dag.setSecret("openai-key", llmVars.OPENAI_API_KEY));
    }
    if (llmVars.OPENAI_BASE_URL) {
      container = container.withEnvVariable("OPENAI_BASE_URL", llmVars.OPENAI_BASE_URL);
    }

    return container;
  }

  /**
   * Get Dagger LLM configuration from environment
   */
  private getDaggerLLMConfig(): DaggerLLMConfig {
    return {
      ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
      ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN,
      DAGGER_ANTHROPIC_BASE_URL: process.env.DAGGER_ANTHROPIC_BASE_URL,
      DAGGER_ANTHROPIC_AUTH_TOKEN: process.env.DAGGER_ANTHROPIC_AUTH_TOKEN,
      CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
      CLAUDE_BASE_URL: process.env.CLAUDE_BASE_URL,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
    };
  }

  /**
   * Apply custom configuration to container
   */
  private applyConfiguration(container: Container, config: ClaudeFlowConfig): Container {
    // Apply environment variables
    if (config.env) {
      for (const [key, value] of Object.entries(config.env)) {
        container = container.withEnvVariable(key, value);
      }
    }

    // Apply secrets
    if (config.secrets) {
      for (const [key, value] of Object.entries(config.secrets)) {
        container = container.withSecretVariable(key, dag.setSecret(key, value));
      }
    }

    // Mount additional directories
    if (config.mounts) {
      for (const mount of config.mounts) {
        container = container.withMountedDirectory(mount.target, mount.source);
      }
    }

    // Set working directory
    if (config.workdir) {
      container = container.withWorkdir(config.workdir);
    }

    // Add labels
    if (config.labels) {
      for (const [key, value] of Object.entries(config.labels)) {
        container = container.withLabel(key, value);
      }
    }

    // Add API key if provided in config
    if (config.apiKey) {
      container = container.withSecretVariable("CLAUDE_API_KEY", dag.setSecret("api-key", config.apiKey));
    }

    // Add base URL if provided in config
    if (config.baseUrl) {
      container = container.withEnvVariable("CLAUDE_BASE_URL", config.baseUrl);
    }

    return container;
  }

  /**
   * Execute interactive session (requires TTY support)
   */
  @func()
  async interactive(
    workspace?: Directory,
    config?: ClaudeFlowConfig
  ): Promise<Container> {
    const interactiveConfig = { ...config, nonInteractive: false };
    let container = await this.container(workspace, interactiveConfig);
    
    // Set up for interactive use
    container = container
      .withEntrypoint(["/bin/bash", "-c"])
      .withDefaultArgs(["claude-flow chat"]);
    
    return container;
  }

  /**
   * Check health and readiness of claude-flow
   */
  @func()
  async healthcheck(
    workspace?: Directory,
    config?: ClaudeFlowConfig
  ): Promise<string> {
    const container = await this.container(workspace, config);
    
    // Run comprehensive health checks
    const checks = [
      ["claude-flow", "--version"],
      ["claude-flow", "features", "detect"],
      ["claude-flow", "swarm", "status"],
      ["claude-flow", "memory", "usage"],
    ];
    
    const results: string[] = [];
    for (const check of checks) {
      try {
        const result = await container.withExec(check).stdout();
        results.push(`✅ ${check.join(" ")}: ${result.trim()}`);
      } catch (error) {
        results.push(`❌ ${check.join(" ")}: Failed`);
      }
    }
    
    return results.join("\n");
  }

  /**
   * Initialize swarm with specific topology
   */
  @func()
  async swarmInit(
    topology: string = "mesh",
    objective: string = "general",
    workspace?: Directory,
    config?: ClaudeFlowConfig
  ): Promise<string> {
    return this.run("swarm", ["init", "--topology", topology, "--objective", objective], workspace, config);
  }

  /**
   * Spawn agent with specific type
   */
  @func()
  async agentSpawn(
    agentType: string,
    taskDescription: string,
    workspace?: Directory,
    config?: ClaudeFlowConfig
  ): Promise<string> {
    return this.run("agent", ["spawn", "--type", agentType, "--task", taskDescription], workspace, config);
  }

  /**
   * Store data in memory
   */
  @func()
  async memoryStore(
    key: string,
    value: string,
    workspace?: Directory,
    config?: ClaudeFlowConfig
  ): Promise<string> {
    return this.run("memory", ["store", "--key", key, "--value", value], workspace, config);
  }

  /**
   * Retrieve data from memory
   */
  @func()
  async memoryRetrieve(
    key: string,
    workspace?: Directory,
    config?: ClaudeFlowConfig
  ): Promise<string> {
    return this.run("memory", ["retrieve", "--key", key], workspace, config);
  }

  /**
   * Train neural model
   */
  @func()
  async neuralTrain(
    modelType: string,
    dataPath: string,
    workspace?: Directory,
    config?: ClaudeFlowConfig
  ): Promise<string> {
    return this.run("neural", ["train", "--model", modelType, "--data", dataPath], workspace, config);
  }

  /**
   * Analyze GitHub repository
   */
  @func()
  async githubAnalyze(
    repoUrl: string,
    workspace?: Directory,
    config?: ClaudeFlowConfig
  ): Promise<string> {
    return this.run("github", ["analyze", "--repo", repoUrl], workspace, config);
  }

  /**
   * Run tests within the container
   */
  @func()
  async test(
    testSuite: string = "all",
    workspace?: Directory,
    config?: ClaudeFlowConfig
  ): Promise<string> {
    const container = await this.container(workspace, config);
    
    // Run tests based on suite
    const testCommand = testSuite === "all" 
      ? ["npm", "test"]
      : ["npm", "run", `test:${testSuite}`];
    
    const result = await container
      .withExec(testCommand)
      .stdout();
    
    return result;
  }
}

// Export default instance for convenience
export default new ClaudeFlowDagger();