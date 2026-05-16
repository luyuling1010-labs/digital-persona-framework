import { NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type BackendSource = {
  source_id?: string;
  title?: string;
  url?: string;
  score?: number;
  source_type?: string;
  notes?: string;
};

type BackendSubtitleSegment = {
  text?: unknown;
  text_en?: unknown;
  answer_en?: unknown;
  en?: unknown;
  subtitle?: unknown;
  subtitle_zh?: unknown;
  text_zh?: unknown;
  zh?: unknown;
  duration?: unknown;
  duration_ms?: unknown;
};

function sanitizeSource(source: BackendSource) {
  return {
    source_id: source.source_id || "",
    title: source.title || "",
    url: source.url || "",
    score: typeof source.score === "number" ? source.score : 0,
    source_type: source.source_type || "",
    notes: source.notes || ""
  };
}

function stringField(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberField(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function sanitizeSubtitleSegment(segment: BackendSubtitleSegment) {
  return {
    text: stringField(segment.text),
    text_en: stringField(segment.text_en),
    answer_en: stringField(segment.answer_en),
    en: stringField(segment.en),
    subtitle: stringField(segment.subtitle),
    subtitle_zh: stringField(segment.subtitle_zh),
    text_zh: stringField(segment.text_zh),
    zh: stringField(segment.zh),
    duration: numberField(segment.duration),
    duration_ms: numberField(segment.duration_ms)
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) {
      return NextResponse.json({ error: "Ask a question first." }, { status: 400 });
    }

    const backendResponse = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        perspective: body.perspective,
        include_sources: true,
        output_language: body.output_language,
        answer_length: body.answer_length,
        output_mode: body.output_mode
      })
    });

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: "The persona service is not ready. Start the FastAPI backend and try again." },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json({
      answer: String(data.answer || ""),
      answer_en: typeof data.answer_en === "string" ? data.answer_en : undefined,
      subtitle_zh: typeof data.subtitle_zh === "string" ? data.subtitle_zh : undefined,
      subtitle_segments: Array.isArray(data.subtitle_segments)
        ? data.subtitle_segments.map(sanitizeSubtitleSegment)
        : undefined,
      question_type: String(data.question_type || ""),
      collections: Array.isArray(data.collections) ? data.collections.map(String) : [],
      perspective: String(data.perspective || ""),
      sources: Array.isArray(data.sources) ? data.sources.map(sanitizeSource) : [],
      warnings: Array.isArray(data.warnings) ? data.warnings.map(String) : []
    });
  } catch {
    return NextResponse.json(
      { error: "The persona service is offline. Check NEXT_PUBLIC_API_BASE_URL and the FastAPI server." },
      { status: 503 }
    );
  }
}
