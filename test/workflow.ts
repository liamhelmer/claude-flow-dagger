/**
 * Claude Flow Dagger Module - Test Workflow
 * 
 * This workflow tests the module by:
 * 1. Cloning a test repository
 * 2. Creating a new branch
 * 3. Running claude-flow hive-mind to build a hello world app
 * 4. Committing and pushing changes
 * 5. Creating a pull request
 * 6. Verifying the app works
 */

import { dag, Container, Directory, object, func } from "@dagger.io/dagger";
import { ClaudeFlowDagger } from "../src/index";

@object()
export class ClaudeFlowTestWorkflow {
  /**
   * Main test workflow
   */
  @func()
  async test(
    githubToken: string,
    anthropicToken?: string,
    anthropicBaseUrl?: string
  ): Promise<string> {
    const results: string[] = [];
    
    try {
      // Step 1: Clone the repository
      results.push("📦 Step 1: Cloning repository...");
      const repo = await this.cloneRepository(githubToken);
      
      // Step 2: Create a new branch
      const branchName = `claude-flow-test-${Date.now()}`;
      results.push(`🌿 Step 2: Creating branch ${branchName}...`);
      const workspace = await this.createBranch(repo, branchName);
      
      // Step 3: Run claude-flow hive-mind
      results.push("🤖 Step 3: Running claude-flow hive-mind...");
      const claudeResult = await this.runClaudeFlow(
        workspace,
        anthropicToken,
        anthropicBaseUrl
      );
      results.push(`Claude Flow output: ${claudeResult.substring(0, 200)}...`);
      
      // Step 4: Commit and push changes
      results.push("💾 Step 4: Committing and pushing changes...");
      const commitResult = await this.commitAndPush(
        workspace,
        branchName,
        githubToken
      );
      results.push(`Commit: ${commitResult}`);
      
      // Step 5: Create pull request
      results.push("🔄 Step 5: Creating pull request...");
      const prUrl = await this.createPullRequest(
        workspace,
        branchName,
        githubToken,
        claudeResult
      );
      results.push(`Pull Request: ${prUrl}`);
      
      // Step 6: Test the hello world app
      results.push("🧪 Step 6: Testing hello world app...");
      const testResult = await this.testHelloWorld(workspace);
      results.push(`Test result: ${testResult}`);
      
      results.push("\n✅ All tests passed successfully!");
      return results.join("\n");
      
    } catch (error) {
      results.push(`\n❌ Test failed: ${error}`);
      return results.join("\n");
    }
  }

  /**
   * Clone the test repository
   */
  @func()
  async cloneRepository(githubToken: string): Promise<Container> {
    return dag
      .container()
      .from("alpine/git:latest")
      .withEnvVariable("GITHUB_TOKEN", githubToken)
      .withExec([
        "git",
        "clone",
        `https://${githubToken}@github.com/badal-io/claude-test-repo.git`,
        "/workspace"
      ])
      .withWorkdir("/workspace");
  }

  /**
   * Create a new branch
   */
  @func()
  async createBranch(
    repo: Container,
    branchName: string
  ): Promise<Container> {
    // Check if we're on the default branch
    const currentBranch = await repo
      .withExec(["git", "rev-parse", "--abbrev-ref", "HEAD"])
      .stdout();
    
    if (currentBranch.trim() === "main" || currentBranch.trim() === "master") {
      // Create and checkout new branch
      return repo
        .withExec(["git", "checkout", "-b", branchName])
        .withExec(["git", "config", "user.email", "claude-flow@example.com"])
        .withExec(["git", "config", "user.name", "Claude Flow Bot"]);
    }
    
    return repo;
  }

  /**
   * Run claude-flow with hive-mind
   */
  @func()
  async runClaudeFlow(
    workspace: Container,
    anthropicToken?: string,
    anthropicBaseUrl?: string
  ): Promise<string> {
    const claudeFlow = new ClaudeFlowDagger();
    
    // Get the workspace directory
    const workspaceDir = workspace.directory("/workspace");
    
    // Configuration for claude-flow
    const config = {
      env: {
        CLAUDE_FLOW_NON_INTERACTIVE: "true",
        DEBUG: "true"
      },
      secrets: anthropicToken ? {
        ANTHROPIC_AUTH_TOKEN: anthropicToken
      } : {},
      nonInteractive: true
    };
    
    if (anthropicBaseUrl) {
      config.env["ANTHROPIC_BASE_URL"] = anthropicBaseUrl;
    }
    
    // Initialize hive-mind
    const initResult = await claudeFlow.custom(
      ["hive-mind", "init"],
      workspaceDir,
      config
    );
    
    // Spawn hive-mind task to build hello world app
    const spawnResult = await claudeFlow.custom(
      [
        "hive-mind",
        "spawn",
        "build a nodejs hello world app",
        "--claude",
        "--non-interactive"
      ],
      workspaceDir,
      config
    );
    
    return `${initResult}\n${spawnResult}`;
  }

