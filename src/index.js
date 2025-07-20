const fs = require('fs');
const path = require('path');
const FileCollector = require('./fileCollector');
const AIClient = require('./aiClient');
const ReportGenerator = require('./reportGenerator');
const { debugLog } = require('./utils');

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

    this.fileCollector = new FileCollector({
      exclude: this.exclude,
      include: this.include,
      debug: this.debug,
    });
    this.aiClient = new AIClient(this.cli, this.timeout, this.debug);
    this.reportGenerator = new ReportGenerator('.', this.debug);
  }

  async run() {
    debugLog(this.debug, 'Starting analysis...');

    // 1. Collect files
    const files = await this.fileCollector.collectFiles();
    debugLog(this.debug, `Collected ${files.length} files.`);

    // 2. Read file contents and batch them
    const batches = await this._prepareBatches(files);
    debugLog(this.debug, `Prepared ${batches.length} batches.`);

    // 3. Execute AI analysis in parallel
    const results = await this._runAnalysisInParallel(batches);
    debugLog(this.debug, 'AI analysis complete.');

    // 4. Generate reports (placeholder for now)
    this.reportGenerator.generateReport('analysis_report.md', JSON.stringify(results, null, 2));
    debugLog(this.debug, 'Report generated.');
  }

  async _prepareBatches(files) {
    const batches = [];
    let currentBatchContent = '';
    let currentBatchFiles = [];

    for (const file of files) {
      const absoluteFilePath = path.resolve(file);
      let content = '';
      try {
        content = await fs.promises.readFile(absoluteFilePath, 'utf-8');
      } catch (error) {
        debugLog(this.debug, `Could not read file ${file}: ${error.message}. Skipping.`);
        continue;
      }

      if (content.length === 0) {
        debugLog(this.debug, `Skipping empty file: ${file}`);
        continue;
      }

      const fileEntry = `--- ${file} ---\n${content}\n`;

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
    const results = [];
    const runningPromises = new Set(); // Store promise objects

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const promise = this.aiClient.analyze(batch.prompt)
        .then(result => {
          results.push({ batch: batch.files, result });
          return { status: 'fulfilled', promiseObject: promise }; // Return promise object itself
        })
        .catch(error => {
          console.error(`Error analyzing batch ${i}:`, error.message);
          if (this.debug) {
            console.error(error);
          }
          return { status: 'rejected', promiseObject: promise, reason: error }; // Return promise object itself
        });

      runningPromises.add(promise);

      if (runningPromises.size >= this.instances) {
        // Wait for one of the running promises to settle
        const settledResult = await Promise.race(Array.from(runningPromises).map(p => p.then(val => val, err => err)));
        runningPromises.delete(settledResult.promiseObject);
      }
    }

    // Wait for all remaining promises to settle
    await Promise.all(Array.from(runningPromises).map(p => p.then(val => val, err => err)));
    return results;
  }
}

module.exports = { RepoAnalyzer };
