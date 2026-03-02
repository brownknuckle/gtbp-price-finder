#!/bin/bash
set -euo pipefail

# Only run in remote (web) Claude Code sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

npm install
