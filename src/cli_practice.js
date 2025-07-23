#!/usr/bin/env node

import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the absolute path to the prompt file relative to this script
const getPromptPath = () => {
  // Go up one level from src/ to the project root, then into prompt/
  const promptPath = path.join(__dirname, '..', 'prompt', 'practice_analyzer.md');
  return promptPath;
};

async function runPracticeAnalysis() {
  // Get the absolute path to the practice analyzer prompt
  const promptPath = getPromptPath();

  // Get the path to cli.js
  const cliPath = path.join(__dirname, 'cli.js');

  // Get all arguments passed to practice.js
  const selfArgs = process.argv.slice(2);

  const args = [...selfArgs];
  const promptFileIndex = args.indexOf('--prompt-file');

  if (promptFileIndex !== -1) {
    args.splice(promptFileIndex + 1, 1, promptPath);
  } else {
    args.unshift('--prompt-file', promptPath);
  }

  // Set the arguments for cli.js
  process.argv = [process.argv[0], cliPath, ...args];

  // Import and run cli.js directly
  await import(cliPath);
}

// Run the practice analysis
runPracticeAnalysis();
