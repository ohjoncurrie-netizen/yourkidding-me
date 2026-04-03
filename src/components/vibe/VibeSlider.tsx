"use client";

import { useVibeStore, Vibe } from "@/store/vibeStore";
import { motion } from "framer-motion";
import { useEffect } from "react";

const LABELS: Record<Vibe, string> = {
  corporate: "Corporate",
  data: "Data",
  chaos: "Chaos",
};

const DESCRIPTIONS: Record<Vibe, string> = {
  corporate: "Clean. Minimal. Professional.",
  data: "Bloomberg terminal energy.",
  chaos: "Full send. No rules.",
};

export default function VibeSlider() {
  const { vibeIndex, vibe, setVibeIndex } = useVibeStore();

  useEffect(() => {
    document.documentElement.setAttribute("data-vibe", vibe);
  }, [vibe]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
      <motion.p
        key={vibe}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs tracking-widest uppercase"
        style={{ color: "var(--accent2)" }}
      >
        {DESCRIPTIONS[vibe]}
      </motion.p>

      <div
        className="flex items-center gap-3 px-4 py-2 rounded-full border backdrop-blur-md"
        style={{ borderColor: "var(--accent2)", background: "var(--glow)" }}
      >
        <span className="text-[10px] tracking-widest uppercase" style={{ color: "var(--accent2)" }}>
          Corporate
        </span>

        <div className="relative w-32 h-6 flex items-center">
          <input
            type="range"
            min={0}
            max={2}
            step={1}
            value={vibeIndex}
            onChange={(e) => setVibeIndex(Number(e.target.value))}
            className="w-full accent-current cursor-pointer"
            style={{ accentColor: "var(--accent)" }}
          />
          {/* tick marks */}
          <div className="absolute inset-x-0 flex justify-between px-[2px] pointer-events-none top-full mt-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full"
                style={{
                  background: i === vibeIndex ? "var(--accent)" : "var(--accent2)",
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>
        </div>

        <span className="text-[10px] tracking-widest uppercase" style={{ color: "var(--accent2)" }}>
          Chaos
        </span>
      </div>

      <motion.p
        key={`label-${vibe}`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-sm font-bold tracking-wider"
        style={{ color: "var(--accent)" }}
      >
        {LABELS[vibe]} Mode
      </motion.p>
    </div>
  );
}
