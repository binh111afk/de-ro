-- Link ngắn cho đề đã xuất bản: /d/<mã 6 ký tự>. Mã do DB sinh, chủ đề không tự đặt / đổi được
-- (đề chỉ-link an toàn nhờ link khó đoán). Tra mã → id chỉ qua /api/exam (service role, có giới hạn lượt),
-- không mở RPC cho anon để khỏi dò mã thẳng vào DB.
alter table public.community_exams add column if not exists code text;
create unique index if not exists community_exams_code_key on public.community_exams (code);

-- bảng chữ bỏ 0/o, 1/l/i cho dễ đọc, dễ chép; 6 byte đầu của uuid v4 là ngẫu nhiên
create or replace function public.new_exam_code()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  abc constant text := '23456789abcdefghjkmnpqrstuvwxyz';
  b bytea;
  c text;
begin
  loop
    b := uuid_send(gen_random_uuid());
    c := '';
    for i in 0..5 loop
      c := c || substr(abc, (get_byte(b, i) % length(abc)) + 1, 1);
    end loop;
    exit when not exists (select 1 from public.community_exams e where e.code = c);
  end loop;
  return c;
end;
$$;
revoke all on function public.new_exam_code() from public, anon, authenticated;

create or replace function public.community_exams_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.code is not null then
    new.code := old.code;
  else
    new.code := public.new_exam_code();
  end if;
  return new;
end;
$$;
revoke all on function public.community_exams_code() from public, anon, authenticated;

drop trigger if exists community_exams_code on public.community_exams;
create trigger community_exams_code
  before insert or update on public.community_exams
  for each row execute function public.community_exams_code();

-- đề đã xuất bản trước đây: trigger cấp mã khi cập nhật (từng dòng một để kiểm trùng thấy mã vừa cấp)
do $$
declare
  r record;
begin
  for r in select id from public.community_exams where code is null loop
    update public.community_exams set code = null where id = r.id;
  end loop;
end;
$$;

-- cột mới của bảng này phải cấp SELECT riêng (xem 20261211); RLS vẫn chỉ cho thấy đề công khai và đề của mình
grant select (code) on public.community_exams to anon, authenticated;
