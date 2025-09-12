#!/bin/bash -x

echo "running $0 $@"
export ANTHROPIC_AUTH_TOKEN="any-key-will-do"
export ANTHROPIC_BASE_URL="http://127.0.0.1:3456"

env

which claude-flow
which claude-code
which ccr
which ccr || exit 1

echo "starting Claude-code-router"
ccr start &

tmux -T 256 
prompt="$(cat /workspace/prompt)"
#claude-flow hive-mind spawn "$prompt" --output-format stream-json --no-interactive --headless --verbose --claude
claude-flow init --force
claude-flow hive-mind init --force
claude-flow-ui -- --port 11235 --terminal-size 120x40 swarm "$prompt" --output-format stream-json

#claude-flow automation auto-agent --task-complexity enterprise --no-interactive
#claude-flow automation smart-spawn --requirement "web-development" --max-agents 8 --no-interactive --claude --output-format json > /workspace/results.json

#echo "Starting Orchestrator and MCP"
#sleep 5s
#claude-flow start --headless &
#
#echo "Executing Claude-Flow"
#sleep 5s
#
#claude-flow sparc "$(cat /workspace/prompt)"
