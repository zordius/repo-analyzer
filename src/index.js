import fs from 'fs';
import path from 'path';
import pLimit from 'p-limit';
import FileCollector from './fileCollector.js';
import AIClient from './aiClient.js';
import ReportGenerator from './reportGenerator.js';
import { debugLog } from './utils.js';

class RepoAnalyzer {
  constructor(options) {
    this.exclude = options.exclude;
    this.include = options.include;
    this.timeout = options.timeout;
    this.debug = options.debug;
    this.cli = options.cli;
    this.contextSize = options.contextSize;
    this.prompt = options.prompt;
    this.instances = options.instances;
    this.reportDir = options.reportDir;
    this.promptFilePath = options.promptFilePath;

    this.fileCollector = new FileCollector({
      exclude: this.exclude,
      include: this.include,
      debug: this.debug,
    });
    this.aiClient = new AIClient(this.cli, this.timeout, this.debug);
    this.reportGenerator = new ReportGenerator(this.reportDir, this.debug);

    // Initialize error collection
    this.errors = [];
  }

  async run() {
    console.log('Starting analysis...');

    // 1. Collect files
    const files = await this.fileCollector.collectFiles();
    console.log(`Collected ${files.length} files.`);

    // 2. Read file contents and batch them
    const batches = await this._prepareBatches(files);
    console.log(`Prepared ${batches.length} batches.`);

    // 3. Initialize report for progressive writing
    const outputFileName = path.basename(this.promptFilePath);
    await this.reportGenerator.initializeReport(outputFileName, `Total Files: ${files.length}\nTotal Batches: ${batches.length}`);

    // 4. Execute AI analysis in parallel with progressive writing
    await this._runAnalysisInParallel(batches);

    // 5. Write error log if there are errors
    if (this.errors.length > 0) {
      await this._writeErrorLog();
    }

    // 6. Finalize the report
    const footer = `Analysis Summary:\n- Total Files Processed: ${files.length}\n- Total Batches: ${batches.length}\n- Failed Batches: ${this.errors.length}`;
    await this.reportGenerator.finalizeReport(footer);
    console.log('Report generated.');
  }

  async _prepareBatches(files) {
    const batches = [];
    let currentBatchContent = '';
    let currentBatchFiles = [];

    for (const file of files) {
      let content = '';
      try {
        content = await fs.promises.readFile(file, 'utf-8');
      } catch (error) {
        debugLog(this.debug, `Could not read file ${file}: ${error.message}. Skipping.`);
        continue;
      }

      if (content.length === 0) {
        debugLog(this.debug, `Skipping empty file: ${file}`);
        continue;
      }

      const fileEntry = `--- ${file} ---\n\`\`\`\`\`\`\`\`file\n${content}\n\`\`\`\`\`\`\`\`\n`;

      if ((currentBatchContent + fileEntry).length > this.contextSize && currentBatchContent.length > 0) {
        batches.push({
          prompt: `${this.prompt}\n${currentBatchContent}`,
          files: currentBatchFiles,
        });
        currentBatchContent = '';
        currentBatchFiles = [];
      }

      currentBatchContent += fileEntry;
      currentBatchFiles.push(file);
    }

    if (currentBatchContent.length > 0) {
      batches.push({
        prompt: `${this.prompt}\n${currentBatchContent}`,
        files: currentBatchFiles,
      });
    }

    return batches;
  }

