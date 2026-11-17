-- Wijha security fix 01: protect conversation read acknowledgements.
-- REVIEWED DRAFT ONLY. Do not run on production until staging role tests pass.
-- Existing signature and return type retained for current browser integrations.
create or replace function public.wijha_mark_read(p_thread uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_company uuid;
  v_is_admin boolean;
  v_is_client boolean;
begin
  if v_uid is null or p_thread is null then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select role::text, company_id
    into v_role, v_company
    from public.profiles
   where id = v_uid and coalesce(is_active, true);

  if not found then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  v_is_admin := v_role in ('admin', 'wijha_admin');
  v_is_client := v_role = 'client';

  if not exists (
    select 1 from public.wijha_threads t
    where t.id = p_thread
      and (
        (v_is_client and t.client_id = v_uid)
        or (not v_is_client and v_is_admin)
        or (not v_is_client and v_company is not null and t.company_id = v_company)
      )
  ) then
    raise exception 'Not authorized for this conversation' using errcode = '42501';
  end if;

  if v_is_client then
    update public.wijha_threads
       set client_unread = 0
     where id = p_thread and client_id = v_uid;

    update public.wijha_messages
       set read_at = now()
     where thread_id = p_thread
       and read_at is null
       and sender_id <> v_uid
       and sender_role <> 'client';
  else
    update public.wijha_threads
       set company_unread = 0
     where id = p_thread;

    update public.wijha_messages
       set read_at = now()
     where thread_id = p_thread
       and read_at is null
       and sender_id <> v_uid
       and sender_role = 'client';
  end if;
end;
$$;

revoke all on function public.wijha_mark_read(uuid) from public, anon;
grant execute on function public.wijha_mark_read(uuid) to authenticated;

-- Regression tests required before applying:
-- 1. Anonymous call: permission denied.
-- 2. Client A reading Client B's thread: permission denied, no row updates.
-- 3. Company A reading Company B's thread: permission denied, no row updates.
-- 4. Client and assigned agency read their own thread: only intended unread counters and messages updated.
-- 5. Disabled profile: permission denied.
-- 6. Administrator access: approved behavior and correct unread side confirmed.
