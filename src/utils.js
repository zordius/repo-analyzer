function debugLog(debugMode, message) {
  if (debugMode) {
    console.log(`[DEBUG] ${message}`);
  }
}

export { debugLog };
