# Deploy — yourkidding.me

## 1. Push to GitHub
```bash
cd /root/portfolio
git init
git add .
git commit -m "initial: interactive portfolio yourkidding.me"
git remote add origin https://github.com/ohjoncurrie/yourkidding-me.git
git push -u origin main
```

## 2. Create Vercel project
```bash
npm i -g vercel
vercel
# Follow prompts: link to GitHub repo, set framework to Next.js
```

## 3. Set environment variables in Vercel dashboard
Project → Settings → Environment Variables:

```
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...    ← Settings > API > service_role
GITHUB_TOKEN=ghp_...                ← github.com/settings/tokens (read:user scope)
NEXT_PUBLIC_GITHUB_USERNAME=ohjoncurrie
INGEST_SECRET=pick-any-long-random-string
```

## 4. Set up Supabase vector store
In Supabase dashboard → SQL Editor, run:
```sql
-- paste contents of supabase/migrations/001_vector_store.sql
```

## 5. Connect yourkidding.me domain
Vercel → Project → Settings → Domains → Add `yourkidding.me`

In your domain registrar DNS:
```
A     @    76.76.21.21
CNAME www  cname.vercel-dns.com
```

## 6. Ingest your knowledge base
After deploy + env vars are set:
```bash
curl -X POST https://yourkidding.me/api/ingest \
  -H "x-ingest-secret: your-INGEST_SECRET-value"
# Returns: {"count": 42, "message": "Ingested 42 chunks from 4 documents."}
```

Re-run this any time you update the markdown docs in src/lib/langchain/docs/.

## 7. Verify everything works
- [ ] https://yourkidding.me loads
- [ ] Vibe slider switches modes
- [ ] 3D graph renders and orbits
- [ ] Terminal responds (AI clone)
- [ ] Hotel sim shows API calls
- [ ] Blotter sim crawls and maps
- [ ] OnlyZits sim applies WebGL shaders
- [ ] GitHub live indicator works (push a commit to test)
