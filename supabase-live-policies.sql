-- MEU Atlas - politici suplimentare pentru scriere live
-- Ruleaza o singura data in Supabase > SQL Editor > New query.

drop policy if exists "logs update by scope" on public.operational_logs;
create policy "logs update by scope" on public.operational_logs
  for update to authenticated using (
    public.current_access_role() in ('Admin', 'Director', 'HR', 'Safe Person')
    or department = public.current_department_scope()
  )
  with check (
    public.current_access_role() in ('Admin', 'Director', 'HR', 'Safe Person')
    or department = public.current_department_scope()
  );

drop policy if exists "time update by validators" on public.time_entries;
create policy "time update by validators" on public.time_entries
  for update to authenticated using (
    public.current_access_role() in ('Admin', 'Director', 'HR')
    or department = public.current_department_scope()
  )
  with check (
    public.current_access_role() in ('Admin', 'Director', 'HR')
    or department = public.current_department_scope()
  );

drop policy if exists "files update by authenticated" on public.files;
create policy "files update by authenticated" on public.files
  for update to authenticated using (true)
  with check (true);
