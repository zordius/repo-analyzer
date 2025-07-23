#!/bin/bash

# Get the directory of the current script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Get the absolute path to the prompt file
PROMPT_PATH="$PROJECT_ROOT/prompt/practice_analyzer.md"

# Get the path to cli.js
CLI_PATH="$SCRIPT_DIR/../src/cli.js"

# Build the shell command with practice prompt
COMMAND="node $CLI_PATH --prompt-file $PROMPT_PATH $*"

# Only log the command, don't execute it
echo "$COMMAND" 