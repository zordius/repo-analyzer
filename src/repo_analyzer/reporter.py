class ReportGenerator:
    def __init__(self, output_dir="."):
        self.output_dir = output_dir

    def write_report(self, filename, content):
        path = f"{self.output_dir}/{filename}"
        print(f"Writing report to {path}")
        with open(path, "w") as f:
            f.write(content)
