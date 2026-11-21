-- Chặn đăng ký bằng email dùng một lần (yopmail, mailinator…): sáng 21/11 có người tạo ~30 tài khoản yopmail
-- để lấy quà chào mừng. Tên miền nằm ở bảng để sửa không cần migration; khớp cả tên miền con (a.b.yopmail.com).
-- Chỉ chặn khi tạo tài khoản hoặc đổi email; tài khoản cũ không bị ảnh hưởng.
create table if not exists public.blocked_email_domains (
  domain text primary key check (domain = lower(domain))
);
alter table public.blocked_email_domains enable row level security;
revoke all on public.blocked_email_domains from public, anon, authenticated;

insert into public.blocked_email_domains (domain) values
  ('yopmail.com'), ('yopmail.fr'), ('yopmail.net'), ('cool.fr.nf'), ('jetable.fr.nf'), ('nospam.ze.tc'),
  ('nomail.xl.cz'), ('mega.zik.dj'), ('speed.1s.fr'), ('courriel.fr.nf'), ('moncourrier.fr.nf'),
  ('monemail.fr.nf'), ('monmail.fr.nf'),
  ('mailinator.com'), ('guerrillamail.com'), ('guerrillamail.net'), ('guerrillamail.org'), ('guerrillamail.biz'),
  ('guerrillamail.de'), ('grr.la'), ('sharklasers.com'), ('spam4.me'),
  ('10minutemail.com'), ('10minutemail.net'), ('20minutemail.com'), ('tempmail.com'), ('temp-mail.org'),
  ('temp-mail.io'), ('tempmailo.com'), ('tempail.com'), ('tempr.email'), ('trashmail.com'), ('trashmail.net'),
  ('trashmail.de'), ('getnada.com'), ('nada.email'), ('dispostable.com'), ('maildrop.cc'), ('throwawaymail.com'),
  ('mohmal.com'), ('fakeinbox.com'), ('emailondeck.com'), ('mintemail.com'), ('mailnesia.com'), ('mytemp.email'),
  ('burnermail.io'), ('moakt.com'), ('discard.email'), ('mailcatch.com'), ('inboxkitten.com'), ('1secmail.com'),
  ('1secmail.net'), ('1secmail.org'), ('emailfake.com'), ('fakemail.net'), ('tmpmail.org'), ('tmpmail.net'),
  ('mailtemp.info'), ('luxusmail.org'), ('mail.tm'), ('dropmail.me'), ('harakirimail.com')
on conflict do nothing;

create or replace function public.reject_disposable_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  d text;
begin
  if new.email is null then
    return new;
  end if;
  d := lower(split_part(new.email, '@', 2));
  if exists (
    select 1 from public.blocked_email_domains b
    where d = b.domain or d like '%.' || b.domain
  ) then
    raise exception 'Không dùng được email tạm thời. Hãy dùng email thật của bạn.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke all on function public.reject_disposable_email() from public, anon, authenticated;

drop trigger if exists reject_disposable_email_ins on auth.users;
create trigger reject_disposable_email_ins
  before insert on auth.users
  for each row execute function public.reject_disposable_email();

drop trigger if exists reject_disposable_email_upd on auth.users;
create trigger reject_disposable_email_upd
  before update of email on auth.users
  for each row when (new.email is distinct from old.email)
  execute function public.reject_disposable_email();
