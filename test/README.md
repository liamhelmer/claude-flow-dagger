# Claude Flow Dagger Module - Test Suite

This directory contains comprehensive test workflows for the Claude Flow Dagger module.

## 🧪 Test Workflow Overview

The test workflow performs the following steps:

1. **Repository Clone**: Clones the test repository (badal-io/claude-test-repo)
2. **Branch Creation**: Creates a new feature branch if on the default branch
3. **Claude Flow Execution**: 
   - Initializes hive-mind collective intelligence
   - Spawns task to build a Node.js hello world application
4. **Git Operations**: Commits and pushes changes to the new branch
5. **Pull Request**: Creates a PR with detailed description of changes
6. **Verification**: Tests that the generated app works and outputs "hello world"

## 🚀 Running Tests

### Prerequisites

Set the required environment variables:
```bash
export GITHUB_TOKEN=your_github_token
export ANTHROPIC_AUTH_TOKEN=your_anthropic_token
export ANTHROPIC_BASE_URL=https://api.anthropic.com  # Optional
```

### Method 1: Using Dagger (Recommended)

```bash
# Build the module first
npm run build

# Run the full test workflow with Dagger
npm run test:workflow
```

### Method 2: Using Docker Directly

```bash
# Run the test using Docker without Dagger
npm run test:docker-direct

# Or directly:
./test/docker-test.sh
```

### Method 3: GitHub Actions

The test workflow runs automatically on:
- Push to main branch
- Pull requests
- Manual workflow dispatch

To run manually:
1. Go to Actions tab in GitHub
2. Select "Test Claude Flow Module"
3. Click "Run workflow"

## 📁 Test Files

- `workflow.ts` - Main Dagger test workflow implementation
- `run-test.ts` - Standalone test runner script
- `docker-test.sh` - Shell script for Docker-based testing
- `README.md` - This documentation

## 🔧 Test Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes | GitHub personal access token with repo permissions |
| `ANTHROPIC_AUTH_TOKEN` | Yes | Anthropic API token for Claude |
| `ANTHROPIC_BASE_URL` | No | Custom Anthropic endpoint (default: https://api.anthropic.com) |
| `TEST_REPO_URL` | No | Custom test repository (default: badal-io/claude-test-repo) |

### Test Repository Requirements

The test repository should:
- Be accessible with the provided GitHub token
- Allow branch creation and pull requests
- Have main or master as the default branch

## 🎯 Test Scenarios

### 1. Basic Hello World Generation
Tests that claude-flow can:
- Initialize hive-mind
- Spawn a task to build a hello world app
- Generate valid Node.js code
- Create necessary files (index.js, package.json, etc.)

### 2. Git Integration
Verifies:
- Branch creation works correctly
- Changes are committed with proper messages
- Push to remote succeeds
- PR is created with detailed description

### 3. Application Verification
Ensures the generated app:
- Contains valid JavaScript code
- Outputs "hello world" when run
- Has proper package.json if dependencies are needed
- Can be executed with Node.js

## 🔍 Debugging

### Common Issues

1. **Authentication Errors**
   - Ensure GITHUB_TOKEN has repo scope
   - Verify ANTHROPIC_AUTH_TOKEN is valid
   - Check token permissions for the test repository

2. **Docker Issues**
   - Pull the latest image: `docker pull ghcr.io/liamhelmer/claude-flow-dagger:latest`
   - Ensure Docker daemon is running
   - Check Docker has sufficient resources

3. **Dagger Issues**
   - Install Dagger CLI: `curl -fsSL https://dl.dagger.io/dagger/install.sh | sh`
   - Ensure Dagger version is compatible (0.18+)
   - Check Dagger engine is running

### Verbose Output

Enable debug mode for more detailed output:
```bash
export DEBUG=true
npm run test:workflow
```

## 📊 Expected Output

A successful test run should output:
```
📦 Step 1: Cloning repository...
🌿 Step 2: Creating branch claude-flow-test-[timestamp]...
🤖 Step 3: Running claude-flow hive-mind...
💾 Step 4: Committing and pushing changes...
🔄 Step 5: Creating pull request...
🧪 Step 6: Testing hello world app...
✅ All tests passed successfully!
```

## 🤝 Contributing

To add new tests:

1. Add test logic to `workflow.ts`
2. Update the test steps documentation
3. Add any new environment variables to the configuration
4. Update GitHub Actions workflow if needed
5. Test locally before submitting PR

## 📝 License

MIT - See LICENSE file in repository root