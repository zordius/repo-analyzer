from ..ai_client import get_ai_client
from ..utils import print_debug_info

class BaseExtractor:
    def __init__(self, timeout=60, debug=False, ai_client='cli'):
        self.timeout = timeout
        self.debug = debug
        self.ai_client = get_ai_client(timeout=self.timeout, debug=self.debug, client_type=ai_client)

    def analyze(self, files_to_analyze, batch_number, total_batches, return_prompt, prompt_template, analysis_type):
        if total_batches > 0:
            print(f"Analyzing files for {analysis_type} (batch {batch_number}/{total_batches})...")
        if not files_to_analyze:
            return f"# Extracted {analysis_type.replace('files for ', '').title()}\n\nNo files to analyze."

        # Construct the prompt
        prompt = prompt_template.format(files_to_analyze=files_to_analyze)

        if return_prompt:
            return prompt

        if self.debug:
            print_debug_info("PROMPT", prompt)

        try:
            return self.ai_client.analyze(prompt)
        except Exception as e:
            return f"# Extracted {analysis_type.replace('files for ', '').title()}\n\nAn error occurred during analysis."


