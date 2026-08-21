-- Feedback System Tables
-- Tracks user feedback, voting, comments, and status history with SLA tracking

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_stat_statements";

-- Main feedback items table
create table if not exists public.feedback_items (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type = 'feedback'), -- V1 is feedback-only; type field allows for future 'ideas', 'bug', etc.
  title text not null,
  body text not null,
  category text not null check (category in ('bug', 'feature_request', 'ui_ux', 'performance', 'other')),
  status text not null default 'new' check (status in ('new', 'under_review', 'planned', 'in_progress', 'shipped', 'declined')),
  user_id uuid not null references auth.users(id) on delete cascade,
  staff_notes text,
  screenshot_url text,
  
  -- SLA tracking fields
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  first_staff_response_at timestamp with time zone,
  status_decided_at timestamp with time zone,
  
  -- Metadata
  vote_count int not null default 0,
  comment_count int not null default 0,
  user_voted bool not null default false, -- denormalized for query performance
  
  constraint feedback_items_title_length check (char_length(title) >= 5 and char_length(title) <= 200),
  constraint feedback_items_body_length check (char_length(body) >= 10 and char_length(body) <= 5000)
);

-- Feedback votes (one per user per item)
create table if not exists public.feedback_votes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.feedback_items(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  
  -- Ensure one vote per user per item
  unique(user_id, item_id)
);

-- Feedback comments and staff notes
create table if not exists public.feedback_comments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.feedback_items(id) on delete cascade,
  body text not null,
  is_staff_note bool not null default false,
  
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  constraint feedback_comments_body_length check (char_length(body) >= 1 and char_length(body) <= 2000)
);

-- Status history for audit trail and "you asked, we responded" feature
create table if not exists public.feedback_status_history (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references public.feedback_items(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid not null references auth.users(id) on delete restrict,
  change_note text,
  
  created_at timestamp with time zone not null default now(),
  
  constraint feedback_status_history_statuses check (
    new_status in ('new', 'under_review', 'planned', 'in_progress', 'shipped', 'declined')
  )
);

-- Indexes for performance
create index idx_feedback_items_user_id on public.feedback_items(user_id);
create index idx_feedback_items_status on public.feedback_items(status);
create index idx_feedback_items_category on public.feedback_items(category);
create index idx_feedback_items_created_at on public.feedback_items(created_at desc);
create index idx_feedback_items_vote_count on public.feedback_items(vote_count desc);

create index idx_feedback_votes_user_id on public.feedback_votes(user_id);
create index idx_feedback_votes_item_id on public.feedback_votes(item_id);
create index idx_feedback_votes_item_user on public.feedback_votes(item_id, user_id);

create index idx_feedback_comments_user_id on public.feedback_comments(user_id);
create index idx_feedback_comments_item_id on public.feedback_comments(item_id);
create index idx_feedback_comments_created_at on public.feedback_comments(created_at desc);

create index idx_feedback_status_history_item_id on public.feedback_status_history(item_id);
create index idx_feedback_status_history_changed_by on public.feedback_status_history(changed_by);
create index idx_feedback_status_history_created_at on public.feedback_status_history(created_at desc);

-- Trigger to update feedback_items.updated_at on any change
create or replace function update_feedback_items_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger feedback_items_updated_at_trigger
before update on public.feedback_items
for each row
execute function update_feedback_items_updated_at();

-- Trigger to update vote_count and comment_count on votes/comments
create or replace function update_feedback_vote_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.feedback_items 
    set vote_count = (select count(*) from public.feedback_votes where item_id = new.item_id)
    where id = new.item_id;
  elsif tg_op = 'DELETE' then
    update public.feedback_items 
    set vote_count = (select count(*) from public.feedback_votes where item_id = old.item_id)
    where id = old.item_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger feedback_votes_count_trigger
after insert or delete on public.feedback_votes
for each row
execute function update_feedback_vote_count();

create or replace function update_feedback_comment_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.feedback_items 
    set comment_count = (select count(*) from public.feedback_comments where item_id = new.item_id)
    where id = new.item_id;
  elsif tg_op = 'DELETE' then
    update public.feedback_items 
    set comment_count = (select count(*) from public.feedback_comments where item_id = old.item_id)
    where id = old.item_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger feedback_comments_count_trigger
after insert or delete on public.feedback_comments
for each row
execute function update_feedback_comment_count();

create or replace function prevent_feedback_status_change()
returns trigger as $$
begin
  if old.status is distinct from new.status and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'feedback status changes require service role access';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger feedback_items_status_guard_trigger
before update on public.feedback_items
for each row
execute function prevent_feedback_status_change();

-- RLS: Enable row-level security
alter table public.feedback_items enable row level security;
alter table public.feedback_votes enable row level security;
alter table public.feedback_comments enable row level security;
alter table public.feedback_status_history enable row level security;

-- RLS Policies for feedback_items

-- Anyone (authenticated) can view all feedback items
create policy "feedback_items_select_all"
on public.feedback_items
for select
to authenticated
using (true);

-- Users can only insert their own feedback
create policy "feedback_items_insert_own"
on public.feedback_items
for insert
to authenticated
with check (auth.uid() = user_id);

-- Users can only update their own feedback (not status, only staff_notes field)
create policy "feedback_items_update_own"
on public.feedback_items
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Staff can update status and add staff notes
create policy "feedback_items_staff_update"
on public.feedback_items
for update
to authenticated
using (
  exists (
    select 1 from public.staff_members 
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1 from public.staff_members 
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and role in ('owner', 'admin')
  )
);

-- RLS Policies for feedback_votes

-- Anyone can view votes (for vote count display)
create policy "feedback_votes_select_all"
on public.feedback_votes
for select
to authenticated
using (true);

-- Users can only insert their own votes
create policy "feedback_votes_insert_own"
on public.feedback_votes
for insert
to authenticated
with check (auth.uid() = user_id);

-- Users can only delete their own votes
create policy "feedback_votes_delete_own"
on public.feedback_votes
for delete
to authenticated
using (auth.uid() = user_id);

-- RLS Policies for feedback_comments

-- Anyone can view all comments
create policy "feedback_comments_select_all"
on public.feedback_comments
for select
to authenticated
using (true);

-- Users can insert comments
create policy "feedback_comments_insert_own"
on public.feedback_comments
for insert
to authenticated
with check (auth.uid() = user_id);

-- Users can update their own comments
create policy "feedback_comments_update_own"
on public.feedback_comments
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Users can delete their own comments
create policy "feedback_comments_delete_own"
on public.feedback_comments
for delete
to authenticated
using (auth.uid() = user_id);

-- RLS Policies for feedback_status_history

-- Anyone (authenticated) can view status history
create policy "feedback_status_history_select_all"
on public.feedback_status_history
for select
to authenticated
using (true);

-- Only staff can insert status history
create policy "feedback_status_history_insert_staff"
on public.feedback_status_history
for insert
to authenticated
with check (
  exists (
    select 1 from public.staff_members 
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and role in ('owner', 'admin')
  )
);

-- Grant permissions to authenticated users
grant select on public.feedback_items to authenticated;
grant insert on public.feedback_items to authenticated;
grant update on public.feedback_items to authenticated;

grant select on public.feedback_votes to authenticated;
grant insert on public.feedback_votes to authenticated;
grant delete on public.feedback_votes to authenticated;

grant select on public.feedback_comments to authenticated;
grant insert on public.feedback_comments to authenticated;
grant update on public.feedback_comments to authenticated;
grant delete on public.feedback_comments to authenticated;

grant select on public.feedback_status_history to authenticated;
grant insert on public.feedback_status_history to authenticated;
