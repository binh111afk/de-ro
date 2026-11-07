/**
 * Câu THPT theo định dạng thi tốt nghiệp 2025 (trắc nghiệm, đúng/sai, trả lời ngắn), nhiều môn, soạn mới theo dạng và độ khó
 * của đề thi thử / kiểm tra các trường năm 2026. File sinh bằng scripts/bank/build.mjs — sửa câu thì sửa trực tiếp tại đây.
 */
import type { BankEntry } from './bank'

export const BANK_THPT2: BankEntry[] = [
  {
    "id": "thpt-anh-a-01",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the notice and choose the word that best fits the gap.\n\nNOTICE\nThe library will be closed ___ Monday, May 5th, for maintenance.",
    "options": [
      {
        "key": "A",
        "text": "on"
      },
      {
        "key": "B",
        "text": "at"
      },
      {
        "key": "C",
        "text": "in"
      },
      {
        "key": "D",
        "text": "from"
      }
    ],
    "answer": "A",
    "explanation": "Dùng giới từ 'on' trước ngày trong tuần (on Monday).",
    "points": 0.25,
    "tags": [
      "điền từ",
      "giới từ",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-a-02",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the poster and choose the word that best fits the gap.\n\nGRAND OPENING!\nJoin us ___ Saturday for free samples and big discounts.",
    "options": [
      {
        "key": "A",
        "text": "in"
      },
      {
        "key": "B",
        "text": "on"
      },
      {
        "key": "C",
        "text": "at"
      },
      {
        "key": "D",
        "text": "to"
      }
    ],
    "answer": "B",
    "explanation": "Dùng 'on' trước ngày trong tuần (on Saturday).",
    "points": 0.25,
    "tags": [
      "điền từ",
      "giới từ",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-a-03",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the notice and choose the word that best fits the gap.\n\nLOST AND FOUND\nA black wallet was found near the canteen. Please ___ the front desk if it is yours.",
    "options": [
      {
        "key": "A",
        "text": "contact to"
      },
      {
        "key": "B",
        "text": "contacting"
      },
      {
        "key": "C",
        "text": "contacts"
      },
      {
        "key": "D",
        "text": "contact"
      }
    ],
    "answer": "D",
    "explanation": "Câu mệnh lệnh cần động từ nguyên mẫu 'contact'; 'contact' là ngoại động từ nên không dùng 'to'.",
    "points": 0.25,
    "tags": [
      "điền từ",
      "động từ",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-a-04",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the advertisement and choose the word that best fits the gap.\n\nMEGA SALE!\nAll shoes are 20% ___ this weekend only!",
    "options": [
      {
        "key": "A",
        "text": "on"
      },
      {
        "key": "B",
        "text": "out"
      },
      {
        "key": "C",
        "text": "off"
      },
      {
        "key": "D",
        "text": "up"
      }
    ],
    "answer": "C",
    "explanation": "'20% off' nghĩa là giảm giá 20%.",
    "points": 0.25,
    "tags": [
      "điền từ",
      "từ vựng",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-a-05",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the announcement and choose the word that best fits the gap.\n\nANNOUNCEMENT\nThe flight to Da Nang has been ___ due to bad weather.",
    "options": [
      {
        "key": "A",
        "text": "delayed"
      },
      {
        "key": "B",
        "text": "delaying"
      },
      {
        "key": "C",
        "text": "delay"
      },
      {
        "key": "D",
        "text": "delays"
      }
    ],
    "answer": "A",
    "explanation": "Câu bị động 'has been + quá khứ phân từ' (has been delayed).",
    "points": 0.25,
    "tags": [
      "điền từ",
      "câu bị động",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-a-06",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the job advertisement and choose the word that best fits the gap.\n\nJOB VACANCY\nWe are looking ___ an experienced receptionist to join our hotel team.",
    "options": [
      {
        "key": "A",
        "text": "at"
      },
      {
        "key": "B",
        "text": "for"
      },
      {
        "key": "C",
        "text": "after"
      },
      {
        "key": "D",
        "text": "up"
      }
    ],
    "answer": "B",
    "explanation": "'look for' nghĩa là tìm kiếm.",
    "points": 0.25,
    "tags": [
      "điền từ",
      "cụm động từ",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-a-07",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the notice and choose the word that best fits the gap.\n\nREMINDER\nAll students must ___ their ID cards at all times while on campus.",
    "options": [
      {
        "key": "A",
        "text": "put"
      },
      {
        "key": "B",
        "text": "bring"
      },
      {
        "key": "C",
        "text": "carry"
      },
      {
        "key": "D",
        "text": "hold"
      }
    ],
    "answer": "C",
    "explanation": "'carry' nghĩa là mang theo bên mình, phù hợp với ý 'mang theo thẻ căn cước mọi lúc'.",
    "points": 0.25,
    "tags": [
      "điền từ",
      "từ vựng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-a-08",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the information and choose the word that best fits the gap.\n\nVISITOR INFORMATION\nThe museum is open daily ___ 8 a.m. to 5 p.m.",
    "options": [
      {
        "key": "A",
        "text": "at"
      },
      {
        "key": "B",
        "text": "in"
      },
      {
        "key": "C",
        "text": "from"
      },
      {
        "key": "D",
        "text": "since"
      }
    ],
    "answer": "C",
    "explanation": "Cấu trúc 'from ... to ...' chỉ khoảng thời gian mở cửa.",
    "points": 0.25,
    "tags": [
      "điền từ",
      "giới từ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-a-09",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the notice and choose the word that best fits the gap.\n\nCONCERT RULES\nPlease turn ___ your mobile phones before the performance begins.",
    "options": [
      {
        "key": "A",
        "text": "off"
      },
      {
        "key": "B",
        "text": "on"
      },
      {
        "key": "C",
        "text": "up"
      },
      {
        "key": "D",
        "text": "down"
      }
    ],
    "answer": "A",
    "explanation": "'turn off' nghĩa là tắt (điện thoại).",
    "points": 0.25,
    "tags": [
      "điền từ",
      "cụm động từ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-a-10",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the notice and choose the word that best fits the gap.\n\nMEETING NOTICE\nThe staff meeting has been moved ___ 3 p.m. to 4 p.m. this Friday.",
    "options": [
      {
        "key": "A",
        "text": "since"
      },
      {
        "key": "B",
        "text": "from"
      },
      {
        "key": "C",
        "text": "at"
      },
      {
        "key": "D",
        "text": "in"
      }
    ],
    "answer": "B",
    "explanation": "'moved from ... to ...' nghĩa là dời từ ... sang ....",
    "points": 0.25,
    "tags": [
      "điền từ",
      "giới từ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-a-11",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the advertisement and choose the word that best fits the gap.\n\nFOR RENT\nA fully ___ apartment with two bedrooms and a balcony, close to the city center.",
    "options": [
      {
        "key": "A",
        "text": "furnish"
      },
      {
        "key": "B",
        "text": "furnishing"
      },
      {
        "key": "C",
        "text": "furniture"
      },
      {
        "key": "D",
        "text": "furnished"
      }
    ],
    "answer": "D",
    "explanation": "'fully furnished' nghĩa là được trang bị nội thất đầy đủ (quá khứ phân từ làm tính từ).",
    "points": 0.25,
    "tags": [
      "điền từ",
      "từ loại",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-a-12",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the advertisement and choose the word that best fits the gap.\n\nWIN A TRIP TO PHU QUOC!\nSimply ___ this form and drop it in the box before June 30.",
    "options": [
      {
        "key": "A",
        "text": "fill up"
      },
      {
        "key": "B",
        "text": "fill off"
      },
      {
        "key": "C",
        "text": "fill over"
      },
      {
        "key": "D",
        "text": "fill in"
      }
    ],
    "answer": "D",
    "explanation": "'fill in a form' nghĩa là điền vào mẫu đơn.",
    "points": 0.25,
    "tags": [
      "điền từ",
      "cụm động từ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-a-13",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the weather bulletin and choose the word that best fits the gap.\n\nWEATHER WARNING\nHeavy rain ___ expected in central provinces tonight.",
    "options": [
      {
        "key": "A",
        "text": "is"
      },
      {
        "key": "B",
        "text": "are"
      },
      {
        "key": "C",
        "text": "be"
      },
      {
        "key": "D",
        "text": "been"
      }
    ],
    "answer": "A",
    "explanation": "'Heavy rain' là danh từ không đếm được, động từ số ít: 'is expected'.",
    "points": 0.25,
    "tags": [
      "điền từ",
      "ngữ pháp",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-a-14",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Choose the correct order of the sentences to make a complete letter.\n\n(A) Dear Mr. Nam,\n(B) I am writing to apply for the sales assistant position advertised in yesterday's newspaper.\n(C) Thank you for your consideration. I look forward to hearing from you soon.\n(D) I have three years of experience in retail and good communication skills.",
    "options": [
      {
        "key": "A",
        "text": "A-B-D-C"
      },
      {
        "key": "B",
        "text": "A-B-C-D"
      },
      {
        "key": "C",
        "text": "B-A-D-C"
      },
      {
        "key": "D",
        "text": "A-D-B-C"
      }
    ],
    "answer": "A",
    "explanation": "Thư xin việc: lời chào (A) → mục đích (B) → kinh nghiệm (D) → cảm ơn và kết thư (C).",
    "points": 0.25,
    "tags": [
      "sắp xếp câu",
      "thư từ",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-a-15",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Choose the correct order of the sentences to make a complete message.\n\n(A) Hi Mai,\n(B) I am having a birthday party at my house this Saturday at 7 p.m.\n(C) Let me know if you can come!\n(D) There will be music, food and games.",
    "options": [
      {
        "key": "A",
        "text": "A-D-B-C"
      },
      {
        "key": "B",
        "text": "A-B-D-C"
      },
      {
        "key": "C",
        "text": "B-A-C-D"
      },
      {
        "key": "D",
        "text": "A-C-B-D"
      }
    ],
    "answer": "B",
    "explanation": "Tin nhắn mời: lời chào (A) → thông tin bữa tiệc (B) → chi tiết thêm (D) → mời xác nhận (C).",
    "points": 0.25,
    "tags": [
      "sắp xếp câu",
      "tin nhắn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-a-16",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Choose the correct order of the sentences to make a complete set of instructions.\n\n(A) First, boil 400 ml of water.\n(B) Next, put the noodles and the seasoning into a bowl.\n(C) Finally, stir well and enjoy your meal.\n(D) Then, pour the boiling water into the bowl and cover it for three minutes.",
    "options": [
      {
        "key": "A",
        "text": "A-B-C-D"
      },
      {
        "key": "B",
        "text": "B-A-D-C"
      },
      {
        "key": "C",
        "text": "A-B-D-C"
      },
      {
        "key": "D",
        "text": "A-D-B-C"
      }
    ],
    "answer": "C",
    "explanation": "Trình tự chỉ dẫn: First (A) → Next (B) → Then (D) → Finally (C).",
    "points": 0.25,
    "tags": [
      "sắp xếp câu",
      "chỉ dẫn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-a-17",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Choose the correct order of the sentences to make a complete email.\n\n(A) Dear Ms. Hoa,\n(B) I would like to order ten desks for our new office.\n(C) Best regards, Minh.\n(D) Could you please send me a quotation for these products?",
    "options": [
      {
        "key": "A",
        "text": "A-B-C-D"
      },
      {
        "key": "B",
        "text": "A-D-B-C"
      },
      {
        "key": "C",
        "text": "B-A-D-C"
      },
      {
        "key": "D",
        "text": "A-B-D-C"
      }
    ],
    "answer": "D",
    "explanation": "Email đặt hàng: chào (A) → yêu cầu (B) → hỏi thêm (D) → kết thư (C).",
    "points": 0.25,
    "tags": [
      "sắp xếp câu",
      "email",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-a-18",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Choose the correct order of the sentences to make a complete set of contest instructions.\n\n(A) Attach a photo of your garden.\n(B) Send both documents to our office before June 30.\n(C) To enter the contest, fill in the entry form.\n(D) Winners will receive a cash prize of two million dong.",
    "options": [
      {
        "key": "A",
        "text": "A-C-B-D"
      },
      {
        "key": "B",
        "text": "C-A-B-D"
      },
      {
        "key": "C",
        "text": "C-B-A-D"
      },
      {
        "key": "D",
        "text": "A-B-C-D"
      }
    ],
    "answer": "B",
    "explanation": "Các bước dự thi: bắt đầu bằng mục đích (C) → đính kèm ảnh (A) → gửi giấy tờ (B) → phần thưởng (D).",
    "points": 0.25,
    "tags": [
      "sắp xếp câu",
      "hướng dẫn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-a-19",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Choose the correct order of the sentences to make a complete email.\n\n(A) Thank you for your email.\n(B) However, we expect new stock to arrive next week.\n(C) I am sorry to inform you that the item you ordered is out of stock.\n(D) I will contact you as soon as it arrives.",
    "options": [
      {
        "key": "A",
        "text": "A-B-C-D"
      },
      {
        "key": "B",
        "text": "C-A-B-D"
      },
      {
        "key": "C",
        "text": "A-C-B-D"
      },
      {
        "key": "D",
        "text": "A-C-D-B"
      }
    ],
    "answer": "C",
    "explanation": "Email phản hồi: cảm ơn (A) → thông tin xấu (C) → giải pháp 'however' (B) → cam kết (D).",
    "points": 0.25,
    "tags": [
      "sắp xếp câu",
      "email",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-a-20",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Choose the correct order of the sentences to make a complete notice.\n\n(A) The school English club meets every Friday afternoon.\n(B) New members are always welcome.\n(C) For more information, please contact Miss Lan in room 12.\n(D) Members practise speaking through games and short plays.",
    "options": [
      {
        "key": "A",
        "text": "A-B-D-C"
      },
      {
        "key": "B",
        "text": "A-D-B-C"
      },
      {
        "key": "C",
        "text": "D-A-B-C"
      },
      {
        "key": "D",
        "text": "A-B-C-D"
      }
    ],
    "answer": "B",
    "explanation": "Thông báo câu lạc bộ: hoạt động chung (A) → nội dung sinh hoạt (D) → mời tham gia (B) → thông tin liên hệ (C).",
    "points": 0.25,
    "tags": [
      "sắp xếp câu",
      "thông báo",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-a-21",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Choose the correct order of the sentences to make a complete letter.\n\n(A) Dear Grandma,\n(B) How are you? I hope you are well.\n(C) I will visit you during the summer holiday.\n(D) I got high marks in all my subjects this term.",
    "options": [
      {
        "key": "A",
        "text": "A-B-C-D"
      },
      {
        "key": "B",
        "text": "A-D-B-C"
      },
      {
        "key": "C",
        "text": "A-B-D-C"
      },
      {
        "key": "D",
        "text": "B-A-D-C"
      }
    ],
    "answer": "C",
    "explanation": "Thư cho bà: chào (A) → hỏi thăm (B) → báo tin tốt (D) → hẹn thăm (C).",
    "points": 0.25,
    "tags": [
      "sắp xếp câu",
      "thư từ",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-a-22",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Choose the correct order of the sentences to make a complete set of instructions.\n\n(A) Next, dig a hole about 30 cm deep.\n(B) First, choose a sunny spot in your garden.\n(C) Finally, water the tree every morning.\n(D) Then, put the young tree into the hole and cover its roots with soil.",
    "options": [
      {
        "key": "A",
        "text": "B-A-D-C"
      },
      {
        "key": "B",
        "text": "A-B-D-C"
      },
      {
        "key": "C",
        "text": "B-A-C-D"
      },
      {
        "key": "D",
        "text": "A-B-C-D"
      }
    ],
    "answer": "A",
    "explanation": "Trình tự: First (B) → Next (A) → Then (D) → Finally (C).",
    "points": 0.25,
    "tags": [
      "sắp xếp câu",
      "chỉ dẫn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-a-23",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Choose the correct order of the sentences to make a complete email.\n\n(A) I would like to book two single rooms from July 1st to July 3rd.\n(B) Dear Sir or Madam,\n(C) Could you please confirm the price per night?\n(D) I look forward to your reply.",
    "options": [
      {
        "key": "A",
        "text": "A-B-C-D"
      },
      {
        "key": "B",
        "text": "B-A-D-C"
      },
      {
        "key": "C",
        "text": "B-C-A-D"
      },
      {
        "key": "D",
        "text": "B-A-C-D"
      }
    ],
    "answer": "D",
    "explanation": "Email đặt phòng: chào (B) → yêu cầu (A) → hỏi giá (C) → mong hồi âm (D).",
    "points": 0.25,
    "tags": [
      "sắp xếp câu",
      "email",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-a-24",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Choose the correct order of the sentences to make a complete set of instructions.\n\n(A) Next, add 200 ml of milk and some honey.\n(B) First, cut two bananas into small pieces.\n(C) Finally, serve it in a tall glass with ice.\n(D) Then, blend everything for one minute.",
    "options": [
      {
        "key": "A",
        "text": "B-D-A-C"
      },
      {
        "key": "B",
        "text": "B-A-C-D"
      },
      {
        "key": "C",
        "text": "B-A-D-C"
      },
      {
        "key": "D",
        "text": "A-B-D-C"
      }
    ],
    "answer": "C",
    "explanation": "Trình tự: First (B) → Next (A) → Then (D) → Finally (C).",
    "points": 0.25,
    "tags": [
      "sắp xếp câu",
      "chỉ dẫn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-a-25",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Choose the correct order of the sentences to make a complete message.\n\n(A) Our group will meet at the school library at 3 p.m. tomorrow.\n(B) Hi Lan,\n(C) Please bring the report we discussed last week.\n(D) We need to finish our history project before Friday.",
    "options": [
      {
        "key": "A",
        "text": "B-D-A-C"
      },
      {
        "key": "B",
        "text": "B-A-C-D"
      },
      {
        "key": "C",
        "text": "A-B-D-C"
      },
      {
        "key": "D",
        "text": "B-A-D-C"
      }
    ],
    "answer": "D",
    "explanation": "Tin nhắn nhóm: chào (B) → hẹn giờ địa điểm (A) → mục tiêu (D) → yêu cầu mang tài liệu (C).",
    "points": 0.25,
    "tags": [
      "sắp xếp câu",
      "tin nhắn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-b-01",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and choose the best answer.\n\nSmartphones have become an essential part of our daily lives. According to a recent survey, about 90% of young people in Viet Nam own a smartphone. These devices allow users to communicate with friends, study online, and even shop without leaving home. However, experts warn that spending too much time on smartphones can be harmful. Students who use their phones for more than five hours a day often find it difficult to concentrate in class. They may also suffer from eye strain and poor sleep quality. Therefore, many schools now encourage students to limit screen time and take part in outdoor activities. Parents are also advised to set clear rules about phone use at home. Used wisely, smartphones can be a wonderful learning tool instead of a distraction.\n\nWhat is the main idea of the passage?",
    "options": [
      {
        "key": "A",
        "text": "Smartphones are dangerous devices that should be banned."
      },
      {
        "key": "B",
        "text": "Smartphones bring many benefits but should be used wisely."
      },
      {
        "key": "C",
        "text": "Students should never use smartphones."
      },
      {
        "key": "D",
        "text": "Schools have banned all smartphones."
      }
    ],
    "answer": "B",
    "explanation": "Bài nói về lợi ích của smartphone và lời khuyên dùng hợp lý ('Used wisely, smartphones can be a wonderful learning tool').",
    "points": 0.25,
    "tags": [
      "đọc hiểu",
      "ý chính",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-b-02",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and choose the best answer.\n\nSmartphones have become an essential part of our daily lives. According to a recent survey, about 90% of young people in Viet Nam own a smartphone. These devices allow users to communicate with friends, study online, and even shop without leaving home. However, experts warn that spending too much time on smartphones can be harmful. Students who use their phones for more than five hours a day often find it difficult to concentrate in class. They may also suffer from eye strain and poor sleep quality. Therefore, many schools now encourage students to limit screen time and take part in outdoor activities. Parents are also advised to set clear rules about phone use at home. Used wisely, smartphones can be a wonderful learning tool instead of a distraction.\n\nAccording to the survey, about 90% of young people in Viet Nam ___.",
    "options": [
      {
        "key": "A",
        "text": "own a smartphone"
      },
      {
        "key": "B",
        "text": "dislike smartphones"
      },
      {
        "key": "C",
        "text": "work in technology companies"
      },
      {
        "key": "D",
        "text": "study abroad"
      }
    ],
    "answer": "A",
    "explanation": "Câu thứ hai của bài: 'about 90% of young people in Viet Nam own a smartphone'.",
    "points": 0.25,
    "tags": [
      "đọc hiểu",
      "chi tiết",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-b-03",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and choose the best answer.\n\nSmartphones have become an essential part of our daily lives. According to a recent survey, about 90% of young people in Viet Nam own a smartphone. These devices allow users to communicate with friends, study online, and even shop without leaving home. However, experts warn that spending too much time on smartphones can be harmful. Students who use their phones for more than five hours a day often find it difficult to concentrate in class. They may also suffer from eye strain and poor sleep quality. Therefore, many schools now encourage students to limit screen time and take part in outdoor activities. Parents are also advised to set clear rules about phone use at home. Used wisely, smartphones can be a wonderful learning tool instead of a distraction.\n\nThe word 'essential' in the passage is closest in meaning to ___.",
    "options": [
      {
        "key": "A",
        "text": "unnecessary"
      },
      {
        "key": "B",
        "text": "expensive"
      },
      {
        "key": "C",
        "text": "modern"
      },
      {
        "key": "D",
        "text": "very important"
      }
    ],
    "answer": "D",
    "explanation": "'Essential' nghĩa là rất cần thiết, rất quan trọng.",
    "points": 0.25,
    "tags": [
      "đọc hiểu",
      "từ vựng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-b-04",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and choose the best answer.\n\nSmartphones have become an essential part of our daily lives. According to a recent survey, about 90% of young people in Viet Nam own a smartphone. These devices allow users to communicate with friends, study online, and even shop without leaving home. However, experts warn that spending too much time on smartphones can be harmful. Students who use their phones for more than five hours a day often find it difficult to concentrate in class. They may also suffer from eye strain and poor sleep quality. Therefore, many schools now encourage students to limit screen time and take part in outdoor activities. Parents are also advised to set clear rules about phone use at home. Used wisely, smartphones can be a wonderful learning tool instead of a distraction.\n\nStudents who use their phones for more than five hours a day often ___.",
    "options": [
      {
        "key": "A",
        "text": "get better grades"
      },
      {
        "key": "B",
        "text": "concentrate better"
      },
      {
        "key": "C",
        "text": "find it hard to concentrate in class"
      },
      {
        "key": "D",
        "text": "sleep very well"
      }
    ],
    "answer": "C",
    "explanation": "'Students who use their phones for more than five hours a day often find it difficult to concentrate in class'.",
    "points": 0.25,
    "tags": [
      "đọc hiểu",
      "chi tiết",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-b-05",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and choose the best answer.\n\nSmartphones have become an essential part of our daily lives. According to a recent survey, about 90% of young people in Viet Nam own a smartphone. These devices allow users to communicate with friends, study online, and even shop without leaving home. However, experts warn that spending too much time on smartphones can be harmful. Students who use their phones for more than five hours a day often find it difficult to concentrate in class. They may also suffer from eye strain and poor sleep quality. Therefore, many schools now encourage students to limit screen time and take part in outdoor activities. Parents are also advised to set clear rules about phone use at home. Used wisely, smartphones can be a wonderful learning tool instead of a distraction.\n\nThe word 'They' in the passage refers to ___.",
    "options": [
      {
        "key": "A",
        "text": "experts"
      },
      {
        "key": "B",
        "text": "parents"
      },
      {
        "key": "C",
        "text": "schools"
      },
      {
        "key": "D",
        "text": "students"
      }
    ],
    "answer": "D",
    "explanation": "'They' thay thế cho 'students' vừa nhắc ở câu trước.",
    "points": 0.25,
    "tags": [
      "đọc hiểu",
      "đại từ",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-b-06",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and choose the best answer.\n\nSmartphones have become an essential part of our daily lives. According to a recent survey, about 90% of young people in Viet Nam own a smartphone. These devices allow users to communicate with friends, study online, and even shop without leaving home. However, experts warn that spending too much time on smartphones can be harmful. Students who use their phones for more than five hours a day often find it difficult to concentrate in class. They may also suffer from eye strain and poor sleep quality. Therefore, many schools now encourage students to limit screen time and take part in outdoor activities. Parents are also advised to set clear rules about phone use at home. Used wisely, smartphones can be a wonderful learning tool instead of a distraction.\n\nWhich of the following is NOT mentioned as advice in the passage?",
    "options": [
      {
        "key": "A",
        "text": "limiting screen time"
      },
      {
        "key": "B",
        "text": "selling their smartphones"
      },
      {
        "key": "C",
        "text": "taking part in outdoor activities"
      },
      {
        "key": "D",
        "text": "setting rules about phone use"
      }
    ],
    "answer": "B",
    "explanation": "Bài nêu: hạn chế thời gian màn hình, tham gia hoạt động ngoài trời, quy định dùng điện thoại; không nêu bán điện thoại.",
    "points": 0.25,
    "tags": [
      "đọc hiểu",
      "chi tiết",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-b-07",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and choose the best answer.\n\nSmartphones have become an essential part of our daily lives. According to a recent survey, about 90% of young people in Viet Nam own a smartphone. These devices allow users to communicate with friends, study online, and even shop without leaving home. However, experts warn that spending too much time on smartphones can be harmful. Students who use their phones for more than five hours a day often find it difficult to concentrate in class. They may also suffer from eye strain and poor sleep quality. Therefore, many schools now encourage students to limit screen time and take part in outdoor activities. Parents are also advised to set clear rules about phone use at home. Used wisely, smartphones can be a wonderful learning tool instead of a distraction.\n\nWhat can be inferred from the last sentence of the passage?",
    "options": [
      {
        "key": "A",
        "text": "Smartphones are always harmful to students."
      },
      {
        "key": "B",
        "text": "With proper use, smartphones can support learning."
      },
      {
        "key": "C",
        "text": "Parents do not care about phone use."
      },
      {
        "key": "D",
        "text": "Outdoor activities are useless."
      }
    ],
    "answer": "B",
    "explanation": "'Used wisely, smartphones can be a wonderful learning tool instead of a distraction' — dùng đúng cách thì điện thoại hỗ trợ học tập.",
    "points": 0.25,
    "tags": [
      "đọc hiểu",
      "suy luận",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-b-08",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and choose the best answer.\n\nGoing green is becoming more popular in Viet Nam. Many families now bring their own bags to the market instead of using plastic ones. Supermarkets have started selling paper bags and encouraging customers to reuse them. In big cities, young people take part in campaigns to collect rubbish on beaches and plant trees in their neighbourhoods. These small actions help reduce pollution and protect the environment for future generations. Experts say that everyone can contribute to a greener planet by saving energy at home, recycling waste, and using public transport more often. Although one person's effort may seem small, millions of people doing the same thing can make a big difference.\n\nWhat is the main idea of the passage?",
    "options": [
      {
        "key": "A",
        "text": "Plastic bags are cheap and convenient."
      },
      {
        "key": "B",
        "text": "Beaches in Viet Nam are very dirty."
      },
      {
        "key": "C",
        "text": "Small individual actions can help protect the environment."
      },
      {
        "key": "D",
        "text": "Public transport is expensive."
      }
    ],
    "answer": "C",
    "explanation": "Ý chính: những hành động nhỏ của mỗi người góp phần bảo vệ môi trường.",
    "points": 0.25,
    "tags": [
      "đọc hiểu",
      "ý chính",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-b-09",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and choose the best answer.\n\nGoing green is becoming more popular in Viet Nam. Many families now bring their own bags to the market instead of using plastic ones. Supermarkets have started selling paper bags and encouraging customers to reuse them. In big cities, young people take part in campaigns to collect rubbish on beaches and plant trees in their neighbourhoods. These small actions help reduce pollution and protect the environment for future generations. Experts say that everyone can contribute to a greener planet by saving energy at home, recycling waste, and using public transport more often. Although one person's effort may seem small, millions of people doing the same thing can make a big difference.\n\nMany families bring their own bags to the market in order to ___.",
    "options": [
      {
        "key": "A",
        "text": "save money"
      },
      {
        "key": "B",
        "text": "follow fashion"
      },
      {
        "key": "C",
        "text": "please supermarkets"
      },
      {
        "key": "D",
        "text": "reduce plastic waste"
      }
    ],
    "answer": "D",
    "explanation": "'instead of using plastic ones' — mang túi riêng để hạn chế túi ni-lông.",
    "points": 0.25,
    "tags": [
      "đọc hiểu",
      "chi tiết",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-b-10",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and choose the best answer.\n\nGoing green is becoming more popular in Viet Nam. Many families now bring their own bags to the market instead of using plastic ones. Supermarkets have started selling paper bags and encouraging customers to reuse them. In big cities, young people take part in campaigns to collect rubbish on beaches and plant trees in their neighbourhoods. These small actions help reduce pollution and protect the environment for future generations. Experts say that everyone can contribute to a greener planet by saving energy at home, recycling waste, and using public transport more often. Although one person's effort may seem small, millions of people doing the same thing can make a big difference.\n\nThe word 'campaigns' in the passage is closest in meaning to ___.",
    "options": [
      {
        "key": "A",
        "text": "organized activities"
      },
      {
        "key": "B",
        "text": "competitions"
      },
      {
        "key": "C",
        "text": "holidays"
      },
      {
        "key": "D",
        "text": "contracts"
      }
    ],
    "answer": "A",
    "explanation": "'Campaigns' là các hoạt động có tổ chức (chiến dịch).",
    "points": 0.25,
    "tags": [
      "đọc hiểu",
      "từ vựng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-b-11",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and choose the best answer.\n\nGoing green is becoming more popular in Viet Nam. Many families now bring their own bags to the market instead of using plastic ones. Supermarkets have started selling paper bags and encouraging customers to reuse them. In big cities, young people take part in campaigns to collect rubbish on beaches and plant trees in their neighbourhoods. These small actions help reduce pollution and protect the environment for future generations. Experts say that everyone can contribute to a greener planet by saving energy at home, recycling waste, and using public transport more often. Although one person's effort may seem small, millions of people doing the same thing can make a big difference.\n\nWhich of the following activities is NOT mentioned in the passage?",
    "options": [
      {
        "key": "A",
        "text": "building more factories"
      },
      {
        "key": "B",
        "text": "planting trees"
      },
      {
        "key": "C",
        "text": "collecting rubbish on beaches"
      },
      {
        "key": "D",
        "text": "saving energy at home"
      }
    ],
    "answer": "A",
    "explanation": "Bài nêu trồng cây, dọn rác bãi biển, tiết kiệm điện; không nêu xây nhà máy.",
    "points": 0.25,
    "tags": [
      "đọc hiểu",
      "chi tiết",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-b-12",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and choose the best answer.\n\nGoing green is becoming more popular in Viet Nam. Many families now bring their own bags to the market instead of using plastic ones. Supermarkets have started selling paper bags and encouraging customers to reuse them. In big cities, young people take part in campaigns to collect rubbish on beaches and plant trees in their neighbourhoods. These small actions help reduce pollution and protect the environment for future generations. Experts say that everyone can contribute to a greener planet by saving energy at home, recycling waste, and using public transport more often. Although one person's effort may seem small, millions of people doing the same thing can make a big difference.\n\nThe phrase 'make a big difference' in the last sentence means ___.",
    "options": [
      {
        "key": "A",
        "text": "change nothing at all"
      },
      {
        "key": "B",
        "text": "have an argument"
      },
      {
        "key": "C",
        "text": "create an important positive change"
      },
      {
        "key": "D",
        "text": "spend a lot of money"
      }
    ],
    "answer": "C",
    "explanation": "'Make a difference' = tạo ra sự thay đổi tích cực, đáng kể.",
    "points": 0.25,
    "tags": [
      "đọc hiểu",
      "từ vựng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-b-13",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and choose the best answer.\n\nGoing green is becoming more popular in Viet Nam. Many families now bring their own bags to the market instead of using plastic ones. Supermarkets have started selling paper bags and encouraging customers to reuse them. In big cities, young people take part in campaigns to collect rubbish on beaches and plant trees in their neighbourhoods. These small actions help reduce pollution and protect the environment for future generations. Experts say that everyone can contribute to a greener planet by saving energy at home, recycling waste, and using public transport more often. Although one person's effort may seem small, millions of people doing the same thing can make a big difference.\n\nAccording to the passage, protecting the environment is ___.",
    "options": [
      {
        "key": "A",
        "text": "only the government's job"
      },
      {
        "key": "B",
        "text": "impossible for individuals"
      },
      {
        "key": "C",
        "text": "only for young people"
      },
      {
        "key": "D",
        "text": "everyone's responsibility"
      }
    ],
    "answer": "D",
    "explanation": "'Everyone can contribute to a greener planet' — trách nhiệm của tất cả mọi người.",
    "points": 0.25,
    "tags": [
      "đọc hiểu",
      "suy luận",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-b-14",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the paragraph and choose the sentence that best fits the gap.\n\nCamping is a popular activity among young people. (1) ___. First, it helps them relax after stressful school days. Second, they can learn useful skills such as cooking and teamwork. Finally, camping trips create wonderful memories with friends.",
    "options": [
      {
        "key": "A",
        "text": "There are several reasons why camping is good for students."
      },
      {
        "key": "B",
        "text": "Camping is very expensive for families."
      },
      {
        "key": "C",
        "text": "Nobody enjoys camping these days."
      },
      {
        "key": "D",
        "text": "Camping is not allowed in Viet Nam."
      }
    ],
    "answer": "A",
    "explanation": "Câu dẫn giới thiệu 'First, Second, Finally' cần một câu khái quát về các lý do.",
    "points": 0.25,
    "tags": [
      "điền câu",
      "liên kết đoạn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-b-15",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the paragraph and choose the sentence that best fits the gap.\n\nMy neighbourhood has changed a lot in the last five years. (1) ___. There is also a new park where children play every afternoon. The streets are cleaner, and people seem happier.",
    "options": [
      {
        "key": "A",
        "text": "The park has been closed for years."
      },
      {
        "key": "B",
        "text": "A new shopping mall was built near the market last year."
      },
      {
        "key": "C",
        "text": "I dislike living in this neighbourhood."
      },
      {
        "key": "D",
        "text": "The roads are still very narrow."
      }
    ],
    "answer": "B",
    "explanation": "Câu điền phải nêu một sự thay đổi tích cực, phù hợp với nội dung đoạn.",
    "points": 0.25,
    "tags": [
      "điền câu",
      "liên kết đoạn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-b-16",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the paragraph and choose the sentence that best fits the gap.\n\nReading books brings many benefits. (1) ___. It also improves vocabulary and writing skills. Moreover, books help us understand other people and cultures.",
    "options": [
      {
        "key": "A",
        "text": "First of all, reading is a great way to gain knowledge."
      },
      {
        "key": "B",
        "text": "Books are heavy to carry."
      },
      {
        "key": "C",
        "text": "I never read books in my free time."
      },
      {
        "key": "D",
        "text": "Libraries are old buildings."
      }
    ],
    "answer": "A",
    "explanation": "Câu đầu của chuỗi lý do ('It also...', 'Moreover...') phải là lợi ích đầu tiên.",
    "points": 0.25,
    "tags": [
      "điền câu",
      "liên kết đoạn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-b-17",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the paragraph and choose the sentence that best fits the gap.\n\nLearning a foreign language takes time and patience. (1) ___. Listening to songs and watching films also make learning more enjoyable. With regular practice, anyone can make progress.",
    "options": [
      {
        "key": "A",
        "text": "Languages are completely useless."
      },
      {
        "key": "B",
        "text": "You should stop learning immediately."
      },
      {
        "key": "C",
        "text": "Learners should practise speaking every day."
      },
      {
        "key": "D",
        "text": "Only young children can learn languages."
      }
    ],
    "answer": "C",
    "explanation": "Câu điền đưa ra lời khuyên học, dẫn vào các ví dụ 'Listening to songs...'.",
    "points": 0.25,
    "tags": [
      "điền câu",
      "liên kết đoạn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-b-18",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the paragraph and choose the sentence that best fits the gap.\n\nVolunteering is good for both the community and the volunteers themselves. (1) ___. They also learn new skills and make new friends. Many volunteers say the experience makes them more confident.",
    "options": [
      {
        "key": "A",
        "text": "Volunteers help poor children, old people, and people with disabilities."
      },
      {
        "key": "B",
        "text": "Volunteers want to become rich quickly."
      },
      {
        "key": "C",
        "text": "Volunteering is banned in many schools."
      },
      {
        "key": "D",
        "text": "Volunteers never learn anything new."
      }
    ],
    "answer": "A",
    "explanation": "Câu điền nêu việc làm của tình nguyện viên, phù hợp 'They also learn new skills...'.",
    "points": 0.25,
    "tags": [
      "điền câu",
      "liên kết đoạn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-b-19",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the paragraph and choose the sentence that best fits the gap.\n\nRecycling paper saves trees and energy. (1) ___. In addition, recycling produces less rubbish in landfills. Schools can start recycling programmes to teach students this good habit.",
    "options": [
      {
        "key": "A",
        "text": "Paper is no longer used today."
      },
      {
        "key": "B",
        "text": "Recycling is impossible at home."
      },
      {
        "key": "C",
        "text": "Trees are not important."
      },
      {
        "key": "D",
        "text": "Recycled paper is used to make boxes and notebooks."
      }
    ],
    "answer": "D",
    "explanation": "Câu điền nêu tác dụng của giấy tái chế, hợp nghĩa với chủ đề tiết kiệm cây.",
    "points": 0.25,
    "tags": [
      "điền câu",
      "liên kết đoạn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-b-20",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Choose the best option to complete the sentence.\n\nThe new library ___ to the public last month.",
    "options": [
      {
        "key": "A",
        "text": "was opened"
      },
      {
        "key": "B",
        "text": "opens"
      },
      {
        "key": "C",
        "text": "will open"
      },
      {
        "key": "D",
        "text": "is opening"
      }
    ],
    "answer": "A",
    "explanation": "'Last month' → quá khứ đơn, thư viện bị mở cho công chúng: câu bị động 'was opened'.",
    "points": 0.25,
    "tags": [
      "ngữ pháp",
      "câu bị động",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-b-21",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Choose the best option to complete the sentence.\n\nIf I ___ more free time, I would learn to play the guitar.",
    "options": [
      {
        "key": "A",
        "text": "have"
      },
      {
        "key": "B",
        "text": "had"
      },
      {
        "key": "C",
        "text": "will have"
      },
      {
        "key": "D",
        "text": "am having"
      }
    ],
    "answer": "B",
    "explanation": "Câu điều kiện loại 2: If + quá khứ đơn, would + động từ nguyên mẫu.",
    "points": 0.25,
    "tags": [
      "ngữ pháp",
      "câu điều kiện",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-b-22",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Choose the best option to complete the sentence.\n\nShe is looking forward to ___ her grandparents next weekend.",
    "options": [
      {
        "key": "A",
        "text": "visit"
      },
      {
        "key": "B",
        "text": "visits"
      },
      {
        "key": "C",
        "text": "visiting"
      },
      {
        "key": "D",
        "text": "visited"
      }
    ],
    "answer": "C",
    "explanation": "'look forward to + V-ing' (gerund).",
    "points": 0.25,
    "tags": [
      "ngữ pháp",
      "V-ing",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-b-23",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Choose the best option to complete the sentence.\n\nThe film was ___ interesting that we watched it twice.",
    "options": [
      {
        "key": "A",
        "text": "very"
      },
      {
        "key": "B",
        "text": "too"
      },
      {
        "key": "C",
        "text": "so"
      },
      {
        "key": "D",
        "text": "such"
      }
    ],
    "answer": "C",
    "explanation": "Cấu trúc 'so + tính từ + that': quá ... đến nỗi ....",
    "points": 0.25,
    "tags": [
      "ngữ pháp",
      "cấu trúc so–that",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-b-24",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Choose the best option to complete the sentence.\n\nNeither of the two answers ___ correct.",
    "options": [
      {
        "key": "A",
        "text": "are"
      },
      {
        "key": "B",
        "text": "were"
      },
      {
        "key": "C",
        "text": "is"
      },
      {
        "key": "D",
        "text": "have been"
      }
    ],
    "answer": "C",
    "explanation": "'Neither of ...' chủ ngữ số ít → động từ số ít 'is'.",
    "points": 0.25,
    "tags": [
      "ngữ pháp",
      "sự hòa hợp",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh-b-25",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Choose the best option to complete the sentence.\n\nThe man ___ lives next door is a famous artist.",
    "options": [
      {
        "key": "A",
        "text": "which"
      },
      {
        "key": "B",
        "text": "whom"
      },
      {
        "key": "C",
        "text": "whose"
      },
      {
        "key": "D",
        "text": "who"
      }
    ],
    "answer": "D",
    "explanation": "Đại từ quan hệ 'who' thay cho người, làm chủ ngữ của mệnh đề quan hệ.",
    "points": 0.25,
    "tags": [
      "ngữ pháp",
      "mệnh đề quan hệ",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-dia-01",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Nước Việt Nam nằm ở vị trí nào trên bán đảo Đông Dương?",
    "options": [
      {
        "key": "A",
        "text": "rìa phía tây"
      },
      {
        "key": "B",
        "text": "trung tâm"
      },
      {
        "key": "C",
        "text": "rìa phía đông"
      },
      {
        "key": "D",
        "text": "rìa phía bắc"
      }
    ],
    "answer": "C",
    "explanation": "Việt Nam nằm ở rìa phía đông bán đảo Đông Dương, gần trung tâm của khu vực Đông Nam Á.",
    "points": 0.25,
    "tags": [
      "vị trí địa lí",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-dia-02",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Vị trí địa lí nước ta có ý nghĩa lớn nhất đối với:",
    "options": [
      {
        "key": "A",
        "text": "giao lưu kinh tế quốc tế trên đường biển và đường hàng không"
      },
      {
        "key": "B",
        "text": "cô lập hoàn toàn khỏi thế giới"
      },
      {
        "key": "C",
        "text": "không tiếp nhận ảnh hưởng của các quốc gia khác"
      },
      {
        "key": "D",
        "text": "làm giảm các hoạt động thương mại"
      }
    ],
    "answer": "A",
    "explanation": "Vị trí trên trục giao thông quốc tế (biển, hàng không, đường bộ) giúp nước ta trở thành cửa ngõ giao lưu khu vực và thế giới.",
    "points": 0.25,
    "tags": [
      "vị trí địa lí",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-dia-03",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Địa hình nước ta chủ yếu là đồi núi, chiếm khoảng bao nhiêu diện tích cả nước?",
    "options": [
      {
        "key": "A",
        "text": "1/2"
      },
      {
        "key": "B",
        "text": "2/3"
      },
      {
        "key": "C",
        "text": "4/5"
      },
      {
        "key": "D",
        "text": "3/4"
      }
    ],
    "answer": "D",
    "explanation": "Đồi núi chiếm khoảng 3/4 diện tích, đồng bằng chỉ chiếm khoảng 1/4.",
    "points": 0.25,
    "tags": [
      "địa hình",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-dia-04",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Đặc điểm nổi bật của khí hậu Việt Nam là:",
    "options": [
      {
        "key": "A",
        "text": "ôn đới hải dương"
      },
      {
        "key": "B",
        "text": "nhiệt đới ẩm gió mùa"
      },
      {
        "key": "C",
        "text": "á nhiệt đới lục địa"
      },
      {
        "key": "D",
        "text": "xích đạo ẩm"
      }
    ],
    "answer": "B",
    "explanation": "Khí hậu Việt Nam mang tính chất nhiệt đới, ẩm, gió mùa và phân hóa theo địa hình.",
    "points": 0.25,
    "tags": [
      "khí hậu",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-dia-05",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Sông lớn nhất Đông Nam Á, đổ ra biển qua vùng Đồng bằng sông Cửu Long của nước ta là:",
    "options": [
      {
        "key": "A",
        "text": "sông Hồng"
      },
      {
        "key": "B",
        "text": "sông Đồng Nai"
      },
      {
        "key": "C",
        "text": "sông Mã"
      },
      {
        "key": "D",
        "text": "sông Mê Kông"
      }
    ],
    "answer": "D",
    "explanation": "Sông Mê Kông (phần chảy qua nước ta gọi là sông Cửu Long) là sông lớn nhất Đông Nam Á.",
    "points": 0.25,
    "tags": [
      "sông ngòi",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-dia-06",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Bảng số liệu bên dưới cho biết dân số Việt Nam qua các năm. Dân số năm 2022 so với năm 1975 đã tăng lên khoảng:",
    "options": [
      {
        "key": "A",
        "text": "1,5 lần"
      },
      {
        "key": "B",
        "text": "2,5 lần"
      },
      {
        "key": "C",
        "text": "2,1 lần"
      },
      {
        "key": "D",
        "text": "3,0 lần"
      }
    ],
    "answer": "C",
    "explanation": "$\\dfrac{100{,}3}{47{,}4}\\approx 2{,}1$ lần.",
    "points": 0.25,
    "tags": [
      "dân số",
      "bảng số liệu",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "table",
      "title": "Dân số Việt Nam qua các năm",
      "data": "1975; 1989; 2002; 2009; 2022\nDân số (triệu người): 47,4; 64,4; 79,7; 85,8; 100,3"
    }
  },
  {
    "id": "thpt-dia-07",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Tỉ lệ dân số thành thị trong cơ cấu dân số nước ta hiện nay có xu hướng:",
    "options": [
      {
        "key": "A",
        "text": "tăng dần"
      },
      {
        "key": "B",
        "text": "giảm dần"
      },
      {
        "key": "C",
        "text": "không đổi"
      },
      {
        "key": "D",
        "text": "biến đổi thất thường"
      }
    ],
    "answer": "A",
    "explanation": "Quá trình đô thị hóa làm tỉ lệ dân thành thị tăng dần qua các năm.",
    "points": 0.25,
    "tags": [
      "dân số",
      "đô thị hóa",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-dia-08",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Biểu đồ bên dưới cho thấy cơ cấu GDP theo khu vực kinh tế năm 2022 (NLTS: nông – lâm – thủy sản; CN-XD: công nghiệp – xây dựng; Thuế: thuế sản phẩm trừ trợ cấp). Khu vực chiếm tỉ trọng lớn nhất là:",
    "options": [
      {
        "key": "A",
        "text": "nông – lâm – thủy sản"
      },
      {
        "key": "B",
        "text": "dịch vụ"
      },
      {
        "key": "C",
        "text": "công nghiệp – xây dựng"
      },
      {
        "key": "D",
        "text": "thuế sản phẩm trừ trợ cấp"
      }
    ],
    "answer": "B",
    "explanation": "Dịch vụ chiếm 41,3% — lớn nhất trong biểu đồ.",
    "points": 0.25,
    "tags": [
      "cơ cấu kinh tế",
      "biểu đồ",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "bar",
      "title": "Cơ cấu GDP theo khu vực kinh tế năm 2022",
      "xLabel": "Khu vực",
      "yLabel": "Tỉ trọng (%)",
      "data": "NLTS; CN-XD; Dịch vụ; Thuế\nTỉ trọng (%): 11,9; 38,3; 41,3; 8,5"
    }
  },
  {
    "id": "thpt-dia-09",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trung tâm công nghiệp lớn nhất của nước ta hiện nay là:",
    "options": [
      {
        "key": "A",
        "text": "Đà Nẵng"
      },
      {
        "key": "B",
        "text": "Hải Phòng"
      },
      {
        "key": "C",
        "text": "Cần Thơ"
      },
      {
        "key": "D",
        "text": "TP. Hồ Chí Minh"
      }
    ],
    "answer": "D",
    "explanation": "TP. Hồ Chí Minh là trung tâm công nghiệp lớn nhất cả nước với nhiều ngành nghề và doanh nghiệp.",
    "points": 0.25,
    "tags": [
      "công nghiệp",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-dia-10",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Nhóm mặt hàng xuất khẩu chủ lực của Việt Nam hiện nay gồm:",
    "options": [
      {
        "key": "A",
        "text": "vàng, bạc"
      },
      {
        "key": "B",
        "text": "đồng, thiếc"
      },
      {
        "key": "C",
        "text": "gạo, dệt may, điện tử"
      },
      {
        "key": "D",
        "text": "đá quý thô"
      }
    ],
    "answer": "C",
    "explanation": "Nhóm nông sản (gạo, cà phê...), dệt may, da giày, điện tử... là các mặt hàng xuất khẩu chủ lực.",
    "points": 0.25,
    "tags": [
      "xuất khẩu",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-dia-11",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Vịnh Hạ Long – Di sản thiên nhiên thế giới – thuộc tỉnh nào?",
    "options": [
      {
        "key": "A",
        "text": "Quảng Ninh"
      },
      {
        "key": "B",
        "text": "Hải Phòng"
      },
      {
        "key": "C",
        "text": "Thừa Thiên – Huế"
      },
      {
        "key": "D",
        "text": "Khánh Hòa"
      }
    ],
    "answer": "A",
    "explanation": "Vịnh Hạ Long thuộc tỉnh Quảng Ninh, được UNESCO công nhận Di sản thiên nhiên thế giới.",
    "points": 0.25,
    "tags": [
      "du lịch",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-dia-12",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Bão, lũ thường xuyên xảy ra ở các tỉnh miền Trung nước ta chủ yếu vì:",
    "options": [
      {
        "key": "A",
        "text": "vùng này quá xa biển"
      },
      {
        "key": "B",
        "text": "khí hậu ôn đới lạnh"
      },
      {
        "key": "C",
        "text": "địa hình bằng phẳng, rộng lớn"
      },
      {
        "key": "D",
        "text": "nằm trong đai bão Thái Bình Dương và địa hình hẹp ngang, nhiều dãy núi đón gió"
      }
    ],
    "answer": "D",
    "explanation": "Miền Trung nằm trên đường di chuyển của bão từ biển Đông, địa hình hẹp ngang khiến thiên tai có mức độ dữ dội.",
    "points": 0.25,
    "tags": [
      "thiên tai",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-dia-13",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Biểu đồ đường bên dưới cho biết tốc độ tăng GDP Việt Nam một số năm gần đây (%). Năm có tốc độ tăng GDP cao nhất là:",
    "options": [
      {
        "key": "A",
        "text": "2020"
      },
      {
        "key": "B",
        "text": "2022"
      },
      {
        "key": "C",
        "text": "2021"
      },
      {
        "key": "D",
        "text": "2019"
      }
    ],
    "answer": "B",
    "explanation": "Năm 2022 đạt 8,02% — cao nhất trong biểu đồ (2020 chỉ 2,91%, 2021 2,58%).",
    "points": 0.25,
    "tags": [
      "kinh tế",
      "biểu đồ đường",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "line",
      "title": "Tốc độ tăng GDP Việt Nam (%)",
      "xLabel": "Năm",
      "yLabel": "Tốc độ tăng (%)",
      "data": "2019; 2020; 2021; 2022\nTốc độ tăng (%): 7,02; 2,91; 2,58; 8,02"
    }
  },
  {
    "id": "thpt-dia-14",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Xu hướng chuyển dịch cơ cấu kinh tế của Việt Nam hiện nay là:",
    "options": [
      {
        "key": "A",
        "text": "tỉ trọng nông – lâm – thủy sản tăng dần"
      },
      {
        "key": "B",
        "text": "tỉ trọng dịch vụ giảm dần"
      },
      {
        "key": "C",
        "text": "tỉ trọng nông – lâm – thủy sản giảm, dịch vụ và công nghiệp tăng"
      },
      {
        "key": "D",
        "text": "cơ cấu kinh tế giữ nguyên không đổi"
      }
    ],
    "answer": "C",
    "explanation": "Công nghiệp hóa – hiện đại hóa làm giảm tỉ trọng nông nghiệp, tăng dịch vụ và công nghiệp.",
    "points": 0.25,
    "tags": [
      "cơ cấu kinh tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-dia-15",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Nguyên nhân chính làm tốc độ tăng dân số của Việt Nam chậm lại trong những năm gần đây là:",
    "options": [
      {
        "key": "A",
        "text": "chiến tranh"
      },
      {
        "key": "B",
        "text": "dịch bệnh kéo dài"
      },
      {
        "key": "C",
        "text": "chính sách kế hoạch hóa gia đình và mức sống, trình độ dân trí nâng cao"
      },
      {
        "key": "D",
        "text": "di cư quốc tế quy mô lớn"
      }
    ],
    "answer": "C",
    "explanation": "Chính sách kế hoạch hóa gia đình cùng với sự nâng cao mức sống, giáo dục làm tỉ suất sinh giảm.",
    "points": 0.25,
    "tags": [
      "dân số",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-dia-16",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Biểu đồ tròn bên dưới cho biết cơ cấu lao động theo khu vực kinh tế năm 2022. Khu vực chiếm tỉ trọng nhỏ nhất là:",
    "options": [
      {
        "key": "A",
        "text": "nông – lâm – thủy sản"
      },
      {
        "key": "B",
        "text": "dịch vụ"
      },
      {
        "key": "C",
        "text": "công nghiệp – xây dựng"
      },
      {
        "key": "D",
        "text": "ba khu vực bằng nhau"
      }
    ],
    "answer": "A",
    "explanation": "Lao động nông – lâm – thủy sản chiếm 27,4% — nhỏ nhất (dịch vụ 39,9%, công nghiệp – xây dựng 32,7%).",
    "points": 0.25,
    "tags": [
      "lao động",
      "biểu đồ tròn",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "pie",
      "title": "Cơ cấu lao động theo khu vực kinh tế năm 2022",
      "data": "Nông-lâm-thủy sản; Công nghiệp-xây dựng; Dịch vụ\nTỉ lệ (%): 27,4; 32,7; 39,9"
    }
  },
  {
    "id": "thpt-dia-17",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Chiều dài tuyến đường sắt Bắc – Nam (Hà Nội – Sài Gòn) là:",
    "options": [
      {
        "key": "A",
        "text": "172 km"
      },
      {
        "key": "B",
        "text": "726 km"
      },
      {
        "key": "C",
        "text": "1026 km"
      },
      {
        "key": "D",
        "text": "1726 km"
      }
    ],
    "answer": "D",
    "explanation": "Đường sắt Bắc – Nam dài khoảng 1726 km, chiếm gần một nửa tổng chiều dài đường sắt cả nước.",
    "points": 0.25,
    "tags": [
      "giao thông",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-dia-18",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Bảng số liệu bên dưới cho biết giá trị xuất khẩu của Việt Nam qua hai năm. Tốc độ tăng giá trị xuất khẩu năm 2022 so với 2021 (làm tròn một chữ số thập phân) là:",
    "options": [
      {
        "key": "A",
        "text": "5,6%"
      },
      {
        "key": "B",
        "text": "10,6%"
      },
      {
        "key": "C",
        "text": "15,6%"
      },
      {
        "key": "D",
        "text": "20,6%"
      }
    ],
    "answer": "B",
    "explanation": "$\\dfrac{371{,}85-336{,}3}{336{,}3}\\cdot 100\\%\\approx 10{,}6\\%$.",
    "points": 0.25,
    "tags": [
      "xuất khẩu",
      "bảng số liệu",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "table",
      "title": "Giá trị xuất khẩu của Việt Nam (tỉ USD)",
      "data": "2021; 2022\nGiá trị xuất khẩu (tỉ USD): 336,3; 371,85"
    }
  },
  {
    "id": "thpt-dia-19",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Đọc đoạn tư liệu: \"Việt Nam nằm ở rìa phía đông của bán đảo Đông Dương, gần trung tâm của khu vực Đông Nam Á; có bờ biển dài và nhiều cảng biển lớn, nằm trên trục giao thông quốc tế giữa Thái Bình Dương và Ấn Độ Dương.\" (Bài trích).\n\nXét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Nước ta nằm ở rìa phía đông của bán đảo Đông Dương."
      },
      {
        "key": "b",
        "text": "Nước ta không tiếp giáp với biển."
      },
      {
        "key": "c",
        "text": "Vị trí địa lí thuận lợi cho giao lưu kinh tế quốc tế."
      },
      {
        "key": "d",
        "text": "Vị trí địa lí làm nước ta hoàn toàn không chịu ảnh hưởng của thời tiết, khí hậu các quốc gia lân cận."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng. b) Sai: bờ biển dài hơn 3260 km. c) Đúng: nằm trên trục giao thông quốc tế. d) Sai: nằm trong khu vực có gió mùa, chịu ảnh hưởng lớn của khí hậu khu vực.",
    "points": 1,
    "tags": [
      "vị trí địa lí",
      "tư liệu",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-dia-20",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Bảng số liệu bên dưới cho biết dân số Việt Nam qua các năm. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Dân số năm 2022 đã vượt 100 triệu người."
      },
      {
        "key": "b",
        "text": "Tốc độ tăng dân số các giai đoạn sau (2002 – 2022) nhanh hơn giai đoạn trước (1975 – 2002)."
      },
      {
        "key": "c",
        "text": "Nếu phân bố đều dân số năm 2022 trên diện tích 331,2 nghìn km² thì mật độ dân số khoảng 300 người/km²."
      },
      {
        "key": "d",
        "text": "Dân số năm 2022 hơn năm 1975 khoảng 2,1 lần."
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) Đúng: 100,3 triệu. b) Sai: 1975–2002 tăng khoảng 32 triệu trong 27 năm, 2002–2022 tăng khoảng 21 triệu trong 20 năm. c) Đúng: $100{,}3cdot10^6/331{,}2cdot10^3approx303$ người/km², khoảng 300. d) Đúng: $100{,}3/47{,}4approx2{,}1$.",
    "points": 1,
    "tags": [
      "dân số",
      "bảng số liệu",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "table",
      "title": "Dân số Việt Nam qua các năm",
      "data": "1975; 1989; 2002; 2009; 2022\nDân số (triệu người): 47,4; 64,4; 79,7; 85,8; 100,3"
    }
  },
  {
    "id": "thpt-dia-21",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Đọc đoạn tư liệu: \"Khí hậu Việt Nam mang tính chất nhiệt đới ẩm gió mùa, nhiệt độ trung bình năm cao, lượng mưa lớn và phân hóa theo mùa, theo vùng.\" (Bài trích).\n\nXét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Nền nhiệt đới ẩm gió mùa là đặc điểm nổi bật của khí hậu nước ta."
      },
      {
        "key": "b",
        "text": "Nhiệt độ trung bình năm của cả nước trên 20°C."
      },
      {
        "key": "c",
        "text": "Cả nước không có mùa đông lạnh."
      },
      {
        "key": "d",
        "text": "Gió mùa có ảnh hưởng lớn đến thời tiết, khí hậu và sản xuất nông nghiệp."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng. b) Đúng. c) Sai: miền Bắc có mùa đông lạnh do gió mùa Đông Bắc. d) Đúng.",
    "points": 1,
    "tags": [
      "khí hậu",
      "tư liệu",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-dia-22",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Biểu đồ bên dưới cho biết cơ cấu GDP theo khu vực kinh tế năm 2022 (NLTS: nông – lâm – thủy sản; CN-XD: công nghiệp – xây dựng; Thuế: thuế sản phẩm trừ trợ cấp). Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Khu vực dịch vụ chiếm tỉ trọng lớn nhất trong GDP."
      },
      {
        "key": "b",
        "text": "Khu vực công nghiệp – xây dựng chiếm 38,3% GDP."
      },
      {
        "key": "c",
        "text": "Khu vực nông – lâm – thủy sản chiếm hơn một nửa GDP."
      },
      {
        "key": "d",
        "text": "Cơ cấu kinh tế đang chuyển dịch theo hướng công nghiệp hóa – hiện đại hóa."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: 41,3%. b) Đúng. c) Sai: chỉ chiếm 11,9%. d) Đúng.",
    "points": 1,
    "tags": [
      "cơ cấu kinh tế",
      "biểu đồ",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "bar",
      "title": "Cơ cấu GDP theo khu vực kinh tế năm 2022",
      "xLabel": "Khu vực",
      "yLabel": "Tỉ trọng (%)",
      "data": "NLTS; CN-XD; Dịch vụ; Thuế\nTỉ trọng (%): 11,9; 38,3; 41,3; 8,5"
    }
  },
  {
    "id": "thpt-dia-23",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Đọc đoạn tư liệu: \"Biến đổi khí hậu làm mực nước biển dâng, thiên tai ngày càng dữ dội, ảnh hưởng nghiêm trọng đến các đồng bằng ven biển của Việt Nam.\" (Bài trích).\n\nXét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Biến đổi khí hậu ảnh hưởng lớn đến vùng đồng bằng ven biển và đồng bằng sông Cửu Long."
      },
      {
        "key": "b",
        "text": "Nguyên nhân chủ yếu của biến đổi khí hậu hiện nay là hoạt động tự nhiên thuần túy, không liên quan con người."
      },
      {
        "key": "c",
        "text": "Việt Nam nằm ngoài nhóm quốc gia bị ảnh hưởng nặng của biến đổi khí hậu."
      },
      {
        "key": "d",
        "text": "Cần giảm phát thải khí nhà kính, thích ứng và tăng cường hợp tác quốc tế để ứng phó."
      }
    ],
    "answer": "ĐSSĐ",
    "explanation": "a) Đúng. b) Sai: nguyên nhân chủ yếu là hoạt động phát thải khí nhà kính của con người. c) Sai: Việt Nam nằm trong nhóm bị ảnh hưởng nặng. d) Đúng.",
    "points": 1,
    "tags": [
      "biến đổi khí hậu",
      "tư liệu",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-dia-24",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Đọc đoạn tư liệu: \"Định hướng phát triển công nghiệp của Việt Nam là tăng tỉ trọng công nghiệp chế biến, chế tạo; hạn chế khai thác và xuất khẩu khoáng sản thô; phát triển kinh tế gắn với bảo vệ môi trường.\" (Bài trích).\n\nXét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Định hướng là tăng tỉ trọng công nghiệp chế biến, chế tạo."
      },
      {
        "key": "b",
        "text": "Định hướng là hạn chế khai thác và xuất khẩu khoáng sản thô."
      },
      {
        "key": "c",
        "text": "Công nghiệp không cần phát triển vì cần ưu tiên tuyệt đối nông nghiệp."
      },
      {
        "key": "d",
        "text": "Phát triển công nghiệp có thể không quan tâm đến vấn đề môi trường."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) Đúng. b) Đúng. c) Sai: công nghiệp là động lực quan trọng của nền kinh tế. d) Sai: phát triển kinh tế – công nghiệp phải gắn với bảo vệ môi trường.",
    "points": 1,
    "tags": [
      "công nghiệp hóa",
      "tư liệu",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-dia-25",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Dân số Việt Nam năm 2022 khoảng 100,3 triệu người với diện tích 331,2 nghìn km². Mật độ dân số trung bình, làm tròn đến hàng đơn vị, là bao nhiêu người/km²?",
    "answer": "303",
    "explanation": "$\\dfrac{100{,}3\\cdot 10^{6}}{331{,}2\\cdot 10^{3}}\\approx 303$ người/km².",
    "points": 0.5,
    "tags": [
      "dân số",
      "tính toán",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-dia-26",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tỉ lệ dân số thành thị của Việt Nam năm 2022 là 38,1%. Vậy tỉ lệ dân số nông thôn là bao nhiêu phần trăm?",
    "answer": "61,9",
    "explanation": "$100\\%-38{,}1\\%=61{,}9\\%$.",
    "points": 0.5,
    "tags": [
      "dân số",
      "tính toán",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-dia-27",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Độ dài đường bờ biển của Việt Nam (làm tròn đến hàng chục kilômét) là bao nhiêu kilômét?",
    "answer": "3260",
    "explanation": "Bờ biển Việt Nam dài khoảng 3260 km.",
    "points": 0.5,
    "tags": [
      "vị trí địa lí",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-dia-28",
    "subject": "Địa lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Năm 2022, giá trị xuất khẩu của Việt Nam đạt 371,85 tỉ USD, nhập khẩu đạt 360,95 tỉ USD. Giá trị xuất siêu của Việt Nam (làm tròn một chữ số thập phân) là bao nhiêu tỉ USD?",
    "answer": "10,9",
    "explanation": "$371{,}85-360{,}95=10{,}9$ tỉ USD.",
    "points": 0.5,
    "tags": [
      "xuất nhập khẩu",
      "tính toán",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-gdkt-01",
    "subject": "GDKT&PL",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Tổng sản phẩm quốc nội (GDP) là tổng giá trị:",
    "options": [
      {
        "key": "A",
        "text": "tất cả tiền tệ đang lưu thông trong nước"
      },
      {
        "key": "B",
        "text": "dân số của một quốc gia"
      },
      {
        "key": "C",
        "text": "sản phẩm và dịch vụ cuối cùng được sản xuất trong phạm vi lãnh thổ một quốc gia trong một thời kì"
      },
      {
        "key": "D",
        "text": "thu ngân sách nhà nước trong năm"
      }
    ],
    "answer": "C",
    "explanation": "GDP đo tổng giá trị các sản phẩm và dịch vụ cuối cùng sản xuất trong lãnh thổ một quốc gia trong một thời kì nhất định.",
    "points": 0.25,
    "tags": [
      "kinh tế",
      "GDP",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-gdkt-02",
    "subject": "GDKT&PL",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Nộp thuế đối với công dân là một:",
    "options": [
      {
        "key": "A",
        "text": "nghĩa vụ bắt buộc theo pháp luật"
      },
      {
        "key": "B",
        "text": "quyền lợi có thể thực hiện hoặc không"
      },
      {
        "key": "C",
        "text": "món quà tình nguyện cho Nhà nước"
      },
      {
        "key": "D",
        "text": "hình phạt hành chính"
      }
    ],
    "answer": "A",
    "explanation": "Nộp thuế là nghĩa vụ cơ bản của công dân quy định trong Hiến pháp và pháp luật thuế.",
    "points": 0.25,
    "tags": [
      "thuế",
      "nghĩa vụ công dân",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-gdkt-03",
    "subject": "GDKT&PL",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Văn bản có hiệu lực pháp lí cao nhất trong hệ thống pháp luật Việt Nam hiện nay là:",
    "options": [
      {
        "key": "A",
        "text": "Bộ luật Dân sự"
      },
      {
        "key": "B",
        "text": "Bộ luật Lao động"
      },
      {
        "key": "C",
        "text": "Nghị quyết của Quốc hội"
      },
      {
        "key": "D",
        "text": "Hiến pháp năm 2013"
      }
    ],
    "answer": "D",
    "explanation": "Hiến pháp là luật cơ bản có hiệu lực pháp lí cao nhất, mọi văn bản pháp luật khác phải phù hợp với Hiến pháp.",
    "points": 0.25,
    "tags": [
      "pháp luật",
      "Hiến pháp",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-gdkt-04",
    "subject": "GDKT&PL",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Bảo hiểm y tế bắt buộc theo Luật có đặc điểm:",
    "options": [
      {
        "key": "A",
        "text": "chỉ tự nguyện cho người có nhu cầu"
      },
      {
        "key": "B",
        "text": "bắt buộc tham gia đối với các đối tượng theo quy định của Luật"
      },
      {
        "key": "C",
        "text": "chỉ dành cho người thu nhập cao"
      },
      {
        "key": "D",
        "text": "không tồn tại trong thực tế"
      }
    ],
    "answer": "B",
    "explanation": "BHYT bắt buộc thực hiện theo nguyên tắc bắt buộc với các đối tượng quy định, nhằm chia sẻ rủi ro về sức khỏe.",
    "points": 0.25,
    "tags": [
      "bảo hiểm",
      "kinh tế",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-gdkt-05",
    "subject": "GDKT&PL",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Chỉ số giá tiêu dùng (CPI) được dùng chủ yếu để đo lường:",
    "options": [
      {
        "key": "A",
        "text": "tổng sản phẩm quốc nội"
      },
      {
        "key": "B",
        "text": "mức lạm phát"
      },
      {
        "key": "C",
        "text": "tỉ lệ thất nghiệp"
      },
      {
        "key": "D",
        "text": "thu nhập bình quân"
      }
    ],
    "answer": "B",
    "explanation": "CPI phản ánh sự biến động của mức giá, qua đó đo lường lạm phát.",
    "points": 0.25,
    "tags": [
      "kinh tế",
      "CPI",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-gdkt-06",
    "subject": "GDKT&PL",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Theo Hiến pháp năm 2013, học tập là:",
    "options": [
      {
        "key": "A",
        "text": "chỉ là quyền của công dân"
      },
      {
        "key": "B",
        "text": "chỉ là nghĩa vụ của công dân"
      },
      {
        "key": "C",
        "text": "cả quyền và nghĩa vụ cơ bản của công dân"
      },
      {
        "key": "D",
        "text": "không liên quan đến công dân"
      }
    ],
    "answer": "C",
    "explanation": "Hiến pháp quy định công dân có quyền và nghĩa vụ học tập.",
    "points": 0.25,
    "tags": [
      "quyền và nghĩa vụ công dân",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-gdkt-07",
    "subject": "GDKT&PL",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Công thức tính tốc độ tăng trưởng kinh tế (tỉ lệ phần trăm) là:",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{GDP_t - GDP_{t-1}}{GDP_{t-1}}\\times 100\\%$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{GDP_t + GDP_{t-1}}{GDP_{t-1}}\\times 100\\%$"
      },
      {
        "key": "C",
        "text": "tỉ lệ người thất nghiệp trong lực lượng lao động"
      },
      {
        "key": "D",
        "text": "tỉ lệ tăng chỉ số giá tiêu dùng"
      }
    ],
    "answer": "A",
    "explanation": "Tốc độ tăng trưởng = phần trăm thay đổi GDP so với kì trước.",
    "points": 0.25,
    "tags": [
      "kinh tế",
      "tăng trưởng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-gdkt-08",
    "subject": "GDKT&PL",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Công ty trách nhiệm hữu hạn hai thành viên trở lên có đặc điểm:",
    "options": [
      {
        "key": "A",
        "text": "thành viên chịu trách nhiệm vô hạn"
      },
      {
        "key": "B",
        "text": "thành viên không phải chịu bất kì trách nhiệm nào"
      },
      {
        "key": "C",
        "text": "chỉ cá nhân đại diện theo pháp luật chịu trách nhiệm"
      },
      {
        "key": "D",
        "text": "các thành viên chịu trách nhiệm về các khoản nợ trong phạm vi vốn góp"
      }
    ],
    "answer": "D",
    "explanation": "Công ty TNHH: thành viên chịu trách nhiệm hữu hạn trong phạm vi số vốn đã góp.",
    "points": 0.25,
    "tags": [
      "kinh doanh",
      "doanh nghiệp",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-gdkt-09",
    "subject": "GDKT&PL",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Tình huống: Cô T có thu nhập chịu thuế cá nhân 100 triệu đồng/năm. Giả sử mức giảm trừ gia cảnh cho bản thân là 132 triệu đồng/năm (11 triệu/tháng). Cô T:",
    "options": [
      {
        "key": "A",
        "text": "phải nộp thuế thu nhập cá nhân 5 triệu đồng"
      },
      {
        "key": "B",
        "text": "không phải nộp thuế thu nhập cá nhân vì thu nhập dưới mức giảm trừ gia cảnh"
      },
      {
        "key": "C",
        "text": "phải nộp 20% thu nhập làm thuế"
      },
      {
        "key": "D",
        "text": "phải nộp thuế theo biểu lũy tiến toàn bộ 100 triệu"
      }
    ],
    "answer": "B",
    "explanation": "Thu nhập chịu thuế = thu nhập − giảm trừ = 100 − 132 < 0, nên không phải nộp thuế TNCN.",
    "points": 0.25,
    "tags": [
      "thuế",
      "tình huống",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-gdkt-10",
    "subject": "GDKT&PL",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Theo pháp luật dân sự, người từ đủ 15 tuổi đến chưa đủ 18 tuổi:",
    "options": [
      {
        "key": "A",
        "text": "không thể xác lập bất kì giao dịch nào"
      },
      {
        "key": "B",
        "text": "tự mình xác lập, thực hiện giao dịch dân sự, trừ những giao dịch liên quan đến bất động sản, động sản đăng kí... phải được người đại diện theo pháp luật đồng ý"
      },
      {
        "key": "C",
        "text": "chỉ được giao dịch khi có cha mẹ kí thay"
      },
      {
        "key": "D",
        "text": "có đầy đủ năng lực hành vi dân sự như người đủ 18 tuổi"
      }
    ],
    "answer": "B",
    "explanation": "Từ đủ 15 tuổi, người chưa thành niên tự giao dịch; một số giao dịch lớn cần sự đồng ý của người đại diện theo pháp luật.",
    "points": 0.25,
    "tags": [
      "pháp luật",
      "năng lực hành vi",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-gdkt-11",
    "subject": "GDKT&PL",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Theo pháp luật hiện hành, tỉ lệ tiền lương mà người lao động phải đóng vào quỹ bảo hiểm xã hội bắt buộc (phần do người lao động đóng) là:",
    "options": [
      {
        "key": "A",
        "text": "10% tiền lương"
      },
      {
        "key": "B",
        "text": "15% tiền lương"
      },
      {
        "key": "C",
        "text": "8% tiền lương"
      },
      {
        "key": "D",
        "text": "không cần đóng"
      }
    ],
    "answer": "C",
    "explanation": "Người lao động đóng BHXH bắt buộc bằng 8% tiền lương tháng đóng BHXH.",
    "points": 0.25,
    "tags": [
      "bảo hiểm",
      "kinh tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-gdkt-12",
    "subject": "GDKT&PL",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Lợi nhuận của một doanh nghiệp được tính bằng:",
    "options": [
      {
        "key": "A",
        "text": "doanh thu trừ chi phí"
      },
      {
        "key": "B",
        "text": "doanh thu cộng chi phí"
      },
      {
        "key": "C",
        "text": "chi phí trừ doanh thu"
      },
      {
        "key": "D",
        "text": "tổng số vốn ban đầu"
      }
    ],
    "answer": "A",
    "explanation": "Lợi nhuận = doanh thu − chi phí (chi phí nguyên liệu, thuê mặt bằng, lương...).",
    "points": 0.25,
    "tags": [
      "kinh doanh",
      "kế toán",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-gdkt-13",
    "subject": "GDKT&PL",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Tình huống: Chú M xả rác không đúng nơi quy định tại khu phố và bị phát hiện. Cơ quan có thẩm quyền xử phạt vi phạm hành chính đối với hành vi này là:",
    "options": [
      {
        "key": "A",
        "text": "Tòa án nhân dân"
      },
      {
        "key": "B",
        "text": "Viện kiểm sát nhân dân"
      },
      {
        "key": "C",
        "text": "Chính quyền địa phương (Ủy ban nhân dân cấp xã) và cơ quan chuyên môn có thẩm quyền"
      },
      {
        "key": "D",
        "text": "nhà trường nơi chú M từng học"
      }
    ],
    "answer": "C",
    "explanation": "Xử phạt vi phạm hành chính thuộc thẩm quyền của UBND các cấp và cơ quan chuyên môn được giao; không thuộc Tòa án hay Viện kiểm sát.",
    "points": 0.25,
    "tags": [
      "pháp luật",
      "xử phạt hành chính",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-gdkt-14",
    "subject": "GDKT&PL",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Để nhãn hiệu của mình được pháp luật bảo hộ, doanh nghiệp cần:",
    "options": [
      {
        "key": "A",
        "text": "đăng kí sở hữu công nghiệp tại cơ quan có thẩm quyền (Cục Sở hữu trí tuệ)"
      },
      {
        "key": "B",
        "text": "không cần làm thủ tục gì cả"
      },
      {
        "key": "C",
        "text": "tự in nhãn và dán lên sản phẩm"
      },
      {
        "key": "D",
        "text": "hỏi ý kiến của bạn hàng"
      }
    ],
    "answer": "A",
    "explanation": "Quyền sở hữu công nghiệp đối với nhãn hiệu được xác lập trên cơ sở quyết định cấp văn bằng bảo hộ sau khi đăng kí.",
    "points": 0.25,
    "tags": [
      "sở hữu trí tuệ",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-gdkt-15",
    "subject": "GDKT&PL",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Tình huống: Anh P vay ngân hàng 100 triệu đồng với lãi suất 12%/năm, vay trong 1 năm, trả cả gốc và lãi một lần. Tổng số tiền anh P phải trả là:",
    "options": [
      {
        "key": "A",
        "text": "100 triệu đồng"
      },
      {
        "key": "B",
        "text": "120 triệu đồng"
      },
      {
        "key": "C",
        "text": "112 triệu đồng"
      },
      {
        "key": "D",
        "text": "108 triệu đồng"
      }
    ],
    "answer": "C",
    "explanation": "Tiền lãi $=100\\cdot 12\\%=12$ triệu; tổng trả $=100+12=112$ triệu.",
    "points": 0.25,
    "tags": [
      "tín dụng",
      "tình huống",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-gdkt-16",
    "subject": "GDKT&PL",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "GDP thực tế (GDP thực) khác GDP danh nghĩa ở chỗ GDP thực tế:",
    "options": [
      {
        "key": "A",
        "text": "được tính theo giá hiện hành của năm tính GDP"
      },
      {
        "key": "B",
        "text": "là GDP của các doanh nghiệp nhà nước"
      },
      {
        "key": "C",
        "text": "chỉ tính sản phẩm nông nghiệp"
      },
      {
        "key": "D",
        "text": "được tính theo giá so sánh, loại trừ ảnh hưởng của biến động giá (lạm phát hoặc giảm phát)"
      }
    ],
    "answer": "D",
    "explanation": "GDP thực tế tính theo giá so sánh (giá năm gốc), phản ánh đúng mức tăng trưởng về khối lượng sản xuất.",
    "points": 0.25,
    "tags": [
      "kinh tế",
      "GDP",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-gdkt-17",
    "subject": "GDKT&PL",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Tình huống: Ông N có thu nhập chịu thuế cá nhân 20 triệu đồng/tháng. Giả sử mức giảm trừ gia cảnh cho bản thân người nộp thuế là 11 triệu đồng/tháng (chưa tính người phụ thuộc). Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Chỉ phần thu nhập trên 11 triệu đồng/tháng mới thuộc diện tính thuế thu nhập cá nhân."
      },
      {
        "key": "b",
        "text": "Thu nhập tính thuế (theo tháng) của ông N là 9 triệu đồng."
      },
      {
        "key": "c",
        "text": "Ông N không phải đóng bất kì loại thuế nào, kể cả khi mua hàng hóa có thuế giá trị gia tăng."
      },
      {
        "key": "d",
        "text": "Thuế thu nhập cá nhân áp dụng biểu thuế lũy tiến theo từng phần thu nhập."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: 11 triệu là mức giảm trừ, phần vượt mới tính thuế. b) Đúng: 20 − 11 = 9 triệu. c) Sai: khi mua hàng, ông N đã góp phần đóng thuế GTGT trong giá bán. d) Đúng.",
    "points": 1,
    "tags": [
      "thuế",
      "tình huống",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-gdkt-18",
    "subject": "GDKT&PL",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Tình huống: Bé D, 15 tuổi, viết bài về bảo vệ môi trường và được đăng trên trang báo điện tử. Một cơ quan yêu cầu gỡ bài nhưng không nêu lí do rõ ràng theo pháp luật. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Công dân có quyền tự do ngôn luận, tự do báo chí theo Hiến pháp năm 2013."
      },
      {
        "key": "b",
        "text": "Quyền tự do ngôn luận không bị giới hạn bởi bất kì quy định nào của pháp luật."
      },
      {
        "key": "c",
        "text": "Khi thực hiện quyền của mình, công dân vẫn phải tuân thủ pháp luật, không xâm phạm quyền và lợi ích hợp pháp của người khác."
      },
      {
        "key": "d",
        "text": "Bé D không có quyền khiếu nại đối với quyết định không đúng pháp luật."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng. b) Sai: quyền tự do ngôn luận được thực hiện theo pháp luật, có giới hạn để bảo vệ quốc gia, danh dự, trật tự... c) Đúng. d) Sai: công dân có quyền khiếu nại.",
    "points": 1,
    "tags": [
      "quyền công dân",
      "tình huống",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-gdkt-19",
    "subject": "GDKT&PL",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Tình huống: Anh H mở tiệm bánh với chi phí nguyên liệu 30 triệu đồng/tháng, thuê mặt bằng 10 triệu đồng/tháng, tiền lương nhân viên 20 triệu đồng/tháng; doanh thu 80 triệu đồng/tháng. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Tổng chi phí của tiệm bánh mỗi tháng là 60 triệu đồng."
      },
      {
        "key": "b",
        "text": "Lợi nhuận của tiệm bánh mỗi tháng là 20 triệu đồng."
      },
      {
        "key": "c",
        "text": "Lợi nhuận được tính bằng doanh thu cộng chi phí."
      },
      {
        "key": "d",
        "text": "Nếu doanh thu chỉ còn 55 triệu đồng/tháng thì anh H bị thua lỗ."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: 30 + 10 + 20 = 60 triệu. b) Đúng: 80 − 60 = 20 triệu. c) Sai: lợi nhuận = doanh thu − chi phí. d) Đúng: 55 < 60 nên bị lỗ.",
    "points": 1,
    "tags": [
      "kinh doanh",
      "tình huống",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-gdkt-20",
    "subject": "GDKT&PL",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Tình huống: Anh P tham gia bảo hiểm xã hội bắt buộc, gặp tai nạn lao động phải điều trị 3 tháng. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Bảo hiểm xã hội bắt buộc là chế độ thực hiện theo Luật với các đối tượng quy định."
      },
      {
        "key": "b",
        "text": "Anh P có thể hưởng chế độ thai sản từ quỹ bảo hiểm xã hội trong trường hợp này."
      },
      {
        "key": "c",
        "text": "Anh P có thể hưởng chế độ tai nạn lao động theo quy định."
      },
      {
        "key": "d",
        "text": "Bảo hiểm y tế hoàn toàn thay thế được bảo hiểm xã hội."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng. b) Sai: thai sản là chế độ khác, không áp dụng cho tai nạn lao động. c) Đúng. d) Sai: BHYT và BHXH là hai chế độ khác nhau, không thay thế nhau.",
    "points": 1,
    "tags": [
      "bảo hiểm",
      "tình huống",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-a-01",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Nhóm chức đặc trưng của este là:",
    "options": [
      {
        "key": "A",
        "text": "$-\\text{OH}$"
      },
      {
        "key": "B",
        "text": "$-\\text{COO}-$"
      },
      {
        "key": "C",
        "text": "$-\\text{CHO}$"
      },
      {
        "key": "D",
        "text": "$-\\text{NH}_2$"
      }
    ],
    "answer": "B",
    "explanation": "Este có nhóm chức cacboxylat $-\\text{COO}-$ (gốc acyl $-\\text{CO}-$ gắn với gốc hiđrocacbon qua nguyên tử oxi).",
    "points": 0.25,
    "tags": [
      "este",
      "nhóm chức",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-a-02",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Tên gọi của este có công thức phân tử $\\text{CH}_3\\text{COOC}_2\\text{H}_5$ là:",
    "options": [
      {
        "key": "A",
        "text": "metyl propionat"
      },
      {
        "key": "B",
        "text": "etyl fomat"
      },
      {
        "key": "C",
        "text": "etyl axetat"
      },
      {
        "key": "D",
        "text": "propyl fomat"
      }
    ],
    "answer": "C",
    "explanation": "Este tạo từ axit axetic $\\text{CH}_3\\text{COOH}$ và etanol nên tên là etyl axetat.",
    "points": 0.25,
    "tags": [
      "este",
      "tên gọi",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-a-03",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Công thức phân tử của glucose là:",
    "options": [
      {
        "key": "A",
        "text": "$\\text{C}_6\\text{H}_{12}\\text{O}_6$"
      },
      {
        "key": "B",
        "text": "$\\text{C}_{12}\\text{H}_{22}\\text{O}_{11}$"
      },
      {
        "key": "C",
        "text": "$\\text{C}_6\\text{H}_{10}\\text{O}_5$"
      },
      {
        "key": "D",
        "text": "$\\text{C}_5\\text{H}_{10}\\text{O}_5$"
      }
    ],
    "answer": "A",
    "explanation": "Glucose là monosaccarit có công thức phân tử $\\text{C}_6\\text{H}_{12}\\text{O}_6$.",
    "points": 0.25,
    "tags": [
      "cacbohiđrat",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-a-04",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một amino axit tối thiểu phải có đồng thời hai nhóm chức:",
    "options": [
      {
        "key": "A",
        "text": "$-\\text{OH}$ và $-\\text{CHO}$"
      },
      {
        "key": "B",
        "text": "$-\\text{COOH}$ và $-\\text{NO}_2$"
      },
      {
        "key": "C",
        "text": "$-\\text{NH}_2$ và $-\\text{OH}$"
      },
      {
        "key": "D",
        "text": "$-\\text{NH}_2$ và $-\\text{COOH}$"
      }
    ],
    "answer": "D",
    "explanation": "Amino axit chứa nhóm amino $-\\text{NH}_2$ và nhóm cacboxyl $-\\text{COOH}$.",
    "points": 0.25,
    "tags": [
      "amino axit",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-a-05",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Monome dùng để điều chế polime PVC (polivinyl clorua) là:",
    "options": [
      {
        "key": "A",
        "text": "$\\text{CH}_2=\\text{CH}-\\text{CH}_3$"
      },
      {
        "key": "B",
        "text": "$\\text{CH}_2=\\text{CHCl}$"
      },
      {
        "key": "C",
        "text": "$\\text{CH}_2=\\text{CH}-\\text{C}_6\\text{H}_5$"
      },
      {
        "key": "D",
        "text": "$\\text{CF}_2=\\text{CF}_2$"
      }
    ],
    "answer": "B",
    "explanation": "PVC được trùng hợp từ vinyl clorua $\\text{CH}_2=\\text{CHCl}$.",
    "points": 0.25,
    "tags": [
      "polime",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-a-06",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Số đồng phân cấu tạo mạch hở của este có công thức phân tử $\\text{C}_4\\text{H}_8\\text{O}_2$ là:",
    "options": [
      {
        "key": "A",
        "text": "3"
      },
      {
        "key": "B",
        "text": "5"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "6"
      }
    ],
    "answer": "C",
    "explanation": "Các este: $\\text{HCOOCH}_2\\text{CH}_2\\text{CH}_3$, $\\text{HCOOCH}(\\text{CH}_3)_2$, $\\text{CH}_3\\text{COOC}_2\\text{H}_5$, $\\text{C}_2\\text{H}_5\\text{COOCH}_3$: tổng 4.",
    "points": 0.25,
    "tags": [
      "este",
      "đồng phân",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-a-07",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Sản phẩm của phản ứng thủy phân este trong môi trường kiềm (NaOH) là:",
    "options": [
      {
        "key": "A",
        "text": "muối của axit và ancol"
      },
      {
        "key": "B",
        "text": "axit và ancol"
      },
      {
        "key": "C",
        "text": "axit và anđehit"
      },
      {
        "key": "D",
        "text": "axit và ete"
      }
    ],
    "answer": "A",
    "explanation": "Trong môi trường kiềm, axit sinh ra tiếp tục trung hòa tạo muối natri; phản ứng một chiều.",
    "points": 0.25,
    "tags": [
      "este",
      "thủy phân",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-a-08",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho dung dịch glucose tác dụng với dung dịch $\\text{Cu(OH)}_2$ rồi đun nóng. Hiện tượng quan sát được là:",
    "options": [
      {
        "key": "A",
        "text": "kết tủa trắng xuất hiện"
      },
      {
        "key": "B",
        "text": "dung dịch chuyển sang màu xanh lam"
      },
      {
        "key": "C",
        "text": "kết tủa vàng xuất hiện"
      },
      {
        "key": "D",
        "text": "kết tủa đỏ gạch xuất hiện"
      }
    ],
    "answer": "D",
    "explanation": "Glucose có nhóm $-\\text{CHO}$ khử $\\text{Cu}^{2+}$ thành $\\text{Cu}_2\\text{O}$ màu đỏ gạch khi đun nóng. (Lưu ý: không đun nóng thì tạo phức xanh lam.)",
    "points": 0.25,
    "tags": [
      "glucose",
      "tính khử",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-a-09",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Este $X$ có cấu tạo như hình bên dưới. Tên gọi của $X$ là:",
    "options": [
      {
        "key": "A",
        "text": "metyl propionat"
      },
      {
        "key": "B",
        "text": "etyl axetat"
      },
      {
        "key": "C",
        "text": "etyl butirat"
      },
      {
        "key": "D",
        "text": "propyl axetat"
      }
    ],
    "answer": "B",
    "explanation": "Este được tạo từ axit axetic và etanol, tên gọi etyl axetat.",
    "points": 0.25,
    "tags": [
      "este",
      "tên gọi",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "struct",
      "formula": "CH3-COO-CH2-CH3"
    }
  },
  {
    "id": "thpt-hoa-a-10",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Este $X$ đơn chức, mạch hở có tỉ khối hơi so với $\\text{H}_2$ bằng 44. Thủy phân $X$ trong axit loãng đun nóng thu được axit $Y$ và ancol $Z$ có cùng số nguyên tử cacbon. Tên gọi của $X$ là:",
    "options": [
      {
        "key": "A",
        "text": "etyl axetat"
      },
      {
        "key": "B",
        "text": "metyl propionat"
      },
      {
        "key": "C",
        "text": "propyl fomat"
      },
      {
        "key": "D",
        "text": "isopropyl fomat"
      }
    ],
    "answer": "A",
    "explanation": "$M_X=88=\\text{C}_4\\text{H}_8\\text{O}_2$. Vì $Y$, $Z$ cùng số nguyên tử C nên mỗi chất có 2 C: axit axetic và etanol, $X$ là etyl axetat.",
    "points": 0.25,
    "tags": [
      "este",
      "định danh",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-a-11",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Chất/hỗn hợp cần dùng để chuyển etanol thành etanal trong phòng thí nghiệm là:",
    "options": [
      {
        "key": "A",
        "text": "$\\text{H}_2\\text{SO}_4$ đặc ở $170^{\\circ}$C"
      },
      {
        "key": "B",
        "text": "$\\text{H}_2$/Ni"
      },
      {
        "key": "C",
        "text": "$\\text{CuO}$, đun nóng"
      },
      {
        "key": "D",
        "text": "$\\text{Cl}_2$, ánh sáng"
      }
    ],
    "answer": "C",
    "explanation": "$\\text{C}_2\\text{H}_5\\text{OH}+\\text{CuO}\\xrightarrow{t^{\\circ}}\\text{CH}_3\\text{CHO}+\\text{Cu}+\\text{H}_2\\text{O}$.",
    "points": 0.25,
    "tags": [
      "ancol",
      "anđehit",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-a-12",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Số mol NaOH tối đa phản ứng với 1 mol glycine ($\\text{NH}_2\\text{CH}_2\\text{COOH}$) là:",
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "1"
      },
      {
        "key": "C",
        "text": "3"
      },
      {
        "key": "D",
        "text": "0"
      }
    ],
    "answer": "B",
    "explanation": "Chỉ nhóm $-\\text{COOH}$ tác dụng với NaOH (nhóm $-\\text{NH}_2$ không phản ứng), nên cần 1 mol NaOH.",
    "points": 0.25,
    "tags": [
      "amino axit",
      "lưỡng tính",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-a-13",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Polime polypropylen có khối lượng phân tử trung bình 420000. Số đơn vị liên kết (mạch) trong phân tử polime là:",
    "options": [
      {
        "key": "A",
        "text": "1000"
      },
      {
        "key": "B",
        "text": "7000"
      },
      {
        "key": "C",
        "text": "20000"
      },
      {
        "key": "D",
        "text": "10000"
      }
    ],
    "answer": "D",
    "explanation": "$M(\\text{monome } \\text{C}_3\\text{H}_6)=42$; $n=\\dfrac{420000}{42}=10000$.",
    "points": 0.25,
    "tags": [
      "polime",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-a-14",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Hiđro hóa hoàn toàn 8,84 g triolein ($M=884$) bằng $\\text{H}_2$ (xúc tác Ni, đun nóng). Thể tích $\\text{H}_2$ (đktc) cần dùng là:",
    "options": [
      {
        "key": "A",
        "text": "0,672 lít"
      },
      {
        "key": "B",
        "text": "0,448 lít"
      },
      {
        "key": "C",
        "text": "0,896 lít"
      },
      {
        "key": "D",
        "text": "1,344 lít"
      }
    ],
    "answer": "A",
    "explanation": "$n_{\\text{triolein}}=\\dfrac{8{,}84}{884}=0{,}01$ mol; mỗi mol triolein cần 3 mol $\\text{H}_2$: $V=0{,}03\\cdot 22{,}4=0{,}672$ lít.",
    "points": 0.25,
    "tags": [
      "chất béo",
      "hiđro hóa",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-a-15",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Số amino axit mạch hở là đồng phân cấu tạo của nhau, cùng công thức phân tử $\\text{C}_3\\text{H}_7\\text{O}_2\\text{N}$ là:",
    "options": [
      {
        "key": "A",
        "text": "1"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "2"
      },
      {
        "key": "D",
        "text": "4"
      }
    ],
    "answer": "C",
    "explanation": "Hai amino axit: $\\text{NH}_2\\text{CH}_2\\text{CH}_2\\text{COOH}$ (β-alanine) và $\\text{CH}_3\\text{CH}(\\text{NH}_2)\\text{COOH}$ (α-alanine).",
    "points": 0.25,
    "tags": [
      "amino axit",
      "đồng phân",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-a-16",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Este $X$ đơn chức có khối lượng mol 88. Thủy phân $X$ trong dung dịch NaOH thu được muối của axit cacboxylic $Y$ và ancol $Z$; oxi hóa $Z$ bằng CuO rồi oxi hóa tiếp thu được chính axit $Y$. Xà phòng hóa hoàn toàn 4,4 g $X$ bằng NaOH vừa đủ, khối lượng muối khan thu được sau khi cô cạn dung dịch là:",
    "options": [
      {
        "key": "A",
        "text": "3,4 g"
      },
      {
        "key": "B",
        "text": "4,4 g"
      },
      {
        "key": "C",
        "text": "8,2 g"
      },
      {
        "key": "D",
        "text": "4,1 g"
      }
    ],
    "answer": "D",
    "explanation": "$X$ là $\\text{CH}_3\\text{COOC}_2\\text{H}_5$ ($M=88$): $n_X=0{,}05$ mol → muối $\\text{CH}_3\\text{COONa}$ $0{,}05$ mol $=4{,}1$ g.",
    "points": 0.25,
    "tags": [
      "este",
      "xà phòng hóa",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-a-17",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Xét các phát biểu về este và lipit. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Este có mạch cacbon ngắn thường là chất lỏng có mùi thơm của hoa quả, ít tan trong nước."
      },
      {
        "key": "b",
        "text": "Phản ứng thủy phân este trong môi trường kiềm là phản ứng thuận nghịch."
      },
      {
        "key": "c",
        "text": "Dầu ăn thực vật (chất béo lỏng) có thành phần gốc axit béo không no chiếm tỉ lệ cao."
      },
      {
        "key": "d",
        "text": "Xà phòng hóa 1 mol este của axit đơn chức và ancol đơn chức cần 2 mol NaOH."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng. b) Sai: trong môi trường kiềm, phản ứng tạo muối nên xảy ra một chiều. c) Đúng: gốc axit không no làm dầu lỏng. d) Sai: este đơn chức của axit đơn chức chỉ cần 1 mol NaOH.",
    "points": 1,
    "tags": [
      "este",
      "lipit",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-a-18",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho este $X$ có cấu tạo như hình bên dưới. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "$X$ là este đơn chức, mạch hở."
      },
      {
        "key": "b",
        "text": "$X$ được tạo thành từ axit axetic và propan-1-ol."
      },
      {
        "key": "c",
        "text": "$X$ tác dụng với kim loại Na sinh ra khí $\\text{H}_2$."
      },
      {
        "key": "d",
        "text": "Thủy phân hoàn toàn 2,96 g $X$ cần 0,029 mol NaOH."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: chỉ có một nhóm $-\\text{COO}-$. b) Đúng: axit $\\text{CH}_3\\text{COOH}$ + ancol $\\text{C}_3\\text{H}_7\\text{OH}$. c) Sai: este không có nhóm $-\\text{OH}$ nên không phản ứng với Na. d) Đúng: $M_X=102$, $n_X=\\frac{2{,}96}{102}=0{,}029$ mol, cần đúng 0,029 mol NaOH.",
    "points": 1,
    "tags": [
      "este",
      "thủy phân",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "struct",
      "formula": "CH3-COO-CH2-CH2-CH3"
    }
  },
  {
    "id": "thpt-hoa-a-19",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Xét các phát biểu về cacbohiđrat. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Glucose và fructose là đồng phân cấu tạo của nhau."
      },
      {
        "key": "b",
        "text": "Khi đun nóng fructose với dung dịch $\\text{Cu(OH)}_2$ cũng xuất hiện kết tủa đỏ gạch."
      },
      {
        "key": "c",
        "text": "Saccarose là đisaccarit có tính khử."
      },
      {
        "key": "d",
        "text": "Thủy phân hoàn toàn tinh bột bằng axit loãng cho fructose."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) Đúng: cùng $\\text{C}_6\\text{H}_{12}\\text{O}_6$ nhưng khác cấu tạo. b) Đúng: trong môi trường kiềm fructose chuyển hóa thành glucose nên có tính khử với $\\text{Cu(OH)}_2$ khi đun nóng. c) Sai: không có nhóm $-\\text{CHO}$ tự do nên không có tính khử. d) Sai: cho glucose.",
    "points": 1,
    "tags": [
      "cacbohiđrat",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-a-20",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Xét các phát biểu về amino axit và protein. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Alanine ($\\text{CH}_3\\text{CH}(\\text{NH}_2)\\text{COOH}$) có tính lưỡng tính, phản ứng với cả HCl và NaOH."
      },
      {
        "key": "b",
        "text": "1 mol alanine phản ứng tối đa với 1 mol HCl."
      },
      {
        "key": "c",
        "text": "Thủy phân hoàn toàn protein chỉ thu được các amino axit."
      },
      {
        "key": "d",
        "text": "Đốt cháy hoàn toàn protein trong không khí chỉ thu được $\\text{CO}_2$ và $\\text{H}_2\\text{O}$."
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) Đúng. b) Đúng: chỉ nhóm $-\\text{NH}_2$ phản ứng với HCl. c) Đúng. d) Sai: protein chứa N, S nên còn $\\text{N}_2$, $\\text{SO}_2$...",
    "points": 1,
    "tags": [
      "amino axit",
      "protein",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-a-21",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Khối lượng mol của metyl fomat $\\text{HCOOCH}_3$ là bao nhiêu g/mol?",
    "answer": "60",
    "explanation": "$M=2\\cdot 12+4\\cdot 1+2\\cdot 16=60$ g/mol.",
    "points": 0.5,
    "tags": [
      "este",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-a-22",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Xà phòng hóa hoàn toàn 0,1 mol etyl axetat bằng dung dịch NaOH vừa đủ. Khối lượng NaOH cần dùng là bao nhiêu gam?",
    "answer": "4",
    "explanation": "$\\text{CH}_3\\text{COOC}_2\\text{H}_5+\\text{NaOH}\\to\\text{CH}_3\\text{COONa}+\\text{C}_2\\text{H}_5\\text{OH}$; $m_{\\text{NaOH}}=0{,}1\\cdot 40=4$ g.",
    "points": 0.5,
    "tags": [
      "este",
      "xà phòng hóa",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-a-23",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hiđro hóa hoàn toàn 18 g glucose ($\\text{C}_6\\text{H}_{12}\\text{O}_6$) bằng $\\text{H}_2$ (xúc tác Ni) tạo sorbitol. Thể tích $\\text{H}_2$ (đktc) cần dùng là bao nhiêu lít?",
    "answer": "2,24",
    "explanation": "$n_{\\text{glucose}}=\\frac{18}{180}=0{,}1$ mol; phản ứng 1:1: $V_{\\text{H}_2}=0{,}1\\cdot 22{,}4=2{,}24$ lít.",
    "points": 0.5,
    "tags": [
      "cacbohiđrat",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-a-24",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Đốt cháy hoàn toàn 0,1 mol este $\\text{CH}_3\\text{COOCH}_3$ (metyl axetat). Thể tích khí $\\text{O}_2$ (đktc) cần dùng là bao nhiêu lít?",
    "answer": "7,84",
    "explanation": "$\\text{C}_3\\text{H}_6\\text{O}_2+3{,}5\\text{O}_2\\to 3\\text{CO}_2+3\\text{H}_2\\text{O}$; $V=0{,}1\\cdot 3{,}5\\cdot 22{,}4=7{,}84$ lít.",
    "points": 0.5,
    "tags": [
      "este",
      "đốt cháy",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-a-25",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho 1 mol glycerol phản ứng hết với axit oleic (vừa đủ) tạo triolein. Khối lượng triolein thu được (tính bằng gam) là bao nhiêu?",
    "answer": "884",
    "explanation": "$M(\\text{triolein}\\ \\text{C}_{57}\\text{H}_{104}\\text{O}_6)=884$ g/mol; từ 1 mol glycerol thu đúng 1 mol triolein: 884 g.",
    "points": 0.5,
    "tags": [
      "lipit",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-a-26",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Este $X$ thủy phân trong axit loãng cho axit $Y$ và ancol $T$; oxi hóa hoàn toàn $T$ thu được chính axit $Y$. Biết $Y$ là axit fomic. Khối lượng $X$ thu được tối đa khi este hóa 4,6 g axit $Y$ với lượng $T$ vừa đủ là bao nhiêu gam?",
    "answer": "6",
    "explanation": "$Y$ là $\\text{HCOOH}$ (oxi hóa từ $\\text{CH}_3\\text{OH}\\to\\text{HCHO}\\to\\text{HCOOH}$), $X=\\text{HCOOCH}_3$ ($M=60$). $n_Y=\\frac{4{,}6}{46}=0{,}1$ mol → $m_X=6$ g.",
    "points": 0.5,
    "tags": [
      "este",
      "chuỗi phản ứng",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-b-01",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong một pin galvani đang hoạt động, quá trình oxi hóa xảy ra tại:",
    "options": [
      {
        "key": "A",
        "text": "cực dương"
      },
      {
        "key": "B",
        "text": "cực bất kì"
      },
      {
        "key": "C",
        "text": "cực âm"
      },
      {
        "key": "D",
        "text": "cực trung tính"
      }
    ],
    "answer": "C",
    "explanation": "Ở pin galvani, cực âm (anot) là nơi xảy ra quá trình oxi hóa; electron sinh ra đi qua dây dẫn ngoài đến cực dương.",
    "points": 0.25,
    "tags": [
      "pin điện phân",
      "pin galvani",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-b-02",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Kim loại có tính dẫn điện tốt nhất là:",
    "options": [
      {
        "key": "A",
        "text": "Cu"
      },
      {
        "key": "B",
        "text": "Ag"
      },
      {
        "key": "C",
        "text": "Al"
      },
      {
        "key": "D",
        "text": "Fe"
      }
    ],
    "answer": "B",
    "explanation": "Bạc (Ag) là kim loại dẫn điện tốt nhất, sau đó đến Cu, Au, Al.",
    "points": 0.25,
    "tags": [
      "kim loại",
      "tính chất",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-b-03",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Đinh sắt bị gỉ trong môi trường không khí ẩm là hiện tượng:",
    "options": [
      {
        "key": "A",
        "text": "ăn mòn điện hóa"
      },
      {
        "key": "B",
        "text": "ăn mòn hóa học"
      },
      {
        "key": "C",
        "text": "ăn mòn cơ học"
      },
      {
        "key": "D",
        "text": "không bị ăn mòn"
      }
    ],
    "answer": "A",
    "explanation": "Trong không khí ẩm, sắt tạo thành pin điện hóa với nước và oxy, bị ăn mòn điện hóa.",
    "points": 0.25,
    "tags": [
      "ăn mòn kim loại",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-b-04",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong các kim loại sau, kim loại phản ứng được với dung dịch axit HCl loãng giải phóng $\\text{H}_2$ là:",
    "options": [
      {
        "key": "A",
        "text": "Cu"
      },
      {
        "key": "B",
        "text": "Ag"
      },
      {
        "key": "C",
        "text": "Hg"
      },
      {
        "key": "D",
        "text": "Zn"
      }
    ],
    "answer": "D",
    "explanation": "Zn đứng trước H trong dãy hoạt động hóa học nên tác dụng với axit loãng giải phóng hydro.",
    "points": 0.25,
    "tags": [
      "dãy hoạt động hóa học",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-b-05",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho pin điện hóa Zn–Cu gồm điện cực Zn nhúng trong dung dịch $\\text{ZnSO}_4$ và điện cực Cu nhúng trong dung dịch $\\text{CuSO}_4$. Biết $E^{\\circ}(\\text{Zn}^{2+}/\\text{Zn})=-0{,}76$ V và $E^{\\circ}(\\text{Cu}^{2+}/\\text{Cu})=+0{,}34$ V. Suất điện động chuẩn của pin là:",
    "options": [
      {
        "key": "A",
        "text": "0,42 V"
      },
      {
        "key": "B",
        "text": "0,76 V"
      },
      {
        "key": "C",
        "text": "1,10 V"
      },
      {
        "key": "D",
        "text": "1,52 V"
      }
    ],
    "answer": "C",
    "explanation": "$E_{\\text{pin}}^{\\circ}=E_{\\text{cực dương}}^{\\circ}-E_{\\text{cực âm}}^{\\circ}=0{,}34-(-0{,}76)=1{,}10$ V.",
    "points": 0.25,
    "tags": [
      "pin galvani",
      "suất điện động",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-b-06",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Điện phân dung dịch $\\text{CuSO}_4$ (điện cực trơ) với hiệu suất 100%. Sản phẩm sinh ra ở catot là:",
    "options": [
      {
        "key": "A",
        "text": "$\\text{H}_2$"
      },
      {
        "key": "B",
        "text": "Cu"
      },
      {
        "key": "C",
        "text": "$\\text{O}_2$"
      },
      {
        "key": "D",
        "text": "Na"
      }
    ],
    "answer": "B",
    "explanation": "Ion $\\text{Cu}^{2+}$ bị khử ở catot: $\\text{Cu}^{2+}+2e\\to\\text{Cu}$, kim loại bám vào catot.",
    "points": 0.25,
    "tags": [
      "điện phân",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-b-07",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Điện phân dung dịch $\\text{AgNO}_3$ với dòng điện 2 A trong 965 giây (điện cực trơ, hiệu suất 100%). Khối lượng bạc thoát ra ở catot là:",
    "options": [
      {
        "key": "A",
        "text": "2,16 g"
      },
      {
        "key": "B",
        "text": "1,08 g"
      },
      {
        "key": "C",
        "text": "4,32 g"
      },
      {
        "key": "D",
        "text": "0,54 g"
      }
    ],
    "answer": "A",
    "explanation": "$Q=2\\cdot 965=1930$ C, $n_e=\\dfrac{1930}{96500}=0{,}02$ mol; $\\text{Ag}^{+}+e\\to\\text{Ag}$: $m=0{,}02\\cdot 108=2{,}16$ g.",
    "points": 0.25,
    "tags": [
      "định luật Faraday",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-b-08",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Phương pháp bảo vệ kim loại sắt tốt nhất trong các cách sau (khi sắt có thể bị trầy xước) là:",
    "options": [
      {
        "key": "A",
        "text": "tráng thiếc"
      },
      {
        "key": "B",
        "text": "tráng đồng"
      },
      {
        "key": "C",
        "text": "sơn dầu"
      },
      {
        "key": "D",
        "text": "tráng kẽm"
      }
    ],
    "answer": "D",
    "explanation": "Kẽm hoạt động mạnh hơn sắt, bị oxi hóa thay sắt (bảo vệ catot) ngay cả khi lớp mạ bị trầy xước.",
    "points": 0.25,
    "tags": [
      "bảo vệ kim loại",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-b-09",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Điện phân nóng chảy $\\text{Al}_2\\text{O}_3$ (thêm cryolit) để điều chế nhôm. Để điều chế 5,4 g Al, lượng electron đi qua (tính bằng culông, với $F=96500$ C/mol) là:",
    "options": [
      {
        "key": "A",
        "text": "19300 C"
      },
      {
        "key": "B",
        "text": "57900 C"
      },
      {
        "key": "C",
        "text": "28950 C"
      },
      {
        "key": "D",
        "text": "96500 C"
      }
    ],
    "answer": "B",
    "explanation": "$n_{\\text{Al}}=\\dfrac{5{,}4}{27}=0{,}2$ mol; $\\text{Al}^{3+}+3e\\to\\text{Al}$: $n_e=0{,}6$ mol; $Q=0{,}6\\cdot 96500=57900$ C.",
    "points": 0.25,
    "tags": [
      "điều chế nhôm",
      "định luật Faraday",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-b-10",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong pin Zn–Cu đang hoạt động, chiều chuyển động của electron trong mạch ngoài là:",
    "options": [
      {
        "key": "A",
        "text": "từ cực Cu sang cực Zn"
      },
      {
        "key": "B",
        "text": "qua dung dịch muối"
      },
      {
        "key": "C",
        "text": "từ cực Zn sang cực Cu"
      },
      {
        "key": "D",
        "text": "không có electron chuyển động"
      }
    ],
    "answer": "C",
    "explanation": "Zn bị oxi hóa ở cực âm sinh electron; electron đi qua dây dẫn ngoài từ Zn đến Cu.",
    "points": 0.25,
    "tags": [
      "pin galvani",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-b-11",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Điện phân dung dịch NaCl bão hòa (có màng ngăn, điện cực trơ) trong công nghiệp clo – kiềm. Sản phẩm ở anot là:",
    "options": [
      {
        "key": "A",
        "text": "$\\text{Cl}_2$"
      },
      {
        "key": "B",
        "text": "$\\text{H}_2$"
      },
      {
        "key": "C",
        "text": "$\\text{O}_2$"
      },
      {
        "key": "D",
        "text": "NaOH"
      }
    ],
    "answer": "A",
    "explanation": "Ion $\\text{Cl}^{-}$ bị oxi hóa ở anot: $2\\text{Cl}^{-}-2e\\to\\text{Cl}_2$.",
    "points": 0.25,
    "tags": [
      "điện phân",
      "clo – kiềm",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-b-12",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Đinh sắt mạ kẽm bị trầy xước lộ ra lớp sắt nhưng sắt vẫn không bị ăn mòn nhanh vì:",
    "options": [
      {
        "key": "A",
        "text": "kẽm là kim loại trơ"
      },
      {
        "key": "B",
        "text": "sắt bị thụ động hóa"
      },
      {
        "key": "C",
        "text": "lớp kẽm cách li hoàn toàn và vĩnh viễn"
      },
      {
        "key": "D",
        "text": "kẽm hoạt động mạnh hơn sắt nên bị oxi hóa thay sắt"
      }
    ],
    "answer": "D",
    "explanation": "Kẽm và sắt tạo thành pin với kẽm là cực âm (anot) bị oxi hóa, bảo vệ sắt — kiểu bảo vệ bằng kim loại hoạt động mạnh hơn.",
    "points": 0.25,
    "tags": [
      "ăn mòn",
      "bảo vệ kim loại",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-b-13",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Điện phân dung dịch $\\text{CuSO}_4$ (điện cực trơ, hiệu suất 100%) với 0,08 mol electron. Khối lượng Cu thoát ra ở catot là:",
    "options": [
      {
        "key": "A",
        "text": "1,28 g"
      },
      {
        "key": "B",
        "text": "2,56 g"
      },
      {
        "key": "C",
        "text": "3,2 g"
      },
      {
        "key": "D",
        "text": "6,4 g"
      }
    ],
    "answer": "B",
    "explanation": "$\\text{Cu}^{2+}+2e\\to\\text{Cu}$: $n_{\\text{Cu}}=0{,}04$ mol, $m=0{,}04\\cdot 64=2{,}56$ g.",
    "points": 0.25,
    "tags": [
      "định luật Faraday",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-b-14",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Chất điện phân trong pin khô (pin Leclanché) là:",
    "options": [
      {
        "key": "A",
        "text": "$\\text{H}_2\\text{SO}_4$ đặc"
      },
      {
        "key": "B",
        "text": "$\\text{CuSO}_4$"
      },
      {
        "key": "C",
        "text": "$\\text{NH}_4\\text{Cl}$ (dạng hồ)"
      },
      {
        "key": "D",
        "text": "$\\text{NaCl}$ rắn khan"
      }
    ],
    "answer": "C",
    "explanation": "Pin khô dùng dung dịch $\\text{NH}_4\\text{Cl}$ ở dạng pasty làm chất điện phân, vỏ kẽm là cực âm.",
    "points": 0.25,
    "tags": [
      "pin khô",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-b-15",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Điện phân (điện cực trơ) dung dịch chứa đồng thời 0,1 mol $\\text{Ag}^{+}$ và 0,1 mol $\\text{Cu}^{2+}$ với lượng electron 0,15 mol. Khối lượng kim loại thoát ra ở catot là:",
    "options": [
      {
        "key": "A",
        "text": "12,4 g"
      },
      {
        "key": "B",
        "text": "10,8 g"
      },
      {
        "key": "C",
        "text": "6,4 g"
      },
      {
        "key": "D",
        "text": "13,6 g"
      }
    ],
    "answer": "A",
    "explanation": "$\\text{Ag}^{+}$ khử trước (0,1 mol e), còn 0,05 mol e cho $\\text{Cu}^{2+}$: $n_{\\text{Cu}}=0{,}025$ mol. $m=10{,}8+0{,}025\\cdot 64=12{,}4$ g.",
    "points": 0.25,
    "tags": [
      "điện phân",
      "trình tự khử",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-b-16",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Điện phân 200 mL dung dịch $\\text{AgNO}_3$ 0,1 M (điện cực trơ) với cường độ dòng điện 2 A trong 20,1 phút. Thể tích khí $\\text{H}_2$ (đktc) sinh ra ở catot là:",
    "options": [
      {
        "key": "A",
        "text": "0,112 lít"
      },
      {
        "key": "B",
        "text": "0,028 lít"
      },
      {
        "key": "C",
        "text": "0,056 lít"
      },
      {
        "key": "D",
        "text": "0,448 lít"
      }
    ],
    "answer": "C",
    "explanation": "$Q=2\\cdot 1206\\approx 2412$ C, $n_e\\approx 0{,}025$ mol; $\\text{Ag}^{+}=0{,}02$ mol hết trước (0,02 mol e), còn 0,005 mol e điện phân nước: $n_{\\text{H}_2}=0{,}0025$ mol $=0{,}056$ lít.",
    "points": 0.25,
    "tags": [
      "điện phân",
      "hiệu suất",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-b-17",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Xét pin galvani gồm hai điện cực Zn và Cu cắm trong dung dịch $\\text{H}_2\\text{SO}_4$ loãng, hai cực nối với nhau bằng dây dẫn. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Zn là cực âm, bị oxi hóa."
      },
      {
        "key": "b",
        "text": "Electron trong dây dẫn ngoài di chuyển từ cực Cu sang cực Zn."
      },
      {
        "key": "c",
        "text": "Bọt khí $\\text{H}_2$ xuất hiện ở điện cực Zn."
      },
      {
        "key": "d",
        "text": "Ở cực dương (Cu) diễn ra quá trình khử."
      }
    ],
    "answer": "ĐSSĐ",
    "explanation": "a) Đúng: Zn hoạt động hơn nên là cực âm, bị oxi hóa. b) Sai: electron đi từ Zn (cực âm) sang Cu. c) Sai: khí $\\text{H}_2$ thoát ra ở điện cực Cu (cực dương). d) Đúng: $2\\text{H}^{+}+2e\\to\\text{H}_2$ là quá trình khử.",
    "points": 1,
    "tags": [
      "pin galvani",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-b-18",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Điện phân 200 mL dung dịch $\\text{AgNO}_3$ 0,1 M (điện cực trơ) với dòng điện 0,965 A trong 1000 giây, hiệu suất 100%. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Khối lượng Ag thoát ra ở catot là 1,08 g."
      },
      {
        "key": "b",
        "text": "Sau khi điện phân, dung dịch còn 0,02 mol $\\text{Ag}^{+}$."
      },
      {
        "key": "c",
        "text": "Ở anot sinh ra khí $\\text{O}_2$ với thể tích 0,056 lít (đktc)."
      },
      {
        "key": "d",
        "text": "Sau khi điện phân, pH dung dịch tăng."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng: $n_e=\\frac{965}{96500}=0{,}01$ mol, $m_{\\text{Ag}}=1{,}08$ g. b) Sai: còn $0{,}02-0{,}01=0{,}01$ mol $\\text{Ag}^{+}$. c) Đúng: $4\\text{OH}^{-}-4e\\to\\text{O}_2+2\\text{H}_2\\text{O}$, $n_{\\text{O}_2}=0{,}0025$ mol $=0{,}056$ lít. d) Sai: dung dịch sinh ra $\\text{HNO}_3$ nên pH giảm.",
    "points": 1,
    "tags": [
      "điện phân",
      "định luật Faraday",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-b-19",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "So sánh sự ăn mòn của cột thép đặt trong nước biển và cột thép đặt trong đất ẩm (cùng điều kiện khác). Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Cột thép trong nước biển ăn mòn nhanh hơn do độ dẫn điện của môi trường cao."
      },
      {
        "key": "b",
        "text": "Trong quá trình ăn mòn, Fe bị oxi hóa thành $\\text{Fe}^{2+}$."
      },
      {
        "key": "c",
        "text": "Oxy bị khử tại các vùng làm anot của bề mặt kim loại."
      },
      {
        "key": "d",
        "text": "Bọc chì (Pb) quanh thép giúp bảo vệ thép tốt hơn so với bọc kẽm."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) Đúng. b) Đúng: Fe là cực âm bị oxi hóa. c) Sai: oxy bị khử ở cực dương (catot). d) Sai: Pb hoạt động yếu hơn Fe nên làm Fe trở thành cực âm, tăng tốc ăn mòn; kẽm mới bảo vệ sắt.",
    "points": 1,
    "tags": [
      "ăn mòn kim loại",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-b-20",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Điện phân nóng chảy $\\text{Al}_2\\text{O}_3$ với dòng điện 100000 A trong 1 giờ (điện cực than, hiệu suất 100%, $F=96500$ C/mol). Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Để tạo ra 1 mol Al cần 3 mol electron."
      },
      {
        "key": "b",
        "text": "Trong 1 giờ thu được xấp xỉ 33,6 kg nhôm."
      },
      {
        "key": "c",
        "text": "Điện cực than ở anot không bị tiêu hao trong quá trình điện phân."
      },
      {
        "key": "d",
        "text": "Có thể thay điện cực than bằng điện cực sắt để tiết kiệm chi phí mà không ảnh hưởng sản phẩm."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) Đúng. b) Đúng: $n_e=\\frac{3{,}6\\cdot10^{8}}{96500}\\approx 3731$ mol, $n_{\\text{Al}}\\approx 1244$ mol $\\approx 33{,}6$ kg. c) Sai: anot than bị cháy bởi $\\text{O}_2$ sinh ra. d) Sai: sắt sẽ bị oxi hóa ở anot, làm bẩn và thay đổi sản phẩm.",
    "points": 1,
    "tags": [
      "điều chế nhôm",
      "điện phân",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-b-21",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Điện phân dung dịch $\\text{AgNO}_3$ (điện cực trơ) với lượng điện 9650 C. Khối lượng Ag thoát ra ở catot là bao nhiêu gam?",
    "answer": "10,8",
    "explanation": "$n_e=\\frac{9650}{96500}=0{,}1$ mol; $m_{\\text{Ag}}=0{,}1\\cdot 108=10{,}8$ g.",
    "points": 0.5,
    "tags": [
      "định luật Faraday",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-b-22",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Pin Zn–Cu có suất điện động 1,1 V được nối với điện trở ngoài 2 $\\Omega$ (bỏ qua điện trở trong). Cường độ dòng điện trong mạch (A) là bao nhiêu?",
    "answer": "0,55",
    "explanation": "$I=\\dfrac{E}{R}=\\dfrac{1{,}1}{2}=0{,}55$ A.",
    "points": 0.5,
    "tags": [
      "pin galvani",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-b-23",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Điện phân dung dịch $\\text{CuSO}_4$ (điện cực trơ) với 0,05 mol electron. Khối lượng Cu thoát ra ở catot là bao nhiêu gam?",
    "answer": "3,2",
    "explanation": "$n_{\\text{Cu}}=\\frac{0{,}05}{2}=0{,}025$ mol; $m=0{,}025\\cdot 64=3{,}2$ g.",
    "points": 0.5,
    "tags": [
      "định luật Faraday",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-b-24",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Điện phân dung dịch NaCl loãng (điện cực trơ) với 0,1 mol electron. Thể tích khí $\\text{H}_2$ (đktc) sinh ra ở catot là bao nhiêu lít?",
    "answer": "1,12",
    "explanation": "$2\\text{H}^{+}+2e\\to\\text{H}_2$: $n_{\\text{H}_2}=0{,}05$ mol; $V=1{,}12$ lít.",
    "points": 0.5,
    "tags": [
      "điện phân",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-b-25",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Điện phân nóng chảy $\\text{Al}_2\\text{O}_3$ thu được 1,8 g Al. Lượng điện cần dùng, làm tròn đến hàng phần mười (kiloCoulomb), là bao nhiêu?",
    "answer": "19,3",
    "explanation": "$n_{\\text{Al}}=\\frac{1{,}8}{27}=\\frac{1}{15}$ mol; $n_e=0{,}2$ mol; $Q=0{,}2\\cdot 96500=19300$ C $=19{,}3$ kC.",
    "points": 0.5,
    "tags": [
      "điều chế nhôm",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-b-26",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Điện phân (điện cực trơ) dung dịch chứa 0,04 mol $\\text{Ag}^{+}$ và 0,06 mol $\\text{Cu}^{2+}$ với lượng electron 0,08 mol. Khối lượng kim loại thoát ra ở catot là bao nhiêu gam?",
    "answer": "5,6",
    "explanation": "$\\text{Ag}^{+}$ khử trước (0,04 mol e), còn 0,04 mol e cho $\\text{Cu}^{2+}$: $n_{\\text{Cu}}=0{,}02$ mol. $m=0{,}04\\cdot 108+0{,}02\\cdot 64=4{,}32+1{,}28=5{,}6$ g.",
    "points": 0.5,
    "tags": [
      "điện phân",
      "trình tự khử",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-c-01",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Màu ngọn lửa khi đốt các muối của Na và K lần lượt là:",
    "options": [
      {
        "key": "A",
        "text": "Na tím, K vàng"
      },
      {
        "key": "B",
        "text": "Na vàng, K tím nhạt"
      },
      {
        "key": "C",
        "text": "Na xanh, K đỏ"
      },
      {
        "key": "D",
        "text": "Na đỏ, K xanh"
      }
    ],
    "answer": "B",
    "explanation": "Na cho ngọn lửa màu vàng, K cho ngọn lửa màu tím nhạt (quan sát qua kính xanh cobalt).",
    "points": 0.25,
    "tags": [
      "kim loại kiềm",
      "ngọn lửa",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-c-02",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Sản phẩm của phản ứng canxi với nước là:",
    "options": [
      {
        "key": "A",
        "text": "CaO và $\\text{H}_2$"
      },
      {
        "key": "B",
        "text": "$\\text{CaH}_2$"
      },
      {
        "key": "C",
        "text": "$\\text{Ca(OH)}_2$ và $\\text{H}_2$"
      },
      {
        "key": "D",
        "text": "$\\text{CaO}_2$ và $\\text{H}_2$"
      }
    ],
    "answer": "C",
    "explanation": "$\\text{Ca}+2\\text{H}_2\\text{O}\\to\\text{Ca(OH)}_2+\\text{H}_2\\uparrow$.",
    "points": 0.25,
    "tags": [
      "kim loại kiềm thổ",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-c-03",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Màu đặc trưng của ion $\\text{Fe}^{2+}$ trong dung dịch là:",
    "options": [
      {
        "key": "A",
        "text": "xanh lục"
      },
      {
        "key": "B",
        "text": "vàng nâu"
      },
      {
        "key": "C",
        "text": "xanh lam"
      },
      {
        "key": "D",
        "text": "tím"
      }
    ],
    "answer": "A",
    "explanation": "Dung dịch $\\text{Fe}^{2+}$ màu xanh lục nhạt; $\\text{Fe}^{3+}$ màu vàng nâu.",
    "points": 0.25,
    "tags": [
      "kim loại chuyển tiếp",
      "màu ion",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-c-04",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "$\\text{Al}_2\\text{O}_3$ được xếp vào loại oxit:",
    "options": [
      {
        "key": "A",
        "text": "bazơ"
      },
      {
        "key": "B",
        "text": "axit"
      },
      {
        "key": "C",
        "text": "trung tính"
      },
      {
        "key": "D",
        "text": "lưỡng tính"
      }
    ],
    "answer": "D",
    "explanation": "$\\text{Al}_2\\text{O}_3$ phản ứng được với cả axit mạnh và kiềm mạnh: oxit lưỡng tính.",
    "points": 0.25,
    "tags": [
      "nhôm",
      "oxit lưỡng tính",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-c-05",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Sản phẩm khi cho sắt tác dụng với dung dịch HCl loãng (dư) là:",
    "options": [
      {
        "key": "A",
        "text": "$\\text{FeCl}_3$"
      },
      {
        "key": "B",
        "text": "$\\text{FeCl}_2$"
      },
      {
        "key": "C",
        "text": "$\\text{Fe(OH)}_2$"
      },
      {
        "key": "D",
        "text": "$\\text{Fe}_2\\text{O}_3$"
      }
    ],
    "answer": "B",
    "explanation": "$\\text{Fe}+2\\text{HCl}\\to\\text{FeCl}_2+\\text{H}_2$; ion $\\text{H}^{+}$ chỉ oxi hóa được Fe đến $\\text{Fe}^{2+}$.",
    "points": 0.25,
    "tags": [
      "kim loại chuyển tiếp",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-c-06",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong phản ứng $2\\text{Na}_2\\text{O}_2+2\\text{H}_2\\text{O}\\to 4\\text{NaOH}+\\text{O}_2$, vai trò của $\\text{Na}_2\\text{O}_2$ là:",
    "options": [
      {
        "key": "A",
        "text": "chỉ là chất oxi hóa"
      },
      {
        "key": "B",
        "text": "chỉ là chất khử"
      },
      {
        "key": "C",
        "text": "vừa là chất oxi hóa vừa là chất khử"
      },
      {
        "key": "D",
        "text": "không tham gia phản ứng oxi hóa – khử"
      }
    ],
    "answer": "C",
    "explanation": "O trong $\\text{Na}_2\\text{O}_2$ có số oxi hóa $-1$, một phần tăng lên 0 (bị oxi hóa), một phần giảm xuống $-2$ (bị khử): tự oxi hóa – khử.",
    "points": 0.25,
    "tags": [
      "oxi hóa – khử",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-c-07",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho từng nhỏ $\\text{NH}_3$ (dư) vào dung dịch $\\text{CuSO}_4$. Hiện tượng cuối cùng quan sát được là:",
    "options": [
      {
        "key": "A",
        "text": "dung dịch xanh lam thẫm"
      },
      {
        "key": "B",
        "text": "kết tủa xanh lam"
      },
      {
        "key": "C",
        "text": "dung dịch vàng"
      },
      {
        "key": "D",
        "text": "kết tủa nâu đỏ"
      }
    ],
    "answer": "A",
    "explanation": "Ban đầu xuất hiện kết tủa $\\text{Cu(OH)}_2$, sau đó tan trong $\\text{NH}_3$ dư tạo phức $[\\text{Cu(NH}_3)_4]^{2+}$ màu xanh lam thẫm.",
    "points": 0.25,
    "tags": [
      "phức chất",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-c-08",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong ion phức $[\\text{Fe(CN)}_6]^{3-}$, số phối trí và điện tích của phức lần lượt là:",
    "options": [
      {
        "key": "A",
        "text": "6 và $+3$"
      },
      {
        "key": "B",
        "text": "4 và $-3$"
      },
      {
        "key": "C",
        "text": "6 và 0"
      },
      {
        "key": "D",
        "text": "6 và $-3$"
      }
    ],
    "answer": "D",
    "explanation": "Ion trung tâm $\\text{Fe}^{3+}$ liên kết với 6 phối tử $\\text{CN}^{-}$; điện tích phức $=+3+6(-1)=-3$.",
    "points": 0.25,
    "tags": [
      "phức chất",
      "số phối trí",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-c-09",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho 5,4 g Al tác dụng hoàn toàn với dung dịch NaOH (dư). Thể tích khí $\\text{H}_2$ (đktc) thu được là:",
    "options": [
      {
        "key": "A",
        "text": "3,36 lít"
      },
      {
        "key": "B",
        "text": "6,72 lít"
      },
      {
        "key": "C",
        "text": "13,44 lít"
      },
      {
        "key": "D",
        "text": "4,48 lít"
      }
    ],
    "answer": "B",
    "explanation": "$2\\text{Al}+2\\text{NaOH}+2\\text{H}_2\\text{O}\\to 2\\text{NaAlO}_2+3\\text{H}_2$; $n_{\\text{Al}}=0{,}2$ mol → $n_{\\text{H}_2}=0{,}3$ mol $=6{,}72$ lít.",
    "points": 0.25,
    "tags": [
      "nhôm",
      "amfoter",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-c-10",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho 0,1 mol $\\text{FeCl}_3$ phản ứng hoàn toàn với dung dịch KI (dư). Khối lượng $\\text{I}_2$ thu được là:",
    "options": [
      {
        "key": "A",
        "text": "6,35 g"
      },
      {
        "key": "B",
        "text": "25,4 g"
      },
      {
        "key": "C",
        "text": "12,7 g"
      },
      {
        "key": "D",
        "text": "3,18 g"
      }
    ],
    "answer": "C",
    "explanation": "$2\\text{Fe}^{3+}+2\\text{I}^{-}\\to 2\\text{Fe}^{2+}+\\text{I}_2$; $n_{\\text{I}_2}=0{,}05$ mol $=12{,}7$ g.",
    "points": 0.25,
    "tags": [
      "kim loại chuyển tiếp",
      "oxi hóa – khử",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-c-11",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong các kim loại sau, kim loại phản ứng được với nước nóng (không phản ứng với nước lạnh) là:",
    "options": [
      {
        "key": "A",
        "text": "Mg"
      },
      {
        "key": "B",
        "text": "Al"
      },
      {
        "key": "C",
        "text": "Cu"
      },
      {
        "key": "D",
        "text": "Ag"
      }
    ],
    "answer": "A",
    "explanation": "Mg phản ứng chậm với nước nóng; Al bị lớp oxit bảo vệ (cần loại bỏ oxit); Cu, Ag không phản ứng với nước.",
    "points": 0.25,
    "tags": [
      "kim loại",
      "hoạt động hóa học",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-c-12",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Nung hoàn toàn 10 g $\\text{CaCO}_3$ tinh khiết (phản ứng phân hủy hoàn toàn). Khối lượng $\\text{CaO}$ thu được là:",
    "options": [
      {
        "key": "A",
        "text": "2,8 g"
      },
      {
        "key": "B",
        "text": "8,4 g"
      },
      {
        "key": "C",
        "text": "11,2 g"
      },
      {
        "key": "D",
        "text": "5,6 g"
      }
    ],
    "answer": "D",
    "explanation": "$\\text{CaCO}_3\\to\\text{CaO}+\\text{CO}_2$; $n=0{,}1$ mol → $m_{\\text{CaO}}=0{,}1\\cdot 56=5{,}6$ g.",
    "points": 0.25,
    "tags": [
      "kim loại kiềm thổ",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-c-13",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho dung dịch chứa phức $[\\text{Ag(NH}_3)_2]^{+}$ phản ứng với dung dịch KI. Hiện tượng quan sát được là:",
    "options": [
      {
        "key": "A",
        "text": "kết tủa trắng"
      },
      {
        "key": "B",
        "text": "kết tủa vàng"
      },
      {
        "key": "C",
        "text": "dung dịch xanh"
      },
      {
        "key": "D",
        "text": "không có hiện tượng"
      }
    ],
    "answer": "B",
    "explanation": "Ion $\\text{I}^{-}$ lấy $\\text{Ag}^{+}$ khỏi phức (vì $\\text{AgI}$ có độ tan cực nhỏ), sinh kết tủa $\\text{AgI}$ màu vàng.",
    "points": 0.25,
    "tags": [
      "phức chất",
      "cân bằng",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-c-14",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Nung hoàn toàn 11,6 g $\\text{FeCO}_3$ trong không khí theo phản ứng $4\\text{FeCO}_3+\\text{O}_2\\to 2\\text{Fe}_2\\text{O}_3+4\\text{CO}_2$. Khối lượng $\\text{Fe}_2\\text{O}_3$ thu được là:",
    "options": [
      {
        "key": "A",
        "text": "8 g"
      },
      {
        "key": "B",
        "text": "16 g"
      },
      {
        "key": "C",
        "text": "4 g"
      },
      {
        "key": "D",
        "text": "11,6 g"
      }
    ],
    "answer": "A",
    "explanation": "$M(\\text{FeCO}_3)=116$: $n=0{,}1$ mol → $n_{\\text{Fe}_2\\text{O}_3}=0{,}05$ mol $=8$ g.",
    "points": 0.25,
    "tags": [
      "kim loại chuyển tiếp",
      "bảo toàn",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-c-15",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Hòa tan hoàn toàn 2,7 g Al trong dung dịch NaOH (dư). Thể tích khí $\\text{H}_2$ (đktc) sinh ra là:",
    "options": [
      {
        "key": "A",
        "text": "1,68 lít"
      },
      {
        "key": "B",
        "text": "6,72 lít"
      },
      {
        "key": "C",
        "text": "3,36 lít"
      },
      {
        "key": "D",
        "text": "2,24 lít"
      }
    ],
    "answer": "C",
    "explanation": "$n_{\\text{Al}}=0{,}1$ mol → $n_{\\text{H}_2}=0{,}15$ mol $=3{,}36$ lít.",
    "points": 0.25,
    "tags": [
      "nhôm",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-c-16",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Hòa tan hoàn toàn 11,2 g Fe trong dung dịch $\\text{HNO}_3$ loãng (dư) thu sản phẩm khử là NO. Thể tích NO (đktc) sinh ra là:",
    "options": [
      {
        "key": "A",
        "text": "2,24 lít"
      },
      {
        "key": "B",
        "text": "6,72 lít"
      },
      {
        "key": "C",
        "text": "8,96 lít"
      },
      {
        "key": "D",
        "text": "4,48 lít"
      }
    ],
    "answer": "D",
    "explanation": "$n_{\\text{Fe}}=0{,}2$ mol → $n_e=0{,}6$ mol; $\\text{NO}_3^{-}+4\\text{H}^{+}+3e\\to\\text{NO}+2\\text{H}_2\\text{O}$: $n_{\\text{NO}}=0{,}2$ mol $=4{,}48$ lít.",
    "points": 0.25,
    "tags": [
      "kim loại chuyển tiếp",
      "oxi hóa – khử",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-c-17",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét các phát biểu về kim loại kiềm (nhóm IA). Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Tính khử của kim loại kiềm tăng dần từ Li đến Cs."
      },
      {
        "key": "b",
        "text": "Na cháy trong oxi tạo ra $\\text{Na}_2\\text{O}_2$."
      },
      {
        "key": "c",
        "text": "Kim loại kiềm được bảo quản trong nước để tránh oxi hóa."
      },
      {
        "key": "d",
        "text": "Li là kim loại có khối lượng riêng nhỏ nhất trong các kim loại."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: bán kính nguyên tử tăng, dễ mất electron hơn. b) Đúng: $2\\text{Na}+\\text{O}_2\\to\\text{Na}_2\\text{O}_2$. c) Sai: phải bảo quản trong dầu hỏa vì kim loại kiềm phản ứng mãnh liệt với nước. d) Đúng: $\\rho_{\\text{Li}}\\approx 0{,}53$ g/cm³ là nhỏ nhất.",
    "points": 1,
    "tags": [
      "kim loại kiềm",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-c-18",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét các phát biểu về nhôm. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Al không bị thụ động hóa bởi $\\text{HNO}_3$ đặc nguội."
      },
      {
        "key": "b",
        "text": "Al phản ứng với dung dịch NaOH dư sinh $\\text{H}_2$, trong đó Al đóng vai trò chất khử."
      },
      {
        "key": "c",
        "text": "$\\text{Al}_2\\text{O}_3$ chỉ phản ứng với dung dịch axit."
      },
      {
        "key": "d",
        "text": "Phản ứng nhiệt nhôm $2\\text{Al}+\\text{Fe}_2\\text{O}_3\\to\\text{Al}_2\\text{O}_3+2\\text{Fe}$ toả nhiệt lượng lớn, dùng để hàn ray."
      }
    ],
    "answer": "SĐSĐ",
    "explanation": "a) Sai: Al bị thụ động hóa bởi $\\text{HNO}_3$ đặc nguội và $\\text{H}_2\\text{SO}_4$ đặc nguội. b) Đúng: $2\\text{Al}+2\\text{NaOH}+2\\text{H}_2\\text{O}\\to 2\\text{NaAlO}_2+3\\text{H}_2$. c) Sai: $\\text{Al}_2\\text{O}_3$ lưỡng tính, phản ứng cả kiềm. d) Đúng.",
    "points": 1,
    "tags": [
      "nhôm",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-c-19",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Xét các phát biểu về kim loại chuyển tiếp và hợp chất phức. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Số oxi hóa phổ biến của Fe trong hợp chất là $+2$ và $+3$."
      },
      {
        "key": "b",
        "text": "Dung dịch $\\text{FeCl}_3$ làm giấy quỳ tím chuyển xanh."
      },
      {
        "key": "c",
        "text": "Trong $[\\text{Cu(NH}_3)_4]\\text{SO}_4$, phân tử $\\text{NH}_3$ đóng vai trò phối tử."
      },
      {
        "key": "d",
        "text": "Hợp chất phức không tồn tại trong cơ thể sống."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng. b) Sai: $\\text{FeCl}_3$ thủy phân cho môi trường axit, quỳ hóa đỏ. c) Đúng: $\\text{NH}_3$ là phối tử, $\\text{Cu}^{2+}$ là ion trung tâm. d) Sai: hemoglobin (phức của Fe), diệp lục (phức của Mg)...",
    "points": 1,
    "tags": [
      "kim loại chuyển tiếp",
      "phức chất",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-c-20",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Hòa tan hoàn toàn 8,3 g hỗn hợp gồm Fe và Al trong dung dịch HCl (dư), thu được 5,6 lít $\\text{H}_2$ (đktc). Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Tổng số mol $\\text{H}_2$ là 0,25 mol."
      },
      {
        "key": "b",
        "text": "Hỗn hợp ban đầu không thể chỉ gồm Fe."
      },
      {
        "key": "c",
        "text": "Khối lượng Al trong hỗn hợp là 3,2 g."
      },
      {
        "key": "d",
        "text": "Hỗn hợp phản ứng tối đa với 0,5 mol HCl."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: $n_{\\text{H}_2}=\\frac{5{,}6}{22{,}4}=0{,}25$ mol. b) Đúng: nếu chỉ Fe thì $n_{\\text{Fe}}=\\frac{8{,}3}{56}\\approx 0{,}148$ mol < 0,25 mol. c) Sai: giải hệ $56x+27y=8{,}3$; $x+1{,}5y=0{,}25$ cho $x=y=0{,}1$ mol → $m_{\\text{Al}}=2{,}7$ g. d) Đúng: $0{,}1\\cdot 2+0{,}1\\cdot 3=0{,}5$ mol.",
    "points": 1,
    "tags": [
      "hỗn hợp kim loại",
      "bảo toàn electron",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-c-21",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho 4,6 g Na tác dụng hoàn toàn với nước. Thể tích khí $\\text{H}_2$ (đktc) thu được là bao nhiêu lít?",
    "answer": "2,24",
    "explanation": "$2\\text{Na}+2\\text{H}_2\\text{O}\\to 2\\text{NaOH}+\\text{H}_2$; $n_{\\text{Na}}=0{,}2$ mol → $n_{\\text{H}_2}=0{,}1$ mol $=2{,}24$ lít.",
    "points": 0.5,
    "tags": [
      "kim loại kiềm",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-c-22",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho 5,6 g Fe tác dụng hoàn toàn với dung dịch $\\text{CuSO}_4$ (dư). Khối lượng Cu thoát ra là bao nhiêu gam?",
    "answer": "6,4",
    "explanation": "$\\text{Fe}+\\text{Cu}^{2+}\\to\\text{Fe}^{2+}+\\text{Cu}$; $n_{\\text{Fe}}=0{,}1$ mol → $m_{\\text{Cu}}=6{,}4$ g.",
    "points": 0.5,
    "tags": [
      "kim loại chuyển tiếp",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-c-23",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Số phối trí của ion $\\text{Zn}^{2+}$ trong phức $[\\text{Zn(NH}_3)_4]^{2+}$ là bao nhiêu?",
    "answer": "4",
    "explanation": "Ion trung tâm $\\text{Zn}^{2+}$ liên kết với 4 phối tử $\\text{NH}_3$: số phối trí bằng 4.",
    "points": 0.5,
    "tags": [
      "phức chất",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-c-24",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hòa tan hoàn toàn 5,4 g Al trong dung dịch HCl (dư). Thể tích khí $\\text{H}_2$ (đktc) thu được là bao nhiêu lít?",
    "answer": "6,72",
    "explanation": "$2\\text{Al}+6\\text{HCl}\\to 2\\text{AlCl}_3+3\\text{H}_2$; $n_{\\text{Al}}=0{,}2$ mol → $n_{\\text{H}_2}=0{,}3$ mol $=6{,}72$ lít.",
    "points": 0.5,
    "tags": [
      "nhôm",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-c-25",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho 10 g $\\text{CaCO}_3$ phản ứng hoàn toàn với dung dịch HCl (dư). Thể tích khí $\\text{CO}_2$ (đktc) thu được là bao nhiêu lít?",
    "answer": "2,24",
    "explanation": "$\\text{CaCO}_3+2\\text{HCl}\\to\\text{CaCl}_2+\\text{CO}_2+\\text{H}_2\\text{O}$; $n=0{,}1$ mol → $V=2{,}24$ lít.",
    "points": 0.5,
    "tags": [
      "kim loại kiềm thổ",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-c-26",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hòa tan bao nhiêu gam Fe vào dung dịch $\\text{HNO}_3$ loãng (dư) để thu được 0,15 mol khí NO (sản phẩm khử duy nhất)?",
    "answer": "8,4",
    "explanation": "$n_e=3n_{\\text{NO}}=0{,}45$ mol → $n_{\\text{Fe}}=\\frac{0{,}45}{3}=0{,}15$ mol → $m=8{,}4$ g.",
    "points": 0.5,
    "tags": [
      "kim loại chuyển tiếp",
      "bảo toàn electron",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-d-01",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Phản ứng $\\text{CH}_4+\\text{Cl}_2\\xrightarrow{\\text{ánh sáng}}\\text{CH}_3\\text{Cl}+\\text{HCl}$ thuộc loại phản ứng:",
    "options": [
      {
        "key": "A",
        "text": "cộng"
      },
      {
        "key": "B",
        "text": "thế"
      },
      {
        "key": "C",
        "text": "trùng hợp"
      },
      {
        "key": "D",
        "text": "cháy"
      }
    ],
    "answer": "B",
    "explanation": "Một nguyên tử H trong metan bị thay bằng nguyên tử Cl: phản ứng thế.",
    "points": 0.25,
    "tags": [
      "ankan",
      "phản ứng thế",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-d-02",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Chất làm mất màu dung dịch brom trong $\\text{CCl}_4$ là:",
    "options": [
      {
        "key": "A",
        "text": "$\\text{CH}_4$"
      },
      {
        "key": "B",
        "text": "$\\text{C}_3\\text{H}_8$"
      },
      {
        "key": "C",
        "text": "$\\text{C}_2\\text{H}_4$"
      },
      {
        "key": "D",
        "text": "$\\text{C}_6\\text{H}_6$"
      }
    ],
    "answer": "C",
    "explanation": "Etilen có liên kết đôi nên phản ứng cộng với $\\text{Br}_2$ làm mất màu dung dịch brom.",
    "points": 0.25,
    "tags": [
      "anken",
      "phản ứng cộng",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-d-03",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Nhóm chức đặc trưng của ancol là:",
    "options": [
      {
        "key": "A",
        "text": "$-\\text{OH}$"
      },
      {
        "key": "B",
        "text": "$-\\text{CHO}$"
      },
      {
        "key": "C",
        "text": "$-\\text{COOH}$"
      },
      {
        "key": "D",
        "text": "$\\text{C}=\\text{C}$"
      }
    ],
    "answer": "A",
    "explanation": "Ancol chứa nhóm hydroxyl $-\\text{OH}$ nối với gốc hiđrocacbon.",
    "points": 0.25,
    "tags": [
      "ancol",
      "nhóm chức",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-d-04",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Anđehit fomic có công thức cấu tạo (như hình bên dưới):",
    "options": [
      {
        "key": "A",
        "text": "$\\text{CH}_3\\text{OH}$"
      },
      {
        "key": "B",
        "text": "$\\text{HCOOH}$"
      },
      {
        "key": "C",
        "text": "$\\text{CH}_3\\text{CHO}$"
      },
      {
        "key": "D",
        "text": "$\\text{HCHO}$"
      }
    ],
    "answer": "D",
    "explanation": "Anđehit fomic (fomanđehit) có công thức $\\text{HCHO}$, nhóm $-\\text{CHO}$ nối với nguyên tử H.",
    "points": 0.25,
    "tags": [
      "anđehit",
      "NB"
    ],
    "variable": false,
    "figure": {
      "kind": "struct",
      "formula": "HCHO"
    }
  },
  {
    "id": "thpt-hoa-d-05",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Ancol $X$ có cấu tạo như hình bên dưới. Tên gọi của $X$ là:",
    "options": [
      {
        "key": "A",
        "text": "propan-1-ol"
      },
      {
        "key": "B",
        "text": "propan-2-ol"
      },
      {
        "key": "C",
        "text": "propanal"
      },
      {
        "key": "D",
        "text": "axit propionic"
      }
    ],
    "answer": "B",
    "explanation": "Nhóm $-\\text{OH}$ gắn ở nguyên tử C số 2 của mạch 3 C: propan-2-ol.",
    "points": 0.25,
    "tags": [
      "ancol",
      "tên gọi",
      "NB"
    ],
    "variable": false,
    "figure": {
      "kind": "struct",
      "formula": "CH3-CH(OH)-CH3"
    }
  },
  {
    "id": "thpt-hoa-d-06",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Hiện tượng khi cho anđehit axetic tác dụng với dung dịch $\\text{AgNO}_3$ trong $\\text{NH}_3$ (dư), đun nóng là:",
    "options": [
      {
        "key": "A",
        "text": "kết tủa đỏ gạch xuất hiện"
      },
      {
        "key": "B",
        "text": "dung dịch chuyển màu xanh"
      },
      {
        "key": "C",
        "text": "lớp bạc bám sáng thành ống nghiệm"
      },
      {
        "key": "D",
        "text": "sục bọt khí"
      }
    ],
    "answer": "C",
    "explanation": "$\\text{CH}_3\\text{CHO}$ khử $\\text{Ag}^{+}$ thành Ag kim loại bám sáng thành ống nghiệm: phản ứng tráng gương.",
    "points": 0.25,
    "tags": [
      "anđehit",
      "tráng gương",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-d-07",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Số đồng phân cấu tạo của hiđrocacbon có công thức phân tử $\\text{C}_4\\text{H}_{10}$ là:",
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "5"
      }
    ],
    "answer": "A",
    "explanation": "Hai đồng phân: n-butane ($\\text{CH}_3\\text{CH}_2\\text{CH}_2\\text{CH}_3$) và isobutane ($\\text{(CH}_3)_2\\text{CHCH}_3$).",
    "points": 0.25,
    "tags": [
      "ankan",
      "đồng phân",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-d-08",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Phản ứng $\\text{C}_6\\text{H}_6+\\text{HNO}_3\\xrightarrow{\\text{H}_2\\text{SO}_4\\text{ đặc},\\,t^{\\circ}}\\text{C}_6\\text{H}_5\\text{NO}_2+\\text{H}_2\\text{O}$ thuộc loại phản ứng:",
    "options": [
      {
        "key": "A",
        "text": "cộng"
      },
      {
        "key": "B",
        "text": "trùng hợp"
      },
      {
        "key": "C",
        "text": "cháy"
      },
      {
        "key": "D",
        "text": "thế"
      }
    ],
    "answer": "D",
    "explanation": "Nhóm $-\\text{NO}_2$ thế cho một nguyên tử H trên vòng benzen: phản ứng thế (nitro hóa).",
    "points": 0.25,
    "tags": [
      "benzen",
      "phản ứng thế",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-d-09",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Chất làm mất màu dung dịch $\\text{KMnO}_4$ là:",
    "options": [
      {
        "key": "A",
        "text": "benzen"
      },
      {
        "key": "B",
        "text": "metan"
      },
      {
        "key": "C",
        "text": "stiren ($\\text{C}_6\\text{H}_5-\\text{CH}=\\text{CH}_2$)"
      },
      {
        "key": "D",
        "text": "etan"
      }
    ],
    "answer": "C",
    "explanation": "Stiren có liên kết đôi ở nhánh, làm mất màu $\\text{KMnO}_4$; benzen rất bền, không phản ứng với $\\text{KMnO}_4$.",
    "points": 0.25,
    "tags": [
      "hiđrocacbon",
      "anken",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-d-10",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Đốt cháy hoàn toàn 5,6 lít metan (đktc). Thể tích khí $\\text{CO}_2$ thu được (đktc) là:",
    "options": [
      {
        "key": "A",
        "text": "5,6 lít"
      },
      {
        "key": "B",
        "text": "11,2 lít"
      },
      {
        "key": "C",
        "text": "2,8 lít"
      },
      {
        "key": "D",
        "text": "4,48 lít"
      }
    ],
    "answer": "A",
    "explanation": "$\\text{CH}_4+2\\text{O}_2\\to\\text{CO}_2+2\\text{H}_2\\text{O}$; tỉ lệ 1:1 nên $V_{\\text{CO}_2}=5{,}6$ lít.",
    "points": 0.25,
    "tags": [
      "metan",
      "đốt cháy",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-d-11",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Oxi hóa 9,2 g ancol etylic bằng $\\text{CuO}$ đun nóng (hiệu suất 100%) thu etanal. Khối lượng etanal thu được là:",
    "options": [
      {
        "key": "A",
        "text": "4,4 g"
      },
      {
        "key": "B",
        "text": "8,8 g"
      },
      {
        "key": "C",
        "text": "17,6 g"
      },
      {
        "key": "D",
        "text": "22 g"
      }
    ],
    "answer": "B",
    "explanation": "$n_{\\text{C}_2\\text{H}_5\\text{OH}}=0{,}2$ mol → $n_{\\text{CH}_3\\text{CHO}}=0{,}2$ mol; $m=0{,}2\\cdot 44=8{,}8$ g.",
    "points": 0.25,
    "tags": [
      "ancol",
      "anđehit",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-d-12",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Số đồng phân cấu tạo của $\\text{C}_5\\text{H}_{12}$ là:",
    "options": [
      {
        "key": "A",
        "text": "3"
      },
      {
        "key": "B",
        "text": "2"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "5"
      }
    ],
    "answer": "A",
    "explanation": "Ba đồng phân: n-pentane, isopentane ($\\text{(CH}_3)_2\\text{CHCH}_2\\text{CH}_3$) và neopentane ($\\text{C(CH}_3)_4$).",
    "points": 0.25,
    "tags": [
      "ankan",
      "đồng phân",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-d-13",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Số ancol (đồng phân cấu tạo) có công thức phân tử $\\text{C}_3\\text{H}_8\\text{O}$ là:",
    "options": [
      {
        "key": "A",
        "text": "1"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "2"
      }
    ],
    "answer": "D",
    "explanation": "Hai ancol: propan-1-ol và propan-2-ol (đimêtl ete không phải ancol).",
    "points": 0.25,
    "tags": [
      "ancol",
      "đồng phân",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-d-14",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "pH của dung dịch $\\text{HCOOH}$ 0,1 M (với $K_a=2\\cdot10^{-4}$, coi hệ số hoạt động bằng 1, tính gần đúng) xấp xỉ:",
    "options": [
      {
        "key": "A",
        "text": "1,00"
      },
      {
        "key": "B",
        "text": "3,00"
      },
      {
        "key": "C",
        "text": "2,35"
      },
      {
        "key": "D",
        "text": "7,00"
      }
    ],
    "answer": "C",
    "explanation": "$[\\text{H}^{+}]\\approx\\sqrt{K_a C}=\\sqrt{2\\cdot10^{-4}\\cdot 0{,}1}\\approx 4{,}47\\cdot10^{-3}$ M; $\\text{pH}\\approx 2{,}35$.",
    "points": 0.25,
    "tags": [
      "axit",
      "pH",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-d-15",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Đốt cháy hoàn toàn 5,6 lít hỗn hợp khí gồm etilen và metan (đktc) thu được 8,4 lít $\\text{CO}_2$ (đktc). Thành phần phần trăm theo thể tích của etilen trong hỗn hợp là:",
    "options": [
      {
        "key": "A",
        "text": "25%"
      },
      {
        "key": "B",
        "text": "50%"
      },
      {
        "key": "C",
        "text": "75%"
      },
      {
        "key": "D",
        "text": "40%"
      }
    ],
    "answer": "B",
    "explanation": "Đặt $x+y=0{,}25$ (mol); $2x+y=0{,}375$ mol → $x=0{,}125$ mol: $\\frac{0{,}125}{0{,}25}=50\\%$.",
    "points": 0.25,
    "tags": [
      "hỗn hợp",
      "đốt cháy",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-d-16",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Số ancol bậc một (đồng phân cấu tạo) có công thức phân tử $\\text{C}_4\\text{H}_{10}\\text{O}$ là:",
    "options": [
      {
        "key": "A",
        "text": "1"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "2"
      }
    ],
    "answer": "D",
    "explanation": "Ancol bậc một: $\\text{CH}_3\\text{CH}_2\\text{CH}_2\\text{CH}_2\\text{OH}$ và $\\text{(CH}_3)_2\\text{CHCH}_2\\text{OH}$: 2 đồng phân.",
    "points": 0.25,
    "tags": [
      "ancol",
      "đồng phân",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-d-17",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét các phát biểu về hiđrocacbon. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Các ankan thoả mãn công thức tổng quát $\\text{C}_n\\text{H}_{2n+2}$."
      },
      {
        "key": "b",
        "text": "Các anken làm mất màu dung dịch brom."
      },
      {
        "key": "c",
        "text": "Benzen phản ứng cộng với $\\text{Br}_2$ một cách dễ dàng ở nhiệt độ thường."
      },
      {
        "key": "d",
        "text": "Phân tử axetilen có một liên kết $\\pi$."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) Đúng. b) Đúng: anken có liên kết đôi phản ứng cộng. c) Sai: benzen rất bền, chỉ phản ứng cộng trong điều kiện khắc nghiệt. d) Sai: axetilen có liên kết ba gồm 2 liên kết $\\pi$.",
    "points": 1,
    "tags": [
      "hiđrocacbon",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-d-18",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cho chất hữu cơ $X$ có cấu tạo như hình bên dưới. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "$X$ vừa có liên kết đôi $\\text{C}=\\text{C}$ vừa có nhóm $-\\text{OH}$."
      },
      {
        "key": "b",
        "text": "$X$ không làm mất màu nước brom."
      },
      {
        "key": "c",
        "text": "$X$ phản ứng với kim loại Na sinh khí $\\text{H}_2$."
      },
      {
        "key": "d",
        "text": "$X$ không bị oxi hóa bởi $\\text{CuO}$ đun nóng."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng: $X$ là ancol allyl. b) Sai: liên kết đôi làm mất màu nước brom. c) Đúng: nhóm $-\\text{OH}$ phản ứng với Na. d) Sai: $X$ là ancol bậc một, oxi hóa bởi CuO cho anđehit.",
    "points": 1,
    "tags": [
      "ancol",
      "anken",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "struct",
      "formula": "CH2=CH-CH2-OH"
    }
  },
  {
    "id": "thpt-hoa-d-19",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét các phát biểu về ancol, anđehit, axit. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Các ancol no, đơn chức, mạch hở thoả mãn công thức tổng quát $\\text{C}_n\\text{H}_{2n}$."
      },
      {
        "key": "b",
        "text": "Axit fomic vừa có nhóm $-\\text{COOH}$ vừa có nhóm $-\\text{CHO}$."
      },
      {
        "key": "c",
        "text": "Mọi axit cacboxylic đều là axit mạnh."
      },
      {
        "key": "d",
        "text": "Etanol có thể điều chế từ etilen và nước với xúc tác $\\text{H}_3\\text{PO}_4$, gia nhiệt."
      }
    ],
    "answer": "SĐSĐ",
    "explanation": "a) Sai: công thức tổng quát là $\\text{C}_n\\text{H}_{2n+2}\\text{O}$ (hoặc $\\text{C}_n\\text{H}_{2n+1}\\text{OH}$). b) Đúng. c) Sai: axit cacboxylic là axit yếu. d) Đúng: phản ứng cộng nước vào etilen.",
    "points": 1,
    "tags": [
      "ancol",
      "axit",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-d-20",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cho 4,4 g anđehit $X$ (no, đơn chức, mạch hở) phản ứng hoàn toàn với dung dịch $\\text{AgNO}_3$/$\\text{NH}_3$ (dư) thu 21,6 g Ag. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "$X$ là $\\text{CH}_3\\text{CHO}$."
      },
      {
        "key": "b",
        "text": "Số mol Ag sinh ra bằng số mol $X$ phản ứng."
      },
      {
        "key": "c",
        "text": "Phân tử $X$ có một liên kết $\\pi$ trong nhóm $\\text{C}=\\text{O}$."
      },
      {
        "key": "d",
        "text": "$X$ phản ứng được với dung dịch NaOH dư."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng: $n_{\\text{Ag}}=0{,}2$ mol → $n_X=0{,}1$ mol, $M_X=44$ → $\\text{CH}_3\\text{CHO}$. b) Sai: mỗi mol anđehit cho 2 mol Ag. c) Đúng. d) Sai: anđehit không phản ứng với NaOH.",
    "points": 1,
    "tags": [
      "anđehit",
      "tráng gương",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-d-21",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tỉ khối hơi của metan so với khí hiđro là bao nhiêu?",
    "answer": "8",
    "explanation": "$d_{\\text{H}_2}=\\dfrac{16}{2}=8$.",
    "points": 0.5,
    "tags": [
      "metan",
      "tỉ khối",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-d-22",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Đốt cháy hoàn toàn 2,24 lít etan ($\\text{C}_2\\text{H}_6$, đktc). Thể tích khí $\\text{CO}_2$ thu được (đktc) là bao nhiêu lít?",
    "answer": "4,48",
    "explanation": "$\\text{C}_2\\text{H}_6+3{,}5\\text{O}_2\\to 2\\text{CO}_2+3\\text{H}_2\\text{O}$; $n=0{,}1$ mol → $V_{\\text{CO}_2}=0{,}2\\cdot 22{,}4=4{,}48$ lít.",
    "points": 0.5,
    "tags": [
      "etan",
      "đốt cháy",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-d-23",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho 4,6 g ancol etylic phản ứng hoàn toàn với Na dư. Thể tích khí $\\text{H}_2$ (đktc) thu được là bao nhiêu lít?",
    "answer": "1,12",
    "explanation": "$2\\text{C}_2\\text{H}_5\\text{OH}+2\\text{Na}\\to 2\\text{C}_2\\text{H}_5\\text{ONa}+\\text{H}_2$; $n=0{,}1$ mol → $n_{\\text{H}_2}=0{,}05$ mol $=1{,}12$ lít.",
    "points": 0.5,
    "tags": [
      "ancol",
      "kim loại Na",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-d-24",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho 0,05 mol anđehit axetic phản ứng hoàn toàn với dung dịch $\\text{AgNO}_3$/$\\text{NH}_3$ (dư). Khối lượng Ag thu được là bao nhiêu gam?",
    "answer": "10,8",
    "explanation": "$\\text{CH}_3\\text{CHO}+2\\text{Ag}^{+}\\to\\text{CH}_3\\text{COOH}+2\\text{Ag}$? (dưới dạng muối amoniacat); $n_{\\text{Ag}}=0{,}1$ mol $=10{,}8$ g.",
    "points": 0.5,
    "tags": [
      "anđehit",
      "tráng gương",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-d-25",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "pH của dung dịch axit axetic $\\text{CH}_3\\text{COOH}$ 0,1 M ($K_a=1{,}8\\cdot10^{-5}$), làm tròn đến hai chữ số thập phân, là bao nhiêu?",
    "answer": "2,87",
    "explanation": "$[\\text{H}^{+}]\\approx\\sqrt{1{,}8\\cdot10^{-5}\\cdot 0{,}1}\\approx 1{,}34\\cdot10^{-3}$ M; $\\text{pH}\\approx 2{,}87$.",
    "points": 0.5,
    "tags": [
      "axit",
      "pH",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-d-26",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Đốt cháy hoàn toàn 0,3 mol hỗn hợp gồm metanol và etanol thu được 0,45 mol $\\text{CO}_2$. Thành phần phần trăm theo số mol của metanol trong hỗn hợp là bao nhiêu?",
    "answer": "50",
    "explanation": "Đặt $x+y=0{,}3$; $x+2y=0{,}45$ → $x=0{,}15$, $y=0{,}15$: mỗi chất chiếm 50%.",
    "points": 0.5,
    "tags": [
      "hỗn hợp",
      "đốt cháy",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-e-01",
    "subject": "Hoá học",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cấu hình electron của nguyên tử Na ($Z=11$) như hình bên dưới cho thấy lớp electron ngoài cùng có bao nhiêu electron hóa trị?",
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "1"
      },
      {
        "key": "D",
        "text": "11"
      }
    ],
    "answer": "C",
    "explanation": "Na có cấu hình $1s^22s^22p^63s^1$: lớp ngoài cùng (lớp 3) chỉ có 1 electron hóa trị.",
    "points": 0.25,
    "tags": [
      "cấu tạo nguyên tử",
      "NB"
    ],
    "variable": false,
    "figure": {
      "kind": "electron",
      "element": "Na"
    }
  },
  {
    "id": "thpt-hoa-e-02",
    "subject": "Hoá học",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Số oxi hóa của nguyên tố sulfur trong phân tử $\\text{H}_2\\text{SO}_4$ là:",
    "options": [
      {
        "key": "A",
        "text": "+4"
      },
      {
        "key": "B",
        "text": "+6"
      },
      {
        "key": "C",
        "text": "$-2$"
      },
      {
        "key": "D",
        "text": "+2"
      }
    ],
    "answer": "B",
    "explanation": "$2(+1)+x+4(-2)=0\\Rightarrow x=+6$.",
    "points": 0.25,
    "tags": [
      "số oxi hóa",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-e-03",
    "subject": "Hoá học",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong phản ứng oxi hóa – khử, chất khử là chất:",
    "options": [
      {
        "key": "A",
        "text": "cho electron"
      },
      {
        "key": "B",
        "text": "nhận electron"
      },
      {
        "key": "C",
        "text": "nhận proton"
      },
      {
        "key": "D",
        "text": "cho proton"
      }
    ],
    "answer": "A",
    "explanation": "Chất khử nhường electron, bị oxi hóa, làm số oxi hóa tăng.",
    "points": 0.25,
    "tags": [
      "oxi hóa – khử",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-e-04",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Khi tăng nhiệt độ của hệ phản ứng (các yếu tố khác không đổi), tốc độ phản ứng thường:",
    "options": [
      {
        "key": "A",
        "text": "giảm đi"
      },
      {
        "key": "B",
        "text": "không thay đổi"
      },
      {
        "key": "C",
        "text": "giảm dần về 0"
      },
      {
        "key": "D",
        "text": "tăng lên"
      }
    ],
    "answer": "D",
    "explanation": "Nhiệt độ tăng làm các hạt chuyển động nhanh hơn, số va chạm hiệu quả tăng nên tốc độ phản ứng tăng.",
    "points": 0.25,
    "tags": [
      "tốc độ phản ứng",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-e-05",
    "subject": "Hoá học",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Hệ số của $\\text{O}_2$ trong phản ứng đốt cháy propane: $\\text{C}_3\\text{H}_8+?\\text{O}_2\\to 3\\text{CO}_2+4\\text{H}_2\\text{O}$ là:",
    "options": [
      {
        "key": "A",
        "text": "3"
      },
      {
        "key": "B",
        "text": "5"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "10"
      }
    ],
    "answer": "B",
    "explanation": "Bảo toàn nguyên tử O: cần 3·2 + 4 = 10 nguyên tử O, tức 5 phân tử $\\text{O}_2$.",
    "points": 0.25,
    "tags": [
      "cân bằng phương trình",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-e-06",
    "subject": "Hoá học",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Số oxi hóa của nguyên tố nitrogen trong hai ion $\\text{NH}_4^{+}$ và $\\text{NO}_3^{-}$ (của muối $\\text{NH}_4\\text{NO}_3$) lần lượt là:",
    "options": [
      {
        "key": "A",
        "text": "+3 và $-5$"
      },
      {
        "key": "B",
        "text": "$-3$ và +3"
      },
      {
        "key": "C",
        "text": "$-3$ và +5"
      },
      {
        "key": "D",
        "text": "+3 và +5"
      }
    ],
    "answer": "C",
    "explanation": "Trong $\\text{NH}_4^{+}$: $x+4=+1\\Rightarrow x=-3$; trong $\\text{NO}_3^{-}$: $x+3(-2)=-1\\Rightarrow x=+5$.",
    "points": 0.25,
    "tags": [
      "số oxi hóa",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-e-07",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Xúc tác được dùng trong quá trình tổng hợp $\\text{NH}_3$ từ $\\text{N}_2$ và $\\text{H}_2$ (phương pháp Haber – Bosch) là:",
    "options": [
      {
        "key": "A",
        "text": "Cu"
      },
      {
        "key": "B",
        "text": "Ni"
      },
      {
        "key": "C",
        "text": "Pt"
      },
      {
        "key": "D",
        "text": "Fe"
      }
    ],
    "answer": "D",
    "explanation": "Tổng hợp $\\text{NH}_3$ công nghiệp dùng xúc tác sắt (Fe) ở khoảng 400–500 °C, áp suất cao.",
    "points": 0.25,
    "tags": [
      "cân bằng hóa học",
      "thực tế",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-e-08",
    "subject": "Hoá học",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Sục dần khí $\\text{CO}_2$ vào dung dịch $\\text{Ca(OH)}_2$, đồ thị khối lượng kết tủa theo lượng $\\text{CO}_2$ như hình bên dưới. Tổng thể tích $\\text{CO}_2$ (đktc) cần sục để kết tủa tan hết hoàn toàn là:",
    "options": [
      {
        "key": "A",
        "text": "4,48 lít"
      },
      {
        "key": "B",
        "text": "8,96 lít"
      },
      {
        "key": "C",
        "text": "2,24 lít"
      },
      {
        "key": "D",
        "text": "11,2 lít"
      }
    ],
    "answer": "B",
    "explanation": "Kết tủa tan hết khi sục tổng cộng 0,4 mol $\\text{CO}_2$ (nhìn từ đồ thị, điểm cuối $n_{\\text{CO}_2}=0{,}4$): $V=0{,}4\\cdot 22{,}4=8{,}96$ lít.",
    "points": 0.25,
    "tags": [
      "đồ thị phản ứng",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "chemgraph",
      "xName": "n CO2",
      "yName": "m↓ (g)",
      "points": "(0; 0) (0,2; 20) (0,4; 0)"
    }
  },
  {
    "id": "thpt-hoa-e-09",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Nồng độ của chất A giảm từ 0,3 M xuống 0,1 M trong 20 giây. Tốc độ trung bình của phản ứng là:",
    "options": [
      {
        "key": "A",
        "text": "0,01 mol/(L·s)"
      },
      {
        "key": "B",
        "text": "0,005 mol/(L·s)"
      },
      {
        "key": "C",
        "text": "0,02 mol/(L·s)"
      },
      {
        "key": "D",
        "text": "0,05 mol/(L·s)"
      }
    ],
    "answer": "A",
    "explanation": "$\\overline{v}=\\dfrac{|\\Delta C|}{\\Delta t}=\\dfrac{0{,}3-0{,}1}{20}=0{,}01$ mol/(L·s).",
    "points": 0.25,
    "tags": [
      "tốc độ phản ứng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-e-10",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho 1 mol $\\text{N}_2$ và 3 mol $\\text{H}_2$ phản ứng trong bình kín 20 lít theo phản ứng $\\text{N}_2+3\\text{H}_2\\rightleftharpoons 2\\text{NH}_3$. Tại cân bằng còn 0,6 mol $\\text{N}_2$. Số mol $\\text{NH}_3$ tại cân bằng là:",
    "options": [
      {
        "key": "A",
        "text": "0,4 mol"
      },
      {
        "key": "B",
        "text": "1,2 mol"
      },
      {
        "key": "C",
        "text": "0,8 mol"
      },
      {
        "key": "D",
        "text": "0,6 mol"
      }
    ],
    "answer": "C",
    "explanation": "$\\text{N}_2$ phản ứng 0,4 mol → $\\text{NH}_3$ tạo thành $0{,}4\\cdot 2=0{,}8$ mol.",
    "points": 0.25,
    "tags": [
      "cân bằng hóa học",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-e-11",
    "subject": "Hoá học",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Hòa tan 20 g NaCl vào 80 g nước. Nồng độ phần trăm của dung dịch thu được là:",
    "options": [
      {
        "key": "A",
        "text": "20%"
      },
      {
        "key": "B",
        "text": "25%"
      },
      {
        "key": "C",
        "text": "15%"
      },
      {
        "key": "D",
        "text": "30%"
      }
    ],
    "answer": "A",
    "explanation": "$C\\% =\\dfrac{20}{20+80}\\cdot 100\\%=20\\%$.",
    "points": 0.25,
    "tags": [
      "nồng độ phần trăm",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-e-12",
    "subject": "Hoá học",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Pha loãng 100 mL dung dịch $\\text{H}_2\\text{SO}_4$ 2 M bằng nước thành 500 mL dung dịch. Nồng độ mol của dung dịch mới là:",
    "options": [
      {
        "key": "A",
        "text": "0,5 M"
      },
      {
        "key": "B",
        "text": "1,0 M"
      },
      {
        "key": "C",
        "text": "0,2 M"
      },
      {
        "key": "D",
        "text": "0,4 M"
      }
    ],
    "answer": "D",
    "explanation": "$C_1V_1=C_2V_2\\Rightarrow C_2=\\dfrac{2\\cdot 100}{500}=0{,}4$ M.",
    "points": 0.25,
    "tags": [
      "pha loãng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-e-13",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Nung 20 g $\\text{CaCO}_3$ tinh khiết, thu được 3,36 lít $\\text{CO}_2$ (đktc). Khối lượng chất rắn sau phản ứng là:",
    "options": [
      {
        "key": "A",
        "text": "11,2 g"
      },
      {
        "key": "B",
        "text": "14,0 g"
      },
      {
        "key": "C",
        "text": "13,4 g"
      },
      {
        "key": "D",
        "text": "15,6 g"
      }
    ],
    "answer": "C",
    "explanation": "$n_{\\text{CO}_2}=0{,}15$ mol → phản ứng 0,15 mol $\\text{CaCO}_3$, mất $0{,}15\\cdot 44=6{,}6$ g: chất rắn còn $20-6{,}6=13{,}4$ g.",
    "points": 0.25,
    "tags": [
      "bài toán N–S",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-e-14",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Khử hoàn toàn 11,6 g $\\text{Fe}_3\\text{O}_4$ bằng CO theo phản ứng $\\text{Fe}_3\\text{O}_4+4\\text{CO}\\to 3\\text{Fe}+4\\text{CO}_2$. Thể tích CO (đktc) cần dùng là:",
    "options": [
      {
        "key": "A",
        "text": "4,48 lít"
      },
      {
        "key": "B",
        "text": "8,96 lít"
      },
      {
        "key": "C",
        "text": "2,24 lít"
      },
      {
        "key": "D",
        "text": "6,72 lít"
      }
    ],
    "answer": "A",
    "explanation": "$n_{\\text{Fe}_3\\text{O}_4}=0{,}05$ mol → $n_{\\text{CO}}=0{,}2$ mol $=4{,}48$ lít.",
    "points": 0.25,
    "tags": [
      "oxi hóa – khử",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-e-15",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Phản ứng $A+B\\rightleftharpoons C$ tại nhiệt độ xác định có hằng số cân bằng $K=4$. Ban đầu $[A]=[B]=2$ M. Nồng độ của $C$ tại cân bằng (M) là:",
    "options": [
      {
        "key": "A",
        "text": "2,00"
      },
      {
        "key": "B",
        "text": "1,50"
      },
      {
        "key": "C",
        "text": "0,67"
      },
      {
        "key": "D",
        "text": "1,41"
      }
    ],
    "answer": "D",
    "explanation": "$\frac{x}{(2-x)^2}=4Rightarrow4x^2-17x+16=0Rightarrow x=\frac{17-sqrt{33}}{8}approx1{,}41$ M (nghiệm còn lại lớn hơn 2, loại).",
    "points": 0.25,
    "tags": [
      "cân bằng hóa học",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-e-16",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Phản ứng có tốc độ $v=k[A][B]$. Nếu tăng nồng độ $[A]$ lên 2 lần và $[B]$ lên 3 lần thì tốc độ phản ứng tăng lên:",
    "options": [
      {
        "key": "A",
        "text": "3 lần"
      },
      {
        "key": "B",
        "text": "6 lần"
      },
      {
        "key": "C",
        "text": "5 lần"
      },
      {
        "key": "D",
        "text": "12 lần"
      }
    ],
    "answer": "B",
    "explanation": "$v'=k(2[A])(3[B])=6k[A][B]=6v$.",
    "points": 0.25,
    "tags": [
      "tốc độ phản ứng",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-e-17",
    "subject": "Hoá học",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Xét các phát biểu về cấu tạo nguyên tử. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Proton mang điện tích dương."
      },
      {
        "key": "b",
        "text": "Trong nguyên tử trung hòa điện, số electron nhiều hơn số proton."
      },
      {
        "key": "c",
        "text": "Khối lượng của nguyên tử tập trung chủ yếu ở lớp vỏ electron."
      },
      {
        "key": "d",
        "text": "Các nguyên tử của cùng một nguyên tố hóa học có cùng số proton."
      }
    ],
    "answer": "ĐSSĐ",
    "explanation": "a) Đúng. b) Sai: số electron bằng số proton. c) Sai: khối lượng tập trung ở hạt nhân. d) Đúng.",
    "points": 1,
    "tags": [
      "cấu tạo nguyên tử",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-e-18",
    "subject": "Hoá học",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Sục dần 0,2 mol $\\text{CO}_2$ vào bình chứa 0,2 mol $\\text{Ca(OH)}_2$ (dung dịch). Đồ thị khối lượng kết tủa theo lượng $\\text{CO}_2$ như hình bên dưới. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Ban đầu, $\\text{CO}_2$ phản ứng tạo kết tủa $\\text{CaCO}_3$."
      },
      {
        "key": "b",
        "text": "Khi sục được 0,1 mol $\\text{CO}_2$, khối lượng kết tủa là 10 g."
      },
      {
        "key": "c",
        "text": "Khối lượng kết tủa cực đại là 0,3 mol $\\text{CaCO}_3$."
      },
      {
        "key": "d",
        "text": "Nếu sục tiếp đến tổng cộng 0,4 mol $\\text{CO}_2$ thì kết tủa tan hết."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng. b) Đúng: pha 1 tỉ lệ 1:1, kết tủa 0,1 mol = 10 g. c) Sai: cực đại 0,2 mol = 20 g. d) Đúng: pha 2 cần thêm đúng 0,2 mol $\\text{CO}_2$ để tan hết $\\text{CaCO}_3$.",
    "points": 1,
    "tags": [
      "đồ thị phản ứng",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "chemgraph",
      "xName": "n CO2",
      "yName": "n↓ (mol)",
      "points": "(0; 0) (0,1; 0,1) (0,2; 0,2)"
    }
  },
  {
    "id": "thpt-hoa-e-19",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét phản ứng thuận nghịch $2\\text{SO}_2+\\text{O}_2\\rightleftharpoons 2\\text{SO}_3$ với $\\Delta H<0$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Tăng nhiệt độ làm cân bằng dịch chuyển theo chiều thuận."
      },
      {
        "key": "b",
        "text": "Tăng áp suất làm cân bằng dịch chuyển theo chiều thuận."
      },
      {
        "key": "c",
        "text": "Xúc tác không làm dịch chuyển cân bằng."
      },
      {
        "key": "d",
        "text": "Tăng nồng độ $\\text{O}_2$ làm tốc độ phản ứng thuận giảm."
      }
    ],
    "answer": "SĐĐS",
    "explanation": "a) Sai: phản ứng thuận toả nhiệt, tăng nhiệt độ cân bằng dịch chuyển ngược chiều. b) Đúng: chiều thuận giảm số mol khí. c) Đúng. d) Sai: tăng nồng độ chất phản ứng làm tốc độ thuận tăng.",
    "points": 1,
    "tags": [
      "cân bằng hóa học",
      "nguyên lí Le Chatelier",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-e-20",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho 6,72 lít $\\text{H}_2$ (đktc) phản ứng với lượng $\\text{N}_2$ dư trong bình kín theo phản ứng $\\text{N}_2+3\\text{H}_2\\rightleftharpoons 2\\text{NH}_3$, hiệu suất 50% theo $\\text{H}_2$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Lượng $\\text{H}_2$ phản ứng là 0,15 mol."
      },
      {
        "key": "b",
        "text": "Lượng $\\text{NH}_3$ thu được là 0,1 mol."
      },
      {
        "key": "c",
        "text": "Khối lượng $\\text{NH}_3$ thu được là 3,4 g."
      },
      {
        "key": "d",
        "text": "Nếu hiệu suất chỉ đạt 25% thì lượng $\\text{NH}_3$ thu được tăng gấp đôi so với trường hợp trên."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) Đúng: $n_{\\text{H}_2}=0{,}3$ mol, phản ứng 50% → 0,15 mol. b) Đúng: $n_{\\text{NH}_3}=\\frac{2}{3}\\cdot 0{,}15=0{,}1$ mol. c) Sai: $m=0{,}1\\cdot 17=1{,}7$ g. d) Sai: hiệu suất giảm một nửa thì $\\text{NH}_3$ cũng giảm một nửa (còn 0,05 mol).",
    "points": 1,
    "tags": [
      "hiệu suất",
      "cân bằng",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-e-21",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Số oxi hóa của nguyên tố chromium trong $\\text{K}_2\\text{Cr}_2\\text{O}_7$ là bao nhiêu?",
    "answer": "6",
    "explanation": "$2(+1)+2x+7(-2)=0\\Rightarrow x=+6$.",
    "points": 0.5,
    "tags": [
      "số oxi hóa",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-e-22",
    "subject": "Hoá học",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cân bằng phản ứng: $\\text{Fe}_2\\text{O}_3+?\\text{CO}\\to 2\\text{Fe}+3\\text{CO}_2$. Hệ số của CO là bao nhiêu?",
    "answer": "3",
    "explanation": "Bảo toàn O và C: cần 3 CO cho 3 O trong $\\text{Fe}_2\\text{O}_3$.",
    "points": 0.5,
    "tags": [
      "cân bằng phương trình",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-e-23",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Nồng độ chất A giảm từ 0,8 M xuống 0,4 M trong 40 giây. Tốc độ trung bình của phản ứng là bao nhiêu mol/(L·s)?",
    "answer": "0,01",
    "explanation": "$\\overline{v}=\\dfrac{0{,}4}{40}=0{,}01$ mol/(L·s).",
    "points": 0.5,
    "tags": [
      "tốc độ phản ứng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-e-24",
    "subject": "Hoá học",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Pha loãng 250 mL dung dịch HCl 1 M để được dung dịch 0,25 M. Thể tích dung dịch sau khi pha loãng là bao nhiêu mililít?",
    "answer": "1000",
    "explanation": "$C_1V_1=C_2V_2\\Rightarrow V_2=\\dfrac{1\\cdot 250}{0{,}25}=1000$ mL.",
    "points": 0.5,
    "tags": [
      "pha loãng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-e-25",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Nung 25 g $\\text{CaCO}_3$, thu được 4,48 lít $\\text{CO}_2$ (đktc). Khối lượng $\\text{CaO}$ thu được là bao nhiêu gam?",
    "answer": "11,2",
    "explanation": "$n_{\\text{CO}_2}=0{,}2$ mol → $n_{\\text{CaO}}=0{,}2$ mol → $m=11{,}2$ g.",
    "points": 0.5,
    "tags": [
      "bài toán N–S",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa-e-26",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Phản ứng $A\\rightleftharpoons B$ có hằng số cân bằng $K=9$ ở một nhiệt độ xác định. Ban đầu chỉ có $[A]=0{,}4$ M. Nồng độ của $B$ tại cân bằng (M) là bao nhiêu?",
    "answer": "0,36",
    "explanation": "$K=\frac{[B]}{[A]}=9$ và $[A]+[B]=0{,}4Rightarrow[B]=0{,}36$ M.",
    "points": 0.5,
    "tags": [
      "cân bằng hóa học",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-a-01",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Nhiệt độ $27^{\\circ}C$ ứng với nhiệt độ tuyệt đối:",
    "options": [
      {
        "key": "A",
        "text": "273 K"
      },
      {
        "key": "B",
        "text": "246 K"
      },
      {
        "key": "C",
        "text": "300 K"
      },
      {
        "key": "D",
        "text": "330 K"
      }
    ],
    "answer": "C",
    "explanation": "$T=27+273=300$ K.",
    "points": 0.25,
    "tags": [
      "nhiệt độ tuyệt đối",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-a-02",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong quá trình đẳng áp của một lượng khí lí tưởng xác định, đại lượng có giá trị không đổi là:",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{V}{T}$"
      },
      {
        "key": "B",
        "text": "$pV$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{p}{T}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{V}{p}$"
      }
    ],
    "answer": "A",
    "explanation": "Đẳng áp: $p$ không đổi, từ $\\frac{pV}{T}=\\text{hằng số}$ suy ra $\\frac{V}{T}$ không đổi (định luật Charles).",
    "points": 0.25,
    "tags": [
      "khí lí tưởng",
      "đẳng áp",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-a-03",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Hằng số khí phổ dụng $R$ có giá trị:",
    "options": [
      {
        "key": "A",
        "text": "$6{,}02\\cdot10^{23}$"
      },
      {
        "key": "B",
        "text": "$8{,}31$"
      },
      {
        "key": "C",
        "text": "$1{,}38\\cdot10^{-23}$"
      },
      {
        "key": "D",
        "text": "$9{,}81$"
      }
    ],
    "answer": "B",
    "explanation": "$R=8{,}31\\,\\text{J/(mol}\\cdot\\text{K)}$; các giá trị còn lại lần lượt là số Avogadro, hằng số Boltzmann và gia tốc trọng trường.",
    "points": 0.25,
    "tags": [
      "hằng số khí",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-a-04",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một lượng khí lí tưởng gồm 2 mol ở nhiệt độ 300 K được đặt trong bình có thể tích 20 lít. Áp suất của khí xấp xỉ bằng:",
    "options": [
      {
        "key": "A",
        "text": "$5{,}0\\cdot10^{5}$ Pa"
      },
      {
        "key": "B",
        "text": "$1{,}25\\cdot10^{5}$ Pa"
      },
      {
        "key": "C",
        "text": "$4{,}99\\cdot10^{5}$ Pa"
      },
      {
        "key": "D",
        "text": "$2{,}5\\cdot10^{5}$ Pa"
      }
    ],
    "answer": "D",
    "explanation": "$p=\\dfrac{nRT}{V}=\\dfrac{2\\cdot 8{,}31\\cdot 300}{0{,}02}=249\\,300$ Pa $\\approx 2{,}5\\cdot10^{5}$ Pa.",
    "points": 0.25,
    "tags": [
      "phương trình trạng thái",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-a-05",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một lượng khí lí tưởng biến đổi đẳng nhiệt như đồ thị bên dưới, từ trạng thái 1 có $p_1=2\\cdot10^{5}$ Pa, $V_1=2$ lít đến trạng thái 2 có $V_2=4$ lít. Áp suất $p_2$ bằng:",
    "options": [
      {
        "key": "A",
        "text": "$1\\cdot10^{5}$ Pa"
      },
      {
        "key": "B",
        "text": "$2\\cdot10^{5}$ Pa"
      },
      {
        "key": "C",
        "text": "$3\\cdot10^{5}$ Pa"
      },
      {
        "key": "D",
        "text": "$8\\cdot10^{5}$ Pa"
      }
    ],
    "answer": "A",
    "explanation": "Đẳng nhiệt: $p_1V_1=p_2V_2Rightarrow p_2=\frac{2cdot10^{5}cdot2}{4}=1cdot10^{5}$ Pa.",
    "points": 0.25,
    "tags": [
      "định luật Boyle",
      "đồ thị",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "gas",
      "axes": "pV",
      "states": "1: (2; 2)\n2: (4; 1)",
      "processes": "1-2: đẳng nhiệt",
      "ticks": "value"
    }
  },
  {
    "id": "thpt-ly-a-06",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một lượng khí giữ ở thể tích không đổi có áp suất $1{,}0\\cdot10^{5}$ Pa ở nhiệt độ 300 K. Nhiệt độ của khí khi áp suất là $1{,}5\\cdot10^{5}$ Pa là:",
    "options": [
      {
        "key": "A",
        "text": "$1{,}2\\cdot10^{5}$ K"
      },
      {
        "key": "B",
        "text": "200 K"
      },
      {
        "key": "C",
        "text": "450 K"
      },
      {
        "key": "D",
        "text": "$4{,}5\\cdot10^{5}$ K"
      }
    ],
    "answer": "C",
    "explanation": "Đẳng tích: $\\frac{p_1}{T_1}=\\frac{p_2}{T_2}\\Rightarrow T_2=\\frac{1{,}5}{1{,}0}\\cdot 300=450$ K.",
    "points": 0.25,
    "tags": [
      "định luật Charles",
      "đẳng tích",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-a-07",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một lượng khí lí tưởng thực hiện chu trình kín 1 → 2 → 3 → 1 như hình bên dưới (1 → 2 là đoạn thẳng) (toạ độ theo hệ SI). Công mà khí thực hiện trong một chu trình bằng:",
    "options": [
      {
        "key": "A",
        "text": "8 J"
      },
      {
        "key": "B",
        "text": "$-8$ J"
      },
      {
        "key": "C",
        "text": "4 J"
      },
      {
        "key": "D",
        "text": "16 J"
      }
    ],
    "answer": "A",
    "explanation": "Chu trình 1→2→3→1 trên đồ thị p–V tạo thành tam giác với độ dài đáy $\\Delta V=4$ m³ và chiều cao $\\Delta p=4$ Pa. Công trong chu trình bằng diện tích tam giác $=\\frac{1}{2}\\cdot 4\\cdot 4=8$ J (dương vì chu trình theo chiều kim đồng hồ).",
    "points": 0.25,
    "tags": [
      "công của khí",
      "chu trình",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "gas",
      "axes": "pV",
      "states": "1: (2; 6)\n2: (6; 2)\n3: (2; 2)",
      "processes": "1-2: đoạn thẳng\n2-3: đẳng áp\n3-1: đẳng tích",
      "ticks": "value"
    }
  },
  {
    "id": "thpt-ly-a-08",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một mol khí lí tưởng ở nhiệt độ 300 K nở ra đẳng nhiệt từ thể tích 10 lít đến 20 lít. Công mà khí thực hiện xấp xỉ bằng:",
    "options": [
      {
        "key": "A",
        "text": "$8{,}31\\cdot10^{2}$ J"
      },
      {
        "key": "B",
        "text": "$1{,}73\\cdot10^{2}$ J"
      },
      {
        "key": "C",
        "text": "$3{,}46\\cdot10^{3}$ J"
      },
      {
        "key": "D",
        "text": "$1{,}73\\cdot10^{3}$ J"
      }
    ],
    "answer": "D",
    "explanation": "$W=nRT\\ln\\dfrac{V_2}{V_1}=1\\cdot 8{,}31\\cdot 300\\cdot\\ln 2\\approx 1728$ J $\\approx 1{,}73\\cdot10^{3}$ J.",
    "points": 0.25,
    "tags": [
      "công đẳng nhiệt",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-a-09",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một hệ nhận từ ngoài 500 J nhiệt và đồng thời thực hiện công 200 J. Theo nguyên lí I nhiệt động lực học, độ biến thiên nội năng của hệ là:",
    "options": [
      {
        "key": "A",
        "text": "700 J"
      },
      {
        "key": "B",
        "text": "$-300$ J"
      },
      {
        "key": "C",
        "text": "200 J"
      },
      {
        "key": "D",
        "text": "300 J"
      }
    ],
    "answer": "D",
    "explanation": "$\\Delta U=Q-A=500-200=300$ J (quy ước $A$ là công hệ thực hiện).",
    "points": 0.25,
    "tags": [
      "nguyên lí I nhiệt động lực học",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-a-10",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Để đun nóng 2 kg nước từ $20^{\\circ}C$ lên $70^{\\circ}C$ (nhiệt dung riêng của nước là $4200$ J/kg$\\cdot$K), lượng nhiệt cần cung cấp là:",
    "options": [
      {
        "key": "A",
        "text": "$2{,}1\\cdot10^{5}$ J"
      },
      {
        "key": "B",
        "text": "$4{,}2\\cdot10^{4}$ J"
      },
      {
        "key": "C",
        "text": "$4{,}2\\cdot10^{5}$ J"
      },
      {
        "key": "D",
        "text": "$8{,}4\\cdot10^{5}$ J"
      }
    ],
    "answer": "C",
    "explanation": "$Q=mc\\Delta t=2\\cdot 4200\\cdot 50=4{,}2\\cdot10^{5}$ J.",
    "points": 0.25,
    "tags": [
      "nhiệt lượng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-a-11",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một lượng khí lí tưởng giữ ở thể tích không đổi. Nếu nhiệt độ tuyệt đối của khí tăng lên 2 lần thì động năng trung bình của mỗi phân tử tăng lên bao nhiêu lần?",
    "options": [
      {
        "key": "A",
        "text": "Tăng 4 lần"
      },
      {
        "key": "B",
        "text": "Tăng 2 lần"
      },
      {
        "key": "C",
        "text": "Tăng 8 lần"
      },
      {
        "key": "D",
        "text": "Không đổi"
      }
    ],
    "answer": "B",
    "explanation": "Động năng trung bình $\\overline{W_đ}=\\frac{3}{2}kT$ tỉ lệ với nhiệt độ tuyệt đối $T$; khi $T$ tăng 2 lần thì $\\overline{W_đ}$ tăng 2 lần (áp suất cũng tăng 2 lần do $V$ không đổi).",
    "points": 0.25,
    "tags": [
      "thuyết động học phân tử",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-a-12",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Áp suất trong lốp xe ô tô là 2,2 bar khi nhiệt độ là $25^{\\circ}C$. Coi thể tích lốp không đổi, khi xe chạy làm nhiệt độ lốp tăng lên $47^{\\circ}C$ thì áp suất trong lốp xấp xỉ:",
    "options": [
      {
        "key": "A",
        "text": "2,20 bar"
      },
      {
        "key": "B",
        "text": "2,50 bar"
      },
      {
        "key": "C",
        "text": "2,36 bar"
      },
      {
        "key": "D",
        "text": "2,74 bar"
      }
    ],
    "answer": "C",
    "explanation": "Đẳng tích: $p_2=p_1\\dfrac{T_2}{T_1}=2{,}2\\cdot\\dfrac{320}{298}\\approx 2{,}36$ bar.",
    "points": 0.25,
    "tags": [
      "đẳng tích",
      "thực tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-a-13",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một động cơ nhiệt lí tưởng hoạt động giữa nguồn nóng ở 500 K và nguồn lạnh ở 300 K. Hiệu suất lớn nhất của động cơ là:",
    "options": [
      {
        "key": "A",
        "text": "20%"
      },
      {
        "key": "B",
        "text": "60%"
      },
      {
        "key": "C",
        "text": "50%"
      },
      {
        "key": "D",
        "text": "40%"
      }
    ],
    "answer": "D",
    "explanation": "$H_{\\max}=1-\\dfrac{T_2}{T_1}=1-\\dfrac{300}{500}=0{,}4=40\\%$ (hiệu suất Carnot).",
    "points": 0.25,
    "tags": [
      "hiệu suất Carnot",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-a-14",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Số phân tử khí trong 1 cm³ không khí ở điều kiện tiêu chuẩn (áp suất $1{,}013\\cdot10^{5}$ Pa, nhiệt độ 273 K, $k=1{,}38\\cdot10^{-23}$ J/K) xấp xỉ bằng:",
    "options": [
      {
        "key": "A",
        "text": "$2{,}69\\cdot10^{25}$"
      },
      {
        "key": "B",
        "text": "$2{,}69\\cdot10^{19}$"
      },
      {
        "key": "C",
        "text": "$6{,}02\\cdot10^{23}$"
      },
      {
        "key": "D",
        "text": "$2{,}69\\cdot10^{16}$"
      }
    ],
    "answer": "B",
    "explanation": "Tập trung phân tử $n=\\dfrac{p}{kT}=\\dfrac{1{,}013\\cdot10^{5}}{1{,}38\\cdot10^{-23}\\cdot 273}\\approx 2{,}69\\cdot10^{25}$ m$^{-3}=2{,}69\\cdot10^{19}$ cm$^{-3}$.",
    "points": 0.25,
    "tags": [
      "thuyết động học",
      "số phân tử",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-a-15",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một động cơ nhiệt trong mỗi chu kì nhận từ nguồn nóng 1000 J và nhả cho nguồn lạnh 600 J. Khẳng định đúng về động cơ này là:",
    "options": [
      {
        "key": "A",
        "text": "Công thực hiện mỗi chu kì là 1600 J"
      },
      {
        "key": "B",
        "text": "Công thực hiện mỗi chu kì là 600 J"
      },
      {
        "key": "C",
        "text": "Công mỗi chu kì là 400 J và hiệu suất 40%"
      },
      {
        "key": "D",
        "text": "Công mỗi chu kì là 400 J và hiệu suất 60%"
      }
    ],
    "answer": "C",
    "explanation": "$W=Q_1-Q_2=1000-600=400$ J; $H=\\dfrac{W}{Q_1}=\\dfrac{400}{1000}=40\\%$.",
    "points": 0.25,
    "tags": [
      "máy nhiệt",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-a-16",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Khối lượng riêng của khí oxi ($M=32$ g/mol) ở điều kiện tiêu chuẩn ($p=1{,}013\\cdot10^{5}$ Pa, $T=273$ K) xấp xỉ:",
    "options": [
      {
        "key": "A",
        "text": "1,43 kg/m³"
      },
      {
        "key": "B",
        "text": "1,25 kg/m³"
      },
      {
        "key": "C",
        "text": "0,71 kg/m³"
      },
      {
        "key": "D",
        "text": "1,98 kg/m³"
      }
    ],
    "answer": "A",
    "explanation": "$\\rho=\\dfrac{pM}{RT}=\\dfrac{1{,}013\\cdot10^{5}\\cdot 0{,}032}{8{,}31\\cdot 273}\\approx 1{,}43$ kg/m³.",
    "points": 0.25,
    "tags": [
      "phương trình trạng thái",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-a-17",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Quan sát đồ thị biến đổi trạng thái của một lượng khí lí tưởng như hình bên dưới (đường biến đổi đi qua gốc toạ độ). Quá trình $1\\to 2$ là quá trình:",
    "options": [
      {
        "key": "A",
        "text": "đẳng áp"
      },
      {
        "key": "B",
        "text": "đẳng tích"
      },
      {
        "key": "C",
        "text": "đẳng nhiệt"
      },
      {
        "key": "D",
        "text": "nén từ từ"
      }
    ],
    "answer": "B",
    "explanation": "Trên đồ thị p–T, đường thẳng đi qua gốc toạ độ nghĩa là $\\dfrac{p}{T}$ không đổi, tương ứng thể tích không đổi: quá trình đẳng tích.",
    "points": 0.25,
    "tags": [
      "đọc đồ thị",
      "p–T",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "gas",
      "axes": "pT",
      "states": "1: (300; 2)\n2: (600; 4)",
      "processes": "1-2: đẳng tích",
      "ticks": "value"
    }
  },
  {
    "id": "thpt-ly-a-18",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Khi nhiệt độ của một lượng khí trong bình kín (thể tích không đổi) tăng lên, áp suất khí tăng vì:",
    "options": [
      {
        "key": "A",
        "text": "tốc độ trung bình của phân tử giảm"
      },
      {
        "key": "B",
        "text": "số phân tử của khí tăng"
      },
      {
        "key": "C",
        "text": "thể tích của bình tăng"
      },
      {
        "key": "D",
        "text": "tốc độ trung bình của phân tử tăng khiến các va chạm vào thành bình mạnh và thường xuyên hơn"
      }
    ],
    "answer": "D",
    "explanation": "Số phân tử và thể tích không đổi; khi nhiệt độ tăng, động năng trung bình và tốc độ trung bình phân tử tăng nên áp suất tăng.",
    "points": 0.25,
    "tags": [
      "thuyết động học phân tử",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-a-19",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một lượng khí lí tưởng biến đổi từ trạng thái 1 ($p_1=2\\cdot10^{5}$ Pa, $V_1=3$ lít) đến trạng thái 2 ($p_2=4\\cdot10^{5}$ Pa, $V_2=6$ lít) như đồ thị bên dưới. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Đây là quá trình đẳng tích."
      },
      {
        "key": "b",
        "text": "Nhiệt độ ở trạng thái 2 cao hơn ở trạng thái 1."
      },
      {
        "key": "c",
        "text": "Trong quá trình trên, khí thực hiện công dương."
      },
      {
        "key": "d",
        "text": "Nhiệt độ của khí ở trạng thái 2 gấp 4 lần ở trạng thái 1."
      }
    ],
    "answer": "SĐĐĐ",
    "explanation": "a) Sai: thể tích thay đổi từ 3 lít lên 6 lít. b) Đúng: $T\\sim pV$ tăng từ 6 lên 24 (đơn vị). c) Đúng: khí nở ra nên $W>0$. d) Đúng: $\\dfrac{T_2}{T_1}=\\dfrac{p_2V_2}{p_1V_1}=\\dfrac{24}{6}=4$.",
    "points": 1,
    "tags": [
      "đọc đồ thị",
      "phương trình trạng thái",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "gas",
      "axes": "pV",
      "states": "1: (3; 2)\n2: (6; 4)",
      "processes": "1-2: đoạn thẳng",
      "ticks": "value"
    }
  },
  {
    "id": "thpt-ly-a-20",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một bình kín chứa khí lí tưởng có áp suất ban đầu $p_1=1{,}0\\cdot10^{5}$ Pa ở nhiệt độ $T_1=300$ K. Người ta đun nóng khí đẳng tích như đồ thị bên dưới lên $T_2=450$ K. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Áp suất cuối của khí là $1{,}5\\cdot10^{5}$ Pa."
      },
      {
        "key": "b",
        "text": "Động năng trung bình của phân tử khí không đổi."
      },
      {
        "key": "c",
        "text": "Thể tích cuối của khí là $1{,}5$ lần thể tích đầu."
      },
      {
        "key": "d",
        "text": "Nếu sau đó khí bị nén đẳng nhiệt về thể tích bằng một nửa thì áp suất tăng gấp đôi."
      }
    ],
    "answer": "ĐSSĐ",
    "explanation": "a) Đúng: $p_2=p_1\\frac{T_2}{T_1}=1{,}5\\cdot10^{5}$ Pa. b) Sai: $\\overline{W_đ}=\\frac{3}{2}kT$ tăng khi $T$ tăng. c) Sai: đẳng tích nên thể tích không đổi. d) Đúng: đẳng nhiệt $pV=$ hằng số, khi $V$ giảm một nửa thì $p$ tăng gấp đôi.",
    "points": 1,
    "tags": [
      "đẳng tích",
      "đẳng nhiệt",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "gas",
      "axes": "pV",
      "states": "1: (5; 1)\n2: (5; 1,5)",
      "processes": "1-2: đẳng tích",
      "ticks": "value"
    }
  },
  {
    "id": "thpt-ly-a-21",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một động cơ nhiệt hoạt động giữa nguồn nóng ở 600 K và nguồn lạnh ở 300 K; trong mỗi chu kì động cơ nhận 800 J nhiệt từ nguồn nóng. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Hiệu suất lí tưởng của động cơ là 40%."
      },
      {
        "key": "b",
        "text": "Ở chế độ lí tưởng, công máy thực hiện mỗi chu kì là 400 J."
      },
      {
        "key": "c",
        "text": "Vì hiệu suất lí tưởng là 50% nên động cơ thực tế có thể đạt 55%."
      },
      {
        "key": "d",
        "text": "Ở chế độ lí tưởng, mỗi chu kì máy nhả cho nguồn lạnh 400 J nhiệt."
      }
    ],
    "answer": "SĐSĐ",
    "explanation": "a) Sai: $H_{\\max}=1-\\frac{300}{600}=50\\%$. b) Đúng: $W=800\\cdot 0{,}5=400$ J. c) Sai: hiệu suất thực tế luôn nhỏ hơn hiệu suất lí tưởng. d) Đúng: $Q_2=800-400=400$ J.",
    "points": 1,
    "tags": [
      "hiệu suất",
      "máy nhiệt",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-a-22",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một bình 20 lít chứa 1 mol khí đơn nguyên tử lí tưởng ở nhiệt độ 300 K ($U=\\frac{3}{2}nRT$, $R=8{,}31$ J/mol$\\cdot$K). Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Nội năng của khí xấp xỉ 3,74 kJ."
      },
      {
        "key": "b",
        "text": "Đun nóng đẳng tích khí lên 600 K, độ biến thiên nội năng bằng 2,49 kJ."
      },
      {
        "key": "c",
        "text": "Trong quá trình đẳng tích trên, khí nhận nhiệt đúng bằng độ biến thiên nội năng."
      },
      {
        "key": "d",
        "text": "Nếu thay bằng khí lưỡng nguyên tử (cùng số mol, cùng quá trình đun đẳng tích 300 K lên 600 K) thì độ biến thiên nội năng nhỏ hơn."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng: $U=\\frac{3}{2}\\cdot 1\\cdot 8{,}31\\cdot 300\\approx 3740$ J. b) Sai: $\\Delta U=\\frac{3}{2}R\\Delta T=\\frac{3}{2}\\cdot 8{,}31\\cdot 300\\approx 3{,}74$ kJ. c) Đúng: đẳng tích $W=0$ nên $Q=\\Delta U$. d) Sai: khí lưỡng nguyên tử $\\Delta U=\\frac{5}{2}R\\Delta T$ lớn hơn.",
    "points": 1,
    "tags": [
      "nội năng",
      "nguyên lí I",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-a-23",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Nhiệt độ tuyệt đối ứng với $27^{\\circ}C$ là bao nhiêu kelvin?",
    "answer": "300",
    "explanation": "$T=27+273=300$ K.",
    "points": 0.5,
    "tags": [
      "nhiệt độ",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-a-24",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một lượng khí đẳng nhiệt có $p_1=1{,}0\\cdot10^{5}$ Pa, $V_1=4$ lít. Khi thể tích tăng lên 8 lít thì áp suất là $p_2=a\\cdot10^{4}$ Pa. Giá trị của $a$ là bao nhiêu?",
    "answer": "5",
    "explanation": "$p_1V_1=p_2V_2\\Rightarrow p_2=\\frac{1{,}0\\cdot10^{5}\\cdot 4}{8}=5\\cdot10^{4}$ Pa nên $a=5$.",
    "points": 0.5,
    "tags": [
      "định luật Boyle",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-a-25",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một mol khí lí tưởng ở 300 K đặt trong bình 10 lít. Áp suất của khí xấp xỉ bằng $x\\cdot10^{5}$ Pa. Giá trị của $x$ (làm tròn đến hàng phần mười) là bao nhiêu?",
    "answer": "2,5",
    "explanation": "$p=\\dfrac{nRT}{V}=\\dfrac{1\\cdot 8{,}31\\cdot 300}{0{,}01}=249\\,300\\approx 2{,}5\\cdot10^{5}$ Pa.",
    "points": 0.5,
    "tags": [
      "phương trình trạng thái",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-a-26",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Để đun nóng 0,5 kg nhôm từ $20^{\\circ}C$ lên $80^{\\circ}C$ (nhiệt dung riêng $c=900$ J/kg$\\cdot$K) cần lượng nhiệt bằng bao nhiêu kilôjun (kJ)?",
    "answer": "27",
    "explanation": "$Q=mc\\Delta t=0{,}5\\cdot 900\\cdot 60=27000$ J $=27$ kJ.",
    "points": 0.5,
    "tags": [
      "nhiệt lượng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-a-27",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một lượng khí nở ra đẳng áp với áp suất $2{,}5\\cdot10^{5}$ Pa, thể tích tăng từ 4 lít lên 6 lít. Công mà khí thực hiện bằng bao nhiêu jun (J)?",
    "answer": "500",
    "explanation": "$W=p\\Delta V=2{,}5\\cdot10^{5}\\cdot 2\\cdot10^{-3}=500$ J.",
    "points": 0.5,
    "tags": [
      "công của khí",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-a-28",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Động năng trung bình của phân tử khí ở nhiệt độ 300 K (với $k=1{,}38\\cdot10^{-23}$ J/K) bằng $a{,}bb\\cdot10^{-21}$ J (làm tròn đến hai chữ số thập phân). Giá trị của $a{,}bb$ là bao nhiêu?",
    "answer": "6,21",
    "explanation": "$\\overline{W_đ}=\\frac{3}{2}kT=\\frac{3}{2}\\cdot 1{,}38\\cdot10^{-23}\\cdot 300=6{,}21\\cdot10^{-21}$ J.",
    "points": 0.5,
    "tags": [
      "thuyết động học",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-a-29",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một lượng khí lí tưởng thực hiện chu trình như hình bên dưới: trạng thái 1 $(2;\\,4)$, 2 $(6;\\,4)$, 3 $(6;\\,1)$ (toạ độ theo hệ SI). Công toàn phần mà khí thực hiện trong một chu trình bằng bao nhiêu jun (J)?",
    "answer": "6",
    "explanation": "Công toàn phần bằng diện tích tam giác 1–2–3 trên đồ thị p–V: $W=\frac{1}{2}cdot(6-2)cdot(4-1)=6$ J; chu trình đi theo chiều kim đồng hồ nên khí sinh công dương.",
    "points": 0.5,
    "tags": [
      "chu trình",
      "công của khí",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "gas",
      "axes": "pV",
      "states": "1: (2; 4)\n2: (6; 4)\n3: (6; 1)",
      "processes": "1-2: đẳng áp\n2-3: đẳng tích\n3-1: đoạn thẳng",
      "ticks": "value"
    }
  },
  {
    "id": "thpt-ly-a-30",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một động cơ nhiệt lí tưởng hoạt động giữa nguồn nóng ở $227^{\\circ}C$ và nguồn lạnh ở $27^{\\circ}C$. Hiệu suất lớn nhất của động cơ (tính theo phần trăm) là bao nhiêu?",
    "answer": "40",
    "explanation": "$H_{\\max}=1-\\dfrac{300}{500}=0{,}4=40\\%$.",
    "points": 0.5,
    "tags": [
      "hiệu suất Carnot",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-b-01",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một đoạn dây dẫn dài 20 cm mang dòng điện 5 A, đặt vuông góc với từ trường đều có cảm ứng từ 0,4 T. Độ lớn lực từ tác dụng lên đoạn dây là:",
    "options": [
      {
        "key": "A",
        "text": "0,4 N"
      },
      {
        "key": "B",
        "text": "0,04 N"
      },
      {
        "key": "C",
        "text": "4 N"
      },
      {
        "key": "D",
        "text": "0,004 N"
      }
    ],
    "answer": "B",
    "explanation": "$F=BIl=0{,}4\\cdot 5\\cdot 0{,}2=0{,}04$ N.",
    "points": 0.25,
    "tags": [
      "lực từ",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-b-02",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Lực từ tác dụng lên một đoạn dây dẫn mang dòng điện đặt trong từ trường đều luôn:",
    "options": [
      {
        "key": "A",
        "text": "cùng phương với vectơ cảm ứng từ $\\vec{B}$"
      },
      {
        "key": "B",
        "text": "cùng phương với dòng điện"
      },
      {
        "key": "C",
        "text": "vuông góc với cả vectơ $\\vec{B}$ và dòng điện"
      },
      {
        "key": "D",
        "text": "ngược hướng vectơ $\\vec{B}$"
      }
    ],
    "answer": "C",
    "explanation": "Lực từ $\\vec{F}=I\\vec{l}\\times\\vec{B}$ luôn vuông góc với mặt phẳng chứa $\\vec{l}$ và $\\vec{B}$.",
    "points": 0.25,
    "tags": [
      "lực từ",
      "hướng",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-b-03",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Từ thông qua một khung dây phẳng có diện tích $S$, đặt trong từ trường đều $\\vec{B}$, pháp tuyến khung hợp với $\\vec{B}$ góc $\\alpha$, được tính theo công thức:",
    "options": [
      {
        "key": "A",
        "text": "$\\Phi=BS\\cos\\alpha$"
      },
      {
        "key": "B",
        "text": "$\\Phi=BS\\sin\\alpha$"
      },
      {
        "key": "C",
        "text": "$\\Phi=\\dfrac{B}{S}$"
      },
      {
        "key": "D",
        "text": "$\\Phi=BS\\tan\\alpha$"
      }
    ],
    "answer": "A",
    "explanation": "Từ thông qua diện tích $S$ là $\\Phi=\\vec{B}\\cdot\\vec{S}=BS\\cos\\alpha$.",
    "points": 0.25,
    "tags": [
      "từ thông",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-b-04",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một khung dây phẳng diện tích 0,05 m² đặt trong từ trường đều 0,2 T, pháp tuyến của khung hợp với đường sức từ góc $30^{\\circ}$. Từ thông qua khung bằng:",
    "options": [
      {
        "key": "A",
        "text": "5 mWb"
      },
      {
        "key": "B",
        "text": "10 mWb"
      },
      {
        "key": "C",
        "text": "8,66 Wb"
      },
      {
        "key": "D",
        "text": "8,66 mWb"
      }
    ],
    "answer": "D",
    "explanation": "$\\Phi=BS\\cos\\alpha=0{,}2\\cdot 0{,}05\\cdot\\cos 30^{\\circ}=8{,}66\\cdot10^{-3}$ Wb $=8{,}66$ mWb.",
    "points": 0.25,
    "tags": [
      "từ thông",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-b-05",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một cuộn dây gồm 100 vòng, từ thông qua mỗi vòng thay đổi 0,02 Wb trong khoảng thời gian 0,1 s. Suất điện động cảm ứng trong cuộn dây là:",
    "options": [
      {
        "key": "A",
        "text": "2 V"
      },
      {
        "key": "B",
        "text": "20 V"
      },
      {
        "key": "C",
        "text": "200 V"
      },
      {
        "key": "D",
        "text": "0,2 V"
      }
    ],
    "answer": "B",
    "explanation": "$E=N\\dfrac{\\Delta\\Phi}{\\Delta t}=100\\cdot\\dfrac{0{,}02}{0{,}1}=20$ V.",
    "points": 0.25,
    "tags": [
      "suất phản động cảm ứng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-b-06",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một hạt mang điện tích $q=1{,}6\\cdot10^{-19}$ C, khối lượng $m=9{,}1\\cdot10^{-31}$ kg, chuyển động với vận tốc $2\\cdot10^{6}$ m/s vuông góc với từ trường đều $B=0{,}5$ mT. Bán kính quỹ đạo của hạt xấp xỉ:",
    "options": [
      {
        "key": "A",
        "text": "0,23 cm"
      },
      {
        "key": "B",
        "text": "23 cm"
      },
      {
        "key": "C",
        "text": "2,3 cm"
      },
      {
        "key": "D",
        "text": "11,4 cm"
      }
    ],
    "answer": "C",
    "explanation": "$r=\\dfrac{mv}{qB}=\\dfrac{9{,}1\\cdot10^{-31}\\cdot 2\\cdot10^{6}}{1{,}6\\cdot10^{-19}\\cdot 0{,}5\\cdot10^{-3}}\\approx 0{,}0228$ m $\\approx 2{,}3$ cm.",
    "points": 0.25,
    "tags": [
      "chuyển động của hạt tải điện",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-b-07",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Điện áp giữa hai cực của một máy phát điện xoay chiều một pha là $u=220\\sqrt{2}\\cos(100\\pi t)$ V (t tính bằng s). Tần số và giá trị hiệu dụng của điện áp là:",
    "options": [
      {
        "key": "A",
        "text": "50 Hz và 220 V"
      },
      {
        "key": "B",
        "text": "100 Hz và 311 V"
      },
      {
        "key": "C",
        "text": "50 Hz và 311 V"
      },
      {
        "key": "D",
        "text": "60 Hz và 220 V"
      }
    ],
    "answer": "A",
    "explanation": "$f=\\dfrac{\\omega}{2\\pi}=\\dfrac{100\\pi}{2\\pi}=50$ Hz; $U=\\dfrac{U_0}{\\sqrt{2}}=220$ V.",
    "points": 0.25,
    "tags": [
      "dòng điện xoay chiều",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-b-08",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một cuộn dây gồm 200 vòng, từ thông qua mỗi vòng tăng đều từ 0,004 Wb đến 0,012 Wb trong 0,05 s. Suất điện động cảm ứng trong cuộn dây là:",
    "options": [
      {
        "key": "A",
        "text": "16 V"
      },
      {
        "key": "B",
        "text": "3,2 V"
      },
      {
        "key": "C",
        "text": "64 V"
      },
      {
        "key": "D",
        "text": "32 V"
      }
    ],
    "answer": "D",
    "explanation": "$E=N\\dfrac{\\Delta\\Phi}{\\Delta t}=200\\cdot\\dfrac{0{,}008}{0{,}05}=32$ V.",
    "points": 0.25,
    "tags": [
      "suất phản động cảm ứng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-b-09",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một đoạn mạch RLC không phân nhánh có $R=30\\,\\Omega$, cuộn thuần cảm kháng $Z_L=40\\,\\Omega$, tụ có dung kháng $Z_C=10\\,\\Omega$, đặt dưới điện áp hiệu dụng 120 V. Cường độ hiệu dụng của dòng điện xấp xỉ:",
    "options": [
      {
        "key": "A",
        "text": "2,83 A"
      },
      {
        "key": "B",
        "text": "2,4 A"
      },
      {
        "key": "C",
        "text": "4 A"
      },
      {
        "key": "D",
        "text": "1,41 A"
      }
    ],
    "answer": "A",
    "explanation": "$Z=\\sqrt{R^2+(Z_L-Z_C)^2}=\\sqrt{900+900}=42{,}4\\,\\Omega$; $I=\\dfrac{U}{Z}=\\dfrac{120}{42{,}4}\\approx 2{,}83$ A.",
    "points": 0.25,
    "tags": [
      "mạch RLC",
      "tổng trở",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-b-10",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một mạch cộng hưởng gồm cuộn thuần $L=0{,}1$ H và tụ điện $C=10\\,\\mu\\text{F}$. Tần số cộng hưởng của mạch xấp xỉ:",
    "options": [
      {
        "key": "A",
        "text": "15,9 Hz"
      },
      {
        "key": "B",
        "text": "1000 Hz"
      },
      {
        "key": "C",
        "text": "159 Hz"
      },
      {
        "key": "D",
        "text": "318 Hz"
      }
    ],
    "answer": "C",
    "explanation": "$f_0=\\dfrac{1}{2\\pi\\sqrt{LC}}=\\dfrac{1}{2\\pi\\sqrt{0{,}1\\cdot 10^{-5}}}\\approx 159{,}2$ Hz.",
    "points": 0.25,
    "tags": [
      "cộng hưởng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-b-11",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một máy tiêu thụ điện chạy dưới điện áp hiệu dụng 220 V, dòng điện hiệu dụng 2 A, hệ số công suất 0,8. Công suất tiêu thụ của máy là:",
    "options": [
      {
        "key": "A",
        "text": "440 W"
      },
      {
        "key": "B",
        "text": "352 W"
      },
      {
        "key": "C",
        "text": "176 W"
      },
      {
        "key": "D",
        "text": "264 W"
      }
    ],
    "answer": "B",
    "explanation": "$P=UI\\cos\\varphi=220\\cdot 2\\cdot 0{,}8=352$ W.",
    "points": 0.25,
    "tags": [
      "công suất",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-b-12",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một thanh dẫn kim loại dài 0,4 m chuyển động với tốc độ 5 m/s theo phương vuông góc với chính thanh và vuông góc với từ trường đều $B=0{,}5$ T. Suất điện động cảm ứng trong thanh là:",
    "options": [
      {
        "key": "A",
        "text": "10 V"
      },
      {
        "key": "B",
        "text": "0,1 V"
      },
      {
        "key": "C",
        "text": "0,5 V"
      },
      {
        "key": "D",
        "text": "1 V"
      }
    ],
    "answer": "D",
    "explanation": "$E=Blv=0{,}5\\cdot 0{,}4\\cdot 5=1$ V.",
    "points": 0.25,
    "tags": [
      "cảm ứng điện từ",
      "thanh dẫn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-b-13",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một máy biến áp lí tưởng có cuộn sơ cấp 2200 vòng đặt dưới điện áp 220 V. Muốn cuộn thứ cấp nhận 12 V thì số vòng cuộn thứ cấp là:",
    "options": [
      {
        "key": "A",
        "text": "120 vòng"
      },
      {
        "key": "B",
        "text": "2200 vòng"
      },
      {
        "key": "C",
        "text": "20 vòng"
      },
      {
        "key": "D",
        "text": "404 vòng"
      }
    ],
    "answer": "A",
    "explanation": "$\\dfrac{N_1}{N_2}=\\dfrac{U_1}{U_2}\\Rightarrow N_2=2200\\cdot\\dfrac{12}{220}=120$ vòng.",
    "points": 0.25,
    "tags": [
      "máy biến áp",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-b-14",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Mạch điện như hình bên dưới: nguồn có suất điện động $E=12$ V, điện trở trong $r=1\\,\\Omega$, điện trở $R_1=2\\,\\Omega$ nối tiếp với đoạn mạch gồm $R_2=3\\,\\Omega$ song song $R_3=6\\,\\Omega$. Cường độ dòng điện qua nguồn là:",
    "options": [
      {
        "key": "A",
        "text": "1,2 A"
      },
      {
        "key": "B",
        "text": "2,4 A"
      },
      {
        "key": "C",
        "text": "4,8 A"
      },
      {
        "key": "D",
        "text": "3 A"
      }
    ],
    "answer": "B",
    "explanation": "$R_{23}=\\dfrac{3\\cdot 6}{3+6}=2\\,\\Omega$; $R=2+2+1=5\\,\\Omega$; $I=\\dfrac{E}{R}=\\dfrac{12}{5}=2{,}4$ A.",
    "points": 0.25,
    "tags": [
      "mạch điện",
      "định luật Ôm",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "circuit",
      "text": "nguồn E = 12 V, r = 1 Ω\nR1=2Ω - (R2=3Ω // R3=6Ω)"
    }
  },
  {
    "id": "thpt-ly-b-15",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một đoạn mạch gồm điện trở $R=20\\,\\Omega$, cuộn thuần và tụ điện nối tiếp đang ở trạng thái cộng hưởng với nguồn điện áp hiệu dụng 100 V. Công suất tiêu thụ của mạch là:",
    "options": [
      {
        "key": "A",
        "text": "200 W"
      },
      {
        "key": "B",
        "text": "250 W"
      },
      {
        "key": "C",
        "text": "500 W"
      },
      {
        "key": "D",
        "text": "1000 W"
      }
    ],
    "answer": "C",
    "explanation": "Khi cộng hưởng $Z=R$, $P=\\dfrac{U^2}{R}=\\dfrac{100^2}{20}=500$ W.",
    "points": 0.25,
    "tags": [
      "cộng hưởng",
      "công suất",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-b-16",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một cơ sở tiêu thụ điện với công suất $P=800$ W, công suất biểu kiến $S=1000$ VA ở điện áp 220 V. Khi lắp tụ bù để hệ số công suất bằng 1 (công suất tiêu thụ không đổi), dòng điện hiệu dụng trong đường dây trở thành:",
    "options": [
      {
        "key": "A",
        "text": "4,55 A"
      },
      {
        "key": "B",
        "text": "1,25 A"
      },
      {
        "key": "C",
        "text": "5,45 A"
      },
      {
        "key": "D",
        "text": "3,64 A"
      }
    ],
    "answer": "D",
    "explanation": "Ban đầu $I=\\dfrac{S}{U}=\\dfrac{1000}{220}=4{,}55$ A; sau khi bù, $I=\\dfrac{P}{U}=\\dfrac{800}{220}=3{,}64$ A.",
    "points": 0.25,
    "tags": [
      "hệ số công suất",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-b-17",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một thanh dẫn dài 0,5 m quay đều quanh một đầu trong mặt phẳng vuông góc với từ trường đều $B=0{,}4$ T, với tốc độ góc 100 rad/s. Suất điện động cảm ứng giữa hai đầu thanh là:",
    "options": [
      {
        "key": "A",
        "text": "2,5 V"
      },
      {
        "key": "B",
        "text": "5 V"
      },
      {
        "key": "C",
        "text": "10 V"
      },
      {
        "key": "D",
        "text": "20 V"
      }
    ],
    "answer": "B",
    "explanation": "$E=\\dfrac{1}{2}B\\omega l^2=\\dfrac{1}{2}\\cdot 0{,}4\\cdot 100\\cdot 0{,}25=5$ V.",
    "points": 0.25,
    "tags": [
      "thanh quay",
      "cảm ứng điện từ",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-b-18",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Khi truyền tải một công suất điện xác định trên cùng một đường dây, nếu tăng điện áp truyền đi lên 2 lần thì tổn hao công suất trên đường dây:",
    "options": [
      {
        "key": "A",
        "text": "giảm 2 lần"
      },
      {
        "key": "B",
        "text": "tăng 4 lần"
      },
      {
        "key": "C",
        "text": "giảm 4 lần"
      },
      {
        "key": "D",
        "text": "không đổi"
      }
    ],
    "answer": "C",
    "explanation": "$I=\\dfrac{P}{U}$ giảm 2 lần; tổn hao $P_{hao}=I^2R$ giảm 4 lần.",
    "points": 0.25,
    "tags": [
      "truyền tải điện",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-b-19",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một khung dây phẳng quay đều quanh trục nằm trong mặt phẳng khung, vuông góc với từ trường đều, với tốc độ quay $\\omega$ không đổi. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Suất điện động cảm ứng trong khung biến thiên điều hòa theo thời gian."
      },
      {
        "key": "b",
        "text": "Khi mặt khung vuông góc với $\\vec{B}$, suất điện động cảm ứng đạt cực đại."
      },
      {
        "key": "c",
        "text": "Tần số của suất điện động cảm ứng bằng tần số quay của khung."
      },
      {
        "key": "d",
        "text": "Nếu tốc độ quay tăng gấp đôi thì giá trị cực đại của suất điện động cảm ứng tăng gấp đôi."
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) Đúng: $e=E_0\\sin\\omega t$. b) Sai: khi mặt khung vuông góc $\\vec{B}$ thì từ thông cực đại nhưng biến thiên bằng 0, nên $e=0$; $e$ cực đại khi mặt khung song song $\\vec{B}$. c) Đúng. d) Đúng: $E_0=N\\Phi_0\\omega$ tỉ lệ với $\\omega$.",
    "points": 1,
    "tags": [
      "máy phát điện xoay chiều",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-b-20",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một đoạn mạch RLC không phân nhánh gồm $R=40\\,\\Omega$, cuộn thuần có cảm kháng $30\\,\\Omega$ và tụ có dung kháng $80\\,\\Omega$, đặt dưới điện áp $u=200\\cos(100\\pi t)$ V như sơ đồ bên dưới. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Đoạn mạch có tính cảm kháng."
      },
      {
        "key": "b",
        "text": "Tổng trở của mạch xấp xỉ 64 $\\Omega$."
      },
      {
        "key": "c",
        "text": "Dòng điện trong mạch sớm pha hơn điện áp $u$."
      },
      {
        "key": "d",
        "text": "Công suất tiêu thụ của mạch xấp xỉ 195 W."
      }
    ],
    "answer": "SĐĐĐ",
    "explanation": "a) Sai: $Z_L<Z_C$ nên mạch có tính dung kháng. b) Đúng: $Z=\\sqrt{40^2+50^2}\\approx 64\\,\\Omega$. c) Đúng: mạch có tính dung kháng nên $i$ sớm pha hơn $u$. d) Đúng: $I=\\frac{200/\\sqrt{2}}{64}\\approx 2{,}21$ A, $P=I^2R\\approx 195$ W.",
    "points": 1,
    "tags": [
      "mạch RLC",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "circuit",
      "text": "nguồn u = 200cos(100πt) V\nR=40Ω - L - C"
    }
  },
  {
    "id": "thpt-ly-b-21",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Mạch điện như hình bên dưới: nguồn có suất điện động $E=9$ V, điện trở trong $r=0{,}5\\,\\Omega$, điện trở $R_1=4\\,\\Omega$ nối tiếp với đoạn mạch gồm $R_2=12\\,\\Omega$ song song $R_3=4\\,\\Omega$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Điện trở tương đương của phần mạch ngoài là 7 $\\Omega$."
      },
      {
        "key": "b",
        "text": "Cường độ dòng điện qua nguồn là 1,2 A."
      },
      {
        "key": "c",
        "text": "Cường độ dòng điện qua $R_3$ là 0,9 A."
      },
      {
        "key": "d",
        "text": "Công suất tiêu thụ trên $R_1$ là 5,76 W."
      }
    ],
    "answer": "ĐĐĐĐ",
    "explanation": "a) Đúng: $R_{23}=\frac{12cdot4}{16}=3,Omega$, mạch ngoài $4+3=7,Omega$. b) Đúng: $I=\frac{9}{7+0{,}5}=1{,}2$ A. c) Đúng: $U_{23}=1{,}2cdot3=3{,}6$ V, $I_3=0{,}9$ A. d) Đúng: $P_1=1{,}2^2cdot4=5{,}76$ W.",
    "points": 1,
    "tags": [
      "mạch điện",
      "định luật Ôm",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "circuit",
      "text": "nguồn E = 9 V, r = 0.5 Ω\nR1=4Ω - (R2=12Ω // R3=4Ω)"
    }
  },
  {
    "id": "thpt-ly-b-22",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một trạm phát điện có công suất 100 kW, truyền tải điện lên một khu dân cư qua đường dây có điện trở $10\\,\\Omega$. Điện áp truyền đi là 10 kV, coi hệ số công suất bằng 1. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Dòng điện trong đường dây là 10 A."
      },
      {
        "key": "b",
        "text": "Tổn hao công suất trên đường dây là 1 kW, hiệu suất truyền tải đạt 99%."
      },
      {
        "key": "c",
        "text": "Nếu truyền cùng công suất ở điện áp 100 kV thì tổn hao công suất trên đường dây chỉ còn 10 W."
      },
      {
        "key": "d",
        "text": "Hiệu suất truyền tải ở 10 kV là 90%."
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) Đúng: $I=\\frac{100000}{10000}=10$ A. b) Đúng: $P_{hao}=10^2\\cdot 10=1000$ W $=1$ kW; hiệu suất $=\\frac{100-1}{100}=99\\%$. c) Đúng: $I=1$ A, $P_{hao}=1^2\\cdot 10=10$ W. d) Sai: hiệu suất là 99%, không phải 90%.",
    "points": 1,
    "tags": [
      "truyền tải điện",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-b-23",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một đoạn dây dẫn dài 0,5 m mang dòng điện 4 A đặt vuông góc với từ trường đều $B=0{,}2$ T. Độ lớn lực từ tác dụng lên đoạn dây (tính theo niutơn, N) là bao nhiêu?",
    "answer": "0,4",
    "explanation": "$F=BIl=0{,}2\\cdot 4\\cdot 0{,}5=0{,}4$ N.",
    "points": 0.5,
    "tags": [
      "lực từ",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-b-24",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Điện áp xoay chiều có biểu thức $u=311\\cos(100\\pi t)$ V. Giá trị hiệu dụng của điện áp xấp xỉ bao nhiêu vôn (V)?",
    "answer": "220",
    "explanation": "$U=\\dfrac{311}{\\sqrt{2}}\\approx 220$ V.",
    "points": 0.5,
    "tags": [
      "giá trị hiệu dụng",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-b-25",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một khung dây phẳng diện tích 0,02 m² đặt vuông góc với từ trường đều $B=0{,}5$ T. Từ thông qua khung bằng bao nhiêu milivet (mWb)?",
    "answer": "10",
    "explanation": "$\\Phi=BS=0{,}5\\cdot 0{,}02=0{,}01$ Wb $=10$ mWb.",
    "points": 0.5,
    "tags": [
      "từ thông",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-b-26",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Mạch điện như hình bên dưới: nguồn $E=9$ V, điện trở trong không đáng kể, hai điện trở $R_1=10\\,\\Omega$ và $R_2=10\\,\\Omega$ song song với nhau. Cường độ dòng điện qua nguồn (tính theo ampe, A) là bao nhiêu?",
    "answer": "1,8",
    "explanation": "$R_{12}=\\dfrac{10\\cdot 10}{20}=5\\,\\Omega$; $I=\\dfrac{9}{5}=1{,}8$ A.",
    "points": 0.5,
    "tags": [
      "mạch điện",
      "định luật Ôm",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "circuit",
      "text": "nguồn E = 9 V\nR1=10Ω // R2=10Ω"
    }
  },
  {
    "id": "thpt-ly-b-27",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một mạch cộng hưởng gồm cuộn thuần $L=1$ H và tụ điện $C$ thay đổi được. Muốn mạch cộng hưởng ở tần số 50 Hz thì điện dung $C$ (làm tròn đến hàng phần mười, tính bằng microfarat, µF) phải là bao nhiêu?",
    "answer": "10,1",
    "explanation": "$C=\\dfrac{1}{4\\pi^2 f_0^2 L}=\\dfrac{1}{4\\pi^2\\cdot 2500}\\approx 1{,}013\\cdot10^{-5}$ F $\\approx 10{,}1\\,\\mu$F.",
    "points": 0.5,
    "tags": [
      "cộng hưởng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-b-28",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một máy tiêu thụ điện có hệ số công suất 0,9, chạy dưới điện áp 220 V với dòng điện hiệu dụng 5 A. Công suất tiêu thụ của máy (tính bằng oát, W) là bao nhiêu?",
    "answer": "990",
    "explanation": "$P=UI\\cos\\varphi=220\\cdot 5\\cdot 0{,}9=990$ W.",
    "points": 0.5,
    "tags": [
      "công suất",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-b-29",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một thanh dẫn dài 0,8 m quay đều quanh một đầu với tốc độ góc 40 rad/s trong từ trường đều $B=0{,}25$ T vuông góc với mặt phẳng quay. Suất điện động cảm ứng giữa hai đầu thanh (V) là bao nhiêu?",
    "answer": "3,2",
    "explanation": "$E=\\dfrac{1}{2}B\\omega l^2=\\dfrac{1}{2}\\cdot 0{,}25\\cdot 40\\cdot 0{,}64=3{,}2$ V.",
    "points": 0.5,
    "tags": [
      "thanh quay",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-b-30",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một máy biến áp thực tế giảm thế từ 220 V xuống 22 V với hiệu suất 90%. Nếu tải ở thứ cấp tiêu thụ 180 W thì dòng điện sơ cấp (làm tròn đến hai chữ số thập phân, A) là bao nhiêu?",
    "answer": "0,91",
    "explanation": "$P_1=\\dfrac{180}{0{,}9}=200$ W; $I_1=\\dfrac{200}{220}\\approx 0{,}91$ A.",
    "points": 0.5,
    "tags": [
      "máy biến áp",
      "hiệu suất",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-01",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Hạt $\\alpha$ chính là:",
    "options": [
      {
        "key": "A",
        "text": "hạt proton $^1_1\\text{H}$"
      },
      {
        "key": "B",
        "text": "hạt nhân heli $^4_2\\text{He}$"
      },
      {
        "key": "C",
        "text": "hạt electron $^0_{-1}e$"
      },
      {
        "key": "D",
        "text": "hạt nơtron $^1_0n$"
      }
    ],
    "answer": "B",
    "explanation": "Hạt $\\alpha$ là hạt nhân heli gồm 2 proton và 2 nơtron, kí hiệu $^4_2\\text{He}$.",
    "points": 0.25,
    "tags": [
      "phóng xạ",
      "hạt α",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-02",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Khi một hạt nhân phóng xạ phát ra tia $\\beta^-$, hạt được phát ra là:",
    "options": [
      {
        "key": "A",
        "text": "hạt $\\alpha$"
      },
      {
        "key": "B",
        "text": "hạt proton"
      },
      {
        "key": "C",
        "text": "electron"
      },
      {
        "key": "D",
        "text": "photon $\\gamma$"
      }
    ],
    "answer": "C",
    "explanation": "Phóng xạ $\\beta^-$ là quá trình hạt nhân phát ra electron ($^0_{-1}e$) do một nơtron chuyển thành proton.",
    "points": 0.25,
    "tags": [
      "phóng xạ β",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-03",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Đơn vị đo hoạt độ phóng xạ trong hệ SI là:",
    "options": [
      {
        "key": "A",
        "text": "becquerel (Bq)"
      },
      {
        "key": "B",
        "text": "jun (J)"
      },
      {
        "key": "C",
        "text": "gray (Gy)"
      },
      {
        "key": "D",
        "text": "sievert (Sv)"
      }
    ],
    "answer": "A",
    "explanation": "Hoạt độ phóng xạ là số hạt phân rã trong một giây, đơn vị becquerel (1 Bq = 1 phân rã/giây).",
    "points": 0.25,
    "tags": [
      "hoạt độ phóng xạ",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-04",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Định luật phóng xạ cho biết hoạt độ của chất phóng xạ sau thời gian $t$ là:",
    "options": [
      {
        "key": "A",
        "text": "$H=H_0\\left(\\dfrac{1}{2}\\right)^{\\frac{2t}{T}}$"
      },
      {
        "key": "B",
        "text": "$H=H_0\\cdot 2^{\\frac{t}{T}}$"
      },
      {
        "key": "C",
        "text": "$H=H_0\\cdot 2^{-\\frac{T}{t}}$"
      },
      {
        "key": "D",
        "text": "$H=H_0\\left(\\dfrac{1}{2}\\right)^{\\frac{t}{T}}$"
      }
    ],
    "answer": "D",
    "explanation": "Hoạt độ giảm theo hàm mũ với chu kì bán rã $T$: $H=H_0\\left(\\frac{1}{2}\\right)^{t/T}$.",
    "points": 0.25,
    "tags": [
      "định luật phóng xạ",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-05",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một mẫu chất phóng xạ ban đầu có 8000 hạt nhân chưa phân rã, chu kì bán rã 10 ngày. Sau 30 ngày, số hạt nhân chưa phân rã còn lại là:",
    "options": [
      {
        "key": "A",
        "text": "2000"
      },
      {
        "key": "B",
        "text": "4000"
      },
      {
        "key": "C",
        "text": "1000"
      },
      {
        "key": "D",
        "text": "500"
      }
    ],
    "answer": "C",
    "explanation": "30 ngày $=3T$ nên còn lại $8000\\cdot\\left(\\frac{1}{2}\\right)^3=1000$ hạt nhân.",
    "points": 0.25,
    "tags": [
      "định luật phóng xạ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-06",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một chất phóng xạ có chu kì bán rã 8 ngày. Sau 24 ngày, khối lượng chất phóng xạ còn lại chiếm:",
    "options": [
      {
        "key": "A",
        "text": "25%"
      },
      {
        "key": "B",
        "text": "12,5%"
      },
      {
        "key": "C",
        "text": "6,25%"
      },
      {
        "key": "D",
        "text": "50%"
      }
    ],
    "answer": "B",
    "explanation": "$24=3\\cdot 8$ nên còn lại $\\left(\\frac{1}{2}\\right)^3=\\frac{1}{8}=12{,}5\\%$.",
    "points": 0.25,
    "tags": [
      "định luật phóng xạ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-07",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong chuỗi phóng xạ $^{238}_{92}\\text{U}\\to\\,^{206}_{82}\\text{Pb}+x\\,^{4}_{2}\\text{He}+y\\,^{0}_{-1}e$, số hạt $\\alpha$ và số hạt $\\beta^-$ phát ra lần lượt là:",
    "options": [
      {
        "key": "A",
        "text": "8 và 6"
      },
      {
        "key": "B",
        "text": "6 và 8"
      },
      {
        "key": "C",
        "text": "10 và 4"
      },
      {
        "key": "D",
        "text": "4 và 10"
      }
    ],
    "answer": "A",
    "explanation": "Bảo toàn số khối: $238=206+4x\\Rightarrow x=8$. Bảo toàn điện tích: $92=82+2x-y\\Rightarrow y=6$.",
    "points": 0.25,
    "tags": [
      "chuỗi phóng xạ",
      "bảo toàn",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-08",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Năng lượng liên kết riêng của một hạt nhân được định nghĩa là:",
    "options": [
      {
        "key": "A",
        "text": "năng lượng liên kết nhân với số nuclon $A$"
      },
      {
        "key": "B",
        "text": "số nuclon chia năng lượng liên kết"
      },
      {
        "key": "C",
        "text": "năng lượng liên kết chia số nuclon $A$"
      },
      {
        "key": "D",
        "text": "căn bậc hai của tích năng lượng liên kết và số nuclon"
      }
    ],
    "answer": "C",
    "explanation": "Năng lượng liên kết riêng $=\\dfrac{E_{lk}}{A}$, đặc trưng cho độ bền vững của hạt nhân.",
    "points": 0.25,
    "tags": [
      "năng lượng liên kết",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-09",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một mẫu chất phóng xạ có khối lượng ban đầu 80 g, chu kì bán rã 5 ngày. Sau 15 ngày, khối lượng chất phóng xạ còn lại là:",
    "options": [
      {
        "key": "A",
        "text": "20 g"
      },
      {
        "key": "B",
        "text": "10 g"
      },
      {
        "key": "C",
        "text": "5 g"
      },
      {
        "key": "D",
        "text": "40 g"
      }
    ],
    "answer": "B",
    "explanation": "$15=3\\cdot 5$ nên $m=80\\cdot\\left(\\frac{1}{2}\\right)^3=10$ g.",
    "points": 0.25,
    "tags": [
      "định luật phóng xạ",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-10",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một chất phóng xạ có hoạt độ ban đầu $4\\cdot10^{5}$ Bq và chu kì bán rã 2 giờ. Hoạt độ của chất phóng xạ sau 6 giờ là:",
    "options": [
      {
        "key": "A",
        "text": "$2\\cdot10^{5}$ Bq"
      },
      {
        "key": "B",
        "text": "$1\\cdot10^{5}$ Bq"
      },
      {
        "key": "C",
        "text": "$2{,}5\\cdot10^{5}$ Bq"
      },
      {
        "key": "D",
        "text": "$5\\cdot10^{4}$ Bq"
      }
    ],
    "answer": "D",
    "explanation": "$H=H_0\\left(\\frac{1}{2}\\right)^{t/T}=4\\cdot10^{5}\\cdot\\frac{1}{8}=5\\cdot10^{4}$ Bq.",
    "points": 0.25,
    "tags": [
      "hoạt độ phóng xạ",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-11",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong một phản ứng hạt nhân, độ hụt khối là $\\Delta m=0{,}2\\,u$ (với $1\\,u=931{,}5$ MeV/c²). Năng lượng toả ra của phản ứng là:",
    "options": [
      {
        "key": "A",
        "text": "186,3 MeV"
      },
      {
        "key": "B",
        "text": "18,63 MeV"
      },
      {
        "key": "C",
        "text": "1,863 MeV"
      },
      {
        "key": "D",
        "text": "372,6 MeV"
      }
    ],
    "answer": "A",
    "explanation": "$E=\\Delta m c^2=0{,}2\\cdot 931{,}5=186{,}3$ MeV.",
    "points": 0.25,
    "tags": [
      "năng lượng liên kết",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-12",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một mẫu chất phóng xạ ban đầu có $2{,}4\\cdot10^{20}$ hạt nhân. Sau 3 chu kì bán rã, số hạt nhân chưa phân rã là:",
    "options": [
      {
        "key": "A",
        "text": "$6\\cdot10^{19}$"
      },
      {
        "key": "B",
        "text": "$1{,}2\\cdot10^{20}$"
      },
      {
        "key": "C",
        "text": "$3\\cdot10^{19}$"
      },
      {
        "key": "D",
        "text": "$4{,}8\\cdot10^{20}$"
      }
    ],
    "answer": "C",
    "explanation": "Sau 3 chu kì còn $\\frac{1}{8}$ số hạt: $2{,}4\\cdot10^{20}:8=3\\cdot10^{19}$ hạt nhân.",
    "points": 0.25,
    "tags": [
      "định luật phóng xạ",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-13",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Khi một hạt nhân phóng xạ phát ra một hạt $\\beta^-$, số khối $A$ của hạt nhân con so với hạt nhân cha:",
    "options": [
      {
        "key": "A",
        "text": "tăng 1"
      },
      {
        "key": "B",
        "text": "giảm 1"
      },
      {
        "key": "C",
        "text": "giảm 4"
      },
      {
        "key": "D",
        "text": "không đổi"
      }
    ],
    "answer": "D",
    "explanation": "Phân rã $\\beta^-$: $^{A}_{Z}X\\to\\,^{A}_{Z+1}Y+^{0}_{-1}e$; số khối không đổi, số hiệu nguyên tử tăng 1.",
    "points": 0.25,
    "tags": [
      "phóng xạ β",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-14",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Phương pháp định tuổi bằng cacbon $^{14}C$ (chu kì bán rã 5730 năm): một cổ vật chỉ còn 25% lượng $^{14}C$ so với khi mới. Tuổi của cổ vật là:",
    "options": [
      {
        "key": "A",
        "text": "5730 năm"
      },
      {
        "key": "B",
        "text": "11460 năm"
      },
      {
        "key": "C",
        "text": "17190 năm"
      },
      {
        "key": "D",
        "text": "2865 năm"
      }
    ],
    "answer": "B",
    "explanation": "Còn 25% $=\\left(\\frac{1}{2}\\right)^2$ nên $t=2T=11460$ năm.",
    "points": 0.25,
    "tags": [
      "định tuổi",
      "thực tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-15",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong phản ứng $^{14}_{7}\\text{N}+\\,^{4}_{2}\\text{He}\\to\\,^{17}_{8}\\text{O}+X$, hạt $X$ là:",
    "options": [
      {
        "key": "A",
        "text": "$^1_0n$"
      },
      {
        "key": "B",
        "text": "$^4_2\\text{He}$"
      },
      {
        "key": "C",
        "text": "$^1_1\\text{H}$"
      },
      {
        "key": "D",
        "text": "$^0_{-1}e$"
      }
    ],
    "answer": "C",
    "explanation": "Bảo toàn: $14+4=17+A_X\\Rightarrow A_X=1$; $7+2=8+Z_X\\Rightarrow Z_X=1$. Vậy $X$ là proton $^1_1\\text{H}$.",
    "points": 0.25,
    "tags": [
      "phản ứng hạt nhân",
      "bảo toàn",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-16",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Phản ứng $^7_3\\text{Li}+^1_1\\text{H}\\to 2\\,^4_2\\text{He}$ có độ hụt khối $\\Delta m=0{,}018\\,u$. Năng lượng toả ra của phản ứng xấp xỉ:",
    "options": [
      {
        "key": "A",
        "text": "8,4 MeV"
      },
      {
        "key": "B",
        "text": "16,8 MeV"
      },
      {
        "key": "C",
        "text": "33,6 MeV"
      },
      {
        "key": "D",
        "text": "1,7 MeV"
      }
    ],
    "answer": "B",
    "explanation": "$E=0{,}018\\cdot 931{,}5\\approx 16{,}8$ MeV.",
    "points": 0.25,
    "tags": [
      "năng lượng phản ứng",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-17",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Hoạt độ của một mẫu phóng xạ giảm từ 8 mCi xuống 0,5 mCi với chu kì bán rã 6 giờ. Thời gian giảm đó là:",
    "options": [
      {
        "key": "A",
        "text": "24 h"
      },
      {
        "key": "B",
        "text": "12 h"
      },
      {
        "key": "C",
        "text": "48 h"
      },
      {
        "key": "D",
        "text": "6 h"
      }
    ],
    "answer": "A",
    "explanation": "Tỉ số $\\frac{8}{0{,}5}=16=2^4$ nên $t=4T=24$ h.",
    "points": 0.25,
    "tags": [
      "hoạt độ phóng xạ",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-18",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Hạt nhân $^{56}_{26}\\text{Fe}$ có số nơtron bằng:",
    "options": [
      {
        "key": "A",
        "text": "26"
      },
      {
        "key": "B",
        "text": "56"
      },
      {
        "key": "C",
        "text": "82"
      },
      {
        "key": "D",
        "text": "30"
      }
    ],
    "answer": "D",
    "explanation": "Số nơtron $=A-Z=56-26=30$.",
    "points": 0.25,
    "tags": [
      "cấu tạo hạt nhân",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-19",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một chất phóng xạ $X$ có chu kì bán rã $T=12$ ngày, ban đầu mẫu chứa $4{,}8\\cdot10^{10}$ hạt nhân. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Sau 24 ngày, mẫu còn $1{,}2\\cdot10^{10}$ hạt nhân."
      },
      {
        "key": "b",
        "text": "Hoạt độ của chất phóng xạ không đổi theo thời gian."
      },
      {
        "key": "c",
        "text": "Sau 36 ngày, mẫu còn $6\\cdot10^{9}$ hạt nhân."
      },
      {
        "key": "d",
        "text": "Mỗi lần phân rã $\\beta^-$ thì tổng số hạt nhân của chất đó tăng thêm 1."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng: $24=2T$ nên còn $\\frac{1}{4}\\cdot 4{,}8\\cdot10^{10}=1{,}2\\cdot10^{10}$. b) Sai: hoạt độ tỉ lệ nghịch với số hạt chưa phân rã nên giảm dần. c) Đúng: $36=3T$ còn $\\frac{1}{8}\\cdot 4{,}8\\cdot10^{10}=6\\cdot10^{9}$. d) Sai: phân rã $\\beta^-$ biến một hạt nhân cha thành hạt nhân con, tổng số hạt nhân không tăng.",
    "points": 1,
    "tags": [
      "định luật phóng xạ",
      "hoạt độ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-20",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Xét phản ứng hạt nhân $^{235}_{92}\\text{U}+\\,^{1}_{0}n\\to\\,^{140}_{54}\\text{Xe}+\\,^{94}_{38}\\text{Sr}+k\\,^{1}_{0}n$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Giá trị của $k$ bằng 3."
      },
      {
        "key": "b",
        "text": "Đây là phản ứng phân hạch."
      },
      {
        "key": "c",
        "text": "Tổng số nuclon trước và sau phản ứng được bảo toàn."
      },
      {
        "key": "d",
        "text": "Phản ứng toả năng lượng vì tổng khối lượng các hạt sau phản ứng lớn hơn trước."
      }
    ],
    "answer": "SĐĐS",
    "explanation": "a) Sai: bảo toàn số khối $235+1=140+94+k\\Rightarrow k=2$. b) Đúng: hạt nhân nặng vỡ thành hai hạt nhân nhẹ hơn. c) Đúng: số khối bảo toàn trong phản ứng hạt nhân. d) Sai: phản ứng toả năng lượng khi khối lượng sau phản ứng nhỏ hơn trước (độ hụt khối dương).",
    "points": 1,
    "tags": [
      "phản ứng phân hạch",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-21",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Bảng số liệu bên dưới cho biết hoạt độ $H$ của một mẫu chất phóng xạ đo được tại các thời điểm khác nhau. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Chu kì bán rã của chất phóng xạ là 12 ngày."
      },
      {
        "key": "b",
        "text": "Hoạt độ ban đầu của mẫu là 800 Bq."
      },
      {
        "key": "c",
        "text": "Sau 48 ngày, hoạt độ của mẫu là 25 Bq."
      },
      {
        "key": "d",
        "text": "Sau 6 ngày, hoạt độ của mẫu là 400 Bq."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) Đúng: hoạt độ giảm một nửa sau mỗi 12 ngày. b) Đúng: tại $t=0$, $H=800$ Bq. c) Sai: sau 48 ngày ($4T$), $H=800/16=50$ Bq. d) Sai: sau 6 ngày ($\\frac{T}{2}$), $H=800\\cdot 2^{-0{,}5}\\approx 566$ Bq.",
    "points": 1,
    "tags": [
      "hoạt độ phóng xạ",
      "bảng số liệu",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "line",
      "title": "Hoạt độ của mẫu chất phóng xạ theo thời gian",
      "xLabel": "t (ngày)",
      "yLabel": "H (Bq)",
      "data": "0; 12; 24; 36\nH (Bq): 800; 400; 200; 100"
    }
  },
  {
    "id": "thpt-ly-c-22",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Trong y học, đồng vị phóng xạ $^{24}Na$ (chu kì bán rã 15 giờ) được dùng với hoạt độ ban đầu 20 mCi cho một lần chụp. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Sau 30 giờ, hoạt độ của đồng vị còn 5 mCi."
      },
      {
        "key": "b",
        "text": "Để hoạt độ còn lại ít nhất 2,5 mCi thì phải sử dụng trong vòng 30 giờ."
      },
      {
        "key": "c",
        "text": "Trong 45 giờ, số hạt phân rã chiếm 87,5% số hạt ban đầu."
      },
      {
        "key": "d",
        "text": "Phóng xạ $\\beta^+$ phát ra electron."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng: $30=2T$ nên $H=20\\cdot\\frac{1}{4}=5$ mCi. b) Sai: $H\\ge 2{,}5$ khi $t\\le 3T=45$ giờ. c) Đúng: $45=3T$ còn $\\frac{1}{8}$, phân rã $\\frac{7}{8}=87{,}5\\%$. d) Sai: $\\beta^+$ phát ra positron (hạt electron dương).",
    "points": 1,
    "tags": [
      "hoạt độ",
      "y học",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-23",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hạt nhân $^{35}_{17}\\text{Cl}$ có bao nhiêu nơtron?",
    "answer": "18",
    "explanation": "Số nơtron $=A-Z=35-17=18$.",
    "points": 0.5,
    "tags": [
      "cấu tạo hạt nhân",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-24",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Sau 4 chu kì bán rã, khối lượng chất phóng xạ còn lại chiếm bao nhiêu phần trăm khối lượng ban đầu?",
    "answer": "6,25",
    "explanation": "Còn $\\left(\\frac{1}{2}\\right)^4=\\frac{1}{16}=6{,}25\\%$.",
    "points": 0.5,
    "tags": [
      "định luật phóng xạ",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-25",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một mẫu chất phóng xạ có khối lượng ban đầu 32 g, chu kì bán rã 3 ngày. Sau 12 ngày, khối lượng chất phóng xạ còn lại bao nhiêu gam?",
    "answer": "2",
    "explanation": "$12=4T$ nên còn $32\\cdot\\frac{1}{16}=2$ g.",
    "points": 0.5,
    "tags": [
      "định luật phóng xạ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-26",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một mẫu có $6{,}4\\cdot10^{10}$ hạt nhân chất phóng xạ. Sau 2 chu kì bán rã, số hạt nhân chưa phân rã là $a\\cdot10^{10}$. Giá trị của $a$ là bao nhiêu?",
    "answer": "1,6",
    "explanation": "Còn $\\frac{1}{4}\\cdot 6{,}4\\cdot10^{10}=1{,}6\\cdot10^{10}$ hạt nhân.",
    "points": 0.5,
    "tags": [
      "định luật phóng xạ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-27",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một phản ứng hạt nhân có độ hụt khối $\\Delta m=0{,}02\\,u$ (với $1\\,u=931{,}5$ MeV/c²). Năng lượng toả ra, làm tròn đến hàng phần mười (MeV), là bao nhiêu?",
    "answer": "18,6",
    "explanation": "$E=0{,}02\\cdot 931{,}5=18{,}63\\approx 18{,}6$ MeV.",
    "points": 0.5,
    "tags": [
      "năng lượng phản ứng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-28",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một chất phóng xạ có hoạt độ ban đầu $3{,}2\\cdot10^{6}$ Bq và chu kì bán rã 6 ngày. Sau 18 ngày, hoạt độ của mẫu là $a\\cdot10^{5}$ Bq. Giá trị của $a$ là bao nhiêu?",
    "answer": "4",
    "explanation": "$18=3T$: $H=3{,}2\\cdot10^{6}\\cdot\\frac{1}{8}=4\\cdot10^{5}$ Bq.",
    "points": 0.5,
    "tags": [
      "hoạt độ phóng xạ",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-29",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một mẫu gỗ cổ chỉ còn 12,5% lượng cacbon $^{14}C$ so với gỗ mới ($T=5730$ năm). Tuổi của mẫu gỗ, làm tròn đến hàng phần mười (nghìn năm), là bao nhiêu?",
    "answer": "17,2",
    "explanation": "Còn $\\frac{1}{8}=2^{-3}$ nên $t=3T=17190$ năm $=17{,}2$ nghìn năm.",
    "points": 0.5,
    "tags": [
      "định tuổi",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-c-30",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Phản ứng $^2_1\\text{H}+\\,^2_1\\text{H}\\to\\,^3_2\\text{He}+\\,^1_0n$ có độ hụt khối $\\Delta m=0{,}0035\\,u$. Năng lượng toả ra, làm tròn đến hàng phần mười (MeV), là bao nhiêu?",
    "answer": "3,3",
    "explanation": "$E=0{,}0035\\cdot 931{,}5\\approx 3{,}26\\approx 3{,}3$ MeV.",
    "points": 0.5,
    "tags": [
      "phản ứng nhiệt hạch",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-d-01",
    "subject": "Vật lí",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Một vật chuyển động thẳng đều với phương trình $x=-2+4t$ (m, s). Toạ độ của vật tại thời điểm $t=5$ s là:",
    "options": [
      {
        "key": "A",
        "text": "18 m"
      },
      {
        "key": "B",
        "text": "20 m"
      },
      {
        "key": "C",
        "text": "22 m"
      },
      {
        "key": "D",
        "text": "24 m"
      }
    ],
    "answer": "C",
    "explanation": "$x(5)=-2+4\\cdot 5=22$ m.",
    "points": 0.25,
    "tags": [
      "chuyển động thẳng đều",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-d-02",
    "subject": "Vật lí",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Đồ thị vận tốc – thời gian của một vật như hình bên dưới. Gia tốc của vật trong khoảng thời gian từ 0 đến 2 s là:",
    "options": [
      {
        "key": "A",
        "text": "1 m/s²"
      },
      {
        "key": "B",
        "text": "2 m/s²"
      },
      {
        "key": "C",
        "text": "3 m/s²"
      },
      {
        "key": "D",
        "text": "4 m/s²"
      }
    ],
    "answer": "B",
    "explanation": "Gia tốc bằng hệ số góc của đồ thị: $a=\\dfrac{4-0}{2-0}=2$ m/s².",
    "points": 0.25,
    "tags": [
      "đồ thị v–t",
      "động học",
      "NB"
    ],
    "variable": false,
    "figure": {
      "kind": "motion",
      "yName": "v (m/s)",
      "tName": "t (s)",
      "points": "(0; 0) (2; 4) (5; 4)"
    }
  },
  {
    "id": "thpt-ly-d-03",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Một vật dao động điều hòa có chu kì $T=2$ s. Tần số dao động của vật là:",
    "options": [
      {
        "key": "A",
        "text": "0,5 Hz"
      },
      {
        "key": "B",
        "text": "2 Hz"
      },
      {
        "key": "C",
        "text": "5 Hz"
      },
      {
        "key": "D",
        "text": "0,2 Hz"
      }
    ],
    "answer": "A",
    "explanation": "$f=\\dfrac{1}{T}=\\dfrac{1}{2}=0{,}5$ Hz.",
    "points": 0.25,
    "tags": [
      "dao động điều hòa",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-d-04",
    "subject": "Vật lí",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Chiều các đường sức từ quanh một dây dẫn thẳng dài mang dòng điện được xác định bằng:",
    "options": [
      {
        "key": "A",
        "text": "quy tắc bàn tay trái"
      },
      {
        "key": "B",
        "text": "quy tắc bàn tay phải với ngón tay cái chỉ chiều từ trường"
      },
      {
        "key": "C",
        "text": "định luật Jun – Len-xơ"
      },
      {
        "key": "D",
        "text": "quy tắc nắm tay phải (ngón tay cái chỉ chiều dòng điện, các ngón tay nắm theo chiều đường sức)"
      }
    ],
    "answer": "D",
    "explanation": "Áp dụng quy tắc nắm tay phải: ngón cái theo chiều dòng điện, chiều nắm của các ngón tay cho chiều đường sức từ.",
    "points": 0.25,
    "tags": [
      "từ trường của dòng điện",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-d-05",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Một vật dao động điều hòa với phương trình $x=5\\cos(4\\pi t)$ cm (t tính bằng s). Chu kì dao động của vật là:",
    "options": [
      {
        "key": "A",
        "text": "0,25 s"
      },
      {
        "key": "B",
        "text": "0,5 s"
      },
      {
        "key": "C",
        "text": "1 s"
      },
      {
        "key": "D",
        "text": "2 s"
      }
    ],
    "answer": "B",
    "explanation": "$\\omega=4\\pi$ rad/s nên $T=\\dfrac{2\\pi}{\\omega}=\\dfrac{2\\pi}{4\\pi}=0{,}5$ s.",
    "points": 0.25,
    "tags": [
      "dao động điều hòa",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-d-06",
    "subject": "Vật lí",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Dựa vào đồ thị v–t như hình bên dưới, quãng đường vật đi được trong 5 giây đầu là:",
    "options": [
      {
        "key": "A",
        "text": "12 m"
      },
      {
        "key": "B",
        "text": "14 m"
      },
      {
        "key": "C",
        "text": "16 m"
      },
      {
        "key": "D",
        "text": "20 m"
      }
    ],
    "answer": "C",
    "explanation": "Quãng đường bằng diện tích dưới đồ thị: tam giác $\\frac{1}{2}\\cdot 2\\cdot 4=4$ m cộng hình chữ nhật $3\\cdot 4=12$ m, tổng 16 m.",
    "points": 0.25,
    "tags": [
      "đồ thị v–t",
      "quãng đường",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "motion",
      "yName": "v (m/s)",
      "tName": "t (s)",
      "points": "(0; 0) (2; 4) (5; 4)"
    }
  },
  {
    "id": "thpt-ly-d-07",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Một sóng cơ có phương trình sóng $y=4\\cos\\left(2\\pi t-\\dfrac{\\pi}{2}x\\right)$ cm ($x$ tính bằng m, $t$ tính bằng s). Bước sóng của sóng là:",
    "options": [
      {
        "key": "A",
        "text": "1 m"
      },
      {
        "key": "B",
        "text": "2 m"
      },
      {
        "key": "C",
        "text": "8 m"
      },
      {
        "key": "D",
        "text": "4 m"
      }
    ],
    "answer": "D",
    "explanation": "Số sóng $k=\\dfrac{\\pi}{2}$ nên $\\lambda=\\dfrac{2\\pi}{k}=4$ m.",
    "points": 0.25,
    "tags": [
      "sóng cơ",
      "phương trình sóng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-d-08",
    "subject": "Vật lí",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Một vật khối lượng 2 kg trượt không ma sát xuống mặt phẳng nghiêng góc $30^{\\circ}$ như hình bên dưới (lấy $g=10$ m/s²). Gia tốc của vật là:",
    "options": [
      {
        "key": "A",
        "text": "5 m/s²"
      },
      {
        "key": "B",
        "text": "10 m/s²"
      },
      {
        "key": "C",
        "text": "2,5 m/s²"
      },
      {
        "key": "D",
        "text": "8,7 m/s²"
      }
    ],
    "answer": "A",
    "explanation": "$a=g\\sin\\alpha=10\\cdot\\dfrac{1}{2}=5$ m/s².",
    "points": 0.25,
    "tags": [
      "mặt phẳng nghiêng",
      "định luật II Newton",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "incline",
      "angle": 30,
      "fms": "none",
      "F": "none"
    }
  },
  {
    "id": "thpt-ly-d-09",
    "subject": "Vật lí",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Một ô tô chạy với tốc độ 20 m/s ở phía sau một xe máy chạy với tốc độ 12 m/s cùng chiều, hai xe cách nhau 100 m. Thời gian để ô tô đuổi kịp xe máy là:",
    "options": [
      {
        "key": "A",
        "text": "10 s"
      },
      {
        "key": "B",
        "text": "15 s"
      },
      {
        "key": "C",
        "text": "12,5 s"
      },
      {
        "key": "D",
        "text": "8 s"
      }
    ],
    "answer": "C",
    "explanation": "Tốc độ xích lại gần nhau $=20-12=8$ m/s; thời gian $=\\dfrac{100}{8}=12{,}5$ s.",
    "points": 0.25,
    "tags": [
      "động học",
      "hai vật chuyển động",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-d-10",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Một vật dao động điều hòa với phương trình $x=6\\cos(2\\pi t)$ cm. Quãng đường vật đi được trong một phần tư chu kì đầu tiên (từ $t=0$ đến $t=\\dfrac{T}{4}$) là:",
    "options": [
      {
        "key": "A",
        "text": "3 cm"
      },
      {
        "key": "B",
        "text": "6 cm"
      },
      {
        "key": "C",
        "text": "12 cm"
      },
      {
        "key": "D",
        "text": "24 cm"
      }
    ],
    "answer": "B",
    "explanation": "Trong $\\frac{T}{4}$ đầu, vật đi từ biên độ dương $(6$ cm$)$ về vị trí cân bằng nên quãng đường bằng biên độ $A=6$ cm.",
    "points": 0.25,
    "tags": [
      "dao động điều hòa",
      "quãng đường",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-d-11",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Một vật treo vào lò xo có độ cứng $k=200$ N/m, dao động điều hòa với biên độ 10 cm. Cơ năng của hệ dao động là:",
    "options": [
      {
        "key": "A",
        "text": "0,5 J"
      },
      {
        "key": "B",
        "text": "2 J"
      },
      {
        "key": "C",
        "text": "4 J"
      },
      {
        "key": "D",
        "text": "1 J"
      }
    ],
    "answer": "D",
    "explanation": "$W=\\dfrac{1}{2}kA^2=\\dfrac{1}{2}\\cdot 200\\cdot 0{,}1^2=1$ J.",
    "points": 0.25,
    "tags": [
      "cơ năng dao động",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-d-12",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Trên một phương sóng, hai điểm cách nhau $1{,}5\\lambda$ ($\\lambda$ là bước sóng). Hai điểm này dao động:",
    "options": [
      {
        "key": "A",
        "text": "ngược pha nhau"
      },
      {
        "key": "B",
        "text": "cùng pha nhau"
      },
      {
        "key": "C",
        "text": "vuông pha nhau"
      },
      {
        "key": "D",
        "text": "lệch pha $\\dfrac{\\pi}{4}$"
      }
    ],
    "answer": "A",
    "explanation": "Độ lệch pha $\\Delta\\varphi=2\\pi\\cdot\\dfrac{d}{\\lambda}=2\\pi\\cdot 1{,}5=3\\pi\\equiv\\pi\\pmod{2\\pi}$: hai điểm ngược pha.",
    "points": 0.25,
    "tags": [
      "sóng cơ",
      "độ lệch pha",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-d-13",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Mạch điện như hình bên dưới: nguồn $E=12$ V, điện trở trong $r=1\\,\\Omega$, điện trở $R_1=5\\,\\Omega$ nối tiếp với đoạn mạch gồm $R_2=6\\,\\Omega$ song song $R_3=3\\,\\Omega$. Cường độ dòng điện qua nguồn là:",
    "options": [
      {
        "key": "A",
        "text": "1,2 A"
      },
      {
        "key": "B",
        "text": "1,5 A"
      },
      {
        "key": "C",
        "text": "2 A"
      },
      {
        "key": "D",
        "text": "3 A"
      }
    ],
    "answer": "B",
    "explanation": "$R_{23}=\\dfrac{6\\cdot 3}{9}=2\\,\\Omega$; tổng $R=5+2+1=8\\,\\Omega$; $I=\\dfrac{12}{8}=1{,}5$ A.",
    "points": 0.25,
    "tags": [
      "mạch điện",
      "định luật Ôm",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "circuit",
      "text": "nguồn E = 12 V, r = 1 Ω\nR1=5Ω - (R2=6Ω // R3=3Ω)"
    }
  },
  {
    "id": "thpt-ly-d-14",
    "subject": "Vật lí",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Một vật khối lượng 4 kg nằm trên mặt sàn ngang, chịu lực kéo ngang 20 N và lực ma sát 4 N (lấy $g=10$ m/s²). Gia tốc của vật là:",
    "options": [
      {
        "key": "A",
        "text": "6 m/s²"
      },
      {
        "key": "B",
        "text": "5 m/s²"
      },
      {
        "key": "C",
        "text": "4 m/s²"
      },
      {
        "key": "D",
        "text": "3 m/s²"
      }
    ],
    "answer": "C",
    "explanation": "$a=\\dfrac{F-F_{ms}}{m}=\\dfrac{20-4}{4}=4$ m/s².",
    "points": 0.25,
    "tags": [
      "định luật II Newton",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-d-15",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Một vật khối lượng 2 kg được treo vào lò xo có độ cứng 200 N/m, kéo vật ra khỏi vị trí cân bằng 5 cm rồi buông nhẹ. Chu kì dao động của vật xấp xỉ:",
    "options": [
      {
        "key": "A",
        "text": "0,31 s"
      },
      {
        "key": "B",
        "text": "1,26 s"
      },
      {
        "key": "C",
        "text": "0,16 s"
      },
      {
        "key": "D",
        "text": "0,63 s"
      }
    ],
    "answer": "D",
    "explanation": "$T=2\\pi\\sqrt{\\dfrac{m}{k}}=2\\pi\\sqrt{\\dfrac{2}{200}}=2\\pi\\cdot 0{,}1\\approx 0{,}63$ s.",
    "points": 0.25,
    "tags": [
      "con lắc lò xo",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-d-16",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Một sợi dây hai đầu cố định dài 1,2 m đang có sóng dừng với 3 bụng sóng. Sóng truyền trên dây với tần số 100 Hz. Tốc độ truyền sóng trên dây là:",
    "options": [
      {
        "key": "A",
        "text": "80 m/s"
      },
      {
        "key": "B",
        "text": "60 m/s"
      },
      {
        "key": "C",
        "text": "100 m/s"
      },
      {
        "key": "D",
        "text": "40 m/s"
      }
    ],
    "answer": "A",
    "explanation": "Hai đầu cố định với 3 bụng: $L=\\dfrac{3\\lambda}{2}\\Rightarrow\\lambda=\\dfrac{2\\cdot 1{,}2}{3}=0{,}8$ m; $v=f\\lambda=100\\cdot 0{,}8=80$ m/s.",
    "points": 0.25,
    "tags": [
      "sóng dừng",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-d-17",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Hai dao động điều hòa cùng tần số trên cùng một trục: $x_1=4\\cos(2\\pi t)$ cm và $x_2=3\\cos\\left(2\\pi t-\\dfrac{\\pi}{2}\\right)$ cm. Biên độ dao động tổng hợp là:",
    "options": [
      {
        "key": "A",
        "text": "1 cm"
      },
      {
        "key": "B",
        "text": "7 cm"
      },
      {
        "key": "C",
        "text": "5 cm"
      },
      {
        "key": "D",
        "text": "2 cm"
      }
    ],
    "answer": "C",
    "explanation": "Hai dao động vuông pha nên $A=\\sqrt{A_1^2+A_2^2}=\\sqrt{16+9}=5$ cm.",
    "points": 0.25,
    "tags": [
      "tổng hợp dao động",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-d-18",
    "subject": "Vật lí",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Một vật khối lượng 2 kg trượt xuống mặt phẳng nghiêng góc $30^{\\circ}$ như hình bên dưới, hệ số ma sát $\\mu=0{,}2$ (lấy $g=10$ m/s², $\\cos 30^{\\circ}\\approx 0{,}87$). Gia tốc của vật xấp xỉ:",
    "options": [
      {
        "key": "A",
        "text": "2,5 m/s²"
      },
      {
        "key": "B",
        "text": "3,3 m/s²"
      },
      {
        "key": "C",
        "text": "5,0 m/s²"
      },
      {
        "key": "D",
        "text": "1,7 m/s²"
      }
    ],
    "answer": "B",
    "explanation": "$a=g(\\sin\\alpha-\\mu\\cos\\alpha)=10(0{,}5-0{,}2\\cdot 0{,}87)\\approx 3{,}3$ m/s².",
    "points": 0.25,
    "tags": [
      "mặt phẳng nghiêng",
      "ma sát",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "incline",
      "angle": 30,
      "fms": "up",
      "F": "none"
    }
  },
  {
    "id": "thpt-ly-d-19",
    "subject": "Vật lí",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Một vật chuyển động thẳng có đồ thị vận tốc – thời gian như hình bên dưới. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Trong 4 giây đầu, vật chuyển động nhanh dần đều với gia tốc 2 m/s²."
      },
      {
        "key": "b",
        "text": "Quãng đường vật đi được trong 7 giây đầu là 54 m."
      },
      {
        "key": "c",
        "text": "Trong khoảng từ giây thứ 4 đến giây thứ 7, vật chuyển động chậm dần đều."
      },
      {
        "key": "d",
        "text": "Vận tốc trung bình của vật trong 7 giây đầu xấp xỉ 7,7 m/s."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: $a=\\frac{10-2}{4}=2$ m/s². b) Đúng: quãng đường $=\\frac{(2+10)\\cdot 4}{2}+10\\cdot 3=24+30=54$ m. c) Sai: vận tốc không đổi 10 m/s, vật chuyển động đều. d) Đúng: $\\frac{54}{7}\\approx 7{,}7$ m/s.",
    "points": 1,
    "tags": [
      "đồ thị v–t",
      "động học",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "motion",
      "yName": "v (m/s)",
      "tName": "t (s)",
      "points": "(0; 2) (4; 10) (7; 10)"
    }
  },
  {
    "id": "thpt-ly-d-20",
    "subject": "Vật lí",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Một vật khối lượng 2 kg trên mặt phẳng nghiêng góc $30^{\\circ}$ như hình bên dưới, được đẩy lên trên bằng lực $F=20$ N song song với mặt nghiêng; lực ma sát có độ lớn 2 N (lấy $g=10$ m/s²). Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Gia tốc của vật là 4 m/s²."
      },
      {
        "key": "b",
        "text": "Lực ma sát tác dụng lên vật có độ lớn 2 N."
      },
      {
        "key": "c",
        "text": "Thành phần trọng lượng của vật dọc theo mặt nghiêng là 20 N."
      },
      {
        "key": "d",
        "text": "Nếu bỏ lực $F$ thì vật sẽ đứng yên trên mặt nghiêng."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) Đúng: $a=\\frac{20-10-2}{2}=4$ m/s². b) Đúng theo đề. c) Sai: thành phần dọc mặt nghiêng $P_x=mg\\sin 30^{\\circ}=10$ N. d) Sai: khi bỏ $F$, $P_x=10$ N lớn hơn lực ma sát nên vật trượt xuống.",
    "points": 1,
    "tags": [
      "mặt phẳng nghiêng",
      "định luật II Newton",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "incline",
      "angle": 30,
      "fms": "down",
      "F": "up"
    }
  },
  {
    "id": "thpt-ly-d-21",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Một vật khối lượng 0,5 kg gắn vào lò xo có độ cứng 50 N/m, dao động điều hòa trên mặt phẳng ngang không ma sát với biên độ 10 cm. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Chu kì dao động bằng $0{,}2\\pi$ s (xấp xỉ 0,63 s)."
      },
      {
        "key": "b",
        "text": "Tốc độ cực đại của vật là 0,5 m/s."
      },
      {
        "key": "c",
        "text": "Cơ năng của hệ dao động là 0,25 J."
      },
      {
        "key": "d",
        "text": "Tại vị trí $x=5$ cm, động năng của vật bằng thế năng đàn hồi."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng: $T=2\\pi\\sqrt{0{,}01}=0{,}2\\pi$ s. b) Sai: $v_{\\max}=A\\omega=0{,}1\\cdot\\sqrt{100}=1$ m/s. c) Đúng: $W=\\frac{1}{2}\\cdot 50\\cdot 0{,}1^2=0{,}25$ J. d) Sai: động năng bằng thế năng khi $|x|=\\frac{A}{\\sqrt{2}}\\approx 7{,}07$ cm, không phải 5 cm.",
    "points": 1,
    "tags": [
      "con lắc lò xo",
      "cơ năng",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-d-22",
    "subject": "Vật lí",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một vật chuyển động thẳng đều với phương trình $x=-2+6t$ (m, s). Toạ độ của vật tại thời điểm $t=3$ s là bao nhiêu mét?",
    "answer": "16",
    "explanation": "$x(3)=-2+6\\cdot 3=16$ m.",
    "points": 0.5,
    "tags": [
      "chuyển động thẳng đều",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-d-23",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một vật dao động điều hòa có chu kì 0,4 s. Tần số dao động (Hz) là bao nhiêu?",
    "answer": "2,5",
    "explanation": "$f=\\dfrac{1}{T}=\\dfrac{1}{0{,}4}=2{,}5$ Hz.",
    "points": 0.5,
    "tags": [
      "dao động điều hòa",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-d-24",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một vật dao động điều hòa với biên độ 5 cm, chu kì 0,5 s. Quãng đường vật đi được trong 1 giây (tính bằng cm) là bao nhiêu?",
    "answer": "40",
    "explanation": "Trong 1 s vật thực hiện 2 dao động toàn phần; mỗi dao động toàn phần quãng đường $4A=20$ cm. Tổng $=2\\cdot 20=40$ cm.",
    "points": 0.5,
    "tags": [
      "dao động điều hòa",
      "quãng đường",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-d-25",
    "subject": "Vật lí",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một vật trượt không ma sát xuống mặt phẳng nghiêng góc $30^{\\circ}$ (lấy $g=10$ m/s²). Gia tốc của vật (m/s²) là bao nhiêu?",
    "answer": "5",
    "explanation": "$a=g\\sin 30^{\\circ}=5$ m/s².",
    "points": 0.5,
    "tags": [
      "mặt phẳng nghiêng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-d-26",
    "subject": "Vật lí",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hai xe chuyển động ngược chiều hướng về phía nhau với tốc độ 20 m/s và 15 m/s, ban đầu cách nhau 210 m. Thời gian để hai xe gặp nhau (s) là bao nhiêu?",
    "answer": "6",
    "explanation": "Tốc độ xích lại gần $=35$ m/s; $t=\\dfrac{210}{35}=6$ s.",
    "points": 0.5,
    "tags": [
      "động học",
      "hai vật chuyển động",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-d-27",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Sóng âm truyền trong không khí với tốc độ 340 m/s, tần số 680 Hz. Bước sóng của sóng âm (m) là bao nhiêu?",
    "answer": "0,5",
    "explanation": "$\\lambda=\\dfrac{v}{f}=\\dfrac{340}{680}=0{,}5$ m.",
    "points": 0.5,
    "tags": [
      "sóng cơ",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-d-28",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hai vật khối lượng 3 kg và 1 kg nối với nhau bằng lò xo có độ cứng 300 N/m trên mặt phẳng ngang không ma sát. Chu kì dao động của hệ, làm tròn đến hai chữ số thập phân (s), là bao nhiêu?",
    "answer": "0,31",
    "explanation": "$T=2\\pi\\sqrt{\\dfrac{\\mu}{k}}$ với $\\mu=\\dfrac{m_1m_2}{m_1+m_2}=0{,}75$ kg: $T=2\\pi\\sqrt{\\dfrac{0{,}75}{300}}=2\\pi\\cdot 0{,}05\\approx 0{,}31$ s.",
    "points": 0.5,
    "tags": [
      "dao động của hệ hai vật",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly-d-29",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một vật dao động điều hòa với chu kì 0,6 s, biên độ 10 cm. Thời gian ngắn nhất để vật đi từ vị trí biên dương đến vị trí có li độ 5 cm, tính bằng giây, là bao nhiêu?",
    "answer": "0,1",
    "explanation": "Vật đi từ biên đến $x=\\frac{A}{2}$ mất đúng $\\dfrac{T}{6}=\\dfrac{0{,}6}{6}=0{,}1$ s.",
    "points": 0.5,
    "tags": [
      "dao động điều hòa",
      "thời gian",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-a-01",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cấu trúc phân tử ADN theo mô hình Watson – Crick là:",
    "options": [
      {
        "key": "A",
        "text": "một mạch đơn thẳng"
      },
      {
        "key": "B",
        "text": "hai mạch xoắn kép"
      },
      {
        "key": "C",
        "text": "ba mạch xoắn"
      },
      {
        "key": "D",
        "text": "mạch đơn vòng"
      }
    ],
    "answer": "B",
    "explanation": "ADN gồm hai mạch polynuclêôtit xoắn quanh một trục chung (xoắn kép).",
    "points": 0.25,
    "tags": [
      "di truyền phân tử",
      "cấu trúc ADN",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-a-02",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong phân tử ADN, mối quan hệ số lượng giữa các nuclêôtit là:",
    "options": [
      {
        "key": "A",
        "text": "$A = G$"
      },
      {
        "key": "B",
        "text": "$A = X$"
      },
      {
        "key": "C",
        "text": "$A = T$ và $A + G = 50\\%$"
      },
      {
        "key": "D",
        "text": "$A + T = 80\\%$"
      }
    ],
    "answer": "C",
    "explanation": "Nguyên tắc bổ sung: $A$ bắt cặp với $T$, $G$ với $X$ nên $A=T$, $G=X$ và $A+G=T+X=50\\%$.",
    "points": 0.25,
    "tags": [
      "di truyền phân tử",
      "nguyên tắc bổ sung",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-a-03",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Lai hai cây dị hợp $Aa\\times Aa$ (trội hoàn toàn), tỉ lệ kiểu hình ở F₂ là:",
    "options": [
      {
        "key": "A",
        "text": "3 trội : 1 lặn"
      },
      {
        "key": "B",
        "text": "1 trội : 1 lặn"
      },
      {
        "key": "C",
        "text": "9 : 3 : 4"
      },
      {
        "key": "D",
        "text": "12 : 3 : 1"
      }
    ],
    "answer": "A",
    "explanation": "Quy luật phân li của Menđen: $Aa\\times Aa$ cho F₂ kiểu hình 3:1.",
    "points": 0.25,
    "tags": [
      "quy luật di truyền",
      "phân li",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-a-04",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong tế bào sinh dưỡng, các gen được sắp xếp:",
    "options": [
      {
        "key": "A",
        "text": "chỉ trên các NST thường"
      },
      {
        "key": "B",
        "text": "chỉ trên NST giới tính"
      },
      {
        "key": "C",
        "text": "rải rác trong tế bào chất"
      },
      {
        "key": "D",
        "text": "thành các nhóm gen tương đồng nằm trên các NST trong nhân tế bào"
      }
    ],
    "answer": "D",
    "explanation": "Các gen nằm trên NST, phân bố thành từng nhóm gen tương đồng theo trình tự xác định.",
    "points": 0.25,
    "tags": [
      "di truyền phân tử",
      "tổ chức gen",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-a-05",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một gen có tổng số 3000 nuclêôtit, trong đó số nuclêôtit loại A là 600. Số nuclêôtit loại G của gen là:",
    "options": [
      {
        "key": "A",
        "text": "600"
      },
      {
        "key": "B",
        "text": "1500"
      },
      {
        "key": "C",
        "text": "900"
      },
      {
        "key": "D",
        "text": "1800"
      }
    ],
    "answer": "C",
    "explanation": "$A=T=600$ nên $A+T=1200$; $G=X=\\dfrac{3000-1200}{2}=900$.",
    "points": 0.25,
    "tags": [
      "di truyền phân tử",
      "tính số nucleotit",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-a-06",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Lai hai cây $AaBb\\times AaBb$ (hai cặp gen phân li độc lập, trội hoàn toàn). Số kiểu gen ở F₂ là:",
    "options": [
      {
        "key": "A",
        "text": "4"
      },
      {
        "key": "B",
        "text": "9"
      },
      {
        "key": "C",
        "text": "16"
      },
      {
        "key": "D",
        "text": "8"
      }
    ],
    "answer": "B",
    "explanation": "Mỗi cặp gen cho 3 kiểu gen; hai cặp độc lập cho $3\\times 3=9$ kiểu gen.",
    "points": 0.25,
    "tags": [
      "quy luật di truyền",
      "phân li độc lập",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-a-07",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong một phả hệ, cặp cha mẹ đều bị bệnh vẫn sinh được con bình thường. Cách di truyền phù hợp nhất của bệnh là do gen:",
    "options": [
      {
        "key": "A",
        "text": "trội"
      },
      {
        "key": "B",
        "text": "lặn"
      },
      {
        "key": "C",
        "text": "lặn trên NST X"
      },
      {
        "key": "D",
        "text": "không thể xác định"
      }
    ],
    "answer": "A",
    "explanation": "Cha mẹ đều bệnh mà sinh con bình thường chứng tỏ alen bệnh là trội (con bình thường là đồng hợp lặn).",
    "points": 0.25,
    "tags": [
      "phả hệ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-a-08",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Lai cây $Aa$ với cây $aa$ (trội hoàn toàn). Tỉ lệ đời con mang kiểu gen dị hợp là:",
    "options": [
      {
        "key": "A",
        "text": "25%"
      },
      {
        "key": "B",
        "text": "75%"
      },
      {
        "key": "C",
        "text": "100%"
      },
      {
        "key": "D",
        "text": "50%"
      }
    ],
    "answer": "D",
    "explanation": "$Aa\\times aa$ cho kiểu gen $Aa:aa=1:1$, nên 50% con dị hợp.",
    "points": 0.25,
    "tags": [
      "quy luật di truyền",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-a-09",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Ở một loài thực vật, cặp tính trạng do hai cặp gen nằm trên cùng một cặp NST. F₁ có kiểu gen $\\dfrac{AB}{ab}$, trong quá trình giảm phân xảy ra hoán vị gen với tần số 20%. Cho F₁ lai phân tích, tỉ lệ kiểu hình giống F₁ ở đời con là:",
    "options": [
      {
        "key": "A",
        "text": "10%"
      },
      {
        "key": "B",
        "text": "20%"
      },
      {
        "key": "C",
        "text": "40%"
      },
      {
        "key": "D",
        "text": "50%"
      }
    ],
    "answer": "C",
    "explanation": "Hoán vị 20% → giao tử $AB$ chiếm 40%; lai phân tích với $\\dfrac{ab}{ab}$ cho kiểu hình giống F₁ chiếm 40%.",
    "points": 0.25,
    "tags": [
      "hoán vị gen",
      "lai phân tích",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-a-10",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Ở ruồi giấm, gen quy định màu mắt nằm trên NST X, alen $W$ (mắt đỏ) trội hoàn toàn so với $w$ (mắt trắng). Cho con cái $X^W X^w$ lai với con đực $X^wY$. Trong số các con đực ở đời con, tỉ lệ con mắt trắng là:",
    "options": [
      {
        "key": "A",
        "text": "25%"
      },
      {
        "key": "B",
        "text": "50%"
      },
      {
        "key": "C",
        "text": "75%"
      },
      {
        "key": "D",
        "text": "100%"
      }
    ],
    "answer": "B",
    "explanation": "Con đực nhận $X^w$ từ mẹ (50%) và $Y$ từ bố: 50% con đực $X^wY$ mắt trắng.",
    "points": 0.25,
    "tags": [
      "liên kết giới tính",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-a-11",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một quần thể sinh vật ở trạng thái cân bằng di truyền với tần số alen $A$ là $p=0{,}8$. Tỉ lệ kiểu gen dị hợp $Aa$ trong quần thể là:",
    "options": [
      {
        "key": "A",
        "text": "0,32"
      },
      {
        "key": "B",
        "text": "0,64"
      },
      {
        "key": "C",
        "text": "0,04"
      },
      {
        "key": "D",
        "text": "0,16"
      }
    ],
    "answer": "A",
    "explanation": "Theo Hardy – Weinberg: $2pq=2\\cdot 0{,}8\\cdot 0{,}2=0{,}32$.",
    "points": 0.25,
    "tags": [
      "di truyền quần thể",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-a-12",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong một quần thể ở trạng thái cân bằng di truyền, tần số alen lặn $a$ là $q=0{,}1$. Tỉ lệ thể hiện kiểu hình lặn (kiểu gen $aa$) là:",
    "options": [
      {
        "key": "A",
        "text": "10%"
      },
      {
        "key": "B",
        "text": "0,1%"
      },
      {
        "key": "C",
        "text": "20%"
      },
      {
        "key": "D",
        "text": "1%"
      }
    ],
    "answer": "D",
    "explanation": "$q^2=0{,}01=1\\%$.",
    "points": 0.25,
    "tags": [
      "di truyền quần thể",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-a-13",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một gen có 3000 cặp nuclêôtit. Số nuclêôtit môi trường cần cung cấp khi gen này tự nhân đôi 2 lần là:",
    "options": [
      {
        "key": "A",
        "text": "6000"
      },
      {
        "key": "B",
        "text": "12000"
      },
      {
        "key": "C",
        "text": "18000"
      },
      {
        "key": "D",
        "text": "24000"
      }
    ],
    "answer": "C",
    "explanation": "Một gen có 6000 nu; nhân đôi 2 lần tạo $2^2=4$ phân tử, cần thêm số nu bằng $(4-1)\\cdot 6000=18000$.",
    "points": 0.25,
    "tags": [
      "nhân đôi ADN",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-a-14",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một quần thể đang ở trạng thái cân bằng di truyền với tần số alen $A=0{,}6$. Chọn lọc loại bỏ hoàn toàn các cá thể có kiểu gen $aa$. Tần số alen $a$ trong quần thể ngay sau một thế hệ chọn lọc là:",
    "options": [
      {
        "key": "A",
        "text": "0,43"
      },
      {
        "key": "B",
        "text": "0,29"
      },
      {
        "key": "C",
        "text": "0,50"
      },
      {
        "key": "D",
        "text": "0,14"
      }
    ],
    "answer": "B",
    "explanation": "Trước chọn lọc: $p^2=0{,}36$; $2pq=0{,}48$; $q^2=0{,}16$. Sau khi loại hết $aa$, quần thể còn $0{,}84$; tần số alen $a$ (chỉ còn trong dị hợp): $q'=\\dfrac{2pq}{2(p^2+2pq)}=\\dfrac{0{,}48}{1{,}68}\\approx 0{,}29$ (tức công thức $q'=\\dfrac{q}{1+q}$).",
    "points": 0.25,
    "tags": [
      "di truyền quần thể",
      "chọn lọc tự nhiên",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-a-15",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một gen có 1800 nuclêôtit, xảy ra đột biến thay thế một cặp nuclêôtit loại $\\text{G}-\\text{X}$ bằng cặp loại $\\text{A}-\\text{T}$. Số lượng liên kết hiđrô trong gen thay đổi như thế nào?",
    "options": [
      {
        "key": "A",
        "text": "giảm 1 liên kết"
      },
      {
        "key": "B",
        "text": "tăng 1 liên kết"
      },
      {
        "key": "C",
        "text": "giảm 2 liên kết"
      },
      {
        "key": "D",
        "text": "không thay đổi"
      }
    ],
    "answer": "A",
    "explanation": "Cặp $\\text{G}-\\text{X}$ có 3 liên kết hiđrô, cặp $\\text{A}-\\text{T}$ có 2: giảm 1 liên kết hiđrô.",
    "points": 0.25,
    "tags": [
      "đột biến gen",
      "liên kết hiđrô",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-a-16",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Xét các phát biểu về cấu trúc và đặc điểm của ADN. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Hai mạch của ADN xoắn song song theo chiều ngược nhau."
      },
      {
        "key": "b",
        "text": "A liên kết với T bằng 3 liên kết hiđrô."
      },
      {
        "key": "c",
        "text": "ADN nhân đôi theo cơ chế bán bảo toàn."
      },
      {
        "key": "d",
        "text": "Số loại nuclêôtit của ARN là 5."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng: hai mạch có chiều ngược nhau (antiparallel). b) Sai: $A=T$ có 2 liên kết hiđrô ($G\\equiv X$ có 3). c) Đúng. d) Sai: ARN có 4 loại nuclêôtit (A, U, G, X).",
    "points": 1,
    "tags": [
      "di truyền phân tử",
      "ARN",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-a-17",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho phép lai hai cây dị hợp về một cặp gen ($Aa\\times Aa$), tính trội hoàn toàn. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Tỉ lệ kiểu gen ở F₂ là 1 AA : 2 Aa : 1 aa."
      },
      {
        "key": "b",
        "text": "Tỉ lệ kiểu hình ở F₂ là 3 trội : 1 lặn."
      },
      {
        "key": "c",
        "text": "Xác suất một cá thể F₂ dị hợp là 1/4."
      },
      {
        "key": "d",
        "text": "Tỉ lệ kiểu hình ở F₂ là 1 trội : 1 lặn."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) Đúng. b) Đúng. c) Sai: xác suất dị hợp là 1/2. d) Sai: tỉ lệ là 3:1.",
    "points": 1,
    "tags": [
      "quy luật di truyền",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-a-18",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Xét một phả hệ: cặp cha mẹ đều bình thường sinh ra một con gái bị bệnh và các con trai đều bình thường; trong quần thể bệnh này hiếm gặp. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Bệnh do alen lặn trên NST thường quy định."
      },
      {
        "key": "b",
        "text": "Cả cha và mẹ đều mang alen bệnh ở trạng thái dị hợp."
      },
      {
        "key": "c",
        "text": "Các con trai bình thường chắc chắn không mang alen bệnh."
      },
      {
        "key": "d",
        "text": "Xác suất con kế tiếp (sinh từ cùng cặp cha mẹ) bị bệnh là 1/2."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) Đúng: cha mẹ bình thường sinh con gái bệnh nên bệnh do alen lặn trên NST thường (nếu trên X thì bố phải bệnh). b) Đúng: cả hai đều $Aa$. c) Sai: con trai bình thường có thể là $Aa$ (xác suất 2/3). d) Sai: $Aa\times Aa$ cho con bệnh với xác suất 1/4.",
    "points": 1,
    "tags": [
      "phả hệ",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-a-19",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cấu trúc di truyền của một quần thể gồm 1000 cá thể được cho trong bảng bên dưới. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Tần số alen $A$ của quần thể là 0,7."
      },
      {
        "key": "b",
        "text": "Tần số alen $a$ của quần thể là 0,2."
      },
      {
        "key": "c",
        "text": "Quần thể đang ở trạng thái cân bằng di truyền Hardy – Weinberg."
      },
      {
        "key": "d",
        "text": "Sau một thế hệ tự thụ phấn, tỉ lệ cá thể dị hợp giảm còn 42%."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng: $p=\\frac{2\\cdot 490+420}{2000}=0{,}7$. b) Sai: $q=1-0{,}7=0{,}3$. c) Đúng: $p^2=0{,}49$; $2pq=0{,}42$; $q^2=0{,}09$ khớp 490; 420; 90. d) Sai: tự thụ làm 420 cá thể Aa cho 210 cá thể Aa, tỉ lệ dị hợp còn 21%.",
    "points": 1,
    "tags": [
      "di truyền quần thể",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "table",
      "title": "Cấu trúc di truyền của quần thể P",
      "data": "AA; Aa; aa\nSố cá thể: 490; 420; 90"
    }
  },
  {
    "id": "thpt-sinh-a-20",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một gen có tổng số 1500 nuclêôtit, trong đó số nuclêôtit loại A là 300. Số nuclêôtit loại G của gen là bao nhiêu?",
    "answer": "450",
    "explanation": "$A=T=300$; $G=X=\\dfrac{1500-600}{2}=450$.",
    "points": 0.5,
    "tags": [
      "di truyền phân tử",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-a-21",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Lai hai cây dị hợp $Aa\\times Aa$ (trội hoàn toàn). Xác suất để một cá thể đời con có kiểu hình lặn là bao nhiêu phần trăm?",
    "answer": "25",
    "explanation": "$Aa\\times Aa$ cho $\\frac{1}{4}$ aa = 25%.",
    "points": 0.5,
    "tags": [
      "quy luật di truyền",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-a-22",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một cơ thể có kiểu gen $AaBb$, hai cặp gen nằm trên hai cặp NST khác nhau. Số loại giao tử tối đa cơ thể này tạo ra (giảm phân bình thường) là bao nhiêu?",
    "answer": "4",
    "explanation": "Hai cặp gen phân li độc lập: $2^2=4$ loại giao tử AB, Ab, aB, ab.",
    "points": 0.5,
    "tags": [
      "phân li độc lập",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-a-23",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một gen có 900 nuclêôtit. Số bộ ba (côđon) trên phân tử mARN do gen này phiên mã là bao nhiêu?",
    "answer": "150",
    "explanation": "ARNm có 450 nu → 150 bộ ba → 150 axit amin.",
    "points": 0.5,
    "tags": [
      "mã di truyền",
      "tính số axit amin",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-a-24",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một quần thể ở trạng thái cân bằng di truyền có tỉ lệ kiểu gen $aa$ bằng 25%. Tỉ lệ kiểu gen dị hợp trong quần thể là bao nhiêu phần trăm?",
    "answer": "50",
    "explanation": "$q^2=0{,}25\\Rightarrow q=0{,}5$, $p=0{,}5$; $2pq=0{,}5=50\\%$.",
    "points": 0.5,
    "tags": [
      "di truyền quần thể",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-a-25",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một gen có 900 nuclêôtit. Sau khi gen này nhân đôi 3 lần, tổng số nuclêôtit từ môi trường cung cấp cho quá trình nhân đôi là bao nhiêu?",
    "answer": "6300",
    "explanation": "Sau 3 lần nhân đôi tạo $2^3=8$ phân tử; số nu bổ sung $=(8-1)\\cdot 900=6300$.",
    "points": 0.5,
    "tags": [
      "nhân đôi ADN",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-b-01",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Theo Đacuyn, ba yếu tố cơ bản của quá trình tiến hóa là:",
    "options": [
      {
        "key": "A",
        "text": "đột biến gen, chọn lọc nhân tạo, lai tạo"
      },
      {
        "key": "B",
        "text": "chọn lọc tự nhiên, chọn lọc nhân tạo, đột biến"
      },
      {
        "key": "C",
        "text": "biến dị, di truyền, chọn lọc tự nhiên"
      },
      {
        "key": "D",
        "text": "trao đổi chất, sinh sản, sinh trưởng"
      }
    ],
    "answer": "C",
    "explanation": "Biến dị cung cấp nguyên liệu, di truyền duy trì biến dị qua các thế hệ, chọn lọc tự nhiên định hướng sự biến đổi tần số alen.",
    "points": 0.25,
    "tags": [
      "tiến hóa",
      "đặc trưng",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-b-02",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Nhân tố tiến hóa làm biến đổi tần số alen một cách ngẫu nhiên, không định hướng trong quần thể (rõ rệt nhất ở quần thể nhỏ) là:",
    "options": [
      {
        "key": "A",
        "text": "chọn lọc tự nhiên"
      },
      {
        "key": "B",
        "text": "các yếu tố ngẫu nhiên (phiêu bạt di truyền)"
      },
      {
        "key": "C",
        "text": "dòng gen"
      },
      {
        "key": "D",
        "text": "giao phối không ngẫu nhiên"
      }
    ],
    "answer": "B",
    "explanation": "Đột biến xảy ra ngẫu nhiên, làm xuất hiện alen mới và biến đổi tần số alen một cách ngẫu nhiên.",
    "points": 0.25,
    "tags": [
      "tiến hóa",
      "nguyên tố tiến hóa",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-b-03",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Sinh vật đứng đầu chuỗi thức ăn, tự tạo chất hữu cơ từ chất vô cơ là:",
    "options": [
      {
        "key": "A",
        "text": "sinh vật sản xuất"
      },
      {
        "key": "B",
        "text": "sinh vật phân giải"
      },
      {
        "key": "C",
        "text": "động vật ăn thịt"
      },
      {
        "key": "D",
        "text": "sinh vật tiêu thụ bậc cao nhất"
      }
    ],
    "answer": "A",
    "explanation": "Sinh vật sản xuất (cây xanh) quang hợp tạo chất hữu cơ, khởi đầu chuỗi thức ăn.",
    "points": 0.25,
    "tags": [
      "sinh thái",
      "chuỗi thức ăn",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-b-04",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Sản phẩm của quá trình hô hấp tế bào hiếu khí là:",
    "options": [
      {
        "key": "A",
        "text": "$\\text{CO}_2$, $\\text{H}_2\\text{O}$ và ánh sáng"
      },
      {
        "key": "B",
        "text": "$\\text{CO}_2$ và $\\text{O}_2$"
      },
      {
        "key": "C",
        "text": "glucose và $\\text{CO}_2$"
      },
      {
        "key": "D",
        "text": "$\\text{CO}_2$, $\\text{H}_2\\text{O}$ và ATP"
      }
    ],
    "answer": "D",
    "explanation": "$\\text{C}_6\\text{H}_{12}\\text{O}_6+6\\text{O}_2\\to 6\\text{CO}_2+6\\text{H}_2\\text{O}+$ ATP.",
    "points": 0.25,
    "tags": [
      "sinh lí",
      "hô hấp tế bào",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-b-05",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Đặc điểm của mô hình sinh trưởng theo cấp số nhân (mô hình J) của quần thể là:",
    "options": [
      {
        "key": "A",
        "text": "quần thể tăng chậm dần rồi ổn định"
      },
      {
        "key": "B",
        "text": "quần thể tăng nhanh với tốc độ không đổi trong điều kiện môi trường lí tưởng"
      },
      {
        "key": "C",
        "text": "kích thước quần thể không đổi theo thời gian"
      },
      {
        "key": "D",
        "text": "quần thể tăng đến sức chứa môi trường rồi dừng"
      }
    ],
    "answer": "B",
    "explanation": "Mô hình J: $\\dfrac{dN}{dt}=rN$, tốc độ tăng tỉ lệ với kích thước quần thể, không bị giới hạn bởi môi trường.",
    "points": 0.25,
    "tags": [
      "sinh thái",
      "mô hình tăng trưởng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-b-06",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Điểm bù sáng của cây là cường độ ánh sáng mà tại đó:",
    "options": [
      {
        "key": "A",
        "text": "cường độ quang hợp bằng cường độ hô hấp"
      },
      {
        "key": "B",
        "text": "cường độ quang hợp lớn hơn cường độ hô hấp"
      },
      {
        "key": "C",
        "text": "cường độ quang hợp nhỏ hơn cường độ hô hấp"
      },
      {
        "key": "D",
        "text": "cây không thực hiện quang hợp"
      }
    ],
    "answer": "A",
    "explanation": "Tại điểm bù sáng, lượng chất hữu cơ quang hợp tạo ra cân bằng với lượng bị tiêu tốn do hô hấp.",
    "points": 0.25,
    "tags": [
      "sinh lí thực vật",
      "quang hợp",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-b-07",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Hormone thực vật gây hiện tượng ưu thế đỉnh ngọn là:",
    "options": [
      {
        "key": "A",
        "text": "etylen"
      },
      {
        "key": "B",
        "text": "giberellin"
      },
      {
        "key": "C",
        "text": "auxin"
      },
      {
        "key": "D",
        "text": "axit abscisic"
      }
    ],
    "answer": "C",
    "explanation": "Auxin tập trung ở đỉnh ngọn ức chế sự phát triển của các chồi bên: ưu thế đỉnh ngọn.",
    "points": 0.25,
    "tags": [
      "sinh lí thực vật",
      "hormone",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-b-08",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Hormone làm giảm nồng độ glucose trong máu là:",
    "options": [
      {
        "key": "A",
        "text": "glucagon"
      },
      {
        "key": "B",
        "text": "adrenalin"
      },
      {
        "key": "C",
        "text": "tiroxin"
      },
      {
        "key": "D",
        "text": "insulin"
      }
    ],
    "answer": "D",
    "explanation": "Insulin (từ tuyến tụy) thúc đẩy tế bào hấp thu glucose, làm giảm đường huyết.",
    "points": 0.25,
    "tags": [
      "sinh lí động vật",
      "nội tiết",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-b-09",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Biểu đồ bên dưới cho biết năng lượng tích lũy qua các bậc dinh dưỡng đầu của một chuỗi thức ăn. Theo quy luật 10%, năng lượng tối đa mà bậc dinh dưỡng của rắn (bậc tiếp theo) nhận được là:",
    "options": [
      {
        "key": "A",
        "text": "1000 kJ"
      },
      {
        "key": "B",
        "text": "100 kJ"
      },
      {
        "key": "C",
        "text": "1 kJ"
      },
      {
        "key": "D",
        "text": "10 kJ"
      }
    ],
    "answer": "D",
    "explanation": "Năng lượng chuyển tiếp giữa hai bậc dinh dưỡng chỉ khoảng 10%: $100\\cdot 10\\%=10$ kJ.",
    "points": 0.25,
    "tags": [
      "sinh thái",
      "năng lượng",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "bar",
      "title": "Năng lượng tích lũy qua các bậc dinh dưỡng",
      "xLabel": "Bậc dinh dưỡng",
      "yLabel": "Năng lượng (kJ)",
      "data": "Cỏ; Côn trùng; Ếch\nNăng lượng (kJ): 10000; 1000; 100"
    }
  },
  {
    "id": "thpt-sinh-b-10",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Ở người, bệnh tiểu đường tuýp 1 xảy ra do cơ thể thiếu hormone:",
    "options": [
      {
        "key": "A",
        "text": "insulin"
      },
      {
        "key": "B",
        "text": "glucagon"
      },
      {
        "key": "C",
        "text": "insulin và glucagon"
      },
      {
        "key": "D",
        "text": "adrenalin"
      }
    ],
    "answer": "A",
    "explanation": "Tiểu đường tuýp 1 do các tế bào β của đảo tụy bị phá hủy, không tổng hợp đủ insulin.",
    "points": 0.25,
    "tags": [
      "sinh lí động vật",
      "bệnh",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-b-11",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cơ quan giữ vai trò trung tâm điều hòa thân nhiệt ở người là:",
    "options": [
      {
        "key": "A",
        "text": "tủy sống"
      },
      {
        "key": "B",
        "text": "tiểu não"
      },
      {
        "key": "C",
        "text": "vùng dưới đồi"
      },
      {
        "key": "D",
        "text": "tuyến yên"
      }
    ],
    "answer": "C",
    "explanation": "Vùng dưới đồi là trung tâm điều nhiệt, điều hòa quá trình sinh nhiệt và mất nhiệt.",
    "points": 0.25,
    "tags": [
      "sinh lí động vật",
      "cân bằng nội môi",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-b-12",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong một khu đất 400 m² có 200 cá thể của một loài cây. Mật độ cá thể của quần thể (cá thể/m²) là:",
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "5"
      },
      {
        "key": "C",
        "text": "0,05"
      },
      {
        "key": "D",
        "text": "0,5"
      }
    ],
    "answer": "D",
    "explanation": "$\\dfrac{200}{400}=0{,}5$ cá thể/m².",
    "points": 0.25,
    "tags": [
      "sinh thái",
      "mật độ",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-b-13",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong một giờ, lá cây quang hợp hấp thụ hết 0,06 mol $\\text{CO}_2$. Khối lượng glucose ($\\text{C}_6\\text{H}_{12}\\text{O}_6$, $M=180$) được tạo thành trong giờ đó là:",
    "options": [
      {
        "key": "A",
        "text": "1,8 g"
      },
      {
        "key": "B",
        "text": "3,6 g"
      },
      {
        "key": "C",
        "text": "0,9 g"
      },
      {
        "key": "D",
        "text": "18 g"
      }
    ],
    "answer": "A",
    "explanation": "$6\\text{CO}_2\\to 1$ glucose: $n_{\\text{glucose}}=\\dfrac{0{,}06}{6}=0{,}01$ mol $=1{,}8$ g.",
    "points": 0.25,
    "tags": [
      "sinh lí thực vật",
      "quang hợp",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-b-14",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một alen bệnh lặn $b$ có tần số $q=0{,}02$ trong quần thể đang cân bằng di truyền. Tỉ lệ người mang alen bệnh (dị hợp) xấp xỉ là:",
    "options": [
      {
        "key": "A",
        "text": "2,0%"
      },
      {
        "key": "B",
        "text": "0,04%"
      },
      {
        "key": "C",
        "text": "3,9%"
      },
      {
        "key": "D",
        "text": "39%"
      }
    ],
    "answer": "C",
    "explanation": "$2pq=2\\cdot 0{,}98\\cdot 0{,}02=0{,}0392\\approx 3{,}9\\%$.",
    "points": 0.25,
    "tags": [
      "di truyền quần thể",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-b-15",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một quần thể sinh trưởng theo mô hình logistic với sức chứa môi trường $K=1000$ cá thể, tốc độ tăng trưởng riêng $r=0{,}1$ và hiện có $N=200$ cá thể. Tốc độ tăng của quần thể ($\\dfrac{dN}{dt}$, cá thể/đơn vị thời gian) là:",
    "options": [
      {
        "key": "A",
        "text": "20"
      },
      {
        "key": "B",
        "text": "16"
      },
      {
        "key": "C",
        "text": "8"
      },
      {
        "key": "D",
        "text": "24"
      }
    ],
    "answer": "B",
    "explanation": "$\\dfrac{dN}{dt}=rN\\left(1-\\dfrac{N}{K}\\right)=0{,}1\\cdot 200\\cdot 0{,}8=16$ cá thể/đơn vị thời gian.",
    "points": 0.25,
    "tags": [
      "sinh thái",
      "mô hình logistical",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-b-16",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Xét các phát biểu về sinh lí thực vật. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Quang hợp diễn ra trong lục lạp."
      },
      {
        "key": "b",
        "text": "Giai đoạn sáng của quang hợp diễn ra ở màng thylakoid."
      },
      {
        "key": "c",
        "text": "Cây xanh chỉ thực hiện hô hấp vào ban đêm."
      },
      {
        "key": "d",
        "text": "Auxin thúc đẩy sự ra rễ ở cành giâm."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng. b) Đúng. c) Sai: hô hấp diễn ra ngày và đêm ở mọi tế bào sống. d) Đúng: auxin kích thích sinh rễ.",
    "points": 1,
    "tags": [
      "sinh lí thực vật",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-b-17",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Xét chuỗi thức ăn: cỏ → châu chấu → ếch → rắn → diều hâu. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Cỏ là sinh vật sản xuất."
      },
      {
        "key": "b",
        "text": "Rắn là sinh vật tiêu thụ bậc 2."
      },
      {
        "key": "c",
        "text": "Sinh vật đứng đầu chuỗi thức ăn này là ếch."
      },
      {
        "key": "d",
        "text": "Lượng năng lượng tích lũy càng giảm khi lên các bậc dinh dưỡng cao."
      }
    ],
    "answer": "ĐSSĐ",
    "explanation": "a) Đúng. b) Sai: rắn là sinh vật tiêu thụ bậc 3. c) Sai: diều hâu là đỉnh chuỗi. d) Đúng theo quy luật 10%.",
    "points": 1,
    "tags": [
      "sinh thái",
      "chuỗi thức ăn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-b-18",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Xét các phát biểu về bài tiết và hô hấp ở người. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Thận lọc máu tạo nước tiểu nhờ quá trình lọc ở cầu thận."
      },
      {
        "key": "b",
        "text": "Tái hấp thu các chất có ích diễn ra chủ yếu ở ống thận."
      },
      {
        "key": "c",
        "text": "Nước tiểu của người khỏe mạnh bình thường có glucose."
      },
      {
        "key": "d",
        "text": "Hô hấp tế bào diễn ra chủ yếu trong ty thể."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng. b) Đúng. c) Sai: glucose được tái hấp thu hết ở ống thận. d) Đúng: đường phân ở tế bào chất, còn chu trình Krebs và chuỗi truyền electron (tạo phần lớn ATP) diễn ra trong ti thể.",
    "points": 1,
    "tags": [
      "sinh lí động vật",
      "bài tiết",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-b-19",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Ở một quần thể, alen $A$ trội hoàn toàn so với $a$; các cá thể $aa$ không thể sinh sản (chọn lọc chống tuyệt đối $aa$). Hiện $q=0{,}2$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Chọn lọc tự nhiên làm tần số alen $a$ giảm dần qua các thế hệ."
      },
      {
        "key": "b",
        "text": "Tỉ lệ cá thể dị hợp $Aa$ hiện nay là 4%."
      },
      {
        "key": "c",
        "text": "Khi $q$ nhỏ, tần số alen $a$ giảm chậm vì alen $a$ được \"ẩn\" trong các cá thể dị hợp."
      },
      {
        "key": "d",
        "text": "Chọn lọc tự nhiên biến đổi thành phần kiểu gen chủ đạo một cách ngẫu nhiên, không định hướng."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng. b) Sai: $2pq=2\\cdot 0{,}8\\cdot 0{,}2=0{,}32=32\\%$ (4% là tỉ lệ $aa=q^2$). c) Đúng. d) Sai: chọn lọc tự nhiên biến đổi kiểu gen chủ đạo có định hướng, làm quần thể thích nghi dần với môi trường.",
    "points": 1,
    "tags": [
      "tiến hóa",
      "chọn lọc tự nhiên",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-b-20",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Phương trình tổng quát của hô hấp: $\\text{C}_6\\text{H}_{12}\\text{O}_6+6\\text{O}_2\\to 6\\text{CO}_2+6\\text{H}_2\\text{O}+$ ATP. Số mol $\\text{O}_2$ cần cho 0,5 mol glucose hô hấp hoàn toàn là bao nhiêu?",
    "answer": "3",
    "explanation": "Tỉ lệ 1 glucose : 6 $\\text{O}_2$: $0{,}5\\cdot 6=3$ mol.",
    "points": 0.5,
    "tags": [
      "sinh lí",
      "hô hấp",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-b-21",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trong một khu vực 0,3 ha có 120 cá thể chim. Mật độ quần thể (cá thể/ha) là bao nhiêu?",
    "answer": "400",
    "explanation": "$\\dfrac{120}{0{,}3}=400$ cá thể/ha.",
    "points": 0.5,
    "tags": [
      "sinh thái",
      "mật độ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-b-22",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trong một chuỗi thức ăn, bậc dinh dưỡng thứ nhất tích lũy 5000 kJ. Theo quy luật 10%, năng lượng tối đa bậc dinh dưỡng thứ ba nhận được là bao nhiêu kJ?",
    "answer": "50",
    "explanation": "Bậc 2 nhận 500 kJ, bậc 3 nhận 50 kJ.",
    "points": 0.5,
    "tags": [
      "sinh thái",
      "năng lượng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-b-23",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Nồng độ glucose trong máu của một người là 100 mg/100 mL. Giá trị này tương đương bao nhiêu gam trên lít (g/L)?",
    "answer": "1",
    "explanation": "100 mg/100 mL = 1000 mg/L = 1 g/L.",
    "points": 0.5,
    "tags": [
      "sinh lí động vật",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-b-24",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một cây quang hợp tạo ra 90 g glucose. Khối lượng $\\text{CO}_2$ cần hấp thụ ($\\text{C}=12$, $\\text{H}=1$, $\\text{O}=16$) là bao nhiêu gam?",
    "answer": "132",
    "explanation": "$n_{\\text{glucose}}=0{,}5$ mol → $n_{\\text{CO}_2}=3$ mol → $m=3\\cdot 44=132$ g.",
    "points": 0.5,
    "tags": [
      "sinh lí thực vật",
      "quang hợp",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh-b-25",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Quần thể sinh trưởng theo mô hình logistic với $K=800$, $r=0{,}2$, hiện có $N=400$ cá thể. Tốc độ tăng $\\dfrac{dN}{dt}$ (cá thể/đơn vị thời gian) là bao nhiêu?",
    "answer": "40",
    "explanation": "$\\dfrac{dN}{dt}=0{,}2\\cdot 400\\cdot\\left(1-\\dfrac{400}{800}\\right)=0{,}2\\cdot 400\\cdot 0{,}5=40$.",
    "points": 0.5,
    "tags": [
      "sinh thái",
      "logistical",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-01",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cuộc cách mạng công nghiệp lần thứ nhất bắt đầu ở nước nào?",
    "options": [
      {
        "key": "A",
        "text": "Pháp"
      },
      {
        "key": "B",
        "text": "Mỹ"
      },
      {
        "key": "C",
        "text": "Anh"
      },
      {
        "key": "D",
        "text": "Đức"
      }
    ],
    "answer": "C",
    "explanation": "Cách mạng công nghiệp lần thứ nhất bùng nổ ở Anh từ nửa sau thế kỉ XVIII.",
    "points": 0.25,
    "tags": [
      "cách mạng công nghiệp",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-02",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Nguyên nhân sâu xa dẫn đến cách mạng tư sản Anh (thế kỉ XVII) là:",
    "options": [
      {
        "key": "A",
        "text": "vua giải tán Quốc hội"
      },
      {
        "key": "B",
        "text": "nạn đói kéo dài"
      },
      {
        "key": "C",
        "text": "sự can thiệp của nước ngoài"
      },
      {
        "key": "D",
        "text": "mâu thuẫn giữa giai cấp tư sản, dân chúng và chế độ phong kiến chuyên chế"
      }
    ],
    "answer": "D",
    "explanation": "Chế độ phong kiến chuyên chế kìm hãm sự phát triển của chủ nghĩa tư bản, gây mâu thuẫn gay gắt — nguyên nhân sâu xa của cách mạng.",
    "points": 0.25,
    "tags": [
      "cách mạng tư sản",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-03",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Chiến tranh thế giới thứ nhất diễn ra trong những năm nào?",
    "options": [
      {
        "key": "A",
        "text": "1914 – 1919"
      },
      {
        "key": "B",
        "text": "1914 – 1918"
      },
      {
        "key": "C",
        "text": "1913 – 1917"
      },
      {
        "key": "D",
        "text": "1915 – 1918"
      }
    ],
    "answer": "B",
    "explanation": "Chiến tranh thế giới thứ nhất nổ ra tháng 7/1914 và kết thúc 11/11/1918.",
    "points": 0.25,
    "tags": [
      "chiến tranh thế giới thứ nhất",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-04",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cách mạng Tháng Mười Nga nổ ra năm nào?",
    "options": [
      {
        "key": "A",
        "text": "1905"
      },
      {
        "key": "B",
        "text": "1914"
      },
      {
        "key": "C",
        "text": "1919"
      },
      {
        "key": "D",
        "text": "1917"
      }
    ],
    "answer": "D",
    "explanation": "Cách mạng Tháng Mười nổ ra ngày 7/11/1917 (25/10 theo lịch Nga cũ), khai sinh nhà nước công nông đầu tiên.",
    "points": 0.25,
    "tags": [
      "cách mạng Tháng Mười",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-05",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Hội Việt Nam Cách mạng Thanh niên được thành lập vào tháng nào?",
    "options": [
      {
        "key": "A",
        "text": "6/1925"
      },
      {
        "key": "B",
        "text": "3/1929"
      },
      {
        "key": "C",
        "text": "11/1924"
      },
      {
        "key": "D",
        "text": "2/1930"
      }
    ],
    "answer": "A",
    "explanation": "Nguyễn Ái Quốc thành lập Hội Việt Nam Cách mạng Thanh niên tháng 6/1925 tại Quảng Châu (Trung Quốc).",
    "points": 0.25,
    "tags": [
      "hội VN cách mạng thanh niên",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-06",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Đảng Cộng sản Việt Nam chính thức ra đời vào:",
    "options": [
      {
        "key": "A",
        "text": "6/1925"
      },
      {
        "key": "B",
        "text": "5/1941"
      },
      {
        "key": "C",
        "text": "đầu năm 1930"
      },
      {
        "key": "D",
        "text": "2/1939"
      }
    ],
    "answer": "C",
    "explanation": "Đảng Cộng sản Việt Nam ra đời đầu năm 1930 (3/2/1930) sau hội nghị hợp nhất ba tổ chức cộng sản.",
    "points": 0.25,
    "tags": [
      "đảng Cộng sản Việt Nam",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-07",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Khởi nghĩa Bắc Sơn (Lạng Sơn) nổ ra vào:",
    "options": [
      {
        "key": "A",
        "text": "23/11/1940"
      },
      {
        "key": "B",
        "text": "27/9/1940"
      },
      {
        "key": "C",
        "text": "8/3/1945"
      },
      {
        "key": "D",
        "text": "13/3/1954"
      }
    ],
    "answer": "B",
    "explanation": "Khởi nghĩa Bắc Sơn nổ ra ngày 27/9/1940 khi Nhật vào Lạng Sơn, thực dân Pháp bế tắc hoảng loạn.",
    "points": 0.25,
    "tags": [
      "khởi nghĩa 1940",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-08",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Chiến dịch Biên giới thu – đông năm 1950 của Quân đội nhân dân Việt Nam được mở đầu bằng trận tiến công:",
    "options": [
      {
        "key": "A",
        "text": "chiến dịch Hòa Bình"
      },
      {
        "key": "B",
        "text": "chiến dịch Điện Biên Phủ"
      },
      {
        "key": "C",
        "text": "đường số 4"
      },
      {
        "key": "D",
        "text": "cứ điểm Đông Khê"
      }
    ],
    "answer": "D",
    "explanation": "Chiến dịch Biên giới 1950 mở đầu bằng trận tiến công cứ điểm Đông Khê (16/9/1950).",
    "points": 0.25,
    "tags": [
      "kháng chiến chống Pháp",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-09",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Nghị quyết Hội nghị Trung ương lần thứ 15 (1/1959) của Ban Chấp hành Trung ương Đảng xác định:",
    "options": [
      {
        "key": "A",
        "text": "cách mạng Việt Nam chuyển sang giai đoạn mới: tiến lên cách mạng xã hội chủ nghĩa ở miền Bắc và đấu tranh giải phóng miền Nam"
      },
      {
        "key": "B",
        "text": "tạm ngừng đấu tranh ở miền Nam"
      },
      {
        "key": "C",
        "text": "chỉ tập trung xây dựng miền Bắc"
      },
      {
        "key": "D",
        "text": "giải quyết mâu thuẫn dân tộc bằng thương lượng với Pháp"
      }
    ],
    "answer": "A",
    "explanation": "Nghị quyết TW 13 (1/1959) xác định hai nhiệm vụ chiến lược và đường lối cách mạng xã hội chủ nghĩa trên cả hai miền.",
    "points": 0.25,
    "tags": [
      "march 1959",
      "đường lối",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-10",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Đại hội đại biểu toàn quốc lần thứ VI của Đảng (12/1986) được đánh dấu bằng:",
    "options": [
      {
        "key": "A",
        "text": "đưa quân vào Campuchia"
      },
      {
        "key": "B",
        "text": "tuyên bố dừng mọi hoạt động kinh tế"
      },
      {
        "key": "C",
        "text": "khởi xướng công cuộc đổi mới toàn diện đất nước"
      },
      {
        "key": "D",
        "text": "gia nhập ASEAN"
      }
    ],
    "answer": "C",
    "explanation": "Đại hội VI (tháng 12/1986) khởi xướng đường lối đổi mới, đổi mới kinh tế làm trọng tâm.",
    "points": 0.25,
    "tags": [
      "đổi mới",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-11",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Hiệp ước Vecxai (Versailles) được kí kết năm nào sau Chiến tranh thế giới thứ nhất?",
    "options": [
      {
        "key": "A",
        "text": "1918"
      },
      {
        "key": "B",
        "text": "1920"
      },
      {
        "key": "C",
        "text": "1921"
      },
      {
        "key": "D",
        "text": "1919"
      }
    ],
    "answer": "D",
    "explanation": "Hiệp ước Vecxai kí kết ngày 28/6/1919, xử lý nước Đức bại trận và sắp xếp lại trật tự thế giới.",
    "points": 0.25,
    "tags": [
      "hiệp ước Vecxai",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-12",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Chiến thắng Chi Lăng – Xương Giang của quân triều Lê xảy ra năm nào?",
    "options": [
      {
        "key": "A",
        "text": "1416"
      },
      {
        "key": "B",
        "text": "1425"
      },
      {
        "key": "C",
        "text": "1418"
      },
      {
        "key": "D",
        "text": "1427"
      }
    ],
    "answer": "D",
    "explanation": "Tháng 9 – 10/1427, quân Lam Sơn tiêu diệt đội viện binh Minh tại Chi Lăng – Xương Giang, chuẩn bị cho trận quyết định.",
    "points": 0.25,
    "tags": [
      "khởi nghĩa Lam Sơn",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-13",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Mặt trận Việt Minh (Việt Nam độc lập đồng minh) được thành lập vào:",
    "options": [
      {
        "key": "A",
        "text": "19/5/1941"
      },
      {
        "key": "B",
        "text": "6/1925"
      },
      {
        "key": "C",
        "text": "3/2/1930"
      },
      {
        "key": "D",
        "text": "28/2/1944"
      }
    ],
    "answer": "A",
    "explanation": "Mặt trận Việt Minh ra đời 19/5/1941 theo Nghị quyết Hội nghị Trung ương 8, tập hợp lực lượng toàn dân tộc.",
    "points": 0.25,
    "tags": [
      "mặt trận Việt Minh",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-14",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Hiệp định Giơnev (Genève) về chấm dứt chiến tranh, phục hồi hòa bình ở Đông Dương được kí kết vào:",
    "options": [
      {
        "key": "A",
        "text": "27/1/1973"
      },
      {
        "key": "B",
        "text": "8/3/1949"
      },
      {
        "key": "C",
        "text": "21/7/1954"
      },
      {
        "key": "D",
        "text": "6/3/1946"
      }
    ],
    "answer": "C",
    "explanation": "Hiệp định Giơnev kí ngày 21/7/1954 sau chiến thắng Điện Biên Phủ.",
    "points": 0.25,
    "tags": [
      "hiệp định Giơnev",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-15",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cuộc Tổng tiến công và nổi dậy xuân 1968 (Tết Mậu Thân) có ý nghĩa:",
    "options": [
      {
        "key": "A",
        "text": "kết thúc chiến tranh Việt Nam"
      },
      {
        "key": "B",
        "text": "buộc Mỹ \"phi Mĩ hóa\" chiến tranh, tạo cục diện mới trên chiến trường miền Nam"
      },
      {
        "key": "C",
        "text": "giải phóng hoàn toàn miền Nam"
      },
      {
        "key": "D",
        "text": "thắng lợi quân sự hoàn toàn của Mỹ"
      }
    ],
    "answer": "B",
    "explanation": "Sau Tết Mậu Thân 1968, Mỹ buộc phải xuống thang chiến tranh, chấp nhận thương lượng ở Pari.",
    "points": 0.25,
    "tags": [
      "kháng chiến chống Mỹ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-16",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Tuyến chi viện chiến lược nổi tiếng nối miền Bắc với miền Nam trong kháng chiến chống Mỹ gọi là:",
    "options": [
      {
        "key": "A",
        "text": "đường Hồ Chí Minh trên bộ (đường Trường Sơn)"
      },
      {
        "key": "B",
        "text": "quốc lộ 1A"
      },
      {
        "key": "C",
        "text": "đường sắt Bắc – Nam"
      },
      {
        "key": "D",
        "text": "đường Hàng Không Việt Nam"
      }
    ],
    "answer": "A",
    "explanation": "Đường Trường Sơn (đường Hồ Chí Minh trên bộ) cùng đường Hồ Chí Minh trên biển là tuyến chi viện chiến lược.",
    "points": 0.25,
    "tags": [
      "kháng chiến chống Mỹ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-17",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Ngày 2/9/1945, Chủ tịch Hồ Chí Minh đọc bản Tuyên ngôn Độc lập. Ý nghĩa quan trọng nhất của văn bản này là:",
    "options": [
      {
        "key": "A",
        "text": "chính thức tuyên bố với thế giới về việc khai sinh nước Việt Nam Dân chủ Cộng hòa, xác lập nền độc lập của dân tộc"
      },
      {
        "key": "B",
        "text": "tuyên bố kết thúc Chiến tranh thế giới thứ hai"
      },
      {
        "key": "C",
        "text": "tuyên bố thành lập Mặt trận Việt Minh"
      },
      {
        "key": "D",
        "text": "khai mạc cuộc bầu cử quốc hội đầu tiên"
      }
    ],
    "answer": "A",
    "explanation": "Tuyên ngôn Độc lập tuyên bố với toàn thế giới quyền độc lập của dân tộc Việt Nam, khai sinh nhà nước mới.",
    "points": 0.25,
    "tags": [
      "Tuyên ngôn Độc lập",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-18",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Hiệp định Pari về chấm dứt chiến tranh, lập lại hòa bình ở Việt Nam (27/1/1973) có ý nghĩa:",
    "options": [
      {
        "key": "A",
        "text": "buộc Mỹ rút quân và chấm dứt mọi hoạt động quân sự trên toàn bộ lãnh thổ Việt Nam ngay lập tức"
      },
      {
        "key": "B",
        "text": "thống nhất đất nước ngay sau đó"
      },
      {
        "key": "C",
        "text": "dẫn đến việc Mỹ rút hết quân và chấm dứt can thiệp quân sự vào miền Nam, mở đường cho nhân dân miền Nam tự giải phóng"
      },
      {
        "key": "D",
        "text": "chia đôi đất nước vĩnh viễn"
      }
    ],
    "answer": "C",
    "explanation": "Hiệp định Pari buộc Mỹ rút hết quân, chấm dứt can thiệp quân sự; tuy nhiên Mỹ vẫn gây khó khăn, miền Nam vẫn còn chính quyền Sài Gòn.",
    "points": 0.25,
    "tags": [
      "hiệp định Pari",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-19",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Đại hội V Quốc tế Cộng sản (1924) đưa ra quan điểm quan trọng về cách mạng thuộc địa là:",
    "options": [
      {
        "key": "A",
        "text": "cách mạng thuộc địa không quan trọng với cách mạng vô sản"
      },
      {
        "key": "B",
        "text": "cách mạng giải phóng dân tộc ở thuộc địa là bộ phận của cách mạng vô sản thế giới"
      },
      {
        "key": "C",
        "text": "cách mạng thuộc địa phải chờ cách mạng vô sản thắng lợi ở chính quốc"
      },
      {
        "key": "D",
        "text": "cách mạng thuộc địa chỉ dùng con đường cải cách"
      }
    ],
    "answer": "B",
    "explanation": "Đại hội V khẳng định phong trào giải phóng dân tộc ở thuộc địa là bộ phận hợp thành của cách mạng vô sản thế giới.",
    "points": 0.25,
    "tags": [
      "quốc tế Cộng sản",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-20",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cuộc Tổng tiến công và nổi dậy mùa xuân 1975 giải phóng hoàn toàn Sài Gòn vào ngày:",
    "options": [
      {
        "key": "A",
        "text": "26/3/1975"
      },
      {
        "key": "B",
        "text": "30/4/1975"
      },
      {
        "key": "C",
        "text": "13/3/1975"
      },
      {
        "key": "D",
        "text": "21/4/1975"
      }
    ],
    "answer": "B",
    "explanation": "Ngày 30/4/1975, lá cờ cách mạng tung bay trên Dinh Độc Lập, giải phóng hoàn toàn miền Nam.",
    "points": 0.25,
    "tags": [
      "mùa xuân 1975",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-21",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Việt Nam chính thức trở thành thành viên thứ 150 của Tổ chức Thương mại Thế giới (WTO) vào:",
    "options": [
      {
        "key": "A",
        "text": "1995"
      },
      {
        "key": "B",
        "text": "2007"
      },
      {
        "key": "C",
        "text": "2012"
      },
      {
        "key": "D",
        "text": "2000"
      }
    ],
    "answer": "B",
    "explanation": "Việt Nam gia nhập WTO ngày 11/1/2007, tạo cú hích cho hội nhập kinh tế quốc tế.",
    "points": 0.25,
    "tags": [
      "hội nhập quốc tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-22",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Nguồn gốc chữ viết tượng hình của người Ai Cập cổ đại được khắc chủ yếu ở:",
    "options": [
      {
        "key": "A",
        "text": "trên da thú"
      },
      {
        "key": "B",
        "text": "trên giấy bản"
      },
      {
        "key": "C",
        "text": "trên vách đá và đền miếu, sau đó trên giấy papyrus"
      },
      {
        "key": "D",
        "text": "trên tre, nứa"
      }
    ],
    "answer": "C",
    "explanation": "Người Ai Cập khắc chữ tượng hình trên vách đá, đền miếu, trên bia đá và giấy papyrus.",
    "points": 0.25,
    "tags": [
      "văn minh Ai Cập",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-23",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Nghị quyết Hội nghị Trung ương 8 (5/1941) đánh dấu bước chuyển trọng yếu của cách mạng Việt Nam vì:",
    "options": [
      {
        "key": "A",
        "text": "tạm hoãn không chuẩn bị khởi nghĩa vũ trang"
      },
      {
        "key": "B",
        "text": "chuyển việc giải phóng dân tộc sang giải quyết mâu thuẫn giai cấp làm nhiệm vụ hàng đầu"
      },
      {
        "key": "C",
        "text": "đề ra không thành lập mặt trận đoàn kết dân tộc"
      },
      {
        "key": "D",
        "text": "đặt nhiệm vụ giải phóng dân tộc lên hàng đầu, thành lập Mặt trận Việt Minh, chuẩn bị cho khởi nghĩa vũ trang giành độc lập"
      }
    ],
    "answer": "D",
    "explanation": "Nghị quyết TW 8 (5/1941) chuyển hướng chỉ đạo chiến lược: giải quyết mâu thuẫn dân tộc, thành lập Việt Minh, chuẩn bị khởi nghĩa.",
    "points": 0.25,
    "tags": [
      "nghị quyết TW 8",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-24",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Tác động chủ yếu của cuộc khủng hoảng kinh tế 1929 – 1933 đối với Đông Dương là:",
    "options": [
      {
        "key": "A",
        "text": "Pháp trút gánh nặng khủng hoảng lên thuộc địa, tăng thuế, vơ vét bóc lột khiến đời sống nhân dân Đông Dương cực khổ, mâu thuẫn xã hội ngày càng gay gắt"
      },
      {
        "key": "B",
        "text": "kinh tế Đông Dương phát triển rực rỡ"
      },
      {
        "key": "C",
        "text": "Pháp trao trả độc lập cho Đông Dương"
      },
      {
        "key": "D",
        "text": "Mua bán trên thị trường Đông Dương trở nên dễ dàng hơn"
      }
    ],
    "answer": "A",
    "explanation": "Khủng hoảng 1929 – 1933 khiến Pháp đẩy mạnh khai thác thuộc địa lần thứ hai, đời sống nhân dân Đông Dương hết sức cực khổ.",
    "points": 0.25,
    "tags": [
      "khủng hoảng kinh tế 1929–1933",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-25",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Đọc tư liệu sau: \"Hỡi đồng bào cả nước! Tất cả mọi người đều sinh ra có quyền bình đẳng. Tạo hóa cho họ những quyền không ai có thể xâm phạm được; trong những quyền ấy, có quyền được sống, quyền tự do và quyền mưu cầu hạnh phúc. Lời bất hủ ấy ở trong bản Tuyên ngôn Độc lập năm 1776 của nước Mĩ. [...] Bản Tuyên ngôn Nhân quyền và Dân quyền của Cách mạng Pháp năm 1791 cũng nói: Người ta sinh ra tự do và bình đẳng về quyền lợi; và phải luôn luôn được tự do và bình đẳng về quyền lợi.\"\n\n(Trích Tuyên ngôn Độc lập đọc ngày 2/9/1945). Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Bản Tuyên ngôn Độc lập được tuyên đọc ngày 2/9/1945 tại Quảng trường Ba Đình, Hà Nội."
      },
      {
        "key": "b",
        "text": "Phần mở đầu của Tuyên ngôn trích dẫn Tuyên ngôn Độc lập của nước Mỹ (1776) và Tuyên ngôn Nhân quyền và Dân quyền của Pháp (1791)."
      },
      {
        "key": "c",
        "text": "Bản Tuyên ngôn mở đầu bằng việc liệt kê tội ác của thực dân Pháp."
      },
      {
        "key": "d",
        "text": "Bản Tuyên ngôn khẳng định dân tộc Việt Nam có quyền hưởng tự do và độc lập."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng. b) Đúng. c) Sai: sau phần trích dẫn quyền con người mới là phần vạch tội ác thực dân Pháp. d) Đúng.",
    "points": 1,
    "tags": [
      "Tuyên ngôn Độc lập",
      "tư liệu",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-26",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Đọc tư liệu: \"Đại hội đại biểu toàn quốc lần thứ VI của Đảng (tháng 12 năm 1986) đã đề ra đường lối đổi mới toàn diện, coi đổi mới kinh tế là trọng tâm, đổi mới chính trị từng bước thận trọng và đúng lúc.\" (Bài trích).\n\nXét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Đại hội VI diễn ra vào tháng 12/1986, khởi xướng công cuộc đổi mới."
      },
      {
        "key": "b",
        "text": "Đại hội VI chỉ tập trung đổi mới văn hóa – xã hội, không đề cập đến kinh tế."
      },
      {
        "key": "c",
        "text": "Theo đường lối Đại hội VI, đổi mới chính trị được tiến hành trước, đổi mới kinh tế sau."
      },
      {
        "key": "d",
        "text": "Đại hội VII (6/1991) tiếp tục thực hiện đường lối đổi mới theo Cương lĩnh xây dựng đất nước trong thời kì quá độ lên chủ nghĩa xã hội."
      }
    ],
    "answer": "ĐSSĐ",
    "explanation": "a) Đúng. b) Sai: đổi mới kinh tế là trọng tâm. c) Sai: đổi mới kinh tế làm trọng tâm, đổi mới chính trị từng bước thận trọng. d) Đúng.",
    "points": 1,
    "tags": [
      "đổi mới",
      "tư liệu",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-27",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Đọc tư liệu: \"Cách mạng vô sản ở các nước tư bản không thể thành công nếu không liên minh với phong trào giải phóng dân tộc ở thuộc địa.\" (Tinh thần Đại hội V Quốc tế Cộng sản, 1924).\n\nXét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Đại hội V Quốc tế Cộng sản diễn ra năm 1919 tại Mát-xcơ-va."
      },
      {
        "key": "b",
        "text": "Theo tinh thần tư liệu, cách mạng giải phóng dân tộc ở thuộc địa là bộ phận của cách mạng vô sản thế giới."
      },
      {
        "key": "c",
        "text": "Quốc tế Cộng sản xem nhẹ phong trào giải phóng dân tộc ở thuộc địa."
      },
      {
        "key": "d",
        "text": "Tinh thần Đại hội V đã tác động đến việc Nguyễn Ái Quốc lựa chọn con đường cách mạng vô sản để giải phóng dân tộc Việt Nam."
      }
    ],
    "answer": "SĐSĐ",
    "explanation": "a) Sai: Đại hội V diễn ra năm 1924 (Đại hội II năm 1920). b) Đúng. c) Sai: Quốc tế Cộng sản coi trọng phong trào thuộc địa. d) Đúng.",
    "points": 1,
    "tags": [
      "quốc tế Cộng sản",
      "tư liệu",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-28",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Đọc tư liệu: \"Trong cuộc cách mạng công nghiệp lần thứ nhất, máy hơi nước do J. Watt hoàn thiện trở thành động lực mới thay thế sức người và súc vật, đưa nền sản xuất xã hội bước vào thời đại máy móc.\" (Bài trích).\n\nXét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Cách mạng công nghiệp lần thứ nhất bắt đầu từ nước Anh vào nửa sau thế kỉ XVIII."
      },
      {
        "key": "b",
        "text": "Máy hơi nước hoàn thiện của J. Watt là thành tựu tiêu biểu của cách mạng công nghiệp lần thứ nhất."
      },
      {
        "key": "c",
        "text": "Điện năng là nguồn động lực chủ yếu trong cách mạng công nghiệp lần thứ nhất."
      },
      {
        "key": "d",
        "text": "Cách mạng công nghiệp làm xuất hiện hai giai cấp mới là giai cấp tư sản và giai cấp vô sản, thúc đẩy đô thị hóa."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng. b) Đúng. c) Sai: động lực chủ yếu là hơi nước (điện mới là của cách mạng lần thứ hai). d) Đúng.",
    "points": 1,
    "tags": [
      "cách mạng công nghiệp",
      "tư liệu",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-29",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Đọc tư liệu: \"Chiến dịch Điện Biên Phủ bắt đầu ngày 13/3/1954 và kết thúc với chiến thắng hoàn toàn ngày 7/5/1954, làm rung chuyển công luận thế giới.\" (Bài trích).\n\nXét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Chiến dịch Điện Biên Phủ bắt đầu diễn ra ngày 13/3/1954."
      },
      {
        "key": "b",
        "text": "Chiến dịch Điện Biên Phủ chỉ diễn ra trong hai đợt tiến công."
      },
      {
        "key": "c",
        "text": "Điện Biên Phủ là một chiến dịch quy mô nhỏ, chỉ diễn ra trong một đêm."
      },
      {
        "key": "d",
        "text": "Chiến thắng Điện Biên Phủ buộc Pháp phải kí Hiệp định Giơnev, chấm dứt chiến tranh xâm lược ở Đông Dương."
      }
    ],
    "answer": "ĐSSĐ",
    "explanation": "a) Đúng. b) Sai: chiến dịch diễn ra trong ba đợt tiến công (13/3, 30/3, 1/5). c) Sai: chiến dịch kéo dài 56 ngày đêm với quy mô lớn. d) Đúng.",
    "points": 1,
    "tags": [
      "Điện Biên Phủ",
      "tư liệu",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-su-30",
    "subject": "Lịch sử",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Đọc tư liệu: \"Hội nhập quốc tế là quá trình mở rộng quan hệ, thực hiện đa phương hóa, đa dạng hóa các mối quan hệ đối ngoại; Việt Nam chủ động và tích cực hội nhập, song giữ vững độc lập, tự chủ.\" (Bài trích).\n\nXét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Việt Nam gia nhập Hiệp hội các quốc gia Đông Nam Á (ASEAN) năm 1995."
      },
      {
        "key": "b",
        "text": "Việt Nam gia nhập Tổ chức Thương mại Thế giới (WTO) năm 2007."
      },
      {
        "key": "c",
        "text": "Hội nhập quốc tế đòi hỏi Việt Nam từ bỏ hoàn toàn chính sách độc lập, tự chủ."
      },
      {
        "key": "d",
        "text": "Hội nhập quốc tế giúp Việt Nam mở rộng quan hệ, thu hút đầu tư và tham gia phân công lao động quốc tế."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng (28/7/1995). b) Đúng (11/1/2007). c) Sai: hội nhập trên cơ sở giữ vững độc lập, tự chủ. d) Đúng.",
    "points": 1,
    "tags": [
      "hội nhập quốc tế",
      "tư liệu",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-tin-01",
    "subject": "Tin học",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong ngôn ngữ Python, kết quả của biểu thức len(\"Python\") là:",
    "options": [
      {
        "key": "A",
        "text": "5"
      },
      {
        "key": "B",
        "text": "6"
      },
      {
        "key": "C",
        "text": "7"
      },
      {
        "key": "D",
        "text": "4"
      }
    ],
    "answer": "B",
    "explanation": "Chuỗi \"Python\" có 6 kí tự nên len trả về 6.",
    "points": 0.25,
    "tags": [
      "Python",
      "xâu kí tự",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-tin-02",
    "subject": "Tin học",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Kiểu dữ liệu dùng để lưu số nguyên trong Python là:",
    "options": [
      {
        "key": "A",
        "text": "int"
      },
      {
        "key": "B",
        "text": "str"
      },
      {
        "key": "C",
        "text": "bool"
      },
      {
        "key": "D",
        "text": "list"
      }
    ],
    "answer": "A",
    "explanation": "Kiểu int (integer) lưu số nguyên; float lưu số thực, str lưu xâu, bool lưu giá trị đúng/sai.",
    "points": 0.25,
    "tags": [
      "Python",
      "kiểu dữ liệu",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-tin-03",
    "subject": "Tin học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong SQL, câu lệnh dùng để truy vấn dữ liệu từ bảng Students là:",
    "options": [
      {
        "key": "A",
        "text": "INSERT INTO Students"
      },
      {
        "key": "B",
        "text": "UPDATE Students"
      },
      {
        "key": "C",
        "text": "DELETE FROM Students"
      },
      {
        "key": "D",
        "text": "SELECT * FROM Students"
      }
    ],
    "answer": "D",
    "explanation": "SELECT là câu lệnh truy vấn dữ liệu; INSERT thêm, UPDATE sửa, DELETE xóa.",
    "points": 0.25,
    "tags": [
      "SQL",
      "truy vấn",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-tin-04",
    "subject": "Tin học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Thẻ HTML dùng để tạo liên kết siêu văn bản (siêu liên kết) tới một trang khác là:",
    "options": [
      {
        "key": "A",
        "text": "<p>"
      },
      {
        "key": "B",
        "text": "<img>"
      },
      {
        "key": "C",
        "text": "<a>"
      },
      {
        "key": "D",
        "text": "<div>"
      }
    ],
    "answer": "C",
    "explanation": "Thẻ <a href=\"...\"> tạo liên kết; <p> đoạn văn, <img> ảnh, <div> khối nội dung.",
    "points": 0.25,
    "tags": [
      "HTML",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-tin-05",
    "subject": "Tin học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Mỗi thiết bị tham gia mạng Internet đều cần có:",
    "options": [
      {
        "key": "A",
        "text": "tên miền riêng của mình"
      },
      {
        "key": "B",
        "text": "một địa chỉ IP duy nhất"
      },
      {
        "key": "C",
        "text": "một màu sắc riêng"
      },
      {
        "key": "D",
        "text": "một mật khẩu mặc định giống nhau"
      }
    ],
    "answer": "B",
    "explanation": "Địa chỉ IP (duy nhất trong mạng) giúp nhận diện và định tuyến dữ liệu tới đúng thiết bị.",
    "points": 0.25,
    "tags": [
      "mạng máy tính",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-tin-06",
    "subject": "Tin học",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Xét đoạn chương trình Python:\n\nfor i in range(3):\n    print(i)\n\nKết quả in ra màn hình là:",
    "options": [
      {
        "key": "A",
        "text": "1 2 3 (mỗi số một dòng)"
      },
      {
        "key": "B",
        "text": "0 1 2 3 (mỗi số một dòng)"
      },
      {
        "key": "C",
        "text": "0 1 2 (mỗi số một dòng)"
      },
      {
        "key": "D",
        "text": "1 2 (mỗi số một dòng)"
      }
    ],
    "answer": "C",
    "explanation": "range(3) sinh các giá trị 0, 1, 2.",
    "points": 0.25,
    "tags": [
      "Python",
      "vòng lặp",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-tin-07",
    "subject": "Tin học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong câu truy vấn SQL, mệnh đề WHERE có vai trò:",
    "options": [
      {
        "key": "A",
        "text": "lọc các bản ghi thỏa mãn điều kiện"
      },
      {
        "key": "B",
        "text": "sắp xếp kết quả theo thứ tự"
      },
      {
        "key": "C",
        "text": "đếm số bản ghi"
      },
      {
        "key": "D",
        "text": "xóa bảng"
      }
    ],
    "answer": "A",
    "explanation": "WHERE đặt điều kiện để chọn bản ghi thỏa mãn; ORDER BY mới dùng để sắp xếp.",
    "points": 0.25,
    "tags": [
      "SQL",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-tin-08",
    "subject": "Tin học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong CSS, khai báo color: red; có tác dụng:",
    "options": [
      {
        "key": "A",
        "text": "thay đổi kích thước chữ"
      },
      {
        "key": "B",
        "text": "căn lề đoạn văn"
      },
      {
        "key": "C",
        "text": "thêm khung viền"
      },
      {
        "key": "D",
        "text": "đổi màu chữ của phần tử"
      }
    ],
    "answer": "D",
    "explanation": "Thuộc tính color quy định màu chữ; font-size là kích thước, margin là lề, border là viền.",
    "points": 0.25,
    "tags": [
      "CSS",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-tin-09",
    "subject": "Tin học",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong Python, kết quả của biểu thức 7 // 2 là:",
    "options": [
      {
        "key": "A",
        "text": "3,5"
      },
      {
        "key": "B",
        "text": "4"
      },
      {
        "key": "C",
        "text": "3"
      },
      {
        "key": "D",
        "text": "1"
      }
    ],
    "answer": "C",
    "explanation": "Phép chia nguyên // lấy phần nguyên của 7/2 = 3.",
    "points": 0.25,
    "tags": [
      "Python",
      "toán tử",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-tin-10",
    "subject": "Tin học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Mật khẩu an toàn nên có đặc điểm:",
    "options": [
      {
        "key": "A",
        "text": "dùng ngày sinh của mình để dễ nhớ"
      },
      {
        "key": "B",
        "text": "dài, kết hợp chữ hoa – chữ thường – số – kí tự đặc biệt, không dùng thông tin cá nhân"
      },
      {
        "key": "C",
        "text": "dùng chung một mật khẩu cho mọi tài khoản"
      },
      {
        "key": "D",
        "text": "dùng tên thật của mình"
      }
    ],
    "answer": "B",
    "explanation": "Mật khẩu mạnh phải dài, phức tạp, khó đoán và không chứa thông tin cá nhân.",
    "points": 0.25,
    "tags": [
      "an toàn số",
      "mật khẩu",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-tin-11",
    "subject": "Tin học",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong Python, cho biến s = \"Tin hoc\". Giá trị của s[0] là:",
    "options": [
      {
        "key": "A",
        "text": "\"T\""
      },
      {
        "key": "B",
        "text": "\"i\""
      },
      {
        "key": "C",
        "text": "\"Tin\""
      },
      {
        "key": "D",
        "text": "\"n\""
      }
    ],
    "answer": "A",
    "explanation": "Chỉ số kí tự trong xâu bắt đầu từ 0 nên s[0] là kí tự đầu tiên \"T\".",
    "points": 0.25,
    "tags": [
      "Python",
      "xâu kí tự",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-tin-12",
    "subject": "Tin học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Hàm COUNT(*) trong SQL dùng để:",
    "options": [
      {
        "key": "A",
        "text": "tính giá trị trung bình"
      },
      {
        "key": "B",
        "text": "tìm giá trị lớn nhất"
      },
      {
        "key": "C",
        "text": "tính tổng các giá trị"
      },
      {
        "key": "D",
        "text": "đếm số dòng (bản ghi) thỏa mãn điều kiện"
      }
    ],
    "answer": "D",
    "explanation": "COUNT(*) đếm số bản ghi trong bảng hoặc trong nhóm thỏa mãn điều kiện truy vấn.",
    "points": 0.25,
    "tags": [
      "SQL",
      "hàm thống kê",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-tin-13",
    "subject": "Tin học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cặp thẻ <ul> ... </ul> kết hợp với <li> ... </li> trong HTML dùng để tạo:",
    "options": [
      {
        "key": "A",
        "text": "bảng dữ liệu"
      },
      {
        "key": "B",
        "text": "ảnh minh họa"
      },
      {
        "key": "C",
        "text": "danh sách không có thứ tự (gạch đầu dòng)"
      },
      {
        "key": "D",
        "text": "biểu mẫu nhập liệu"
      }
    ],
    "answer": "C",
    "explanation": "<ul> tạo danh sách gạch đầu dòng; <ol> tạo danh sách có đánh số.",
    "points": 0.25,
    "tags": [
      "HTML",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-tin-14",
    "subject": "Tin học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Nhận định đúng về giao thức HTTPS so với HTTP là:",
    "options": [
      {
        "key": "A",
        "text": "HTTP an toàn hơn HTTPS"
      },
      {
        "key": "B",
        "text": "HTTPS mã hóa dữ liệu trao đổi (TLS/SSL), bảo mật hơn HTTP"
      },
      {
        "key": "C",
        "text": "HTTPS không bảo mật và luôn chậm hơn"
      },
      {
        "key": "D",
        "text": "Hai giao thức hoàn toàn giống nhau"
      }
    ],
    "answer": "B",
    "explanation": "HTTPS sử dụng TLS/SSL để mã hóa dữ liệu truyền giữa trình duyệt và máy chủ.",
    "points": 0.25,
    "tags": [
      "mạng máy tính",
      "an toàn số",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-tin-15",
    "subject": "Tin học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Xét đoạn chương trình Python:\n\ntotal = 0\nfor i in range(1, 5):\n    total += i\nprint(total)\n\nKết quả in ra là:",
    "options": [
      {
        "key": "A",
        "text": "4"
      },
      {
        "key": "B",
        "text": "15"
      },
      {
        "key": "C",
        "text": "10"
      },
      {
        "key": "D",
        "text": "5"
      }
    ],
    "answer": "C",
    "explanation": "range(1, 5) cho 1, 2, 3, 4; tổng 1+2+3+4 = 10.",
    "points": 0.25,
    "tags": [
      "Python",
      "vòng lặp",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-tin-16",
    "subject": "Tin học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Đoạn thuật toán tìm giá trị lớn nhất trong danh sách gồm n phần tử (duyệt từng phần tử, so sánh với giá trị lớn nhất hiện tại) cần thực hiện số phép so sánh ở mức:",
    "options": [
      {
        "key": "A",
        "text": "n – 1"
      },
      {
        "key": "B",
        "text": "n"
      },
      {
        "key": "C",
        "text": "n + 1"
      },
      {
        "key": "D",
        "text": "n²"
      }
    ],
    "answer": "A",
    "explanation": "Phần tử đầu tiên làm giá trị khởi tạo, còn n – 1 phần tử còn lại mỗi phần tử cần một phép so sánh.",
    "points": 0.25,
    "tags": [
      "thuật toán",
      "hiệu quả",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-tin-17",
    "subject": "Tin học",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Xét đoạn chương trình Python sau:\n\nx = 10\ny = 3\nprint(x // y)\nprint(x % y)\n\nXét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Lệnh print(x // y) in ra giá trị 3."
      },
      {
        "key": "b",
        "text": "Lệnh print(x % y) in ra giá trị 1."
      },
      {
        "key": "c",
        "text": "Lệnh print(x / y) in ra giá trị 3."
      },
      {
        "key": "d",
        "text": "Nếu thay y = 0 thì lệnh print(x / y) vẫn thực hiện bình thường, không báo lỗi."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) Đúng: 10 // 3 = 3. b) Đúng: 10 % 3 = 1. c) Sai: 10 / 3 = 3,333... (số thực). d) Sai: chia cho 0 gây lỗi ZeroDivisionError.",
    "points": 1,
    "tags": [
      "Python",
      "toán tử",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-tin-18",
    "subject": "Tin học",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cho bảng CSDL Students(id, name, class, mark). Xét tính đúng sai của các khẳng định sau về câu lệnh SQL:",
    "options": [
      {
        "key": "a",
        "text": "SELECT name FROM Students WHERE mark > 8 trả về tên các học sinh có điểm lớn hơn 8."
      },
      {
        "key": "b",
        "text": "SELECT * FROM Students trả về tất cả các cột của tất cả các bản ghi."
      },
      {
        "key": "c",
        "text": "UPDATE Students SET mark = 10 WHERE id = 1 không thể thay đổi dữ liệu trong bảng."
      },
      {
        "key": "d",
        "text": "DELETE FROM Students (không có WHERE) xóa toàn bộ các bản ghi của bảng."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng. b) Đúng: dấu * đại diện cho tất cả các cột. c) Sai: UPDATE dùng để sửa dữ liệu, câu trên đổi điểm của học sinh id = 1 thành 10. d) Đúng: DELETE không kèm WHERE xóa toàn bộ các bản ghi của bảng.",
    "points": 1,
    "tags": [
      "SQL",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-tin-19",
    "subject": "Tin học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Tình huống: Lan nhận được một email từ địa chỉ lạ, giả danh ngân hàng, yêu cầu cô nhấp vào đường dẫn và cung cấp mật khẩu để \"kiểm tra tài khoản\". Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Email này có khả năng cao là lừa đảo qua mạng (phishing)."
      },
      {
        "key": "b",
        "text": "Lan không nên nhấp vào đường dẫn hay cung cấp mật khẩu qua email."
      },
      {
        "key": "c",
        "text": "Cách xử lí tốt nhất là gửi ngay mật khẩu để kiểm tra theo yêu cầu."
      },
      {
        "key": "d",
        "text": "Lan nên báo cho người phụ trách (giáo viên, ngân hàng chính thức) và không chia sẻ thông tin cá nhân."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: yêu cầu mật khẩu qua email là dấu hiệu lừa đảo điển hình. b) Đúng. c) Sai: tuyệt đối không cung cấp mật khẩu. d) Đúng.",
    "points": 1,
    "tags": [
      "an toàn số",
      "lừa đảo",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-tin-20",
    "subject": "Tin học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Xét các phát biểu về HTML và CSS. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Nội dung của thẻ <title> hiển thị trên thanh tiêu đề của trình duyệt (tab)."
      },
      {
        "key": "b",
        "text": "CSS chỉ có thể được viết trong một file .css riêng, không thể viết ngay trong file HTML."
      },
      {
        "key": "c",
        "text": "Thẻ <img> cần thuộc tính src để chỉ ra đường dẫn của ảnh."
      },
      {
        "key": "d",
        "text": "Mọi trang web trên Internet bắt buộc phải dùng cùng một kiểu chữ (font)."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng. b) Sai: CSS có thể viết inline, trong thẻ <style>, hoặc file .css riêng. c) Đúng. d) Sai: mỗi trang web có thể chọn font riêng.",
    "points": 1,
    "tags": [
      "HTML",
      "CSS",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-a-01",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Số đường tiệm cận của đồ thị hàm số $y=\\frac{2x+1}{x-3}$ là:",
    "options": [
      {
        "key": "A",
        "text": "0"
      },
      {
        "key": "B",
        "text": "1"
      },
      {
        "key": "C",
        "text": "3"
      },
      {
        "key": "D",
        "text": "2"
      }
    ],
    "answer": "D",
    "explanation": "Đồ thị có tiệm cận đứng $x=3$ (do mẫu bằng 0 khi $x=3$, tử tại đó khác 0) và tiệm cận ngang $y=2$. Tổng cộng 2 đường.",
    "points": 0.25,
    "tags": [
      "tiệm cận",
      "hàm phân thức",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-a-02",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Hàm số $y=x^4-2x^2+1$ có bao nhiêu điểm cực tiểu?",
    "options": [
      {
        "key": "A",
        "text": "0"
      },
      {
        "key": "B",
        "text": "2"
      },
      {
        "key": "C",
        "text": "1"
      },
      {
        "key": "D",
        "text": "3"
      }
    ],
    "answer": "B",
    "explanation": "$y'=4x^3-4x=4x(x-1)(x+1)$ đổi dấu từ $-$ sang $+$ tại $x=\\pm 1$, nên hàm số có 2 điểm cực tiểu.",
    "points": 0.25,
    "tags": [
      "cực trị",
      "hàm trùng phương",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-a-03",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong các hàm số sau, hàm số nào không có cực trị?",
    "options": [
      {
        "key": "A",
        "text": "$y=x^3+3x$"
      },
      {
        "key": "B",
        "text": "$y=x^3-3x+2$"
      },
      {
        "key": "C",
        "text": "$y=x^4-4x^2+1$"
      },
      {
        "key": "D",
        "text": "$y=-x^4+2x^2$"
      }
    ],
    "answer": "A",
    "explanation": "$y'=3x^2+3>0$ với mọi $x$ nên $y=x^3+3x$ đồng biến trên $\\mathbb{R}$, không có cực trị. Ba hàm còn lại đều có đạo hàm đổi dấu.",
    "points": 0.25,
    "tags": [
      "cực trị",
      "đạo hàm",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-a-04",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hàm số $y=f(x)$ có bảng biến thiên như hình bên dưới. Hàm số đạt cực đại tại:",
    "options": [
      {
        "key": "A",
        "text": "$x=2$"
      },
      {
        "key": "B",
        "text": "$x=1$"
      },
      {
        "key": "C",
        "text": "$x=0$"
      },
      {
        "key": "D",
        "text": "$x=-2$"
      }
    ],
    "answer": "C",
    "explanation": "Bảng biến thiên cho thấy $y'$ đổi dấu từ $+$ sang $-$ khi qua $x=0$, nên hàm số đạt cực đại tại $x=0$.",
    "points": 0.25,
    "tags": [
      "bảng biến thiên",
      "cực trị",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "vartable",
      "expr": "x^3-3x^2",
      "fname": "y"
    }
  },
  {
    "id": "thpt-toan-a-05",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Số đường tiệm cận đứng của đồ thị hàm số $y=\\frac{x^2-1}{x^2-4}$ là:",
    "options": [
      {
        "key": "A",
        "text": "0"
      },
      {
        "key": "B",
        "text": "1"
      },
      {
        "key": "C",
        "text": "2"
      },
      {
        "key": "D",
        "text": "3"
      }
    ],
    "answer": "C",
    "explanation": "Mẫu $x^2-4=0\\Leftrightarrow x=\\pm 2$, tại đó tử khác 0 và phân thức không rút gọn được, nên đồ thị có 2 tiệm cận đứng $x=\\pm 2$.",
    "points": 0.25,
    "tags": [
      "tiệm cận",
      "hàm phân thức",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-a-06",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Với tất cả các giá trị thực của tham số $m$, đường thẳng $y=x+m$ cắt đồ thị hàm số $y=x^3-3x$ tại ba điểm phân biệt khi:",
    "options": [
      {
        "key": "A",
        "text": "$m\\in\\left(-\\frac{16\\sqrt{3}}{9};\\frac{16\\sqrt{3}}{9}\\right)$"
      },
      {
        "key": "B",
        "text": "$m\\in\\left(-\\frac{16}{9};\\frac{16}{9}\\right)$"
      },
      {
        "key": "C",
        "text": "$m\\in\\left(-\\frac{16\\sqrt{3}}{3};\\frac{16\\sqrt{3}}{3}\\right)$"
      },
      {
        "key": "D",
        "text": "$m\\in\\left(-\\infty;\\frac{16\\sqrt{3}}{9}\\right)$"
      }
    ],
    "answer": "A",
    "explanation": "Phương trình $x^3-3x=x+m\\Leftrightarrow g(x)=x^3-4x-m=0$ có 3 nghiệm phân biệt $\\Leftrightarrow$ giá trị lớn nhất $\\frac{16\\sqrt{3}}{9}-m>0$ và giá trị nhỏ nhất $-\\frac{16\\sqrt{3}}{9}-m<0$ (với $g'$ có nghiệm $x=\\pm\\frac{2\\sqrt{3}}{3}$) $\\Leftrightarrow m\\in\\left(-\\frac{16\\sqrt{3}}{9};\\frac{16\\sqrt{3}}{9}\\right)$.",
    "points": 0.25,
    "tags": [
      "giao điểm",
      "tham số m",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-a-07",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một xí nghiệp sản xuất tối đa 60 sản phẩm mỗi ngày. Khi sản xuất $x$ sản phẩm ($0\\le x\\le 60$), chi phí là $C(x)=x^2+20x+400$ (nghìn đồng) và toàn bộ sản phẩm được bán hết với giá 100 nghìn đồng mỗi sản phẩm. Xí nghiệp cần sản xuất bao nhiêu sản phẩm mỗi ngày để lợi nhuận lớn nhất?",
    "options": [
      {
        "key": "A",
        "text": "20"
      },
      {
        "key": "B",
        "text": "40"
      },
      {
        "key": "C",
        "text": "30"
      },
      {
        "key": "D",
        "text": "50"
      }
    ],
    "answer": "B",
    "explanation": "Lợi nhuận $P(x)=100x-C(x)=-x^2+80x-400$, đạt giá trị lớn nhất tại $x=-\\frac{80}{2(-1)}=40$ với $P(40)=1200$ nghìn đồng.",
    "points": 0.25,
    "tags": [
      "bài toán tối ưu",
      "lợi nhuận",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-a-08",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Số đường tiệm cận của đồ thị hàm số $y=\\frac{x^2+2x-3}{x-1}$ là:",
    "options": [
      {
        "key": "A",
        "text": "0"
      },
      {
        "key": "B",
        "text": "1"
      },
      {
        "key": "C",
        "text": "2"
      },
      {
        "key": "D",
        "text": "3"
      }
    ],
    "answer": "A",
    "explanation": "Tử $x^2+2x-3=(x+3)(x-1)$ nên hàm số bằng $x+3$ với $x\\ne 1$. Giới hạn của hàm số khi $x\\to 1$ bằng 4 (hữu hạn) nên $x=1$ không phải tiệm cận đứng; hàm bậc nhất không có tiệm cận ngang. Đồ thị là đường thẳng $y=x+3$ bị rỗng một điểm, không có tiệm cận nào.",
    "points": 0.25,
    "tags": [
      "tiệm cận",
      "hàm phân thức",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-a-09",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hàm số $f(x)=x^3-3x^2+1$. Có bao nhiêu giá trị nguyên của tham số $m$ để phương trình $f(|x|)=m$ có đúng bốn nghiệm thực phân biệt?",
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "5"
      }
    ],
    "answer": "B",
    "explanation": "Đặt $t=|x|\\ge 0$, xét $h(t)=t^3-3t^2+1$: nghịch biến trên $(0;2)$ từ 1 xuống $-3$, đồng biến trên $(2;+\\infty)$. $f(|x|)=m$ có 4 nghiệm $\\Leftrightarrow h(t)=m$ có đúng 2 nghiệm dương $\\Leftrightarrow -3<m<1$, gồm các giá trị nguyên $m\\in\\{-2;-1;0\\}$: 3 giá trị.",
    "points": 0.25,
    "tags": [
      "hàm số chứa dấu giá trị tuyệt đối",
      "tham số m",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-a-10",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Đồ thị hàm số $y=x^3+3x^2-9x+1$ có điểm cực đại tại:",
    "options": [
      {
        "key": "A",
        "text": "$x=1$"
      },
      {
        "key": "B",
        "text": "$x=3$"
      },
      {
        "key": "C",
        "text": "$x=-1$"
      },
      {
        "key": "D",
        "text": "$x=-3$"
      }
    ],
    "answer": "D",
    "explanation": "$y'=3x^2+6x-9=3(x+3)(x-1)$ đổi dấu từ $+$ sang $-$ khi qua $x=-3$, nên điểm cực đại có hoành độ $x=-3$.",
    "points": 0.25,
    "tags": [
      "cực trị",
      "hàm bậc ba",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-a-11",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hàm số $y=f(x)$ có đạo hàm $f'(x)=(x-1)^2(x+2)$ với bảng xét dấu như hình bên dưới. Hàm số đạt cực đại tại:",
    "options": [
      {
        "key": "A",
        "text": "$x=-1$"
      },
      {
        "key": "B",
        "text": "$x=1$"
      },
      {
        "key": "C",
        "text": "$x=2$"
      },
      {
        "key": "D",
        "text": "$x=-2$"
      }
    ],
    "answer": "D",
    "explanation": "$f'$ đổi dấu từ $+$ sang $-$ khi qua $x=-2$ (tại $x=1$, $f'$ không đổi dấu vì $(x-1)^2\\ge 0$), nên hàm số đạt cực đại tại $x=-2$.",
    "points": 0.25,
    "tags": [
      "đạo hàm",
      "cực trị",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "signtable",
      "expr": "(x-1)^2(x+2)"
    }
  },
  {
    "id": "thpt-toan-a-12",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Tiệm cận ngang của đồ thị hàm số $y=\\frac{2x-1}{x+1}$ là:",
    "options": [
      {
        "key": "A",
        "text": "$y=1$"
      },
      {
        "key": "B",
        "text": "$y=-1$"
      },
      {
        "key": "C",
        "text": "$y=2$"
      },
      {
        "key": "D",
        "text": "$x=-1$"
      }
    ],
    "answer": "C",
    "explanation": "$\\lim\\limits_{x\\to\\pm\\infty}\\frac{2x-1}{x+1}=2$, nên tiệm cận ngang là $y=2$.",
    "points": 0.25,
    "tags": [
      "tiệm cận",
      "hàm phân thức",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-a-13",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=x^3-3x^2+2$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Đạo hàm của hàm số là $y'=3x^2-6x$."
      },
      {
        "key": "b",
        "text": "Hàm số đồng biến trên khoảng $(2;+\\infty)$."
      },
      {
        "key": "c",
        "text": "Hàm số đạt cực tiểu tại $x=0$."
      },
      {
        "key": "d",
        "text": "Phương trình $x^3-3x^2+2=0$ có đúng hai nghiệm thực phân biệt."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) Đúng: $y'=3x^2-6x$. b) Đúng: với $x>2$ thì $y'=3x(x-2)>0$. c) Sai: $y'$ đổi dấu từ $+$ sang $-$ tại $x=0$ nên đó là điểm cực đại (cực tiểu tại $x=2$). d) Sai: $x=1$ là nghiệm và $x^3-3x^2+2=(x-1)(x^2-2x-2)$ nên phương trình có 3 nghiệm phân biệt $1;\\,1\\pm\\sqrt{3}$.",
    "points": 1,
    "tags": [
      "cực trị",
      "nghiệm phương trình",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-a-14",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=\\frac{x-2}{x+1}$ có đồ thị như hình bên dưới. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Đồ thị có tiệm cận đứng $x=-1$."
      },
      {
        "key": "b",
        "text": "Đồ thị có tiệm cận ngang $y=-1$."
      },
      {
        "key": "c",
        "text": "Đồ thị cắt trục tung tại điểm có tung độ âm."
      },
      {
        "key": "d",
        "text": "Phương trình $\\frac{x-2}{x+1}=3$ vô nghiệm."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng: $\\lim_{x\\to -1}\\frac{x-2}{x+1}=\\infty$. b) Sai: tiệm cận ngang là $y=1$. c) Đúng: tại $x=0$ có $y=-2<0$. d) Sai: $x-2=3x+3\\Leftrightarrow x=-\\frac{5}{2}$, thỏa mãn nên phương trình có nghiệm.",
    "points": 1,
    "tags": [
      "tiệm cận",
      "đọc đồ thị",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "(x-2)/(x+1)"
      ],
      "xMin": -5,
      "xMax": 5
    }
  },
  {
    "id": "thpt-toan-a-15",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Người ta làm một cái bể nước dạng hộp chữ nhật không nắp có thể tích $32\\,\\mathrm{m}^3$, chiều dài gấp đôi chiều rộng. Giá bê tông làm đáy là 500 nghìn đồng mỗi $\\mathrm{m}^2$, giá tôn làm bốn mặt thành là 200 nghìn đồng mỗi $\\mathrm{m}^2$. Gọi $x$ (m) là chiều rộng của bể. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Chiều cao của bể là $h=\\frac{16}{x^2}$ (m)."
      },
      {
        "key": "b",
        "text": "Tổng chi phí làm bể là $F(x)=1000x^2+\\frac{19200}{x}$ (nghìn đồng)."
      },
      {
        "key": "c",
        "text": "Chi phí nhỏ nhất khi chiều rộng $x=2$ m."
      },
      {
        "key": "d",
        "text": "Chi phí nhỏ nhất lớn hơn 13 triệu đồng."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: $V=2x\\cdot x\\cdot h=32\\Rightarrow h=\\frac{16}{x^2}$. b) Đúng: đáy diện tích $2x^2$ và bốn thành diện tích $2(2xh)+2(xh)=6xh=\\frac{96}{x}$, nên $F=500\\cdot 2x^2+200\\cdot\\frac{96}{x}=1000x^2+\\frac{19200}{x}$. c) Sai: $F'(x)=2000x-\\frac{19200}{x^2}=0\\Leftrightarrow x^3=9{,}6\\Leftrightarrow x=\\sqrt[3]{9{,}6}\\approx 2{,}12$ m. d) Đúng: $F_{\\min}=F(2{,}12)\\approx 13\\,551$ nghìn đồng $\\approx 13{,}6$ triệu $>13$ triệu.",
    "points": 1,
    "tags": [
      "bài toán tối ưu",
      "thực tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-a-16",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $f(x)=x^3-3x$ có đồ thị như hình bên dưới. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Đạo hàm của hàm số là $f'(x)=3x^2-3$."
      },
      {
        "key": "b",
        "text": "Hàm số đạt cực đại tại $x=-1$."
      },
      {
        "key": "c",
        "text": "Hàm số có giá trị nhỏ nhất trên $\\mathbb{R}$."
      },
      {
        "key": "d",
        "text": "Phương trình $f(x)=2$ có đúng hai nghiệm thực phân biệt."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng. b) Đúng: $f'$ đổi dấu từ $+$ sang $-$ tại $x=-1$. c) Sai: hàm bậc ba không bị chặn nên không có giá trị nhỏ nhất trên $\\mathbb{R}$. d) Đúng: $x^3-3x-2=(x-2)(x+1)^2=0$ có hai nghiệm phân biệt $x=2$ và $x=-1$.",
    "points": 1,
    "tags": [
      "đọc đồ thị",
      "cực trị",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "x^3-3x"
      ],
      "xMin": -3,
      "xMax": 3
    }
  },
  {
    "id": "thpt-toan-a-17",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=\\frac{x^2-3x+2}{x^2+2x-3}$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Đồ thị có tiệm cận đứng $x=-3$."
      },
      {
        "key": "b",
        "text": "Đồ thị có tiệm cận ngang $y=0$."
      },
      {
        "key": "c",
        "text": "Đồ thị có thêm một tiệm cận đứng $x=1$."
      },
      {
        "key": "d",
        "text": "Phương trình $\\frac{x^2-3x+2}{x^2+2x-3}=-1$ có nghiệm $x=-\\frac{1}{2}$."
      }
    ],
    "answer": "ĐSSĐ",
    "explanation": "a) Đúng: sau khi rút gọn $y=\\frac{x-2}{x+3}$ ($x\\ne 1;-3$), $\\lim_{x\\to -3}|y|=\\infty$. b) Sai: tiệm cận ngang là $y=1$. c) Sai: tại $x=1$ giới hạn của $y$ bằng $-\\frac{1}{4}$ hữu hạn, đồ thị chỉ bị rỗng một điểm chứ không có tiệm cận. d) Đúng: $\\frac{x-2}{x+3}=-1\\Leftrightarrow x-2=-x-3\\Leftrightarrow x=-\\frac{1}{2}$ (thỏa điều kiện).",
    "points": 1,
    "tags": [
      "tiệm cận",
      "hàm phân thức bậc hai trên bậc hai",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-a-18",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $f(x)=x^4-2x^2+1$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Đồ thị hàm số có ba điểm cực trị."
      },
      {
        "key": "b",
        "text": "Hàm số có giá trị lớn nhất trên $\\mathbb{R}$ bằng 1."
      },
      {
        "key": "c",
        "text": "Phương trình $f(x)=m$ có bốn nghiệm thực phân biệt khi và chỉ khi $0<m<1$."
      },
      {
        "key": "d",
        "text": "Trên đoạn $[-1;1]$, giá trị nhỏ nhất của hàm số bằng $-1$."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng: $f'=4x(x-1)(x+1)$ đổi dấu tại 3 điểm $x=-1;0;1$. b) Sai: khi $x\\to\\pm\\infty$ thì $f\\to+\\infty$ nên hàm không có giá trị lớn nhất. c) Đúng: $f=(x^2-1)^2$, đặt $t=x^2\\ge 0$ thì $(t-1)^2=m$ có nghiệm $t=1\\pm\\sqrt{m}$; cần cả hai giá trị dương và phân biệt $\\Leftrightarrow 0<m<1$. d) Sai: $f\\ge 0$ trên $[-1;1]$ và $f(\\pm 1)=0$ nên giá trị nhỏ nhất bằng 0.",
    "points": 1,
    "tags": [
      "hàm trùng phương",
      "số nghiệm",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-a-19",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Đường thẳng tiệm cận đứng của đồ thị hàm số $y=\\frac{3x-2}{x+4}$ có phương trình $x=a$. Giá trị của $a$ là bao nhiêu?",
    "answer": "-4",
    "explanation": "Mẫu bằng 0 tại $x=-4$ và tử tại đó bằng $-14\\ne 0$, nên tiệm cận đứng là $x=-4$.",
    "points": 0.5,
    "tags": [
      "tiệm cận",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-a-20",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hàm số $y=x^3-12x$ đạt cực tiểu tại $x=$ bao nhiêu?",
    "answer": "2",
    "explanation": "$y'=3x^2-12=3(x-2)(x+2)$ đổi dấu từ $-$ sang $+$ tại $x=2$, nên hàm số đạt cực tiểu tại $x=2$.",
    "points": 0.5,
    "tags": [
      "cực trị",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-a-21",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Giá trị lớn nhất của hàm số $y=-x^2+4x-1$ trên tập xác định là bao nhiêu?",
    "answer": "3",
    "explanation": "Hàm parabol quay xuống có đỉnh tại $x=2$ với $y=-(2)^2+4\\cdot 2-1=3$.",
    "points": 0.5,
    "tags": [
      "giá trị lớn nhất",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-a-22",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một cửa hàng bán $x$ hộp sữa mỗi ngày, giá bán mỗi hộp là $p(x)=30-0{,}5x$ (nghìn đồng) với $0\\le x\\le 60$. Số hộp sữa cần bán mỗi ngày để doanh thu lớn nhất là bao nhiêu?",
    "answer": "30",
    "explanation": "Doanh thu $R(x)=x\\left(30-0{,}5x\\right)$ là hàm bậc hai quay xuống, đạt giá trị lớn nhất tại $x=\\frac{30}{2\\cdot 0{,}5}=30$.",
    "points": 0.5,
    "tags": [
      "bài toán tối ưu",
      "doanh thu",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-a-23",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Số đường tiệm cận (kể cả đứng và ngang) của đồ thị hàm số $y=\\frac{x^2-4x+3}{x-1}$ là bao nhiêu?",
    "answer": "0",
    "explanation": "Tử $=(x-1)(x-3)$ nên $y=x-3$ với $x\\ne 1$. Đồ thị là đường thẳng có lỗ hổng tại $x=1$, giới hạn hữu hạn nên không có tiệm cận đứng hay ngang nào.",
    "points": 0.5,
    "tags": [
      "tiệm cận",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-a-24",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Giá thành sản xuất mỗi sản phẩm của một xí nghiệp là $\\overline{C}(x)=2x+\\frac{98}{x}+7$ (nghìn đồng) khi sản xuất $x$ sản phẩm. Giá thành sản xuất nhỏ nhất là bao nhiêu nghìn đồng?",
    "answer": "35",
    "explanation": "$\\overline{C}(x)\\ge 2\\sqrt{2x\\cdot\\frac{98}{x}}+7=28+7=35$, dấu bằng khi $2x=\\frac{98}{x}\\Leftrightarrow x=7$.",
    "points": 0.5,
    "tags": [
      "bài toán tối ưu",
      "giá thành",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-a-25",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một khung cổng có dạng cung parabol đối xứng như hình bên dưới, chân cổng tiếp xúc mặt đất tại hai điểm cách nhau 6 m và đỉnh cổng cao 4 m. Chọn hệ trục toạ độ với gốc ở trung điểm chân cổng, trục $Ox$ nằm trên mặt đất. Chiều cao của cổng tại điểm cách chân cổng 1,5 m (theo phương ngang) là bao nhiêu mét?",
    "answer": "3",
    "explanation": "Parabol có dạng $y=4-\\frac{4}{9}x^2$ (đỉnh $(0;4)$, cắt $Ox$ tại $x=\\pm 3$). Tại $x=\\pm 1{,}5$: $y=4-\\frac{4}{9}\\cdot 2{,}25=4-1=3$ m.",
    "points": 0.5,
    "tags": [
      "parabol",
      "thực tế",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "4-4x^2/9"
      ],
      "xMin": -3.6,
      "xMax": 3.6
    }
  },
  {
    "id": "thpt-toan-b-01",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Tích phân $\\int_0^2 3x^2\\,dx$ bằng:",
    "options": [
      {
        "key": "A",
        "text": "6"
      },
      {
        "key": "B",
        "text": "8"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "12"
      }
    ],
    "answer": "B",
    "explanation": "$\\int_0^2 3x^2\\,dx=\\left.x^3\\right|_0^2=8$.",
    "points": 0.25,
    "tags": [
      "tích phân",
      "tính tích phân",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-b-02",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Nguyên hàm của hàm số $f(x)=2x+1$ là:",
    "options": [
      {
        "key": "A",
        "text": "$x^2+x+C$"
      },
      {
        "key": "B",
        "text": "$2x^2+x+C$"
      },
      {
        "key": "C",
        "text": "$x^2+x$"
      },
      {
        "key": "D",
        "text": "$x^2-x+C$"
      }
    ],
    "answer": "A",
    "explanation": "$\\int(2x+1)\\,dx=x^2+x+C$.",
    "points": 0.25,
    "tags": [
      "nguyên hàm",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-b-03",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Nguyên hàm của hàm số $f(x)=4x^3-2x$ là:",
    "options": [
      {
        "key": "A",
        "text": "$4x^4-x^2+C$"
      },
      {
        "key": "B",
        "text": "$x^4-x+C$"
      },
      {
        "key": "C",
        "text": "$x^4+x^2+C$"
      },
      {
        "key": "D",
        "text": "$x^4-x^2+C$"
      }
    ],
    "answer": "D",
    "explanation": "$\\int(4x^3-2x)\\,dx=x^4-x^2+C$.",
    "points": 0.25,
    "tags": [
      "nguyên hàm",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-b-04",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Tích phân $\\int_1^e \\frac{1}{x}\\,dx$ bằng:",
    "options": [
      {
        "key": "A",
        "text": "$e-1$"
      },
      {
        "key": "B",
        "text": "$e$"
      },
      {
        "key": "C",
        "text": "1"
      },
      {
        "key": "D",
        "text": "0"
      }
    ],
    "answer": "C",
    "explanation": "$\\int_1^e \\frac{dx}{x}=\\ln e-\\ln 1=1$.",
    "points": 0.25,
    "tags": [
      "tích phân",
      "hàm logarit",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-b-05",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Tích phân $\\int_0^1 e^x\\,dx$ bằng:",
    "options": [
      {
        "key": "A",
        "text": "$e$"
      },
      {
        "key": "B",
        "text": "$e-1$"
      },
      {
        "key": "C",
        "text": "$e+1$"
      },
      {
        "key": "D",
        "text": "$1-e$"
      }
    ],
    "answer": "B",
    "explanation": "$\\int_0^1 e^x\\,dx=\\left.e^x\\right|_0^1=e-1$.",
    "points": 0.25,
    "tags": [
      "tích phân",
      "hàm mũ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-b-06",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho $F(x)$ là nguyên hàm của $f(x)=\\sin x$ thỏa mãn $F(0)=1$. Giá trị $F\\left(\\frac{\\pi}{2}\\right)$ bằng:",
    "options": [
      {
        "key": "A",
        "text": "0"
      },
      {
        "key": "B",
        "text": "1"
      },
      {
        "key": "C",
        "text": "2"
      },
      {
        "key": "D",
        "text": "$-1$"
      }
    ],
    "answer": "C",
    "explanation": "$F(x)=-\\cos x+C$; $F(0)=-1+C=1\\Rightarrow C=2$. Vậy $F\\left(\\frac{\\pi}{2}\\right)=0+2=2$.",
    "points": 0.25,
    "tags": [
      "nguyên hàm",
      "điều kiện ban đầu",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-b-07",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Diện tích hình phẳng giới hạn bởi hai đồ thị $y=x^2$ và $y=2x$ (như hình bên dưới) bằng:",
    "options": [
      {
        "key": "A",
        "text": "$\\frac{2}{3}$"
      },
      {
        "key": "B",
        "text": "$\\frac{8}{3}$"
      },
      {
        "key": "C",
        "text": "$\\frac{16}{3}$"
      },
      {
        "key": "D",
        "text": "$\\frac{4}{3}$"
      }
    ],
    "answer": "D",
    "explanation": "Hai đồ thị cắt nhau tại $x=0$ và $x=2$; $S=\\int_0^2(2x-x^2)\\,dx=\\left(x^2-\\frac{x^3}{3}\\right)\\Big|_0^2=4-\\frac{8}{3}=\\frac{4}{3}$.",
    "points": 0.25,
    "tags": [
      "diện tích hình phẳng",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "x^2",
        "2x"
      ],
      "xMin": -0.5,
      "xMax": 2.5,
      "yMin": -1,
      "yMax": 6
    }
  },
  {
    "id": "thpt-toan-b-08",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Diện tích hình phẳng giới hạn bởi đồ thị hàm số $y=x^2-2x-3$ và trục hoành bằng:",
    "options": [
      {
        "key": "A",
        "text": "$\\frac{32}{3}$"
      },
      {
        "key": "B",
        "text": "$\\frac{28}{3}$"
      },
      {
        "key": "C",
        "text": "$\\frac{16}{3}$"
      },
      {
        "key": "D",
        "text": "$\\frac{10}{3}$"
      }
    ],
    "answer": "A",
    "explanation": "Đồ thị cắt $Ox$ tại $x=-1$ và $x=3$; trên khoảng đó parabol nằm dưới trục nên $S=\\int_{-1}^{3}-(x^2-2x-3)\\,dx=\\frac{32}{3}$.",
    "points": 0.25,
    "tags": [
      "diện tích hình phẳng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-b-09",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Thể tích khối tròn xoay tạo thành khi quay hình phẳng giới hạn bởi $y=\\sqrt{x}$, $x=0$, $x=4$ và trục $Ox$ quanh trục $Ox$ bằng:",
    "options": [
      {
        "key": "A",
        "text": "$4\\pi$"
      },
      {
        "key": "B",
        "text": "$6\\pi$"
      },
      {
        "key": "C",
        "text": "$8\\pi$"
      },
      {
        "key": "D",
        "text": "$16\\pi$"
      }
    ],
    "answer": "C",
    "explanation": "$V=\\pi\\int_0^4 x\\,dx=\\pi\\cdot\\frac{16}{2}=8\\pi$.",
    "points": 0.25,
    "tags": [
      "thể tích khối tròn xoay",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-b-10",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một khu vườn hoa có dạng hình phẳng giới hạn bởi đồ thị hàm số $y=9-x^2$ và trục hoành (đơn vị: mét), như hình bên dưới. Biết chi phí trồng hoa là 500 nghìn đồng cho mỗi mét vuông. Tổng chi phí trồng hoa trên toàn bộ khu vườn là:",
    "options": [
      {
        "key": "A",
        "text": "15 triệu đồng"
      },
      {
        "key": "B",
        "text": "16 triệu đồng"
      },
      {
        "key": "C",
        "text": "20 triệu đồng"
      },
      {
        "key": "D",
        "text": "18 triệu đồng"
      }
    ],
    "answer": "D",
    "explanation": "$S=\\int_{-3}^{3}(9-x^2)\\,dx=\\left[9x-\\frac{x^3}{3}\\right]_{-3}^{3}=2\\left(27-9\\right)=36$ m². Chi phí $=36\\cdot 500=18\\,000$ nghìn đồng $=18$ triệu đồng.",
    "points": 0.25,
    "tags": [
      "diện tích hình phẳng",
      "thực tế",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "9-x^2"
      ],
      "xMin": -3.3,
      "xMax": 3.3
    }
  },
  {
    "id": "thpt-toan-b-11",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hàm số $f(x)$ liên tục trên $\\mathbb{R}$ thỏa mãn $\\int_1^3 f(x)\\,dx=5$ và $\\int_1^4 f(x)\\,dx=9$. Giá trị của $\\int_3^4\\left[2f(x)+3\\right]dx$ bằng:",
    "options": [
      {
        "key": "A",
        "text": "8"
      },
      {
        "key": "B",
        "text": "11"
      },
      {
        "key": "C",
        "text": "14"
      },
      {
        "key": "D",
        "text": "17"
      }
    ],
    "answer": "B",
    "explanation": "$\\int_3^4 f(x)\\,dx=9-5=4$; do đó $\\int_3^4\\left[2f(x)+3\\right]dx=2\\cdot 4+3\\cdot(4-3)=11$.",
    "points": 0.25,
    "tags": [
      "tính chất tích phân",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-b-12",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Diện tích hình phẳng giới hạn bởi hai đồ thị $y=x^3-3x$ và $y=x$ (như hình bên dưới) bằng:",
    "options": [
      {
        "key": "A",
        "text": "8"
      },
      {
        "key": "B",
        "text": "4"
      },
      {
        "key": "C",
        "text": "6"
      },
      {
        "key": "D",
        "text": "16"
      }
    ],
    "answer": "A",
    "explanation": "Hai đồ thị cắt nhau tại $x=-2;0;2$ (từ $x^3-4x=0$). $S=\\int_{-2}^{2}\\left|x^3-4x\\right|dx=2\\int_0^2\\left(4x-x^3\\right)dx=2\\left(2x^2-\\frac{x^4}{4}\\right)\\Big|_0^2=2\\cdot 4=8$.",
    "points": 0.25,
    "tags": [
      "diện tích hình phẳng",
      "hàm bậc ba",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "x^3-3x",
        "x"
      ],
      "xMin": -2.6,
      "xMax": 2.6
    }
  },
  {
    "id": "thpt-toan-b-13",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $f(x)=x^2+1$ xác định trên đoạn $[0;2]$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Hàm số $F(x)=\\frac{x^3}{3}+x$ là một nguyên hàm của $f(x)$."
      },
      {
        "key": "b",
        "text": "$\\int_0^2 f(x)\\,dx=\\frac{14}{3}$."
      },
      {
        "key": "c",
        "text": "Hình phẳng giới hạn bởi $y=f(x)$, đường thẳng $y=2$ và hai đường thẳng $x=0$, $x=2$ có diện tích bằng $\\frac{8}{3}$."
      },
      {
        "key": "d",
        "text": "Thể tích khối tròn xoay tạo thành khi quay hình phẳng giới hạn bởi $y=f(x)$, $x=0$, $x=1$ và trục $Ox$ quanh trục $Ox$ bằng $\\frac{28\\pi}{15}$."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: $F'(x)=x^2+1=f(x)$. b) Đúng: $\\int_0^2(x^2+1)\\,dx=\\frac{8}{3}+2=\\frac{14}{3}$. c) Sai: trên $[0;2]$, $y=2$ nằm trên $y=x^2+1$ chỉ từ $x=0$ đến $x=1$; diện tích giữa hai đường trên $[0;2]$ là $\\int_0^2\\left|(x^2+1)-2\\right|dx=\\int_0^1(1-x^2)\\,dx+\\int_1^2(x^2-1)\\,dx=\\frac{2}{3}+\\frac{4}{3}=2$. d) Đúng: $V=\\pi\\int_0^1(x^2+1)^2\\,dx=\\pi\\left(\\frac{1}{5}+\\frac{2}{3}+1\\right)=\\frac{28\\pi}{15}$.",
    "points": 1,
    "tags": [
      "nguyên hàm",
      "diện tích",
      "thể tích tròn xoay",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-b-14",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=\\sin x$ có đồ thị như hình bên dưới ($x$ tính theo radian). Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "$\\int_0^{\\pi}\\sin x\\,dx=2$."
      },
      {
        "key": "b",
        "text": "Diện tích hình phẳng giới hạn bởi $y=\\sin x$ và trục $Ox$ với $x\\in[0;2\\pi]$ bằng 2."
      },
      {
        "key": "c",
        "text": "$\\int_0^{2\\pi}\\sin x\\,dx=0$."
      },
      {
        "key": "d",
        "text": "Diện tích hình phẳng giới hạn bởi $y=\\sin x$ và trục $Ox$ với $x\\in[\\pi;2\\pi]$ bằng $-2$."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng: $\\int_0^{\\pi}\\sin x\\,dx=\\left[-\\cos x\\right]_0^{\\pi}=2$. b) Sai: hai cung đối xứng nên diện tích bằng $2+2=4$. c) Đúng: hai phần diện tích âm dương triệt tiêu nhau. d) Sai: diện tích luôn không âm, bằng 2 (giá trị $-2$ là tích phân, không phải diện tích).",
    "points": 1,
    "tags": [
      "tích phân",
      "diện tích hình phẳng",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "sin(x)"
      ],
      "xMin": 0,
      "xMax": 6.5
    }
  },
  {
    "id": "thpt-toan-b-15",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một xe máy chuyển động thẳng với vận tốc $v(t)=12t-3t^2$ (m/s), trong đó $t$ là thời gian tính bằng giây kể từ lúc bắt đầu chuyển động. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Quãng đường xe đi được trong 4 giây đầu là 32 m."
      },
      {
        "key": "b",
        "text": "Vận tốc lớn nhất của xe trong 4 giây đầu là 6 m/s."
      },
      {
        "key": "c",
        "text": "Quãng đường xe đi được trong 2 giây đầu là 10 m."
      },
      {
        "key": "d",
        "text": "Gia tốc của xe tại thời điểm $t=2$ s bằng 0."
      }
    ],
    "answer": "ĐSSĐ",
    "explanation": "a) Đúng: $\\int_0^4(12t-3t^2)\\,dt=\\left[6t^2-t^3\\right]_0^4=96-64=32$ m. b) Sai: $v(t)$ đạt giá trị lớn nhất khi $v'(t)=12-6t=0\\Leftrightarrow t=2$ với $v(2)=12$ m/s. c) Sai: $\\int_0^2(12t-3t^2)\\,dt=24-8=16$ m. d) Đúng: $a(t)=v'(t)=12-6t=0$ tại $t=2$ s.",
    "points": 1,
    "tags": [
      "quãng đường",
      "vận tốc",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-b-16",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hai đường cong $y=x^2$ và $y=\\sqrt{x}$ (với $x\\ge 0$) như hình bên dưới. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Hai đồ thị cắt nhau tại hai điểm phân biệt."
      },
      {
        "key": "b",
        "text": "Diện tích hình phẳng giới hạn giữa hai đồ thị bằng $\\frac{1}{3}$."
      },
      {
        "key": "c",
        "text": "Diện tích hình phẳng giới hạn giữa hai đồ thị bằng $\\frac{2}{3}$."
      },
      {
        "key": "d",
        "text": "Thể tích khối tròn xoay tạo thành khi quay hình phẳng giới hạn giữa hai đồ thị quanh trục $Ox$ bằng $\\frac{3\\pi}{10}$."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: $x^2=\\sqrt{x}\\Leftrightarrow x=0$ hoặc $x=1$. b) Đúng: $S=\\int_0^1(\\sqrt{x}-x^2)\\,dx=\\frac{2}{3}-\\frac{1}{3}=\\frac{1}{3}$. c) Sai (theo ý b). d) Đúng: $V=\\pi\\int_0^1\\left(x-x^4\\right)dx=\\pi\\left(\\frac{1}{2}-\\frac{1}{5}\\right)=\\frac{3\\pi}{10}$.",
    "points": 1,
    "tags": [
      "diện tích hình phẳng",
      "thể tích tròn xoay",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "x^2",
        "sqrt(x)"
      ],
      "xMin": -0.2,
      "xMax": 1.6,
      "yMin": -0.2,
      "yMax": 1.8
    }
  },
  {
    "id": "thpt-toan-b-17",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $f(x)=(x+1)e^x$ xác định trên $\\mathbb{R}$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Hàm số $F(x)=xe^x-3$ là một nguyên hàm của $f$ trên $\\mathbb{R}$."
      },
      {
        "key": "b",
        "text": "$\\int_0^1 f(x)\\,dx=e$."
      },
      {
        "key": "c",
        "text": "$\\int_0^1 f(x)\\,dx=e-1$."
      },
      {
        "key": "d",
        "text": "Đồ thị hàm số $f$ cắt trục hoành tại đúng một điểm."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: $F'(x)=e^x+xe^x=(x+1)e^x=f(x)$. b) Đúng: $\\int_0^1 f\\,dx=F(1)-F(0)=(e-3)-(0-3)=e$. c) Sai (theo ý b). d) Đúng: $f(x)=0\\Leftrightarrow x=-1$ (vì $e^x>0$).",
    "points": 1,
    "tags": [
      "nguyên hàm",
      "tích phân",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-b-18",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $f(x)=\\left|x^2-4\\right|$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "$\\int_0^3 f(x)\\,dx=\\frac{23}{3}$."
      },
      {
        "key": "b",
        "text": "$\\int_0^3 f(x)\\,dx=\\int_0^3\\left(x^2-4\\right)dx$."
      },
      {
        "key": "c",
        "text": "$\\int_0^2 f(x)\\,dx=\\frac{16}{3}$."
      },
      {
        "key": "d",
        "text": "$\\int_0^3 f(x)\\,dx=7$."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng: trên $[0;2]$, $f=4-x^2$ cho $\\frac{16}{3}$; trên $[2;3]$, $f=x^2-4$ cho $\\frac{7}{3}$; tổng $\\frac{23}{3}$. b) Sai: trên $[0;2]$ thì $x^2-4<0$ nên dấu tuyệt đối làm thay đổi giá trị tích phân. c) Đúng: $\\int_0^2(4-x^2)\\,dx=8-\\frac{8}{3}=\\frac{16}{3}$. d) Sai: theo ý a, tích phân bằng $\\frac{23}{3}\\approx 7{,}67\\ne 7$.",
    "points": 1,
    "tags": [
      "giá trị tuyệt đối",
      "tích phân",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-b-19",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tích phân $\\int_1^4 \\frac{1}{\\sqrt{x}}\\,dx$ có giá trị bằng bao nhiêu?",
    "answer": "2",
    "explanation": "$\\int_1^4 x^{-1/2}\\,dx=\\left[2\\sqrt{x}\\right]_1^4=4-2=2$.",
    "points": 0.5,
    "tags": [
      "tích phân",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-b-20",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho $F(x)$ là nguyên hàm của $f(x)=6x^2$ thỏa mãn $F(1)=4$. Giá trị $F(2)$ bằng bao nhiêu?",
    "answer": "18",
    "explanation": "$F(x)=2x^3+C$; $F(1)=2+C=4\\Rightarrow C=2$. Vậy $F(2)=16+2=18$.",
    "points": 0.5,
    "tags": [
      "nguyên hàm",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-b-21",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tích phân $\\int_0^{\\frac{\\pi}{2}}\\cos x\\,dx$ có giá trị bằng bao nhiêu?",
    "answer": "1",
    "explanation": "$\\int_0^{\\pi/2}\\cos x\\,dx=\\left[\\sin x\\right]_0^{\\pi/2}=1-0=1$.",
    "points": 0.5,
    "tags": [
      "tích phân",
      "lượng giác",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-b-22",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Diện tích hình phẳng giới hạn bởi hai đồ thị $y=12x$ và $y=3x^2$ bằng bao nhiêu?",
    "answer": "32",
    "explanation": "Hai đồ thị cắt nhau tại $x=0$ và $x=4$; $S=\\int_0^4(12x-3x^2)\\,dx=\\left[6x^2-x^3\\right]_0^4=96-64=32$.",
    "points": 0.5,
    "tags": [
      "diện tích hình phẳng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-b-23",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Thể tích khối tròn xoay tạo thành khi quay hình phẳng giới hạn bởi $y=x^2+2$, $x=0$, $x=1$ và trục $Ox$ quanh trục $Ox$ là $V$. Giá trị của $\\frac{V}{\\pi}$ làm tròn đến hàng phần mười là bao nhiêu?",
    "answer": "5,5",
    "explanation": "$V=piint_0^1(x^2+2)^2,dx=pileft(\frac{1}{5}+\frac{4}{3}+4\right)=\frac{83pi}{15}$, nên $\frac{V}{pi}=\frac{83}{15}approx 5{,}5$.",
    "points": 0.5,
    "tags": [
      "thể tích tròn xoay",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-b-24",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Người ta gửi vào ngân hàng 100 triệu đồng với lãi suất liên tục 5% một năm. Theo mô hình tăng trưởng liên tục, số tiền sau $t$ năm là $S(t)=100e^{0{,}05t}$ (triệu đồng). Sau 10 năm, số tiền nhận được (làm tròn đến hàng đơn vị) là bao nhiêu triệu đồng?",
    "answer": "165",
    "explanation": "$S(10)=100e^{0{,}5}\\approx 100\\cdot 1{,}6487\\approx 164{,}87\\approx 165$ triệu đồng.",
    "points": 0.5,
    "tags": [
      "lãi suất",
      "hàm mũ",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-b-25",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Diện tích hình phẳng giới hạn bởi đồ thị hàm số $y=4-x^2$ và đường thẳng $y=x+2$ (như hình bên dưới) bằng bao nhiêu?",
    "answer": "4,5",
    "explanation": "Hoành độ giao điểm: $4-x^2=x+2\\Leftrightarrow x^2+x-2=0\\Leftrightarrow x=1$ hoặc $x=-2$. $S=\\int_{-2}^{1}\\left[(4-x^2)-(x+2)\\right]dx=\\int_{-2}^{1}(2-x-x^2)\\,dx=\\left[2x-\\frac{x^2}{2}-\\frac{x^3}{3}\\right]_{-2}^{1}=\\frac{7}{6}+\\frac{10}{3}=\\frac{9}{2}=4{,}5$.",
    "points": 0.5,
    "tags": [
      "diện tích hình phẳng",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "4-x^2",
        "x+2"
      ],
      "xMin": -3,
      "xMax": 2.5
    }
  },
  {
    "id": "thpt-toan-c-01",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong không gian với hệ trục toạ độ $Oxyz$, đường thẳng $d:\\,\\left\\{\\begin{matrix} x=1+2t\\\\ y=-t\\\\ z=3+t\\end{matrix}\\right.$ có một vectơ chỉ phương là:",
    "options": [
      {
        "key": "A",
        "text": "$\\vec{u}_1=(2;1;1)$"
      },
      {
        "key": "B",
        "text": "$\\vec{u}_2=(-2;1;1)$"
      },
      {
        "key": "C",
        "text": "$\\vec{u}_3=(2;-1;1)$"
      },
      {
        "key": "D",
        "text": "$\\vec{u}_4=(1;-1;2)$"
      }
    ],
    "answer": "C",
    "explanation": "Các hệ số của $t$ trong phương trình tham số chính là toạ độ vectơ chỉ phương: $\\vec{u}=(2;-1;1)$.",
    "points": 0.25,
    "tags": [
      "đường thẳng trong không gian",
      "vectơ chỉ phương",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-c-02",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Mặt cầu $(S):(x+1)^2+(y-2)^2+z^2=9$ có bán kính là:",
    "options": [
      {
        "key": "A",
        "text": "3"
      },
      {
        "key": "B",
        "text": "4"
      },
      {
        "key": "C",
        "text": "9"
      },
      {
        "key": "D",
        "text": "2"
      }
    ],
    "answer": "A",
    "explanation": "Bán kính $R=\\sqrt{9}=3$, tâm $I(-1;2;0)$.",
    "points": 0.25,
    "tags": [
      "mặt cầu",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-c-03",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Điểm $M(1;2;3)$ thuộc mặt phẳng nào sau đây?",
    "options": [
      {
        "key": "A",
        "text": "$(\\alpha_1):\\,2x-y+z-2=0$"
      },
      {
        "key": "B",
        "text": "$(\\alpha_2):\\,x+y+z-5=0$"
      },
      {
        "key": "C",
        "text": "$(\\alpha_3):\\,2x+y-z-4=0$"
      },
      {
        "key": "D",
        "text": "$(\\alpha_4):\\,x+2y-z-2=0$"
      }
    ],
    "answer": "D",
    "explanation": "Thay $M(1;2;3)$ vào $(\\alpha_4)$: $1+4-3-2=0$. Ba mặt phẳng còn lại cho giá trị $1;\\,1;\\,-3$ khác 0.",
    "points": 0.25,
    "tags": [
      "mặt phẳng",
      "toạ độ điểm",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-c-04",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Khoảng cách từ điểm $M(2;1;-1)$ đến mặt phẳng $(P):\\,2x-y+2z-6=0$ bằng:",
    "options": [
      {
        "key": "A",
        "text": "3"
      },
      {
        "key": "B",
        "text": "$\\frac{5}{3}$"
      },
      {
        "key": "C",
        "text": "1"
      },
      {
        "key": "D",
        "text": "5"
      }
    ],
    "answer": "B",
    "explanation": "$d(M,(P))=\\frac{\\left|2\\cdot 2-1+2(-1)-6\\right|}{\\sqrt{2^2+(-1)^2+2^2}}=\\frac{|-5|}{3}=\\frac{5}{3}$.",
    "points": 0.25,
    "tags": [
      "khoảng cách điểm mặt phẳng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-c-05",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Khoảng cách giữa hai mặt phẳng song song $(P):\\,x-2y+2z-3=0$ và $(Q):\\,x-2y+2z-8=0$ bằng:",
    "options": [
      {
        "key": "A",
        "text": "$\\frac{1}{3}$"
      },
      {
        "key": "B",
        "text": "$\\frac{2}{3}$"
      },
      {
        "key": "C",
        "text": "$\\frac{5}{3}$"
      },
      {
        "key": "D",
        "text": "3"
      }
    ],
    "answer": "C",
    "explanation": "Hai mặt phẳng song song có cùng vectơ pháp tuyến $\\vec{n}=(1;-2;2)$, $d(P,Q)=\\frac{|{-8}-(-3)|}{\\sqrt{9}}=\\frac{5}{3}$.",
    "points": 0.25,
    "tags": [
      "hai mặt phẳng song song",
      "khoảng cách",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-c-06",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong không gian $Oxyz$, phương trình đường thẳng đi qua điểm $M(1;2;0)$ và vuông góc với mặt phẳng $(P):\\,x-y+2z-4=0$ có vectơ chỉ phương là:",
    "options": [
      {
        "key": "A",
        "text": "$\\vec{u}_1=(1;-1;2)$"
      },
      {
        "key": "B",
        "text": "$\\vec{u}_2=(-1;1;2)$"
      },
      {
        "key": "C",
        "text": "$\\vec{u}_3=(1;1;2)$"
      },
      {
        "key": "D",
        "text": "$\\vec{u}_4=(2;-1;1)$"
      }
    ],
    "answer": "A",
    "explanation": "Đường thẳng vuông góc với $(P)$ nhận vectơ pháp tuyến của $(P)$ làm vectơ chỉ phương: $\\vec{u}=\\vec{n}=(1;-1;2)$.",
    "points": 0.25,
    "tags": [
      "đường thẳng vuông góc mặt phẳng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-c-07",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho đường thẳng $d$ có vectơ chỉ phương $\\vec{u}=(1;2;2)$ và mặt phẳng $(P):\\,2x+y+2z-4=0$. Số đo góc giữa $d$ và $(P)$ là:",
    "options": [
      {
        "key": "A",
        "text": "$\\arcsin\\dfrac{2}{3}$"
      },
      {
        "key": "B",
        "text": "$\\arcsin\\dfrac{8}{9}$"
      },
      {
        "key": "C",
        "text": "$\\arccos\\dfrac{8}{9}$"
      },
      {
        "key": "D",
        "text": "$90^{\\circ}$"
      }
    ],
    "answer": "B",
    "explanation": "$\\sin\\alpha=\\dfrac{|\\vec{u}\\cdot\\vec{n}|}{|\\vec{u}||\\vec{n}|}=\\dfrac{|2+2+4|}{3\\cdot 3}=\\dfrac{8}{9}$, với $\\vec{n}=(2;1;2)$.",
    "points": 0.25,
    "tags": [
      "góc giữa đường thẳng và mặt phẳng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-c-08",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một máy bay không người lái (drone) xuất phát từ điểm $A(0;10;50)$ và bay thẳng đều đến điểm $B(200;310;650)$ (đơn vị: mét). Nếu drone bay với tốc độ không đổi 14 m/s thì thời gian bay từ $A$ đến $B$ là:",
    "options": [
      {
        "key": "A",
        "text": "60 s"
      },
      {
        "key": "B",
        "text": "45 s"
      },
      {
        "key": "C",
        "text": "55 s"
      },
      {
        "key": "D",
        "text": "50 s"
      }
    ],
    "answer": "D",
    "explanation": "$\\vec{AB}=(200;300;600)$ nên $AB=\\sqrt{200^2+300^2+600^2}=\\sqrt{490000}=700$ m. Thời gian $=\\frac{700}{14}=50$ s.",
    "points": 0.25,
    "tags": [
      "bài toán thực tế",
      "khoảng cách",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-c-09",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một máy bay cất cánh từ đường băng tại điểm $A(0;0;0)$, bay theo đường thẳng với vectơ chỉ phương $\\vec{u}=(3;4;5)$ (đơn vị: mét). Sau khi bay được quãng đường $500\\sqrt{2}$ m, độ cao của máy bay là:",
    "options": [
      {
        "key": "A",
        "text": "400 m"
      },
      {
        "key": "B",
        "text": "600 m"
      },
      {
        "key": "C",
        "text": "500 m"
      },
      {
        "key": "D",
        "text": "300 m"
      }
    ],
    "answer": "C",
    "explanation": "$|\\vec{u}|=\\sqrt{9+16+25}=5\\sqrt{2}$ nên tham số $t=\\frac{500\\sqrt{2}}{5\\sqrt{2}}=100$. Độ cao $z=5\\cdot 100=500$ m.",
    "points": 0.25,
    "tags": [
      "bài toán thực tế",
      "phương trình tham số",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-c-10",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong không gian $Oxyz$, mặt cầu có đường kính $AB$ với $A(1;2;3)$, $B(3;4;5)$ có phương trình là:",
    "options": [
      {
        "key": "A",
        "text": "$(x-2)^2+(y-3)^2+(z-4)^2=9$"
      },
      {
        "key": "B",
        "text": "$(x-2)^2+(y-3)^2+(z-4)^2=3$"
      },
      {
        "key": "C",
        "text": "$(x+2)^2+(y+3)^2+(z+4)^2=3$"
      },
      {
        "key": "D",
        "text": "$(x-1)^2+(y-2)^2+(z-3)^2=6$"
      }
    ],
    "answer": "B",
    "explanation": "Tâm $I$ là trung điểm $AB$: $I(2;3;4)$; $R=\\frac{AB}{2}=\\frac{\\sqrt{4+4+4}}{2}=\\sqrt{3}$ nên $R^2=3$.",
    "points": 0.25,
    "tags": [
      "mặt cầu",
      "đường kính",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-c-11",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Khoảng cách giữa hai đường thẳng $d_1:\\,\\frac{x-1}{1}=\\frac{y}{2}=\\frac{z+1}{2}$ và $d_2:\\,\\frac{x-2}{1}=\\frac{y-1}{2}=\\frac{z}{2}$ bằng:",
    "options": [
      {
        "key": "A",
        "text": "$\\frac{\\sqrt{2}}{3}$"
      },
      {
        "key": "B",
        "text": "$\\frac{1}{3}$"
      },
      {
        "key": "C",
        "text": "$\\frac{\\sqrt{3}}{3}$"
      },
      {
        "key": "D",
        "text": "$\\frac{2}{3}$"
      }
    ],
    "answer": "A",
    "explanation": "$d_1\\parallel d_2$ (cùng vectơ chỉ phương $\\vec{u}=(1;2;2)$). Lấy $M_1(1;0;-1)\\in d_1$, $M_2(2;1;0)\\in d_2$; $\\vec{M_1M_2}\\times\\vec{u}=(1;1;1)\\times(1;2;2)=(0;-1;1)$, $d(d_1,d_2)=\\frac{\\sqrt{2}}{\\sqrt{1+4+4}}=\\frac{\\sqrt{2}}{3}$.",
    "points": 0.25,
    "tags": [
      "khoảng cách hai đường thẳng song song",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-c-12",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trên mặt phẳng $(P):\\,2x+y+2z-6=0$, điểm $M$ sao cho khoảng cách từ $M$ đến gốc toạ độ $O$ nhỏ nhất có khoảng cách bằng:",
    "options": [
      {
        "key": "A",
        "text": "1"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "$\\frac{2}{3}$"
      },
      {
        "key": "D",
        "text": "2"
      }
    ],
    "answer": "D",
    "explanation": "Điểm cần tìm là hình chiếu của $O$ trên $(P)$: $M=\\frac{6}{9}(2;1;2)=\\left(\\frac{4}{3};\\frac{2}{3};\\frac{4}{3}\\right)$, $d_{\\min}=\\frac{|-6|}{\\sqrt{2^2+1^2+2^2}}=\\frac{6}{3}=2$.",
    "points": 0.25,
    "tags": [
      "khoảng cách nhỏ nhất",
      "hình chiếu",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-c-13",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Trong không gian $Oxyz$, cho điểm $A(1;-2;3)$ và mặt phẳng $(P):\\,x+2y-2z+5=0$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Điểm $A$ thuộc mặt phẳng $(P)$."
      },
      {
        "key": "b",
        "text": "Khoảng cách từ $A$ đến $(P)$ bằng $\\frac{4}{3}$."
      },
      {
        "key": "c",
        "text": "Vectơ $\\vec{u}=(1;2;-2)$ là một vectơ chỉ phương của $(P)$."
      },
      {
        "key": "d",
        "text": "Hình chiếu của $A$ trên $(P)$ là điểm $H\\left(\\frac{13}{9};-\\frac{10}{9};\\frac{19}{9}\\right)$."
      }
    ],
    "answer": "SĐSĐ",
    "explanation": "a) Sai: $1+2(-2)-2\\cdot 3+5=-4\\ne 0$. b) Đúng: $d=\\frac{|-4|}{\\sqrt{1+4+4}}=\\frac{4}{3}$. c) Sai: $\\vec{u}$ là vectơ pháp tuyến của $(P)$. d) Đúng: $H=A-\\frac{-4}{9}(1;2;-2)=\\left(\\frac{13}{9};-\\frac{10}{9};\\frac{19}{9}\\right)$.",
    "points": 1,
    "tags": [
      "mặt phẳng",
      "hình chiếu",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-c-14",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Trong không gian với hệ trục toạ độ $Oxyz$ (đơn vị: mét), một drone xuất phát tại $A(0;0;0)$ và bay thẳng đến điểm $B(300;400;100)$ như sơ đồ bên dưới. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Quãng đường bay $AB=100\\sqrt{26}$ m."
      },
      {
        "key": "b",
        "text": "Nếu bay đều với tốc độ 10 m/s thì drone mất khoảng 51 giây để đến $B$."
      },
      {
        "key": "c",
        "text": "Độ cao của $B$ lớn hơn 100 m."
      },
      {
        "key": "d",
        "text": "$\\vec{AB}=(300;400;100)$ cùng phương với vectơ $(3;4;1)$."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: $AB=\\sqrt{300^2+400^2+100^2}=\\sqrt{260000}=100\\sqrt{26}$ m. b) Đúng: $\\frac{100\\sqrt{26}}{10}=10\\sqrt{26}\\approx 51$ s. c) Sai: toạ độ $z$ của $B$ bằng đúng 100 m. d) Đúng: $\\vec{AB}=100\\cdot(3;4;1)$.",
    "points": 1,
    "tags": [
      "bài toán thực tế",
      "khoảng cách",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "scene",
      "text": "A(0; 0)\nH(500; 0)\nB(500; 100)\nAB, AH, HB\nvuông AHB\nkích thước HB \"100 m\""
    }
  },
  {
    "id": "thpt-toan-c-15",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho mặt cầu $(S):\\,x^2+y^2+z^2-2x+4y-6=0$ và mặt phẳng $(\\alpha):\\,x+y+z-1=0$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Tâm của $(S)$ là điểm $I(1;-2;0)$."
      },
      {
        "key": "b",
        "text": "Bán kính của $(S)$ là $\\sqrt{11}$."
      },
      {
        "key": "c",
        "text": "$(S)$ đi qua gốc toạ độ $O$."
      },
      {
        "key": "d",
        "text": "$(\\alpha)$ cắt $(S)$ theo một đường tròn."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: từ $-2D;-2E;-2F=2;-4;0$. b) Đúng: $R^2=D^2+E^2+F^2-G=1+4+0+6=11$. c) Sai: thay $O(0;0;0)$ vào phương trình được $-6\\ne 0$. d) Đúng: $d(I,(\\alpha))=\\frac{|1-2+0-1|}{\\sqrt{3}}=\\frac{2}{\\sqrt{3}}\\approx 1{,}16<R\\approx 3{,}32$ nên mặt phẳng cắt mặt cầu.",
    "points": 1,
    "tags": [
      "mặt cầu",
      "vị trí tương đối",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-c-16",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho đường thẳng $d:\\,\\frac{x-2}{1}=\\frac{y+1}{2}=\\frac{z}{-2}$ và mặt phẳng $(P):\\,x+2y-2z+1=0$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Một vectơ chỉ phương của $d$ là $\\vec{u}=(1;2;-2)$."
      },
      {
        "key": "b",
        "text": "Một vectơ pháp tuyến của $(P)$ là $\\vec{n}=(1;2;-2)$."
      },
      {
        "key": "c",
        "text": "$d$ vuông góc với $(P)$."
      },
      {
        "key": "d",
        "text": "$d$ cắt $(P)$ tại đúng hai điểm phân biệt."
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) Đúng, b) Đúng theo phương trình cho trước. c) Đúng: $\\vec{u}\\parallel\\vec{n}$ nên $d\\perp(P)$. d) Sai: đường thẳng vuông góc với mặt phẳng cắt mặt phẳng tại đúng một điểm.",
    "points": 1,
    "tags": [
      "vị trí tương đối đường thẳng mặt phẳng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-c-17",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một drone giao hàng xuất phát từ kho $K(0;0;0)$, bay thẳng theo phương của vectơ $\\vec{u}=(60;80;6)$ (đơn vị: mét) đến điểm thả hàng $T$ với $\\vec{KT}=\\vec{u}$ như sơ đồ bên dưới ($H$ là hình chiếu của $T$ xuống mặt đất, đoạn $KH$ thể hiện quãng đường ngang). Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Độ dài $\\vec{u}$ đúng bằng 100 m."
      },
      {
        "key": "b",
        "text": "Độ cao của điểm $T$ là 6 m."
      },
      {
        "key": "c",
        "text": "Khoảng cách ngang từ $K$ đến $T$ (khoảng cách từ $K$ đến $H$) bằng 100 m."
      },
      {
        "key": "d",
        "text": "Nếu drone bay với tốc độ không đổi 10 m/s theo phương $\\vec{u}$ thì mất đúng 10 giây để đến $T$."
      }
    ],
    "answer": "SĐĐS",
    "explanation": "a) Sai: $|\\vec{u}|=\\sqrt{60^2+80^2+6^2}=\\sqrt{10036}\\approx 100{,}18$ m. b) Đúng: thành phần $z$ của $\\vec{u}$ là 6. c) Đúng: $\\sqrt{60^2+80^2}=100$ m. d) Sai: thời gian là $\\frac{\\sqrt{10036}}{10}\\approx 10{,}02$ s, không đúng bằng 10 s.",
    "points": 1,
    "tags": [
      "bài toán thực tế",
      "khoảng cách",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "scene",
      "text": "K(0; 0)\nH(100; 0)\nT(100; 6)\nKH, HT, KT\nvuông KHT\nkích thước HT \"6 m\""
    }
  },
  {
    "id": "thpt-toan-c-18",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Trong không gian $Oxyz$, cho hình lập phương $ABCD.A'B'C'D'$ với $A(0;0;0)$, $B(2;0;0)$, $D(0;2;0)$, $A'(0;0;2)$ như hình bên dưới. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Toạ độ điểm $C'$ là $(2;2;2)$."
      },
      {
        "key": "b",
        "text": "$AC'=2\\sqrt{2}$."
      },
      {
        "key": "c",
        "text": "Khoảng cách từ $A$ đến mặt phẳng $(BC'D)$ bằng $\\frac{2\\sqrt{3}}{3}$."
      },
      {
        "key": "d",
        "text": "$\\sin$ góc giữa đường thẳng $AC'$ và mặt phẳng $(BC'D)$ bằng $\\frac{1}{3}$."
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) Đúng: $C'=B+\\vec{AD}=(2;2;2)$. b) Sai: $AC'=\\sqrt{4+4+4}=2\\sqrt{3}$. c) Đúng: $(BC'D):\\,x+y-z-2=0$ nên $d(A)=\\frac{2}{\\sqrt{3}}=\\frac{2\\sqrt{3}}{3}$. d) Đúng: $\\sin\\alpha=\\frac{|\\vec{AC'}\\cdot\\vec{n}|}{|\\vec{AC'}||\\vec{n}|}=\\frac{|2+2-2|}{2\\sqrt{3}\\cdot\\sqrt{3}}=\\frac{2}{6}=\\frac{1}{3}$ với $\\vec{n}=(1;1;-1)$.",
    "points": 1,
    "tags": [
      "hình lập phương",
      "khoảng cách",
      "góc",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "cube",
      "names": [
        "A",
        "B",
        "C",
        "D",
        "A'",
        "B'",
        "C'",
        "D'"
      ],
      "height": false,
      "diagonals": true
    }
  },
  {
    "id": "thpt-toan-c-19",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trong không gian $Oxyz$, khoảng cách từ điểm $M(2;-1;5)$ đến mặt phẳng $(Oxy)$ bằng bao nhiêu?",
    "answer": "5",
    "explanation": "Khoảng cách từ $M$ đến $(Oxy)$ bằng $|z_M|=5$.",
    "points": 0.5,
    "tags": [
      "khoảng cách tới mặt phẳng toạ độ",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-c-20",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Đường thẳng $d:\\,\\frac{x+1}{2}=\\frac{y}{a}=\\frac{z-3}{2}$ có một vectơ chỉ phương là $(2;-1;2)$. Giá trị của $a$ là bao nhiêu?",
    "answer": "-1",
    "explanation": "Toạ độ của vectơ chỉ phương chính là các mẫu số của phương trình chính tắc, nên $a=-1$.",
    "points": 0.5,
    "tags": [
      "phương trình đường thẳng",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-c-21",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Mặt cầu $(S):\\,x^2+y^2+z^2-2x+4y-6z-2=0$ có bán kính $R$ bằng bao nhiêu?",
    "answer": "4",
    "explanation": "$R^2=1+4+9+2=16\\Rightarrow R=4$.",
    "points": 0.5,
    "tags": [
      "mặt cầu",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-c-22",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trong không gian $Oxyz$, khoảng cách từ gốc toạ độ $O$ đến mặt phẳng $(P):\\,x+2y+2z-6=0$ bằng bao nhiêu?",
    "answer": "2",
    "explanation": "$d(O,(P))=\\frac{|-6|}{\\sqrt{1+4+4}}=\\frac{6}{3}=2$.",
    "points": 0.5,
    "tags": [
      "khoảng cách điểm mặt phẳng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-c-23",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một drone xuất phát tại $O(0;0;0)$, bay thẳng theo phương của vectơ $\\vec{u}=(3;4;12)$ (đơn vị: mét) với tốc độ không đổi 26 m/s như sơ đồ bên dưới. Sau 10 giây bay, độ cao của drone (toạ độ $z$) là bao nhiêu mét?",
    "answer": "240",
    "explanation": "$|\\vec{u}|=13$ nên quãng đường 260 m ứng với tham số $t=20$. Vị trí: $(60;80;240)$, độ cao 240 m.",
    "points": 0.5,
    "tags": [
      "bài toán thực tế",
      "chuyển động",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "scene",
      "text": "O(0; 0)\nH(5; 0)\nT(5; 12)\nOH, HT, OT\nvuông OHT"
    }
  },
  {
    "id": "thpt-toan-c-24",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trong không gian $Oxyz$, cho đường thẳng $d$ có vectơ chỉ phương $\\vec{u}=(1;2;2)$ và mặt phẳng $(P):\\,x+2y+2z=0$. Số đo (theo độ) của góc giữa $d$ và $(P)$ là bao nhiêu?",
    "answer": "90",
    "explanation": "$\\vec{u}=(1;2;2)$ cùng phương với vectơ pháp tuyến $\\vec{n}=(1;2;2)$ của $(P)$ nên $d\\perp(P)$, góc giữa $d$ và $(P)$ bằng $90^{\\circ}$.",
    "points": 0.5,
    "tags": [
      "góc giữa đường thẳng và mặt phẳng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-c-25",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trong không gian $Oxyz$, trên trục $Oz$ tìm điểm $M(0;0;t)$ sao cho $M$ cách đều hai điểm $A(1;2;0)$ và $B(2;1;6)$. Giá trị của $t$ là bao nhiêu?",
    "answer": "3",
    "explanation": "$MA^2=1+4+t^2=5+t^2$; $MB^2=4+1+(t-6)^2=5+t^2-12t+36$. Suy ra $MA=MB\\Rightarrow t^2=t^2-12t+36\\Rightarrow t=3$.",
    "points": 0.5,
    "tags": [
      "mặt phẳng trung trực",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-d-01",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một hộp chứa 5 bi đỏ và 3 bi xanh (các bi cùng loại). Lấy ngẫu nhiên một bi từ hộp. Xác suất để bi được lấy ra màu đỏ là:",
    "options": [
      {
        "key": "A",
        "text": "$\\frac{3}{8}$"
      },
      {
        "key": "B",
        "text": "$\\frac{1}{2}$"
      },
      {
        "key": "C",
        "text": "$\\frac{5}{8}$"
      },
      {
        "key": "D",
        "text": "$\\frac{5}{7}$"
      }
    ],
    "answer": "C",
    "explanation": "Có 8 bi, trong đó 5 bi đỏ nên $P=\\frac{5}{8}$.",
    "points": 0.25,
    "tags": [
      "xác suất",
      "định nghĩa cổ điển",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-d-02",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một lớp có 5 học sinh nam và 5 học sinh nữ. Chọn ngẫu nhiên 2 em từ lớp để trực nhật. Số cách chọn 2 em đều là nữ là:",
    "options": [
      {
        "key": "A",
        "text": "10"
      },
      {
        "key": "B",
        "text": "20"
      },
      {
        "key": "C",
        "text": "25"
      },
      {
        "key": "D",
        "text": "5"
      }
    ],
    "answer": "A",
    "explanation": "Số cách chọn 2 nữ từ 5 nữ là $C_5^2=10$.",
    "points": 0.25,
    "tags": [
      "tổ hợp",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-d-03",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hai biến cố $A$, $B$ xung khắc với $P(A)=0{,}3$, $P(B)=0{,}4$. Khi đó $P(A\\cup B)$ bằng:",
    "options": [
      {
        "key": "A",
        "text": "0,12"
      },
      {
        "key": "B",
        "text": "0,35"
      },
      {
        "key": "C",
        "text": "0,5"
      },
      {
        "key": "D",
        "text": "0,7"
      }
    ],
    "answer": "D",
    "explanation": "Vì $A$ và $B$ xung khắc nên $P(A\\cup B)=P(A)+P(B)=0{,}7$.",
    "points": 0.25,
    "tags": [
      "xác suất",
      "biến cố xung khắc",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-d-04",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Có hai hộp bi. Hộp I chứa 4 bi đỏ và 2 bi xanh; hộp II chứa 2 bi đỏ và 4 bi xanh. Chọn ngẫu nhiên một hộp rồi lấy ngẫu nhiên một bi. Xác suất để bi được lấy ra có màu đỏ là:",
    "options": [
      {
        "key": "A",
        "text": "$\\frac{1}{3}$"
      },
      {
        "key": "B",
        "text": "$\\frac{1}{2}$"
      },
      {
        "key": "C",
        "text": "$\\frac{2}{3}$"
      },
      {
        "key": "D",
        "text": "$\\frac{5}{6}$"
      }
    ],
    "answer": "B",
    "explanation": "$P(\\text{đỏ})=\\frac{1}{2}\\cdot\\frac{4}{6}+\\frac{1}{2}\\cdot\\frac{2}{6}=\\frac{1}{2}$.",
    "points": 0.25,
    "tags": [
      "xác suất tổng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-d-05",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hai biến cố $A$, $B$ với $P(A)=0{,}5$ và xác suất của $B$ với điều kiện $A$ là $P(B|A)=0{,}6$. Khi đó $P(A\\cap B)$ bằng:",
    "options": [
      {
        "key": "A",
        "text": "0,3"
      },
      {
        "key": "B",
        "text": "0,8"
      },
      {
        "key": "C",
        "text": "0,1"
      },
      {
        "key": "D",
        "text": "0,5"
      }
    ],
    "answer": "A",
    "explanation": "$P(A\\cap B)=P(A)\\cdot P(B|A)=0{,}5\\cdot 0{,}6=0{,}3$.",
    "points": 0.25,
    "tags": [
      "xác suất có điều kiện",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-d-06",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Hai xạ thủ bắn vào bia một cách độc lập. Xác suất xạ thủ thứ nhất bắn trúng là 0,8 và của xạ thủ thứ hai là 0,7. Xác suất để có ít nhất một xạ thủ bắn trúng là:",
    "options": [
      {
        "key": "A",
        "text": "0,56"
      },
      {
        "key": "B",
        "text": "0,24"
      },
      {
        "key": "C",
        "text": "0,94"
      },
      {
        "key": "D",
        "text": "0,76"
      }
    ],
    "answer": "C",
    "explanation": "$P(\\text{ít nhất một trúng})=1-P(\\text{cả hai trượt})=1-0{,}2\\cdot 0{,}3=0{,}94$.",
    "points": 0.25,
    "tags": [
      "xác suất",
      "biến cố độc lập",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-d-07",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một lớp có 12 học sinh nam và 8 học sinh nữ. Chọn ngẫu nhiên 5 em sao cho có ít nhất 3 nữ. Số cách chọn là:",
    "options": [
      {
        "key": "A",
        "text": "4520"
      },
      {
        "key": "B",
        "text": "4592"
      },
      {
        "key": "C",
        "text": "4568"
      },
      {
        "key": "D",
        "text": "4620"
      }
    ],
    "answer": "B",
    "explanation": "Số cách $=C_8^3 C_{12}^2+C_8^4 C_{12}^1+C_8^5=56\\cdot 66+70\\cdot 12+56=3696+840+56=4592$.",
    "points": 0.25,
    "tags": [
      "tổ hợp có ràng buộc",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-d-08",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Xếp ngẫu nhiên 5 người (trong đó có An và Bình) thành một hàng ngang. Xác suất để An và Bình đứng cạnh nhau là $\\frac{a}{b}$ với $\\frac{a}{b}$ tối giản. Giá trị $a+b$ bằng:",
    "options": [
      {
        "key": "A",
        "text": "5"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "7"
      }
    ],
    "answer": "D",
    "explanation": "Số cách xếp cả 5 người là $5!=120$; hai người đứng cạnh nhau có $2\\cdot 4!=48$ cách. $P=\\frac{48}{120}=\\frac{2}{5}$ nên $a+b=2+5=7$.",
    "points": 0.25,
    "tags": [
      "xếp chỗ",
      "xác suất",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-d-09",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Gieo hai xúc xắc cân đối đồng chất. Biết tổng số chấm xuất hiện bằng 8. Xác suất để có một trong hai mặt xuất hiện 6 chấm là:",
    "options": [
      {
        "key": "A",
        "text": "$\\frac{2}{5}$"
      },
      {
        "key": "B",
        "text": "$\\frac{1}{2}$"
      },
      {
        "key": "C",
        "text": "$\\frac{3}{5}$"
      },
      {
        "key": "D",
        "text": "$\\frac{1}{5}$"
      }
    ],
    "answer": "A",
    "explanation": "Tổng bằng 8 có 5 khả năng: $(2;6),(3;5),(4;4),(5;3),(6;2)$. Trong đó chứa mặt 6 có 2 khả năng, $P=\\frac{2}{5}$.",
    "points": 0.25,
    "tags": [
      "xác suất có điều kiện",
      "xúc xắc",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-d-10",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Hộp I chứa 3 bi đỏ và 1 bi xanh; hộp II chứa 2 bi đỏ và 2 bi xanh. Chọn ngẫu nhiên một hộp (xác suất bằng nhau) rồi lấy ra hai bi. Biết hai bi được lấy ra cùng màu. Xác suất để hai bi được lấy từ hộp I là:",
    "options": [
      {
        "key": "A",
        "text": "0,5"
      },
      {
        "key": "B",
        "text": "0,4"
      },
      {
        "key": "C",
        "text": "0,6"
      },
      {
        "key": "D",
        "text": "0,75"
      }
    ],
    "answer": "C",
    "explanation": "$P(\\text{cùng màu}|I)=\\frac{C_3^2}{C_4^2}=\\frac{1}{2}$; $P(\\text{cùng màu}|II)=\\frac{C_2^2+C_2^2}{C_4^2}=\\frac{1}{3}$. $P(\\text{cùng màu})=\\frac{1}{2}\\cdot\\frac{1}{2}+\\frac{1}{2}\\cdot\\frac{1}{3}=\\frac{5}{12}$. $P(I|\\text{cùng màu})=\\frac{\\frac{1}{4}}{\\frac{5}{12}}=\\frac{3}{5}=0{,}6$.",
    "points": 0.25,
    "tags": [
      "công thức Bayes",
      "hộp bi",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-d-11",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một công ty có hai dây chuyền sản xuất: dây I sản xuất 60% tổng số sản phẩm với tỉ lệ lỗi 1%; dây II sản xuất 40% với tỉ lệ lỗi 2%. Lấy ngẫu nhiên một sản phẩm và thấy sản phẩm bị lỗi. Xác suất để sản phẩm đó do dây I sản xuất là:",
    "options": [
      {
        "key": "A",
        "text": "$\\frac{3}{4}$"
      },
      {
        "key": "B",
        "text": "$\\frac{3}{7}$"
      },
      {
        "key": "C",
        "text": "$\\frac{4}{7}$"
      },
      {
        "key": "D",
        "text": "$\\frac{1}{2}$"
      }
    ],
    "answer": "B",
    "explanation": "$P(\\text{lỗi})=0{,}6\\cdot 0{,}01+0{,}4\\cdot 0{,}02=0{,}014$. $P(I|\\text{lỗi})=\\frac{0{,}006}{0{,}014}=\\frac{3}{7}$.",
    "points": 0.25,
    "tags": [
      "công thức Bayes",
      "thực tế",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-d-12",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Có 10 học sinh nam và 6 học sinh nữ. Chọn ngẫu nhiên 5 em sao cho số học sinh nam nhiều hơn số học sinh nữ. Số cách chọn là:",
    "options": [
      {
        "key": "A",
        "text": "3220"
      },
      {
        "key": "B",
        "text": "3126"
      },
      {
        "key": "C",
        "text": "3310"
      },
      {
        "key": "D",
        "text": "3312"
      }
    ],
    "answer": "D",
    "explanation": "Các trường hợp (nam; nữ): $(3;2),(4;1),(5;0)$. Số cách $=C_{10}^3 C_6^2+C_{10}^4 C_6^1+C_{10}^5=120\\cdot 15+210\\cdot 6+252=1800+1260+252=3312$.",
    "points": 0.25,
    "tags": [
      "tổ hợp có ràng buộc",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-d-13",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một cây xác suất mô tả thí nghiệm: chọn ngẫu nhiên một trong hai hộp I, II (xác suất bằng nhau), rồi lấy ngẫu nhiên một bi từ hộp được chọn, như hình bên dưới. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Xác suất lấy được bi đỏ bằng 0,45."
      },
      {
        "key": "b",
        "text": "Xác suất lấy được bi xanh bằng 0,55."
      },
      {
        "key": "c",
        "text": "Biết bi lấy ra màu đỏ, xác suất nó đến từ hộp I bằng $\\frac{1}{2}$."
      },
      {
        "key": "d",
        "text": "Biết bi lấy ra màu xanh, xác suất nó đến từ hộp II bằng $\\frac{7}{11}$."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: $0{,}5\\cdot 0{,}6+0{,}5\\cdot 0{,}3=0{,}45$. b) Đúng: $1-0{,}45=0{,}55$. c) Sai: $P(I|\\text{đỏ})=\\frac{0{,}3}{0{,}45}=\\frac{2}{3}$. d) Đúng: $\\frac{0{,}35}{0{,}55}=\\frac{7}{11}$.",
    "points": 1,
    "tags": [
      "cây xác suất",
      "công thức Bayes",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "probtree",
      "text": "Hộp I: 0,5\n  Đỏ: 0,6\n  Xanh: 0,4\nHộp II: 0,5\n  Đỏ: 0,3\n  Xanh: 0,7"
    }
  },
  {
    "id": "thpt-toan-d-14",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Gieo một xúc xắc cân đối đồng chất hai lần liên tiếp. Gọi $A$ là biến cố \"tổng số chấm hai lần gieo bằng 7\" và $B$ là biến cố \"mặt xuất hiện ở lần gieo thứ nhất là số lẻ\". Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "$P(A)=\\frac{1}{6}$."
      },
      {
        "key": "b",
        "text": "$P(B)=\\frac{1}{2}$."
      },
      {
        "key": "c",
        "text": "$P(A|B)=\\frac{1}{4}$."
      },
      {
        "key": "d",
        "text": "$A$ và $B$ là hai biến cố độc lập."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: 6/36 trường hợp. b) Đúng: 18/36. c) Sai: $A\\cap B$ gồm $(1;6),(3;4),(5;2)$ nên $P(A|B)=\\frac{3}{18}=\\frac{1}{6}$. d) Đúng: vì $P(A|B)=P(A)$.",
    "points": 1,
    "tags": [
      "xác suất có điều kiện",
      "biến cố độc lập",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-d-15",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một nhóm 10 học sinh gồm 6 nam và 4 nữ được chọn 4 em đi trực nhật sao cho nhóm trực nhật có cả nam và nữ. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Tổng số cách chọn 4 em bất kỳ là 120."
      },
      {
        "key": "b",
        "text": "Số cách chọn 4 em đều là nam bằng 15."
      },
      {
        "key": "c",
        "text": "Số cách chọn thỏa mãn yêu cầu là 195."
      },
      {
        "key": "d",
        "text": "Xác suất nhóm trực nhật gồm đúng 2 nam và 2 nữ là $\\frac{3}{7}$."
      }
    ],
    "answer": "SĐSĐ",
    "explanation": "a) Sai: $C_{10}^4=210$. b) Đúng: $C_6^4=15$. c) Sai: số cách $=210-15-C_4^4=194$. d) Đúng: $\\frac{C_6^2 C_4^2}{C_{10}^4}=\\frac{90}{210}=\\frac{3}{7}$.",
    "points": 1,
    "tags": [
      "tổ hợp",
      "xác suất",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-d-16",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một loại bệnh có tỉ lệ người mắc là 1% trong dân số. Xét nghiệm có độ nhạy 95% (phát hiện đúng người mắc) và tỉ lệ dương giả 2% (cho kết quả dương ở người không mắc). Chọn ngẫu nhiên một người đi xét nghiệm. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Xác suất người này có kết quả dương là 0,0293."
      },
      {
        "key": "b",
        "text": "Biết kết quả dương, xác suất người này thực sự mắc bệnh xấp xỉ 0,68."
      },
      {
        "key": "c",
        "text": "Xác suất một người khỏe mạnh bị cho kết quả dương là 0,2."
      },
      {
        "key": "d",
        "text": "Biết kết quả dương, khả năng người này mắc bệnh nhỏ hơn 50%."
      }
    ],
    "answer": "ĐSSĐ",
    "explanation": "a) Đúng: $0{,}01\\cdot 0{,}95+0{,}99\\cdot 0{,}02=0{,}0293$. b) Sai: $P(\\text{bệnh}|\\text{dương})=\\frac{0{,}0095}{0{,}0293}\\approx 0{,}32$. c) Sai: đó là 2% $=0{,}02$. d) Đúng: $0{,}32<0{,}5$.",
    "points": 1,
    "tags": [
      "công thức Bayes",
      "xét nghiệm y tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-d-17",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Xếp ngẫu nhiên 6 học sinh gồm 3 nam và 3 nữ thành một hàng ngang. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Tổng số cách xếp là 720."
      },
      {
        "key": "b",
        "text": "Số cách xếp sao cho nam và nữ xen kẽ nhau là 72."
      },
      {
        "key": "c",
        "text": "Xác suất để ba nam đứng cạnh nhau bằng 0,3."
      },
      {
        "key": "d",
        "text": "Xác suất để không có hai nam nào đứng cạnh nhau bằng 0,1."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) Đúng: $6!=720$. b) Đúng: hai kiểu xen kẽ, mỗi kiểu $3!cdot3!=36$, tổng 72. c) Sai: coi ba nam là một khối có $4!cdot3!=144$ cách, $P=0{,}2$. d) Sai: xếp 3 nữ trước ($3!$ cách) tạo 4 chỗ trống, chọn 3 chỗ cho nam và hoán vị: $3!cdot C_4^3cdot3!=144$, $P=\frac{144}{720}=0{,}2$.",
    "points": 1,
    "tags": [
      "xếp chỗ",
      "xác suất",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-d-18",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Ba nhà máy A, B, C sản xuất lần lượt 50%, 30%, 20% số sản phẩm của một mặt hàng. Tỉ lệ sản phẩm lỗi của A, B, C lần lượt là 1%, 2%, 3%. Chọn ngẫu nhiên một sản phẩm. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Xác suất sản phẩm được chọn bị lỗi là 0,017."
      },
      {
        "key": "b",
        "text": "Biết sản phẩm bị lỗi, xác suất nó do nhà máy A sản xuất xấp xỉ 0,5."
      },
      {
        "key": "c",
        "text": "Biết sản phẩm bị lỗi, xác suất nó do nhà máy B sản xuất bằng $\\frac{6}{17}$."
      },
      {
        "key": "d",
        "text": "Biết sản phẩm bị lỗi, xác suất nó do nhà máy C sản xuất bằng 0,2."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng: $0{,}5\\cdot 0{,}01+0{,}3\\cdot 0{,}02+0{,}2\\cdot 0{,}03=0{,}005+0{,}006+0{,}006=0{,}017$. b) Sai: $P(A|\\text{lỗi})=\\frac{0{,}005}{0{,}017}=\\frac{5}{17}\\approx 0{,}29$. c) Đúng: $\\frac{0{,}006}{0{,}017}=\\frac{6}{17}$. d) Sai: $P(C|\\text{lỗi})=\\frac{0{,}006}{0{,}017}=\\frac{6}{17}\\approx 0{,}35$.",
    "points": 1,
    "tags": [
      "công thức Bayes",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-d-19",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một tổ có 8 học sinh. Chọn ngẫu nhiên 2 em trực nhật. Số cách chọn là bao nhiêu?",
    "answer": "28",
    "explanation": "$C_8^2=28$.",
    "points": 0.5,
    "tags": [
      "tổ hợp",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-d-20",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hai biến cố $A$, $B$ độc lập với $P(A)=0{,}4$, $P(B)=0{,}5$. Xác suất của biến cố \"$A$ và $B$ cùng xảy ra\" bằng bao nhiêu?",
    "answer": "0,2",
    "explanation": "Vì độc lập: $P(A\\cap B)=0{,}4\\cdot 0{,}5=0{,}2$.",
    "points": 0.5,
    "tags": [
      "biến cố độc lập",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-d-21",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Gieo hai xúc xắc cân đối đồng chất. Xác suất để tổng số chấm bằng 9 là $\\frac{a}{b}$ ($\\frac{a}{b}$ tối giản). Giá trị của $a+b$ bằng bao nhiêu?",
    "answer": "10",
    "explanation": "Tổng bằng 9 có 4 khả năng trong 36, $P=\\frac{4}{36}=\\frac{1}{9}$, $a+b=1+9=10$.",
    "points": 0.5,
    "tags": [
      "xác suất",
      "xúc xắc",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-d-22",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một kệ có 4 cuốn sách Toán khác nhau và 3 cuốn sách Lí khác nhau. Chọn ngẫu nhiên 3 cuốn. Xác suất để 3 cuốn được chọn cùng một môn là $\\frac{a}{b}$ ($\\frac{a}{b}$ tối giản). Giá trị $a+b$ là bao nhiêu?",
    "answer": "8",
    "explanation": "$\\frac{C_4^3+C_3^3}{C_7^3}=\\frac{4+1}{35}=\\frac{1}{7}$, $a+b=8$.",
    "points": 0.5,
    "tags": [
      "xác suất",
      "tổ hợp",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-d-23",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hộp I chứa 5 bi đỏ và 3 bi xanh; hộp II chứa 3 bi đỏ và 5 bi xanh. Chọn ngẫu nhiên một hộp (xác suất bằng nhau) rồi lấy một bi. Biết bi lấy ra màu đỏ. Xác suất bi đó từ hộp I là $\\frac{a}{b}$ ($\\frac{a}{b}$ tối giản). Giá trị $a+b$ bằng bao nhiêu?",
    "answer": "13",
    "explanation": "$P(\\text{đỏ})=\\frac{1}{2}\\cdot\\frac{5}{8}+\\frac{1}{2}\\cdot\\frac{3}{8}=\\frac{1}{2}$; $P(I|\\text{đỏ})=\\frac{\\frac{5}{16}}{\\frac{1}{2}}=\\frac{5}{8}$, $a+b=13$.",
    "points": 0.5,
    "tags": [
      "công thức Bayes",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "probtree",
      "text": "Hộp I: 0,5\n  Đỏ: 0,625\n  Xanh: 0,375\nHộp II: 0,5\n  Đỏ: 0,375\n  Xanh: 0,625"
    }
  },
  {
    "id": "thpt-toan-d-24",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một lớp học có 25 học sinh, trong đó 18 em thích môn Toán, 15 em thích môn Lí và 8 em thích cả hai môn. Chọn ngẫu nhiên một em. Xác suất em được chọn thích Toán nhưng không thích Lí là $\\frac{a}{b}$ ($\\frac{a}{b}$ tối giản). Giá trị $a+b$ là bao nhiêu?",
    "answer": "7",
    "explanation": "Số em thích Toán không thích Lí $=18-8=10$. Tổng số em $=18+15-8=25$. $P=\\frac{10}{25}=\\frac{2}{5}$ nên $a+b=2+5=7$.",
    "points": 0.5,
    "tags": [
      "xác suất",
      "tập hợp",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-d-25",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một hộp chứa 5 bi đỏ, 4 bi xanh và 3 bi vàng (các bi cùng loại). Lấy ngẫu nhiên 3 bi. Xác suất để ba bi có ba màu khác nhau là $\\frac{a}{b}$ ($\\frac{a}{b}$ tối giản). Giá trị $a+b$ là bao nhiêu?",
    "answer": "14",
    "explanation": "$P=\\frac{5\\cdot 4\\cdot 3}{C_{12}^3}=\\frac{60}{220}=\\frac{3}{11}$, $a+b=14$.",
    "points": 0.5,
    "tags": [
      "xác suất",
      "tổ hợp",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-e-01",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Số trung bình của mẫu số liệu $4;\\,6;\\,7;\\,9;\\,9$ là:",
    "options": [
      {
        "key": "A",
        "text": "6"
      },
      {
        "key": "B",
        "text": "8"
      },
      {
        "key": "C",
        "text": "7"
      },
      {
        "key": "D",
        "text": "9"
      }
    ],
    "answer": "C",
    "explanation": "$\\overline{x}=\\frac{4+6+7+9+9}{5}=7$.",
    "points": 0.25,
    "tags": [
      "thống kê",
      "số trung bình",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-e-02",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Mốt của mẫu số liệu $2;\\,3;\\,3;\\,5;\\,5;\\,5;\\,7$ là:",
    "options": [
      {
        "key": "A",
        "text": "5"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "7"
      },
      {
        "key": "D",
        "text": "2"
      }
    ],
    "answer": "A",
    "explanation": "Giá trị 5 xuất hiện 3 lần, nhiều nhất nên mốt là 5.",
    "points": 0.25,
    "tags": [
      "thống kê",
      "mốt",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-e-03",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong một mẫu gồm 40 học sinh, có 8 học sinh thuộc nhóm $[30;40)$. Tần suất của nhóm này là:",
    "options": [
      {
        "key": "A",
        "text": "0,4"
      },
      {
        "key": "B",
        "text": "0,2"
      },
      {
        "key": "C",
        "text": "0,8"
      },
      {
        "key": "D",
        "text": "0,25"
      }
    ],
    "answer": "B",
    "explanation": "Tần suất $=\\frac{8}{40}=0{,}2$.",
    "points": 0.25,
    "tags": [
      "thống kê",
      "tần suất",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-e-04",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Bảng thống kê tuổi của 50 người tham gia một câu lạc bộ như bên dưới. Số người có tuổi từ 30 trở lên là:",
    "options": [
      {
        "key": "A",
        "text": "35"
      },
      {
        "key": "B",
        "text": "40"
      },
      {
        "key": "C",
        "text": "45"
      },
      {
        "key": "D",
        "text": "25"
      }
    ],
    "answer": "B",
    "explanation": "Số người từ 30 tuổi trở lên $=15+20+5=40$.",
    "points": 0.25,
    "tags": [
      "thống kê",
      "bảng tần suất",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "table",
      "title": "Tuổi của 50 thành viên câu lạc bộ",
      "data": "[20; 30) [30; 40) [40; 50) [50; 60)\nSố người: 10; 15; 20; 5"
    }
  },
  {
    "id": "thpt-toan-e-05",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Mẫu số liệu ghép nhóm có bảng tần suất: nhóm $[0;10)$ có 5 phần tử, nhóm $[10;20)$ có 15 phần tử, nhóm $[20;30)$ có 20 phần tử, nhóm $[30;40)$ có 10 phần tử. Tứ phân vị thứ nhất của mẫu nằm trong nhóm nào?",
    "options": [
      {
        "key": "A",
        "text": "$[0;10)$"
      },
      {
        "key": "B",
        "text": "$[20;30)$"
      },
      {
        "key": "C",
        "text": "$[10;20)$"
      },
      {
        "key": "D",
        "text": "$[30;40)$"
      }
    ],
    "answer": "C",
    "explanation": "Với $n=50$, vị trí tứ phân vị thứ nhất là $\\frac{50}{4}=12{,}5$. Tần suất tích luỹ: nhóm $[0;10)$ chiếm 5, nhóm $[10;20)$ chiếm 20, nên giá trị thứ 12,5 thuộc nhóm $[10;20)$.",
    "points": 0.25,
    "tags": [
      "thống kê",
      "tứ phân vị",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-e-06",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Phương sai của mẫu số liệu $1;\\,2;\\,3;\\,4;\\,5$ là:",
    "options": [
      {
        "key": "A",
        "text": "5"
      },
      {
        "key": "B",
        "text": "4"
      },
      {
        "key": "C",
        "text": "$\\sqrt{2}$"
      },
      {
        "key": "D",
        "text": "2"
      }
    ],
    "answer": "D",
    "explanation": "$\\overline{x}=3$, $s^2=\\frac{(1-3)^2+(2-3)^2+(3-3)^2+(4-3)^2+(5-3)^2}{5}=\\frac{10}{5}=2$.",
    "points": 0.25,
    "tags": [
      "thống kê",
      "phương sai",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-e-07",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Biểu đồ tần suất bên dưới cho biết thời gian làm bài của 50 học sinh (phút). Ước lượng số trung bình của mẫu bằng công thức nhóm (lấy giá trị đại diện là giá trị giữa của mỗi nhóm):",
    "options": [
      {
        "key": "A",
        "text": "54 phút"
      },
      {
        "key": "B",
        "text": "55 phút"
      },
      {
        "key": "C",
        "text": "53 phút"
      },
      {
        "key": "D",
        "text": "56 phút"
      }
    ],
    "answer": "A",
    "explanation": "$\\overline{x}=\\frac{35\\cdot 5+45\\cdot 10+55\\cdot 20+65\\cdot 15}{50}=\\frac{2700}{50}=54$ phút.",
    "points": 0.25,
    "tags": [
      "thống kê",
      "mẫu ghép nhóm",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "hist",
      "title": "Thời gian làm bài của 50 học sinh",
      "xLabel": "Thời gian (phút)",
      "yLabel": "Số học sinh",
      "data": "[30; 40) [40; 50) [50; 60) [60; 70)\nSố học sinh: 5; 10; 20; 15"
    }
  },
  {
    "id": "thpt-toan-e-08",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hình chóp $S.ABC$ có đáy $ABC$ là tam giác vuông tại $B$ với $AB=BC=2$, cạnh bên $SA\\perp(ABC)$ và $SA=3$. Khoảng cách từ $A$ đến mặt phẳng $(SBC)$ bằng:",
    "options": [
      {
        "key": "A",
        "text": "$\\frac{\\sqrt{13}}{6}$"
      },
      {
        "key": "B",
        "text": "$\\frac{6\\sqrt{13}}{13}$"
      },
      {
        "key": "C",
        "text": "$\\frac{3\\sqrt{13}}{13}$"
      },
      {
        "key": "D",
        "text": "$\\frac{12}{13}$"
      }
    ],
    "answer": "B",
    "explanation": "Đặt hệ trục $A(0;0;0)$, $B(2;0;0)$, $C(2;2;0)$, $S(0;0;3)$. Mặt phẳng $(SBC)$ đi qua $B(2;0;0)$, $C(2;2;0)$, $S(0;0;3)$ có phương trình $3x+2z-6=0$, nên $d(A,(SBC))=\\frac{6}{\\sqrt{13}}=\\frac{6\\sqrt{13}}{13}$.",
    "points": 0.25,
    "tags": [
      "hình học không gian",
      "khoảng cách",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-e-09",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình vuông cạnh $a$, $SA\\perp(ABCD)$ và $SA=a\\sqrt{2}$. Góc giữa đường thẳng $SC$ và mặt phẳng $(ABCD)$ bằng:",
    "options": [
      {
        "key": "A",
        "text": "$30^{\\circ}$"
      },
      {
        "key": "B",
        "text": "$60^{\\circ}$"
      },
      {
        "key": "C",
        "text": "$90^{\\circ}$"
      },
      {
        "key": "D",
        "text": "$45^{\\circ}$"
      }
    ],
    "answer": "D",
    "explanation": "Góc cần tìm là $\\widehat{SCA}$ với $\\tan\\widehat{SCA}=\\frac{SA}{AC}=\\frac{a\\sqrt{2}}{a\\sqrt{2}}=1$, nên góc bằng $45^{\\circ}$.",
    "points": 0.25,
    "tags": [
      "hình học không gian",
      "góc",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-e-10",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong một khảo sát với cỡ mẫu $n=400$, người ta thu được tỉ lệ mẫu $f=0{,}5$. Với độ tin cậy 95% ($z_{0{,}975}=1{,}96$), biên lỗi của khoảng ước lượng cho tỉ lệ tổng thể xấp xỉ bằng:",
    "options": [
      {
        "key": "A",
        "text": "0,05"
      },
      {
        "key": "B",
        "text": "0,5"
      },
      {
        "key": "C",
        "text": "0,005"
      },
      {
        "key": "D",
        "text": "0,1"
      }
    ],
    "answer": "A",
    "explanation": "Biên lỗi $=1{,}96\\sqrt{\\frac{f(1-f)}{n}}=1{,}96\\sqrt{\\frac{0{,}25}{400}}=1{,}96\\cdot 0{,}025=0{,}049\\approx 0{,}05$.",
    "points": 0.25,
    "tags": [
      "thống kê",
      "ước lượng khoảng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-e-11",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hình lập phương $ABCD.A'B'C'D'$ có cạnh 3. Khoảng cách giữa hai đường thẳng $AB$ và $C'D'$ bằng:",
    "options": [
      {
        "key": "A",
        "text": "3"
      },
      {
        "key": "B",
        "text": "$3\\sqrt{3}$"
      },
      {
        "key": "C",
        "text": "6"
      },
      {
        "key": "D",
        "text": "$3\\sqrt{2}$"
      }
    ],
    "answer": "D",
    "explanation": "$AB\\parallel C'D'$ (cùng song song cạnh hình lập phương). Khoảng cách giữa hai đường song song bằng khoảng cách từ $A$ đến $C'D'$. Đặt hệ trục $A(0;0;0)$: các điểm của $C'D'$ có dạng $(t;3;3)$, khoảng cách tới $A$ là $\\sqrt{t^2+18}$ nhỏ nhất khi $t=0$, bằng $\\sqrt{18}=3\\sqrt{2}$.",
    "points": 0.25,
    "tags": [
      "hình học không gian",
      "khoảng cách hai đường thẳng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-e-12",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong không gian $Oxyz$, cho mặt cầu $(S):\\,x^2+y^2+z^2-2x-4y+4=0$ và điểm $M(3;2;4)$. Khoảng cách từ $M$ đến mặt cầu $(S)$ bằng:",
    "options": [
      {
        "key": "A",
        "text": "$2\\sqrt{5}$"
      },
      {
        "key": "B",
        "text": "$2\\sqrt{5}+1$"
      },
      {
        "key": "C",
        "text": "$2\\sqrt{5}-1$"
      },
      {
        "key": "D",
        "text": "$\\sqrt{5}$"
      }
    ],
    "answer": "C",
    "explanation": "Tâm $I(1;2;0)$, $R=1$; $MI=\\sqrt{(3-1)^2+0+16}=2\\sqrt{5}>R$ nên $d=MI-R=2\\sqrt{5}-1$.",
    "points": 0.25,
    "tags": [
      "mặt cầu",
      "khoảng cách",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-e-13",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Bảng thống kê bên dưới cho biết số giờ tự học trong một tuần của 40 học sinh. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Có 12 học sinh tự học từ 2 đến dưới 4 giờ."
      },
      {
        "key": "b",
        "text": "Nhóm chứa trung vị của mẫu là $[4;6)$."
      },
      {
        "key": "c",
        "text": "Số học sinh tự học dưới 4 giờ là 20."
      },
      {
        "key": "d",
        "text": "Giá trị trung bình ước lượng của mẫu bằng 4,2 giờ."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng theo bảng. b) Đúng: tần suất tích luỹ tới $[4;6)$ là 18, giá trị thứ $\\frac{40}{2}=20$ nằm trong $[4;6)$. c) Sai: chỉ có $6+12=18$ học sinh. d) Đúng: $\\frac{1\\cdot 6+3\\cdot 12+5\\cdot 14+7\\cdot 8}{40}=\\frac{168}{40}=4{,}2$.",
    "points": 1,
    "tags": [
      "thống kê",
      "mẫu ghép nhóm",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "table",
      "title": "Số giờ tự học mỗi tuần của 40 học sinh",
      "data": "[0; 2) [2; 4) [4; 6) [6; 8)\nSố học sinh: 6; 12; 14; 8"
    }
  },
  {
    "id": "thpt-toan-e-14",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hình chóp đều $S.ABC$ có đáy là tam giác đều cạnh 4 và chiều cao $SO=\\sqrt{6}$, như hình bên dưới ($O$ là trọng tâm đáy). Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Cạnh bên $SA=3\\sqrt{2}$."
      },
      {
        "key": "b",
        "text": "Góc giữa $SA$ và mặt đáy khoảng $35^{\\circ}$."
      },
      {
        "key": "c",
        "text": "Thể tích khối chóp bằng $8\\sqrt{2}$."
      },
      {
        "key": "d",
        "text": "Khoảng cách từ $O$ đến cạnh $BC$ bằng $\\frac{2\\sqrt{3}}{3}$."
      }
    ],
    "answer": "SSSĐ",
    "explanation": "Gọi $M$ là trung điểm $BC$: $AM=2sqrt{3}$, $OA=\frac{2}{3}AM=\frac{4sqrt{3}}{3}$, $OM=\frac{2sqrt{3}}{3}$. a) Sai: $SA^2=6+\frac{16}{3}=\frac{34}{3}$, $SAapprox3{,}37\ne3sqrt{2}$. b) Sai: $\tanwidehat{SAO}=\frac{sqrt{6}}{4sqrt{3}/3}approx1{,}06$, góc $approx46{,}7^{circ}$. c) Sai: $V=\frac{1}{3}cdot4sqrt{3}cdotsqrt{6}=4sqrt{2}$. d) Đúng: $d(O,BC)=OM=\frac{2sqrt{3}}{3}$.",
    "points": 1,
    "tags": [
      "hình học không gian",
      "hình chóp đều",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "pyramid3-regular",
      "names": [
        "S",
        "A",
        "B",
        "C"
      ],
      "height": true,
      "diagonals": false
    }
  },
  {
    "id": "thpt-toan-e-15",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Biểu đồ đường bên dưới cho biết doanh thu (triệu đồng) của một cửa hàng trong 5 tháng liên tiếp. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Doanh thu trung bình của 5 tháng bằng 24 triệu đồng."
      },
      {
        "key": "b",
        "text": "Số trung vị của mẫu là 25 triệu đồng."
      },
      {
        "key": "c",
        "text": "Phương sai của mẫu bằng 11."
      },
      {
        "key": "d",
        "text": "Tháng có doanh thu cao nhất là tháng thứ 4."
      }
    ],
    "answer": "SĐSĐ",
    "explanation": "a) Sai: $\\overline{x}=\\frac{20+25+22+30+28}{5}=25$. b) Đúng: mẫu sắp xếp $20;22;25;28;30$ có trung vị 25. c) Sai: $s^2=\\frac{25+0+9+25+9}{5}=\\frac{68}{5}=13{,}6$. d) Đúng: tháng 4 có doanh thu 30 triệu, lớn nhất.",
    "points": 1,
    "tags": [
      "thống kê",
      "biểu đồ đường",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "line",
      "title": "Doanh thu 5 tháng của cửa hàng",
      "xLabel": "Tháng",
      "yLabel": "Doanh thu (triệu đồng)",
      "data": "Tháng 1; Tháng 2; Tháng 3; Tháng 4; Tháng 5\nDoanh thu (triệu đồng): 20; 25; 22; 30; 28"
    }
  },
  {
    "id": "thpt-toan-e-16",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Trong không gian $Oxyz$, cho ba điểm $A(1;0;0)$, $B(0;2;0)$, $C(0;0;2)$ và mặt phẳng $(ABC):\\,2x+y+z-2=0$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Khoảng cách từ $O$ đến $(ABC)$ bằng $\\frac{\\sqrt{6}}{3}$."
      },
      {
        "key": "b",
        "text": "Góc giữa $(ABC)$ và mặt phẳng $(Oxy)$ khoảng $24^{\\circ}$."
      },
      {
        "key": "c",
        "text": "Thể tích khối chóp $O.ABC$ bằng $\\frac{2}{3}$."
      },
      {
        "key": "d",
        "text": "Điểm $M(1;1;0)$ thuộc mặt phẳng $(ABC)$."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng: $\\frac{|-2|}{\\sqrt{4+1+1}}=\\frac{2}{\\sqrt{6}}=\\frac{\\sqrt{6}}{3}$. b) Sai: $\\cos\\theta=\\frac{|\\vec{n}\\cdot\\vec{k}|}{|\\vec{n}|}=\\frac{1}{\\sqrt{6}}$ nên $\\theta\\approx 66^{\\circ}$. c) Đúng: $V=\\frac{1}{6}\\left|\\det\\right|=\\frac{1}{6}\\cdot 4=\\frac{2}{3}$. d) Sai: $2+1+0-2=1\\ne 0$.",
    "points": 1,
    "tags": [
      "hình học Oxyz",
      "thể tích",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-e-17",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Bảng tần suất bên dưới ghi lại điểm bài kiểm tra Toán của 40 học sinh. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Nhóm chứa mốt của mẫu là $[8;10)$."
      },
      {
        "key": "b",
        "text": "Tỉ lệ học sinh đạt từ 8 điểm trở lên là 30%."
      },
      {
        "key": "c",
        "text": "Trung vị của mẫu thuộc nhóm $[6;8)$."
      },
      {
        "key": "d",
        "text": "Giá trị trung bình ước lượng của mẫu bằng 7,0."
      }
    ],
    "answer": "SĐĐS",
    "explanation": "a) Sai: nhóm $[6;8)$ có tần suất lớn nhất (20). b) Đúng: $\\frac{12}{40}=30\\%$. c) Đúng: tần suất tích luỹ tới $[6;8)$ là 28, giá trị thứ 20 nằm ở đây. d) Sai: $\\frac{5\\cdot 8+7\\cdot 20+9\\cdot 12}{40}=\\frac{288}{40}=7{,}2$.",
    "points": 1,
    "tags": [
      "thống kê",
      "mẫu ghép nhóm",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "table",
      "title": "Điểm kiểm tra Toán của 40 học sinh",
      "data": "[4; 6) [6; 8) [8; 10)\nSố học sinh: 8; 20; 12"
    }
  },
  {
    "id": "thpt-toan-e-18",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình vuông cạnh 2, $SA\\perp(ABCD)$, $SA=2$, như hình bên dưới. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Độ dài đường chéo $BD$ bằng $2\\sqrt{2}$."
      },
      {
        "key": "b",
        "text": "Góc giữa đường thẳng $SB$ và mặt đáy là góc $\\widehat{SBA}$."
      },
      {
        "key": "c",
        "text": "Khoảng cách từ $B$ đến mặt phẳng $(SAD)$ bằng $\\sqrt{2}$."
      },
      {
        "key": "d",
        "text": "Thể tích khối chóp bằng $\\frac{8}{3}$."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: $BD=2\\sqrt{2}$. b) Đúng: $AB\\perp(SA)$? Góc giữa $SB$ và $(ABCD)$ là góc giữa $SB$ và hình chiếu $BA$ của nó trên đáy, tức $\\widehat{SBA}$. c) Sai: $(SAD)$ chính là mặt phẳng $(Oxz)$ trong hệ trục đặt $A$ gốc; $d(B,(SAD))=AB=2$. d) Đúng: $V=\\frac{1}{3}\\cdot 2\\cdot 2\\cdot 2=\\frac{8}{3}$.",
    "points": 1,
    "tags": [
      "hình học không gian",
      "hình chóp",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "pyramid4-sa",
      "names": [
        "S",
        "A",
        "B",
        "C",
        "D"
      ],
      "height": true,
      "diagonals": false
    }
  },
  {
    "id": "thpt-toan-e-19",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Số trung bình cộng của mẫu số liệu $3;\\,5;\\,7;\\,9$ là bao nhiêu?",
    "answer": "6",
    "explanation": "$\\overline{x}=\\frac{3+5+7+9}{4}=6$.",
    "points": 0.5,
    "tags": [
      "thống kê",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-e-20",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Khoảng biến thiên của mẫu số liệu $2;\\,5;\\,1;\\,8;\\,4$ là bao nhiêu?",
    "answer": "7",
    "explanation": "$R=x_{\\max}-x_{\\min}=8-1=7$.",
    "points": 0.5,
    "tags": [
      "thống kê",
      "khoảng biến thiên",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-e-21",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Mẫu ghép nhóm có tần suất: nhóm $[10;20)$ có 10 phần tử, nhóm $[20;30)$ có 20 phần tử, nhóm $[30;40)$ có 20 phần tử. Tần suất của nhóm $[20;30)$ là bao nhiêu?",
    "answer": "0,4",
    "explanation": "Tổng số phần tử $=50$; tần suất $=\\frac{20}{50}=0{,}4$.",
    "points": 0.5,
    "tags": [
      "thống kê",
      "tần suất",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-e-22",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Phương sai của mẫu số liệu $2;\\,4;\\,6;\\,8$ là bao nhiêu?",
    "answer": "5",
    "explanation": "$\\overline{x}=5$, $s^2=\\frac{9+1+1+9}{4}=5$.",
    "points": 0.5,
    "tags": [
      "thống kê",
      "phương sai",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-e-23",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho hình lập phương $ABCD.A'B'C'D'$ cạnh 4. Khoảng cách từ $A'$ đến mặt phẳng $(AB'C')$ là $d$. Giá trị của $d^2$, làm tròn đến hàng phần trăm, là bao nhiêu?",
    "answer": "8",
    "explanation": "Chọn $A(0;0;0)$, $B'(4;0;4)$, $C'(4;4;4)$, $A'(0;0;4)$. Mặt phẳng $(AB'C')$ có VTPT $[\u000bec{AB'},\u000bec{AC'}]$ cùng phương $(1;0;-1)$, phương trình $x-z=0$. $d=\frac{|0-4|}{sqrt{2}}=2sqrt{2}$, $d^2=8$.",
    "points": 0.5,
    "tags": [
      "hình học không gian",
      "khoảng cách",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-e-24",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho hình chóp $S.ABCD$ có đáy là hình vuông, $SA\\perp(ABCD)$, $AB=a$ và $SA=2a$. Góc giữa đường thẳng $SB$ và mặt phẳng $(ABCD)$ (làm tròn đến hàng độ) là bao nhiêu độ?",
    "answer": "63",
    "explanation": "Góc là $\\widehat{SBA}$, $\\tan\\widehat{SBA}=\\frac{SA}{AB}=2$ nên góc $\\approx 63{,}4^{\\circ}\\approx 63^{\\circ}$.",
    "points": 0.5,
    "tags": [
      "hình học không gian",
      "góc",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-e-25",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Bảng tần suất ghép nhóm về thời gian chạy 100 m của 40 bạn học sinh: nhóm $[10;20)$ có 8 bạn, nhóm $[20;30)$ có 16 bạn, nhóm $[30;40)$ có 12 bạn, nhóm $[40;50)$ có 4 bạn. Trung vị ước lượng của mẫu (làm tròn đến hàng phần mười) là bao nhiêu giây?",
    "answer": "27,5",
    "explanation": "Giá trị thứ 20 thuộc nhóm $[20;30)$: $Me=20+\\frac{20-8}{16}\\cdot 10=20+7{,}5=27{,}5$ giây.",
    "points": 0.5,
    "tags": [
      "thống kê",
      "trung vị mẫu ghép nhóm",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-f-01",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Giá trị của $\\sin 150^{\\circ}$ là:",
    "options": [
      {
        "key": "A",
        "text": "$\\frac{\\sqrt{3}}{2}$"
      },
      {
        "key": "B",
        "text": "$-\\frac{1}{2}$"
      },
      {
        "key": "C",
        "text": "$\\frac{1}{2}$"
      },
      {
        "key": "D",
        "text": "$-\\frac{\\sqrt{3}}{2}$"
      }
    ],
    "answer": "C",
    "explanation": "$\\sin 150^{\\circ}=\\sin(180^{\\circ}-30^{\\circ})=\\sin 30^{\\circ}=\\frac{1}{2}$.",
    "points": 0.25,
    "tags": [
      "lượng giác",
      "giá trị lượng giác",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-f-02",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Công thức nhân đôi đúng cho mọi góc $\\alpha$ là:",
    "options": [
      {
        "key": "A",
        "text": "$\\sin 2\\alpha=2\\sin\\alpha\\cos\\alpha$"
      },
      {
        "key": "B",
        "text": "$\\sin 2\\alpha=\\sin\\alpha\\cos\\alpha$"
      },
      {
        "key": "C",
        "text": "$\\sin 2\\alpha=\\sin^2\\alpha-\\cos^2\\alpha$"
      },
      {
        "key": "D",
        "text": "$\\sin 2\\alpha=2\\sin\\alpha+\\cos\\alpha$"
      }
    ],
    "answer": "A",
    "explanation": "Theo công thức cộng: $\\sin(\\alpha+\\alpha)=\\sin\\alpha\\cos\\alpha+\\cos\\alpha\\sin\\alpha=2\\sin\\alpha\\cos\\alpha$.",
    "points": 0.25,
    "tags": [
      "lượng giác",
      "công thức nhân đôi",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-f-03",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Dãy số nào sau đây là một cấp số cộng?",
    "options": [
      {
        "key": "A",
        "text": "$1;\\,4;\\,7;\\,10$"
      },
      {
        "key": "B",
        "text": "$1;\\,3;\\,7;\\,15$"
      },
      {
        "key": "C",
        "text": "$2;\\,4;\\,8;\\,16$"
      },
      {
        "key": "D",
        "text": "$1;\\,4;\\,9;\\,16$"
      }
    ],
    "answer": "A",
    "explanation": "$1;4;7;10$ có công sai $d=3$. Ba dãy còn lại không phải cấp số cộng (dãy C là cấp số nhân).",
    "points": 0.25,
    "tags": [
      "cấp số cộng",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-f-04",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Giá trị của $\\log_2 8$ là:",
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "3"
      },
      {
        "key": "C",
        "text": "4"
      },
      {
        "key": "D",
        "text": "8"
      }
    ],
    "answer": "B",
    "explanation": "$\\log_2 8=\\log_2 2^3=3$.",
    "points": 0.25,
    "tags": [
      "logarit",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-f-05",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Một cấp số cộng có số hạng đầu $a_1=3$ và công sai $d=4$. Số hạng thứ 10 của cấp số cộng là:",
    "options": [
      {
        "key": "A",
        "text": "36"
      },
      {
        "key": "B",
        "text": "40"
      },
      {
        "key": "C",
        "text": "39"
      },
      {
        "key": "D",
        "text": "43"
      }
    ],
    "answer": "C",
    "explanation": "$a_{10}=a_1+9d=3+36=39$.",
    "points": 0.25,
    "tags": [
      "cấp số cộng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-f-06",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Một cấp số nhân có số hạng đầu $a_1=2$ và công bội $q=3$. Số hạng thứ 5 của cấp số nhân là:",
    "options": [
      {
        "key": "A",
        "text": "54"
      },
      {
        "key": "B",
        "text": "162"
      },
      {
        "key": "C",
        "text": "128"
      },
      {
        "key": "D",
        "text": "96"
      }
    ],
    "answer": "B",
    "explanation": "$a_5=a_1 q^4=2\\cdot 3^4=2\\cdot 81=162$.",
    "points": 0.25,
    "tags": [
      "cấp số nhân",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-f-07",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hai điểm $A(1;2)$ và $B(3;-1)$ như hình bên dưới. Độ dài vectơ $\\vec{AB}$ là:",
    "options": [
      {
        "key": "A",
        "text": "$\\sqrt{11}$"
      },
      {
        "key": "B",
        "text": "$\\sqrt{13}$"
      },
      {
        "key": "C",
        "text": "$\\sqrt{15}$"
      },
      {
        "key": "D",
        "text": "5"
      }
    ],
    "answer": "B",
    "explanation": "$\\vec{AB}=(2;-3)$ nên $|\\vec{AB}|=\\sqrt{2^2+(-3)^2}=\\sqrt{13}$.",
    "points": 0.25,
    "tags": [
      "vectơ",
      "toạ độ",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "oxy",
      "xMin": -1,
      "xMax": 4,
      "yMin": -2,
      "yMax": 3,
      "items": "A(1; 2)\nB(3; -1)\nAB"
    }
  },
  {
    "id": "thpt-toan-f-08",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Số nghiệm của phương trình $\\sin x=\\frac{\\sqrt{3}}{2}$ trên đoạn $[0;2\\pi]$ (đồ thị $y=\\sin x$ như hình bên dưới) là:",
    "options": [
      {
        "key": "A",
        "text": "2"
      },
      {
        "key": "B",
        "text": "1"
      },
      {
        "key": "C",
        "text": "3"
      },
      {
        "key": "D",
        "text": "4"
      }
    ],
    "answer": "A",
    "explanation": "Trên $[0;2\\pi]$, $\\sin x=\\frac{\\sqrt{3}}{2}$ tại $x=\\frac{\\pi}{3}$ và $x=\\pi-\\frac{\\pi}{3}=\\frac{2\\pi}{3}$: hai nghiệm.",
    "points": 0.25,
    "tags": [
      "lượng giác",
      "phương trình",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "sin(x)"
      ],
      "xMin": 0,
      "xMax": 6.5
    }
  },
  {
    "id": "thpt-toan-f-09",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Tổng 20 số hạng đầu của cấp số cộng $3;\\,7;\\,11;\\,15;\\ldots$ là:",
    "options": [
      {
        "key": "A",
        "text": "760"
      },
      {
        "key": "B",
        "text": "780"
      },
      {
        "key": "C",
        "text": "800"
      },
      {
        "key": "D",
        "text": "820"
      }
    ],
    "answer": "D",
    "explanation": "$S_{20}=\\frac{20}{2}\\left(2\\cdot 3+19\\cdot 4\\right)=10\\cdot 82=820$.",
    "points": 0.25,
    "tags": [
      "cấp số cộng",
      "tổng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-f-10",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho $\\log 2=0{,}3$ (cơ số 10). Giá trị của $\\log 5$ là:",
    "options": [
      {
        "key": "A",
        "text": "0,2"
      },
      {
        "key": "B",
        "text": "0,5"
      },
      {
        "key": "C",
        "text": "0,7"
      },
      {
        "key": "D",
        "text": "0,8"
      }
    ],
    "answer": "C",
    "explanation": "$\\log 5=\\log\\frac{10}{2}=1-\\log 2=1-0{,}3=0{,}7$.",
    "points": 0.25,
    "tags": [
      "logarit",
      "tính chất",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-f-11",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Nghiệm lớn nhất của phương trình $9^x-4\\cdot 3^x+3=0$ là:",
    "options": [
      {
        "key": "A",
        "text": "0"
      },
      {
        "key": "B",
        "text": "2"
      },
      {
        "key": "C",
        "text": "3"
      },
      {
        "key": "D",
        "text": "1"
      }
    ],
    "answer": "D",
    "explanation": "Đặt $t=3^x>0$: $t^2-4t+3=0\\Leftrightarrow t=1$ hoặc $t=3$, nên $x=0$ hoặc $x=1$. Nghiệm lớn nhất là $x=1$.",
    "points": 0.25,
    "tags": [
      "hàm mũ",
      "phương trình",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-f-12",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Tập nghiệm của bất phương trình $\\log_{\\frac{1}{2}}(2x-1)>-2$ là:",
    "options": [
      {
        "key": "A",
        "text": "$\\left(0;\\frac{5}{2}\\right)$"
      },
      {
        "key": "B",
        "text": "$\\left(-\\infty;\\frac{5}{2}\\right)$"
      },
      {
        "key": "C",
        "text": "$\\left(\\frac{1}{2};+\\infty\\right)$"
      },
      {
        "key": "D",
        "text": "$\\left(\\frac{1}{2};\\frac{5}{2}\\right)$"
      }
    ],
    "answer": "D",
    "explanation": "Vì cơ số $\\frac{1}{2}<1$, bất phương trình tương đương $0<2x-1<\\left(\\frac{1}{2}\\right)^{-2}=4$, tức $\\frac{1}{2}<x<\\frac{5}{2}$.",
    "points": 0.25,
    "tags": [
      "logarit",
      "bất phương trình",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-f-13",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cho dãy số $5;\\,8;\\,11;\\,14;\\ldots$ Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Công sai của dãy là $d=3$."
      },
      {
        "key": "b",
        "text": "Số hạng thứ 10 của dãy bằng 32."
      },
      {
        "key": "c",
        "text": "Số 100 là số hạng thứ 32 của dãy."
      },
      {
        "key": "d",
        "text": "Tổng 30 số hạng đầu của dãy bằng 1455."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng. b) Đúng: $a_{10}=5+9\\cdot 3=32$. c) Sai: $\\frac{100-5}{3}=\\frac{95}{3}$ không nguyên nên 100 không thuộc dãy. d) Đúng: $S_{30}=\\frac{30}{2}(2\\cdot 5+29\\cdot 3)=15\\cdot 97=1455$.",
    "points": 1,
    "tags": [
      "cấp số cộng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-f-14",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cho góc $\\alpha$ nhọn với $\\sin\\alpha=\\frac{3}{5}$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "$\\cos\\alpha=\\frac{4}{5}$."
      },
      {
        "key": "b",
        "text": "$\\tan\\alpha=\\frac{4}{3}$."
      },
      {
        "key": "c",
        "text": "$\\sin 2\\alpha=\\frac{24}{25}$."
      },
      {
        "key": "d",
        "text": "$\\cos 2\\alpha=\\frac{7}{25}$."
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) Đúng: $\\cos\\alpha=\\sqrt{1-\\frac{9}{25}}=\\frac{4}{5}$. b) Sai: $\\tan\\alpha=\\frac{3}{4}$. c) Đúng: $2\\cdot\\frac{3}{5}\\cdot\\frac{4}{5}=\\frac{24}{25}$. d) Đúng: $1-2\\cdot\\frac{9}{25}=\\frac{7}{25}$.",
    "points": 1,
    "tags": [
      "lượng giác",
      "đồng nhất thức",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-f-15",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Số lượng vi khuẩn trong một mẫu nuôi cấy ban đầu là 500 con, tăng thêm 20% mỗi giờ, được mô hình hóa bởi $N(t)=500\\cdot 1{,}2^t$ (con) với $t$ tính bằng giờ. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Sau 3 giờ, mẫu có 864 con vi khuẩn."
      },
      {
        "key": "b",
        "text": "Hàm số $N(t)$ đồng biến trên tập số dương."
      },
      {
        "key": "c",
        "text": "Sau 5 giờ, mẫu có đúng 1250 con vi khuẩn."
      },
      {
        "key": "d",
        "text": "Để số vi khuẩn vượt quá 2000 con cần ít nhất 8 giờ."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: $500\\cdot 1{,}2^3=500\\cdot 1{,}728=864$. b) Đúng: cơ số $1{,}2>1$. c) Sai: $500\\cdot 1{,}2^5\\approx 1244{,}2$ con, không đúng 1250. d) Đúng: $1{,}2^t>4\\Rightarrow t>\\frac{\\ln 4}{\\ln 1{,}2}\\approx 7{,}6$ nên cần $t\\ge 8$ giờ.",
    "points": 1,
    "tags": [
      "hàm mũ",
      "thực tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-f-16",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Trong mặt phẳng toạ độ $Oxy$, cho ba điểm $A(-1;2)$, $B(3;4)$ và $C(1;0)$ như hình bên dưới. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "$\\vec{AB}=(4;2)$."
      },
      {
        "key": "b",
        "text": "$|\\vec{AC}|=2\\sqrt{2}$."
      },
      {
        "key": "c",
        "text": "$\\vec{AB}\\perp\\vec{BC}$."
      },
      {
        "key": "d",
        "text": "Trung điểm của đoạn $BC$ là điểm $(2;2)$."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng. b) Đúng: $\\vec{AC}=(2;-2)$, $|\\vec{AC}|=\\sqrt{8}=2\\sqrt{2}$. c) Sai: $\\vec{BC}=(-2;-4)$ và $\\vec{AB}\\cdot\\vec{BC}=-8-8=-16\\ne 0$. d) Đúng: $\\left(\\frac{3+1}{2};\\frac{4+0}{2}\\right)=(2;2)$.",
    "points": 1,
    "tags": [
      "vectơ",
      "toạ độ",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "oxy",
      "xMin": -2,
      "xMax": 4,
      "yMin": -1,
      "yMax": 5,
      "items": "A(-1; 2)\nB(3; 4)\nC(1; 0)\nAB, BC, CA"
    }
  },
  {
    "id": "thpt-toan-f-17",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Người ta gửi 50 triệu đồng vào ngân hàng với lãi suất 6% một năm, lãi nhập gốc theo năm (sau mỗi năm, tiền gửi và lãi cùng tiếp tục gửi với lãi suất đó). Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Sau 2 năm, người đó nhận được đúng 56,18 triệu đồng (khi rút hết)."
      },
      {
        "key": "b",
        "text": "Số tiền sau $t$ năm được mô hình hóa bởi $S(t)=50\\cdot 1{,}06^t$ (triệu đồng)."
      },
      {
        "key": "c",
        "text": "Để số tiền đạt ít nhất 70 triệu đồng, cần gửi tối thiểu 5 năm."
      },
      {
        "key": "d",
        "text": "Nếu lãi nhập gốc theo quý (lãi danh nghĩa 6%/năm) thì sau 1 năm người đó nhận nhiều hơn 53 triệu đồng."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: $50\\cdot 1{,}06^2=56{,}18$. b) Đúng. c) Sai: $1{,}06^t\\ge 1{,}4\\Rightarrow t\\ge\\frac{\\ln 1{,}4}{\\ln 1{,}06}\\approx 5{,}8$, nên cần ít nhất 6 năm. d) Đúng: $50\\cdot(1{,}015)^4\\approx 53{,}07$ triệu $>53$ triệu.",
    "points": 1,
    "tags": [
      "hàm mũ",
      "lãi suất",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-f-18",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cho dãy số $(u_n)$ với $u_1=1$ và $u_{n+1}=2u_n+1$ với mọi $n\\ge 1$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "$u_2=3$ và $u_3=7$."
      },
      {
        "key": "b",
        "text": "Dãy $(v_n)$ với $v_n=u_n+1$ là một cấp số nhân công bội 2."
      },
      {
        "key": "c",
        "text": "Công thức tổng quát của dãy là $u_n=2^n$."
      },
      {
        "key": "d",
        "text": "$u_{10}=1023$."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: $u_2=3$, $u_3=7$. b) Đúng: $v_{n+1}=u_{n+1}+1=2(u_n+1)=2v_n$ và $v_1=2$. c) Sai: $u_n=2^n-1$. d) Đúng: $u_{10}=2^{10}-1=1023$.",
    "points": 1,
    "tags": [
      "dãy số",
      "quy nạp",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-f-19",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Giá trị của $\\cos 60^{\\circ}$ là bao nhiêu?",
    "answer": "0,5",
    "explanation": "$\\cos 60^{\\circ}=\\frac{1}{2}=0{,}5$.",
    "points": 0.5,
    "tags": [
      "lượng giác",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-f-20",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Giá trị của $\\log_3 27$ là bao nhiêu?",
    "answer": "3",
    "explanation": "$\\log_3 27=\\log_3 3^3=3$.",
    "points": 0.5,
    "tags": [
      "logarit",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-f-21",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một cấp số cộng có $a_5=11$ và $a_9=23$. Công sai của cấp số cộng là bao nhiêu?",
    "answer": "3",
    "explanation": "$d=\\frac{a_9-a_5}{9-5}=\\frac{12}{4}=3$.",
    "points": 0.5,
    "tags": [
      "cấp số cộng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-f-22",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một cấp số nhân có $a_2=6$ và $a_5=48$ (các số hạng đều dương). Công bội của cấp số nhân là bao nhiêu?",
    "answer": "2",
    "explanation": "$q^3=\\frac{a_5}{a_2}=8\\Rightarrow q=2$.",
    "points": 0.5,
    "tags": [
      "cấp số nhân",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-f-23",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một tổ có 10 học sinh. Chọn ngẫu nhiên 3 em tham gia vệ sinh lớp học. Số cách chọn là bao nhiêu?",
    "answer": "120",
    "explanation": "$C_{10}^3=120$.",
    "points": 0.5,
    "tags": [
      "tổ hợp",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-f-24",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho góc $\\alpha$ thỏa mãn $\\sin\\alpha=0{,}6$ và $0^{\\circ}<\\alpha<90^{\\circ}$. Giá trị của $\\cos\\alpha$ là bao nhiêu?",
    "answer": "0,8",
    "explanation": "$\\cos\\alpha=\\sqrt{1-0{,}36}=\\sqrt{0{,}64}=0{,}8$ (dương vì $\\alpha$ nhọn).",
    "points": 0.5,
    "tags": [
      "lượng giác",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-toan-f-25",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho hai số thực $x$, $y$ thỏa mãn $x+y=3$ và $xy=2$. Giá trị của $x^3+y^3$ là bao nhiêu?",
    "answer": "9",
    "explanation": "$x^3+y^3=(x+y)^3-3xy(x+y)=27-3\\cdot 2\\cdot 3=9$.",
    "points": 0.5,
    "tags": [
      "hằng đẳng thức",
      "VDC"
    ],
    "variable": false
  }
]
