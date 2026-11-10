-- Admin, bổ sung theo yêu cầu người dùng (phiên 28):
-- 1) "Cộng điểm AI": admin nhập số token cộng thêm, cộng dồn vào số dư của tài khoản (không mất khi sang tháng).
--    Hạn mức hiệu lực = hạn mức tháng + số dư. Dùng vượt hạn mức tháng thì trừ vào số dư.
-- 2) Xoá tài khoản thì đề cộng đồng VẪN GIỮ, chỉ không còn chủ (owner_id = null), như các đề mẫu.

create table if not exists public.ai_credits (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance bigint not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);
alter table public.ai_credits enable row level security;
drop policy if exists "Xem số dư điểm AI của mình" on public.ai_credits;
create policy "Xem số dư điểm AI của mình" on public.ai_credits
  for select to authenticated using (user_id = (select auth.uid()));

-- Admin cộng điểm: cộng dồn nguyên tử, trả số dư mới.
create or replace function public.grant_ai_credits(p_user uuid, p_tokens bigint)
returns bigint
language sql
security definer
set search_path = ''
as $$
  insert into public.ai_credits (user_id, balance) values (p_user, greatest(p_tokens, 0))
  on conflict (user_id) do update
    set balance = public.ai_credits.balance + greatest(excluded.balance, 0), updated_at = now()
  returning balance;
$$;

-- Sau khi cộng token đã dùng: phần vượt hạn mức tháng (p_base) được trả bằng số dư,
-- đồng thời trừ khỏi số đã dùng của tháng, để "đã dùng" không vượt p_base khi còn số dư.
-- Trả về (used, balance) sau khi trừ.
create or replace function public.consume_ai_credits(p_user uuid, p_month text, p_base bigint)
returns table (used bigint, balance bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_used bigint;
  v_bal bigint;
  v_pay bigint;
begin
  select a.tokens into v_used from public.ai_usage a where a.user_id = p_user and a.month = p_month for update;
  select c.balance into v_bal from public.ai_credits c where c.user_id = p_user for update;
  v_used := coalesce(v_used, 0);
  v_bal := coalesce(v_bal, 0);
  v_pay := least(greatest(v_used - p_base, 0), v_bal);
  if v_pay > 0 then
    update public.ai_usage a set tokens = a.tokens - v_pay, updated_at = now() where a.user_id = p_user and a.month = p_month;
    update public.ai_credits c set balance = c.balance - v_pay, updated_at = now() where c.user_id = p_user;
  end if;
  return query select v_used - v_pay, v_bal - v_pay;
end;
$$;

revoke all on function public.grant_ai_credits(uuid, bigint) from public, anon, authenticated;
revoke all on function public.consume_ai_credits(uuid, text, bigint) from public, anon, authenticated;
grant execute on function public.grant_ai_credits(uuid, bigint) to service_role;
grant execute on function public.consume_ai_credits(uuid, text, bigint) to service_role;

-- Giữ đề cộng đồng khi xoá tài khoản
alter table public.community_exams alter column owner_id drop not null;
alter table public.community_exams drop constraint if exists community_exams_owner_id_fkey;
alter table public.community_exams
  add constraint community_exams_owner_id_fkey foreign key (owner_id) references auth.users (id) on delete set null;
