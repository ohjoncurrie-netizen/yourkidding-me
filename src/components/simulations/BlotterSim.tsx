"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Fake Montana counties with rough SVG positions ─────── */
const COUNTIES = [
  { id: "cascade",    name: "Cascade",     x: 160, y: 130, url: "cascade.mt.gov/blotter" },
  { id: "yellowstone",name: "Yellowstone", x: 280, y: 190, url: "ycs.mt.gov/records" },
  { id: "missoula",  name: "Missoula",    x: 80,  y: 150, url: "missoula.mt.gov/sheriff" },
  { id: "gallatin",  name: "Gallatin",    x: 210, y: 210, url: "gallatin.mt.gov/court" },
  { id: "flathead",  name: "Flathead",    x: 90,  y: 80,  url: "flathead.mt.gov/logs" },
  { id: "lewis",     name: "Lewis & Clark",x: 185, y: 115, url: "lcc.mt.gov/public" },
  { id: "silver",    name: "Silver Bow",  x: 140, y: 195, url: "silverbowmt.gov/arrests" },
  { id: "ravalli",   name: "Ravalli",     x: 100, y: 185, url: "rcso.mt.gov/blotter" },
  { id: "hill",      name: "Hill",         x: 220, y: 60,  url: "hillcounty.mt.gov" },
  { id: "richland",  name: "Richland",    x: 370, y: 120, url: "richland.mt.gov/court" },
];

const FAKE_ARTICLES = [
  "Warrant issued for failure to appear, Cascade Co.",
  "DUI arrest on I-90 near Missoula",
  "Property crime report, downtown Billings",
  "Court filing: civil dispute over water rights",
  "Arrest report: domestic disturbance, Great Falls",
  "Missing persons update, Flathead County",
  "Traffic stop yields drug paraphernalia, Bozeman",
  "Public intoxication, Helena city center",
  "Theft report: catalytic converter, Butte",
  "Court docket update: 14 new filings, Yellowstone Co.",
  "Warrant served: failure to pay child support",
  "Animal cruelty investigation opened, Ravalli Co.",
];

interface CrawlNode {
  id: string;
  name: string;
  x: number;
  y: number;
  status: "idle" | "crawling" | "done" | "error";
  articleCount: number;
  url: string;
}

interface LogLine {
  text: string;
  type: "info" | "success" | "warn" | "data";
}

