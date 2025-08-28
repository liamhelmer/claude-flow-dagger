#!/bin/bash
# Run script for claude-flow Docker container
set -euo pipefail

# Default configuration
IMAGE_NAME="${IMAGE_NAME:-claude-flow:latest}"
CONTAINER_NAME="${CONTAINER_NAME:-claude-flow-dev}"
WORKSPACE_DIR="${WORKSPACE_DIR:-$(pwd)}"
DOCKER_SOCKET="${DOCKER_SOCKET:-/var/run/docker.sock}"
INTERACTIVE="${INTERACTIVE:-true}"
DETACH="${DETACH:-false}"
REMOVE_CONTAINER="${REMOVE_CONTAINER:-true}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running or accessible"
        exit 1
    fi
}

# Setup environment variables
setup_env() {
    # Create temporary environment file
    local env_file="/tmp/claude-flow-env"
    cat > "$env_file" << EOF
CLAUDE_API_KEY=${CLAUDE_API_KEY:-}
GOOGLE_APPLICATION_CREDENTIALS=/workspace/.config/gcp/credentials.json
AWS_CONFIG_FILE=/workspace/.config/aws/config
AWS_SHARED_CREDENTIALS_FILE=/workspace/.config/aws/credentials
AZURE_CONFIG_DIR=/workspace/.config/azure
VAULT_ADDR=${VAULT_ADDR:-}
VAULT_TOKEN=${VAULT_TOKEN:-}
GITHUB_TOKEN=${GITHUB_TOKEN:-}
CLAUDE_FLOW_CONFIG_DIR=/root/.config/claude-flow
MCP_SERVER_CONFIG_DIR=/root/.config/mcp
EOF
    echo "$env_file"
}

# Run the container
run_container() {
    local env_file
    env_file=$(setup_env)
    
    log_info "Starting claude-flow container: $CONTAINER_NAME"
    log_info "Image: $IMAGE_NAME"
    log_info "Workspace: $WORKSPACE_DIR"
    
    local docker_args=(
        --name "$CONTAINER_NAME"
        --env-file "$env_file"
        --volume "$WORKSPACE_DIR:/workspace:rw"
        --volume "$DOCKER_SOCKET:/var/run/docker.sock:rw"
        --volume "claude-flow-cache:/root/.cache:rw"
        --volume "claude-flow-config:/root/.config:rw"
        --workdir "/workspace"
        --network host
    )
    
    # Add interactive flags if enabled
    if [ "$INTERACTIVE" = "true" ] && [ "$DETACH" = "false" ]; then
        docker_args+=(--interactive --tty)
    fi
    
    # Add remove flag if enabled
    if [ "$REMOVE_CONTAINER" = "true" ]; then
        docker_args+=(--rm)
    fi
    
    # Add detach flag if enabled
    if [ "$DETACH" = "true" ]; then
        docker_args+=(--detach)
    fi
    
    # Mount additional volumes for cloud CLI configs
    local home_config="$HOME/.config"
    local home_aws="$HOME/.aws"
    local home_gcloud="$HOME/.config/gcloud"
    
    if [ -d "$home_aws" ]; then
        docker_args+=(--volume "$home_aws:/workspace/.config/aws:ro")
    fi
    
    if [ -d "$home_gcloud" ]; then
        docker_args+=(--volume "$home_gcloud:/workspace/.config/gcp:ro")
    fi
    
    # Add port exposures for common development services
    docker_args+=(
        --publish "3000:3000"
        --publish "8000:8000"
        --publish "8080:8080"
        --publish "9000:9000"
    )
    
    # Stop existing container if it exists
    if docker ps -a --format '{{.Names}}' | grep -q "^$CONTAINER_NAME$"; then
        log_info "Stopping existing container: $CONTAINER_NAME"
        docker stop "$CONTAINER_NAME" &> /dev/null || true
        docker rm "$CONTAINER_NAME" &> /dev/null || true
    fi
    
    # Run the container
    if docker run "${docker_args[@]}" "$IMAGE_NAME" "$@"; then
        log_success "Container started successfully"
    else
        log_error "Failed to start container"
        return 1
    fi
    
    # Clean up environment file
    rm -f "$env_file"
}

# Show container logs
show_logs() {
    log_info "Showing logs for container: $CONTAINER_NAME"
    docker logs -f "$CONTAINER_NAME"
}

# Execute command in running container
exec_command() {
    log_info "Executing command in container: $CONTAINER_NAME"
    docker exec -it "$CONTAINER_NAME" "$@"
}

# Stop container
stop_container() {
    log_info "Stopping container: $CONTAINER_NAME"
    docker stop "$CONTAINER_NAME"
}

# Show help
show_help() {
    echo "Usage: $0 [COMMAND] [OPTIONS] [-- CONTAINER_ARGS]"
    echo ""
    echo "Commands:"
    echo "  run         Start a new container (default)"
    echo "  exec        Execute command in running container"
    echo "  logs        Show container logs"
    echo "  stop        Stop running container"
    echo "  help        Show this help message"
    echo ""
    echo "Options:"
    echo "  --image IMAGE            Docker image to use (default: claude-flow:latest)"
    echo "  --name NAME              Container name (default: claude-flow-dev)"
    echo "  --workspace DIR          Workspace directory to mount (default: current directory)"
    echo "  --detach                 Run container in background"
    echo "  --no-interactive         Disable interactive mode"
    echo "  --keep                   Keep container after exit"
    echo ""
    echo "Environment Variables:"
    echo "  CLAUDE_API_KEY           Your Claude API key"
    echo "  GOOGLE_APPLICATION_CREDENTIALS  Path to GCP service account key"
    echo "  AWS_PROFILE              AWS profile to use"
    echo "  VAULT_ADDR               Vault server address"
    echo "  VAULT_TOKEN              Vault authentication token"
    echo "  GITHUB_TOKEN             GitHub personal access token"
    echo ""
    echo "Examples:"
    echo "  $0                       Start interactive container"
    echo "  $0 --detach              Start container in background"
    echo "  $0 exec bash             Open shell in running container"
    echo "  $0 -- claude-flow --help Run claude-flow help in container"
}

# Parse command line arguments
COMMAND="run"
ARGS=()

while [[ $# -gt 0 ]]; do
    case $1 in
        run|exec|logs|stop|help)
            COMMAND="$1"
            shift
            ;;
        --image)
            IMAGE_NAME="$2"
            shift 2
            ;;
        --name)
            CONTAINER_NAME="$2"
            shift 2
            ;;
        --workspace)
            WORKSPACE_DIR="$2"
            shift 2
            ;;
        --detach)
            DETACH="true"
            INTERACTIVE="false"
            shift
            ;;
        --no-interactive)
            INTERACTIVE="false"
            shift
            ;;
        --keep)
            REMOVE_CONTAINER="false"
            shift
            ;;
        --)
            shift
            ARGS=("$@")
            break
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            ARGS+=("$1")
            shift
            ;;
    esac
done

# Execute the command
case $COMMAND in
    run)
        check_docker
        run_container "${ARGS[@]}"
        ;;
    exec)
        exec_command "${ARGS[@]}"
        ;;
    logs)
        show_logs
        ;;
    stop)
        stop_container
        ;;
    help)
        show_help
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        show_help
        exit 1
        ;;
esac