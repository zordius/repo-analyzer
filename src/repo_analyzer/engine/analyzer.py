from ..ai_client import get_ai_client
from ..utils import print_debug_info

class Analyzer:
    def __init__(self, timeout=60, debug=False, ai_client='cli'):
        self.timeout = timeout
        self.debug = debug
        self.ai_client = get_ai_client(timeout=self.timeout, debug=self.debug, client_type=ai_client)

    def analyze_content(self, prompt):
        if self.debug:
            print_debug_info("PROMPT", prompt)

        try:
            result = self.ai_client.analyze(prompt)
            return result
        except Exception as e:
            return f"---ANALYSIS-ERROR---An error occurred during analysis: {e}"