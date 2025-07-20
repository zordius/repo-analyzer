import os
from ..engine.base_extractor import BaseExtractor

class KnowledgeExtractor(BaseExtractor):
    def __init__(self):
        super().__init__()
        self.prompt_template = """You are a senior tech lead analyzing a new codebase. Your task is to identify and document domain knowledge based on the provided files. Follow the rules from the design document provided below.

        **Design Document Rules:**
        *   Extract key concepts, business logic, and important terminology.
        *   Identify the purpose and function of each file.
        *   Format the output as a Markdown document.

        **Files to Analyze:**
        {files_to_analyze}

        Your analysis output must start with the exact text: ---ANALYSIS-START---
        """
        

