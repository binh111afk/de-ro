-- Strix (bản chạy dethinhbien_ce3e): credit_payment_order coi mọi số tiền khác số tiền đơn (kể cả thiếu số liệu
-- = NULL, hay trả dư) là lỗi và ghi đơn 'failed' vĩnh viễn → người đã trả tiền không được cộng điểm, không ai tra lại.
-- Giờ:
--   số tiền không rõ (NULL / <= 0)  → 'unknown_amount', đơn giữ nguyên để webhook / lần tra sau xử lý
--   trả thiếu                        → 'underpaid', đơn vẫn 'pending' (ghi chú vào reference để đối soát tay)
--   trả đủ hoặc dư                   → cộng điểm như thường
-- Không còn nhánh nào ghi 'failed' từ hàm này.
create or replace function public.credit_payment_order(p_order bigint, p_amount integer, p_reference text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.payment_orders%rowtype;
  v_points integer;
begin
  select * into o from public.payment_orders where order_code = p_order for update;
  if not found then
    return 'missing';
  end if;
  if o.status = 'paid' then
    return 'already';
  end if;
  if p_amount is null or p_amount <= 0 then
    return 'unknown_amount';
  end if;
  if p_amount < o.vnd then
    update public.payment_orders
       set reference = left('THIEU ' || p_amount || 'd/' || o.vnd || 'd ' || coalesce(p_reference, ''), 120)
     where order_code = p_order;
    return 'underpaid';
  end if;
  -- thưởng lần đầu mỗi gói chỉ một lần: hai đơn cùng gói mở song song thì đơn trả sau chỉ được điểm gốc
  perform pg_advisory_xact_lock(hashtext('payment:' || o.user_id::text));
  v_points := o.points;
  if o.bonus_points > 0 and exists (
    select 1 from public.payment_orders p
    where p.user_id = o.user_id and p.pack_vnd = o.pack_vnd and p.status = 'paid' and p.bonus_points > 0
  ) then
    v_points := o.points - o.bonus_points;
    o.bonus_points := 0;
  end if;
  update public.payment_orders
     set status = 'paid', paid_at = now(), reference = left(p_reference, 120), points = v_points, bonus_points = o.bonus_points
   where order_code = p_order;
  -- 1 điểm = 1.000 token (cùng đơn vị ai_credits.balance)
  insert into public.ai_credits (user_id, balance) values (o.user_id, v_points::bigint * 1000)
  on conflict (user_id) do update set balance = public.ai_credits.balance + excluded.balance, updated_at = now();
  insert into public.ai_credit_events (user_id, kind, tokens) values (o.user_id, 'topup', v_points::bigint * 1000);
  return 'ok';
end;
$$;
revoke all on function public.credit_payment_order(bigint, integer, text) from public, anon, authenticated;
grant execute on function public.credit_payment_order(bigint, integer, text) to service_role;
