export type PersonaModeId = "voice_en" | "text_zh" | "research";

export type SourceItem = {
  source_id?: string;
  title?: string;
  url?: string;
  score?: number;
  source_type?: string;
  notes?: string;
};

export type ChatRequest = {
  message: string;
  perspective: "persona_first_person" | "research_third_person";
  include_sources: boolean;
  output_language: "zh" | "en";
  answer_length: "short" | "medium";
  output_mode: "text";
};

export type ChatResponse = {
  answer: string;
  answer_en?: string;
  subtitle_zh?: string;
  subtitle_segments?: SubtitleSegment[];
  question_type: string;
  collections: string[];
  perspective: string;
  sources: SourceItem[];
  warnings: string[];
};

export type SubtitleSegment = {
  text?: string;
  text_en?: string;
  answer_en?: string;
  en?: string;
  subtitle?: string;
  subtitle_zh?: string;
  text_zh?: string;
  zh?: string;
  duration?: number;
  duration_ms?: number;
};

export const PERSONA_MODES: Record<
  PersonaModeId,
  {
    label: string;
    eyebrow: string;
    description: string;
    status: string;
    request: Omit<ChatRequest, "message" | "include_sources">;
    placeholder: string;
  }
> = {
  voice_en: {
    label: "Voice EN",
    eyebrow: "Default",
    description: "English speech, compact answer, optional subtitle placeholder.",
    status: "Voice-first persona",
    request: {
      perspective: "persona_first_person",
      output_language: "en",
      answer_length: "short",
      output_mode: "text"
    },
    placeholder: "Ask the persona: What should this product focus on?"
  },
  text_zh: {
    label: "Text ZH",
    eyebrow: "Text",
    description: "First-person persona response mode for localization testing.",
    status: "First-person persona mode",
    request: {
      perspective: "persona_first_person",
      output_language: "zh",
      answer_length: "medium",
      output_mode: "text"
    },
    placeholder: "Ask a localized persona question."
  },
  research: {
    label: "Research",
    eyebrow: "Grounded",
    description: "Third-person mode for source-backed claims and caveats.",
    status: "Research third-person mode",
    request: {
      perspective: "research_third_person",
      output_language: "zh",
      answer_length: "medium",
      output_mode: "text"
    },
    placeholder: "Ask which sources support a claim."
  }
};

export async function sendChatMessage(message: string, mode: PersonaModeId): Promise<ChatResponse> {
  const selectedMode = PERSONA_MODES[mode];
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message,
      include_sources: true,
      ...selectedMode.request
    } satisfies ChatRequest)
  });

  const payload = (await response.json().catch(() => null)) as ChatResponse | { error?: string } | null;
  if (!response.ok) {
    throw new Error(payload && "error" in payload && payload.error ? payload.error : "The persona service is unavailable right now.");
  }
  return payload as ChatResponse;
}
