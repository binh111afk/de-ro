-- Bảng exam_attempts (tên, lớp, số báo danh, điểm, mã thiết bị của học sinh): trước đây RLS chỉ bật bằng tay
-- trên dashboard, chưa có trong migration. Ghi lại cho chắc: chỉ chủ đề đọc được bài làm của đề mình;
-- ghi chỉ qua api/attempt (service role).
alter table public.exam_attempts enable row level security;

revoke select, insert, update, delete on public.exam_attempts from anon;
revoke insert, update, delete on public.exam_attempts from authenticated;
grant select on public.exam_attempts to authenticated;

-- policy cùng nội dung tạo tay trên dashboard: thay bằng bản có trong migration
drop policy if exists "Chủ đề xem bài làm" on public.exam_attempts;
drop policy if exists exam_attempts_select_exam_owner on public.exam_attempts;
create policy exam_attempts_select_exam_owner on public.exam_attempts
  for select to authenticated
  using (exists (
    select 1 from public.community_exams e
    where e.id = exam_attempts.exam_id and e.owner_id = (select auth.uid())
  ));
