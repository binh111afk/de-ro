-- Hoàn token cho lượt AI trả kết quả không dùng được (JSON hỏng, thiếu nội dung…).
-- Server cấp "biên nhận" ký HMAC cho mỗi lượt thành công; client gửi lại biên nhận khi gọi lại.
-- Mỗi biên nhận chỉ hoàn được một lần (khoá chính), tối đa 20 lần hoàn / người / ngày để chặn lạm dụng.

create table if not exists public.ai_refunds (
  receipt text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  tokens bigint not null check (tokens >= 0),
  created_at timestamptz not null default now()
);

alter table public.ai_refunds enable row level security;
create index if not exists ai_refunds_user_day_idx on public.ai_refunds (user_id, created_at desc);

-- Trả số token đã dùng mới; null = không hoàn (biên nhận đã dùng hoặc quá số lần trong ngày).
create or replace function public.refund_ai_usage(p_user uuid, p_month text, p_receipt text, p_tokens bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_used bigint;
begin
  if (select count(*) from public.ai_refunds r
       where r.user_id = p_user and r.created_at > now() - interval '1 day') >= 20 then
    return null;
  end if;
  insert into public.ai_refunds (receipt, user_id, tokens)
  values (p_receipt, p_user, greatest(p_tokens, 0))
  on conflict (receipt) do nothing;
  if not found then
    return null;
  end if;
  update public.ai_usage a
     set tokens = greatest(a.tokens - greatest(p_tokens, 0), 0), updated_at = now()
   where a.user_id = p_user and a.month = p_month
  returning a.tokens into v_used;
  return v_used;
end;
$$;

revoke all on function public.refund_ai_usage(uuid, text, text, bigint) from public, anon, authenticated;
grant execute on function public.refund_ai_usage(uuid, text, text, bigint) to service_role;
