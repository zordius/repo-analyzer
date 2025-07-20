from .collectors.file_collector import FileCollector
from .engine.practice_extractor import PracticeExtractor
from .engine.knowledge_extractor import KnowledgeExtractor
from .reporter import ReportGenerator

class AgentOrchestrator:
    def __init__(self, level, file_list, skip_patterns=None, timeout=60, debug=False, ai_client='cli', context_size=10000):
        self.level = level
        self.file_list = file_list
        self.skip_patterns = skip_patterns
        self.timeout = timeout
        self.debug = debug
        self.ai_client = ai_client
        self.context_size = context_size
        self.file_contents = {}
        self.practice_extractor = PracticeExtractor(timeout=self.timeout, debug=self.debug, ai_client=self.ai_client)
        self.knowledge_extractor = KnowledgeExtractor(timeout=self.timeout, debug=self.debug, ai_client=self.ai_client)
        self.reporter = ReportGenerator()

    def run(self):
        if self.debug:
            print(f"Using AI client: {self.ai_client}")

        print(f"Starting analysis at level {self.level}")
        files = self._collect_files()
        print(f"Found {len(files)} files to analyze.")

        self._read_files(files)

        practices = self._analyze_in_batches(self.practice_extractor, "# Extracted Practices")
        knowledge = self._analyze_in_batches(self.knowledge_extractor, "# Extracted Knowledge")

        self.reporter.write_report("ai4ci-practices.md", practices)
        self.reporter.write_report("ai4ci-knowledge.md", knowledge)

    def _analyze_in_batches(self, extractor, header):
        """Analyzes files in batches to avoid exceeding context size."""
        all_results = []
        batches = []
        current_batch = {}
        current_size = 0

        for file_path, content in self.file_contents.items():
            if current_size + len(content) > self.context_size and current_batch:
                batches.append(current_batch)
                current_batch = {}
                current_size = 0

            current_batch[file_path] = content
            current_size += len(content)

        if current_batch:
            batches.append(current_batch)

        for i, batch in enumerate(batches):
            result = extractor.analyze(batch, i + 1, len(batches))
            all_results.append(result)

        # Combine results, removing duplicate headers
        final_report = ""
        for i, result in enumerate(all_results):
            if i > 0:
                result = result.replace(header, "")
            final_report += result

        return final_report


    def _read_files(self, files):
        for file_path in files:
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    self.file_contents[file_path] = f.read()
            except Exception as e:
                print(f"Error reading {file_path}: {e}")

    def _collect_files(self):
        collector = FileCollector(root_path=".", skip_patterns=self.skip_patterns)
        if self.file_list:
            return collector.collect_from_list(self.file_list)
        else:
            return collector.collect_from_directory(".")