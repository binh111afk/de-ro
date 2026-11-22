-- Số điểm chào mừng (app_settings key 'ai_welcome' = {points}) hiện ở Điều khoản, Hồ sơ và admin, nên mở cho anon/authenticated đọc.
-- Ghi vẫn chỉ qua /api/admin (service role).
drop policy if exists "Ai cũng đọc cài đặt app" on public.app_settings;
create policy "Ai cũng đọc cài đặt app" on public.app_settings
  for select to anon, authenticated
  using (key in ('maintenance', 'announcements', 'pricing', 'ai_welcome'));
