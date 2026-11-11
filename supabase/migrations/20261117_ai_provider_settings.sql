-- Cấu hình provider AI sửa từ trang admin: model, endpoint, API key (đã mã hoá bằng AI_SETTINGS_SECRET).
-- Bật RLS và không có policy nào: chỉ service role ở server đọc/ghi được.
create table if not exists public.ai_provider_settings (
  provider text primary key,
  model text,
  base_url text,
  api_key_enc text,
  updated_at timestamptz not null default now()
);

alter table public.ai_provider_settings enable row level security;
revoke all on public.ai_provider_settings from anon, authenticated;
