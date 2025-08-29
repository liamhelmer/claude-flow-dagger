#!/usr/bin/env node

/**
 * Standalone test runner for Claude Flow Dagger Module
 * 
 * Usage:
 *   npm run test:workflow
 *   
 * Environment variables:
 *   GITHUB_TOKEN - Required for GitHub operations
 *   ANTHROPIC_AUTH_TOKEN - Required for Claude AI
 *   ANTHROPIC_BASE_URL - Optional custom endpoint
 *   TEST_REPO_URL - Optional custom test repo (default: badal-io/claude-test-repo)
 */

import { runTestWorkflow } from "./workflow";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function main() {
  console.log("🚀 Claude Flow Dagger Module Test Runner\n");

  // Check required environment variables
  const githubToken = process.env.GITHUB_TOKEN;
  const anthropicToken = process.env.ANTHROPIC_AUTH_TOKEN || process.env.CLAUDE_API_KEY;
  const anthropicBaseUrl = process.env.ANTHROPIC_BASE_URL;

  if (!githubToken) {
    console.error("❌ Error: GITHUB_TOKEN environment variable is required");
    console.error("Please set: export GITHUB_TOKEN=your_github_token");
    process.exit(1);
  }

  if (!anthropicToken) {
    console.error("❌ Error: ANTHROPIC_AUTH_TOKEN or CLAUDE_API_KEY environment variable is required");
    console.error("Please set: export ANTHROPIC_AUTH_TOKEN=your_anthropic_token");
    process.exit(1);
  }

  console.log("📋 Configuration:");
  console.log(`  GitHub Token: ${githubToken.substring(0, 8)}...`);
  console.log(`  Anthropic Token: ${anthropicToken.substring(0, 8)}...`);
  console.log(`  Anthropic Base URL: ${anthropicBaseUrl || "default"}`);
  console.log(`  Test Repository: badal-io/claude-test-repo\n`);

  console.log("🔄 Starting test workflow...\n");

  try {
    const result = await runTestWorkflow(
      githubToken,
      anthropicToken,
      anthropicBaseUrl
    );

    console.log("\n📊 Test Results:");
    console.log("=====================================");
    console.log(result);
    console.log("=====================================\n");

    if (result.includes("✅ All tests passed")) {
      console.log("🎉 SUCCESS: All tests passed!");
      process.exit(0);
    } else {
      console.log("⚠️ WARNING: Some tests may have failed. Check the output above.");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ ERROR: Test workflow failed");
    console.error(error);
    process.exit(1);
  }
}

// Run the test
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});