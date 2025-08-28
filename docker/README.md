# Claude Flow Docker Environment

A comprehensive Docker environment for claude-flow development with all necessary tools and dependencies.

## Quick Start

### 1. Build the Image

```bash
# Basic build
./docker/scripts/build.sh

# Build with specific version
./docker/scripts/build.sh --claude-flow-version 2.0.0-alpha.101 --tag latest

# Build and push to registry
./docker/scripts/build.sh --registry your-registry.com --push
```

### 2. Run the Container

```bash
# Interactive development environment
./docker/scripts/run.sh

# Run in background
./docker/scripts/run.sh --detach

# With custom workspace
./docker/scripts/run.sh --workspace /path/to/your/project
```

### 3. Using Docker Compose

```bash
# Copy environment file
cp docker/.env.example docker/.env
# Edit docker/.env with your configuration

# Start all services
cd docker && docker-compose up -d

# Start only claude-flow
cd docker && docker-compose up claude-flow

# View logs
cd docker && docker-compose logs -f claude-flow
```

## What's Included

### Programming Languages & Runtimes
- **Node.js 22.x** - Latest LTS with npm, yarn, pnpm
- **Python 3.13** - Latest with pip and development tools
- **Go 1.23.1** - Latest stable release
- **Rust** - Latest stable toolchain with Cargo

### Claude & AI Tools
- **Claude CLI** - Official Anthropic Claude command-line interface
- **claude-flow v2.0.0-alpha.101** - Advanced AI workflow orchestration
- **MCP Servers** - Model Context Protocol servers for enhanced capabilities

### Cloud Provider CLIs
- **Google Cloud SDK** - Complete SDK with ALL alpha components
- **AWS CLI v2** - Latest AWS command-line interface
- **Azure CLI** - Microsoft Azure command-line interface

### HashiCorp Tools
- **Vault CLI** - Secrets management
- **Terraform CLI** - Infrastructure as code
- **Dagger CLI** - CI/CD pipelines as code

### Development Tools
- **Git** - Version control with Git LFS
- **GitHub CLI (gh)** - GitHub command-line interface
- **Docker** - Container runtime (Docker-in-Docker)
- **kubectl** - Kubernetes command-line tool
- **Helm** - Kubernetes package manager

### Database Clients
- **PostgreSQL Client** - psql and related tools
- **MySQL Client** - mysql command-line client
- **Redis Tools** - redis-cli and utilities
- **MongoDB Shell** - mongosh for MongoDB

### Utilities
- **jq** - JSON processor
- **yq** - YAML processor
- **ripgrep** - Fast text search
- **fd-find** - Fast file finder
- **htop** - Interactive process viewer

## Architecture

The Dockerfile uses a multi-stage build approach for optimal performance:

1. **Base Stage** - Core system dependencies
2. **Runtimes Stage** - Programming language installations
3. **Cloud Tools Stage** - Cloud provider CLIs and tools
4. **Database Tools Stage** - Database clients and utilities
5. **Claude Tools Stage** - Claude CLI and claude-flow installation
6. **Dev Tools Stage** - Development utilities and tools
7. **Final Stage** - Optimized final image with cleanup

## Configuration

### Environment Variables

Key environment variables (see `.env.example` for complete list):

```bash
# Required
CLAUDE_API_KEY=your_claude_api_key

# Optional but recommended
GITHUB_TOKEN=your_github_token
GOOGLE_APPLICATION_CREDENTIALS=/workspace/.config/gcp/credentials.json
AWS_PROFILE=default
VAULT_ADDR=http://vault:8200
```

### Claude Flow Configuration

The container includes a pre-configured claude-flow setup at:
- Config: `/root/.config/claude-flow/claude-flow-config.json`
- Cache: `/root/.cache/claude-flow/`

### MCP Servers

Pre-configured MCP servers include:
- **Filesystem** - File system operations
- **Git** - Git repository management
- **GitHub** - GitHub API integration
- **PostgreSQL** - Database operations
- **Memory** - Persistent memory storage
- **Brave Search** - Web search capabilities

## Usage Examples

### Basic Development

```bash
# Start interactive container
./docker/scripts/run.sh

# Inside container
claude-flow --version
claude-flow sparc modes
claude-flow sparc run spec-pseudocode "Build a REST API"
```

### With Docker Compose

```bash
# Start development environment
cd docker
docker-compose up -d

# Execute commands in running container
docker-compose exec claude-flow bash
docker-compose exec claude-flow claude-flow sparc tdd "Authentication system"

# View logs
docker-compose logs -f claude-flow
```

### CI/CD Integration

```bash
# Build for multiple platforms
./docker/scripts/build.sh --platform linux/amd64,linux/arm64

# Security scan
docker scout cves claude-flow:latest

# Push to registry
./docker/scripts/build.sh --registry your-registry.com --push
```

## Optimization Features

### Multi-Platform Support
- Built for both AMD64 and ARM64 architectures
- Optimized for Apple Silicon and Intel machines

### Layer Caching
- Strategic layer ordering for optimal caching
- Separate dependency installation from code changes

### Security
- Non-root user execution where possible
- Minimal attack surface
- Security scanning integration
- Secrets management via environment variables

### Performance
- Multi-stage builds for smaller final images
- Parallel dependency installation
- Optimized package installations
- Cache cleanup and optimization

## Volumes

### Persistent Volumes
- `claude-flow-cache` - Application cache
- `claude-flow-config` - Configuration files
- `postgres-data` - PostgreSQL data (if using compose)
- `redis-data` - Redis data (if using compose)

### Mounted Volumes
- `/workspace` - Your project workspace
- `/var/run/docker.sock` - Docker socket for Docker-in-Docker
- Cloud CLI configurations (read-only mounts)

## Networking

### Exposed Ports
- `3000` - Development server
- `8000` - Python/Django applications
- `8080` - Alternative HTTP services
- `9000` - Additional services
- `5432` - PostgreSQL (when using compose)
- `6379` - Redis (when using compose)
- `8200` - Vault (when using compose)

## Health Checks

The container includes comprehensive health checks:
- Claude CLI availability
- claude-flow functionality
- Core tool versions
- Service connectivity

## Troubleshooting

### Common Issues

1. **Permission Issues**
   ```bash
   # Fix Docker socket permissions
   sudo chmod 666 /var/run/docker.sock
   ```

2. **Memory Issues**
   ```bash
   # Increase Docker memory limit
   # Docker Desktop: Settings > Resources > Memory
   ```

3. **API Key Issues**
   ```bash
   # Verify environment variables
   docker exec claude-flow-dev env | grep CLAUDE_API_KEY
   ```

### Debug Mode

```bash
# Run with debug output
./docker/scripts/run.sh -- bash -c "claude-flow --debug --version"

# Check logs
docker logs claude-flow-dev

# Interactive debugging
docker exec -it claude-flow-dev bash
```

## Contributing

When modifying the Docker configuration:

1. Test build locally
2. Verify all tools work correctly
3. Update version numbers appropriately
4. Test multi-platform builds
5. Update documentation

## Security Considerations

- Never commit API keys or secrets
- Use `.env` files for sensitive configuration
- Regularly update base images and dependencies
- Scan images for vulnerabilities
- Use read-only mounts for sensitive directories

## Performance Tips

- Use `.dockerignore` to exclude unnecessary files
- Leverage Docker BuildKit for faster builds
- Use multi-stage builds to reduce final image size
- Cache dependencies separately from application code
- Use specific version tags for reproducible builds