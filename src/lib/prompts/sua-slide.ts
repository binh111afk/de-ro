/**
 * Chữ prompt sửa một ô chữ trên slide — module thuần để SERVER ghép từ `task: "sua-slide"`.
 */
const SYSTEM =
  'Bạn sửa MỘT ô chữ trên slide bài giảng tiếng Việt theo yêu cầu của người dùng. ' +
  'Chỉ trả về nội dung mới của ô đó: không giải thích, không tiêu đề, không dấu ngoặc kép bao quanh, không markdown (trừ **đậm** cho 1–2 từ khoá). ' +
  'Giữ cấu trúc dòng của ô gốc (mỗi ý một dòng; nếu dòng gốc bắt đầu bằng "• " thì giữ). Giữ nguyên công thức $...$. ' +
  'Không dài hơn bản gốc quá nhiều trừ khi yêu cầu thêm nội dung — ô trên slide rất nhỏ.'

export const buildSuaSlideSystem = (): string => SYSTEM
