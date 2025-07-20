import argparse
from .agent import AgentOrchestrator

def main():
    parser = argparse.ArgumentParser(description="Extracts practices and domain knowledge from a project.")
    parser.add_argument("-l", "--list", dest="file_list", help="File containing a list of relative path file names to analyze.")
    parser.add_argument("--level", type=int, default=1, help="The analysis level (1-5).")
    parser.add_argument("--skip", nargs='*', default=[], help="A list of glob patterns to skip during analysis.")
    parser.add_argument("--timeout", type=int, default=60, help="The timeout in seconds for the API call.")
    parser.add_argument("--debug", action="store_true", help="Enable debug mode for verbose output.")
    parser.add_argument("--ai-client", choices=['google-gemini-cli', 'google-generativeai'], default='google-gemini-cli', help="The AI client to use (google-gemini-cli or google-generativeai).")
    parser.add_argument("--context-size", type=int, default=10000, help="The maximum context size for the AI model.")
    parser.add_argument("--prompt-file", help="The path to a file containing the prompt to analyze.")
    parser.add_argument("--instances", type=int, default=2, help="The maximum number of parallel AI analysis instances.")
    args = parser.parse_args()

    agent = AgentOrchestrator(
        level=args.level, 
        file_list=args.file_list, 
        skip_patterns=args.skip, 
        timeout=args.timeout, 
        debug=args.debug, 
        ai_client=args.ai_client, 
        context_size=args.context_size,
        prompt_file=args.prompt_file,
        instances=args.instances
    )
    agent.run()

if __name__ == "__main__":
    main()
