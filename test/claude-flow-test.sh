#!/bin/bash -x

echo "running $0 $@"
env

which claude-flow
which claude-code
which ccr
which ccr || exit 1
ccr start &

claude-flow hive-mind init --force --neural-enhanced

exec claude-flow "$@"
