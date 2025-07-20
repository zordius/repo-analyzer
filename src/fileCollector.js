const { glob } = require('glob');
const fs = require('fs');
const { debugLog } = require('./utils');
const { Minimatch } = require('minimatch');

class FileCollector {
  constructor(options) {
    this.exclude = options.exclude || [];
    this.include = options.include || [];
    this.debug = options.debug;

    this.defaultExcludes = [
      '**/node_modules/**',
      '**/.git/**',
      '**/.git/logs/**',
      '**/.git/objects/**',
      '**/__pycache__/**',
      '**/build/**',
      '**/dist/**',
      '**/.vscode/**',
      '**/.idea/**',
      '**/venv/**',
      '**/*.pyc',
      '**/*.so',
      '**/*.dll',
      '**/*.jpg',
      '**/*.jpeg',
      '**/*.png',
      '**/*.gif',
      '**/*.bmp',
      '**/*.zip',
      '**/*.tar',
      '**/*.gz',
      '**/*.rar',
      '**/*.7z',
      '**/*.pdf',
      '**/*.doc',
      '**/*.docx',
      '**/*.xls',
      '**/*.xlsx',
      '**/*.ppt',
      '**/*.pptx',
    ];

    // Combine all exclude patterns into a single array for glob
    this.combinedExcludePatterns = [
      ...this.defaultExcludes,
      ...this.exclude,
    ];

    // Create Minimatch objects for include patterns
    this.includeMatchers = this.include.map(pattern => new Minimatch(pattern, { dot: true }));
  }

  async collectFiles() {
    debugLog(this.debug, 'Collecting files...');

    // Get all files recursively, applying all exclude patterns directly in glob
    let files = await glob('**/*', { ignore: this.combinedExcludePatterns, nodir: true });

    // Apply include patterns if any are specified
    if (this.include.length > 0) {
      files = files.filter(file => {
        return this.includeMatchers.some(matcher => matcher.match(file));
      });
    }

    // Filter out very large or empty files (basic check, can be improved)
    files = files.filter(file => {
      try {
        const stats = fs.statSync(file);
        return stats.size > 0 && stats.size < 10 * 1024 * 1024; // Max 10MB for now
      } catch (e) {
        debugLog(this.debug, `Could not stat file ${file}: ${e.message}`);
        return false;
      }
    });

    return files;
  }
}

module.exports = FileCollector;
