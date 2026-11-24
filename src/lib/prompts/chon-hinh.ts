/**
 * Chữ prompt chọn hình minh hoạ từ đề bài — module thuần để SERVER ghép từ `task: "chon-hinh"`.
 */
import { FIGURE_GUIDE } from './figureGuide.js'
import { sceneExamplesBlock } from './sceneExamples.js'

const TOOL_SYSTEM =
  'Bạn đọc một đề bài tiếng Việt và chọn MỘT hình minh hoạ cần vẽ. Chỉ trả về MỘT object JSON, không giải thích. Các loại:\n' +
  FIGURE_GUIDE +
  ' Có thể thêm "note". Hàm có tham số thì chọn giá trị minh hoạ và ghi trong note. ' +
  'note chỉ để ghi giá trị tham số đã chọn hoặc lí do không vẽ được; TUYỆT ĐỐI không ghi lời giải hay đáp số. ' +
  'Nếu đề không có gì để vẽ, trả {"kind":"none","note":"lí do ngắn"}.'

/** `text`: đề bài (chỉ dùng để chọn hình mẫu từ kho, không chép vào prompt) */
export const buildChonHinhSystem = (text = ''): string => TOOL_SYSTEM + sceneExamplesBlock(text)
