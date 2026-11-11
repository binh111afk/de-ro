-- Admin giai đoạn 4 (Ngân hàng câu hỏi): bảng lưu các câu hỏi chỉnh sửa, ẩn hoặc thêm mới.
-- File tĩnh trong code vẫn làm nền và dự phòng; Supabase chỉ lưu phần thay đổi (overrides).

create table if not exists public.bank_questions (
  id text primary key,
  data jsonb not null,
  status text not null default 'published' check (status in ('published', 'hidden')),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table public.bank_questions enable row level security;

-- Ai cũng đọc (khách và người dùng cần đọc để gộp vào kho câu hỏi của app)
drop policy if exists "Ai cũng đọc ngân hàng câu hỏi" on public.bank_questions;
create policy "Ai cũng đọc ngân hàng câu hỏi" on public.bank_questions for select to anon, authenticated using (true);

-- Không ai ghi qua REST (chỉ service role qua /api/admin)

-- Index theo updated_at để sắp xếp và truy vấn thay đổi mới nhất
create index if not exists bank_questions_updated_at_idx on public.bank_questions (updated_at desc);
