-- Giữ chỗ riêng từng lượt AI, gắn biên nhận vào chỗ giữ trước khi gọi model.
create table public.ai_request_holds (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  month text not null,
  base bigint not null,
  tokens bigint not null,
  receipt text unique,
  receipt_month text,
  receipt_tokens bigint not null,
  result jsonb,
  expires_at timestamptz not null default (now() + interval '6 minutes')
);

alter table public.ai_request_holds enable row level security;
revoke all on public.ai_request_holds from public, anon, authenticated;
create index ai_request_holds_user_idx on public.ai_request_holds (user_id);

create function public.reserve_ai_request(
  p_id uuid, p_user uuid, p_month text, p_base bigint, p_amount bigint,
  p_receipt text, p_receipt_month text, p_receipt_tokens bigint
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_used bigint;
  v_balance bigint;
  v_held bigint;
  v_legacy_held bigint;
  v_net bigint := greatest(0, p_amount - case when p_receipt is null then 0 else p_receipt_tokens end);
begin
  -- Cùng khóa với refund_ai_usage: đếm lượt đã hoàn và giữ chỗ cho lượt mới trong một giao dịch.
  perform pg_advisory_xact_lock(hashtext('ai_refund:' || p_user::text));
  delete from public.ai_request_holds h where h.user_id = p_user and h.expires_at <= now();
  if p_receipt is not null then
    if exists (select 1 from public.ai_refunds where receipt = p_receipt)
      or exists (select 1 from public.ai_request_holds where receipt = p_receipt)
      or (select count(*) from public.ai_refunds where user_id = p_user and created_at > now() - interval '1 day')
       + (select count(*) from public.ai_request_holds where user_id = p_user and receipt is not null) >= 20 then
      return 'receipt_unavailable';
    end if;
  end if;

  select a.tokens, case when a.reserved_at > now() - interval '6 minutes' then a.reserved else 0 end
    into v_used, v_legacy_held
    from public.ai_usage a where a.user_id = p_user and a.month = p_month;
  select balance into v_balance from public.ai_credits where user_id = p_user;
  select coalesce(sum(tokens), 0) into v_held from public.ai_request_holds where user_id = p_user and month = p_month;
  if coalesce(v_used, 0) + coalesce(v_legacy_held, 0) + v_held + v_net > p_base + coalesce(v_balance, 0) then
    return 'quota_exceeded';
  end if;

  insert into public.ai_request_holds (id, user_id, month, base, tokens, receipt, receipt_month, receipt_tokens)
    values (p_id, p_user, p_month, p_base, v_net, p_receipt, p_receipt_month, p_receipt_tokens);
  return 'reserved';
end;
$$;

create function public.finish_ai_request(p_id uuid, p_user uuid, p_tokens bigint, p_refund_cap bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hold public.ai_request_holds%rowtype;
  v_used bigint;
  v_balance bigint;
  v_refund bigint;
begin
  perform pg_advisory_xact_lock(hashtext('ai_refund:' || p_user::text));
  select * into v_hold from public.ai_request_holds h where h.id = p_id and h.user_id = p_user for update;
  if not found then return null; end if;
  if v_hold.result is not null then return v_hold.result; end if;
  if p_tokens <= 0 then
    delete from public.ai_request_holds where id = p_id;
    return null;
  end if;

  v_refund := least(greatest(p_refund_cap, 0), p_tokens, v_hold.receipt_tokens);
  if v_hold.receipt is not null and v_refund > 0 then
    perform public.refund_ai_usage(p_user, v_hold.receipt_month, v_hold.receipt, v_refund);
  end if;

  perform public.add_ai_usage(p_user, v_hold.month, p_tokens);
  select c.used, c.balance into v_used, v_balance
    from public.consume_ai_credits(p_user, v_hold.month, v_hold.base) c;
  -- Ghi sổ và trả chỗ trong cùng giao dịch. Giữ kết quả ngắn hạn để gửi lại nếu mất phản hồi.
  update public.ai_request_holds
     set tokens = 0, receipt = null, receipt_month = null, receipt_tokens = 0,
         result = jsonb_build_object('used', v_used, 'balance', v_balance)
   where id = p_id
   returning result into v_hold.result;
  return v_hold.result;
end;
$$;

revoke all on function public.reserve_ai_request(uuid, uuid, text, bigint, bigint, text, text, bigint) from public, anon, authenticated;
revoke all on function public.finish_ai_request(uuid, uuid, bigint, bigint) from public, anon, authenticated;
grant execute on function public.reserve_ai_request(uuid, uuid, text, bigint, bigint, text, text, bigint) to service_role;
grant execute on function public.finish_ai_request(uuid, uuid, bigint, bigint) to service_role;
