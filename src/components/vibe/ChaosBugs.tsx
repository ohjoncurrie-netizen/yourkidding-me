"use client";

import { useVibeStore } from "@/store/vibeStore";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { useState, useCallback } from "react";

interface Bug {
  id: number;
  x: number;
  y: number;
  emoji: string;
  size: number;
  vx: number;
  vy: number;
  label: string;
}

const BUG_TYPES = [
  { emoji: "🐛", label: "null ref" },
  { emoji: "🦟", label: "race cond." },
  { emoji: "🕷️", label: "CSS hell" },
  { emoji: "🐞", label: "off-by-one" },
  { emoji: "🦗", label: "mem leak" },
  { emoji: "🪲", label: "prod only" },
];

function makeBug(id: number): Bug {
  const type = BUG_TYPES[id % BUG_TYPES.length];
  return {
    id,
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 70,
    emoji: type.emoji,
    label: type.label,
    size: 28 + Math.random() * 20,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
  };
}

function BugElement({
  bug,
  onPop,
}: {
  bug: Bug;
  onPop: (id: number) => void;
}) {
  const [popped, setPopped] = useState(false);

  function handleClick() {
    setPopped(true);
    setTimeout(() => onPop(bug.id), 300);
  }

  return (
    <motion.div
      className="fixed cursor-pointer select-none flex flex-col items-center gap-0.5 z-30"
      style={{ left: `${bug.x}%`, top: `${bug.y}%` }}
      animate={
        popped
          ? { scale: [1, 1.8, 0], opacity: [1, 1, 0], rotate: [0, 45, 90] }
          : {
              x: [`${bug.vx * 40}px`, `${-bug.vx * 40}px`, `${bug.vx * 40}px`],
              y: [`${bug.vy * 30}px`, `${-bug.vy * 30}px`, `${bug.vy * 30}px`],
              rotate: [0, 15, -15, 0],
            }
      }
      transition={
        popped
          ? { duration: 0.3 }
          : {
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              ease: "easeInOut",
            }
      }
      whileHover={{ scale: 1.3 }}
      onClick={handleClick}
    >
      <span style={{ fontSize: bug.size }}>{bug.emoji}</span>
      <span
        className="text-[9px] font-bold tracking-widest px-1 rounded"
        style={{
          color: "var(--accent)",
          background: "rgba(0,0,0,0.6)",
          whiteSpace: "nowrap",
        }}
      >
        {bug.label}
      </span>
    </motion.div>
  );
}

export default function ChaosBugs() {
  const { vibe } = useVibeStore();
  const [bugs, setBugs] = useState<Bug[]>(() =>
    Array.from({ length: 6 }, (_, i) => makeBug(i))
  );
  const [score, setScore] = useState(0);

  const popBug = useCallback((id: number) => {
    setBugs((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      // respawn a new bug after a delay
      setTimeout(() => {
        setBugs((p) => [...p, makeBug(Date.now())]);
      }, 2000);
      return updated;
    });
    setScore((s) => s + 1);
  }, []);

  return (
    <AnimatePresence>
      {vibe === "chaos" && (
        <>
          {bugs.map((bug) => (
            <BugElement key={bug.id} bug={bug} onPop={popBug} />
          ))}

          {/* Score */}
          <motion.div
            key="score"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-4 right-4 z-50 text-right"
          >
            <p className="text-[10px] tracking-widest uppercase opacity-50">
              bugs squashed
            </p>
            <motion.p
              key={score}
              initial={{ scale: 1.5, color: "#ffe600" }}
              animate={{ scale: 1, color: "var(--accent)" }}
              className="text-3xl font-bold"
            >
              {score}
            </motion.p>
          </motion.div>

          {/* Hint */}
          {score === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 3, delay: 1 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-center pointer-events-none"
            >
              <p
                className="text-lg font-bold tracking-widest"
                style={{ color: "var(--accent2)" }}
              >
                TAP THE BUGS
              </p>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
