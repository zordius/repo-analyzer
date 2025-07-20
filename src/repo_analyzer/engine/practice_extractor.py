import os
from ..ai_client import get_ai_client
from ..utils import print_debug_info

class PracticeExtractor:
    def __init__(self, timeout=60, debug=False, ai_client='cli'):
        self.timeout = timeout
        self.debug = debug
        self.ai_client = get_ai_client(timeout=self.timeout, debug=self.debug, client_type=ai_client)

    def _get_language(self, file_path):
        """Determines the language for syntax highlighting based on file extension."""
        ext = os.path.splitext(file_path)[1].lower()
        lang_map = {
            '.py': 'python',
            '.js': 'javascript',
            '.ts': 'typescript',
            '.java': 'java',
            '.go': 'go',
            '.rb': 'ruby',
            '.php': 'php',
            '.cs': 'csharp',
            '.cpp': 'cpp',
            '.c': 'c',
            '.h': 'c',
            '.html': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.less': 'less',
            '.json': 'json',
            '.xml': 'xml',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.md': 'markdown',
            '.sh': 'bash',
            '.bat': 'batch',
            '.ps1': 'powershell',
            '.sql': 'sql',
        }
        return lang_map.get(ext, '')

    def analyze(self, file_contents, batch_number=1, total_batches=1, return_prompt=False):
        if total_batches > 0:
            print(f"Analyzing files for coding practices (batch {batch_number}/{total_batches})...")
        if not file_contents:
            return "# Extracted Practices\n\nNo files to analyze."

        # Prepare the content for the prompt
        prompt_content = []
        for file_path, content in file_contents.items():
            relative_path = os.path.relpath(file_path)
            # Skip files that are too large or empty
            if len(content) > 100000 or len(content) == 0:
                continue
            language = self._get_language(relative_path)
            prompt_content.append(f"""File: `{relative_path}`
```{language}
{content}
```
""")
        
        files_to_analyze = "\n".join(prompt_content)

        # Construct the prompt
        prompt = f"""You are a senior tech lead analyzing a new codebase. Your task is to identify and document coding practices based on the provided files. Follow the rules from the design document provided below.

        **Design Document Rules:**
        *   Identify practices and create a simple description for each.
        *   List all files related to a practice.
        *   Label practices with appropriate tags (e.g., `document`, `testing`, `lint`, `code-structure`, `dependency-management`).
        *   If a practice is enforced (e.g., by a linter), label it as a `rule`.
        *   Format the output as a Markdown bulleted list, as shown in the example.

        **Example Output Format:**
        # Extracted Practices
        * **Practice Name**
          * label: a-label
          * file: path/to/file.ext
          * file: another/path/to/file.ext

        **Files to Analyze:**
        {files_to_analyze}

        Your analysis output must start with the exact text: ---ANALYSIS-START---
        """

        if return_prompt:
            return prompt

        if self.debug:
            print_debug_info("PROMPT", prompt)

        try:
            return self.ai_client.analyze(prompt)
        except Exception as e:
            return "# Extracted Practices\n\nAn error occurred during analysis."