export default function BlotterSim() {
  const [nodes, setNodes] = useState<CrawlNode[]>(
    COUNTIES.map((c) => ({ ...c, status: "idle", articleCount: 0 }))
  );
  const [log, setLog] = useState<LogLine[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [articles, setArticles] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [log]);

  function pushLog(text: string, type: LogLine["type"] = "info") {
    setLog((l) => [...l, { text, type }]);
  }

  async function startCrawl() {
    setRunning(true);
    setDone(false);
    setLog([]);
    setArticles([]);
    abortRef.current = false;
    setNodes((n) => n.map((c) => ({ ...c, status: "idle", articleCount: 0 })));

    pushLog("Spider initializing — Scrapy 2.11.0", "info");
    await delay(400);
    pushLog(`Loaded ${COUNTIES.length} county targets from config.yaml`, "info");
    await delay(300);
    pushLog("Respecting crawl-delay: 1.0s (robots.txt)", "info");
    await delay(500);

    const shuffled = [...COUNTIES].sort(() => Math.random() - 0.5);

    for (const county of shuffled) {
      if (abortRef.current) break;

      setNodes((n) => n.map((c) => c.id === county.id ? { ...c, status: "crawling" } : c));
      pushLog(`GET https://${county.url}`, "info");
      await delay(400 + Math.random() * 600);

      const isError = Math.random() < 0.1;
      if (isError) {
        setNodes((n) => n.map((c) => c.id === county.id ? { ...c, status: "error" } : c));
        pushLog(`✗ 403 Forbidden — ${county.url} (retrying with backoff)`, "warn");
        await delay(800);
        pushLog(`✓ Retry succeeded via cached mirror`, "success");
      }

      const count = 2 + Math.floor(Math.random() * 6);
      setNodes((n) => n.map((c) => c.id === county.id ? { ...c, status: "done", articleCount: count } : c));

      for (let i = 0; i < count; i++) {
        const article = FAKE_ARTICLES[Math.floor(Math.random() * FAKE_ARTICLES.length)];
        pushLog(`  → parsed: "${article}"`, "data");
        setArticles((a) => [...a, `[${county.name}] ${article}`]);
        await delay(80);
      }

      pushLog(`✓ ${county.name}: ${count} records extracted`, "success");
      await delay(200);
    }

    if (!abortRef.current) {
      pushLog("", "info");
      pushLog("━━━ Spider finished ━━━", "info");
      const total = nodes.reduce((s, n) => s + n.articleCount, 0);
      pushLog(`Total records scraped: ${articles.length + 1}`, "success");
      pushLog("Deduplication pass... 0 duplicates found", "info");
      pushLog("Inserting into PostgreSQL (tsvector index updating)...", "info");
      await delay(600);
      pushLog("✓ Done. Pipeline complete.", "success");
      setDone(true);
    }
    setRunning(false);
  }

  function reset() {
    abortRef.current = true;
    setRunning(false);
    setDone(false);
    setLog([]);
    setArticles([]);
    setNodes(COUNTIES.map((c) => ({ ...c, status: "idle", articleCount: 0 })));
  }

  const logColors: Record<LogLine["type"], string> = {
    info:    "opacity-50",
    success: "text-green-400",
    warn:    "text-yellow-400",
    data:    "opacity-70",
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={running ? reset : startCrawl}
          className="px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest transition-all hover:scale-[1.02]"
          style={{
            background: running ? "rgba(255,100,0,0.2)" : "var(--accent)",
            color: running ? "#ff6400" : "var(--bg)",
            border: running ? "1px solid #ff6400" : "none",
          }}
        >
          {running ? "STOP SPIDER" : done ? "RUN AGAIN" : "START SPIDER"}
        </button>
        <span className="opacity-30">{COUNTIES.length} county targets · Scrapy 2.11 · PostgreSQL</span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Montana map */}
        <div
          className="relative border rounded-lg overflow-hidden"
          style={{ borderColor: "var(--accent2)", background: "rgba(0,0,0,0.5)", height: 280 }}
        >
          <p className="absolute top-2 left-3 text-[9px] tracking-widest uppercase opacity-30">Montana</p>
          <svg viewBox="0 0 460 280" className="w-full h-full">
            {/* Rough Montana outline */}
            <path
              d="M 20 20 L 440 20 L 440 60 L 380 60 L 380 80 L 440 80 L 440 260 L 20 260 Z"
              fill="none"
              stroke="var(--accent2)"
              strokeWidth="1"
              opacity="0.15"
            />

            {/* Edges between nearby counties */}
            {nodes.filter(n => n.status === "crawling" || n.status === "done").map(n =>
              nodes.filter(m => m.id !== n.id && Math.hypot(m.x - n.x, m.y - n.y) < 140)
                .slice(0, 2)
                .map(m => (
                  <line
                    key={`${n.id}-${m.id}`}
                    x1={n.x} y1={n.y} x2={m.x} y2={m.y}
                    stroke="var(--accent)"
                    strokeWidth="0.5"
                    opacity="0.15"
                  />
                ))
            )}

            {nodes.map((node) => (
              <g key={node.id}>
                {/* Ping ring for crawling */}
                {node.status === "crawling" && (
                  <motion.circle
                    cx={node.x} cy={node.y}
                    initial={{ r: 4, opacity: 0.8 }}
                    animate={{ r: 20, opacity: 0 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="1"
                  />
                )}
                <circle
                  cx={node.x} cy={node.y} r={node.status === "crawling" ? 5 : 4}
                  fill={
                    node.status === "done"     ? "var(--accent)" :
                    node.status === "crawling" ? "var(--accent2)" :
                    node.status === "error"    ? "#ff4444" :
                    "rgba(255,255,255,0.1)"
                  }
                  stroke="var(--accent2)"
                  strokeWidth="0.5"
                />
                <text
                  x={node.x} y={node.y - 7}
                  fontSize="7"
                  fill="var(--fg)"
                  textAnchor="middle"
                  opacity={node.status === "idle" ? 0.3 : 0.8}
                >
                  {node.name}
                  {node.status === "done" ? ` (${node.articleCount})` : ""}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Spider log */}
        <div
          ref={logRef}
          className="border rounded-lg p-3 overflow-y-auto"
          style={{ borderColor: "var(--accent2)", background: "rgba(0,0,0,0.6)", height: 280 }}
        >
          <p className="text-[9px] tracking-[0.3em] uppercase opacity-30 mb-2">spider log</p>
          {log.length === 0 && (
            <p className="opacity-20 text-center mt-10">start the spider to watch it work</p>
          )}
          {log.map((line, i) => (
            <div key={i} className={`leading-relaxed ${logColors[line.type]}`}>
              {line.text || <br />}
            </div>
          ))}
          {running && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="text-green-400"
            >
              ▊
            </motion.span>
          )}
        </div>
      </div>

      {/* Scraped articles */}
      <AnimatePresence>
        {articles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="border rounded-lg p-3 max-h-32 overflow-y-auto"
            style={{ borderColor: "var(--accent2)", background: "rgba(0,0,0,0.4)" }}
          >
            <p className="text-[9px] tracking-[0.3em] uppercase opacity-30 mb-2">
              extracted records ({articles.length})
            </p>
            {articles.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="opacity-60 leading-relaxed"
              >
                {a}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
