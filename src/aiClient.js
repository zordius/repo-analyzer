import { spawn } from 'child_process';
import { debugLog } from './utils.js';

class AIClient {
  static ANALYSIS_MARKER = '---ANALYSIS-START---';
  static ANALYSIS_REGEX = new RegExp(`.*${AIClient.ANALYSIS_MARKER}`, 's');

  constructor(cliCommand, timeout, debugMode) {
    this.cliCommand = cliCommand;
    this.timeout = timeout * 1000; // Convert to milliseconds
    this.debugMode = debugMode;
  }

  async analyze(prompt) {
    debugLog(this.debugMode, `Executing AI command: ${this.cliCommand}`);

    // Append the required marker instruction to the prompt
    const enhancedPrompt = `${prompt}\n\nYour analysis output must start with the exact text: ${AIClient.ANALYSIS_MARKER}`;

    return new Promise((resolve, reject) => {
      const child = spawn(this.cliCommand, [], {
        timeout: this.timeout,
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('error', (error) => {
        if (error.code === 'ENOENT') {
          return reject(new Error(`AI CLI tool '${this.cliCommand.split(' ')[0]}' not found. Please ensure it's installed and in your PATH.`));
        }
        reject(new Error(`Failed to start AI command: ${error.message}`));
      });

      child.on('close', (code) => {
        if (code !== 0) {
          debugLog(this.debugMode, `AI command stderr: ${stderr}`);
          return reject(new Error(`AI command exited with code ${code}: ${stderr}`));
        }

        debugLog(this.debugMode, `AI command stdout: ${stdout}`);
        const result = stdout.replace(AIClient.ANALYSIS_REGEX, '').trim();
        resolve(result);
      });

      child.stdin.write(enhancedPrompt);
      child.stdin.end();
    });
  }
}

export default AIClient;
