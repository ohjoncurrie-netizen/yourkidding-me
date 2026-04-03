import { Suspense } from "react";
import Terminal from "@/components/terminal/Terminal";
import SkillGraphClient from "@/components/graph/SkillGraphClient";
import VibeShell from "@/components/vibe/VibeShell";
import { HotelSim, BlotterSim, ZitsSim } from "@/components/simulations/SimulationsClient";
import { getGitHubStats } from "@/lib/github";

export default async function Home() {
  let githubStats = { isActiveToday: false, publicRepos: 0, lastPush: null as string | null };
  try {
    githubStats = await getGitHubStats();
  } catch {}

  return (
    <VibeShell
      name="Jon Currie"
      isActiveToday={githubStats.isActiveToday}
      publicRepos={githubStats.publicRepos}
      lastPush={githubStats.lastPush}
    >
      {/* ── Interview Me ─────────────────────────────── */}
      <section className="mb-24">
        <SectionLabel label="01 — Interview Me" />
        <p className="text-sm opacity-50 mb-6 max-w-md">
          Don&apos;t read a resume. Ask the AI. It knows my projects, my
          decisions, my reasoning.
        </p>
        <Suspense fallback={null}>
          <Terminal />
        </Suspense>
      </section>

      {/* ── Skill Graph ──────────────────────────────── */}
      <section className="mb-24">
        <SectionLabel label="02 — Live Architecture" />
        <p className="text-sm opacity-50 mb-2 max-w-md">
          My skills and projects as a living node graph, connected to GitHub.
          Nodes pulse when I&apos;m actively coding.
        </p>
        {githubStats.isActiveToday && (
          <p
            className="text-xs mb-4 tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            ● ACTIVE SESSION DETECTED — graph is live
          </p>
        )}
        <SkillGraphClient isActive={githubStats.isActiveToday} />
      </section>

      {/* ── Simulations ──────────────────────────────── */}
      <section className="mb-24">
        <SectionLabel label="03 — Live Project Simulations" />
        <p className="text-sm opacity-50 mb-8 max-w-md">
          Don&apos;t look at screenshots. Interact with the actual mechanics of each project.
        </p>

        <div className="space-y-16">
          {/* Hotel Deposit */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="font-bold text-base" style={{ color: "var(--accent)" }}>
                HotelDeposit.com
              </h3>
              <span className="text-[10px] tracking-widest opacity-40 uppercase">
                Next.js · PostgreSQL · Stripe
              </span>
            </div>
            <p className="text-xs opacity-50 mb-4 max-w-lg">
              Book a room. Watch the real API calls fire — Payment Intent creation,
              manual capture flow, webhook verification — exactly as the production code does it.
            </p>
            
              <HotelSim />
            
          </div>

          {/* Montana Blotter */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="font-bold text-base" style={{ color: "var(--accent)" }}>
                MontanaBlotter.com
              </h3>
              <span className="text-[10px] tracking-widest opacity-40 uppercase">
                Python · Scrapy · PostgreSQL
              </span>
            </div>
            <p className="text-xs opacity-50 mb-4 max-w-lg">
              Watch a Scrapy spider crawl Montana county record sites in real-time.
              See it handle errors, extract records, and map them across the state.
            </p>
            
              <BlotterSim />
            
          </div>

          {/* OnlyZits */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="font-bold text-base" style={{ color: "var(--accent)" }}>
                OnlyZits.com
              </h3>
              <span className="text-[10px] tracking-widest opacity-40 uppercase">
                WebGL · GLSL · FFmpeg
              </span>
            </div>
            <p className="text-xs opacity-50 mb-4 max-w-lg">
              Upload any image and apply real WebGL shaders client-side — the same pipeline
              used for media processing. See the GLSL source live.
            </p>
            
              <ZitsSim />
            
          </div>
        </div>
      </section>
    </VibeShell>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <h2
        className="text-xs tracking-[0.3em] uppercase shrink-0"
        style={{ color: "var(--accent2)" }}
      >
        {label}
      </h2>
      <div
        className="flex-1 h-px"
        style={{ background: "var(--accent2)", opacity: 0.2 }}
      />
    </div>
  );
}

const PROJECTS = [
  {
    name: "HotelDeposit",
    url: "hoteldeposit.com",
    desc: "Booking & deposit platform. Full API layer, Stripe integration, security-first.",
    stack: ["Next.js", "PostgreSQL", "Stripe", "Node.js"],
  },
  {
    name: "MontanaBlotter",
    url: "montanablotter.com",
    desc: "Montana news aggregator. Live web scraping, automated data pipeline.",
    stack: ["Python", "Scrapy", "PostgreSQL", "React"],
  },
  {
    name: "OnlyZits",
    url: "onlyzits.com",
    desc: "Gen-Z media platform. WebGL filters, media processing pipeline.",
    stack: ["React", "WebGL", "Node.js", "FFmpeg"],
  },
];
