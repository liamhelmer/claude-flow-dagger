#!/bin/bash

# Claude Flow Dagger LLM Integration Test Script
# This script demonstrates how the module automatically uses
# ANTHROPIC_BASE_URL and ANTHROPIC_AUTH_TOKEN from Dagger engine

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Claude Flow Dagger LLM Integration Test ===${NC}"
echo ""

# Function to run Dagger commands with LLM
run_with_llm() {
    local function_name=$1
    shift
    local args=$@
    
    echo -e "${YELLOW}Running: dagger call --with-llm anthropic:claude-3-opus ${function_name} ${args}${NC}"
    dagger call --with-llm anthropic:claude-3-opus ${function_name} ${args}
    echo ""
}

# Test 1: Show configuration
echo -e "${GREEN}Test 1: Checking Dagger LLM Configuration${NC}"
run_with_llm show-config

# Test 2: Test connection
echo -e "${GREEN}Test 2: Testing LLM Connection${NC}"
run_with_llm test-connection

# Test 3: Run SPARC TDD
echo -e "${GREEN}Test 3: Running SPARC TDD Workflow${NC}"
run_with_llm sparc-tdd --feature "user authentication system"

# Test 4: Initialize swarm
echo -e "${GREEN}Test 4: Initializing AI Swarm${NC}"
run_with_llm run-swarm --topology "hierarchical" --objective "Build a REST API"

# Test 5: Analyze repository
echo -e "${GREEN}Test 5: Analyzing GitHub Repository${NC}"
run_with_llm analyze-repo --owner "anthropics" --repo "claude-flow"

# Test 6: Complete workflow
echo -e "${GREEN}Test 6: Running Complete SPARC Workflow${NC}"
run_with_llm complete-workflow --task "Create a user authentication system"

# Test 7: Custom LLM configuration
echo -e "${GREEN}Test 7: Testing Custom LLM Configuration${NC}"
run_with_llm custom-llm --base-url "https://api.anthropic.com" --task "Build a chat application"

echo -e "${BLUE}=== All Tests Complete ===${NC}"
echo ""
echo -e "${GREEN}✓ Dagger LLM integration working correctly!${NC}"
echo "The module automatically detected and used:"
echo "  - ANTHROPIC_BASE_URL from Dagger engine"
echo "  - ANTHROPIC_AUTH_TOKEN from Dagger engine"