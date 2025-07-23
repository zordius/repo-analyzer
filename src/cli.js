#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import { RepoAnalyzer } from './index.js';

const program = new Command();

program
  .name('repo-analyzer')
  .description('A command-line tool for large-scale code analysis using an external AI CLI.')
  .version('1.0.0');

program.option('--exclude <patterns...>', 'Patterns for files/directories to exclude from analysis.', [])
  .option('--include <patterns...>', 'Patterns for files/directories to explicitly include in analysis.', [])
  .option('--timeout <seconds>', 'Timeout in seconds for AI API calls.', parseInt, 60)
  .option('--debug', 'Enable verbose debug output.', false)
  .option('--cli <name>', 'The executable name of the AI command-line tool to use for analysis.', 'gemini')
  .option('--context-size <size>', 'Maximum context size (in characters/tokens) for the AI model per batch.', parseInt, 10000)
  .option('--prompt-file <file>', 'Path to a file containing the base prompt for AI analysis.')
  .option('--instances <number>', 'Maximum number of parallel AI analysis instances.', parseInt, 2)
  .option('--report-dir <dir>', 'Directory to save analysis reports.', './reports');

program.action(async (options) => {
  if (!options.promptFile) {
    console.error('Error: --prompt-file is required.');
    program.help();
    return;
  }

  if (!fs.existsSync(options.promptFile)) {
    console.error(`Error: Prompt file not found at ${options.promptFile}`);
    return;
  }

  const promptContent = fs.readFileSync(options.promptFile, 'utf-8');

  const analyzer = new RepoAnalyzer({
    exclude: options.exclude,
    include: options.include,
    timeout: options.timeout,
    debug: options.debug,
    cli: options.cli,
    contextSize: options.contextSize,
    prompt: promptContent,
    instances: options.instances,
    promptFilePath: options.promptFile,
    reportDir: options.reportDir,
  });

  try {
    await analyzer.run();
    console.log('Analysis complete.');
  } catch (error) {
    console.error('Analysis failed:', error.message);
    if (options.debug) {
      console.error(error);
    }
  }
});

program.parse(process.argv);
