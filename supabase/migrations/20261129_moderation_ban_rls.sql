-- Strix lần 5 — siết tầng dữ liệu (trình duyệt gọi thẳng PostgREST, không qua server/guard.ts):
-- 1. Tài khoản bị admin khoá (banned_until) hoặc đã xoá: KHÔNG ghi được gì nữa, kể cả bằng access token cũ còn hạn
--    (mặc định sống 1 giờ). Thêm policy RESTRICTIVE cho insert/update/delete trên mọi bảng client ghi được —
--    restrictive nên AND với policy cũ, không phải viết lại từng policy.
-- 2. protect_exam_moderation: trước đây chỉ khoá cột kiểm duyệt khi role là anon/authenticated, role trống
--    (không có claim) thì lọt. Giờ chỉ service_role và chủ DB (postgres / supabase_admin) được đổi.
-- 3. Đề đã bị gỡ (status = 'removed'): chủ đề không xoá được — xoá rồi đăng lại đúng id là đề hiện lại
--    với status 'published' (trigger đặt khi insert), đồng thời xoá luôn báo cáo / bài làm làm bằng chứng.
-- 4. Báo cáo đề: chỉ báo cáo đề đang hiện ở cộng đồng; mỗi người 1 báo cáo đang mở / đề, tối đa 10 báo cáo / 24 giờ.
-- 5. Góp ý: tối đa 10 / giờ mỗi tài khoản, khách (chưa đăng nhập) chung 60 / giờ.
-- 6. app_settings: chỉ đọc được các khoá giao diện cần (maintenance, announcements), không lộ khoá khác thêm sau này.

-- 1 ------------------------------------------------------------------------------------------------------
create or replace function public.auth_banned()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select u.deleted_at is not null or (u.banned_until is not null and u.banned_until > now())
    from auth.users u where u.id = auth.uid()
  ), auth.uid() is not null) -- có uid mà không còn dòng user → coi như đã xoá
$$;
revoke all on function public.auth_banned() from public;
grant execute on function public.auth_banned() to anon, authenticated;

do $$
declare
  t text;
  c text;
begin
  foreach t in array array['community_exams', 'user_items', 'reports', 'feedback', 'presence'] loop
    foreach c in array array['insert', 'update', 'delete'] loop
      execute format('drop policy if exists %I on public.%I', 'chan_tai_khoan_khoa_' || c, t);
      if c = 'insert' then
        execute format('create policy %I on public.%I as restrictive for insert to authenticated with check (not (select public.auth_banned()))', 'chan_tai_khoan_khoa_' || c, t);
      elsif c = 'update' then
        execute format('create policy %I on public.%I as restrictive for update to authenticated using (not (select public.auth_banned())) with check (not (select public.auth_banned()))', 'chan_tai_khoan_khoa_' || c, t);
      else
        execute format('create policy %I on public.%I as restrictive for delete to authenticated using (not (select public.auth_banned()))', 'chan_tai_khoan_khoa_' || c, t);
      end if;
    end loop;
  end loop;
end
$$;

-- 2 ------------------------------------------------------------------------------------------------------
create or replace function public.protect_exam_moderation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- current_user là role PostgREST đã chuyển sang (anon / authenticated / service_role), không phụ thuộc claim
  if current_user not in ('service_role', 'postgres', 'supabase_admin') then
    if tg_op = 'INSERT' then
      new.status := 'published';
      new.removed_reason := null;
      new.moderated_by := null;
      new.moderated_at := null;
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

-- 3 ------------------------------------------------------------------------------------------------------
drop policy if exists "Người dùng gỡ đề của mình" on public.community_exams;
create policy "Người dùng gỡ đề của mình" on public.community_exams
  for delete to authenticated
  using (owner_id = (select auth.uid()) and status <> 'removed');

-- 4 ------------------------------------------------------------------------------------------------------
drop policy if exists reports_insert_authenticated on public.reports;
create policy reports_insert_authenticated on public.reports
  for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and status = 'open' and resolved_by is null and resolved_at is null
    and exists (select 1 from public.community_exams e where e.id = exam_id and e.listed and e.status = 'published')
  );

create or replace function public.limit_reports()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
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
drop trigger if exists trg_limit_reports on public.reports;
create trigger trg_limit_reports before insert on public.reports for each row execute function public.limit_reports();

-- 5 ------------------------------------------------------------------------------------------------------
create or replace function public.limit_feedback()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
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
drop trigger if exists trg_limit_feedback on public.feedback;
create trigger trg_limit_feedback before insert on public.feedback for each row execute function public.limit_feedback();

-- 6 ------------------------------------------------------------------------------------------------------
drop policy if exists "Ai cũng đọc cài đặt app" on public.app_settings;
create policy "Ai cũng đọc cài đặt app" on public.app_settings
  for select to anon, authenticated
  using (key in ('maintenance', 'announcements'));
