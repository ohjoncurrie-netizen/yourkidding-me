"use client";

import dynamic from "next/dynamic";

const SimLoader = () => (
  <div className="w-full h-24 flex items-center justify-center opacity-20 text-xs tracking-widest">
    LOADING SIMULATION...
  </div>
);

export const HotelSim = dynamic(() => import("./HotelSim"), {
  ssr: false,
  loading: SimLoader,
});

export const BlotterSim = dynamic(() => import("./BlotterSim"), {
  ssr: false,
  loading: SimLoader,
});

export const ZitsSim = dynamic(() => import("./ZitsSim"), {
  ssr: false,
  loading: SimLoader,
});
