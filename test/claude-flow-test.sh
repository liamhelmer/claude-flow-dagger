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

echo "Executing Claude-Flow"
claude-flow "$@"
