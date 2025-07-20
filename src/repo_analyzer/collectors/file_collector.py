import os
import fnmatch

class FileCollector:
    def __init__(self, root_path=".", skip_patterns=None):
        self.root_path = os.path.abspath(root_path)
        # Define directories to ignore relative to the root path
        self.ignore_dirs_relative = {
            "__pycache__", "node_modules", "build", "dist",
            ".vscode", ".idea", "venv", "repo_analyzer.egg-info",
            "src/repo_analyzer.egg-info",
            # Specific git subdirectories to ignore
            ".git/logs", ".git/objects", ".git/info", ".git/refs"
        }
        # Convert to absolute paths
        self.ignore_dirs = {os.path.join(self.root_path, d) for d in self.ignore_dirs_relative}
        

        self.ignore_exts = {
            ".pyc", ".pyo", ".pyd", ".so", ".o", ".dll", ".exe",
            ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff",
            ".zip", ".tar", ".gz", ".rar",
            ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
            ".pb"
        }

        # Default and user-provided glob patterns to ignore
        self.ignore_patterns = [
            os.path.join(self.root_path, ".git/hooks/*.sample"),
            os.path.join(self.root_path, ".git/config"),
            os.path.join(self.root_path, ".git/HEAD"),
            os.path.join(self.root_path, ".git/description"),
            os.path.join(self.root_path, ".git/index"),
            os.path.join(self.root_path, ".git/packed-refs"),
            os.path.join(self.root_path, ".git/COMMIT_EDITMSG"),
            os.path.join(self.root_path, ".git/FETCH_HEAD"),
        ]
        if skip_patterns:
            self.ignore_patterns.extend([os.path.join(self.root_path, p) for p in skip_patterns])

    def _is_ignored(self, path):
        # Check against ignored extensions
        if os.path.splitext(path)[1] in self.ignore_exts:
            return True
        # Check against glob patterns
        for pattern in self.ignore_patterns:
            if fnmatch.fnmatch(path, pattern):
                return True
        return False

    def collect_from_list(self, file_path):
        """Reads a file containing a list of file paths and returns them."""
        print(f"Collecting files from list: {file_path}")
        try:
            with open(file_path, "r") as f:
                paths = [os.path.join(self.root_path, line.strip()) for line in f if line.strip()]
                return [p for p in paths if not self._is_ignored(p)]
        except FileNotFoundError:
            print(f"Error: File list not found at {file_path}")
            return []

    def collect_from_directory(self, directory):
        """Recursively collects files from a directory, respecting ignore rules."""
        print(f"Collecting files from directory: {directory}")
        collected_files = []
        start_path = os.path.abspath(directory)

        for root, dirs, files in os.walk(start_path, topdown=True):
            # Filter directories to ignore in-place
            dirs[:] = [d for d in dirs if os.path.join(root, d) not in self.ignore_dirs]

            for file in files:
                file_path = os.path.join(root, file)
                if not self._is_ignored(file_path):
                    collected_files.append(file_path)

        return collected_files