-- Tín hiệu người dùng không hài lòng với AI (việc 4 phiên 46): bấm 👎, Ctrl+Z ngay sau khi AI sửa đề,
-- gửi lại yêu cầu gần giống, nói "sai rồi". Gom thành bộ ca thử, chạy lại mỗi lần đổi prompt.
-- Chỉ server (service role, POST /api/quota) ghi; không ai đọc qua API công khai.
create table if not exists public.ai_feedback (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  kind text not null check (kind in ('up', 'down', 'undo', 'resend', 'complaint')),
  mode text not null default 'exam' check (mode in ('exam', 'slide', 'board')),
  request text not null default '',
  reply text not null default '',
  context text not null default '',
  note text not null default '',
  created_at timestamptz not null default now()
);
alter table public.ai_feedback enable row level security;
create index if not exists ai_feedback_created_at_idx on public.ai_feedback (created_at desc);
