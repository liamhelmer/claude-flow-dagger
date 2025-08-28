#!/bin/bash

# Claude Flow Dagger - Docker Build Script
# Builds multi-platform Docker image with all tools and dependencies

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="${IMAGE_NAME:-claude-flow-dagger}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
REGISTRY="${REGISTRY:-docker.io}"
NAMESPACE="${NAMESPACE:-claudeflow}"
CLAUDE_FLOW_VERSION="${CLAUDE_FLOW_VERSION:-2.0.0-alpha.101}"
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"
PUSH="${PUSH:-false}"
NO_CACHE="${NO_CACHE:-false}"
BUILD_ONLY="${BUILD_ONLY:-false}"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --image-name)
            IMAGE_NAME="$2"
            shift 2
            ;;
        --tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        --registry)
            REGISTRY="$2"
            shift 2
            ;;
        --namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        --claude-flow-version)
            CLAUDE_FLOW_VERSION="$2"
            shift 2
            ;;
        --platforms)
            PLATFORMS="$2"
            shift 2
            ;;
        --push)
            PUSH="true"
            shift
            ;;
        --no-cache)
            NO_CACHE="true"
            shift
            ;;
        --build-only)
            BUILD_ONLY="true"
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --image-name NAME         Docker image name (default: claude-flow-dagger)"
            echo "  --tag TAG                 Docker image tag (default: latest)"
            echo "  --registry REGISTRY       Docker registry (default: docker.io)"
            echo "  --namespace NAMESPACE     Docker namespace (default: claudeflow)"
            echo "  --claude-flow-version VER claude-flow version (default: 2.0.0-alpha.101)"
            echo "  --platforms PLATFORMS     Target platforms (default: linux/amd64,linux/arm64)"
            echo "  --push                    Push to registry after build"
            echo "  --no-cache               Build without cache"
            echo "  --build-only             Build without running security scan"
            echo "  --help                   Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Full image reference
FULL_IMAGE="${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${IMAGE_TAG}"

echo -e "${GREEN}=== Claude Flow Docker Build ===${NC}"
echo "Image: ${FULL_IMAGE}"
echo "Claude Flow Version: ${CLAUDE_FLOW_VERSION}"
echo "Platforms: ${PLATFORMS}"
echo "Push to Registry: ${PUSH}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Check if buildx is available
if ! docker buildx version &> /dev/null; then
    echo -e "${YELLOW}Setting up Docker buildx...${NC}"
    docker buildx create --use --name claude-flow-builder
fi

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

# Check if Dockerfile exists
if [ ! -f "${PROJECT_ROOT}/docker/Dockerfile" ]; then
    echo -e "${RED}Error: Dockerfile not found at ${PROJECT_ROOT}/docker/Dockerfile${NC}"
    exit 1
fi

# Build arguments
BUILD_ARGS=""
BUILD_ARGS="${BUILD_ARGS} --build-arg CLAUDE_FLOW_VERSION=${CLAUDE_FLOW_VERSION}"

# Cache options
CACHE_OPTS=""
if [ "${NO_CACHE}" == "true" ]; then
    CACHE_OPTS="--no-cache"
fi

# Platform options
PLATFORM_OPTS=""
if [ -n "${PLATFORMS}" ]; then
    PLATFORM_OPTS="--platform ${PLATFORMS}"
fi

# Output options
OUTPUT_OPTS="--load"
if [ "${PUSH}" == "true" ]; then
    OUTPUT_OPTS="--push"
fi

# Build the image
echo -e "${YELLOW}Building Docker image...${NC}"
cd "${PROJECT_ROOT}"

docker buildx build \
    ${PLATFORM_OPTS} \
    ${CACHE_OPTS} \
    ${BUILD_ARGS} \
    ${OUTPUT_OPTS} \
    -t "${FULL_IMAGE}" \
    -f docker/Dockerfile \
    .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker image built successfully${NC}"
else
    echo -e "${RED}✗ Docker build failed${NC}"
    exit 1
fi

# Security scan (if not build-only)
if [ "${BUILD_ONLY}" != "true" ] && [ "${PUSH}" != "true" ]; then
    echo -e "${YELLOW}Running security scan...${NC}"
    
    # Try Docker Scout if available
    if docker scout version &> /dev/null; then
        docker scout cves "${FULL_IMAGE}" || true
    fi
    
    # Try Trivy if available
    if command -v trivy &> /dev/null; then
        trivy image "${FULL_IMAGE}" || true
    fi
fi

# Show image info
if [ "${PUSH}" != "true" ]; then
    echo -e "${YELLOW}Image information:${NC}"
    docker images "${FULL_IMAGE}"
    
    echo ""
    echo -e "${GREEN}✓ Build complete!${NC}"
    echo ""
    echo "To run the image:"
    echo "  docker run -it --rm ${FULL_IMAGE}"
    echo ""
    echo "To push to registry:"
    echo "  docker push ${FULL_IMAGE}"
else
    echo -e "${GREEN}✓ Image pushed to ${FULL_IMAGE}${NC}"
fi

# Tag additional versions
if [ "${IMAGE_TAG}" != "latest" ]; then
    # Also tag as latest
    docker tag "${FULL_IMAGE}" "${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:latest"
    if [ "${PUSH}" == "true" ]; then
        docker push "${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:latest"
    fi
fi

# Create version-specific tag
VERSION_TAG="${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${CLAUDE_FLOW_VERSION}"
docker tag "${FULL_IMAGE}" "${VERSION_TAG}"
if [ "${PUSH}" == "true" ]; then
    docker push "${VERSION_TAG}"
fi

echo -e "${GREEN}=== Build Complete ===${NC}"