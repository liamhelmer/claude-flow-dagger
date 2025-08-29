# Claude Flow Dagger Module

[![Version](https://img.shields.io/badge/version-2.2.0-blue.svg)](https://github.com/liamhelmer/claude-flow-dagger)
[![Docker](https://img.shields.io/badge/docker-ghcr.io-green.svg)](https://ghcr.io/liamhelmer/claude-flow-dagger)
[![Claude Flow](https://img.shields.io/badge/claude--flow-2.0.0--alpha.101-purple.svg)](https://github.com/ruvnet/claude-flow)
[![Dagger](https://img.shields.io/badge/dagger-0.18.16-orange.svg)](https://dagger.io)

A comprehensive Dagger module for Claude Flow CLI that runs entirely in Docker containers with full CLI capabilities, automatic LLM configuration passthrough, and all the latest dependencies.

## 🚀 Features

- **Full Docker Integration**: Runs claude-flow in optimized Docker containers
- **Complete CLI Support**: All claude-flow commands and options available
- **Automatic LLM Configuration**: Seamlessly passes Dagger LLM settings to claude-flow
- **SPARC Methodology**: Full support for Specification, Pseudocode, Architecture, Refinement, Completion
- **AI Swarm Orchestration**: 54+ specialized agent types with distributed coordination
- **Memory Management**: Persistent and distributed memory systems
- **Neural Operations**: 27+ neural models for pattern learning
- **GitHub Integration**: Repository analysis, PR management, issue tracking
- **Non-Interactive Mode**: Perfect for CI/CD pipelines
- **Latest Dependencies**: All packages updated to latest stable versions (December 2024)

## 📦 Installation

### Using npm
```bash
npm install claude-flow-dagger
```

### Using Docker
```bash
# Automatically pulls the correct architecture (amd64 or arm64)
docker pull ghcr.io/liamhelmer/claude-flow-dagger:latest

# Or specify platform explicitly
docker pull --platform linux/amd64 ghcr.io/liamhelmer/claude-flow-dagger:latest
docker pull --platform linux/arm64 ghcr.io/liamhelmer/claude-flow-dagger:latest
```

### Using Dagger CLI
```bash
dagger install github.com/liamhelmer/claude-flow-dagger
```

## 🔧 Configuration

The module automatically detects and uses LLM configuration from the Dagger environment:

### Environment Variables (Auto-detected)
```bash
# Primary Anthropic configuration (used by Dagger LLM)
ANTHROPIC_BASE_URL=https://api.anthropic.com
ANTHROPIC_AUTH_TOKEN=your-auth-token

# Alternative Dagger-specific variables
DAGGER_ANTHROPIC_BASE_URL=https://api.anthropic.com
DAGGER_ANTHROPIC_AUTH_TOKEN=your-auth-token

# Claude-specific variables (fallback)
CLAUDE_API_KEY=your-api-key
CLAUDE_BASE_URL=https://api.anthropic.com

# OpenAI compatibility
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=https://api.openai.com
```

## 💻 Usage

### Basic Example

```typescript
import { ClaudeFlowDagger } from "claude-flow-dagger";
import { dag } from "@dagger.io/dagger";

const claudeFlow = new ClaudeFlowDagger();
const workspace = dag.host().directory(".");

// Run SPARC TDD workflow
const result = await claudeFlow.tdd("user authentication", workspace);
console.log(result);

// Initialize a swarm
await claudeFlow.swarmInit("mesh", "development", workspace);

// Spawn an agent
await claudeFlow.agentSpawn("coder", "Build REST API", workspace);

// Store and retrieve memory
await claudeFlow.memoryStore("config", JSON.stringify({version: "1.0"}), workspace);
const data = await claudeFlow.memoryRetrieve("config", workspace);
```

### Advanced Configuration

```typescript
const config = {
  env: {
    DEBUG: "true",
    LOG_LEVEL: "verbose"
  },
  secrets: {
    GITHUB_TOKEN: process.env.GITHUB_TOKEN
  },
  nonInteractive: true,
  apiKey: process.env.CLAUDE_API_KEY,
  baseUrl: "https://custom-llm-endpoint.com"
};

// Run with custom configuration
const result = await claudeFlow.sparc(
  "specification",
  "Design microservices",
  workspace,
  config
);

// Execute custom commands
const customResult = await claudeFlow.custom(
  ["swarm", "status", "--format", "json"],
  workspace,
  config
);
```

## 📚 API Reference

### Core Methods

| Method | Description |
|--------|-------------|
| `container(workspace?, config?)` | Creates a configured Claude Flow container |
| `run(command, args[], workspace?, config?)` | Executes any claude-flow command |
| `sparc(mode, task, workspace?, config?)` | Executes SPARC methodology commands |
| `swarm(action, args[], workspace?, config?)` | Manages AI swarm operations |
| `agent(action, args[], workspace?, config?)` | Controls individual AI agents |
| `memory(action, args[], workspace?, config?)` | Manages distributed memory |
| `neural(action, args[], workspace?, config?)` | Executes neural operations |
| `github(action, args[], workspace?, config?)` | GitHub integration commands |

### Specialized Methods

| Method | Description |
|--------|-------------|
| `tdd(feature, workspace?, config?)` | Runs Test-Driven Development workflow |
| `pipeline(task, workspace?, config?)` | Executes complete SPARC pipeline |
| `batch(modes[], task, workspace?, config?)` | Parallel execution of multiple modes |
| `swarmInit(topology, objective, workspace?, config?)` | Initializes swarm with topology |
| `agentSpawn(type, task, workspace?, config?)` | Spawns specialized agent |
| `memoryStore(key, value, workspace?, config?)` | Stores data in memory |
| `memoryRetrieve(key, workspace?, config?)` | Retrieves data from memory |
| `neuralTrain(model, data, workspace?, config?)` | Trains neural models |
| `githubAnalyze(repo, workspace?, config?)` | Analyzes GitHub repository |
| `healthcheck(workspace?, config?)` | Comprehensive health check |
| `benchmark(type, workspace?, config?)` | Runs performance benchmarks |
| `custom(command[], workspace?, config?)` | Execute custom commands |

## 🐳 Docker Image Contents

The Docker image (`ghcr.io/liamhelmer/claude-flow-dagger:latest`) supports both **linux/amd64** and **linux/arm64** architectures with native builds for optimal performance. The image includes:

### Core Tools
- **Claude Flow**: v2.0.0-alpha.101
- **Node.js**: 22.x LTS
- **Python**: 3.x with pip and pipx
- **Go**: 1.23.1
- **Rust**: stable

### Cloud SDKs
- **Google Cloud SDK**: Core components with kubectl
- **AWS CLI**: v2 latest
- **Azure CLI**: Latest version

### Database Clients
- **PostgreSQL**: 16 client
- **MySQL**: 8.0 client
- **Redis**: Tools
- **MongoDB**: Tools with mongosh

### DevOps Tools
- **Docker CLI**: With buildx and compose plugins
- **Kubernetes**: kubectl and Helm
- **HashiCorp**: Vault and Terraform
- **Dagger CLI**: Latest version
- **GitHub CLI**: Latest version

### Development Tools
- **ripgrep**: Fast grep
- **fd-find**: Fast find
- **fzf**: Fuzzy finder
- **tmux**: Terminal multiplexer
- **tree**: Directory viewer

## 🏗️ Building Custom Images

```typescript
const claudeFlow = new ClaudeFlowDagger();
const workspace = dag.host().directory(".");

// Build and push custom image
await claudeFlow.buildImage(
  "ghcr.io/myorg/custom-claude-flow",
  "v1.0.0",
  workspace
);
```

## 🧪 Testing

Run tests within the container:

```typescript
// Run all tests
await claudeFlow.test("all", workspace);

// Run specific test suite
await claudeFlow.test("unit", workspace);
await claudeFlow.test("integration", workspace);
await claudeFlow.test("e2e", workspace);
```

Local testing:
```bash
npm test              # All tests
npm run test:unit     # Unit tests
npm run test:integration  # Integration tests
npm run test:docker   # Docker tests
```

## 🚀 CI/CD Integration

### GitHub Actions

```yaml
name: Claude Flow Pipeline

on: [push]

jobs:
  claude-flow:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Claude Flow with Dagger
        uses: docker://ghcr.io/liamhelmer/claude-flow-dagger:latest
        env:
          ANTHROPIC_AUTH_TOKEN: ${{ secrets.ANTHROPIC_TOKEN }}
          ANTHROPIC_BASE_URL: ${{ vars.ANTHROPIC_BASE_URL }}
        with:
          args: |
            claude-flow sparc tdd "implement feature"
```

### Dagger Pipeline

```typescript
import { dag } from "@dagger.io/dagger";
import { ClaudeFlowDagger } from "claude-flow-dagger";

export async function pipeline() {
  const claudeFlow = new ClaudeFlowDagger();
  const workspace = dag.host().directory(".");
  
  // Run complete pipeline
  await claudeFlow.pipeline("Build and test application", workspace);
  
  // Run tests
  await claudeFlow.test("all", workspace);
  
  // Deploy
  await claudeFlow.custom(["deploy", "--production"], workspace);
}
```

## 📋 Available Agent Types

The module supports 54+ specialized AI agents:

### Core Development
`coder`, `reviewer`, `tester`, `planner`, `researcher`

### Swarm Coordination
`hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`, `collective-intelligence-coordinator`, `swarm-memory-manager`

### Consensus & Distributed
`byzantine-coordinator`, `raft-manager`, `gossip-coordinator`, `consensus-builder`, `crdt-synchronizer`, `quorum-manager`, `security-manager`

### Performance & Optimization
`perf-analyzer`, `performance-benchmarker`, `task-orchestrator`, `memory-coordinator`, `smart-agent`

### GitHub & Repository
`github-modes`, `pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`, `workflow-automation`, `project-board-sync`, `repo-architect`, `multi-repo-swarm`

### SPARC Methodology
`sparc-coord`, `sparc-coder`, `specification`, `pseudocode`, `architecture`, `refinement`

### Specialized Development
`backend-dev`, `mobile-dev`, `ml-developer`, `cicd-engineer`, `api-docs`, `system-architect`, `code-analyzer`, `base-template-generator`

### Testing & Validation
`tdd-london-swarm`, `production-validator`

### Migration & Planning
`migration-planner`, `swarm-init`

## 🔐 Security

- **Non-root execution**: Container runs as non-root user
- **Secret management**: Secure handling of API keys and tokens
- **Minimal attack surface**: Only essential tools included
- **Regular updates**: Automated dependency updates via GitHub Actions
- **Provenance attestations**: Build provenance included for supply chain security
- **Architecture-specific builds**: Native builds for each platform

## 📊 Performance

- **84.8% SWE-Bench solve rate**: Industry-leading AI performance
- **32.3% token reduction**: Efficient LLM usage
- **2.8-4.4x speed improvement**: Through parallel agent execution
- **Fast startup**: Optimized container initialization
- **Low memory footprint**: Efficient resource usage

## 🔄 Version History

- **2.2.0** - Native architecture builds with separate runners for optimal performance
- **2.1.0** - Multi-platform Docker support (linux/amd64 and linux/arm64)
- **2.0.0** - Complete refactor with Docker-based execution and test workflows
- **1.11.0** - Complete Docker integration with all CLI capabilities
- **1.10.0** - Optimized Docker build for faster CI/CD
- **1.9.0** - Removed unavailable Google Cloud SDK components
- **1.0.0** - Initial release with basic Dagger support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🐛 Issues

Report issues at: [GitHub Issues](https://github.com/liamhelmer/claude-flow-dagger/issues)

## 📚 Documentation

- [Claude Flow Documentation](https://github.com/ruvnet/claude-flow)
- [Dagger Documentation](https://docs.dagger.io)
- [Usage Examples](./examples/usage.ts)
- [API Reference](./docs/api.md)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Claude Flow](https://github.com/ruvnet/claude-flow) by ruvnet for the amazing CLI tool
- [Dagger](https://dagger.io) for containerized CI/CD platform
- [Anthropic](https://anthropic.com) for Claude AI
- All contributors and the open source community

---

Built with ❤️ using Claude Flow, Dagger, and Claude AI

**Version**: 2.2.0 | **Docker**: ghcr.io/liamhelmer/claude-flow-dagger:latest | **NPM**: claude-flow-dagger