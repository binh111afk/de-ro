-- Thông tin học sinh khi nộp bài (không cần tài khoản): id thiết bị, lớp, số thứ tự.
alter table public.exam_attempts
  add column if not exists device_id text check (device_id is null or char_length(device_id) between 8 and 64),
  add column if not exists class_name text check (class_name is null or char_length(class_name) <= 30),
  add column if not exists seat_no int check (seat_no is null or seat_no between 1 and 999);

create index if not exists exam_attempts_exam_device on public.exam_attempts (exam_id, device_id);

-- Trước khi làm bài: đề có ở cộng đồng không, và thiết bị này đã nộp bài cho đề chưa.
-- Học sinh không đọc được bảng exam_attempts nên cần hàm security definer, chỉ trả hai cờ.
create or replace function public.exam_gate(p_id uuid, p_device text)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'listed', e.listed,
    'attempted', exists (
      select 1 from public.exam_attempts a
      where a.exam_id = e.id and p_device is not null and a.device_id = p_device
    )
  )
  from public.community_exams e
  where e.id = p_id
$$;

grant execute on function public.exam_gate(uuid, text) to anon, authenticated;
