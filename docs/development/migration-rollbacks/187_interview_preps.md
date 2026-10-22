# 187_interview_preps rollback

Goal:
- Revert the interview-prep worksheet persistence layer (interview_preps
  table, its RLS policies, and the updated_at trigger) if worksheet writes
  misbehave, an RLS regression exposes rows across users, or the
  `/prep/interview` page query degrades.

Risk triggers:
- Prep rows visible to the wrong user (RLS policy regression).
- Unbounded `answers` jsonb payloads bloating storage. The server action
  caps each of the six answers at 4,000 characters and the role fields at
  200, so growth beyond that indicates writes bypassing the action.
- The updated_at trigger interfering with bulk maintenance updates.

Pre-rollback safety checks:
- Export the table first - preps are user-entered content and cannot be
  regenerated:
  `select * from public.interview_preps` (CSV via Supabase dashboard).
- Confirm the app tolerates the table being absent: the only consumers are
  `src/app/(dashboard)/prep/interview/page.tsx` (renders an empty list when
  the select errors) and `src/app/(dashboard)/prep/interview/actions.ts`
  (redirects to `/prep/interview?error=save` on write failure). The
  dashboard shell is unaffected.
- No cron jobs, workers, API routes, or other tables reference
  interview_preps.

Rollback SQL:
```sql
DROP TRIGGER IF EXISTS interview_preps_set_updated_at ON public.interview_preps;
DROP FUNCTION IF EXISTS public.set_interview_preps_updated_at();
DROP TABLE IF EXISTS public.interview_preps;
```

Validation queries:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'interview_preps';

SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'set_interview_preps_updated_at';

-- Both should return zero rows if rollback succeeded
```

Forward-fix plan:
- Re-apply migration 187 in staging after correcting the policy or
  payload issue, validate RLS with two test users (each sees only their
  own preps on `/prep/interview`), then re-apply to prod and restore
  exported rows if user data was dropped.
