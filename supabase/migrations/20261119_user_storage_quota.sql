-- Giới hạn dữ liệu đồng bộ của mỗi tài khoản (bảng user_items: đề, slide, bảng vẽ, đề online, tệp tải lên).
--   * tổng dung lượng: 10 MB / người (admin nâng riêng qua bảng user_quota)
--   * số lượng: 100 đề, 50 slide, 30 bảng vẽ
--   * mỗi mục: đề tối đa 1 MB, loại khác 2 MB
-- Ảnh đã được tách lên kho file (R2) nên không tính vào đây.
-- Sửa cho nhỏ đi (hoặc xoá) luôn được phép, kể cả khi đang vượt mức.

create table if not exists public.user_quota (
  user_id uuid primary key references auth.users (id) on delete cascade,
  max_bytes bigint not null check (max_bytes > 0),
  note text,
  updated_at timestamptz not null default now()
);
alter table public.user_quota enable row level security;
drop policy if exists "own quota select" on public.user_quota;
create policy "own quota select" on public.user_quota
  for select to authenticated using (user_id = (select auth.uid()));
-- ghi chỉ qua service role (trang admin)

create or replace function public.storage_max_bytes(p_user uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select q.max_bytes from public.user_quota q where q.user_id = p_user), 10 * 1024 * 1024)
$$;

create or replace function public.storage_kind_limit(p_kind text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_kind when 'doc' then 100 when 'deck' then 50 when 'board' then 30 else null end
$$;

create or replace function public.check_user_items_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_size bigint := pg_column_size(new.data);
  v_old bigint;
  v_total bigint;
  v_count integer;
  v_limit integer := public.storage_kind_limit(new.kind);
  v_item_max bigint := case new.kind when 'doc' then 1024 * 1024 else 2 * 1024 * 1024 end;
  v_max bigint;
begin
  -- server / admin (service role) không bị chặn
  if coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' or (select auth.role()) = 'service_role' then
    return new;
  end if;

  -- bản đang có (upsert đi qua BEFORE INSERT nên tự tra)
  select pg_column_size(i.data) into v_old
  from public.user_items i
  where i.owner_id = new.owner_id and i.kind = new.kind and i.id = new.id;

  -- không lớn hơn bản cũ thì luôn cho (sửa nhỏ đi, đổi tên… khi đang đầy)
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
  select coalesce(sum(pg_column_size(i.data)), 0) into v_total
  from public.user_items i
  where i.owner_id = new.owner_id and not (i.kind = new.kind and i.id = new.id);
  if v_total + v_size > v_max then
    raise exception 'QUOTA:Đã dùng hết % MB lưu trữ, xoá bớt tệp để đồng bộ tiếp.', round(v_max / 1048576.0, 1)
      using errcode = 'P0001';
  end if;

  return new;
end
$$;

drop trigger if exists trg_user_items_quota on public.user_items;
create trigger trg_user_items_quota
before insert or update of data on public.user_items
for each row execute function public.check_user_items_quota();

-- Dung lượng của chính mình (trang hồ sơ)
create or replace function public.my_storage()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  -- chỉ đọc dữ liệu của auth.uid(); definer để gọi storage_max_bytes mà không mở hàm đó cho người dùng
  select json_build_object(
    'used', coalesce((select sum(pg_column_size(i.data)) from public.user_items i where i.owner_id = (select auth.uid())), 0),
    'max', public.storage_max_bytes((select auth.uid())),
    'kinds', coalesce((
      select json_object_agg(k.kind, json_build_object('count', k.n, 'bytes', k.bytes, 'limit', public.storage_kind_limit(k.kind)))
      from (
        select i.kind, count(*) n, sum(pg_column_size(i.data)) bytes
        from public.user_items i where i.owner_id = (select auth.uid()) group by i.kind
      ) k
    ), '{}'::json)
  )
$$;

revoke all on function public.my_storage() from public, anon;
grant execute on function public.my_storage() to authenticated;
revoke all on function public.storage_max_bytes(uuid) from public, anon, authenticated;
revoke all on function public.check_user_items_quota() from public, anon, authenticated;
