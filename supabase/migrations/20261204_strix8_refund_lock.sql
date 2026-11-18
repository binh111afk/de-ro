-- Strix 8 (bản chạy dethinhbien_5333): trần 20 lần hoàn điểm / người / ngày đếm rồi mới chèn, không khoá
-- → gửi song song nhiều lượt gọi lại thì lượt nào cũng thấy chưa đủ 20 và đều được hoàn (dùng AI miễn phí).
-- Khoá theo người dùng trước khi đếm (cùng cách limit_reports / limit_feedback).
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
  perform pg_advisory_xact_lock(hashtext('ai_refund:' || p_user::text));
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
