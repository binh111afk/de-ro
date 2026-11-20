-- Strix: cột `doc` của community_exams (toàn bộ nội dung đề, gồm danh sách lớp `online.settings.roster`) đọc được trực tiếp
-- bằng khoá công khai qua REST (`select=doc&listed=eq.true`), vòng qua mọi lọc ở API / RPC.
-- Client không bao giờ đọc `doc` qua REST (src/lib/community.ts chỉ lấy các cột thẻ); đề được mở qua RPC get_shared_exam
-- hoặc /api/exam (service role). Thu quyền đọc bảng rồi cấp lại theo danh sách cột, KHÔNG gồm `doc`.
-- Ghi (INSERT / UPDATE) cột `doc` giữ nguyên. Cột mới thêm vào bảng này sau này phải cấp SELECT riêng cho cột đó nếu client cần đọc.

revoke select on public.community_exams from anon, authenticated;
grant select (
  id, owner_id, title, subject, grade, school, created_at, question_count, duration_minutes, total_points,
  preview, listed, status, removed_reason, moderated_by, moderated_at, missing_keys
) on public.community_exams to anon, authenticated;
