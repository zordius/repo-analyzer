import os
import tempfile
import subprocess
from .collectors.file_collector import FileCollector
from .engine.practice_extractor import PracticeExtractor
from .engine.knowledge_extractor import KnowledgeExtractor
from .reporter import ReportGenerator
from .engine.analyzer import Analyzer

class AgentOrchestrator:
    def __init__(self, level, file_list, skip_patterns=None, timeout=60, debug=False, ai_client='cli', context_size=10000, prompt_file=None, instances=2):
        self.level = level
        self.file_list = file_list
        self.skip_patterns = skip_patterns
        self.timeout = timeout
        self.debug = debug
        self.ai_client = ai_client
        self.context_size = context_size
        self.prompt_file = prompt_file
        self.instances = instances
        self.file_contents = {}
        self.practice_extractor = PracticeExtractor()
        self.knowledge_extractor = KnowledgeExtractor()
        self.reporter = ReportGenerator()
        self.analyzer = Analyzer(timeout=self.timeout, debug=self.debug, ai_client=self.ai_client)

    def run(self):
        if self.prompt_file:
            self._analyze_prompt_file()
            return

        if self.debug:
            print(f"Using AI client: {self.ai_client}")

        print(f"Starting analysis at level {self.level}")
        files = self._collect_files()
        print(f"Found {len(files)} files to analyze.")

        self._read_files(files)

        temp_dir_obj = None
        temp_dir = None
        try:
            if self.debug:
                temp_dir = tempfile.mkdtemp()
                print(f"Debug mode: Temporary directory for batches is: {temp_dir}")
            else:
                temp_dir_obj = tempfile.TemporaryDirectory()
                temp_dir = temp_dir_obj.name

            practices = self._analyze_in_parallel(self.practice_extractor, "# Extracted Practices", temp_dir)
            knowledge = self._analyze_in_parallel(self.knowledge_extractor, "# Extracted Knowledge", temp_dir)

            self.reporter.write_report("ai4ci-practices.md", practices)
            self.reporter.write_report("ai4ci-knowledge.md", knowledge)
        finally:
            if temp_dir_obj:
                temp_dir_obj.cleanup()

    def _analyze_prompt_file(self):
        with open(self.prompt_file, "r") as f:
            prompt = f.read()
        
        result = self.analyzer.analyze_content(prompt)
        print(result)

    def _analyze_in_parallel(self, extractor, header, temp_dir):
        """Analyzes files in parallel batches."""
        batches = self._create_batches(extractor, temp_dir)
        total_batches = len(batches)
        active_processes = []
        for i, batch_prompt_file in enumerate(batches):
            # Wait if we have reached the maximum number of parallel instances
            while len(active_processes) >= self.instances:
                # Check for completed processes
                for p in active_processes:
                    if p.poll() is not None:  # Process has completed
                        active_processes.remove(p)
                        break
                else: # No process completed, wait for one
                    # This is a simple blocking wait, for more complex scenarios
                    # select.select or threading.Event could be used
                    active_processes[0].wait() 
                    active_processes.pop(0)

            output_file = os.path.join(temp_dir, f"output_{i}.txt")
            error_file = os.path.join(temp_dir, f"error_{i}.txt")
            command = [
                "python3", "-m", "repo_analyzer",
                "--prompt-file", batch_prompt_file,
                "--ai-client", self.ai_client,
                "--timeout", str(self.timeout),
            ]
            if self.debug:
                command.append("--debug")
            
            with open(output_file, "w") as out, open(error_file, "w") as err:
                process = subprocess.Popen(command, stdout=out, stderr=err)
                active_processes.append(process)

        # Wait for any remaining processes to complete
        for process in active_processes:
            process.wait()

        # Aggregate results
        all_results = []
        for i in range(len(batches)):
            output_file = os.path.join(temp_dir, f"output_{i}.txt")
            with open(output_file, "r") as f:
                all_results.append(f.read())
        
        final_report = ""
        for i, result in enumerate(all_results):
            if i > 0:
                result = result.replace(header, "")
            final_report += result

        return final_report

    def _create_batches(self, extractor, temp_dir):
        """Creates prompt files for each batch in the temporary directory."""
        batches = []
        current_batch = {}
        current_size = 0
        batch_counter = 0

        # First pass to determine total_batches
        temp_batches = []
        temp_current_batch = {}
        temp_current_size = 0
        for file_path, content in self.file_contents.items():
            if temp_current_size + len(content) > self.context_size and temp_current_batch:
                temp_batches.append(temp_current_batch)
                temp_current_batch = {}
                temp_current_size = 0
            temp_current_batch[file_path] = content
            temp_current_size += len(content)
        if temp_current_batch:
            temp_batches.append(temp_current_batch)
        total_batches = len(temp_batches)

        for file_path, content in self.file_contents.items():
            # Build the files_to_analyze string for the current batch
            prompt_content = []
            for file_path_in_batch, content_in_batch in current_batch.items():
                relative_path_in_batch = os.path.relpath(file_path_in_batch)
                prompt_content.append(f"""File: `{relative_path_in_batch}`
```
{content_in_batch}
```
""")
            files_to_analyze_str = "\n".join(prompt_content)

            if current_size + len(content) > self.context_size and current_batch:
                batch_prompt_file = os.path.join(temp_dir, f"prompt_{batch_counter}.txt")
                with open(batch_prompt_file, "w") as f:
                    f.write(extractor.get_prompt(files_to_analyze_str))
                batches.append(batch_prompt_file)
                current_batch = {}
                current_size = 0
                batch_counter += 1

            current_batch[file_path] = content
            current_size += len(content)

        if current_batch:
            prompt_content = []
            for file_path_in_batch, content_in_batch in current_batch.items():
                relative_path_in_batch = os.path.relpath(file_path_in_batch)
                prompt_content.append(f"""File: `{relative_path_in_batch}`
```
{content_in_batch}
```
""")
            files_to_analyze_str = "\n".join(prompt_content)

            batch_prompt_file = os.path.join(temp_dir, f"prompt_{batch_counter}.txt")
            with open(batch_prompt_file, "w") as f:
                f.write(extractor.get_prompt(files_to_analyze_str))
            batches.append(batch_prompt_file)

        return batches

        return batches

    def _read_files(self, files):
        for file_path in files:
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    if len(content) > 100000 or len(content) == 0:
                        if self.debug:
                            print(f"Skipping {file_path} due to size ({len(content)} characters).")
                        continue
                    self.file_contents[file_path] = content
            except Exception as e:
                print(f"Error reading {file_path}: {e}")

    def _collect_files(self):
        collector = FileCollector(root_path=".", skip_patterns=self.skip_patterns)
        if self.file_list:
            return collector.collect_from_list(self.file_list)
        else:
            return collector.collect_from_directory(".")