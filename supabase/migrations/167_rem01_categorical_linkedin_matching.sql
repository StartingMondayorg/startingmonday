begin;

update public.company_people_connection_matches
set match_tier = case match_tier
  when 'high' then 'strong_overlap'
  when 'medium' then 'strong_overlap'
  when 'low' then 'possible_overlap'
  else match_tier
end
where match_tier in ('high', 'medium', 'low');

alter table public.company_people_connection_matches
  drop constraint if exists company_people_connection_matches_match_tier_check;

alter table public.company_people_connection_matches
  add constraint company_people_connection_matches_match_tier_check
  check (match_tier in ('strong_overlap', 'possible_overlap', 'rejected'));

drop index if exists public.company_people_connection_matches_user_company_idx;

alter table public.company_people_connection_matches
  drop column if exists name_similarity,
  drop column if exists company_similarity,
  drop column if exists overall_score;

drop function if exists public.classify_linkedin_match(text, numeric, numeric);

commit;
