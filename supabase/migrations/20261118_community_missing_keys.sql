-- Số câu trắc nghiệm / đúng-sai / trả lời ngắn chưa có đáp án của đề đăng lên,
-- để thẻ đề ở trang cộng đồng hiện nhãn "Chưa có đáp án" / "Thiếu N đáp án" mà không phải tải nội dung đề.
-- Trình duyệt tính lúc đăng (publishDoc). Đề đăng trước migration để null: không hiện nhãn cho tới khi đăng lại.
alter table public.community_exams
  add column if not exists missing_keys integer check (missing_keys is null or missing_keys >= 0);

comment on column public.community_exams.missing_keys is 'Số câu tự chấm được nhưng chưa có đáp án (null = chưa tính)';
