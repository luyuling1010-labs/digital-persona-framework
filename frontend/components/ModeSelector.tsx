"use client";

import { motion } from "framer-motion";
import { PERSONA_MODES, PersonaModeId } from "@/lib/chat";

const modeOrder: PersonaModeId[] = ["voice_en", "text_zh", "research"];

export function ModeSelector({
  activeMode,
  onChange
}: {
  activeMode: PersonaModeId;
  onChange: (mode: PersonaModeId) => void;
}) {
  return (
    <div>
      <div className="mb-3 text-xs uppercase tracking-[0.24em] text-slate-300/50">Persona mode</div>
      <div className="space-y-2">
        {modeOrder.map((mode) => {
          const item = PERSONA_MODES[mode];
          const active = activeMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onChange(mode)}
              className={`relative w-full overflow-hidden rounded-[1.1rem] border px-4 py-3 text-left transition ${
                active
                  ? "border-white/20 bg-white/[0.12] text-white"
                  : "border-white/10 bg-white/[0.045] text-slate-300/75 hover:border-white/20 hover:bg-white/[0.07]"
              }`}
            >
              {active ? (
                <motion.span
                  layoutId="active-mode"
                  className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"
                  transition={{ duration: 0.28 }}
                />
              ) : null}
              <span className="relative block text-[0.68rem] uppercase tracking-[0.22em] text-slate-300/60">
                {item.eyebrow}
              </span>
              <span className="relative mt-1 block text-sm font-medium">{item.label}</span>
              <span className="relative mt-1 block text-xs leading-5 text-slate-300/60">{item.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
