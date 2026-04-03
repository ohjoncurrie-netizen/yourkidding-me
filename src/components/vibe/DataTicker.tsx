"use client";

import { useVibeStore } from "@/store/vibeStore";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const TICKER_ITEMS = [
  { label: "REACT", value: "+4.2%", up: true },
  { label: "NODE", value: "+1.8%", up: true },
  { label: "POSTGRES", value: "+0.3%", up: true },
  { label: "PYTHON", value: "-0.7%", up: false },
  { label: "TYPESCRIPT", value: "+6.1%", up: true },
  { label: "NEXT.JS", value: "+9.4%", up: true },
  { label: "BUGS_FIXED", value: "∞", up: true },
  { label: "COFFEE_LVL", value: "-88%", up: false },
  { label: "SLEEP", value: "-62%", up: false },
  { label: "SHIPPING", value: "+420%", up: true },
];

function useFlicker(active: boolean) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setVal(Math.random()), 1800);
    return () => clearInterval(id);
  }, [active]);
  return val;
}

function TickerItem({ label, value, up }: (typeof TICKER_ITEMS)[0]) {
  const flicker = useFlicker(true);
  const jitter = (Math.sin(flicker * 100) * 0.3).toFixed(1);
  const displayValue = flicker > 0.85 ? `${(parseFloat(value) + parseFloat(jitter)).toFixed(1)}%` : value;

  return (
    <span className="inline-flex items-center gap-1 mx-6 text-xs tracking-widest whitespace-nowrap">
      <span style={{ color: "var(--accent2)" }}>{label}</span>
      <span style={{ color: up ? "var(--accent)" : "#ff4444" }}>
        {up ? "▲" : "▼"} {displayValue}
      </span>
    </span>
  );
}

export default function DataTicker() {
  const { vibe } = useVibeStore();

  return (
    <AnimatePresence>
      {vibe === "data" && (
        <motion.div
          key="ticker"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4 }}
          className="fixed top-0 left-0 right-0 z-40 overflow-hidden border-b"
          style={{
            background: "rgba(0,13,26,0.95)",
            borderColor: "var(--accent2)",
            backdropFilter: "blur(8px)",
          }}
        >
          <motion.div
            className="flex py-1"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          >
            {/* doubled for seamless loop */}
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <TickerItem key={i} {...item} />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
