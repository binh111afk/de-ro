-- Điểm AI: tài khoản được tặng một lần (mặc định 200 điểm = 200.000 token) vào ai_credits khi dùng AI lần đầu.
-- Bỏ hạn mức tháng mặc định (server: AI_MONTHLY_TOKENS mặc định 0), nên token dùng trừ thẳng vào số dư.

-- Tặng nếu chưa có dòng số dư (đã có — kể cả số dư 0 — là đã nhận, không tặng lại). Trả số dư hiện tại.
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
  select c.balance into v_bal from public.ai_credits c where c.user_id = p_user;
  return coalesce(v_bal, 0);
end;
$$;

revoke all on function public.claim_ai_welcome(uuid, bigint) from public, anon, authenticated;
grant execute on function public.claim_ai_welcome(uuid, bigint) to service_role;

-- Hoàn token: trừ khỏi số đã dùng của tháng trước, phần còn lại (đã trả bằng điểm) cộng lại vào số dư.
-- Trả số dư sau khi hoàn; null = không hoàn (biên nhận đã dùng hoặc quá 20 lần/ngày).
create or replace function public.refund_ai_usage(p_user uuid, p_month text, p_receipt text, p_tokens bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_used bigint;
  v_back bigint;
  v_rest bigint;
  v_bal bigint;
begin
  if (select count(*) from public.ai_refunds r
       where r.user_id = p_user and r.created_at > now() - interval '1 day') >= 20 then
    return null;
  end if;
  insert into public.ai_refunds (receipt, user_id, tokens)
  values (p_receipt, p_user, greatest(p_tokens, 0))
  on conflict (receipt) do nothing;
  if not found then
    return null;
  end if;
  select a.tokens into v_used from public.ai_usage a where a.user_id = p_user and a.month = p_month for update;
  v_back := least(coalesce(v_used, 0), greatest(p_tokens, 0));
  if v_back > 0 then
    update public.ai_usage a set tokens = a.tokens - v_back, updated_at = now()
     where a.user_id = p_user and a.month = p_month;
  end if;
  v_rest := greatest(p_tokens, 0) - v_back;
  insert into public.ai_credits (user_id, balance) values (p_user, v_rest)
  on conflict (user_id) do update set balance = public.ai_credits.balance + v_rest, updated_at = now()
  returning balance into v_bal;
  return v_bal;
end;
$$;
