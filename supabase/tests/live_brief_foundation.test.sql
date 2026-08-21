begin;

select plan(14);

select has_table('public', 'live_brief_requests', 'live brief requests table exists');
select has_table('public', 'live_brief_scan_runs', 'live brief scan runs table exists');
select has_table('public', 'live_brief_scan_companies', 'live brief scan companies table exists');
select has_table('public', 'live_brief_deliveries', 'live brief deliveries table exists');
select has_table('public', 'live_brief_events', 'live brief events table exists');
select has_table('public', 'live_brief_artifacts', 'live brief artifacts table exists');

select ok((select rowsecurity from pg_tables where schemaname = 'public' and tablename = 'live_brief_requests'), 'live brief requests has RLS enabled');
select ok((select rowsecurity from pg_tables where schemaname = 'public' and tablename = 'live_brief_events'), 'live brief events has RLS enabled');
select ok((select rowsecurity from pg_tables where schemaname = 'public' and tablename = 'live_brief_artifacts'), 'live brief artifacts has RLS enabled');
select ok(not has_table_privilege('authenticated', 'public.live_brief_requests', 'select'), 'authenticated cannot directly read live brief requests');
select ok(not has_table_privilege('authenticated', 'public.live_brief_events', 'insert'), 'authenticated cannot directly append live brief events');
select ok(not has_table_privilege('authenticated', 'public.live_brief_artifacts', 'select'), 'authenticated cannot directly read live brief artifacts');
select ok(not has_function_privilege('anon', 'public.touch_live_brief_request_updated_at()', 'execute'), 'anonymous cannot execute live brief request trigger function');
select ok(not has_function_privilege('authenticated', 'public.prevent_live_brief_event_mutation()', 'execute'), 'authenticated cannot execute live brief event trigger function');

select * from finish();
rollback;