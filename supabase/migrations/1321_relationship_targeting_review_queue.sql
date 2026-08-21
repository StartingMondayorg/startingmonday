-- Queue for low-confidence relationship recommendations requiring human review.

create table if not exists public.relationship_targeting_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  relationship_score integer not null,
  confidence_band text not null check (confidence_band in ('high', 'medium', 'low')),
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'edited', 'rejected')),
  reviewer_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists relationship_targeting_reviews_user_idx
  on public.relationship_targeting_reviews(user_id, created_at desc);
create index if not exists relationship_targeting_reviews_status_idx
  on public.relationship_targeting_reviews(review_status);

alter table public.relationship_targeting_reviews enable row level security;

drop policy if exists "Users manage their own relationship targeting reviews" on public.relationship_targeting_reviews;
create policy "Users manage their own relationship targeting reviews"
  on public.relationship_targeting_reviews
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
