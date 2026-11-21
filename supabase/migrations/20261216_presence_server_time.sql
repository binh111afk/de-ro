-- Strix 21/11: last_seen do trình duyệt gửi nên người dùng đặt được mốc tương lai → luôn "đang online".
-- Mốc thời gian luôn do server đặt, bỏ qua giá trị client gửi.
create or replace function public.presence_set_last_seen()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.last_seen := now();
  return new;
end;
$$;

revoke all on function public.presence_set_last_seen() from public, anon, authenticated;

drop trigger if exists presence_set_last_seen on public.presence;
create trigger presence_set_last_seen
  before insert or update on public.presence
  for each row execute function public.presence_set_last_seen();

-- Dọn mốc tương lai đã bị đặt trước đó.
update public.presence set last_seen = now() where last_seen > now();
