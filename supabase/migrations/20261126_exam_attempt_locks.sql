-- Strix lần 3, mục 1: đề "chỉ làm một lần" khoá nguyên tử theo tài khoản.
-- Server (service role) insert vào bảng khoá TRƯỚC khi chấm; trùng khoá chính = đã nộp.
-- Không còn dựa vào device_id (trình duyệt tự đặt) để quyết định.

create table if not exists public.exam_attempt_locks (
  exam_id uuid not null references public.community_exams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (exam_id, user_id)
);

alter table public.exam_attempt_locks enable row level security;
revoke all on public.exam_attempt_locks from anon, authenticated;

-- dòng cũ: ai đã nộp đề một lần bằng tài khoản thì coi như đã khoá
insert into public.exam_attempt_locks (exam_id, user_id, created_at)
select a.exam_id, a.user_id, min(a.created_at)
from public.exam_attempts a
join public.community_exams e on e.id = a.exam_id
where a.user_id is not null and coalesce((e.doc -> 'online' -> 'settings' ->> 'oneAttempt')::boolean, false)
group by a.exam_id, a.user_id
on conflict do nothing;

-- exam_gate: "đã nộp" theo tài khoản đang đăng nhập (auth.uid()); mã thiết bị chỉ còn để báo sớm cho khách
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
      select 1 from public.exam_attempt_locks l
      where l.exam_id = e.id and l.user_id = auth.uid()
    ) or exists (
      select 1 from public.exam_attempts a
      where a.exam_id = e.id and p_device is not null and a.device_id = p_device
    )
  )
  from public.community_exams e
  where e.id = p_id
$$;

grant execute on function public.exam_gate(uuid, text) to anon, authenticated;
