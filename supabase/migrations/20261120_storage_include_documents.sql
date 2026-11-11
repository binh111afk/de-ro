-- Tính tài liệu tải lên (bảng user_documents: PDF / DOCX trên R2, mục "Đề của tôi" ở hồ sơ và Kho tài liệu)
-- vào chung giới hạn lưu trữ 10 MB của mỗi tài khoản (migration 20261119).
-- Dung lượng một tài liệu lấy theo cột `size` (byte của tệp gốc).

-- cỡ tệp hợp lệ: 1 byte – 20 MB (khớp giới hạn của /api/upload)
alter table public.user_documents drop constraint if exists user_documents_size_check;
alter table public.user_documents add constraint user_documents_size_check check (size > 0 and size <= 20 * 1024 * 1024) not valid;

-- tổng đã dùng của một người: dữ liệu đồng bộ + tài liệu tải lên
create or replace function public.storage_used(p_user uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select sum(pg_column_size(i.data)) from public.user_items i where i.owner_id = p_user), 0)
       + coalesce((select sum(d.size) from public.user_documents d where d.owner_id = p_user), 0)
$$;
revoke all on function public.storage_used(uuid) from public, anon, authenticated;

-- user_items: tổng tính cả tài liệu
create or replace function public.check_user_items_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_size bigint := pg_column_size(new.data);
  v_old bigint;
  v_count integer;
  v_limit integer := public.storage_kind_limit(new.kind);
  v_item_max bigint := case new.kind when 'doc' then 1024 * 1024 else 2 * 1024 * 1024 end;
  v_max bigint;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' or (select auth.role()) = 'service_role' then
    return new;
  end if;

  select pg_column_size(i.data) into v_old
  from public.user_items i
  where i.owner_id = new.owner_id and i.kind = new.kind and i.id = new.id;

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

-- user_documents: thêm tài liệu không được vượt tổng
create or replace function public.check_user_documents_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max bigint;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' or (select auth.role()) = 'service_role' then
    return new;
  end if;
  v_max := public.storage_max_bytes(new.owner_id);
  if public.storage_used(new.owner_id) + new.size > v_max then
    raise exception 'QUOTA:Không đủ dung lượng: còn % MB trong % MB, tệp này % MB.',
      round(greatest(v_max - public.storage_used(new.owner_id), 0) / 1048576.0, 1),
      round(v_max / 1048576.0, 1), round(new.size / 1048576.0, 1)
      using errcode = 'P0001';
  end if;
  return new;
end
$$;
revoke all on function public.check_user_documents_quota() from public, anon, authenticated;

drop trigger if exists trg_user_documents_quota on public.user_documents;
create trigger trg_user_documents_quota
before insert on public.user_documents
for each row execute function public.check_user_documents_quota();

-- my_storage: thêm mục 'files' (tài liệu tải lên); 'used' là tổng cả hai
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
        select i.kind, count(*) n, sum(pg_column_size(i.data)) bytes
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
