# Project: Codebase Analyzer

## Overview

Implement a command-line tool that facilitates large-scale code analysis using an external Artificial Intelligence (AI) command-line interface (CLI). The tool automatically manages context size by batching file content and augmenting a user-provided base prompt, enabling efficient parallel processing and structured report generation.

## Core Components and Functionality

The system should consist of the following main components:

### 1. Main Application Entry Point

*   **Purpose**: Parse command-line arguments and orchestrate the analysis process.
*   **Configuration Options**:
    
    *   `--exclude` (list of glob patterns, optional, default: common build artifacts, version control directories, and binary files): Patterns for files/directories to exclude from analysis. These patterns are applied in addition to a set of default exclusions (e.g., `node_modules`, `.git` subdirectories, compiled files, images, archives).
    *   `--include` (list of glob patterns, optional): Patterns for files/directories to explicitly include in analysis. These patterns are considered after `--exclude` patterns, meaning if a file matches both an include and an exclude pattern, it will be excluded.
    *   `--timeout` (integer, default: 60): Timeout in seconds for AI API calls.
    *   `--debug` (flag): Enable verbose debug output.
    *   `--cli` (string, default: 'gemini -p'): The executable name of the AI command-line tool to use for analysis.
    *   `--context-size` (integer, default: 10000): Maximum context size (in characters/tokens) for the AI model per batch.
    *   `--prompt-file` (string, required): Path to a file containing the base prompt for AI analysis. This prompt will be augmented with the collected file contents.
    *   `--instances` (integer, default: 2): Maximum number of parallel AI analysis instances.

### 2. Orchestrator / Agent

*   **Purpose**: Manage the entire analysis workflow.
*   **Workflow**:
    1.  Collect files by recursively scanning the current directory.
        *   Collect files by recursively scanning the current directory.
        *   Filter out files based on `--exclude` and `--include` patterns, common ignored directories (e.g., `node_modules`, `.git`, `__pycache__`), and common binary/archive file extensions (e.g., `.jpg`, `.zip`, `.pdf`).
        *   Read the content of the collected files. Skip very large or empty files.
        *   Batch the collected file contents. Each batch should not exceed the `--context-size`.
        *   For each batch, augment the user-provided prompt (from `--prompt-file`) with the file contents.
        *   Execute AI analysis for each batch in parallel, up to `--instances` concurrent processes, by directly calling the configured AI CLI with the augmented prompt. Concurrency is managed by a robust queuing mechanism.
        *   Aggregate the results from all parallel analyses.
        *   Generate and save reports based on the analysis type. Handle errors from subprocesses gracefully.

### 3. File Collector

*   **Purpose**: Discover and filter files within a codebase.
*   **Functionality**:
    *   Collect files from current directory (recursively).
    *   Implement robust filtering based on:
        *   Explicit `exclude_patterns` (glob patterns).
        *   Explicit `include_patterns` (glob patterns).
        *   Common ignored directories (e.g., `__pycache__`, `node_modules`, `build`, `dist`, `.vscode`, `.idea`, `venv`, `.git` subdirectories like `logs`, `objects`).
        *   Common ignored file extensions (e.g., `.pyc`, `.so`, `.dll`, image formats, archive formats, `.pdf`, `.doc`).
    *   Return relative paths of collected files.

### 4. AI Client Abstraction

*   **Purpose**: Provide a unified interface for interacting with different AI models.
*   **Interface**: Define a base `AIClient` with an `analyze(prompt)` method.
*   **Implementations**:
    *   **CLI-based Client**: Interacts with an external AI command-line tool (e.g., `gemini -p <prompt>`).
        *   Handle cases where the CLI tool is not found.
        *   Handle command timeouts.
        *   Handle other command execution errors.
        *   Extract the relevant output from the CLI tool's stdout (e.g., everything after a specific marker like `---ANALYSIS-START---`).



### 6. Report Generator

*   **Purpose**: Write the final analysis reports to files.
*   **Functionality**:
    *   Takes a filename and content.
    *   Writes the content to the specified file in the output directory.

### 7. Utility Functions

*   **Purpose**: Provide common helper functions (e.g., for debug printing).

## Technical Considerations

*   **Parallel Processing**: Implement parallel execution of AI analysis tasks using subprocesses, managed by a robust queuing mechanism. Manage the number of concurrent processes to avoid overwhelming the AI service or local resources.
*   **Error Handling**: Implement robust error handling for file operations, AI API calls, and subprocess execution.
*   **Context Management**: Carefully manage the AI model's context window by batching file contents.
*   **Modularity**: Design the system with clear separation of concerns, allowing for easy extension (e.g., adding new AI clients, new types of analyzers).
*   **Debugging**: Include a debug mode for verbose logging of prompts, responses, and internal states.

## Output

The tool should generate Markdown files in the current directory (or a specified output directory) based on the analysis performed. If an analysis subprocess fails, the corresponding report should not be written, and an error message should be printed.