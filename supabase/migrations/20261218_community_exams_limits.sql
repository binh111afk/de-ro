-- Strix 21/11: community_exams ghi thẳng qua PostgREST không có trần dung lượng / số dòng.
-- Người dùng thường: doc tối đa 2 MB, tối đa 300 đề mỗi chủ. Service role (admin, server) không bị chặn.
create or replace function public.community_exams_limits()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if octet_length(new.doc::text) > 2 * 1024 * 1024 then
    raise exception 'Đề quá lớn (tối đa 2 MB).' using errcode = '54000';
  end if;
  if tg_op = 'INSERT' and (select count(*) from public.community_exams e where e.owner_id = new.owner_id) >= 300 then
    raise exception 'Đã đạt số đề tối đa.' using errcode = '54000';
  end if;
  return new;
end;
$$;
revoke all on function public.community_exams_limits() from public, anon, authenticated;

drop trigger if exists community_exams_limits on public.community_exams;
create trigger community_exams_limits
  before insert or update on public.community_exams
  for each row execute function public.community_exams_limits();
