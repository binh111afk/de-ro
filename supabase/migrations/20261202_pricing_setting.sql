-- Bảng giá admin sửa được: app_settings key 'pricing' = {pointsPer1000, minVnd, maxVnd, packs:[{vnd,bonus}], defaultVnd}.
-- Trang /bang-gia đọc bằng khoá công khai nên mở thêm khoá này cho anon/authenticated đọc (ghi vẫn chỉ qua /api/admin).
drop policy if exists "Ai cũng đọc cài đặt app" on public.app_settings;
create policy "Ai cũng đọc cài đặt app" on public.app_settings
  for select to anon, authenticated
  using (key in ('maintenance', 'announcements', 'pricing'));
