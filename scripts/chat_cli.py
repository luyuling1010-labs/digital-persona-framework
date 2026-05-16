from __future__ import annotations

import argparse

from backend.chat_pipeline import run_chat


def main() -> None:
    parser = argparse.ArgumentParser(description="Generic persona chat CLI")
    parser.add_argument("message", help="User message")
    parser.add_argument("--language", choices=["auto", "zh", "en"], default="auto")
    parser.add_argument("--perspective", choices=["persona_first_person", "research_third_person"], default="persona_first_person")
    args = parser.parse_args()

    result = run_chat(
        message=args.message,
        output_language=args.language,
        perspective=args.perspective,
    )
    print(result["answer"])
    if result["warnings"]:
        print("\nWarnings:")
        for warning in result["warnings"]:
            print(f"- {warning}")


if __name__ == "__main__":
    main()
