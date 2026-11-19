-- Tên tác giả đề cộng đồng: tài khoản đăng nhập Google lưu tên ở full_name / name chứ không phải display_name,
-- nên trước đây hiện "Giáo viên". Lấy lần lượt display_name → full_name → name; ảnh: avatar_url → picture.
create or replace function public.community_authors(p_ids uuid[])
returns table (id uuid, name text, avatar text)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id,
         coalesce(
           nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''),
           nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
           nullif(trim(u.raw_user_meta_data ->> 'name'), '')
         ) as name,
         coalesce(
           nullif(u.raw_user_meta_data ->> 'avatar_url', ''),
           nullif(u.raw_user_meta_data ->> 'picture', '')
         ) as avatar
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
