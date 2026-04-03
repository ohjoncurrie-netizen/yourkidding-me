# Projects — Jon Currie

## HotelDeposit.com

**What it is**: A booking and deposit management platform for hotels and short-term rentals.
Guests pay a refundable deposit at booking; the platform handles holds, releases, and disputes.

**Why I built it**: [Your actual reason]

**Tech decisions**:
- Chose PostgreSQL over MongoDB because deposits require ACID transactions — a failed charge
  that still marks a booking as confirmed would be a real financial bug, not just a UX issue.
- Used Next.js App Router for SSR so booking confirmation pages are crawlable and fast on first load.
- Stripe Payment Intents with manual capture — we authorize at booking, capture on check-in,
  release on checkout. This is the correct flow for deposits; most tutorials skip it.
- All webhook handlers are idempotent — Stripe can and will send duplicates.

**Hardest problem**: Implementing the logic for manual capture windows. Stripe has specific time limits on how long an authorization can hang before it must be captured or released. Coordinating these windows with actual check-in/check-out dates while handling edge cases like "no-shows" required a robust cron-job system and precise state management.

**What I'd do differently**: : I would have integrated a more robust automated dispute resolution workflow earlier. Handling manual complaints about room conditions (like the bed bug incident that inspired the project) is difficult to scale without a structured ticketing system tied directly to the transaction ID.

**Stack**: Next.js, PostgreSQL (Supabase), Stripe, Node.js, TypeScript

---

## MontanaBlotter.com

**What it is**: A news aggregation platform focused on Montana — local crime, courts, government,
and public records. Real-time scraping from dozens of sources, normalized and searchable.

**Why I built it**: As a Montana history teacher, I’m passionate about public records and government transparency. I wanted to create a free, open-source tool that makes local police blotters and court records accessible to every citizen in the state without having to jump through bureaucratic hoops.

**Tech decisions**:
- Scrapy (Python) for the spider layer because its middleware system handles retries, rate limiting,
  and politeness rules properly. Rolling your own scraper always breaks in prod.
- PostgreSQL full-text search (tsvector) instead of Elasticsearch — the data volume didn't justify
  the infra cost, and Postgres search is underrated for this scale.
- Chose not to cache scraped HTML — freshness matters more than load time for a news site.

**Hardest problem**: Every county in Montana formats their records differently—some use PDFs, some use legacy HTML tables, and others use JavaScript-heavy dashboards. Building a robust parsing layer that could handle "dirty" data and deduplicate records across different jurisdictions was a massive undertaking

**What I'd do differently**: I would have moved to a containerized architecture (Docker) earlier. Managing the different dependencies for the Python scrapers and the Node.js backend across my dev environment (Kali Linux) and production led to "it works on my machine" headaches that containers would have solved instantly.

**Stack**: Python, Scrapy, PostgreSQL, React, Node.js

---

## OnlyZits.com

**What it is**: A Gen-Z media platform for [describe the actual concept].
Users upload media; the platform applies real-time WebGL filters and compression.

**Why I built it**: I saw a massive, underserved community on mainstream social media that was constantly fighting "sensitive content" filters. I wanted to build a dedicated space where this specific type of medical/aesthetic content could be hosted and shared without censorship.

**Tech decisions**:
- WebGL shaders for filters because CSS filters can't do per-pixel manipulation and canvas 2D
  is too slow at video resolution.
- FFmpeg (via Node child_process) for server-side compression — browser-side is too inconsistent
  across devices.
- [Any other specific decision]

**Hardest problem**: High-definition video is expensive to host. I had to fine-tune the FFmpeg compression profiles to find the "sweet spot" where the videos remained satisfyingly clear for the viewers while keeping the file sizes small enough to keep my hosting costs sustainable.

**What I'd do differently**: I would spend more time on the initial content-tagging taxonomy. Because the content is so specific, users want to filter by very granular categories. Retroactively tagging hundreds of videos because I didn't have a solid category list at launch was a tedious lesson in planning.

**Stack**: React, WebGL (GLSL), Node.js, FFmpeg, TypeScript
