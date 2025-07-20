import os
from ..engine.base_extractor import BaseExtractor

class PracticeExtractor(BaseExtractor):
    def __init__(self, timeout=60, debug=False, ai_client='cli'):
        super().__init__(timeout, debug, ai_client)
        self.prompt_template = """You are a senior tech lead analyzing a new codebase. Your task is to identify and document coding practices based on the provided files. Follow the rules from the design document provided below.

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

    def analyze(self, file_contents, batch_number=1, total_batches=1, return_prompt=False):
        return super().analyze(file_contents, batch_number, total_batches, return_prompt, self.prompt_template, "coding practices")