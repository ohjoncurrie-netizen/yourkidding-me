-- Enable pgvector extension
create extension if not exists vector;

-- Documents table for RAG knowledge base
create table if not exists documents (
  id        bigserial primary key,
  content   text        not null,
  metadata  jsonb       not null default '{}',
  embedding vector(1536)         -- text-embedding-3-small = 1536 dims
);

-- HNSW index for fast approximate nearest-neighbor search
create index if not exists documents_embedding_idx
  on documents
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Match function used by LangChain SupabaseVectorStore
create or replace function match_documents(
  query_embedding vector(1536),
  match_count     int     default 5,
  filter          jsonb   default '{}'
)
returns table (
  id        bigint,
  content   text,
  metadata  jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  where d.metadata @> filter
  order by d.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Chat analytics (optional — track what recruiters ask)
create table if not exists chat_events (
  id         bigserial primary key,
  question   text        not null,
  answer     text,
  created_at timestamptz not null default now()
);
