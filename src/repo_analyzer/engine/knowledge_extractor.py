import os
from ..engine.base_extractor import BaseExtractor

class KnowledgeExtractor(BaseExtractor):
    def __init__(self, timeout=60, debug=False, ai_client='cli'):
        super().__init__(timeout, debug, ai_client)
        self.prompt_template = """You are a senior tech lead analyzing a new codebase. Your task is to identify and document domain knowledge based on the provided files. Follow the rules from the design document provided below.

        **Design Document Rules:**
        *   Extract key concepts, business logic, and important terminology.
        *   Identify the purpose and function of each file.
        *   Format the output as a Markdown document.

        **Files to Analyze:**
        {files_to_analyze}

        Your analysis output must start with the exact text: ---ANALYSIS-START---
        """

    def analyze(self, file_contents, batch_number=1, total_batches=1, return_prompt=False):
        return super().analyze(file_contents, batch_number, total_batches, return_prompt, self.prompt_template, "domain knowledge")

