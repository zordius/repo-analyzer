function debugLog(debugMode, message) {
  if (debugMode) {
    console.log(`[DEBUG] ${message}`);
  }
}

module.exports = { debugLog };
