-- Trang Admin, giai đoạn 1: phân quyền, nhật ký thao tác, hàm thống kê theo người dùng.
-- Mọi bảng chỉ service role (server/admin.ts) đọc/ghi: bật RLS, không tạo policy nào.
-- Khoá tài khoản dùng ban_duration của Supabase Auth (không cần bảng riêng).
-- Thêm admin bằng SQL trên dashboard:
--   insert into public.user_roles (user_id, role)
--   select id, 'admin' from auth.users where email = '<email>';

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'moderator')),
  created_at timestamptz not null default now()
);
alter table public.user_roles enable row level security;

create table if not exists public.admin_audit (
  id bigint generated always as identity primary key,
  admin_id uuid references auth.users (id) on delete set null,
  action text not null,
  target text,
  detail jsonb,
  created_at timestamptz not null default now()
);
alter table public.admin_audit enable row level security;
create index if not exists admin_audit_created_idx on public.admin_audit (created_at desc);

-- Số đề / slide / token tháng này của một trang người dùng (gọi một lần cho cả trang, không kéo cả bảng).
create or replace function public.admin_user_stats(p_ids uuid[], p_month text)
returns table (user_id uuid, docs bigint, decks bigint, tokens bigint, role text)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id,
         (select count(*) from public.user_items i where i.owner_id = u.id and i.kind = 'doc'),
         (select count(*) from public.user_items i where i.owner_id = u.id and i.kind = 'deck'),
         coalesce((select a.tokens from public.ai_usage a where a.user_id = u.id and a.month = p_month), 0),
         (select r.role from public.user_roles r where r.user_id = u.id)
  from unnest(p_ids) as u(id);
$$;

revoke all on function public.admin_user_stats(uuid[], text) from public, anon, authenticated;
grant execute on function public.admin_user_stats(uuid[], text) to service_role;
