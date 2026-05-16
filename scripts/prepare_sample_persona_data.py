from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
EXAMPLE = ROOT / "examples" / "toy_persona" / "persona_notes.md"


def main() -> None:
    if not EXAMPLE.exists():
        raise SystemExit(f"Missing sample persona notes: {EXAMPLE}")
    text = EXAMPLE.read_text(encoding="utf-8")
    sections = [line.strip("# ").strip() for line in text.splitlines() if line.startswith("## ")]
    print(f"Loaded sample persona data from {EXAMPLE}")
    print(f"Sections: {', '.join(sections)}")


if __name__ == "__main__":
    main()
