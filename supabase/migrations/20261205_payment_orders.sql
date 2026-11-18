-- Nạp điểm AI qua PayOS.
-- payment_orders: mỗi lần bấm "Thanh toán" là một đơn. Chỉ server (service role) tạo / cập nhật; người dùng đọc đơn của mình.
-- credit_payment_order: cộng điểm cho đơn đã trả tiền, gọi từ webhook PayOS hoặc lúc tra lại đơn. Gọi nhiều lần vẫn chỉ cộng một lần.
create table if not exists public.payment_orders (
  order_code bigint generated always as identity (start with 100001) primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  vnd integer not null check (vnd > 0),
  -- điểm sẽ cộng (đã gồm thưởng nếu có); lúc trả tiền có thể bị bớt thưởng nếu gói đó đã được thưởng ở đơn khác
  points integer not null check (points > 0),
  -- gói đã chọn (null = tự nhập số tiền) và phần điểm thưởng lần đầu trong `points`
  pack_vnd integer,
  bonus_points integer not null default 0 check (bonus_points >= 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'expired', 'failed')),
  payment_link_id text,
  checkout_url text,
  reference text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists payment_orders_user_idx on public.payment_orders (user_id, created_at desc);

alter table public.payment_orders enable row level security;
drop policy if exists "Xem đơn nạp của mình" on public.payment_orders;
create policy "Xem đơn nạp của mình" on public.payment_orders
  for select to authenticated using (user_id = (select auth.uid()));
revoke insert, update, delete on public.payment_orders from anon, authenticated;

-- Trả: 'ok' (vừa cộng), 'already' (đã cộng trước đó), 'missing', 'amount_mismatch'
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
  if p_amount is distinct from o.vnd then
    update public.payment_orders set status = 'failed', reference = left(p_reference, 120) where order_code = p_order;
    return 'amount_mismatch';
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
