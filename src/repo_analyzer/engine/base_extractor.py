class BaseExtractor:
    def __init__(self):
        self.prompt_template = ""
        self.analysis_type = ""

    def get_prompt(self, files_to_analyze):
        return self.prompt_template.format(files_to_analyze=files_to_analyze)


