import { create } from "zustand";

export type Vibe = "corporate" | "data" | "chaos";

interface VibeState {
  vibe: Vibe;
  vibeIndex: number; // 0=corporate, 1=data, 2=chaos
  setVibeIndex: (index: number) => void;
}

const VIBES: Vibe[] = ["corporate", "data", "chaos"];

export const useVibeStore = create<VibeState>((set) => ({
  vibe: "data",
  vibeIndex: 1,
  setVibeIndex: (index) => {
    const clamped = Math.max(0, Math.min(2, Math.round(index)));
    set({ vibeIndex: clamped, vibe: VIBES[clamped] });
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-vibe", VIBES[clamped]);
    }
  },
}));
