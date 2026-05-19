-- MEU Atlas - suport pentru Admin Tools
-- Ruleaza in Supabase > SQL Editor > New query, o singura data.

create or replace function public.reset_registry_sequence()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform setval('public.registry_sequence', 1, false);
end;
$$;

revoke execute on function public.reset_registry_sequence() from public;
revoke execute on function public.reset_registry_sequence() from anon;
grant execute on function public.reset_registry_sequence() to service_role;
