-- Strix lần 3, mục 2–3: hạn mức lưu trữ chốt nguyên tử ở DB, client không còn tự thêm/xoá dòng tài liệu.
--
-- 1. reserve_user_document: khoá theo chủ (advisory lock), kiểm tổng, insert — một giao dịch. Server gọi
--    TRƯỚC khi PUT lên R2 (8 lượt song song không còn cùng qua được bước kiểm).
-- 2. Ảnh (img/): bảng user_images + reserve_user_image, hạn mức RIÊNG (ảnh chưa có chỗ xoá; cộng vào 10 MB
--    chung thì vài chục ảnh là không soạn đề được nữa). Ảnh trùng nội dung của cùng người không tính lại.
-- 3. Thu quyền insert/delete user_documents của authenticated: thêm qua /api/upload, xoá qua DELETE /api/upload
--    (server xoá cả tệp R2 — trước đây xoá dòng là được trả dung lượng mà tệp vẫn nằm trên R2).

create or replace function public.reserve_user_document(
  p_owner uuid, p_name text, p_mime text, p_size bigint, p_url text, p_subject text
)
returns public.user_documents
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max bigint;
  v_used bigint;
  v_row public.user_documents;
begin
  perform pg_advisory_xact_lock(hashtext('storage:' || p_owner::text));
  v_max := public.storage_max_bytes(p_owner);
  v_used := public.storage_used(p_owner);
  if v_used + p_size > v_max then
    raise exception 'QUOTA:Tệp vượt dung lượng còn lại (% MB). Xoá bớt tệp ở trang Hồ sơ để tải tiếp.',
      round(greatest(v_max - v_used, 0) / 1048576.0, 1)
      using errcode = 'P0001';
  end if;
  insert into public.user_documents (owner_id, name, mime, size, url, subject)
  values (p_owner, p_name, p_mime, p_size, p_url, p_subject)
  returning * into v_row;
  return v_row;
end
$$;
revoke all on function public.reserve_user_document(uuid, text, text, bigint, text, text) from public, anon, authenticated;

create table if not exists public.user_images (
  owner_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  size bigint not null check (size > 0),
  created_at timestamptz not null default now(),
  primary key (owner_id, key)
);
alter table public.user_images enable row level security;
revoke all on public.user_images from anon, authenticated;

-- hạn mức ảnh mỗi tài khoản (byte)
create or replace function public.image_max_bytes(p_user uuid)
returns bigint
language sql
stable
set search_path = ''
as $$ select 100::bigint * 1024 * 1024 $$;
revoke all on function public.image_max_bytes(uuid) from public, anon, authenticated;

-- true = ảnh mới đã ghi nhận; false = người này đã có ảnh này (không tính lại); vượt hạn mức → lỗi QUOTA
create or replace function public.reserve_user_image(p_owner uuid, p_key text, p_size bigint)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_used bigint;
  v_max bigint := public.image_max_bytes(p_owner);
begin
  perform pg_advisory_xact_lock(hashtext('images:' || p_owner::text));
  if exists (select 1 from public.user_images where owner_id = p_owner and key = p_key) then
    return false;
  end if;
  select coalesce(sum(size), 0) into v_used from public.user_images where owner_id = p_owner;
  if v_used + p_size > v_max then
    raise exception 'QUOTA:Đã dùng hết % MB ảnh tải lên.', round(v_max / 1048576.0)
      using errcode = 'P0001';
  end if;
  insert into public.user_images (owner_id, key, size) values (p_owner, p_key, p_size);
  return true;
end
$$;
revoke all on function public.reserve_user_image(uuid, text, bigint) from public, anon, authenticated;

-- client chỉ còn đọc danh sách của mình
drop policy if exists user_documents_insert_own on public.user_documents;
drop policy if exists user_documents_delete_own on public.user_documents;
revoke insert, update, delete on public.user_documents from anon, authenticated;
