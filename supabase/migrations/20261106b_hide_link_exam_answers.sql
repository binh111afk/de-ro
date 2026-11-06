-- Đề chỉ-link: get_shared_exam (trả nguyên doc, kèm đáp án) chỉ còn cho đề ở cộng đồng hoặc chủ đề.
-- Học sinh mở đề link qua api/exam, nhận bản đã bỏ đáp án và lời giải.
create or replace function public.get_shared_exam(p_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select doc from public.community_exams
  where id = p_id and (listed or owner_id = (select auth.uid()));
$$;
