#!/bin/bash

mkdir -p ${HOME}/.claude-code-router/

export ANTHROPIC_BASE_URL="http://127.0.0.1:3456"

cat << EOF > ${HOME}/.claude-code-router/config.json
{
  "PROXY_URL": "http://127.0.0.1:3456",
  "APIKEY": "any-key-will-do",
  "LOG": true,
  "Providers": [
    {
      "name": "fuelix-anthropic",
      "api_base_url": "https://api.fuelix.ai/v1/chat/completions",
      "api_key": "${ANTHROPIC_AUTH_TOKEN}",
      "models": [
        "claude-3-5-sonnet",
        "claude-3-7-sonnet",
        "claude-4-sonnet",
        "claude-sonnet-4"
      ]
    },
    {
      "name": "fuelix-google",
      "api_base_url": "https://api.fuelix.ai/v1/chat/completions",
      "api_key": "${ANTHROPIC_AUTH_TOKEN}",
      "models": [
        "gemini-2.5-flash",
        "gemini-2.5-pro"
      ],
      "transformer": {
        "use": ["gemini"]
      }
    }
  ],
  "Router": {
    "default": "fuelix-anthropic,claude-4-sonnet",
    "thinking": "fuelix-anthropic,claude-4-sonnet",
    "CodeWhisperer": "fuelix-anthropic,claude-4-sonnet",
    "longContext": "fuelix-anthropic,claude-4-sonnet",
    "background": "fuelix-anthropic,claude-4-sonnet"
  }
}
EOF
npm install @musistudio/claude-code-router

ccr start &

claude-flow hive-mind init --force --neural-enhanced

exec claude-flow "$@"
