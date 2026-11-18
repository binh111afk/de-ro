-- Strix 7 (bản chạy dethinhbien_3c45)
-- 1. Hạn mức báo cáo / góp ý đếm theo created_at mà client tự điền được (gửi ngày cũ là cửa sổ đếm luôn rỗng):
--    trigger tự đặt created_at = now() trước khi đếm.
-- 2. Đề đang có báo cáo chờ xử lý: chủ đề không sửa / ẩn được (giữ nguyên bằng chứng cho kiểm duyệt viên).

-- 1 ------------------------------------------------------------------------------------------------------
create or replace function public.limit_reports()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.created_at := now();
  if coalesce((select auth.role()), '') = 'service_role' then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtext('reports:' || coalesce(new.reporter_id::text, '')));
  if exists (select 1 from public.reports r where r.exam_id = new.exam_id and r.reporter_id = new.reporter_id and r.status = 'open') then
    raise exception 'QUOTA:Bạn đã báo cáo đề này rồi, kiểm duyệt viên đang xem.' using errcode = 'P0001';
  end if;
  if (select count(*) from public.reports r where r.reporter_id = new.reporter_id and r.created_at > now() - interval '24 hours') >= 10 then
    raise exception 'QUOTA:Bạn đã gửi nhiều báo cáo hôm nay, thử lại sau.' using errcode = 'P0001';
  end if;
  return new;
end
$$;
revoke all on function public.limit_reports() from public, anon, authenticated;

create or replace function public.limit_feedback()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  new.created_at := now();
  if coalesce((select auth.role()), '') = 'service_role' then
    return new;
  end if;
  -- đếm theo tài khoản thật đang gọi (không theo user_id client tự điền — gửi null là lách được)
  perform pg_advisory_xact_lock(hashtext('feedback:' || coalesce(v_uid::text, 'anon')));
  if v_uid is not null then
    if (select count(*) from public.feedback f where f.user_id = v_uid and f.created_at > now() - interval '1 hour') >= 10 then
      raise exception 'QUOTA:Bạn gửi góp ý nhiều quá, thử lại sau ít phút.' using errcode = 'P0001';
    end if;
    new.user_id := v_uid;
  elsif (select count(*) from public.feedback f where f.user_id is null and f.created_at > now() - interval '1 hour') >= 60 then
    raise exception 'QUOTA:Hệ thống đang nhận nhiều góp ý, thử lại sau.' using errcode = 'P0001';
  end if;
  return new;
end
$$;
revoke all on function public.limit_feedback() from public, anon, authenticated;

-- 2 ------------------------------------------------------------------------------------------------------
create or replace function public.protect_exam_moderation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- SECURITY INVOKER: current_user là role PostgREST đã chuyển sang (anon / authenticated / service_role)
  if current_user not in ('service_role', 'postgres', 'supabase_admin') then
    if tg_op = 'INSERT' then
      new.status := 'published';
      new.removed_reason := null;
      new.moderated_by := null;
      new.moderated_at := null;
    elsif old.status = 'removed' then
      -- đề đã bị gỡ là bằng chứng kiểm duyệt: bỏ qua mọi thay đổi của chủ đề
      return old;
    elsif public.exam_has_open_report(old.id) then
      -- đang có báo cáo chờ xử lý: kiểm duyệt viên xem đề trực tiếp, sửa / ẩn lúc này là xoá bằng chứng
      raise exception 'QUOTA:Đề đang được kiểm duyệt, chưa sửa được. Thử lại sau khi có kết quả.' using errcode = 'P0001';
    else
      new.status := old.status;
      new.removed_reason := old.removed_reason;
      new.moderated_by := old.moderated_by;
      new.moderated_at := old.moderated_at;
    end if;
  end if;
  return new;
end;
$$;
