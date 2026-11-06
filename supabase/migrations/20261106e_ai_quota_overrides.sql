-- Ngoại lệ hạn mức AI theo tài khoản: monthly_tokens = null → không giới hạn,
-- số → hạn mức riêng thay cho AI_MONTHLY_TOKENS. Chỉ server (service role) đọc; không ai khác đọc/ghi.
-- Thêm/bỏ ngoại lệ bằng SQL trên dashboard, ví dụ:
--   insert into public.ai_quota_overrides (user_id, note)
--   select id, 'chủ app' from auth.users where email = '<email>';

create table if not exists public.ai_quota_overrides (
  user_id uuid primary key references auth.users (id) on delete cascade,
  monthly_tokens bigint,
  note text,
  created_at timestamptz not null default now()
);

alter table public.ai_quota_overrides enable row level security;
-- không tạo policy nào: anon/authenticated không đọc được, service role bỏ qua RLS
