-- Điểm do server chấm (api/attempt, dùng service role): trình duyệt không được ghi thẳng bảng nữa,
-- tránh việc ai có link đề cũng tự khai điểm tuyệt đối.
drop policy if exists "Ai cũng nộp được bài" on public.exam_attempts;
revoke insert, update, delete on public.exam_attempts from anon, authenticated;
