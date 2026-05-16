"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowUp,
  Loader2,
  Mic2,
  RotateCcw,
  Sparkles,
  Square,
  Volume2
} from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ChatResponse,
  PERSONA_MODES,
  PersonaModeId,
  SourceItem,
  SubtitleSegment,
  sendChatMessage
} from "@/lib/chat";
import { DisclosurePanel } from "@/components/DisclosurePanel";
import { ModeSelector } from "@/components/ModeSelector";
import { PersonaPanel } from "@/components/PersonaPanel";

type StageStatus = "Idle" | "Thinking" | "Speaking";

type DisplaySegment = {
  en: string;
  zh: string;
  durationMs: number;
};

type DisplayResponse = {
  answer: string;
  voiceText: string;
  segments: DisplaySegment[];
  sources: SourceItem[];
  warnings: string[];
  mode: PersonaModeId;
  modeLabel: string;
};

const fallbackLine = "Ask a hard question. The answer should be simple enough to say out loud.";
const missingEnglishVoiceText = "No English speech text is available for this response.";

export function DemoShell() {
  const [mode, setMode] = useState<PersonaModeId>("voice_en");
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<StageStatus>("Idle");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const [lastResponse, setLastResponse] = useState<DisplayResponse | null>(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [askedQuestion, setAskedQuestion] = useState("");
  const timersRef = useRef<number[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const stoppingRef = useRef(false);

  const selectedMode = PERSONA_MODES[mode];
  const isVoiceMode = mode === "voice_en";
  const currentSegment = lastResponse?.segments[currentSegmentIndex];

  useEffect(() => {
    setSpeechSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      stopSpeech(false);
    };
  }, []);

  const stageCopy = useMemo(() => {
    if (status === "Thinking") {
      return {
        zh: "Thinking...",
        en: "Preparing a grounded persona response."
      };
    }

    if (isVoiceMode) {
      return {
        zh: currentSegment?.zh || currentSegment?.en || (lastResponse ? "" : fallbackLine),
        en: currentSegment?.zh && currentSegment?.en ? currentSegment.en : ""
      };
    }

    return {
      zh: currentSegment?.zh || currentSegment?.en || "Ready for a question",
      en: currentSegment?.en && currentSegment?.zh ? currentSegment.en : selectedMode.status
    };
  }, [currentSegment, isVoiceMode, lastResponse, selectedMode.status, status]);

  async function submitMessage(event?: FormEvent) {
    event?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) {
      return;
    }

    stopSpeech(false);
    setError("");
    setInput("");
    setAskedQuestion(trimmed);
    setLastResponse(null);
    setIsLoading(true);
    setStatus("Thinking");
    setCurrentSegmentIndex(0);
    const requestMode = mode;
    const requestIsVoice = requestMode === "voice_en";

    try {
      const response = await sendChatMessage(trimmed, requestMode);
      const display = buildDisplayResponse(response, requestMode);
      setLastResponse(display);
      setCurrentSegmentIndex(0);

      if (requestIsVoice) {
        speak(display);
      } else {
        setStatus("Idle");
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "The persona service is unavailable right now.";
      setError(message);
      setStatus("Idle");
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitMessage();
    }
  }

  function handleModeChange(nextMode: PersonaModeId) {
    stopSpeech(false);
    setMode(nextMode);
    setStatus("Idle");
    setCurrentSegmentIndex(0);
  }

  function clearSubtitleTimers() {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }

  function startSubtitleTimeline(segments: DisplaySegment[]) {
    clearSubtitleTimers();
    setCurrentSegmentIndex(0);
    let elapsed = 0;

    segments.forEach((segment, index) => {
      if (index === 0) {
        return;
      }
      elapsed += segments[index - 1]?.durationMs || segment.durationMs;
      const timer = window.setTimeout(() => {
        setCurrentSegmentIndex(index);
      }, elapsed);
      timersRef.current.push(timer);
    });
  }

  function stopSpeech(resetToIdle = true) {
    clearSubtitleTimers();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      stoppingRef.current = true;
      window.speechSynthesis.cancel();
      window.setTimeout(() => {
        stoppingRef.current = false;
      }, 250);
    }
    utteranceRef.current = null;
    if (resetToIdle) {
      setStatus("Idle");
    }
  }

  function speak(display = lastResponse) {
    if (!display || !display.voiceText.trim()) {
      if (isVoiceMode) {
        setError(missingEnglishVoiceText);
      }
      setStatus("Idle");
      return;
    }

    if (!speechSupported || typeof window === "undefined" || !("speechSynthesis" in window)) {
      setError("This browser does not support Web Speech API playback. The transcript is still available below.");
      setStatus("Idle");
      return;
    }

    stopSpeech(false);
    const utterance = new SpeechSynthesisUtterance(display.voiceText);
    utterance.lang = "en-US";
    utterance.rate = 0.92;
    utterance.pitch = 0.88;
    utterance.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    utterance.voice =
      voices.find((voice) => /en-US/i.test(voice.lang) && /daniel|alex|samantha|david|mark/i.test(voice.name)) ||
      voices.find((voice) => /^en/i.test(voice.lang)) ||
      null;

    utterance.onstart = () => {
      setStatus("Speaking");
      startSubtitleTimeline(display.segments);
    };
    utterance.onend = () => {
      clearSubtitleTimers();
      setStatus("Idle");
    };
    utterance.onerror = () => {
      clearSubtitleTimers();
      setStatus("Idle");
      if (!stoppingRef.current) {
        setError("Speech playback stopped. You can replay it or read the transcript below.");
      }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-5 text-stone-50 sm:px-6 lg:px-8">
      <div className="subtle-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="stage-ambient pointer-events-none absolute inset-0" />

      <motion.section
        className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-7xl flex-col gap-5"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-slate-200/70">
              <Sparkles className="h-3.5 w-3.5" />
              Persona Framework Demo
            </div>
            <h1 className="font-display text-4xl leading-none text-white sm:text-6xl">
              Voice-first digital persona.
            </h1>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-black/24 px-4 py-2 text-sm text-slate-200/76 sm:self-auto">
            <span className={`h-2 w-2 rounded-full ${status === "Speaking" ? "bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.75)]" : status === "Thinking" ? "bg-amber-200 shadow-[0_0_18px_rgba(253,230,138,0.62)]" : "bg-slate-300/70"}`} />
            {status}
          </div>
        </header>

        <section className="stage-shell grid flex-1 overflow-hidden rounded-[2rem] lg:grid-cols-[minmax(18rem,26rem)_minmax(0,1fr)_21rem]">
          <PersonaPanel mode={selectedMode} status={status} />

          <div className="stage-center flex min-h-[34rem] flex-col justify-between px-5 py-6 sm:px-8 lg:min-h-[42rem]">
            <div className="min-h-[19rem]">
              {askedQuestion ? (
                <div className="mb-8 text-sm leading-6 text-slate-300/56">
                  <span className="text-slate-100/80">Question</span> / {askedQuestion}
                </div>
              ) : null}

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${status}-${currentSegmentIndex}-${stageCopy.zh}-${stageCopy.en}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="subtitle-focus"
                >
                  <div className="min-h-[9rem] max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-6xl">
                    {stageCopy.zh || " "}
                  </div>
                  <div className="mt-6 max-w-3xl text-base leading-7 text-slate-300/72 sm:text-xl">
                    {stageCopy.en}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-300/62">
                <Mic2 className="h-4 w-4" />
                {isVoiceMode ? "Voice EN via Web Speech API" : selectedMode.label}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => speak()}
                  disabled={!lastResponse || !isVoiceMode || isLoading}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-white/12 bg-white/[0.08] px-4 text-sm text-white transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:text-white/35"
                >
                  <RotateCcw className="h-4 w-4" />
                  Replay
                </button>
                <button
                  type="button"
                  onClick={() => stopSpeech()}
                  disabled={status !== "Speaking"}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-white/12 bg-white/[0.08] px-4 text-sm text-white transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:text-white/35"
                >
                  <Square className="h-4 w-4" />
                  Stop
                </button>
              </div>
            </div>
          </div>

          <aside className="stage-console flex flex-col gap-5 p-5">
            <ModeSelector activeMode={mode} onChange={handleModeChange} />
            <form onSubmit={submitMessage} className="rounded-[1.25rem] border border-white/10 bg-black/20 p-2 transition focus-within:border-slate-200/30 focus-within:bg-white/[0.07]">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedMode.placeholder}
                rows={5}
                className="max-h-44 min-h-32 w-full resize-none bg-transparent px-4 py-3 text-base leading-7 text-white outline-none placeholder:text-slate-300/38"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                Send
              </button>
            </form>

            {error || !speechSupported ? (
              <div className="flex items-start gap-3 rounded-[1.25rem] border border-amber-200/20 bg-amber-100/10 px-4 py-3 text-sm leading-6 text-amber-100">
                <AlertCircle className="mt-1 h-4 w-4 flex-none" />
                <span>{error || "This browser does not support Web Speech API playback."}</span>
              </div>
            ) : null}

            <ResponseMeta response={lastResponse} />
          </aside>
        </section>
      </motion.section>
    </main>
  );
}

