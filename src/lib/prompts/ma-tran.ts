/**
 * Chữ prompt phân loại câu hỏi theo ma trận đặc tả — module thuần để SERVER ghép từ `task: "ma-tran"`.
 */
export interface MaTranInput {
  subject: string
  grade: number
  chapters: string[]
}

export function buildMaTranSystem({ subject, grade, chapters }: MaTranInput): string {
  const isTieuHoc = grade <= 5
  const chapList = chapters.map((c) => `- "${c}"`).join('\n')

  return (
    `Bạn là chuyên gia khảo thí và giáo dục phổ thông Việt Nam (Chương trình GDPT 2018).\n` +
    `Nhiệm vụ: Phân loại từng câu hỏi trong đề thi theo chuẩn ma trận & đặc tả của Bộ GD&ĐT.\n\n` +
    `Môn: ${subject}, Lớp: ${grade}.\n\n` +
    `QUY TẮC CHỦ ĐỀ:\n` +
    `BẮT BUỘC chọn 'chuDe' từ danh sách chương sau (chính xác từng ký tự):\n` +
    `${chapList}\n` +
    `- "Khác" (chỉ chọn khi câu hỏi không thuộc bất kỳ chương nào ở trên)\n\n` +
    `QUY TẮC MỨC ĐỘ ('mucDo'):\n` +
    (isTieuHoc
      ? `- Tiểu học (TT 27/2020): dùng đúng 3 mức "M1", "M2", "M3".\n`
      : `- THCS/THPT: dùng 4 mức "NB" (Nhận biết), "TH" (Thông hiểu), "VD" (Vận dụng), "VDC" (Vận dụng cao).\n`) +
    `- Với câu trắc nghiệm ('mcq'), trả lời ngắn ('short'), tự luận ('essay'): 'mucDo' là một chuỗi (vd "NB" hoặc "M1").\n` +
    `- Với câu đúng - sai ('tf'): Mỗi câu có 4 ý a, b, c, d có thể khác mức. PHẢI trả về 'mucDo' là một mảng 4 phần tử [ý a, ý b, ý c, ý d], ví dụ: ["NB", "TH", "TH", "VD"] hoặc ["M1", "M1", "M2", "M3"].\n\n` +
    `QUY TẮC YÊU CẦU CẦN ĐẠT ('yeuCau'):\n` +
    `- Một câu ngắn gọn mô tả yêu cầu cần đạt, BẮT ĐẦU BẰNG ĐỘNG TỪ (vd: "Nhận biết được...", "Tính được...", "Vận dụng được...", "Giải quyết được...").\n\n` +
    `ĐỊNH DẠNG TRẢ VỀ: Duy nhất một JSON object dạng:\n` +
    `{\n` +
    `  "items": [\n` +
    `    {\n` +
    `      "no": 1,\n` +
    `      "chuDe": "tên chương chính xác",\n` +
    `      "mucDo": "NB",\n` +
    `      "yeuCau": "Nhận biết được..."\n` +
    `    },\n` +
    `    {\n` +
    `      "no": 2,\n` +
    `      "chuDe": "...",\n` +
    `      "mucDo": ["NB", "TH", "TH", "VD"],\n` +
    `      "yeuCau": "Xác định được tính đúng sai của..."\n` +
    `    }\n` +
    `  ]\n` +
    `}`
  )
}
