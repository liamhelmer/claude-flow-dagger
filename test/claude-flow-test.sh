#!/bin/bash -x

echo "running $0 $@"
export ANTHROPIC_AUTH_TOKEN="any-key-will-do"
export ANTHROPIC_BASE_URL="http://127.0.0.1:3456"

env

export NPM_CONFIG_PREFIX=/home/claude/.npm-global
export PATH=$PATH:/home/claude/.npm-global/bin

which claude-flow
which claude-code
which ccr
which ccr || exit 1

cp -f /workspace/default-workspace/.claude.json /home/claude/
cp -f /workspace/default-workspace/.claude-code-router/config*json /home/claude/.claude-code-router/

echo "starting Claude-code-router"
ccr start &

tmux -T 256 
prompt="$(cat /workspace/prompt)"
#claude-flow hive-mind spawn "$prompt" --output-format stream-json --no-interactive --headless --verbose --claude
#claude-flow init --force
#claude-flow hive-mind init --force

npm install -g @liamhelmer/claude-flow-ui

npx @liamhelmer/claude-flow-ui --port 11235 --terminal-size 120x40 hive-mind spawn "$prompt" --claude

#claude-flow automation auto-agent --task-complexity enterprise --no-interactive
#claude-flow automation smart-spawn --requirement "web-development" --max-agents 8 --no-interactive --claude --output-format json > /workspace/results.json

ccr stop
exit 0

#echo "Starting Orchestrator and MCP"
#sleep 5s
#claude-flow start --headless &
#
#echo "Executing Claude-Flow"
#sleep 5s
#
#claude-flow sparc "$(cat /workspace/prompt)"
