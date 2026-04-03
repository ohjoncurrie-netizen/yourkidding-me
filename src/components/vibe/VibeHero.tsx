"use client";

import { useVibeStore } from "@/store/vibeStore";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const NAMES: Record<string, string[]> = {
  corporate: ["Jon Currie"],
  data: ["Jon Currie", "FULL_STACK_DEV", "SYSTEM_ONLINE"],
  chaos: ["Jon Currie", "ur kidding me", "srsly tho hire me", "no cap fr fr"],
};

function GlitchText({ text }: { text: string }) {
  const [glitching, setGlitching] = useState(false);
  const [glitchText, setGlitchText] = useState(text);

  useEffect(() => {
    const chars = "!@#$%^&*<>?/\\|{}[]~`";
    let frame = 0;
    let raf: number;

    function tick() {
      frame++;
      if (frame % 3 === 0) {
        const corrupted = text
          .split("")
          .map((c) =>
            Math.random() < 0.2 ? chars[Math.floor(Math.random() * chars.length)] : c
          )
          .join("");
        setGlitchText(corrupted);
      }
      if (frame < 20) {
        raf = requestAnimationFrame(tick);
      } else {
        setGlitchText(text);
        setGlitching(false);
      }
    }

    const id = setInterval(() => {
      if (!glitching) {
        setGlitching(true);
        frame = 0;
        raf = requestAnimationFrame(tick);
      }
    }, 3000 + Math.random() * 2000);

    return () => {
      clearInterval(id);
      cancelAnimationFrame(raf);
    };
  }, [text, glitching]);

  return (
    <span
      className="relative"
      style={{
        textShadow: glitching
          ? "2px 0 #ffe600, -2px 0 #00f5d4"
          : "none",
        transition: "text-shadow 0.1s",
      }}
    >
      {glitchText}
      {/* glitch slice overlay */}
      {glitching && (
        <span
          className="absolute inset-0 overflow-hidden"
          style={{
            clipPath: "inset(40% 0 50% 0)",
            transform: "translateX(4px)",
            color: "#ffe600",
            opacity: 0.7,
          }}
        >
          {glitchText}
        </span>
      )}
    </span>
  );
}

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, [text]);

  return (
    <>
      {displayed}
      {displayed.length < text.length && (
        <span className="cursor-blink" style={{ color: "var(--accent)" }}>▊</span>
      )}
    </>
  );
}

function CyclingText({ texts }: { texts: string[] }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % texts.length), 2200);
    return () => clearInterval(id);
  }, [texts]);
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={idx}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.25 }}
      >
        <TypewriterText text={texts[idx]} />
      </motion.span>
    </AnimatePresence>
  );
}

interface Props {
  name: string;
  subtitle: string;
  githubStatus: React.ReactNode;
  stats: React.ReactNode;
}

export default function VibeHero({ name, subtitle, githubStatus, stats }: Props) {
  const { vibe } = useVibeStore();

  return (
    <section className="mb-24 pt-8 relative">
      <motion.p
        className="text-xs tracking-[0.3em] uppercase mb-3 opacity-50"
        layout
      >
        yourkidding.me
      </motion.p>

      <h1
        className="text-5xl md:text-7xl font-bold leading-none mb-4"
        style={{ color: "var(--accent)" }}
      >
        <AnimatePresence mode="wait">
          {vibe === "corporate" && (
            <motion.span
              key="corp"
              initial={{ opacity: 0, filter: "blur(8px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(8px)" }}
              transition={{ duration: 0.5 }}
              className="block"
            >
              {name}
            </motion.span>
          )}

          {vibe === "data" && (
            <motion.span
              key="data"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="block font-mono"
            >
              <CyclingText texts={NAMES.data} />
            </motion.span>
          )}

          {vibe === "chaos" && (
            <motion.span
              key="chaos"
              initial={{ opacity: 0, scale: 1.2 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
              className="block"
            >
              <GlitchText text={name} />
            </motion.span>
          )}
        </AnimatePresence>
      </h1>

      <motion.p
        className="text-lg opacity-60 max-w-xl"
        layout
        transition={{ duration: 0.4 }}
      >
        {subtitle} {githubStatus}
      </motion.p>

      <motion.div className="flex gap-6 mt-6 text-sm opacity-50" layout>
        {stats}
      </motion.div>
    </section>
  );
}
