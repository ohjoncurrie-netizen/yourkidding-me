"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Step = "idle" | "room" | "details" | "processing" | "confirmed";

const ROOMS = [
  { id: "101", name: "Standard King", rate: 149, deposit: 75 },
  { id: "205", name: "Deluxe Suite",  rate: 299, deposit: 150 },
  { id: "312", name: "Penthouse",     rate: 599, deposit: 300 },
];

interface LogEntry {
  dir: "out" | "in" | "event";
  label: string;
  body: object;
}

function JsonBlock({ label, body, dir }: LogEntry) {
  const colors = {
    out:   { border: "#00bfff", tag: "→ REQUEST",  tagColor: "#00bfff" },
    in:    { border: "#00ff88", tag: "← RESPONSE", tagColor: "#00ff88" },
    event: { border: "#ff6b00", tag: "⚡ WEBHOOK",  tagColor: "#ff6b00" },
  }[dir];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-l-2 pl-3 mb-3 text-[11px] font-mono"
      style={{ borderColor: colors.border }}
    >
      <span className="tracking-widest text-[9px]" style={{ color: colors.tagColor }}>
        {colors.tag}
      </span>
      <span className="ml-2 opacity-60">{label}</span>
      <pre
        className="mt-1 opacity-70 leading-relaxed overflow-x-auto"
        style={{ color: "var(--fg)" }}
      >
        {JSON.stringify(body, null, 2)}
      </pre>
    </motion.div>
  );
}

export default function HotelSim() {
  const [step, setStep] = useState<Step>("idle");
  const [selected, setSelected] = useState<(typeof ROOMS)[0] | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [name, setName] = useState("Jane Smith");
  const [checkIn, setCheckIn] = useState("2025-08-10");
  const [checkOut, setCheckOut] = useState("2025-08-13");

  function push(entry: LogEntry) {
    setLog((l) => [...l, entry]);
  }

  async function runBookingFlow() {
    if (!selected) return;
    setStep("processing");
    setLog([]);

    const bookingId = `BK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const piId = `pi_${Math.random().toString(36).slice(2, 18)}`;

    // Step 1 — Create booking
    await delay(500);
    push({
      dir: "out", label: "POST /api/bookings",
      body: { room: selected.id, guest: name, check_in: checkIn, check_out: checkOut, deposit_cents: selected.deposit * 100 },
    });

    await delay(700);
    push({
      dir: "in", label: "201 Created",
      body: { booking_id: bookingId, status: "pending_payment", room: selected.id },
    });

    // Step 2 — Stripe Payment Intent
    await delay(600);
    push({
      dir: "out", label: "POST stripe.com/v1/payment_intents",
      body: { amount: selected.deposit * 100, currency: "usd", capture_method: "manual", metadata: { booking_id: bookingId } },
    });

    await delay(800);
    push({
      dir: "in", label: "200 OK — Payment Intent created",
      body: { id: piId, status: "requires_payment_method", capture_method: "manual", amount: selected.deposit * 100 },
    });

    // Step 3 — Stripe webhook: payment_intent.succeeded
    await delay(1200);
    push({
      dir: "event", label: "stripe → POST /api/webhooks/stripe",
      body: { type: "payment_intent.succeeded", data: { object: { id: piId, status: "requires_capture", amount_capturable: selected.deposit * 100 } } },
    });

    // Step 4 — Booking confirmed
    await delay(600);
    push({
      dir: "in", label: "PATCH /api/bookings/" + bookingId,
      body: { booking_id: bookingId, status: "confirmed", deposit_held: true, capture_before: checkIn + "T15:00:00Z" },
    });

    setStep("confirmed");
  }

  function reset() {
    setStep("idle");
    setSelected(null);
    setLog([]);
  }

  return (
    <div className="grid md:grid-cols-2 gap-4 font-mono text-sm">
      {/* Left — UI */}
      <div className="space-y-4">
        <AnimatePresence mode="wait">

          {step === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-xs opacity-50 mb-3 tracking-widest uppercase">Select a room</p>
              <div className="space-y-2">
                {ROOMS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { setSelected(r); setStep("room"); }}
                    className="w-full text-left border rounded-lg p-3 hover:scale-[1.01] transition-all"
                    style={{ borderColor: "var(--accent2)", background: "var(--glow)" }}
                  >
                    <div className="flex justify-between items-center">
                      <span style={{ color: "var(--accent)" }}>{r.name}</span>
                      <span className="text-xs opacity-50">Rm {r.id}</span>
                    </div>
                    <div className="text-xs opacity-50 mt-1">
                      ${r.rate}/night · <span style={{ color: "var(--accent2)" }}>${r.deposit} deposit</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {(step === "room" || step === "details") && selected && (
            <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="border rounded-lg p-3" style={{ borderColor: "var(--accent)", background: "var(--glow)" }}>
                <p className="text-xs opacity-50 mb-1">selected</p>
                <p style={{ color: "var(--accent)" }}>{selected.name} — ${selected.deposit} deposit</p>
              </div>

              <div className="space-y-2">
                {[
                  { label: "Guest name", value: name, set: setName },
                  { label: "Check-in", value: checkIn, set: setCheckIn },
                  { label: "Check-out", value: checkOut, set: setCheckOut },
                ].map(({ label, value, set }) => (
                  <div key={label}>
                    <p className="text-[10px] opacity-40 tracking-widest mb-1">{label.toUpperCase()}</p>
                    <input
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      className="w-full bg-transparent border rounded px-2 py-1 text-xs outline-none"
                      style={{ borderColor: "var(--accent2)", color: "var(--fg)" }}
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={runBookingFlow}
                className="w-full py-2 rounded-lg text-sm font-bold tracking-widest transition-all hover:scale-[1.02]"
                style={{ background: "var(--accent)", color: "var(--bg)" }}
              >
                PAY ${selected.deposit} DEPOSIT
              </button>
              <button onClick={reset} className="w-full text-[10px] opacity-30 hover:opacity-60">← back</button>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-40 gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-6 h-6 border-2 border-t-transparent rounded-full"
                style={{ borderColor: "var(--accent)" }}
              />
              <p className="text-xs tracking-widest opacity-50">PROCESSING TRANSACTION</p>
            </motion.div>
          )}

          {step === "confirmed" && selected && (
            <motion.div key="confirmed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="border rounded-lg p-4 space-y-2" style={{ borderColor: "var(--accent)", background: "var(--glow)" }}>
              <p className="text-xs tracking-widest" style={{ color: "var(--accent)" }}>✓ BOOKING CONFIRMED</p>
              <p className="font-bold" style={{ color: "var(--accent)" }}>{selected.name}</p>
              <p className="text-xs opacity-60">{name} · {checkIn} → {checkOut}</p>
              <p className="text-xs opacity-60">${selected.deposit} deposit held · captures at check-in · releases at check-out</p>
              <button onClick={reset} className="text-[10px] opacity-40 hover:opacity-70 mt-2">↺ run again</button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Right — API log */}
      <div
        className="border rounded-lg p-3 h-72 overflow-y-auto"
        style={{ borderColor: "var(--accent2)", background: "rgba(0,0,0,0.5)" }}
      >
        <p className="text-[9px] tracking-[0.3em] uppercase opacity-30 mb-3">API traffic</p>
        {log.length === 0 && (
          <p className="text-[11px] opacity-20 text-center mt-8">
            make a booking to see live API calls
          </p>
        )}
        {log.map((entry, i) => <JsonBlock key={i} {...entry} />)}
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