  async _runAnalysisInParallel(batches) {
    const limit = pLimit(this.instances);
    const startTime = Date.now();
    let completedBatches = 0;
    const totalBatches = batches.length;

    console.log(`Starting analysis of ${totalBatches} batches with ${this.instances} parallel instances...`);

    const tasks = batches.map((batch, index) => limit(async () => {
      const batchStartTime = Date.now();
      try {
        const result = await this.aiClient.analyze(batch.prompt);
        completedBatches++;
        const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
        const batchTime = Math.round((Date.now() - batchStartTime) / 1000);
        console.log(`✓ Batch ${index + 1}/${totalBatches} completed (${batchTime}s) - Total: ${completedBatches}/${totalBatches} batches, ${elapsedSeconds}s elapsed`);

        // Write result progressively
        const batchHeader = `BATCH ${index + 1}/${totalBatches} - Files: ${batch.files.length}`;
        const batchContent = `${batchHeader}\n${'='.repeat(60)}\n${result}`;
        await this.reportGenerator.appendToReport(batchContent);

        return { status: 'fulfilled', batch: batch.files, result };
      } catch (error) {
        completedBatches++;
        const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
        console.error(`✗ Batch ${index + 1}/${totalBatches} failed (${elapsedSeconds}s elapsed) - Total: ${completedBatches}/${totalBatches} batches`);
        console.error(`Error analyzing batch:`, error.message);
        if (this.debug) {
          console.error(error);
        }

        // Collect error details
        this.errors.push({
          timestamp: new Date().toISOString(),
          batchIndex: index + 1,
          batchFiles: batch.files,
          error: error.message,
          stack: error.stack,
          elapsedTime: elapsedSeconds,
          batchTime: Math.round((Date.now() - batchStartTime) / 1000)
        });

        // Write error to report progressively
        const errorHeader = `BATCH ${index + 1}/${totalBatches} - ERROR - Files: ${batch.files.length}`;
        const errorContent = `${errorHeader}\n${'='.repeat(60)}\nError: ${error.message}\n\nFiles in this batch:\n${batch.files.map(f => `- ${f}`).join('\n')}`;
        await this.reportGenerator.appendToReport(errorContent);

        return { status: 'rejected', batch: batch.files, reason: error.message };
      }
    }));

    await Promise.allSettled(tasks);

    const totalTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`\nAnalysis completed in ${totalTime} seconds. Processed ${totalBatches} batches.`);

    if (this.errors.length > 0) {
      console.log(`⚠️  ${this.errors.length} batches failed. Check error log for details.`);
    }
  }

  async _writeErrorLog() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const errorLogPath = path.join(this.reportDir, `error-log-${timestamp}.txt`);

    let errorLogContent = `Repo Analyzer Error Log\n`;
    errorLogContent += `Generated: ${new Date().toISOString()}\n`;
    errorLogContent += `Total Errors: ${this.errors.length}\n`;
    errorLogContent += `Report Directory: ${this.reportDir}\n`;
    errorLogContent += `Prompt File: ${this.promptFilePath}\n`;
    errorLogContent += `CLI Command: ${this.cli}\n`;
    errorLogContent += `Timeout: ${this.timeout}s\n`;
    errorLogContent += `Parallel Instances: ${this.instances}\n`;
    errorLogContent += `Context Size: ${this.contextSize}\n\n`;
    errorLogContent += `${'='.repeat(80)}\n\n`;

    this.errors.forEach((error, index) => {
      errorLogContent += `ERROR ${index + 1}/${this.errors.length}\n`;
      errorLogContent += `Timestamp: ${error.timestamp}\n`;
      errorLogContent += `Batch: ${error.batchIndex}\n`;
      errorLogContent += `Batch Time: ${error.batchTime}s\n`;
      errorLogContent += `Elapsed Time: ${error.elapsedTime}s\n`;
      errorLogContent += `Files in Batch:\n`;
      error.batchFiles.forEach(file => {
        errorLogContent += `  - ${file}\n`;
      });
      errorLogContent += `Error Message: ${error.error}\n`;
      if (error.stack) {
        errorLogContent += `Stack Trace:\n${error.stack}\n`;
      }
      errorLogContent += `\n${'='.repeat(80)}\n\n`;
    });

    try {
      await fs.promises.writeFile(errorLogPath, errorLogContent, 'utf-8');
      console.log(`📝 Error log written to: ${errorLogPath}`);
    } catch (writeError) {
      console.error(`Failed to write error log: ${writeError.message}`);
    }
  }
}

export { RepoAnalyzer };
