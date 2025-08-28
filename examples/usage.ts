/**
 * Claude Flow Dagger Module - Usage Examples
 * 
 * This file demonstrates how to use the Claude Flow Dagger module
 * with Docker container integration and full CLI capabilities.
 */

import { dag, Directory } from "@dagger.io/dagger";
import { ClaudeFlowDagger, ClaudeFlowConfig } from "../src/index";

async function examples() {
  // Create a new instance of Claude Flow Dagger
  const claudeFlow = new ClaudeFlowDagger();

  // Get the current workspace directory
  const workspace = dag.host().directory(".");

  // Optional configuration
  const config: ClaudeFlowConfig = {
    env: {
      DEBUG: "true",
      LOG_LEVEL: "verbose"
    },
    secrets: {
      GITHUB_TOKEN: process.env.GITHUB_TOKEN || ""
    },
    nonInteractive: true,
    workdir: "/workspace"
  };

  console.log("🚀 Claude Flow Dagger Module Examples\n");

  // Example 1: Check version
  console.log("1️⃣ Getting Claude Flow version...");
  const version = await claudeFlow.getVersion(workspace, config);
  console.log(`Version: ${version}\n`);

  // Example 2: Run health check
  console.log("2️⃣ Running health check...");
  const health = await claudeFlow.healthcheck(workspace, config);
  console.log(`Health Check Results:\n${health}\n`);

  // Example 3: Detect features
  console.log("3️⃣ Detecting available features...");
  const features = await claudeFlow.features(workspace, config);
  console.log(`Features:\n${features}\n`);

  // Example 4: Initialize a swarm
  console.log("4️⃣ Initializing swarm with mesh topology...");
  const swarmResult = await claudeFlow.swarmInit("mesh", "development", workspace, config);
  console.log(`Swarm initialized: ${swarmResult}\n`);

  // Example 5: Spawn an agent
  console.log("5️⃣ Spawning a coder agent...");
  const agentResult = await claudeFlow.agentSpawn("coder", "Implement REST API", workspace, config);
  console.log(`Agent spawned: ${agentResult}\n`);

  // Example 6: Store data in memory
  console.log("6️⃣ Storing data in memory...");
  const memoryStoreResult = await claudeFlow.memoryStore(
    "project-config",
    JSON.stringify({ name: "claude-flow-dagger", version: "1.0.0" }),
    workspace,
    config
  );
  console.log(`Memory stored: ${memoryStoreResult}\n`);

  // Example 7: Retrieve data from memory
  console.log("7️⃣ Retrieving data from memory...");
  const memoryRetrieveResult = await claudeFlow.memoryRetrieve("project-config", workspace, config);
  console.log(`Memory retrieved: ${memoryRetrieveResult}\n`);

  // Example 8: Run SPARC TDD workflow
  console.log("8️⃣ Running SPARC TDD workflow...");
  const tddResult = await claudeFlow.tdd("user authentication", workspace, config);
  console.log(`TDD Result: ${tddResult}\n`);

  // Example 9: Execute pipeline
  console.log("9️⃣ Executing SPARC pipeline...");
  const pipelineResult = await claudeFlow.pipeline("Build REST API with authentication", workspace, config);
  console.log(`Pipeline Result: ${pipelineResult}\n`);

  // Example 10: Run batch processing
  console.log("🔟 Running batch processing...");
  const batchResult = await claudeFlow.batch(
    ["specification", "pseudocode", "architecture"],
    "Design microservices architecture",
    workspace,
    config
  );
  console.log(`Batch Result: ${batchResult}\n`);

  // Example 11: GitHub repository analysis
  console.log("1️⃣1️⃣ Analyzing GitHub repository...");
  const githubResult = await claudeFlow.githubAnalyze(
    "https://github.com/ruvnet/claude-flow",
    workspace,
    config
  );
  console.log(`GitHub Analysis: ${githubResult}\n`);

  // Example 12: Run benchmark
  console.log("1️⃣2️⃣ Running benchmarks...");
  const benchmarkResult = await claudeFlow.benchmark("performance", workspace, config);
  console.log(`Benchmark Results: ${benchmarkResult}\n`);

  // Example 13: Custom command execution
  console.log("1️⃣3️⃣ Executing custom command...");
  const customResult = await claudeFlow.custom(
    ["swarm", "status", "--format", "json"],
    workspace,
    config
  );
  console.log(`Custom Command Result: ${customResult}\n`);

  // Example 14: MCP server operations
  console.log("1️⃣4️⃣ Starting MCP server...");
  const mcpResult = await claudeFlow.mcp("start", [], workspace, config);
  console.log(`MCP Server: ${mcpResult}\n`);

  // Example 15: Hooks operations
  console.log("1️⃣5️⃣ Setting up hooks...");
  const hooksResult = await claudeFlow.hooks("pre-task", ["--description", "Initialize project"], workspace, config);
  console.log(`Hooks Result: ${hooksResult}\n`);

  console.log("✅ All examples completed successfully!");
}

