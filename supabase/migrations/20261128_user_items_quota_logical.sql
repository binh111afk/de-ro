-- Strix lần 4 — hạn mức lưu trữ user_items (đồng bộ đề / slide / bảng vẽ):
-- 1. Đo theo dung lượng THẬT. Trước đây dùng pg_column_size(data) trên dòng đã lưu: JSON lớn bị TOAST nén,
--    nên 11 MB dữ liệu lặp chỉ tính ~128 KB (lệch ~88 lần, 10 MB thành ~880 MB). Giờ mỗi dòng có cột `bytes`
--    = octet_length(data::text), Postgres tự tính khi ghi; tổng đã dùng cộng cột này (không giải nén khi đọc).
-- 2. Kiểm-rồi-ghi nguyên tử: trigger khoá pg_advisory_xact_lock('storage:' || owner) — CÙNG khoá với
--    reserve_user_document / reserve_user_image (20261127), nên ghi song song (cả đồng bộ lẫn tải tài liệu)
--    của một người phải xếp hàng, không ai thấy tổng cũ rồi cùng vượt.
-- 3. Trigger chạy cho MỌI update (trước chỉ `update of data`): đổi kind/id của dòng có sẵn không lách được
--    giới hạn số mục; kind chỉ nhận các loại app dùng (kind lạ không có giới hạn số mục).
-- 4. Thu quyền TRUNCATE của anon/authenticated trên mọi bảng public (PostgREST không dùng, chỉ là lỗ thừa).

alter table public.user_items
  add column if not exists bytes bigint generated always as (octet_length(data::text)) stored;

alter table public.user_items drop constraint if exists user_items_kind_check;
alter table public.user_items
  add constraint user_items_kind_check check (kind in ('doc', 'deck', 'board', 'online', 'upload'));

create or replace function public.storage_used(p_user uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select sum(i.bytes) from public.user_items i where i.owner_id = p_user), 0)
       + coalesce((select sum(d.size) from public.user_documents d where d.owner_id = p_user), 0)
$$;
revoke all on function public.storage_used(uuid) from public, anon, authenticated;

create or replace function public.check_user_items_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- cỡ thật của giá trị sắp ghi (cột bytes được tính SAU trigger BEFORE nên tự tính ở đây, cùng công thức)
  v_size bigint := octet_length(new.data::text);
  v_old bigint;
  v_count integer;
  v_limit integer := public.storage_kind_limit(new.kind);
  v_item_max bigint := case new.kind when 'doc' then 1024 * 1024 else 2 * 1024 * 1024 end;
  v_max bigint;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' or (select auth.role()) = 'service_role' then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext('storage:' || new.owner_id::text));
  -- update đổi chủ: dòng cũ của chủ cũ cũng phải xếp hàng (RLS vốn đã chặn, đây chỉ là chốt thêm)
  if tg_op = 'UPDATE' and old.owner_id is distinct from new.owner_id then
    perform pg_advisory_xact_lock(hashtext('storage:' || old.owner_id::text));
  end if;

  -- cỡ cũ của CHÍNH dòng này: update thì lấy từ OLD (nếu giữ nguyên chủ + loại + id);
  -- insert (kể cả upsert sắp đụng dòng có sẵn) thì tra theo khoá
  if tg_op = 'UPDATE' and old.owner_id = new.owner_id and old.kind = new.kind and old.id = new.id then
    v_old := octet_length(old.data::text);
  else
    select i.bytes into v_old
    from public.user_items i
    where i.owner_id = new.owner_id and i.kind = new.kind and i.id = new.id;
  end if;

  if v_old is not null and v_size <= v_old then
    return new;
  end if;

  if v_size > v_item_max then
    raise exception 'QUOTA:Tệp quá lớn để đồng bộ (tối đa % MB mỗi %).', v_item_max / 1024 / 1024,
      case new.kind when 'doc' then 'đề' when 'deck' then 'slide' when 'board' then 'bảng vẽ' else 'mục' end
      using errcode = 'P0001';
  end if;

  if v_old is null and v_limit is not null then
    select count(*) into v_count from public.user_items i where i.owner_id = new.owner_id and i.kind = new.kind;
    if v_count >= v_limit then
      raise exception 'QUOTA:Đã đủ % %, xoá bớt để lưu thêm.', v_limit,
        case new.kind when 'doc' then 'đề thi' when 'deck' then 'slide' else 'bảng vẽ' end
        using errcode = 'P0001';
    end if;
  end if;

  v_max := public.storage_max_bytes(new.owner_id);
  if public.storage_used(new.owner_id) - coalesce(v_old, 0) + v_size > v_max then
    raise exception 'QUOTA:Đã dùng hết % MB lưu trữ, xoá bớt tệp để đồng bộ tiếp.', round(v_max / 1048576.0, 1)
      using errcode = 'P0001';
  end if;

  return new;
end
$$;
revoke all on function public.check_user_items_quota() from public, anon, authenticated;

drop trigger if exists trg_user_items_quota on public.user_items;
create trigger trg_user_items_quota
before insert or update on public.user_items
for each row execute function public.check_user_items_quota();

create or replace function public.my_storage()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'used', public.storage_used((select auth.uid())),
    'max', public.storage_max_bytes((select auth.uid())),
    'kinds', coalesce((
      select json_object_agg(k.kind, json_build_object('count', k.n, 'bytes', k.bytes, 'limit', public.storage_kind_limit(k.kind)))
      from (
        select i.kind, count(*) n, coalesce(sum(i.bytes), 0) bytes
        from public.user_items i where i.owner_id = (select auth.uid()) group by i.kind
        union all
        select 'files', count(*), coalesce(sum(d.size), 0)
        from public.user_documents d where d.owner_id = (select auth.uid())
      ) k
    ), '{}'::json)
  )
$$;
revoke all on function public.my_storage() from public, anon;
grant execute on function public.my_storage() to authenticated;

revoke truncate on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke truncate on tables from anon, authenticated;
