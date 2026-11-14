-- Bỏ hạn mức tháng: token đã dùng theo cách cũ không được trừ vào điểm. Đưa số đã dùng tháng này về 0 một lần.
update public.ai_usage set tokens = 0, updated_at = now() where tokens > 0;

create or replace function public.claim_ai_welcome(p_user uuid, p_tokens bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bal bigint;
begin
  insert into public.ai_credits (user_id, balance) values (p_user, greatest(p_tokens, 0))
  on conflict (user_id) do nothing;
  if found then
    -- mới nhận quà: token đã dùng trước đó (theo hạn mức tháng cũ) không trừ vào điểm
    update public.ai_usage a set tokens = 0, updated_at = now() where a.user_id = p_user;
  end if;
  select c.balance into v_bal from public.ai_credits c where c.user_id = p_user;
  return coalesce(v_bal, 0);
end;
$$;
