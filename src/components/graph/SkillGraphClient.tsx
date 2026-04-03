"use client";

import dynamic from "next/dynamic";

const SkillGraph = dynamic(() => import("./SkillGraph"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] flex items-center justify-center opacity-30 text-sm tracking-widest">
      INITIALIZING GRAPH...
    </div>
  ),
});

export default function SkillGraphClient({ isActive }: { isActive: boolean }) {
  return <SkillGraph isActive={isActive} />;
}
