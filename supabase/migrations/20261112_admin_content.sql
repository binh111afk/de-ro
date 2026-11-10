-- Admin giai đoạn 3 (Nội dung): đề cộng đồng, báo cáo vi phạm, tài liệu và góp ý.
-- Xem docs/prompt-admin-content.md.

-- 1. community_exams: thêm trạng thái kiểm duyệt, lý do gỡ và người kiểm duyệt.
alter table public.community_exams
  add column if not exists status text not null default 'published' check (status in ('published', 'hidden', 'removed')),
  add column if not exists removed_reason text,
  add column if not exists moderated_by uuid references auth.users (id) on delete set null,
  add column if not exists moderated_at timestamptz;

create index if not exists community_exams_status_idx on public.community_exams (status);

-- Sửa policy đọc: chỉ đề status='published' hiện cho người khác (chủ đề vẫn thấy đề của mình).
drop policy if exists "Xem đề cộng đồng và đề của mình" on public.community_exams;
create policy "Xem đề cộng đồng và đề của mình" on public.community_exams
  for select to anon, authenticated
  using ((listed and status = 'published') or owner_id = (select auth.uid()));

-- get_shared_exam: từ chối đề removed; đề chỉ-link không kèm đáp án (học sinh mở qua api/exam).
create or replace function public.get_shared_exam(p_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select doc from public.community_exams
  where id = p_id
    and status <> 'removed'
    and ((listed and status = 'published') or owner_id = (select auth.uid()));
$$;

-- 2. reports: báo cáo vi phạm đề thi.
create table if not exists public.reports (
  id bigint generated always as identity primary key,
  exam_id uuid not null references public.community_exams (id) on delete cascade,
  reporter_id uuid references auth.users (id) on delete set null,
  reason text not null check (char_length(reason) <= 100),
  detail text check (detail is null or char_length(detail) <= 1000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_by uuid references auth.users (id) on delete set null,
  resolved_at timestamptz
);

alter table public.reports enable row level security;
create index if not exists reports_exam_id_idx on public.reports (exam_id);
create index if not exists reports_status_idx on public.reports (status, created_at desc);

-- RLS reports: người đã đăng nhập được insert báo cáo của chính mình; không ai đọc qua REST (chỉ service role).
drop policy if exists "reports_insert_authenticated" on public.reports;
create policy "reports_insert_authenticated" on public.reports
  for insert to authenticated
  with check (auth.uid() = reporter_id);

-- 3. feedback: hòm thư góp ý của người dùng.
create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  email text check (email is null or char_length(email) <= 255),
  message text not null check (char_length(message) <= 2000),
  page text check (page is null or char_length(page) <= 500),
  created_at timestamptz not null default now(),
  read boolean not null default false
);

alter table public.feedback enable row level security;
create index if not exists feedback_created_at_idx on public.feedback (created_at desc);

-- RLS feedback: ai cũng insert (kể cả khách), không ai đọc qua REST (chỉ service role).
drop policy if exists "feedback_insert_all" on public.feedback;
create policy "feedback_insert_all" on public.feedback
  for insert to anon, authenticated
  with check (true);
