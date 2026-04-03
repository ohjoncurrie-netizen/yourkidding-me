"use client";

import { useEffect } from "react";
import { useVibeStore } from "@/store/vibeStore";
import { motion } from "framer-motion";
import VibeBackground from "./VibeBackground";
import DataTicker from "./DataTicker";
import ChaosBugs from "./ChaosBugs";
import VibeHero from "./VibeHero";
import VibeSlider from "./VibeSlider";

interface Props {
  name: string;
  children: React.ReactNode;
  isActiveToday: boolean;
  publicRepos: number;
  lastPush: string | null;
}

export default function VibeShell({
  name,
  children,
  isActiveToday,
  publicRepos,
  lastPush,
}: Props) {
  const { vibe } = useVibeStore();

  // Sync vibe to <html> on mount
  useEffect(() => {
    document.documentElement.setAttribute("data-vibe", vibe);
  }, [vibe]);

  const githubStatus = isActiveToday ? (
    <span style={{ color: "var(--accent)" }}>● coding right now</span>
  ) : (
    <span className="opacity-40">● offline</span>
  );

  const stats = (
    <>
      <span>{publicRepos} public repos</span>
      {lastPush && (
        <span>last push: {new Date(lastPush).toLocaleDateString()}</span>
      )}
    </>
  );

  return (
    <>
      <VibeBackground />
      <DataTicker />
      <ChaosBugs />

      <motion.main
        className="relative z-10 min-h-screen px-6 py-16 max-w-5xl mx-auto"
        animate={{ paddingTop: vibe === "data" ? "4.5rem" : "4rem" }}
        transition={{ duration: 0.4 }}
      >
        <VibeHero
          name={name}
          subtitle="Full-stack developer. I build things that work when they shouldn't and break when they should. Currently:"
          githubStatus={githubStatus}
          stats={stats}
        />

        {children}

        <div className="h-28" />
      </motion.main>

      <VibeSlider />
    </>
  );
}
