import fs from 'fs';
import path from 'path';
import { debugLog } from './utils.js';

class ReportGenerator {
  constructor(outputDir = '.', debugMode) {
    this.outputDir = outputDir;
    this.debugMode = debugMode;
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateReport(filename, content) {
    const filePath = path.join(this.outputDir, filename);
    debugLog(this.debugMode, `Generating report: ${filePath}`);
    try {
      await fs.promises.writeFile(filePath, content);
      debugLog(this.debugMode, `Report ${filename} generated successfully.`);
    } catch (error) {
      console.error(`Error writing report ${filename}: ${error.message}`);
      throw error;
    }
  }

  async initializeReport(filename, header = '') {
    const filePath = path.join(this.outputDir, filename);
    debugLog(this.debugMode, `Initializing report: ${filePath}`);
    try {
      const timestamp = new Date().toISOString();
      const initialContent = `Repo Analysis Report\nGenerated: ${timestamp}\n${header}\n\n${'='.repeat(80)}\n\n`;
      await fs.promises.writeFile(filePath, initialContent);
      this.currentReportPath = filePath;
      debugLog(this.debugMode, `Report ${filename} initialized successfully.`);
    } catch (error) {
      console.error(`Error initializing report ${filename}: ${error.message}`);
      throw error;
    }
  }

  async appendToReport(content, separator = '\n\n') {
    if (!this.currentReportPath) {
      throw new Error('No report initialized. Call initializeReport() first.');
    }

    try {
      await fs.promises.appendFile(this.currentReportPath, content + separator);
      debugLog(this.debugMode, `Content appended to report: ${this.currentReportPath}`);
    } catch (error) {
      console.error(`Error appending to report: ${error.message}`);
      throw error;
    }
  }

  async finalizeReport(footer = '') {
    if (!this.currentReportPath) {
      throw new Error('No report initialized. Call initializeReport() first.');
    }

    try {
      const finalContent = `\n${'='.repeat(80)}\n\n${footer}\nReport completed: ${new Date().toISOString()}`;
      await fs.promises.appendFile(this.currentReportPath, finalContent);
      debugLog(this.debugMode, `Report finalized: ${this.currentReportPath}`);
      this.currentReportPath = null;
    } catch (error) {
      console.error(`Error finalizing report: ${error.message}`);
      throw error;
    }
  }
}

export default ReportGenerator;
