-- Trả về tên hiển thị và ảnh đại diện của tác giả đã đăng đề công khai lên cộng đồng.
-- Client không đọc được auth.users của người khác; chỉ lộ thông tin tối thiểu (không email)
-- cho những user là owner_id của ít nhất 1 đề listed = true và status = 'published'.
create or replace function public.community_authors(p_ids uuid[])
returns table (id uuid, name text, avatar text)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id,
         coalesce(nullif(u.raw_user_meta_data ->> 'display_name', ''), null) as name,
         nullif(u.raw_user_meta_data ->> 'avatar_url', '') as avatar
  from auth.users u
  where u.id = any(coalesce(p_ids, '{}'::uuid[]))
    and exists (
      select 1
      from public.community_exams c
      where c.owner_id = u.id
        and c.listed = true
        and c.status = 'published'
    );
$$;

revoke all on function public.community_authors(uuid[]) from public;
grant execute on function public.community_authors(uuid[]) to anon, authenticated;
