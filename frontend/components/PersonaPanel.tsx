"use client";

import { motion } from "framer-motion";
import { PersonaModeId, PERSONA_MODES } from "@/lib/chat";

type PersonaMode = (typeof PERSONA_MODES)[PersonaModeId];
type StageStatus = "Idle" | "Thinking" | "Speaking";

export function PersonaPanel({ mode, status }: { mode: PersonaMode; status: StageStatus }) {
  const active = status === "Speaking" || status === "Thinking";

  return (
    <div className="relative flex min-h-[30rem] flex-col items-center justify-center overflow-hidden border-b border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(0,0,0,0.22)),linear-gradient(90deg,rgba(255,255,255,0.09),transparent)] px-6 py-8 lg:min-h-[42rem] lg:border-b-0 lg:border-r">
      <div className="absolute left-6 top-5 text-xs uppercase tracking-[0.28em] text-slate-300/50">Generic Persona</div>
      <div className="absolute right-6 top-5 rounded-full border border-emerald-200/20 bg-emerald-200/10 px-3 py-1 text-xs text-emerald-100/80">
        {status}
      </div>
      <motion.div
        className="relative h-[22rem] w-full max-w-[25rem]"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: active ? 1.015 : 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={`absolute inset-x-8 bottom-2 h-24 rounded-[50%] bg-white/10 blur-3xl transition ${active ? "opacity-90" : "opacity-45"}`} />
        <div className="absolute left-1/2 top-12 h-32 w-32 -translate-x-1/2 rounded-full bg-gradient-to-b from-slate-100 to-cyan-500 shadow-[0_26px_90px_rgba(255,255,255,0.18)]" />
        <div className="absolute left-1/2 top-[8.75rem] h-48 w-64 -translate-x-1/2 rounded-t-[7rem] bg-gradient-to-b from-black via-zinc-950 to-zinc-900 shadow-[0_45px_110px_rgba(0,0,0,0.65)]" />
        <div className="absolute left-1/2 top-[6.75rem] h-6 w-16 -translate-x-1/2 rounded-full bg-black/20 blur-md" />
        <div className="absolute left-1/2 top-[17rem] h-px w-56 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className={`absolute left-1/2 top-[3.1rem] h-40 w-40 -translate-x-1/2 rounded-full border transition ${active ? "border-white/25 shadow-[0_0_70px_rgba(255,255,255,0.18)]" : "border-white/10"}`} />
      </motion.div>
      <div className="absolute bottom-6 left-6 right-6 rounded-[1.25rem] border border-white/10 bg-black/24 px-5 py-4 backdrop-blur-2xl">
        <div className="text-2xl font-semibold text-white">Digital Persona</div>
        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-300/60">{mode.status}</div>
      </div>
    </div>
  );
}
