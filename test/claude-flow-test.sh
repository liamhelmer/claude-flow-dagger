#!/bin/bash -x

which ccr || exit 1
ccr start &

claude-flow hive-mind init --force --neural-enhanced

exec claude-flow "$@"
