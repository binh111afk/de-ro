-- Sửa theo báo cáo pentest:
-- 1) Hạn mức AI: giữ chỗ nguyên tử trước khi gọi model, để nhiều request cùng lúc không cùng lọt qua bước kiểm tra.
-- 2) Nhật ký: xoá tài khoản không được xoá dấu vết người đã thao tác.

alter table public.ai_usage
  add column if not exists reserved bigint not null default 0 check (reserved >= 0),
  add column if not exists reserved_at timestamptz;

-- true = được gọi AI (đã giữ chỗ p_amount). Còn hạn mức thì cho, nên vượt tối đa khoảng một request.
-- Chỗ giữ cũ hơn 6 phút (quá thời gian tối đa của function) coi như function đã chết, bỏ đi.
create or replace function public.reserve_ai_quota(p_user uuid, p_month text, p_limit bigint, p_amount bigint)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.ai_usage%rowtype;
  v_held bigint;
begin
  insert into public.ai_usage (user_id, month) values (p_user, p_month) on conflict (user_id, month) do nothing;
  select * into v from public.ai_usage a where a.user_id = p_user and a.month = p_month for update;
  v_held := case when v.reserved_at is null or v.reserved_at < now() - interval '6 minutes' then 0 else v.reserved end;
  if v.tokens + v_held >= p_limit then
    return false;
  end if;
  update public.ai_usage a
     set reserved = v_held + greatest(p_amount, 0), reserved_at = now()
   where a.user_id = p_user and a.month = p_month;
  return true;
end;
$$;

create or replace function public.release_ai_quota(p_user uuid, p_month text, p_amount bigint)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.ai_usage a
     set reserved = greatest(a.reserved - greatest(p_amount, 0), 0)
   where a.user_id = p_user and a.month = p_month;
$$;

revoke all on function public.reserve_ai_quota(uuid, text, bigint, bigint) from public, anon, authenticated;
revoke all on function public.release_ai_quota(uuid, text, bigint) from public, anon, authenticated;
grant execute on function public.reserve_ai_quota(uuid, text, bigint, bigint) to service_role;
grant execute on function public.release_ai_quota(uuid, text, bigint) to service_role;

-- Giữ nguyên id người thao tác kể cả khi tài khoản đó đã bị xoá.
alter table public.admin_audit drop constraint if exists admin_audit_admin_id_fkey;
alter table public.community_exams drop constraint if exists community_exams_moderated_by_fkey;
