# FAQ — Jon Currie
These are real answers to questions I get asked. The AI should answer these exactly as written.

---

**Q: Are you available for hire / freelance?**
A: Yes

**Q: What's your rate?**
A:  Reach out to discuss.

**Q: What kind of work are you looking for?**
A: Web Development, Game Development, Server Development/ Management, 

**Q: Why did you use PostgreSQL for Montana Blotter instead of MongoDB?**
A: Montana Blotter stores scraped news articles with structured metadata — dates, sources,
locations, categories. That's relational data with known structure. MongoDB would have bought
me nothing except more BSON and less SQL. Postgres full-text search (tsvector + GIN index)
handles the search use case fine at this scale.

**Q: Why did you use PostgreSQL for HotelDeposit instead of MongoDB?**
A: Deposits are financial data. You cannot have eventual consistency when a payment fails but
the booking still shows as confirmed. ACID transactions in Postgres make that impossible.
With MongoDB you're writing your own two-phase commit or hoping nothing goes wrong.

**Q: What's the hardest bug you've ever fixed?**
A: Troubleshooting GUI and network persistence on Kali Linux. Specifically, resolving issues where the Xfce environment would fail to load properly after updates or getting a stable connection through specific drivers. It required deep diving into system logs and manual configuration of the display manager.

**Q: What's something you built that you're proud of?**
A: As a history teacher, I wanted to merge my professional expertise with my development skills. Building an interactive educational map that helps people visualize Montana's history was a rewarding way to make learning more accessible. (SimpleMontana.com)

**Q: What's something you built that you regret?**
A: Earlier versions of my scraping scripts for Montana Blotter. Initially, I didn't account for the diversity of site structures across different counties, leading to brittle code that broke frequently. I regret not starting with a more modular, "adapter-based" architecture from day one.

**Q: How do you handle working with designers?**
A: I prioritize clear communication regarding technical constraints early in the process. I prefer using tools like Figma to ensure we are aligned on the vision before I start writing code, which prevents major reworks later.

**Q: What's your biggest weakness as a developer?**
A: Sometimes I spend too much time "under the hood" perfecting the server-side architecture or CLI tools (like my work with Kali) when a simpler, front-end-focused solution might suffice for the MVP. I'm learning to balance technical depth with speed to market.

**Q: Do you work well in teams?**
A: Yes. My background as a teacher has given me strong communication skills and the ability to explain complex technical concepts to non-technical stakeholders, which is vital for any collaborative development team.

**Q: What are you building next?**
A: I am currently refining OnlyZits.com(ZitHub). It’s a niche video-sharing platform that presents unique challenges in handling high-volume media storage and content sourcing efficiently.

**Q: Why "yourkidding.me"?**
A: It reflects my personality and the "ohgeecee" handle—I like projects that have a bit of wit and a memorable, slightly skeptical edge to them.

**Q: How long did HotelDeposit / MontanaBlotter / OnlyZits take to build?**
A: Montana Blotter took about a month of intensive development to get the initial scraping and Postgres search architecture solid. HotelDeposit was a quicker build focused on ACID compliance, and OnlyZits is an ongoing project involving more complex media handling.

**Q: Have any of your projects made money?**
A: I'm currently exploring monetization strategies for Montana Blotter and OnlyZits, focusing on ad revenue and local partnerships, but they currently serve primarily as high-utility community resources.