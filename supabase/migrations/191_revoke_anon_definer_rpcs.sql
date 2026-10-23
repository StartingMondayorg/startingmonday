-- Close anonymous access to SECURITY DEFINER functions (step 1 of 2).
--
-- On 2026-10-22 the production catalog showed ten public SECURITY DEFINER
-- functions executable by anon (default EXECUTE to PUBLIC). Anyone holding the
-- public anon key could call them through PostgREST (/rest/v1/rpc/...), e.g.
-- take the worker's advisory locks (blocking briefings and scans), raise any
-- user's API usage, or claim ops-agent incidents.
--
-- This step is safe to apply before any code deploys:
-- - Worker-only and webhook-only functions (advisory locks, ops-agent incident and
--   budget, the auth.users trigger function) become service_role only. All callers
--   use the service role (worker/, webhooks/slack). Trigger functions do not need
--   EXECUTE for the triggering role.
-- - get_rate_limit_count, increment_api_usage and create_feedback_item keep an explicit
--   grant to authenticated (signed-in request clients still call them until the code
--   that routes them through the service role is deployed).
-- - check_and_increment_rate_limit is deliberately left as-is here: the unauthenticated
--   /api/optimize endpoint calls it with the anon client until its fix is deployed.
--   Migration 192 closes it.
--
-- Functions are skipped when absent (staging lacked migration 1681's functions on
-- 2026-10-22), so this applies cleanly in every environment.

do $$
declare
  fn text;
begin
  -- service_role only
  foreach fn in array array[
    'public.try_advisory_lock(bigint)',
    'public.advisory_unlock(bigint)',
    'public.claim_agent_incident(text, text, text, text, text, jsonb)',
    'public.consume_agent_dispatch_budget(integer)',
    'public.check_distributed_rate_limit(text, integer, integer)',
    'public.handle_new_auth_user()'
  ] loop
    if to_regprocedure(fn) is not null then
      execute format('revoke execute on function %s from public, anon, authenticated', fn);
      execute format('grant execute on function %s to service_role', fn);
    end if;
  end loop;

  -- signed-in clients keep access for now; anon loses it
  foreach fn in array array[
    'public.get_rate_limit_count(text, text)',
    'public.increment_api_usage(uuid, text, text, integer, integer)',
    'public.create_feedback_item(text, text, text, text)'
  ] loop
    if to_regprocedure(fn) is not null then
      execute format('revoke execute on function %s from public, anon', fn);
      execute format('grant execute on function %s to authenticated, service_role', fn);
    end if;
  end loop;

  if to_regprocedure('public.check_and_increment_rate_limit(text, text, integer)') is not null then
    execute 'grant execute on function public.check_and_increment_rate_limit(text, text, integer) to service_role';
  end if;
end
$$;