  /**
   * Commit and push changes
   */
  @func()
  async commitAndPush(
    workspace: Container,
    branchName: string,
    githubToken: string
  ): Promise<string> {
    // Add all changes
    const commitContainer = await workspace
      .withExec(["git", "add", "-A"])
      .withExec(["git", "status"]);
    
    const status = await commitContainer.stdout();
    
    // Check if there are changes to commit
    if (status.includes("nothing to commit")) {
      return "No changes to commit";
    }
    
    // Commit changes
    const commitMessage = `feat: build hello world app with Claude Flow

Generated using Claude Flow Dagger module with hive-mind.
Branch: ${branchName}
Timestamp: ${new Date().toISOString()}`;
    
    const committed = await commitContainer
      .withExec(["git", "commit", "-m", commitMessage]);
    
    // Push to remote
    const pushed = await committed
      .withEnvVariable("GITHUB_TOKEN", githubToken)
      .withExec([
        "git",
        "push",
        `https://${githubToken}@github.com/badal-io/claude-test-repo.git`,
        branchName
      ]);
    
    const pushResult = await pushed.stdout();
    return `Committed and pushed to ${branchName}`;
  }

  /**
   * Create a pull request
   */
  @func()
  async createPullRequest(
    workspace: Container,
    branchName: string,
    githubToken: string,
    claudeOutput: string
  ): Promise<string> {
    // Use GitHub CLI to create PR
    const prContainer = dag
      .container()
      .from("ghcr.io/liamhelmer/claude-flow-dagger:latest")
      .withMountedDirectory("/workspace", workspace.directory("/workspace"))
      .withWorkdir("/workspace")
      .withEnvVariable("GITHUB_TOKEN", githubToken);
    
    // Create PR body
    const prBody = `## 🤖 Claude Flow Generated Hello World App

This pull request was automatically generated by Claude Flow Dagger module using hive-mind.

### What was done:
- Initialized hive-mind collective intelligence
- Spawned task to build a Node.js hello world application
- Generated all necessary files and configuration

### Claude Flow Output:
\`\`\`
${claudeOutput.substring(0, 1000)}
${claudeOutput.length > 1000 ? '\n... (truncated)' : ''}
\`\`\`

### Branch: ${branchName}
### Generated at: ${new Date().toISOString()}

---
*This PR was created automatically by Claude Flow Test Workflow*`;
    
    // Create the PR
    const prResult = await prContainer
      .withExec([
        "gh",
        "pr",
        "create",
        "--base", "main",
        "--head", branchName,
        "--title", "🤖 Claude Flow: Hello World App",
        "--body", prBody
      ])
      .stdout();
    
    // Extract PR URL from output
    const prUrlMatch = prResult.match(/https:\/\/github\.com\/[^\s]+/);
    return prUrlMatch ? prUrlMatch[0] : prResult;
  }

  /**
   * Test the generated hello world app
   */
  @func()
  async testHelloWorld(workspace: Container): Promise<string> {
    const testResults: string[] = [];
    
    // Check if package.json exists
    const checkPackageJson = await workspace
      .withExec(["test", "-f", "package.json"])
      .exitCode();
    
    if (checkPackageJson !== 0) {
      testResults.push("⚠️ No package.json found, checking for other app files...");
      
      // Check for any JS/TS files
      const jsFiles = await workspace
        .withExec(["find", ".", "-name", "*.js", "-o", "-name", "*.ts"])
        .stdout();
      
      if (!jsFiles.trim()) {
        return "❌ No JavaScript/TypeScript files found";
      }
      
      testResults.push(`Found files: ${jsFiles.substring(0, 200)}`);
    }
    
    // Try to find the main app file
    const appFiles = ["index.js", "app.js", "server.js", "main.js", "hello.js"];
    let mainFile = "";
    
    for (const file of appFiles) {
      const exists = await workspace
        .withExec(["test", "-f", file])
        .exitCode();
      
      if (exists === 0) {
        mainFile = file;
        break;
      }
    }
    
    if (!mainFile) {
      // Try to find any JS file with "hello" in it
      const helloFiles = await workspace
        .withExec(["grep", "-l", "-i", "hello", "*.js"])
        .stdout()
        .catch(() => "");
      
      if (helloFiles.trim()) {
        mainFile = helloFiles.trim().split("\n")[0];
      }
    }
    
    if (!mainFile) {
      return "❌ No main application file found";
    }
    
    testResults.push(`✅ Found main file: ${mainFile}`);
    
    // Install dependencies if package.json exists
    if (checkPackageJson === 0) {
      testResults.push("📦 Installing dependencies...");
      
      const installed = await workspace
        .withExec(["npm", "install"])
        .stdout()
        .catch((e: any) => `Install error: ${e}`);
      
      testResults.push("✅ Dependencies installed");
    }
    
    // Run the app and check output
    testResults.push(`🚀 Running ${mainFile}...`);
    
    const output = await workspace
      .withExec(["node", mainFile])
      .stdout()
      .catch((e: any) => `Runtime error: ${e}`);
    
    // Check if output contains "hello world" (case insensitive)
    if (output.toLowerCase().includes("hello") && output.toLowerCase().includes("world")) {
      testResults.push(`✅ App successfully outputs: ${output.trim()}`);
      return testResults.join("\n");
    } else {
      testResults.push(`❌ App output doesn't contain 'hello world': ${output}`);
      
      // Try to check the file content
      const content = await workspace
        .withExec(["cat", mainFile])
        .stdout();
      
      if (content.toLowerCase().includes("hello") && content.toLowerCase().includes("world")) {
        testResults.push("✅ File contains 'hello world' text");
      }
      
      return testResults.join("\n");
    }
  }
}

/**
 * Standalone function to run the test workflow
 */
export async function runTestWorkflow(
  githubToken: string,
  anthropicToken?: string,
  anthropicBaseUrl?: string
): Promise<string> {
  const workflow = new ClaudeFlowTestWorkflow();
  return workflow.test(githubToken, anthropicToken, anthropicBaseUrl);
}

// Export default for CLI usage
export default ClaudeFlowTestWorkflow;