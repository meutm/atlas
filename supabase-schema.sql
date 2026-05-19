-- MEU Atlas - schema initiala Supabase
-- Ruleaza acest fisier in Supabase > SQL Editor > New query.

create table if not exists public.members (
  id text primary key,
  name text not null,
  email text,
  department text not null,
  primary_role text not null,
  manager text,
  access_level text not null default 'Head',
  safe_person boolean not null default false,
  status text not null default 'Activ',
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  role text not null check (role in ('Admin', 'Director', 'HR', 'Safe Person', 'Coordonator', 'Head', 'Membru')),
  member_id text references public.members(id),
  department_scope text not null default 'Comunicare',
  status text not null default 'Activ',
  created_at timestamptz not null default now()
);

create table if not exists public.role_assignments (
  id bigint generated always as identity primary key,
  department text not null,
  title text not null,
  member_id text references public.members(id),
  safe_person boolean not null default false,
  status text not null default 'Ocupat'
);

create table if not exists public.tasks (
  id text primary key,
  title text not null,
  description text,
  department text not null,
  owner_id text references public.members(id),
  status text not null default 'De facut',
  priority text not null default 'Normala',
  deadline date,
  blocker boolean not null default false,
  blocker_text text,
  evidence_url text,
  related_log_id text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.operational_logs (
  id text primary key,
  submitted_by text references public.members(id),
  department text not null,
  type text not null,
  title text not null,
  narrative text not null,
  related_task_id text references public.tasks(id),
  needs_follow_up boolean not null default false,
  follow_up_owner_id text references public.members(id),
  deadline date,
  urgency text not null default 'Normala',
  evidence_url text,
  visibility text not null default 'Echipa',
  status text not null default 'Nou',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.time_entries (
  id text primary key,
  member_id text references public.members(id),
  work_date date not null,
  department text not null,
  activity text not null,
  related_task_id text references public.tasks(id),
  related_log_id text references public.operational_logs(id),
  hours numeric(5,2) not null check (hours > 0),
  notes text,
  validation_status text not null default 'In asteptare',
  validated_by text references public.members(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.risks (
  id text primary key,
  category text not null,
  description text not null,
  severity text not null default 'Normala',
  owner_id text references public.members(id),
  mitigation text,
  visibility text not null default 'Leadership',
  status text not null default 'Deschis',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.files (
  id text primary key,
  uploaded_by text references public.members(id),
  related_type text not null,
  related_id text not null,
  title text not null,
  file_type text not null,
  drive_url text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create or replace function public.current_access_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.current_department_scope()
returns text
language sql
security definer
set search_path = public
as $$
  select department_scope from public.profiles where id = auth.uid()
$$;

alter table public.members enable row level security;
alter table public.profiles enable row level security;
alter table public.role_assignments enable row level security;
alter table public.tasks enable row level security;
alter table public.operational_logs enable row level security;
alter table public.time_entries enable row level security;
alter table public.risks enable row level security;
alter table public.files enable row level security;

create policy "profiles own select" on public.profiles
  for select to authenticated using (id = auth.uid() or public.current_access_role() in ('Admin', 'Director', 'HR'));

create policy "admin manage profiles" on public.profiles
  for all to authenticated using (public.current_access_role() = 'Admin')
  with check (public.current_access_role() = 'Admin');

create policy "members visible by role" on public.members
  for select to authenticated using (
    public.current_access_role() in ('Admin', 'Director', 'HR')
    or department = public.current_department_scope()
  );

create policy "admin manage members" on public.members
  for all to authenticated using (public.current_access_role() = 'Admin')
  with check (public.current_access_role() = 'Admin');

create policy "role assignments visible" on public.role_assignments
  for select to authenticated using (true);

create policy "admin manage role assignments" on public.role_assignments
  for all to authenticated using (public.current_access_role() = 'Admin')
  with check (public.current_access_role() = 'Admin');

create policy "tasks visible by scope" on public.tasks
  for select to authenticated using (
    public.current_access_role() in ('Admin', 'Director')
    or department = public.current_department_scope()
    or public.current_access_role() in ('HR', 'Safe Person') and department = 'Resurse Umane'
  );

create policy "tasks write by authenticated" on public.tasks
  for insert to authenticated with check (true);

create policy "tasks update by scope" on public.tasks
  for update to authenticated using (
    public.current_access_role() in ('Admin', 'Director')
    or department = public.current_department_scope()
  );

create policy "logs visible by scope" on public.operational_logs
  for select to authenticated using (
    public.current_access_role() in ('Admin', 'Director')
    or visibility <> 'Restrictionat'
    or public.current_access_role() in ('HR', 'Safe Person')
  );

create policy "logs insert by authenticated" on public.operational_logs
  for insert to authenticated with check (true);

create policy "time visible by role" on public.time_entries
  for select to authenticated using (
    public.current_access_role() in ('Admin', 'Director', 'HR')
    or department = public.current_department_scope()
  );

create policy "time insert by authenticated" on public.time_entries
  for insert to authenticated with check (true);

create policy "risks restricted visible" on public.risks
  for select to authenticated using (public.current_access_role() in ('Admin', 'Director', 'HR', 'Safe Person'));

create policy "risks write restricted" on public.risks
  for all to authenticated using (public.current_access_role() in ('Admin', 'Director', 'HR', 'Safe Person'))
  with check (public.current_access_role() in ('Admin', 'Director', 'HR', 'Safe Person'));

create policy "files visible by authenticated" on public.files
  for select to authenticated using (true);

create policy "files insert by authenticated" on public.files
  for insert to authenticated with check (true);
