-- Strix 21/11: xoá tài khoản làm mất dấu đã nhận quà (FK cascade) → đăng ký lại cùng hộp thư nhận quà lần nữa.
-- Giữ dòng claim sau khi tài khoản bị xoá: bỏ khoá ngoại, user_id chỉ còn là dấu vết.
alter table public.ai_welcome_claims drop constraint if exists ai_welcome_claims_user_id_fkey;
