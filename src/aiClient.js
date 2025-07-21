import { exec } from 'child_process';
import { debugLog } from './utils.js';

class AIClient {
  constructor(cliCommand, timeout, debugMode) {
    this.cliCommand = cliCommand;
    this.timeout = timeout * 1000; // Convert to milliseconds
    this.debugMode = debugMode;
  }

  async analyze(prompt) {
    const command = `${this.cliCommand} "${prompt}"`;
    debugLog(this.debugMode, `Executing AI command: ${command}`);

    return new Promise((resolve, reject) => {
      const child = exec(command, { timeout: this.timeout }, (error, stdout, stderr) => {
        if (error) {
          if (error.killed) {
            return reject(new Error(`AI command timed out after ${this.timeout / 1000} seconds.`));
          } else if (error.code === 127) {
            return reject(new Error(`AI CLI tool '${this.cliCommand}' not found. Please ensure it's installed and in your PATH.`));
          } else {
            debugLog(this.debugMode, `AI command stderr: ${stderr}`);
            return reject(new Error(`AI command failed with error: ${error.message}`));
          }
        }

        debugLog(this.debugMode, `AI command stdout: ${stdout}`);
        // Assuming the relevant output is everything after a specific marker
        const marker = '---ANALYSIS-START---';
        const startIndex = stdout.indexOf(marker);
        if (startIndex !== -1) {
          resolve(stdout.substring(startIndex + marker.length).trim());
        } else {
          resolve(stdout.trim()); // If marker not found, return full stdout
        }
      });

      child.on('close', (code) => {
        debugLog(this.debugMode, `AI command exited with code ${code}`);
      });
    });
  }
}

export default AIClient;
