import os

class PromptBuilder:
    def __init__(self):
        pass

    def _get_language(self, file_path):
        """Determines the language for syntax highlighting based on file extension."""
        ext = os.path.splitext(file_path)[1].lower()
        lang_map = {
            '.py': 'python',
            '.js': 'javascript',
            '.ts': 'typescript',
            '.java': 'java',
            '.go': 'go',
            '.rb': 'ruby',
            '.php': 'php',
            '.cs': 'csharp',
            '.cpp': 'cpp',
            '.c': 'c',
            '.h': 'c',
            '.html': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.less': 'less',
            '.json': 'json',
            '.xml': 'xml',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.md': 'markdown',
            '.sh': 'bash',
            '.bat': 'batch',
            '.ps1': 'powershell',
            '.sql': 'sql',
        }
        return lang_map.get(ext, '')

    def build_files_content(self, file_contents):
        prompt_content = []
        for file_path, content in file_contents.items():
            relative_path = os.path.relpath(file_path)
            # Skip files that are too large or empty
            if len(content) > 100000 or len(content) == 0:
                continue
            language = self._get_language(relative_path)
            prompt_content.append(f"""File: `{relative_path}`
```{
language}
{
content}
```
""")
        
        return "\n".join(prompt_content)
