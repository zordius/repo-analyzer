# Project: Codebase Analyzer

## Overview

Implement a command-line tool that analyzes a given codebase to extract "coding practices" and "domain knowledge" using an external Artificial Intelligence (AI) model. The tool should be highly configurable, support parallel processing, and generate structured reports.

## Core Components and Functionality

The system should consist of the following main components:

### 1. Main Application Entry Point

*   **Purpose**: Parse command-line arguments and orchestrate the analysis process.
*   **Configuration Options**:
    *   `--file-list` (optional): Path to a file containing a list of relative file paths to analyze. If not provided, analyze the current directory.
    *   `--level` (integer, default: 1): Analysis level (e.g., 1-5), potentially influencing the depth or type of analysis.
    *   `--skip` (list of glob patterns, optional): Patterns for files/directories to exclude from analysis.
    *   `--timeout` (integer, default: 60): Timeout in seconds for AI API calls.
    *   `--debug` (flag): Enable verbose debug output.
    *   `--ai-client` (choice, default: 'cli'): Specifies the AI client to use (e.g., 'cli' for a command-line interface, 'library' for a direct API library).
    *   `--context-size` (integer, default: 10000): Maximum context size (in characters/tokens) for the AI model per batch.
    *   `--prompt-file` (optional): Path to a file containing a pre-defined prompt for direct AI analysis (bypasses file collection).
    *   `--instances` (integer, default: 2): Maximum number of parallel AI analysis instances.

### 2. Orchestrator / Agent

*   **Purpose**: Manage the entire analysis workflow.
*   **Workflow**:
    1.  If `--prompt-file` is provided, read its content and send it directly to the AI for analysis, then print the result.
    2.  Otherwise:
        *   Collect files based on the provided `--file-list` or by recursively scanning the current directory.
        *   Filter out files based on `--skip` patterns, common ignored directories (e.g., `node_modules`, `.git`, `__pycache__`), and common binary/archive file extensions (e.g., `.jpg`, `.zip`, `.pdf`).
        *   Read the content of the collected files. Skip very large or empty files.
        *   Batch the collected file contents. Each batch should not exceed the `--context-size`.
        *   For each batch, generate a specific prompt for analysis (e.g., for "coding practices" or "domain knowledge").
        *   Execute AI analysis for each batch in parallel, up to `--instances` concurrent processes. Each parallel process should ideally be a separate invocation of the main application with the `--prompt-file` argument.
        *   Aggregate the results from all parallel analyses.
        *   Generate and save reports based on the analysis type. Handle errors from subprocesses gracefully.

### 3. File Collector

*   **Purpose**: Discover and filter files within a codebase.
*   **Functionality**:
    *   Collect files from a specified directory (recursively) or from a list of paths provided in a file.
    *   Implement robust filtering based on:
        *   Explicit `skip_patterns` (glob patterns).
        *   Common ignored directories (e.g., `__pycache__`, `node_modules`, `build`, `dist`, `.vscode`, `.idea`, `venv`, `.git` subdirectories like `logs`, `objects`).
        *   Common ignored file extensions (e.g., `.pyc`, `.so`, `.dll`, image formats, archive formats, `.pdf`, `.doc`).
    *   Return absolute paths of collected files.

### 4. AI Client Abstraction

*   **Purpose**: Provide a unified interface for interacting with different AI models.
*   **Interface**: Define a base `AIClient` with an `analyze(prompt)` method.
*   **Implementations**:
    *   **CLI-based Client**: Interacts with an external AI command-line tool (e.g., `gemini -p <prompt>`).
        *   Handle `FileNotFoundError` if the CLI tool is not found.
        *   Handle `TimeoutExpired` if the command times out.
        *   Handle `CalledProcessError` for other command execution errors.
        *   Extract the relevant output from the CLI tool's stdout (e.g., everything after a specific marker like `---ANALYSIS-START---`).
    *   **Library-based Client**: Interacts directly with an AI model's API library (e.g., Google's Generative AI library).
        *   Handle API initialization errors (e.g., missing API key).
        *   Handle API call errors and timeouts.

### 5. Analyzers

*   **Purpose**: Generate specific prompts for the AI model based on the analysis type (e.g., practices, knowledge, analysis level).
*   **Base Analyzer**: A base class with a method `get_prompt(files_to_analyze_string)` that formats a template with the file contents.
*   **Specific Analyzers**: Implement concrete analyzers for different types of analysis, each defining its own prompt content, rules for extraction, and output format. Examples include:
    *   Practice Analyzer
    *   Knowledge Analyzer
    *   Level Analyzer (for determining which files to include based on analysis level)

### 6. Report Generator

*   **Purpose**: Write the final analysis reports to files.
*   **Functionality**:
    *   Takes a filename and content.
    *   Writes the content to the specified file in the output directory.

### 7. Utility Functions

*   **Purpose**: Provide common helper functions (e.g., for debug printing).

## Technical Considerations

*   **Parallel Processing**: Implement parallel execution of AI analysis tasks using subprocesses. Manage the number of concurrent processes to avoid overwhelming the AI service or local resources.
*   **Error Handling**: Implement robust error handling for file operations, AI API calls, and subprocess execution.
*   **Context Management**: Carefully manage the AI model's context window by batching file contents.
*   **Modularity**: Design the system with clear separation of concerns, allowing for easy extension (e.g., adding new AI clients, new types of analyzers).
*   **Debugging**: Include a debug mode for verbose logging of prompts, responses, and internal states.

## Output

The tool should generate Markdown files in the current directory (or a specified output directory) based on the analysis performed. If an analysis subprocess fails, the corresponding report should not be written, and an error message should be printed.