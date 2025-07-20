const fs = require('fs');
const pLimit = require('p-limit');
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
    const limit = pLimit(this.instances);
    const tasks = batches.map(batch => limit(async () => {
      try {
        const result = await this.aiClient.analyze(batch.prompt);
        return { status: 'fulfilled', batch: batch.files, result };
      } catch (error) {
        console.error(`Error analyzing batch:`, error.message);
        if (this.debug) {
          console.error(error);
        }
        return { status: 'rejected', batch: batch.files, reason: error.message };
      }
    }));
    const results = await Promise.allSettled(tasks);

    return results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // For rejected promises, the catch block already handled logging and returned a rejected status object
        return result.reason; // This will be the object returned by the catch block
      }
    });
  }
}

module.exports = { RepoAnalyzer };
