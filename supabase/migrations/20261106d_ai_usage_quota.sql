-- Hạn mức AI theo tài khoản: số token đã dùng mỗi tháng (tháng dạng 'YYYY-MM', giờ UTC).
-- Chỉ server ghi (service role, qua hàm add_ai_usage); người dùng chỉ đọc được dòng của mình.

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  month text not null,
  tokens bigint not null default 0,
  requests integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, month)
);

alter table public.ai_usage enable row level security;

drop policy if exists "Xem hạn mức AI của mình" on public.ai_usage;
create policy "Xem hạn mức AI của mình" on public.ai_usage
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Cộng dồn nguyên tử (nhiều request cùng lúc không ghi đè nhau), trả về tổng mới.
create or replace function public.add_ai_usage(p_user uuid, p_month text, p_tokens bigint)
returns bigint
language sql
security definer
set search_path = ''
as $$
  insert into public.ai_usage (user_id, month, tokens, requests)
  values (p_user, p_month, greatest(p_tokens, 0), 1)
  on conflict (user_id, month) do update
    set tokens = public.ai_usage.tokens + greatest(excluded.tokens, 0),
        requests = public.ai_usage.requests + 1,
        updated_at = now()
  returning tokens;
$$;

revoke all on function public.add_ai_usage(uuid, text, bigint) from public, anon, authenticated;
grant execute on function public.add_ai_usage(uuid, text, bigint) to service_role;
