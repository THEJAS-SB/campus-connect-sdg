-- ============================================================
-- INNOVEX – Vector Search & Helper Functions
-- Run this AFTER 001_initial_schema.sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- HNSW index for fast cosine similarity search on profiles
-- ────────────────────────────────────────────────────────────
create index if not exists profiles_embedding_idx
  on profiles using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

create index if not exists startups_embedding_idx
  on startups using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- ────────────────────────────────────────────────────────────
-- match_profiles: find profiles by vector similarity
-- ────────────────────────────────────────────────────────────
create or replace function match_profiles(
  query_embedding  vector(384),
  target_role      text,
  match_count      int default 5
)
returns table (
  profile jsonb,
  similarity float
)
language sql stable
as $$
  select
    jsonb_build_object(
      'id',            p.id,
      'rs_id',         p.rs_id,
      'full_name',     p.full_name,
      'skills',        p.skills,
      'sdg_interests', p.sdg_interests,
      'bio',           p.bio,
      'role',          p.role,
      'linkedin_url',  p.linkedin_url
    ) as profile,
    1 - (p.embedding <=> query_embedding) as similarity
  from profiles p
  where p.role = target_role
    and p.embedding is not null
  order by p.embedding <=> query_embedding
  limit match_count;
$$;

-- ────────────────────────────────────────────────────────────
-- match_startups: find startups by vector similarity
-- ────────────────────────────────────────────────────────────
create or replace function match_startups(
  query_embedding  vector(384),
  filter_stage     text    default null,
  filter_domain    text    default null,
  match_count      int     default 10
)
returns table (
  id              uuid,
  name            text,
  description     text,
  stage           text,
  domain          text,
  sdg_tags        text[],
  funding_raised  numeric,
  student_id      uuid,
  similarity      float
)
language sql stable
as $$
  select
    s.id,
    s.name,
    s.description,
    s.stage,
    s.domain,
    s.sdg_tags,
    s.funding_raised,
    s.student_id,
    1 - (s.embedding <=> query_embedding) as similarity
  from startups s
  where s.embedding is not null
    and (filter_stage is null or s.stage = filter_stage)
    and (filter_domain is null or s.domain = filter_domain)
  order by s.embedding <=> query_embedding
  limit match_count;
$$;

-- ────────────────────────────────────────────────────────────
-- increment_innovation_score: safely increment a user's score
-- ────────────────────────────────────────────────────────────
create or replace function increment_innovation_score(
  p_user_id uuid,
  p_delta   int
)
returns void
language sql
as $$
  update profiles
  set innovation_score = innovation_score + p_delta
  where id = p_user_id;
$$;

-- ────────────────────────────────────────────────────────────
-- update_streak: increment streak on daily login / mission
-- ────────────────────────────────────────────────────────────
create or replace function update_streak(p_user_id uuid)
returns void
language sql
as $$
  update profiles
  set streak_days = streak_days + 1
  where id = p_user_id;
$$;
