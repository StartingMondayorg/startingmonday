begin;

select plan(3);

select ok(
  not exists (
    select 1
    from pg_tables
    where schemaname = 'public'
      and not rowsecurity
  ),
  'every public table has row-level security enabled'
);

select ok(
  not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname ~ '^(perform_|record_|approve_|finalize_|import_)'
      and has_function_privilege('anon', p.oid, 'execute')
  ),
  'anonymous role cannot execute privileged public functions'
);

select ok(
  not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname ~ '^(perform_|record_|approve_|finalize_|import_)'
      and has_function_privilege('authenticated', p.oid, 'execute')
  ),
  'authenticated role cannot execute service-role-only public functions'
);

select * from finish();
rollback;