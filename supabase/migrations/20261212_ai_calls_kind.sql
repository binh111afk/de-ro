-- Gán nhãn từng lượt gọi AI để theo dõi chi phí theo người dùng và theo loại việc.
-- kind: task-doc, question, task-slide, edit-slide, image, vision-source...  (xem aiKind() trong server/ops.ts)
-- billed: số token đã tính vào hạn mức của người dùng cho lượt này (chỉ có ở dòng thành công; 1 điểm = 1.000 token).
alter table public.ai_calls add column if not exists kind text;
alter table public.ai_calls add column if not exists billed integer;

create index if not exists ai_calls_user_kind_idx on public.ai_calls (user_id, kind, created_at desc);
