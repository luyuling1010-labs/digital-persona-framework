from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
EXAMPLE = ROOT / "examples" / "toy_persona" / "persona_notes.md"


def main() -> None:
    if not EXAMPLE.exists():
        raise SystemExit(f"Missing sample persona notes: {EXAMPLE}")
    print("Demo index placeholder")
    print("The default framework reads markdown directly.")
    print("Replace this script with your vector DB indexing logic when needed.")


if __name__ == "__main__":
    main()
