-- Lịch sử điểm AI được cộng (trang Hồ sơ): mỗi lần cộng điểm ghi một dòng.
-- kind: 'welcome' (quà chào mừng), 'admin' (quản trị viên tặng); sau này thêm 'checkin' (điểm danh)…
-- Hoàn điểm khi AI trả kết quả lỗi KHÔNG ghi vào đây (người dùng chọn không hiện).
-- Không ghi bù cho tài khoản nhận quà trước khi có bảng này.

create table if not exists public.ai_credit_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind ~ '^[a-z_]{1,32}$'),
  tokens bigint not null check (tokens > 0),
  created_at timestamptz not null default now()
);
create index if not exists ai_credit_events_user_idx on public.ai_credit_events (user_id, created_at desc);

alter table public.ai_credit_events enable row level security;
drop policy if exists "Xem lịch sử điểm AI của mình" on public.ai_credit_events;
create policy "Xem lịch sử điểm AI của mình" on public.ai_credit_events
  for select to authenticated using (user_id = (select auth.uid()));
-- chỉ hàm security definer (service_role) được ghi
revoke insert, update, delete on public.ai_credit_events from anon, authenticated;

-- Quà chào mừng: ghi lịch sử chỉ khi thật sự vừa tặng (lần đầu có dòng số dư).
create or replace function public.claim_ai_welcome(p_user uuid, p_tokens bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bal bigint;
begin
  insert into public.ai_credits (user_id, balance) values (p_user, greatest(p_tokens, 0))
  on conflict (user_id) do nothing;
  if found and p_tokens > 0 then
    insert into public.ai_credit_events (user_id, kind, tokens) values (p_user, 'welcome', p_tokens);
  end if;
  select c.balance into v_bal from public.ai_credits c where c.user_id = p_user;
  return coalesce(v_bal, 0);
end;
$$;

revoke all on function public.claim_ai_welcome(uuid, bigint) from public, anon, authenticated;
grant execute on function public.claim_ai_welcome(uuid, bigint) to service_role;

-- Admin cộng điểm: cộng dồn nguyên tử + ghi lịch sử, trả số dư mới.
create or replace function public.grant_ai_credits(p_user uuid, p_tokens bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bal bigint;
begin
  insert into public.ai_credits (user_id, balance) values (p_user, greatest(p_tokens, 0))
  on conflict (user_id) do update
    set balance = public.ai_credits.balance + greatest(excluded.balance, 0), updated_at = now()
  returning balance into v_bal;
  if p_tokens > 0 then
    insert into public.ai_credit_events (user_id, kind, tokens) values (p_user, 'admin', p_tokens);
  end if;
  return v_bal;
end;
$$;

revoke all on function public.grant_ai_credits(uuid, bigint) from public, anon, authenticated;
grant execute on function public.grant_ai_credits(uuid, bigint) to service_role;
