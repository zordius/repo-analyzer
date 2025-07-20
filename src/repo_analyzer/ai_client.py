import os
import subprocess
import google.generativeai as genai
from .utils import print_debug_info

class AIClient:
    def __init__(self, timeout=60, debug=False):
        self.timeout = timeout
        self.debug = debug

    def analyze(self, prompt):
        raise NotImplementedError

class GenerativeAIClient(AIClient):
    def __init__(self, timeout=60, debug=False):
        super().__init__(timeout, debug)
        try:
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        except Exception as e:
            print(f"Failed to initialize Gemini model: {e}")
            print("Please make sure you have set the GOOGLE_API_KEY environment variable or authenticated with `gcloud auth application-default login`.")
            raise

    def analyze(self, prompt):
        try:
            response = self.model.generate_content(prompt, request_options={"timeout": self.timeout})
            if self.debug:
                print_debug_info("RESPONSE", response.text)
            return response.text
        except Exception as e:
            print(f"An error occurred during API call: {e}")
            return """# Extracted Practices

An error occurred during analysis."""

class GeminiCLIClient(AIClient):
    def analyze(self, prompt):
        try:
            process = subprocess.run(
                ['gemini', '-p', prompt],
                capture_output=True,
                text=True,
                timeout=self.timeout,
                check=True
            )
            if self.debug:
                print_debug_info("RESPONSE", process.stdout)
            
            # Strip everything before the analysis start prefix
            response_text = process.stdout
            prefix = "---ANALYSIS-START---"
            if prefix in response_text:
                response_text = response_text.split(prefix, 1)[1].lstrip()

            return response_text
        except FileNotFoundError:
            print("Error: The 'gemini' command was not found.")
            print("Please ensure the Gemini CLI is installed and in your PATH.")
            return """# Extracted Practices

Gemini CLI not found."""
        except subprocess.TimeoutExpired:
            print("Error: The 'gemini' command timed out.")
            return """# Extracted Practices

Gemini CLI timed out."""
        except subprocess.CalledProcessError as e:
            print(f"Error executing Gemini CLI: {e}")
            print(f"Stderr: {e.stderr}")
            return f"""# Extracted Practices

An error occurred during Gemini CLI execution."""

def get_ai_client(timeout=60, debug=False, client_type='google-gemini-cli'):
    if client_type == "google-gemini-cli":
        print("Using Gemini CLI for analysis.")
        return GeminiCLIClient(timeout, debug)
    else:
        print("Using google-generativeai library for analysis.")
        return GenerativeAIClient(timeout, debug)
