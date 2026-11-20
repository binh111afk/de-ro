-- CREATE OR REPLACE giữ nguyên quyền EXECUTE của get_shared_exam.
create or replace function public.get_shared_exam(p_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when owner_id = (select auth.uid()) then doc
              else doc #- '{online,settings,roster}'
         end
  from public.community_exams
  where id = p_id
    and status <> 'removed'
    and ((listed and status = 'published') or owner_id = (select auth.uid()));
$$;

-- Câu ẩn chỉ cần id và trạng thái để loại khỏi kho tĩnh trên trình duyệt.
create or replace function public.bank_overrides()
returns table (id text, status text, data jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select b.id, b.status, case when b.status = 'hidden' then null else b.data end
  from public.bank_questions as b;
$$;

revoke all on function public.bank_overrides() from public;
grant execute on function public.bank_overrides() to anon, authenticated;

drop policy if exists "Ai cũng đọc ngân hàng câu hỏi" on public.bank_questions;
revoke select on public.bank_questions from anon, authenticated;
