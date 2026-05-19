-- MEU Atlas - Registratura, realtime si rol Head
-- Ruleaza in Supabase > SQL Editor > New query.

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('Admin', 'Director', 'HR', 'Safe Person', 'Coordonator', 'Head', 'Membru'));

update public.profiles
set role = 'Head'
where role = 'Membru';

update public.profiles set department_scope = 'Logistică' where department_scope = 'Logistica';
update public.profiles set department_scope = 'Suport Instituțional' where department_scope = 'Suport Institutional';

update public.members set department = 'Logistică' where department = 'Logistica';
update public.members set department = 'Suport Instituțional' where department = 'Suport Institutional';

update public.role_assignments set department = 'Logistică' where department = 'Logistica';
update public.role_assignments set department = 'Suport Instituțional' where department = 'Suport Institutional';

update public.tasks set department = 'Logistică' where department = 'Logistica';
update public.tasks set department = 'Suport Instituțional' where department = 'Suport Institutional';

update public.operational_logs set department = 'Logistică' where department = 'Logistica';
update public.operational_logs set department = 'Suport Instituțional' where department = 'Suport Institutional';

update public.time_entries set department = 'Logistică' where department = 'Logistica';
update public.time_entries set department = 'Suport Instituțional' where department = 'Suport Institutional';

update public.risks set category = 'Logistică' where category = 'Logistica';

create sequence if not exists public.registry_sequence start 1 increment 1;

create table if not exists public.registry_entries (
  id uuid primary key default gen_random_uuid(),
  registry_number text unique not null,
  sequence_number integer unique not null,
  document_date date not null default current_date,
  title text not null,
  summary text not null,
  document_type text not null default 'Document',
  direction text not null default 'Intern',
  department text,
  requester_id text references public.members(id),
  external_party text,
  status text not null default 'Inregistrat',
  file_url text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.registry_history (
  id bigint generated always as identity primary key,
  registry_entry_id uuid not null references public.registry_entries(id) on delete cascade,
  action text not null,
  note text,
  actor_id text references public.members(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

do $$
declare
  v_max_sequence integer;
  v_last_sequence integer;
  v_sequence_called boolean;
begin
  select coalesce(max(sequence_number), 0)
    into v_max_sequence
  from public.registry_entries;

  select last_value, is_called
    into v_last_sequence, v_sequence_called
  from public.registry_sequence;

  if v_max_sequence > v_last_sequence then
    perform setval('public.registry_sequence', v_max_sequence, true);
  elsif v_max_sequence = 0 and v_last_sequence = 1 and not v_sequence_called then
    perform setval('public.registry_sequence', 1, false);
  end if;
end $$;

alter table public.registry_entries enable row level security;
alter table public.registry_history enable row level security;

drop policy if exists "registry visible authenticated" on public.registry_entries;
create policy "registry visible authenticated" on public.registry_entries
  for select to authenticated using (true);

drop policy if exists "registry insert authenticated" on public.registry_entries;
-- Entries are inserted only through create_registry_entry(), so numbering stays atomic.

drop policy if exists "registry update by scope" on public.registry_entries;
create policy "registry update by scope" on public.registry_entries
  for update to authenticated using (
    public.current_access_role() in ('Admin', 'Director', 'HR', 'Safe Person', 'Coordonator', 'Head', 'Membru')
  )
  with check (
    public.current_access_role() in ('Admin', 'Director', 'HR', 'Safe Person', 'Coordonator', 'Head', 'Membru')
  );

drop policy if exists "registry history visible authenticated" on public.registry_history;
create policy "registry history visible authenticated" on public.registry_history
  for select to authenticated using (true);

drop policy if exists "registry history insert authenticated" on public.registry_history;
create policy "registry history insert authenticated" on public.registry_history
  for insert to authenticated with check (true);

create or replace function public.create_registry_entry(
  p_title text,
  p_summary text,
  p_document_type text,
  p_direction text,
  p_department text,
  p_requester_id text,
  p_external_party text,
  p_document_date date,
  p_file_url text
)
returns public.registry_entries
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sequence integer;
  v_entry public.registry_entries;
  v_registry_number text;
begin
  v_sequence := nextval('public.registry_sequence');
  v_registry_number := 'MEUTM/' || lpad(v_sequence::text, 4, '0') || '/' || to_char(coalesce(p_document_date, current_date), 'DD.MM.YYYY');

  insert into public.registry_entries (
    registry_number,
    sequence_number,
    document_date,
    title,
    summary,
    document_type,
    direction,
    department,
    requester_id,
    external_party,
    file_url,
    created_by
  )
  values (
    v_registry_number,
    v_sequence,
    coalesce(p_document_date, current_date),
    p_title,
    p_summary,
    p_document_type,
    p_direction,
    p_department,
    nullif(p_requester_id, ''),
    nullif(p_external_party, ''),
    nullif(p_file_url, ''),
    auth.uid()
  )
  returning * into v_entry;

  insert into public.registry_history (
    registry_entry_id,
    action,
    note,
    actor_id,
    created_by
  )
  values (
    v_entry.id,
    'Numar generat',
    'Numar de inregistrare alocat automat.',
    nullif(p_requester_id, ''),
    auth.uid()
  );

  return v_entry;
end;
$$;

revoke execute on function public.create_registry_entry(text, text, text, text, text, text, text, date, text) from public;
revoke execute on function public.create_registry_entry(text, text, text, text, text, text, text, date, text) from anon;
grant execute on function public.create_registry_entry(text, text, text, text, text, text, text, date, text) to authenticated;

do $$
declare
  table_name text;
  table_names text[] := array[
    'tasks',
    'operational_logs',
    'time_entries',
    'risks',
    'files',
    'members',
    'profiles',
    'role_assignments',
    'registry_entries',
    'registry_history'
  ];
begin
  foreach table_name in array table_names loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;