// Advanced example: Building and pushing custom Docker image
async function buildCustomImage() {
  const claudeFlow = new ClaudeFlowDagger();
  const workspace = dag.host().directory(".");

  console.log("🏗️ Building custom Docker image...");
  
  try {
    const result = await claudeFlow.buildImage(
      "ghcr.io/myorg/claude-flow-custom",
      "v1.0.0",
      workspace
    );
    console.log(`Build result: ${result}`);
  } catch (error) {
    console.error(`Build failed: ${error}`);
  }
}

// Example: Using with different LLM configurations
async function withCustomLLMConfig() {
  const claudeFlow = new ClaudeFlowDagger();
  const workspace = dag.host().directory(".");

  // Configuration with custom API settings
  const customConfig: ClaudeFlowConfig = {
    apiKey: process.env.MY_CLAUDE_API_KEY || "",
    baseUrl: "https://my-custom-llm-endpoint.com",
    env: {
      ANTHROPIC_BASE_URL: "https://my-proxy.com/anthropic",
      ANTHROPIC_AUTH_TOKEN: process.env.MY_AUTH_TOKEN || ""
    }
  };

  console.log("🔐 Running with custom LLM configuration...");
  const result = await claudeFlow.sparc(
    "specification",
    "Design authentication system",
    workspace,
    customConfig
  );
  console.log(`Result: ${result}`);
}

// Example: Interactive session (for development)
async function interactiveSession() {
  const claudeFlow = new ClaudeFlowDagger();
  const workspace = dag.host().directory(".");

  console.log("💬 Creating interactive session container...");
  
  const container = await claudeFlow.interactive(workspace, {
    nonInteractive: false,
    env: {
      TERM: "xterm-256color"
    }
  });

  console.log("Interactive container created. You can now attach to it for interactive use.");
  // Note: Actual interaction would require terminal attachment capabilities
}

// Example: Running tests
async function runTests() {
  const claudeFlow = new ClaudeFlowDagger();
  const workspace = dag.host().directory(".");

  console.log("🧪 Running test suites...");

  const testSuites = ["unit", "integration", "e2e"];
  
  for (const suite of testSuites) {
    console.log(`Running ${suite} tests...`);
    try {
      const result = await claudeFlow.test(suite, workspace);
      console.log(`${suite} tests: ✅\n${result}`);
    } catch (error) {
      console.log(`${suite} tests: ❌\n${error}`);
    }
  }
}

// Main function to run examples
async function main() {
  const args = process.argv.slice(2);
  
  switch (args[0]) {
    case "build":
      await buildCustomImage();
      break;
    case "llm":
      await withCustomLLMConfig();
      break;
    case "interactive":
      await interactiveSession();
      break;
    case "test":
      await runTests();
      break;
    default:
      await examples();
  }
}

// Run the examples
main().catch(console.error);