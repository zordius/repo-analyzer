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
}

export default ReportGenerator;
