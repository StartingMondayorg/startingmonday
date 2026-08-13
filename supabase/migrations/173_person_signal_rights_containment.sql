-- 173: Fail-closed tenant visibility for shared person-intelligence records.
-- Runtime source authorization is enforced in worker/lib/source-registry.js.

drop policy if exists "Authenticated can read people" on public.people;
create policy "Users read linked people"
  on public.people
  for select
  to authenticated
  using (
    exists (
      select 1 from public.contact_people link
      where link.person_id = people.id and link.user_id = auth.uid()
    )
    or exists (
      select 1 from public.company_people_candidates candidate
      where candidate.person_id = people.id and candidate.user_id = auth.uid()
    )
  );

drop policy if exists "Authenticated can read person sources" on public.person_sources;
create policy "Users read linked person sources"
  on public.person_sources
  for select
  to authenticated
  using (
    exists (
      select 1 from public.contact_people link
      where link.person_id = person_sources.person_id and link.user_id = auth.uid()
    )
    or exists (
      select 1 from public.company_people_candidates candidate
      where candidate.person_id = person_sources.person_id and candidate.user_id = auth.uid()
    )
  );

drop policy if exists "Authenticated can read person affiliations" on public.person_affiliations;
create policy "Users read linked person affiliations"
  on public.person_affiliations
  for select
  to authenticated
  using (
    exists (
      select 1 from public.contact_people link
      where link.person_id = person_affiliations.person_id and link.user_id = auth.uid()
    )
    or exists (
      select 1 from public.company_people_candidates candidate
      where candidate.person_id = person_affiliations.person_id and candidate.user_id = auth.uid()
    )
  );

drop policy if exists "Authenticated can read person signals" on public.person_signals;
create policy "Users read linked person signals"
  on public.person_signals
  for select
  to authenticated
  using (
    exists (
      select 1 from public.contact_people link
      where link.person_id = person_signals.person_id and link.user_id = auth.uid()
    )
    or exists (
      select 1 from public.company_people_candidates candidate
      where candidate.person_id = person_signals.person_id and candidate.user_id = auth.uid()
    )
  );