function ResponseMeta({ response }: { response: DisplayResponse | null }) {
  if (!response) {
    return (
      <div className="rounded-[1.25rem] border border-white/10 bg-black/18 p-4 text-sm leading-6 text-slate-300/54">
        <Volume2 className="mb-3 h-4 w-4" />
        Voice EN is the default. Sources, warnings, and full transcript appear here after the first answer.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <DisclosurePanel title="Transcript / Full answer">
        <div className="whitespace-pre-wrap text-sm leading-7 text-slate-100/82">{response.answer}</div>
      </DisclosurePanel>

      <DisclosurePanel title={`Sources ${response.sources.length ? `(${response.sources.length})` : ""}`}>
        {response.sources.length ? (
          <div className="space-y-3">
            {response.sources.map((source, index) => (
              <div key={`${source.source_id || source.url || "source"}-${index}`} className="rounded-2xl border border-white/10 bg-black/18 p-3">
                <div className="text-sm font-medium text-slate-100">
                  {source.title || source.url || `Source ${index + 1}`}
                </div>
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block break-all text-xs text-sky-200/80 hover:text-sky-100"
                  >
                    {source.url}
                  </a>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2 text-[0.7rem] uppercase tracking-[0.16em] text-slate-300/50">
                  {typeof source.score === "number" ? <span>Score {source.score}</span> : null}
                  {source.source_type ? <span>{source.source_type}</span> : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-300/60">No sources returned for this answer.</p>
        )}
      </DisclosurePanel>

      <DisclosurePanel title={`Warnings ${response.warnings.length ? `(${response.warnings.length})` : ""}`}>
        {response.warnings.length ? (
          <ul className="space-y-2 text-sm text-amber-100/80">
            {response.warnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-300/60">No warnings returned.</p>
        )}
      </DisclosurePanel>
    </div>
  );
}

function buildDisplayResponse(response: ChatResponse, mode: PersonaModeId): DisplayResponse {
  const voiceText = mode === "voice_en" ? selectEnglishVoiceText(response) : "";
  const segments = buildSegments(response, mode);
  const answer = buildTranscript(response, mode, voiceText);

  return {
    answer,
    voiceText,
    segments: segments.length
      ? segments
      : [
          {
            en: voiceText,
            zh: mode === "voice_en" && voiceText ? "" : answer,
            durationMs: estimateDuration(voiceText || answer)
          }
        ],
    sources: response.sources || [],
    warnings: response.warnings || [],
    mode,
    modeLabel: PERSONA_MODES[mode].label
  };
}

function buildSegments(response: ChatResponse, mode: PersonaModeId): DisplaySegment[] {
  if (mode === "voice_en") {
    return buildVoiceSegments(response);
  }

  const lines = splitChineseSentences(response.answer);
  return lines.map((line) => ({
    en: "",
    zh: line,
    durationMs: estimateDuration(line)
  }));
}

function buildVoiceSegments(response: ChatResponse): DisplaySegment[] {
  if (Array.isArray(response.subtitle_segments) && response.subtitle_segments.length) {
    const normalized = response.subtitle_segments
      .map(normalizeSubtitleSegment)
      .filter((segment) => segment.en || segment.zh);

    return expandSubtitleSegments(normalized);
  }

  const english = splitEnglishSentences(selectEnglishVoiceText(response));
  const chinese = splitChineseSentences(selectChineseSubtitleText(response));
  const segmentCount = Math.max(english.length, chinese.length);

  return Array.from({ length: segmentCount }, (_, index) => ({
    en: english[index] || "",
    zh: chinese[index] || "",
    durationMs: estimateDuration(english[index] || chinese[index] || "")
  }));
}

function normalizeSubtitleSegment(segment: SubtitleSegment): DisplaySegment {
  const rawEn = firstText(segment.answer_en, segment.text_en, segment.en, segment.text);
  const rawZh = firstText(segment.subtitle_zh, segment.text_zh, segment.zh, segment.subtitle);
  const en = isEnglishSpeechText(rawEn) ? rawEn : "";
  const zh = isChineseSubtitleText(rawZh) ? rawZh : "";
  const durationMs =
    typeof segment.duration_ms === "number"
      ? segment.duration_ms
      : typeof segment.duration === "number"
        ? segment.duration * 1000
        : estimateDuration(en || zh);

  return {
    en,
    zh,
    durationMs: clamp(durationMs, 1400, 7000)
  };
}

function expandSubtitleSegments(segments: DisplaySegment[]) {
  return segments.flatMap((segment) => {
    const english = splitEnglishSentences(segment.en);
    const chinese = splitChineseSentences(segment.zh);
    if (english.length <= 1 && chinese.length <= 1) {
      return [segment];
    }

    const segmentCount = Math.max(english.length, chinese.length);
    return Array.from({ length: segmentCount }, (_, index) => {
      const en = english[index] || "";
      const zh = chinese[index] || "";
      return {
        en,
        zh,
        durationMs: estimateDuration(en || zh)
      };
    });
  });
}

function firstText(...values: Array<string | undefined>) {
  return values.find((value) => value && value.trim())?.trim() || "";
}

function selectEnglishVoiceText(response: ChatResponse) {
  const answerEn = response.answer_en?.trim() || "";
  return isEnglishSpeechText(answerEn) ? answerEn : "";
}

function selectChineseSubtitleText(response: ChatResponse) {
  const subtitleZh = response.subtitle_zh?.trim() || "";
  return isChineseSubtitleText(subtitleZh) ? subtitleZh : "";
}

function buildTranscript(response: ChatResponse, mode: PersonaModeId, voiceText: string) {
  if (mode !== "voice_en") {
    return response.answer || response.answer_en || voiceText;
  }

  const parts: string[] = [];
  const subtitleZh = selectChineseSubtitleText(response);
  const answer = response.answer?.trim() || "";

  if (subtitleZh) {
    parts.push(`Chinese subtitles\n${subtitleZh}`);
  }
  if (voiceText) {
    parts.push(`English speech\n${voiceText}`);
  }
  if (answer && answer !== subtitleZh && answer !== voiceText) {
    parts.push(`Full answer\n${answer}`);
  }

  return parts.join("\n\n") || answer || response.answer_en || voiceText;
}

function isEnglishSpeechText(text: string) {
  if (!text) {
    return false;
  }

  return /[A-Za-z]/.test(text) && !/[\u3400-\u9fff\uf900-\ufaff]/.test(text);
}

function isChineseSubtitleText(text: string) {
  return /[\u3400-\u9fff\uf900-\ufaff]/.test(text || "");
}

function splitEnglishSentences(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized || !isEnglishSpeechText(normalized)) {
    return [];
  }

  return normalized.match(/[^.!?]+[.!?]?/g)?.map((part) => part.trim()).filter(Boolean) || [normalized];
}

function splitChineseSentences(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized || !isChineseSubtitleText(normalized)) {
    return [];
  }

  return normalized.match(/[^\u3002\uff01\uff1f]+[\u3002\uff01\uff1f]?/g)?.map((part) => part.trim()).filter(Boolean) || [normalized];
}

function estimateDuration(text: string) {
  const words = text.split(/\s+/).filter(Boolean).length;
  const chars = text.replace(/\s/g, "").length;
  const base = words ? words * 430 : chars * 120;
  return clamp(base + 850, 1600, 6500);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
