-- Restrict usage and rate-limit RPCs to the service role (step 2 of 2).
--
-- APPLY ONLY AFTER the code from the same PR is serving in that environment:
-- src/lib/api-usage.ts and src/app/api/optimize/route.ts now call these functions
-- through the service role. Applying this earlier makes /api/optimize return 429
-- for every visitor and stops usage tracking for signed-in AI requests.
--
-- After this step no anon or authenticated client can raise another user's usage
-- (increment_api_usage takes any user id) or another caller's rate-limit counter.

revoke execute on function public.check_and_increment_rate_limit(text, text, integer)
from public, anon, authenticated;

revoke execute on function
  public.get_rate_limit_count(text, text),
  public.increment_api_usage(uuid, text, text, integer, integer)
from authenticated;

grant execute on function
  public.check_and_increment_rate_limit(text, text, integer),
  public.get_rate_limit_count(text, text),
  public.increment_api_usage(uuid, text, text, integer, integer)
to service_role;
