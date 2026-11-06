-- Ảnh chụp RLS hiện có trên production (06/11/2026) cho các bảng chưa nằm trong migrations.
-- Chạy lại được (drop if exists + create); KHÔNG đổi quyền so với DB đang chạy.

alter table public.community_exams enable row level security;
alter table public.user_documents enable row level security;
alter table public.user_items enable row level security;

-- community_exams
drop policy if exists "Xem đề cộng đồng và đề của mình" on public.community_exams;
create policy "Xem đề cộng đồng và đề của mình" on public.community_exams
  for select to anon, authenticated
  using (listed or owner_id = (select auth.uid()));

drop policy if exists "Người dùng đăng đề của mình" on public.community_exams;
create policy "Người dùng đăng đề của mình" on public.community_exams
  for insert to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "Người dùng sửa đề của mình" on public.community_exams;
create policy "Người dùng sửa đề của mình" on public.community_exams
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "Người dùng gỡ đề của mình" on public.community_exams;
create policy "Người dùng gỡ đề của mình" on public.community_exams
  for delete to authenticated
  using (auth.uid() = owner_id);

-- user_documents (policy áp cho mọi role; anon có auth.uid() null nên không khớp)
drop policy if exists user_documents_select_own on public.user_documents;
create policy user_documents_select_own on public.user_documents
  for select using (auth.uid() = owner_id);

drop policy if exists user_documents_insert_own on public.user_documents;
create policy user_documents_insert_own on public.user_documents
  for insert with check (auth.uid() = owner_id);

drop policy if exists user_documents_delete_own on public.user_documents;
create policy user_documents_delete_own on public.user_documents
  for delete using (auth.uid() = owner_id);

-- user_items
drop policy if exists "own items select" on public.user_items;
create policy "own items select" on public.user_items
  for select to authenticated using (owner_id = (select auth.uid()));

drop policy if exists "own items insert" on public.user_items;
create policy "own items insert" on public.user_items
  for insert to authenticated with check (owner_id = (select auth.uid()));

drop policy if exists "own items update" on public.user_items;
create policy "own items update" on public.user_items
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "own items delete" on public.user_items;
create policy "own items delete" on public.user_items
  for delete to authenticated using (owner_id = (select auth.uid()));
