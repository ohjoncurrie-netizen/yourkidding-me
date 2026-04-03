"use client";

import { useVibeStore } from "@/store/vibeStore";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";

/* ── Corporate: subtle dot grid ─────────────────────────── */
function CorporateOverlay() {
  return (
    <motion.div
      key="corporate-bg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(0,0,0,0.12) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    />
  );
}

/* ── Data: Bloomberg-style corner decorations + grid ──── */
function DataOverlay() {
  return (
    <motion.div
      key="data-bg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 pointer-events-none z-0"
    >
      {/* horizontal scan lines — subtle */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,136,0.03) 3px, rgba(0,255,136,0.03) 4px)",
        }}
      />
      {/* corner bracket TL */}
      <div className="absolute top-6 left-6 w-10 h-10 border-t-2 border-l-2" style={{ borderColor: "var(--accent)", opacity: 0.4 }} />
      {/* corner bracket TR */}
      <div className="absolute top-6 right-6 w-10 h-10 border-t-2 border-r-2" style={{ borderColor: "var(--accent)", opacity: 0.4 }} />
      {/* corner bracket BL */}
      <div className="absolute bottom-20 left-6 w-10 h-10 border-b-2 border-l-2" style={{ borderColor: "var(--accent)", opacity: 0.4 }} />
      {/* corner bracket BR */}
      <div className="absolute bottom-20 right-6 w-10 h-10 border-b-2 border-r-2" style={{ borderColor: "var(--accent)", opacity: 0.4 }} />
      {/* radial glow center */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, rgba(0,255,136,0.04) 0%, transparent 70%)",
        }}
      />
    </motion.div>
  );
}

/* ── Chaos: floating physics blobs ────────────────────── */
const BLOBS = [
  { x: "10%", y: "20%", size: 180, color: "rgba(255,45,120,0.18)", delay: 0 },
  { x: "75%", y: "15%", size: 120, color: "rgba(255,230,0,0.14)", delay: 0.4 },
  { x: "50%", y: "60%", size: 220, color: "rgba(0,245,212,0.12)", delay: 0.8 },
  { x: "85%", y: "70%", size: 100, color: "rgba(255,45,120,0.1)", delay: 1.2 },
  { x: "20%", y: "75%", size: 150, color: "rgba(255,230,0,0.1)", delay: 0.6 },
];

function ChaosOverlay() {
  return (
    <motion.div
      key="chaos-bg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    >
      {BLOBS.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            left: b.x,
            top: b.y,
            width: b.size,
            height: b.size,
            background: b.color,
          }}
          animate={{
            x: [0, 30, -20, 15, 0],
            y: [0, -25, 20, -10, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: 8 + i * 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: b.delay,
          }}
        />
      ))}
      {/* noise grain */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />
    </motion.div>
  );
}

export default function VibeBackground() {
  const { vibe } = useVibeStore();

  return (
    <AnimatePresence mode="sync">
      {vibe === "corporate" && <CorporateOverlay />}
      {vibe === "data" && <DataOverlay />}
      {vibe === "chaos" && <ChaosOverlay />}
    </AnimatePresence>
  );
}
