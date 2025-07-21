import { Command } from 'commander';
import fs from 'fs';
import path from 'path';

const program = new Command();

program
  .name('migrate-mcp-settings')
  .description('CLI to migrate Cursor MCP settings to Gemini config')
  .version('1.0.0')
  .action(() => {
    const cursorMcpPath = path.join(process.env.HOME, '.cursor', 'mcp.json');
    const geminiSettingsPath = path.join(process.env.HOME, '.gemini', 'settings.json');
    const geminiSettingsBackupPath = path.join(process.env.HOME, '.gemini', 'settings.json.bak');

    let cursorMcpContent = {};
    let geminiSettingsContent = {};

    // 1. Read Cursor MCP file
    try {
      cursorMcpContent = JSON.parse(fs.readFileSync(cursorMcpPath, 'utf8'));
    } catch (error) {
      console.error(`Error reading Cursor MCP file at ${cursorMcpPath}: ${error.message}`);
      console.error("Please ensure the file exists and is valid JSON.");
      process.exit(1);
    }

    // 2. Read Gemini settings file
    try {
      geminiSettingsContent = JSON.parse(fs.readFileSync(geminiSettingsPath, 'utf8'));
    } catch (error) {
      console.error(`Error reading Gemini settings file at ${geminiSettingsPath}: ${error.message}`);
      console.error("Please ensure the file exists and is valid JSON.");
      process.exit(1);
    }

    // 3. Backup original Gemini settings
    try {
      fs.copyFileSync(geminiSettingsPath, geminiSettingsBackupPath);
      console.log(`Backed up original Gemini settings to ${geminiSettingsBackupPath}`);
    } catch (error) {
      console.error(`Error backing up Gemini settings: ${error.message}`);
      process.exit(1);
    }

    // 4. Merge mcpServers from Cursor into Gemini settings
    const cursorMcpServers = cursorMcpContent.mcpServers || {};
    const convertedMcpServers = {};

    for (const serverName in cursorMcpServers) {
      if (Object.hasOwnProperty.call(cursorMcpServers, serverName)) {
        const server = { ...cursorMcpServers[serverName] };
        if (server.timeout !== undefined && typeof server.timeout === 'number') {
          // Convert timeout from seconds to microseconds
          server.timeout *= 1000;
        }
        convertedMcpServers[serverName] = server;
      }
    }

    const mergedSettings = {
      ...geminiSettingsContent,
      mcpServers: {
        ...(geminiSettingsContent.mcpServers || {}), // Preserve existing mcpServers if any
        ...convertedMcpServers
      }
    };

    // 5. Write merged settings back to Gemini settings file
    try {
      fs.writeFileSync(geminiSettingsPath, JSON.stringify(mergedSettings, null, 2), 'utf8');
      console.log(`Successfully migrated MCP settings to ${geminiSettingsPath}`);
    } catch (error) {
      console.error(`Error writing merged settings to ${geminiSettingsPath}: ${error.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);