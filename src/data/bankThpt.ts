/**
 * Câu THPT (Toán, Vật lí, Hoá học, Sinh học, Tiếng Anh) theo định dạng thi tốt nghiệp 2025 (trắc nghiệm, đúng/sai,
 * trả lời ngắn), soạn mới theo dạng và độ khó của đề thi thử / kiểm tra các trường năm 2026, đáp án đã rà lại.
 * Tag NB/TH/VD/VDC là mức độ. File sinh bằng script gộp — sửa câu thì sửa trực tiếp tại đây.
 */
import type { BankEntry } from './bank'

export const BANK_THPT: BankEntry[] = [
  {
    "id": "thpt-anh12-01",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the notice and choose the word that best fits the gap.\n\nNOTICE\nPlease help keep our park clean. Do not leave rubbish on the grass. Put all plastic bottles into the ______ bins near the gate.",
    "options": [
      {
        "key": "A",
        "text": "reading"
      },
      {
        "key": "B",
        "text": "recycling"
      },
      {
        "key": "C",
        "text": "sporting"
      },
      {
        "key": "D",
        "text": "boarding"
      }
    ],
    "answer": "B",
    "explanation": "'Recycling bins' là thùng tái chế, đúng nghĩa khi chai nhựa cần được thu gom. Ba đáp án còn lại không phù hợp về nghĩa.",
    "points": 0.25,
    "tags": [
      "Môi trường",
      "Điền từ",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-02",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the notice and choose the word or phrase that best fits the gap.\n\nNOTICE TO STUDENTS\nThe computer room will be ______ for maintenance from 2 p.m. to 4 p.m. this Friday, so please save your work before then.",
    "options": [
      {
        "key": "A",
        "text": "to close"
      },
      {
        "key": "B",
        "text": "close"
      },
      {
        "key": "C",
        "text": "closes"
      },
      {
        "key": "D",
        "text": "closed"
      }
    ],
    "answer": "D",
    "explanation": "Cấu trúc bị động 'will be + past participle' cần quá khứ phân từ: 'closed' (bị đóng cửa).",
    "points": 0.25,
    "tags": [
      "Công nghệ",
      "Điền từ",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-03",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the health tip and choose the word that best fits the gap.\n\nHEALTH TIP\nDoctors advise adults to ______ at least 150 minutes of moderate exercise every week to stay healthy.",
    "options": [
      {
        "key": "A",
        "text": "get"
      },
      {
        "key": "B",
        "text": "getting"
      },
      {
        "key": "C",
        "text": "got"
      },
      {
        "key": "D",
        "text": "gets"
      }
    ],
    "answer": "A",
    "explanation": "Cấu trúc 'advise sb to do sth' (khuyên ai làm gì) cần động từ nguyên thể sau 'to': 'get'.",
    "points": 0.25,
    "tags": [
      "Sức khoẻ",
      "Điền từ",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-04",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the announcement and choose the word that best fits the gap.\n\nANNOUNCEMENT\nStudents who wish to ______ the summer English course must register at the office before 30 June.",
    "options": [
      {
        "key": "A",
        "text": "attract"
      },
      {
        "key": "B",
        "text": "attempt"
      },
      {
        "key": "C",
        "text": "attend"
      },
      {
        "key": "D",
        "text": "attack"
      }
    ],
    "answer": "C",
    "explanation": "'Attend a course' nghĩa là tham dự một khoá học. Các động từ còn lại không đi với 'course' theo nghĩa phù hợp.",
    "points": 0.25,
    "tags": [
      "Giáo dục",
      "Điền từ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-05",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the sign and choose the word that best fits the gap.\n\nSIGN AT THE TEMPLE\nVisitors are kindly requested to ______ the temple's traditions by removing their shoes before entering the main hall.",
    "options": [
      {
        "key": "A",
        "text": "respond"
      },
      {
        "key": "B",
        "text": "respect"
      },
      {
        "key": "C",
        "text": "resist"
      },
      {
        "key": "D",
        "text": "reject"
      }
    ],
    "answer": "B",
    "explanation": "'Respect the traditions' nghĩa là tôn trọng truyền thống, phù hợp với việc cởi giày trước khi vào chánh điện.",
    "points": 0.25,
    "tags": [
      "Văn hoá",
      "Điền từ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-06",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the notice and choose the word that best fits the gap.\n\nIT SECURITY REMINDER\nPlease ______ your password regularly and never share it with anyone to protect your online account.",
    "options": [
      {
        "key": "A",
        "text": "charge"
      },
      {
        "key": "B",
        "text": "exchange"
      },
      {
        "key": "C",
        "text": "ignore"
      },
      {
        "key": "D",
        "text": "change"
      }
    ],
    "answer": "D",
    "explanation": "'Change your password' nghĩa là đổi mật khẩu định kỳ để bảo vệ tài khoản. Các từ còn lại không phù hợp về nghĩa.",
    "points": 0.25,
    "tags": [
      "Công nghệ",
      "Điền từ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-07",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the news item and choose the word that best fits the gap.\n\nLOCAL NEWS\nThe local council is planning to ______ more trees along the river to reduce air pollution and make the city cooler.",
    "options": [
      {
        "key": "A",
        "text": "plant"
      },
      {
        "key": "B",
        "text": "throw"
      },
      {
        "key": "C",
        "text": "cut"
      },
      {
        "key": "D",
        "text": "burn"
      }
    ],
    "answer": "A",
    "explanation": "'Plant trees' nghĩa là trồng cây, phù hợp với mục tiêu giảm ô nhiễm và làm mát thành phố. 'Cut' trái nghĩa với mục tiêu này.",
    "points": 0.25,
    "tags": [
      "Môi trường",
      "Điền từ",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-08",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the poster and choose the phrase that best fits the gap.\n\nHEALTH CENTER POSTER\nMany people find it hard to ______ smoking, but our support groups can help them to stop completely.",
    "options": [
      {
        "key": "A",
        "text": "take up"
      },
      {
        "key": "B",
        "text": "put on"
      },
      {
        "key": "C",
        "text": "give up"
      },
      {
        "key": "D",
        "text": "look after"
      }
    ],
    "answer": "C",
    "explanation": "'Give up smoking' nghĩa là bỏ hút thuốc. 'Take up' là bắt đầu, 'put on' là tăng cân hoặc mặc vào, 'look after' là chăm sóc.",
    "points": 0.25,
    "tags": [
      "Sức khoẻ",
      "Điền từ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-09",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Put the sentences in the correct order to make a logical conversation.\n\na. Oh, that's a good idea. I'll turn off my phone at 10 p.m. from now on.\nb. Hi Mai, you look tired. Did you sleep well last night?\nc. Not really. I was scrolling through my phone until almost midnight.\nd. Well, try putting it away an hour before bed. It really helps.",
    "options": [
      {
        "key": "A",
        "text": "b-d-c-a"
      },
      {
        "key": "B",
        "text": "c-b-d-a"
      },
      {
        "key": "C",
        "text": "b-c-a-d"
      },
      {
        "key": "D",
        "text": "b-c-d-a"
      }
    ],
    "answer": "D",
    "explanation": "Thứ tự logic: b (hỏi thăm giấc ngủ) → c (trả lời: lướt điện thoại đến nửa đêm) → d (gợi ý cất điện thoại trước khi ngủ) → a (đồng ý và cam kết).",
    "points": 0.25,
    "tags": [
      "Công nghệ",
      "Sắp xếp hội thoại",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-10",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Put the sentences in the correct order to make a logical letter.\n\na. Finally, I hope you can visit me during the winter holidays.\nb. Dear Lan, I hope you are doing well.\nc. I have just started at a new school in Da Nang, and I really enjoy it.\nd. My classmates are friendly, and our teachers are very helpful.",
    "options": [
      {
        "key": "A",
        "text": "b-c-d-a"
      },
      {
        "key": "B",
        "text": "b-d-c-a"
      },
      {
        "key": "C",
        "text": "c-b-d-a"
      },
      {
        "key": "D",
        "text": "b-c-a-d"
      }
    ],
    "answer": "A",
    "explanation": "Lá thư mở đầu bằng lời chào (b), kể về trường mới (c), nói về bạn bè và thầy cô (d), rồi kết bằng lời mời (a).",
    "points": 0.25,
    "tags": [
      "Giáo dục",
      "Sắp xếp thư",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-11",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Put the sentences in the correct order to make a logical paragraph.\n\na. During these weeks, families clean their houses and buy new clothes to welcome the new year.\nb. Tết, the Vietnamese Lunar New Year, is the most important festival of the year.\nc. Just before the holiday, many people travel back to their hometowns to reunite with their relatives.\nd. On the first day, children receive lucky money in red envelopes from their grandparents.\ne. Preparations begin weeks before the holiday, and shops become crowded with shoppers.",
    "options": [
      {
        "key": "A",
        "text": "b-a-e-c-d"
      },
      {
        "key": "B",
        "text": "b-e-a-c-d"
      },
      {
        "key": "C",
        "text": "b-c-e-a-d"
      },
      {
        "key": "D",
        "text": "e-b-a-c-d"
      }
    ],
    "answer": "B",
    "explanation": "Đoạn văn giới thiệu Tết (b), chuẩn bị bắt đầu từ vài tuần trước (e), 'During these weeks' nối với (e) nên (a) dọn nhà đón năm mới theo sau, sát Tết thì về quê đoàn tụ (c), rồi đến ngày đầu năm nhận lì xì (d).",
    "points": 0.25,
    "tags": [
      "Văn hoá",
      "Sắp xếp đoạn văn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-12",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Put the sentences in the correct order to make a logical paragraph.\n\na. Finally, the recycled materials are turned into new products such as bags and bottles.\nb. Many schools now run recycling programs to cut down on waste.\nc. First, students separate paper, plastic and metal from other rubbish.\nd. Then, the sorted materials are collected and taken to a factory for processing.",
    "options": [
      {
        "key": "A",
        "text": "b-d-c-a"
      },
      {
        "key": "B",
        "text": "c-b-d-a"
      },
      {
        "key": "C",
        "text": "b-c-d-a"
      },
      {
        "key": "D",
        "text": "b-c-a-d"
      }
    ],
    "answer": "C",
    "explanation": "Đoạn văn mở đầu bằng chương trình tái chế ở trường (b), học sinh phân loại rác (c), vật liệu được thu gom và xử lí (d), cuối cùng thành sản phẩm mới (a).",
    "points": 0.25,
    "tags": [
      "Môi trường",
      "Sắp xếp đoạn văn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-13",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Put the sentences in the correct order to make a logical paragraph.\n\na. However, teachers still need to check the answers, because the software sometimes makes mistakes.\nb. Artificial intelligence is now widely used in education.\nc. For example, some apps give students instant feedback on their English writing.\nd. Its main advantage is that it can save teachers' time and let students learn at their own pace.",
    "options": [
      {
        "key": "A",
        "text": "b-c-d-a"
      },
      {
        "key": "B",
        "text": "b-d-c-a"
      },
      {
        "key": "C",
        "text": "d-b-c-a"
      },
      {
        "key": "D",
        "text": "b-d-a-c"
      }
    ],
    "answer": "B",
    "explanation": "Đoạn mở đầu về việc AI được dùng rộng rãi (b), nêu ưu điểm chính (d), đưa ví dụ minh hoạ cho ưu điểm đó (c), rồi kết bằng hạn chế với 'However' (a).",
    "points": 0.25,
    "tags": [
      "Công nghệ",
      "Sắp xếp đoạn văn",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-14",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Put the sentences in the correct order to make a logical conversation.\n\na. Thanks, Doctor. I'll cut down on coffee and get more sleep.\nb. Good morning, Doctor. I've had a headache and have felt tired for a week.\nc. Hmm, it sounds like stress. Are you sleeping well?\nd. Not really. I usually stay up until after midnight studying.\ne. Then try going to bed earlier and drinking less caffeine. Come back in two weeks if you still feel unwell.",
    "options": [
      {
        "key": "A",
        "text": "b-c-d-e-a"
      },
      {
        "key": "B",
        "text": "b-d-c-e-a"
      },
      {
        "key": "C",
        "text": "b-c-e-d-a"
      },
      {
        "key": "D",
        "text": "c-b-d-e-a"
      }
    ],
    "answer": "A",
    "explanation": "Bệnh nhân trình bày triệu chứng (b), bác sĩ hỏi về giấc ngủ (c), bệnh nhân trả lời (d), bác sĩ đưa lời khuyên (e), và bệnh nhân cảm ơn (a).",
    "points": 0.25,
    "tags": [
      "Sức khoẻ",
      "Sắp xếp hội thoại",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-15",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and choose the sentence that best fits the gap.\n\nClimate change is affecting coastal cities around the world. Rising sea levels can flood streets and damage homes. ______ That is why many governments are building sea walls and planting mangrove forests to protect their communities.",
    "options": [
      {
        "key": "A",
        "text": "Scientists have stopped studying the ocean because it is too dangerous."
      },
      {
        "key": "B",
        "text": "Fishermen are the only people who are affected by the sea."
      },
      {
        "key": "C",
        "text": "Flooding is becoming more frequent, and many residents must move to safer areas."
      },
      {
        "key": "D",
        "text": "The weather in these cities has never changed over the past century."
      }
    ],
    "answer": "C",
    "explanation": "Câu C nối tự nhiên với 'That is why': ngập lụt ngày càng thường xuyên nên chính phủ xây đê và trồng rừng ngập mặn. Các đáp án còn lại không phù hợp mạch đoạn văn.",
    "points": 0.25,
    "tags": [
      "Môi trường",
      "Điền câu vào đoạn văn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-16",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and choose the sentence that best fits the gap.\n\nMany people now use online maps to find their way. These apps show real-time traffic, so drivers can avoid congestion. ______ Users can therefore still find directions when they have no internet connection.",
    "options": [
      {
        "key": "A",
        "text": "Traffic jams never happen in big cities anymore."
      },
      {
        "key": "B",
        "text": "Many apps allow users to download maps in advance for offline use."
      },
      {
        "key": "C",
        "text": "Drivers must always pay a monthly fee for these apps."
      },
      {
        "key": "D",
        "text": "Phones have stopped using satellites to find locations."
      }
    ],
    "answer": "B",
    "explanation": "Câu B là tiền đề cho 'Users can therefore still find directions...': nhờ tải bản đồ trước nên vẫn chỉ đường được khi không có mạng.",
    "points": 0.25,
    "tags": [
      "Công nghệ",
      "Điền câu vào đoạn văn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-17",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and choose the sentence that best fits the gap.\n\nStudents today have many ways to learn outside the classroom. Online courses allow them to study at any time, and video lessons can be replayed as often as needed. ______ Such flexibility helps them learn at their own pace.",
    "options": [
      {
        "key": "A",
        "text": "Teachers have become less important than before."
      },
      {
        "key": "B",
        "text": "Exams have been canceled in most schools."
      },
      {
        "key": "C",
        "text": "Online courses are free for every student in the world."
      },
      {
        "key": "D",
        "text": "Learners can pause a lesson and review its difficult parts whenever necessary."
      }
    ],
    "answer": "D",
    "explanation": "Câu D mô tả việc tạm dừng và xem lại phần khó, tạo tiền đề cho 'Such flexibility' (sự linh hoạt này) giúp học theo tốc độ riêng.",
    "points": 0.25,
    "tags": [
      "Giáo dục",
      "Điền câu vào đoạn văn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-18",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and choose the phrase that best fits the gap.\n\nWater puppetry is a traditional art form that began in the Red River Delta more than 1,000 years ago. Puppeteers stand behind a screen and control wooden puppets ______, which makes the show unique and memorable.",
    "options": [
      {
        "key": "A",
        "text": "on the surface of a pool of water"
      },
      {
        "key": "B",
        "text": "in a silent room without any music"
      },
      {
        "key": "C",
        "text": "in a dark room lit only by candles"
      },
      {
        "key": "D",
        "text": "inside a large glass tank"
      }
    ],
    "answer": "A",
    "explanation": "Múa rối nước: các con rối được điều khiển trên mặt nước, đó là đặc trưng làm nên sự độc đáo của loại hình này.",
    "points": 0.25,
    "tags": [
      "Văn hoá",
      "Điền cụm vào đoạn văn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-19",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and choose the sentence that best fits the gap.\n\nSleep is essential for good health. Adults who sleep fewer than six hours a night have a higher risk of heart disease and weight gain. ______ Experts recommend a regular bedtime and a dark, quiet bedroom to improve sleep quality.",
    "options": [
      {
        "key": "A",
        "text": "Waking up early on weekends is the best way to rest."
      },
      {
        "key": "B",
        "text": "Sleep needs are the same for teenagers and older adults."
      },
      {
        "key": "C",
        "text": "Because of this, people should treat sleep as seriously as diet and exercise."
      },
      {
        "key": "D",
        "text": "Caffeine has no effect on the body's ability to fall asleep."
      }
    ],
    "answer": "C",
    "explanation": "'Because of this' nối với hệ quả của thiếu ngủ (bệnh tim, tăng cân), dẫn đến khuyến nghị coi giấc ngủ quan trọng ngang chế độ ăn và tập luyện.",
    "points": 0.25,
    "tags": [
      "Sức khoẻ",
      "Điền câu vào đoạn văn",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-20",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and choose the sentence that best fits the gap.\n\nMany coral reefs around the world are dying because of rising ocean temperatures. Corals depend on tiny algae that live inside their tissues. When the water becomes too warm, the algae leave, and the corals turn white. ______",
    "options": [
      {
        "key": "A",
        "text": "Scientists have discovered that corals can survive without any water."
      },
      {
        "key": "B",
        "text": "If this bleaching continues, many reefs may disappear within several decades, and countless fish will lose their homes."
      },
      {
        "key": "C",
        "text": "Corals are the largest animals ever found in the deep sea."
      },
      {
        "key": "D",
        "text": "Warm water makes reefs more colorful and attracts more tourists."
      }
    ],
    "answer": "B",
    "explanation": "Câu B nêu hệ quả của hiện tượng tẩy trắng san hô: rạn có thể biến mất và cá mất nơi cư trú. Các đáp án còn lại đi ngược nội dung đoạn văn.",
    "points": 0.25,
    "tags": [
      "Môi trường",
      "Điền câu vào đoạn văn",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-21",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and answer the question.\n\nCities around the world are becoming hotter, and many urban residents are looking for ways to stay cool. One solution that is gaining popularity is the green roof, a rooftop covered with plants and a thin layer of soil. Green roofs can absorb rainwater, which reduces the risk of flooding in busy streets during the rainy season. They also provide a natural layer of insulation, so buildings need less air conditioning in summer. As a result, owners can save money on electricity bills.\n\nBeyond these practical benefits, green roofs offer a home for birds, bees, and other small creatures that are losing their habitats in crowded cities. Some schools have built small gardens on their roofs, where students learn about plants and the environment. However, green roofs are not cheap to install. The structure of the building must be strong enough to hold the extra weight of soil and water, and regular maintenance is required to keep the plants healthy. For this reason, experts suggest that governments provide financial support to homeowners who want to build them.\n\nDespite the costs, many researchers believe that green roofs will become more common in the future. As cities continue to grow, the demand for cooler and healthier living spaces will only increase.\n\nWhat is a green roof, according to the passage?",
    "options": [
      {
        "key": "A",
        "text": "A roof made of glass that lets sunlight pass through"
      },
      {
        "key": "B",
        "text": "A roof used only for parking cars"
      },
      {
        "key": "C",
        "text": "A rooftop covered with plants and a thin layer of soil"
      },
      {
        "key": "D",
        "text": "A roof that collects rainwater in large tanks"
      }
    ],
    "answer": "C",
    "explanation": "Đoạn 1 định nghĩa: green roof là mái nhà được phủ thực vật và một lớp đất mỏng.",
    "points": 0.25,
    "tags": [
      "Môi trường",
      "Đọc hiểu",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-22",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and answer the question.\n\nCities around the world are becoming hotter, and many urban residents are looking for ways to stay cool. One solution that is gaining popularity is the green roof, a rooftop covered with plants and a thin layer of soil. Green roofs can absorb rainwater, which reduces the risk of flooding in busy streets during the rainy season. They also provide a natural layer of insulation, so buildings need less air conditioning in summer. As a result, owners can save money on electricity bills.\n\nBeyond these practical benefits, green roofs offer a home for birds, bees, and other small creatures that are losing their habitats in crowded cities. Some schools have built small gardens on their roofs, where students learn about plants and the environment. However, green roofs are not cheap to install. The structure of the building must be strong enough to hold the extra weight of soil and water, and regular maintenance is required to keep the plants healthy. For this reason, experts suggest that governments provide financial support to homeowners who want to build them.\n\nDespite the costs, many researchers believe that green roofs will become more common in the future. As cities continue to grow, the demand for cooler and healthier living spaces will only increase.\n\nAccording to the passage, how can green roofs help during the rainy season?",
    "options": [
      {
        "key": "A",
        "text": "They reduce flooding by absorbing rainwater."
      },
      {
        "key": "B",
        "text": "They make streets noisier because of the plants."
      },
      {
        "key": "C",
        "text": "They increase the amount of rainwater that flows into drains."
      },
      {
        "key": "D",
        "text": "They prevent all birds from visiting the city."
      }
    ],
    "answer": "A",
    "explanation": "Đoạn 1: mái xanh hấp thụ nước mưa, làm giảm nguy cơ ngập lụt trên các con phố đông đúc trong mùa mưa.",
    "points": 0.25,
    "tags": [
      "Môi trường",
      "Đọc hiểu",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-23",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and answer the question.\n\nCities around the world are becoming hotter, and many urban residents are looking for ways to stay cool. One solution that is gaining popularity is the green roof, a rooftop covered with plants and a thin layer of soil. Green roofs can absorb rainwater, which reduces the risk of flooding in busy streets during the rainy season. They also provide a natural layer of insulation, so buildings need less air conditioning in summer. As a result, owners can save money on electricity bills.\n\nBeyond these practical benefits, green roofs offer a home for birds, bees, and other small creatures that are losing their habitats in crowded cities. Some schools have built small gardens on their roofs, where students learn about plants and the environment. However, green roofs are not cheap to install. The structure of the building must be strong enough to hold the extra weight of soil and water, and regular maintenance is required to keep the plants healthy. For this reason, experts suggest that governments provide financial support to homeowners who want to build them.\n\nDespite the costs, many researchers believe that green roofs will become more common in the future. As cities continue to grow, the demand for cooler and healthier living spaces will only increase.\n\nThe word 'insulation' in paragraph 1 is closest in meaning to ______.",
    "options": [
      {
        "key": "A",
        "text": "noise"
      },
      {
        "key": "B",
        "text": "light"
      },
      {
        "key": "C",
        "text": "waste"
      },
      {
        "key": "D",
        "text": "protection"
      }
    ],
    "answer": "D",
    "explanation": "'Insulation' ở đây là lớp cách nhiệt, bảo vệ công trình khỏi nóng, giúp giảm nhu cầu điều hoà. 'Protection' gần nghĩa nhất.",
    "points": 0.25,
    "tags": [
      "Môi trường",
      "Đọc hiểu",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-24",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and answer the question.\n\nCities around the world are becoming hotter, and many urban residents are looking for ways to stay cool. One solution that is gaining popularity is the green roof, a rooftop covered with plants and a thin layer of soil. Green roofs can absorb rainwater, which reduces the risk of flooding in busy streets during the rainy season. They also provide a natural layer of insulation, so buildings need less air conditioning in summer. As a result, owners can save money on electricity bills.\n\nBeyond these practical benefits, green roofs offer a home for birds, bees, and other small creatures that are losing their habitats in crowded cities. Some schools have built small gardens on their roofs, where students learn about plants and the environment. However, green roofs are not cheap to install. The structure of the building must be strong enough to hold the extra weight of soil and water, and regular maintenance is required to keep the plants healthy. For this reason, experts suggest that governments provide financial support to homeowners who want to build them.\n\nDespite the costs, many researchers believe that green roofs will become more common in the future. As cities continue to grow, the demand for cooler and healthier living spaces will only increase.\n\nWhy do experts suggest that governments provide financial support to homeowners?",
    "options": [
      {
        "key": "A",
        "text": "Because green roofs require no maintenance at all"
      },
      {
        "key": "B",
        "text": "Because green roofs are costly to build and keep healthy"
      },
      {
        "key": "C",
        "text": "Because most homeowners already own green roofs"
      },
      {
        "key": "D",
        "text": "Because green roofs are illegal in most cities"
      }
    ],
    "answer": "B",
    "explanation": "Đoạn 2: mái xanh không rẻ khi lắp đặt và cần bảo dưỡng thường xuyên, vì vậy chính phủ nên hỗ trợ tài chính.",
    "points": 0.25,
    "tags": [
      "Môi trường",
      "Đọc hiểu",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-25",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and answer the question.\n\nCities around the world are becoming hotter, and many urban residents are looking for ways to stay cool. One solution that is gaining popularity is the green roof, a rooftop covered with plants and a thin layer of soil. Green roofs can absorb rainwater, which reduces the risk of flooding in busy streets during the rainy season. They also provide a natural layer of insulation, so buildings need less air conditioning in summer. As a result, owners can save money on electricity bills.\n\nBeyond these practical benefits, green roofs offer a home for birds, bees, and other small creatures that are losing their habitats in crowded cities. Some schools have built small gardens on their roofs, where students learn about plants and the environment. However, green roofs are not cheap to install. The structure of the building must be strong enough to hold the extra weight of soil and water, and regular maintenance is required to keep the plants healthy. For this reason, experts suggest that governments provide financial support to homeowners who want to build them.\n\nDespite the costs, many researchers believe that green roofs will become more common in the future. As cities continue to grow, the demand for cooler and healthier living spaces will only increase.\n\nWhat can be inferred from the passage about the future of green roofs?",
    "options": [
      {
        "key": "A",
        "text": "They are likely to become more widespread as cities keep growing."
      },
      {
        "key": "B",
        "text": "They will disappear because of their high costs."
      },
      {
        "key": "C",
        "text": "They will be built only on school buildings."
      },
      {
        "key": "D",
        "text": "They will replace air conditioners in most homes."
      }
    ],
    "answer": "A",
    "explanation": "Đoạn 3: nhiều nhà nghiên cứu tin rằng mái xanh sẽ phổ biến hơn khi thành phố tiếp tục phát triển và nhu cầu về không gian sống mát mẻ tăng lên.",
    "points": 0.25,
    "tags": [
      "Môi trường",
      "Đọc hiểu",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-26",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and answer the question.\n\nOnline learning has changed the way many students study. Thanks to video lectures and digital textbooks, learners can access high-quality lessons from anywhere with an internet connection. For students in remote mountain areas, this can be a real opportunity to learn from teachers in big cities. Many universities now offer online courses that students can complete at their own pace.\n\nHowever, online learning also has its challenges. Without a teacher standing in front of the class, some students find it difficult to stay focused and motivated. Others lack a quiet place at home or a reliable internet connection, which makes it hard to join live lessons. Experts say that students who study online need strong self-discipline and good time-management skills. Without these, it is easy to fall behind.\n\nTo overcome these problems, many schools have adopted a blended approach, combining online lessons with face-to-face classes. This model allows teachers to spend more time helping students with difficult topics, while still giving learners the flexibility of studying at home. Some teachers also use short quizzes and discussion forums to check understanding and encourage participation.\n\nUltimately, technology is a tool rather than a replacement for teachers. The most successful learning environments are those in which teachers and technology work together.\n\nAccording to the passage, what is one advantage of online learning?",
    "options": [
      {
        "key": "A",
        "text": "Students are always required to attend live classes."
      },
      {
        "key": "B",
        "text": "Learners can access lessons from anywhere with an internet connection."
      },
      {
        "key": "C",
        "text": "Students no longer need to use computers or phones."
      },
      {
        "key": "D",
        "text": "Teachers are no longer needed in any school."
      }
    ],
    "answer": "B",
    "explanation": "Đoạn 1: nhờ bài giảng video và sách điện tử, người học có thể tiếp cận bài học chất lượng cao từ bất kỳ đâu có internet.",
    "points": 0.25,
    "tags": [
      "Giáo dục",
      "Đọc hiểu",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-27",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and answer the question.\n\nOnline learning has changed the way many students study. Thanks to video lectures and digital textbooks, learners can access high-quality lessons from anywhere with an internet connection. For students in remote mountain areas, this can be a real opportunity to learn from teachers in big cities. Many universities now offer online courses that students can complete at their own pace.\n\nHowever, online learning also has its challenges. Without a teacher standing in front of the class, some students find it difficult to stay focused and motivated. Others lack a quiet place at home or a reliable internet connection, which makes it hard to join live lessons. Experts say that students who study online need strong self-discipline and good time-management skills. Without these, it is easy to fall behind.\n\nTo overcome these problems, many schools have adopted a blended approach, combining online lessons with face-to-face classes. This model allows teachers to spend more time helping students with difficult topics, while still giving learners the flexibility of studying at home. Some teachers also use short quizzes and discussion forums to check understanding and encourage participation.\n\nUltimately, technology is a tool rather than a replacement for teachers. The most successful learning environments are those in which teachers and technology work together.\n\nWhich of the following is NOT mentioned as a challenge of online learning?",
    "options": [
      {
        "key": "A",
        "text": "Difficulty staying focused without a teacher in the classroom"
      },
      {
        "key": "B",
        "text": "Lack of a quiet place to study at home"
      },
      {
        "key": "C",
        "text": "An unreliable internet connection"
      },
      {
        "key": "D",
        "text": "The high cost of digital textbooks"
      }
    ],
    "answer": "D",
    "explanation": "Đoạn 2 nêu ba thách thức: khó tập trung, thiếu chỗ học yên tĩnh và kết nối internet không ổn định. Chi phí sách điện tử không được nhắc đến.",
    "points": 0.25,
    "tags": [
      "Giáo dục",
      "Đọc hiểu",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-28",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and answer the question.\n\nOnline learning has changed the way many students study. Thanks to video lectures and digital textbooks, learners can access high-quality lessons from anywhere with an internet connection. For students in remote mountain areas, this can be a real opportunity to learn from teachers in big cities. Many universities now offer online courses that students can complete at their own pace.\n\nHowever, online learning also has its challenges. Without a teacher standing in front of the class, some students find it difficult to stay focused and motivated. Others lack a quiet place at home or a reliable internet connection, which makes it hard to join live lessons. Experts say that students who study online need strong self-discipline and good time-management skills. Without these, it is easy to fall behind.\n\nTo overcome these problems, many schools have adopted a blended approach, combining online lessons with face-to-face classes. This model allows teachers to spend more time helping students with difficult topics, while still giving learners the flexibility of studying at home. Some teachers also use short quizzes and discussion forums to check understanding and encourage participation.\n\nUltimately, technology is a tool rather than a replacement for teachers. The most successful learning environments are those in which teachers and technology work together.\n\nThe word 'blended' in paragraph 3 is closest in meaning to ______.",
    "options": [
      {
        "key": "A",
        "text": "separate"
      },
      {
        "key": "B",
        "text": "outdated"
      },
      {
        "key": "C",
        "text": "mixed"
      },
      {
        "key": "D",
        "text": "expensive"
      }
    ],
    "answer": "C",
    "explanation": "'Blended approach' là cách kết hợp hai hình thức học trực tuyến và trực tiếp, nên 'mixed' (pha trộn) gần nghĩa nhất.",
    "points": 0.25,
    "tags": [
      "Giáo dục",
      "Đọc hiểu",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-29",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and answer the question.\n\nOnline learning has changed the way many students study. Thanks to video lectures and digital textbooks, learners can access high-quality lessons from anywhere with an internet connection. For students in remote mountain areas, this can be a real opportunity to learn from teachers in big cities. Many universities now offer online courses that students can complete at their own pace.\n\nHowever, online learning also has its challenges. Without a teacher standing in front of the class, some students find it difficult to stay focused and motivated. Others lack a quiet place at home or a reliable internet connection, which makes it hard to join live lessons. Experts say that students who study online need strong self-discipline and good time-management skills. Without these, it is easy to fall behind.\n\nTo overcome these problems, many schools have adopted a blended approach, combining online lessons with face-to-face classes. This model allows teachers to spend more time helping students with difficult topics, while still giving learners the flexibility of studying at home. Some teachers also use short quizzes and discussion forums to check understanding and encourage participation.\n\nUltimately, technology is a tool rather than a replacement for teachers. The most successful learning environments are those in which teachers and technology work together.\n\nWhy do many schools adopt a blended approach?",
    "options": [
      {
        "key": "A",
        "text": "To give teachers more time to help students with difficult topics while keeping flexibility"
      },
      {
        "key": "B",
        "text": "To reduce the number of teachers needed in school"
      },
      {
        "key": "C",
        "text": "To stop students from using the internet at home"
      },
      {
        "key": "D",
        "text": "To make every lesson longer"
      }
    ],
    "answer": "A",
    "explanation": "Đoạn 3: cách kết hợp giúp giáo viên có thêm thời gian hỗ trợ các phần khó mà người học vẫn được linh hoạt học ở nhà.",
    "points": 0.25,
    "tags": [
      "Giáo dục",
      "Đọc hiểu",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-30",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and answer the question.\n\nOnline learning has changed the way many students study. Thanks to video lectures and digital textbooks, learners can access high-quality lessons from anywhere with an internet connection. For students in remote mountain areas, this can be a real opportunity to learn from teachers in big cities. Many universities now offer online courses that students can complete at their own pace.\n\nHowever, online learning also has its challenges. Without a teacher standing in front of the class, some students find it difficult to stay focused and motivated. Others lack a quiet place at home or a reliable internet connection, which makes it hard to join live lessons. Experts say that students who study online need strong self-discipline and good time-management skills. Without these, it is easy to fall behind.\n\nTo overcome these problems, many schools have adopted a blended approach, combining online lessons with face-to-face classes. This model allows teachers to spend more time helping students with difficult topics, while still giving learners the flexibility of studying at home. Some teachers also use short quizzes and discussion forums to check understanding and encourage participation.\n\nUltimately, technology is a tool rather than a replacement for teachers. The most successful learning environments are those in which teachers and technology work together.\n\nWhat is the writer's attitude toward technology in education?",
    "options": [
      {
        "key": "A",
        "text": "Strongly opposed, believing that it should be banned"
      },
      {
        "key": "B",
        "text": "Balanced, seeing it as a helpful tool that works best alongside teachers"
      },
      {
        "key": "C",
        "text": "Uncritical, believing that it can replace teachers entirely"
      },
      {
        "key": "D",
        "text": "Indifferent, thinking it has no real effect on learning"
      }
    ],
    "answer": "B",
    "explanation": "Tác giả đánh giá công nghệ là công cụ hữu ích nhưng không thay thế giáo viên, và hiệu quả nhất khi kết hợp với giáo viên. Đây là thái độ cân bằng.",
    "points": 0.25,
    "tags": [
      "Giáo dục",
      "Đọc hiểu",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-31",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and answer the question.\n\nCoffee has been part of Vietnamese daily life for more than a century. In Hanoi, many people start their mornings sitting on tiny plastic stools at a street-side café, sipping strong black coffee and chatting with neighbors. For many older residents, this slow ritual is more than a habit; it is a way of staying connected with the community.\n\nIn recent years, however, a new generation of young people has transformed this tradition. Modern cafés in Ho Chi Minh City now offer creative drinks, such as coconut coffee and cold brew, and they attract customers with comfortable seats and free Wi-Fi. Many young professionals meet friends or work on their laptops there, which has changed the social role of coffee shops.\n\nHealth experts, meanwhile, have mixed opinions about coffee. Moderate consumption, around two or three cups a day, is linked to some health benefits, such as better concentration and a lower risk of certain diseases. Yet many popular drinks contain large amounts of sugar and cream, which can increase the risk of weight gain and heart problems. Doctors therefore advise drinkers to choose less sugary options and to avoid coffee late in the day, since caffeine can disturb sleep.\n\nWhether people enjoy a traditional cup of black coffee or a modern sweet drink, the key is balance. Coffee can be a pleasant part of daily life, but it works best when it is enjoyed in moderation.\n\nWhere do many older residents of Hanoi usually drink coffee?",
    "options": [
      {
        "key": "A",
        "text": "At home alone in the early morning"
      },
      {
        "key": "B",
        "text": "In large shopping centers"
      },
      {
        "key": "C",
        "text": "In air-conditioned offices"
      },
      {
        "key": "D",
        "text": "At street-side cafés, sitting on small plastic stools"
      }
    ],
    "answer": "D",
    "explanation": "Đoạn 1: nhiều người lớn tuổi ở Hà Nội bắt đầu buổi sáng bằng việc ngồi ghế nhựa nhỏ ở quán cà phê vỉa hè.",
    "points": 0.25,
    "tags": [
      "Văn hoá",
      "Đọc hiểu",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-32",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and answer the question.\n\nCoffee has been part of Vietnamese daily life for more than a century. In Hanoi, many people start their mornings sitting on tiny plastic stools at a street-side café, sipping strong black coffee and chatting with neighbors. For many older residents, this slow ritual is more than a habit; it is a way of staying connected with the community.\n\nIn recent years, however, a new generation of young people has transformed this tradition. Modern cafés in Ho Chi Minh City now offer creative drinks, such as coconut coffee and cold brew, and they attract customers with comfortable seats and free Wi-Fi. Many young professionals meet friends or work on their laptops there, which has changed the social role of coffee shops.\n\nHealth experts, meanwhile, have mixed opinions about coffee. Moderate consumption, around two or three cups a day, is linked to some health benefits, such as better concentration and a lower risk of certain diseases. Yet many popular drinks contain large amounts of sugar and cream, which can increase the risk of weight gain and heart problems. Doctors therefore advise drinkers to choose less sugary options and to avoid coffee late in the day, since caffeine can disturb sleep.\n\nWhether people enjoy a traditional cup of black coffee or a modern sweet drink, the key is balance. Coffee can be a pleasant part of daily life, but it works best when it is enjoyed in moderation.\n\nWhat do modern cafés in Ho Chi Minh City offer, according to the passage?",
    "options": [
      {
        "key": "A",
        "text": "Creative drinks and comfortable seats with free Wi-Fi"
      },
      {
        "key": "B",
        "text": "Only traditional black coffee"
      },
      {
        "key": "C",
        "text": "Free plastic stools for every customer"
      },
      {
        "key": "D",
        "text": "Early closing times at 6 p.m."
      }
    ],
    "answer": "A",
    "explanation": "Đoạn 2: quán cà phê hiện đại có đồ uống sáng tạo như cà phê dừa, cold brew, chỗ ngồi thoải mái và Wi-Fi miễn phí.",
    "points": 0.25,
    "tags": [
      "Văn hoá",
      "Đọc hiểu",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-33",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and answer the question.\n\nCoffee has been part of Vietnamese daily life for more than a century. In Hanoi, many people start their mornings sitting on tiny plastic stools at a street-side café, sipping strong black coffee and chatting with neighbors. For many older residents, this slow ritual is more than a habit; it is a way of staying connected with the community.\n\nIn recent years, however, a new generation of young people has transformed this tradition. Modern cafés in Ho Chi Minh City now offer creative drinks, such as coconut coffee and cold brew, and they attract customers with comfortable seats and free Wi-Fi. Many young professionals meet friends or work on their laptops there, which has changed the social role of coffee shops.\n\nHealth experts, meanwhile, have mixed opinions about coffee. Moderate consumption, around two or three cups a day, is linked to some health benefits, such as better concentration and a lower risk of certain diseases. Yet many popular drinks contain large amounts of sugar and cream, which can increase the risk of weight gain and heart problems. Doctors therefore advise drinkers to choose less sugary options and to avoid coffee late in the day, since caffeine can disturb sleep.\n\nWhether people enjoy a traditional cup of black coffee or a modern sweet drink, the key is balance. Coffee can be a pleasant part of daily life, but it works best when it is enjoyed in moderation.\n\nThe word 'moderate' in paragraph 3 is closest in meaning to ______.",
    "options": [
      {
        "key": "A",
        "text": "excessive"
      },
      {
        "key": "B",
        "text": "reasonable"
      },
      {
        "key": "C",
        "text": "unhealthy"
      },
      {
        "key": "D",
        "text": "unusual"
      }
    ],
    "answer": "B",
    "explanation": "'Moderate consumption' nghĩa là uống ở mức vừa phải, không quá nhiều. 'Reasonable' gần nghĩa nhất.",
    "points": 0.25,
    "tags": [
      "Văn hoá",
      "Đọc hiểu",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-34",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and answer the question.\n\nCoffee has been part of Vietnamese daily life for more than a century. In Hanoi, many people start their mornings sitting on tiny plastic stools at a street-side café, sipping strong black coffee and chatting with neighbors. For many older residents, this slow ritual is more than a habit; it is a way of staying connected with the community.\n\nIn recent years, however, a new generation of young people has transformed this tradition. Modern cafés in Ho Chi Minh City now offer creative drinks, such as coconut coffee and cold brew, and they attract customers with comfortable seats and free Wi-Fi. Many young professionals meet friends or work on their laptops there, which has changed the social role of coffee shops.\n\nHealth experts, meanwhile, have mixed opinions about coffee. Moderate consumption, around two or three cups a day, is linked to some health benefits, such as better concentration and a lower risk of certain diseases. Yet many popular drinks contain large amounts of sugar and cream, which can increase the risk of weight gain and heart problems. Doctors therefore advise drinkers to choose less sugary options and to avoid coffee late in the day, since caffeine can disturb sleep.\n\nWhether people enjoy a traditional cup of black coffee or a modern sweet drink, the key is balance. Coffee can be a pleasant part of daily life, but it works best when it is enjoyed in moderation.\n\nWhy do doctors advise people to avoid coffee late in the day?",
    "options": [
      {
        "key": "A",
        "text": "Because coffee becomes too expensive in the evening"
      },
      {
        "key": "B",
        "text": "Because cafés are usually closed at night"
      },
      {
        "key": "C",
        "text": "Because caffeine can disturb sleep"
      },
      {
        "key": "D",
        "text": "Because coffee makes people feel hungrier"
      }
    ],
    "answer": "C",
    "explanation": "Đoạn 3: caffeine có thể làm xáo trộn giấc ngủ, vì vậy bác sĩ khuyên không uống cà phê muộn trong ngày.",
    "points": 0.25,
    "tags": [
      "Sức khoẻ",
      "Đọc hiểu",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-anh12-35",
    "subject": "Tiếng Anh",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Read the passage and answer the question.\n\nCoffee has been part of Vietnamese daily life for more than a century. In Hanoi, many people start their mornings sitting on tiny plastic stools at a street-side café, sipping strong black coffee and chatting with neighbors. For many older residents, this slow ritual is more than a habit; it is a way of staying connected with the community.\n\nIn recent years, however, a new generation of young people has transformed this tradition. Modern cafés in Ho Chi Minh City now offer creative drinks, such as coconut coffee and cold brew, and they attract customers with comfortable seats and free Wi-Fi. Many young professionals meet friends or work on their laptops there, which has changed the social role of coffee shops.\n\nHealth experts, meanwhile, have mixed opinions about coffee. Moderate consumption, around two or three cups a day, is linked to some health benefits, such as better concentration and a lower risk of certain diseases. Yet many popular drinks contain large amounts of sugar and cream, which can increase the risk of weight gain and heart problems. Doctors therefore advise drinkers to choose less sugary options and to avoid coffee late in the day, since caffeine can disturb sleep.\n\nWhether people enjoy a traditional cup of black coffee or a modern sweet drink, the key is balance. Coffee can be a pleasant part of daily life, but it works best when it is enjoyed in moderation.\n\nWhich of the following best summarizes the writer's message?",
    "options": [
      {
        "key": "A",
        "text": "Traditional coffee is better than modern drinks in every way."
      },
      {
        "key": "B",
        "text": "Young people should stop drinking coffee altogether."
      },
      {
        "key": "C",
        "text": "Coffee shops should be banned from cities."
      },
      {
        "key": "D",
        "text": "Coffee can be enjoyed as part of daily life when consumed in moderation."
      }
    ],
    "answer": "D",
    "explanation": "Thông điệp chính ở đoạn cuối: cà phê có thể là một phần dễ chịu của đời sống khi được thưởng thức điều độ.",
    "points": 0.25,
    "tags": [
      "Văn hoá",
      "Sức khoẻ",
      "Đọc hiểu",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hamso-01",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hàm số $y=x^3-3x$ có đồ thị như hình bên dưới. Hàm số đã cho có bao nhiêu điểm cực trị?",
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
    "explanation": "$y'=3x^2-3$ có hai nghiệm $x=\\pm 1$ và $y'$ đổi dấu qua mỗi nghiệm, nên hàm số có 2 điểm cực trị.",
    "points": 0.25,
    "tags": [
      "cực trị",
      "đọc đồ thị",
      "NB"
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
    "id": "thpt-hamso-02",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Giá trị cực tiểu của hàm số $f(x)=x^3-3x^2+2$ là",
    "options": [
      {
        "key": "A",
        "text": "$-2$"
      },
      {
        "key": "B",
        "text": "$2$"
      },
      {
        "key": "C",
        "text": "$0$"
      },
      {
        "key": "D",
        "text": "$-6$"
      }
    ],
    "answer": "A",
    "explanation": "$f'(x)=3x^2-6x=0$ suy ra $x=0$ hoặc $x=2$. Vì $f''(2)=6>0$ nên $x=2$ là điểm cực tiểu, $f(2)=-2$.",
    "points": 0.25,
    "tags": [
      "cực trị",
      "giá trị cực trị",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hamso-03",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Giá trị lớn nhất của hàm số $f(x)=x^3-3x+1$ trên đoạn $[-2;3]$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$3$"
      },
      {
        "key": "B",
        "text": "$19$"
      },
      {
        "key": "C",
        "text": "$-1$"
      },
      {
        "key": "D",
        "text": "$1$"
      }
    ],
    "answer": "B",
    "explanation": "$f'(x)=3x^2-3=0$ khi $x=\\pm 1$, cả hai thuộc $[-2;3]$. Ta có $f(-2)=-1$, $f(-1)=3$, $f(1)=-1$, $f(3)=19$. Vậy giá trị lớn nhất là $19$ tại $x=3$.",
    "points": 0.25,
    "tags": [
      "GTLN-GTNN",
      "trên đoạn",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hamso-04",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Số đường tiệm cận (đứng và ngang) của đồ thị hàm số $y=\\frac{x^2-1}{x^2-4x+3}$ là",
    "options": [
      {
        "key": "A",
        "text": "$1$"
      },
      {
        "key": "B",
        "text": "$3$"
      },
      {
        "key": "C",
        "text": "$2$"
      },
      {
        "key": "D",
        "text": "$0$"
      }
    ],
    "answer": "C",
    "explanation": "Rút gọn: $y=\\frac{x+1}{x-3}$ với $x\\ne 1$. Điểm $x=1$ bị khử nên không là tiệm cận. Tiệm cận đứng $x=3$; $\\lim_{x\\to\\pm\\infty}y=1$ nên tiệm cận ngang $y=1$. Tổng cộng 2 đường.",
    "points": 0.25,
    "tags": [
      "tiệm cận",
      "hữu tỉ",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hamso-05",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hàm số $y=f(x)$ có bảng biến thiên như hình bên dưới. Hàm số nghịch biến trên khoảng nào?",
    "options": [
      {
        "key": "A",
        "text": "$(-1;1)$"
      },
      {
        "key": "B",
        "text": "$(-\\infty;-1)$"
      },
      {
        "key": "C",
        "text": "$(1;+\\infty)$"
      },
      {
        "key": "D",
        "text": "$(-1;+\\infty)$"
      }
    ],
    "answer": "A",
    "explanation": "Hàm số trong bảng là $y=x^3-3x+1$ có $y'=3x^2-3<0$ khi $-1<x<1$. Bảng biến thiên cho thấy hàm số giảm trên $(-1;1)$.",
    "points": 0.25,
    "tags": [
      "bảng biến thiên",
      "đơn điệu",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "vartable",
      "expr": "x^3-3x+1",
      "fname": "y"
    }
  },
  {
    "id": "thpt-hamso-06",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Tìm tất cả giá trị thực của tham số $m$ để hàm số $y=x^3-3x^2+mx+1$ đồng biến trên $\\mathbb{R}$.",
    "options": [
      {
        "key": "A",
        "text": "$m\\le 1$"
      },
      {
        "key": "B",
        "text": "$m\\ge 1$"
      },
      {
        "key": "C",
        "text": "$m\\le 3$"
      },
      {
        "key": "D",
        "text": "$m\\ge 3$"
      }
    ],
    "answer": "D",
    "explanation": "$y'=3x^2-6x+m\\ge 0$ với mọi $x$ khi và chỉ khi $\\Delta'=9-3m\\le 0$, tức $m\\ge 3$.",
    "points": 0.25,
    "tags": [
      "tham số m",
      "đơn điệu",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hamso-07",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một cửa hàng bán sản phẩm với giá $x$ (nghìn đồng/cái), $20\\le x\\le 100$. Số cái bán được mỗi tháng là $200-2x$, giá vốn là $20$ nghìn đồng/cái. Lợi nhuận lớn nhất mỗi tháng là bao nhiêu và đạt được khi giá bán bằng bao nhiêu?",
    "options": [
      {
        "key": "A",
        "text": "$2\\,000$ nghìn đồng, khi giá bán $50$ nghìn đồng"
      },
      {
        "key": "B",
        "text": "$4\\,000$ nghìn đồng, khi giá bán $70$ nghìn đồng"
      },
      {
        "key": "C",
        "text": "$3\\,200$ nghìn đồng, khi giá bán $50$ nghìn đồng"
      },
      {
        "key": "D",
        "text": "$3\\,200$ nghìn đồng, khi giá bán $60$ nghìn đồng"
      }
    ],
    "answer": "D",
    "explanation": "Lợi nhuận $P(x)=(x-20)(200-2x)$, $P'(x)=240-4x$, $P'(x)=0$ khi $x=60$. Ta có $P(60)=40\\cdot 80=3200$. Với $x=50$ thì $P=3000$ nên phương án C sai.",
    "points": 0.25,
    "tags": [
      "ứng dụng thực tế",
      "tối ưu",
      "giá bán",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hamso-08",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Có bao nhiêu giá trị nguyên của tham số $m$ thuộc đoạn $[-10;10]$ để hàm số $y=|x^3-3x^2+m|$ có đúng $5$ điểm cực trị?",
    "options": [
      {
        "key": "A",
        "text": "$2$"
      },
      {
        "key": "B",
        "text": "$3$"
      },
      {
        "key": "C",
        "text": "$4$"
      },
      {
        "key": "D",
        "text": "$5$"
      }
    ],
    "answer": "B",
    "explanation": "Đặt $g(x)=x^3-3x^2+m$ có $g'(x)=3x(x-2)$, $g(0)=m$, $g(2)=m-4$. Hàm $|g|$ có 5 điểm cực trị khi $g$ có ba nghiệm phân biệt, tức $0<m<4$: khi đó hai cực trị của $g$ đều khác 0 (cho 2 cực trị của $|g|$) và ba nghiệm đơn cho ba cực tiểu của $|g|$. Với $m=0$ hoặc $m=4$ chỉ còn 3 cực trị. Các số nguyên thỏa mãn là $1,2,3$.",
    "points": 0.25,
    "tags": [
      "tham số m",
      "cực trị",
      "trị tuyệt đối",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hamso-09",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=-x^3+3x^2$ có đồ thị như hình bên dưới. Xét tính đúng, sai của các khẳng định sau.",
    "options": [
      {
        "key": "a",
        "text": "Hàm số đồng biến trên khoảng $(0;2)$."
      },
      {
        "key": "b",
        "text": "Hàm số đạt cực tiểu tại $x=2$."
      },
      {
        "key": "c",
        "text": "Đồ thị hàm số cắt trục hoành tại đúng hai điểm."
      },
      {
        "key": "d",
        "text": "Giá trị lớn nhất của hàm số trên đoạn $[-1;1]$ bằng $2$."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) $y'=-3x^2+6x=-3x(x-2)>0$ khi $0<x<2$: Đúng. b) $y'$ đổi dấu từ $+$ sang $-$ tại $x=2$, đây là điểm cực đại: Sai. c) $y=-x^2(x-3)=0$ khi $x=0$ hoặc $x=3$: Đúng. d) $y(-1)=4$, $y(0)=0$, $y(1)=2$ nên giá trị lớn nhất là $4$: Sai.",
    "points": 1,
    "tags": [
      "đơn điệu",
      "cực trị",
      "đọc đồ thị",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "-x^3+3x^2"
      ],
      "xMin": -2,
      "xMax": 4
    }
  },
  {
    "id": "thpt-hamso-10",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=f(x)$ có đạo hàm $f'(x)$ với bảng xét dấu như hình bên dưới. Xét tính đúng, sai của các khẳng định sau.",
    "options": [
      {
        "key": "a",
        "text": "Hàm số nghịch biến trên khoảng $(-\\infty;1)$."
      },
      {
        "key": "b",
        "text": "Hàm số có hai điểm cực trị."
      },
      {
        "key": "c",
        "text": "Hàm số đạt cực đại tại $x=1$."
      },
      {
        "key": "d",
        "text": "Hàm số đồng biến trên khoảng $(1;+\\infty)$."
      }
    ],
    "answer": "ĐSSĐ",
    "explanation": "Từ bảng, $f'(x)<0$ khi $x<1$ (trừ $x=-2$) và $f'(x)>0$ khi $x>1$. a) Đúng. b) $x=-2$ là nghiệm kép nên $f'$ không đổi dấu tại đó; hàm số chỉ có một cực trị tại $x=1$: Sai. c) $f'$ đổi từ $-$ sang $+$ tại $x=1$ nên đó là cực tiểu: Sai. d) Đúng.",
    "points": 1,
    "tags": [
      "bảng xét dấu",
      "cực trị",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "signtable",
      "expr": "(x-1)(x+2)^2"
    }
  },
  {
    "id": "thpt-hamso-11",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=x^4-2x^2$ có bảng biến thiên như hình bên dưới. Xét tính đúng, sai của các khẳng định sau.",
    "options": [
      {
        "key": "a",
        "text": "Hàm số có ba điểm cực trị."
      },
      {
        "key": "b",
        "text": "Giá trị nhỏ nhất của hàm số trên $\\mathbb{R}$ bằng $-1$."
      },
      {
        "key": "c",
        "text": "Hàm số đồng biến trên khoảng $(-1;0)$."
      },
      {
        "key": "d",
        "text": "Phương trình $x^4-2x^2=m$ có bốn nghiệm phân biệt khi $0<m<1$."
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "$y'=4x(x^2-1)$ có ba nghiệm $x=-1,0,1$: a) Đúng. $y(\\pm 1)=-1$ là giá trị nhỏ nhất vì $y\\to+\\infty$ khi $x\\to\\pm\\infty$: b) Đúng. Trên $(-1;0)$, $y'=4x(x-1)(x+1)>0$: c) Đúng. Với $m>0$ phương trình tương đương $x^2=1+\\sqrt{1+m}$ chỉ có 2 nghiệm: d) Sai.",
    "points": 1,
    "tags": [
      "bảng biến thiên",
      "phương trình nghiệm",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "vartable",
      "expr": "x^4-2x^2",
      "fname": "y"
    }
  },
  {
    "id": "thpt-hamso-12",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=\\frac{2x+1}{x-1}$. Xét tính đúng, sai của các khẳng định sau.",
    "options": [
      {
        "key": "a",
        "text": "Hàm số nghịch biến trên từng khoảng xác định của nó."
      },
      {
        "key": "b",
        "text": "Đồ thị hàm số có tiệm cận đứng là đường thẳng $x=1$."
      },
      {
        "key": "c",
        "text": "Đồ thị hàm số có tiệm cận ngang là đường thẳng $y=1$."
      },
      {
        "key": "d",
        "text": "Đồ thị hàm số cắt trục tung tại điểm có tung độ bằng $-1$."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) $y'=\\frac{-3}{(x-1)^2}<0$ với mọi $x\\ne 1$: Đúng. b) Mẫu bằng $0$ tại $x=1$, tử khác $0$: Đúng. c) $\\lim_{x\\to\\pm\\infty}y=2$ nên tiệm cận ngang là $y=2$: Sai. d) $y(0)=-1$: Đúng.",
    "points": 1,
    "tags": [
      "tiệm cận",
      "đơn điệu",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hamso-13",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=x^3-3mx+1$ với $m$ là tham số thực. Xét tính đúng, sai của các khẳng định sau.",
    "options": [
      {
        "key": "a",
        "text": "Khi $m=0$, hàm số có đúng một điểm cực trị."
      },
      {
        "key": "b",
        "text": "Hàm số có hai điểm cực trị khi $m>0$."
      },
      {
        "key": "c",
        "text": "Khi $m=1$, giá trị cực tiểu của hàm số bằng $1$."
      },
      {
        "key": "d",
        "text": "Khi $m=2$, đường thẳng đi qua hai điểm cực trị của đồ thị song song với đường thẳng $y=-4x+5$."
      }
    ],
    "answer": "SĐSĐ",
    "explanation": "a) Khi $m=0$, $y'=3x^2\\ge 0$ nên hàm số không có cực trị: Sai. b) $y'=3(x^2-m)$ đổi dấu khi $m>0$: Đúng. c) Khi $m=1$, $y=x^3-3x+1$ có giá trị cực tiểu $y(1)=-1$: Sai. d) Đường thẳng qua hai cực trị là $y=-2mx+1$; với $m=2$ là $y=-4x+1$, song song với $y=-4x+5$: Đúng.",
    "points": 1,
    "tags": [
      "tham số m",
      "cực trị",
      "đường thẳng cực trị",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hamso-14",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Tổng chi phí (nghìn đồng) của một chuyến xe chạy trên một quãng đường cố định với vận tốc $v$ (km/h), $0<v\\le 60$, là $C(v)=\\frac{v^2}{20}+\\frac{800}{v}$. Xét tính đúng, sai của các khẳng định sau.",
    "options": [
      {
        "key": "a",
        "text": "Chi phí của chuyến đi khi $v=40$ km/h là $100$ nghìn đồng."
      },
      {
        "key": "b",
        "text": "$C'(v)=\\frac{v}{10}+\\frac{800}{v^2}$."
      },
      {
        "key": "c",
        "text": "Hàm số $C(v)$ đồng biến trên khoảng $(20;60]$."
      },
      {
        "key": "d",
        "text": "Chi phí nhỏ nhất trên $(0;60]$ bằng $60$ nghìn đồng."
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) $C(40)=80+20=100$: Đúng. b) $C'(v)=\\frac{v}{10}-\\frac{800}{v^2}$, dấu cộng sai: Sai. c) $C'(v)>0$ khi $v>20$: Đúng. d) $C$ giảm trên $(0;20)$, tăng trên $(20;60]$, nên $\\min C=C(20)=60$: Đúng.",
    "points": 1,
    "tags": [
      "ứng dụng thực tế",
      "tối ưu",
      "đạo hàm",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hamso-15",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Nồng độ thuốc trong máu của một bệnh nhân sau $t$ giờ kể từ lúc tiêm ($t\\ge 0$), tính theo mg/L, được cho bởi $C(t)=\\frac{15t}{t^2+9}$ và có đồ thị như hình bên dưới. Xét tính đúng, sai của các khẳng định sau.",
    "options": [
      {
        "key": "a",
        "text": "Nồng độ thuốc lớn nhất đạt được là $2{,}5$ mg/L."
      },
      {
        "key": "b",
        "text": "Nồng độ thuốc tăng trên khoảng $(0;3)$."
      },
      {
        "key": "c",
        "text": "Nồng độ thuốc giảm dần trên khoảng $(0;+\\infty)$."
      },
      {
        "key": "d",
        "text": "Nồng độ thuốc lớn hơn $2$ mg/L trong khoảng thời gian dài hơn $5$ giờ."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "$C'(t)=\\frac{15(9-t^2)}{(t^2+9)^2}$, $C'(t)=0$ khi $t=3$ và $C(3)=2{,}5$: a) Đúng. b) $C'>0$ trên $(0;3)$: Đúng. c) $C$ tăng trên $(0;3)$ nên sai. d) $C(t)\\ge 2$ tương đương $2t^2-15t+18\\le 0$, tức $1{,}5\\le t\\le 6$, kéo dài $4{,}5$ giờ: Sai.",
    "points": 1,
    "tags": [
      "nồng độ thuốc",
      "đạo hàm",
      "bất phương trình",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "15x/(x^2+9)"
      ],
      "xMin": 0,
      "xMax": 10
    }
  },
  {
    "id": "thpt-hamso-16",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Giá trị lớn nhất của hàm số $y=\\frac{x+2}{x-1}$ trên đoạn $[2;4]$ bằng bao nhiêu?",
    "answer": "4",
    "explanation": "$y'=\\frac{-3}{(x-1)^2}<0$ trên $[2;4]$ nên hàm số nghịch biến, giá trị lớn nhất là $y(2)=4$.",
    "points": 0.5,
    "tags": [
      "GTLN-GTNN",
      "trên đoạn",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hamso-17",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tiếp tuyến của đồ thị hàm số $y=x^3-3x+1$ tại điểm có hoành độ $x=2$ cắt trục tung tại điểm có tung độ bằng bao nhiêu?",
    "answer": "-15",
    "explanation": "$y(2)=3$, $y'(2)=9$, tiếp tuyến là $y=9(x-2)+3=9x-15$. Thay $x=0$ được $y=-15$.",
    "points": 0.5,
    "tags": [
      "tiếp tuyến",
      "đạo hàm",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hamso-18",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho hàm số $y=x^4-4x^2+3$ có đồ thị như hình bên dưới. Giá trị nhỏ nhất của hàm số trên đoạn $[-2;2]$ bằng bao nhiêu?",
    "answer": "-1",
    "explanation": "$y'=4x(x^2-2)$, các điểm tới hạn $x=0$, $x=\\pm\\sqrt{2}$. Ta có $y(0)=3$, $y(\\pm\\sqrt{2})=-1$, $y(\\pm 2)=3$. Giá trị nhỏ nhất là $-1$.",
    "points": 0.5,
    "tags": [
      "GTLN-GTNN",
      "đọc đồ thị",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "x^4-4x^2+3"
      ],
      "xMin": -2.5,
      "xMax": 2.5
    }
  },
  {
    "id": "thpt-hamso-19",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Người ta làm một thùng hình hộp chữ nhật không nắp, đáy là hình vuông cạnh $x$ (dm), chiều cao $h$ (dm), có thể tích $32$ dm³. Diện tích tôn nhỏ nhất cần dùng để làm thùng là bao nhiêu dm²? (Bỏ qua độ dày tôn.)",
    "answer": "48",
    "explanation": "$h=\\frac{32}{x^2}$, diện tích $S=x^2+4xh=x^2+\\frac{128}{x}$. $S'=2x-\\frac{128}{x^2}=0$ khi $x=4$, khi đó $S=16+32=48$.",
    "points": 0.5,
    "tags": [
      "ứng dụng thực tế",
      "tối ưu",
      "thể tích",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hamso-20",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Có bao nhiêu giá trị nguyên của tham số $m$ thuộc đoạn $[-10;10]$ để hàm số $y=x^3-3x^2+mx$ đồng biến trên khoảng $(0;+\\infty)$?",
    "answer": "8",
    "explanation": "$y'=3x^2-6x+m\\ge 0$ với mọi $x>0$ tương đương $m\\ge -3x^2+6x$ với mọi $x>0$. Vế phải có giá trị lớn nhất bằng $3$ (tại $x=1$) nên $m\\ge 3$. Các số nguyên thỏa mãn là $3,4,\\dots,10$, gồm 8 giá trị.",
    "points": 0.5,
    "tags": [
      "tham số m",
      "đơn điệu",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hamso-21",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Gọi $M$ là điểm cực đại và $N$ là điểm cực tiểu của đồ thị hàm số $y=x^3-3x^2$ như hình bên dưới. Tính độ dài đoạn thẳng $MN$, làm tròn kết quả đến hàng phần trăm.",
    "answer": "4,47",
    "explanation": "$y'=3x^2-6x=0$ khi $x=0$ hoặc $x=2$. Điểm cực đại $M(0;0)$, điểm cực tiểu $N(2;-4)$. Suy ra $MN=\\sqrt{2^2+4^2}=\\sqrt{20}\\approx 4{,}47$.",
    "points": 0.5,
    "tags": [
      "cực trị",
      "đọc đồ thị",
      "khoảng cách",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "x^3-3x^2"
      ],
      "xMin": -1,
      "xMax": 4,
      "points": "M(0; 0)\nN(2; -4) chiếu"
    }
  },
  {
    "id": "thpt-hamso-22",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tổng bình phương tất cả các giá trị thực của tham số $m$ để hàm số $y=|x^3-3x+m|$ có giá trị lớn nhất trên đoạn $[0;2]$ bằng $3$ là bao nhiêu?",
    "answer": "2",
    "explanation": "Với $g(x)=x^3-3x+m$ trên $[0;2]$: $g(1)=m-2$ là giá trị nhỏ nhất và $g(2)=m+2$ là giá trị lớn nhất. Do đó $\\max_{[0;2]}|g|=\\max\\{|m-2|;|m+2|\\}=3$, suy ra $m=\\pm 1$, tổng bình phương là $1+1=2$.",
    "points": 0.5,
    "tags": [
      "trị tuyệt đối",
      "tham số m",
      "GTLN-GTNN",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hamso-23",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho hàm số $y=x^3+3x^2+mx$ với $m$ là tham số thực. Tìm $m$ để hàm số có hai điểm cực trị $x_1,x_2$ thỏa mãn $x_1^2+x_2^2=6$.",
    "answer": "-3",
    "explanation": "$y'=3x^2+6x+m$ có hai nghiệm khi $\\Delta'=9-3m>0$, theo Viète $x_1+x_2=-2$, $x_1x_2=\\frac{m}{3}$. Suy ra $x_1^2+x_2^2=4-\\frac{2m}{3}=6$, nên $m=-3$ (thỏa $\\Delta'>0$).",
    "points": 0.5,
    "tags": [
      "tham số m",
      "cực trị",
      "Viète",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hamso-24",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Gọi $(C)$ là đồ thị hàm số $y=\\frac{x+3}{x-1}$. Tính tổng tung độ của tất cả các điểm thuộc $(C)$ có cả hoành độ và tung độ đều là số nguyên.",
    "answer": "6",
    "explanation": "$y=1+\\frac{4}{x-1}$, nguyên khi $x-1\\in\\{\\pm 1;\\pm 2;\\pm 4\\}$, tức $x\\in\\{-3;-1;0;2;3;5\\}$. Các điểm tương ứng có tung độ $0;-1;-3;5;3;2$, tổng bằng $6$.",
    "points": 0.5,
    "tags": [
      "đồ thị",
      "tiệm cận",
      "số nguyên",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hamso-25",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Từ một tấm tôn hình chữ nhật kích thước $80$ cm $\\times$ $50$ cm, người ta cắt bốn góc là bốn hình vuông bằng nhau cạnh $x$ (cm) rồi gập lên thành một hình hộp chữ nhật không nắp. Thể tích lớn nhất của hộp bằng bao nhiêu dm³?",
    "answer": "18",
    "explanation": "$V=x(80-2x)(50-2x)$ với $0<x<25$. $V'=12x^2-520x+4000=0$ suy ra $x=10$ (nhận) hoặc $x=\\frac{100}{3}$ (loại). $V(10)=10\\cdot 60\\cdot 30=18000$ cm³ $=18$ dm³.",
    "points": 0.5,
    "tags": [
      "ứng dụng thực tế",
      "tối ưu",
      "thể tích",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hinh12-01",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong không gian $Oxyz$, hình lập phương $ABCD.A'B'C'D'$ cạnh $2$ được đặt sao cho $A(0;0;0)$, $B(2;0;0)$, $D(0;2;0)$, $A'(0;0;2)$ (như hình bên dưới). Tọa độ đỉnh $C'$ là",
    "options": [
      {
        "key": "A",
        "text": "$(2;2;0)$"
      },
      {
        "key": "B",
        "text": "$(2;2;2)$"
      },
      {
        "key": "C",
        "text": "$(0;2;2)$"
      },
      {
        "key": "D",
        "text": "$(2;0;2)$"
      }
    ],
    "answer": "B",
    "explanation": "Đáy $ABCD$ là hình vuông cạnh $2$ nằm trong mặt phẳng $Oxy$ nên $C=(2;2;0)$. Vì $\\overrightarrow{CC'}=\\overrightarrow{AA'}=(0;0;2)$ nên $C'=(2;2;2)$.",
    "points": 0.25,
    "tags": [
      "Tọa độ điểm",
      "Hình lập phương",
      "NB"
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
      "diagonals": false
    }
  },
  {
    "id": "thpt-hinh12-02",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong không gian $Oxyz$, cho $\\vec{a}=(1;2;0)$ và $\\vec{b}=(0;1;3)$. Tọa độ của véc-tơ $[\\vec{a},\\vec{b}]$ là",
    "options": [
      {
        "key": "A",
        "text": "$(-6;3;1)$"
      },
      {
        "key": "B",
        "text": "$(6;3;1)$"
      },
      {
        "key": "C",
        "text": "$(2;3;1)$"
      },
      {
        "key": "D",
        "text": "$(6;-3;1)$"
      }
    ],
    "answer": "D",
    "explanation": "$[\\vec{a},\\vec{b}]=(2\\cdot 3-0\\cdot 1;\\ 0\\cdot 0-1\\cdot 3;\\ 1\\cdot 1-2\\cdot 0)=(6;-3;1)$.",
    "points": 0.25,
    "tags": [
      "Tích có hướng",
      "Tọa độ véc-tơ",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hinh12-04",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình vuông cạnh $2$, $SA\\perp(ABCD)$ và $SA=2$ (như hình bên dưới). Chọn hệ trục $Oxyz$ với $A$ là gốc tọa độ, $B\\in Ox$, $D\\in Oy$, $S\\in Oz$. Giá trị $\\sin$ của góc giữa đường thẳng $SC$ và mặt phẳng $(SAB)$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{\\sqrt6}{3}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{\\sqrt2}{2}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{\\sqrt3}{3}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac12$"
      }
    ],
    "answer": "C",
    "explanation": "Ta có $S(0;0;2)$, $C(2;2;0)$ nên $\\overrightarrow{SC}=(2;2;-2)$. Mặt phẳng $(SAB)$ là $y=0$ có véc-tơ pháp tuyến $\\vec n=(0;1;0)$. Do đó $\\sin\\varphi=\\dfrac{|\\overrightarrow{SC}\\cdot\\vec n|}{|\\overrightarrow{SC}|\\,|\\vec n|}=\\dfrac{2}{2\\sqrt3}=\\dfrac{\\sqrt3}{3}$.",
    "points": 0.25,
    "tags": [
      "Góc giữa đường thẳng và mặt phẳng",
      "Phương pháp tọa độ",
      "TH"
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
      "height": false,
      "diagonals": false
    }
  },
  {
    "id": "thpt-hinh12-07",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một cột ăng-ten thẳng đứng có đỉnh $T(0;0;4)$ trong hệ trục $Oxyz$ (đơn vị mét), chân cột trùng gốc $O$. Hai sợi cáp được căng từ $T$ xuống mặt đất tại hai điểm $A(3;0;0)$ và $B(0;4;0)$. Côsin của góc $\\widehat{ATB}$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{2\\sqrt2}{5}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac45$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{\\sqrt2}{2}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac35$"
      }
    ],
    "answer": "A",
    "explanation": "Ta có $\\overrightarrow{TA}=(3;0;-4)$, $\\overrightarrow{TB}=(0;4;-4)$, $\\overrightarrow{TA}\\cdot\\overrightarrow{TB}=16$, $|\\overrightarrow{TA}|=5$, $|\\overrightarrow{TB}|=4\\sqrt2$. Vậy $\\cos\\widehat{ATB}=\\dfrac{16}{20\\sqrt2}=\\dfrac{2\\sqrt2}{5}$.",
    "points": 0.25,
    "tags": [
      "Góc",
      "Bài toán thực tế",
      "Tích vô hướng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hinh12-08",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Căn phòng có dạng hình hộp chữ nhật $ABCD.A'B'C'D'$ với $AB=6$ m, $AD=4$ m, $AA'=3$ m, đặt trong hệ trục $Oxyz$ sao cho $A$ trùng gốc $O$, $B\\in Ox$, $D\\in Oy$, $A'\\in Oz$. Một bóng đèn gắn ở tâm trần nhà là điểm $M$. Một tấm kính phẳng đi qua ba điểm $B$, $D$, $A'$ để ngăn phòng. Khoảng cách từ $M$ đến tấm kính bằng (đơn vị mét)",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{6\\sqrt{29}}{29}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{12}{29}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{12\\sqrt{29}}{29}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{4\\sqrt{29}}{29}$"
      }
    ],
    "answer": "C",
    "explanation": "Tâm trần $M(3;2;3)$. Mặt phẳng $(BDA')$ có phương trình $\\dfrac{x}{6}+\\dfrac{y}{4}+\\dfrac{z}{3}=1$, tức $2x+3y+4z-12=0$. Khoảng cách $d=\\dfrac{|6+6+12-12|}{\\sqrt{29}}=\\dfrac{12}{\\sqrt{29}}=\\dfrac{12\\sqrt{29}}{29}$.",
    "points": 0.25,
    "tags": [
      "Khoảng cách",
      "Bài toán thực tế",
      "Phương trình mặt phẳng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hinh12-09",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một giàn khung có dạng hình hộp chữ nhật $ABCD.A'B'C'D'$ với $AB=6$, $AD=4$, $AA'=3$ (đơn vị mét), đặt trong hệ trục $Oxyz$ sao cho $A(0;0;0)$, $B(6;0;0)$, $D(0;4;0)$, $A'(0;0;3)$ (như hình bên dưới). Hai thanh $AC'$ và $BD$ của giàn là hai đường thẳng chéo nhau. Khoảng cách giữa hai thanh bằng (đơn vị mét)",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{6\\sqrt{77}}{77}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{12\\sqrt{77}}{77}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{24\\sqrt{77}}{77}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{12\\sqrt{7}}{7}$"
      }
    ],
    "answer": "B",
    "explanation": "Ta có $\\overrightarrow{AC'}=(6;4;3)$, $\\overrightarrow{BD}=(-6;4;0)$. Véc-tơ $\\vec n=[\\overrightarrow{AC'},\\overrightarrow{BD}]=(-12;-18;48)$, $|\\vec n|=6\\sqrt{77}$. Với $\\overrightarrow{AB}=(6;0;0)$: $d=\\dfrac{|\\overrightarrow{AB}\\cdot\\vec n|}{|\\vec n|}=\\dfrac{72}{6\\sqrt{77}}=\\dfrac{12\\sqrt{77}}{77}$.",
    "points": 0.25,
    "tags": [
      "Khoảng cách giữa hai đường thẳng chéo nhau",
      "Bài toán thực tế",
      "Hình hộp chữ nhật",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "box",
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
      "diagonals": false
    }
  },
  {
    "id": "thpt-hinh12-11",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Trong không gian $Oxyz$, cho hình hộp chữ nhật $ABCD.A'B'C'D'$ có $A(0;0;0)$, $B(3;0;0)$, $D(0;4;0)$, $A'(0;0;2)$ (như hình bên dưới). Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "$AC'=\\sqrt{29}$."
      },
      {
        "key": "b",
        "text": "Góc giữa $AC'$ và mặt phẳng $(ABCD)$ lớn hơn $30^\\circ$."
      },
      {
        "key": "c",
        "text": "$AC'\\perp B'D'$."
      },
      {
        "key": "d",
        "text": "Thể tích khối tứ diện $AB'C'D'$ bằng $4$."
      }
    ],
    "answer": "ĐSSĐ",
    "explanation": "Ta có $C'(3;4;2)$, $B'(3;0;2)$, $D'(0;4;2)$. a) Đúng: $AC'=\\sqrt{9+16+4}=\\sqrt{29}$. b) Sai: $\\tan\\varphi=\\dfrac{CC'}{AC}=\\dfrac{2}{5}$, nên $\\varphi\\approx 21{,}8^\\circ$. c) Sai: $\\overrightarrow{AC'}\\cdot\\overrightarrow{B'D'}=(3;4;2)\\cdot(-3;4;0)=7\\neq 0$. d) Đúng: $\\det(\\overrightarrow{AB'},\\overrightarrow{AC'},\\overrightarrow{AD'})=24$ nên $V=\\dfrac{24}{6}=4$.",
    "points": 1,
    "tags": [
      "Hình hộp chữ nhật",
      "Góc",
      "Thể tích",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "box",
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
      "diagonals": false
    }
  },
  {
    "id": "thpt-hinh12-12",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một giàn khung có dạng tứ diện $ABCD$, đặt trong hệ trục $Oxyz$ (đơn vị mét) với $A(0;0;0)$, $B(4;0;0)$, $C(0;4;0)$, $D(0;0;3)$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "$BC=4\\sqrt2$."
      },
      {
        "key": "b",
        "text": "$\\widehat{BDC}=90^\\circ$."
      },
      {
        "key": "c",
        "text": "Khoảng cách từ $D$ đến mặt phẳng $(ABC)$ bằng $3$."
      },
      {
        "key": "d",
        "text": "Thể tích khối tứ diện $ABCD$ bằng $6$."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng: $BC=\\sqrt{16+16}=4\\sqrt2$. b) Sai: $\\overrightarrow{DB}\\cdot\\overrightarrow{DC}=(4;0;-3)\\cdot(0;4;-3)=9\\neq 0$. c) Đúng: mặt phẳng $(ABC)$ là $z=0$. d) Sai: $V=\\dfrac16\\cdot 4\\cdot 4\\cdot 3=8$.",
    "points": 1,
    "tags": [
      "Tứ diện",
      "Khoảng cách",
      "Bài toán thực tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hinh12-14",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một ăng-ten thẳng đứng $OT$ có chân $O$ trên mặt đất và đỉnh $T(0;0;10)$ trong hệ trục $Oxyz$ (đơn vị mét). Hai sợi cáp căng từ $T$ xuống mặt đất tại $P(6;0;0)$ và $Q(0;8;0)$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "$TP=2\\sqrt{34}$."
      },
      {
        "key": "b",
        "text": "Góc giữa sợi cáp $TP$ và mặt đất nhỏ hơn $60^\\circ$."
      },
      {
        "key": "c",
        "text": "Góc $\\widehat{PTQ}$ là góc tù."
      },
      {
        "key": "d",
        "text": "Khoảng cách từ $O$ đến mặt phẳng $(TPQ)$ bằng $\\dfrac{120}{\\sqrt{769}}$."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: $\\overrightarrow{TP}=(6;0;-10)$, $TP=\\sqrt{136}=2\\sqrt{34}$. b) Đúng: góc $\\varphi$ giữa $TP$ và mặt đất có $\\tan\\varphi=\\dfrac{OT}{OP}=\\dfrac53<\\sqrt3$, nên $\\varphi\\approx 59{,}0^\\circ<60^\\circ$. c) Sai: $\\overrightarrow{TP}\\cdot\\overrightarrow{TQ}=(6;0;-10)\\cdot(0;8;-10)=100>0$ nên góc $\\widehat{PTQ}$ nhọn. d) Đúng: mặt phẳng $(TPQ)$ là $20x+15y+12z-120=0$, nên $d=\\dfrac{120}{\\sqrt{769}}$.",
    "points": 1,
    "tags": [
      "Khoảng cách",
      "Góc",
      "Bài toán thực tế",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hinh12-15",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Trong không gian $Oxyz$ (đơn vị mét), hai sợi dây cáp được mô tả bởi hai đường thẳng: $d_1$ đi qua $A(1;0;0)$ với véc-tơ chỉ phương $\\vec u=(0;1;1)$, và $d_2$ đi qua $B(0;2;3)$ với véc-tơ chỉ phương $\\vec v=(1;0;2)$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Hai đường thẳng $d_1$ và $d_2$ không cắt nhau và không song song."
      },
      {
        "key": "b",
        "text": "Côsin của góc giữa $d_1$ và $d_2$ bằng $\\dfrac{2}{\\sqrt{10}}$."
      },
      {
        "key": "c",
        "text": "Khoảng cách giữa $d_1$ và $d_2$ bằng $\\dfrac{\\sqrt6}{2}$."
      },
      {
        "key": "d",
        "text": "Mặt phẳng chứa $d_1$ và song song với $d_2$ có một véc-tơ pháp tuyến là $(1;2;-1)$."
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "Ta có $\\vec u\\times\\vec v=(2;1;-1)$ và $\\overrightarrow{AB}=(-1;2;3)$. a) Đúng: $\\vec u,\\vec v$ không cùng phương, và hệ $1=s$, $t=2$, $t=3+2s$ vô nghiệm. b) Đúng: $\\cos\\varphi=\\dfrac{|\\vec u\\cdot\\vec v|}{|\\vec u|\\,|\\vec v|}=\\dfrac{2}{\\sqrt2\\sqrt5}=\\dfrac{2}{\\sqrt{10}}$. c) Đúng: $d=\\dfrac{|\\overrightarrow{AB}\\cdot(\\vec u\\times\\vec v)|}{|\\vec u\\times\\vec v|}=\\dfrac{3}{\\sqrt6}=\\dfrac{\\sqrt6}{2}$. d) Sai: véc-tơ pháp tuyến đúng là $(2;1;-1)$; còn $(1;2;-1)$ có $\\vec u\\cdot(1;2;-1)=1\\neq 0$ nên không vuông góc với $\\vec u$.",
    "points": 1,
    "tags": [
      "Khoảng cách giữa hai đường thẳng chéo nhau",
      "Góc",
      "Bài toán thực tế",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hinh12-17",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Mái một căn nhà gồm hai mặt phẳng $(\\alpha): x+2z-6=0$ và $(\\beta): -x+2z-6=0$ trong hệ trục $Oxyz$ (đơn vị mét; mặt đất là $Oxy$, trục $Oz$ thẳng đứng). Mặt cắt của mái theo mặt phẳng $xOz$ được cho như hình bên dưới. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Điểm $(6;0;0)$ thuộc mặt phẳng $(\\beta)$."
      },
      {
        "key": "b",
        "text": "Giao tuyến của $(\\alpha)$ và $(\\beta)$ song song với trục $Oy$."
      },
      {
        "key": "c",
        "text": "Côsin của góc giữa $(\\alpha)$ và $(\\beta)$ bằng $\\dfrac35$."
      },
      {
        "key": "d",
        "text": "Khoảng cách từ gốc $O$ đến $(\\alpha)$ bằng $3$."
      }
    ],
    "answer": "SĐĐS",
    "explanation": "a) Sai: thay $(6;0;0)$ vào $(\\beta)$ được $-6-6=-12\\neq 0$. b) Đúng: $(\\alpha)\\cap(\\beta)$ là các điểm có $x=0$, $z=3$, nên có véc-tơ chỉ phương $(0;1;0)$. c) Đúng: $\\vec n_\\alpha=(1;0;2)$, $\\vec n_\\beta=(-1;0;2)$, $\\cos=\\dfrac{|-1+4|}{5}=\\dfrac35$. d) Sai: $d(O,(\\alpha))=\\dfrac{6}{\\sqrt5}\\approx 2{,}68\\neq 3$.",
    "points": 1,
    "tags": [
      "Góc giữa hai mặt phẳng",
      "Khoảng cách",
      "Bài toán thực tế",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "scene",
      "text": "A(-6; 0) B(6; 0) C(0; 3)\nAB, AC, BC\nkích thước AB \"12 m\""
    }
  },
  {
    "id": "thpt-hinh12-18",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho tứ diện đều $ABCD$ với $A(0;0;0)$, $B(2;2;0)$, $C(2;0;2)$, $D(0;2;2)$ (đơn vị cm). Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "$AB=4$."
      },
      {
        "key": "b",
        "text": "$\\widehat{BAC}=60^\\circ$."
      },
      {
        "key": "c",
        "text": "Thể tích khối tứ diện $ABCD$ bằng $\\dfrac83$."
      },
      {
        "key": "d",
        "text": "Khoảng cách từ $D$ đến mặt phẳng $(ABC)$ bằng $\\dfrac{2\\sqrt3}{3}$."
      }
    ],
    "answer": "SĐĐS",
    "explanation": "a) Sai: $AB=\\sqrt{8}=2\\sqrt2$. b) Đúng: $\\cos\\widehat{BAC}=\\dfrac{\\overrightarrow{AB}\\cdot\\overrightarrow{AC}}{|\\overrightarrow{AB}|\\,|\\overrightarrow{AC}|}=\\dfrac{4}{8}=\\dfrac12$. c) Đúng: $\\det(\\overrightarrow{AB},\\overrightarrow{AC},\\overrightarrow{AD})=-16$ nên $V=\\dfrac{16}{6}=\\dfrac83$. d) Sai: mặt phẳng $(ABC)$ là $x-y-z=0$, nên $d(D,(ABC))=\\dfrac{|0-2-2|}{\\sqrt3}=\\dfrac{4\\sqrt3}{3}$.",
    "points": 1,
    "tags": [
      "Tứ diện đều",
      "Thể tích",
      "Khoảng cách",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hinh12-19",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trong không gian $Oxyz$, cho điểm $M(3;-4;12)$. Độ dài đoạn thẳng $OM$ bằng",
    "answer": "13",
    "explanation": "$OM=\\sqrt{3^2+(-4)^2+12^2}=\\sqrt{169}=13$.",
    "points": 0.5,
    "tags": [
      "Độ dài véc-tơ",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hinh12-20",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trong không gian $Oxyz$, cho $A(1;-1;2)$ và $B(3;1;0)$. Điểm $M$ thuộc đoạn $AB$ sao cho $\\overrightarrow{AM}=3\\overrightarrow{MB}$. Tổng $x_M+y_M+z_M$ bằng",
    "answer": "3,5",
    "explanation": "Từ $\\overrightarrow{AM}=3\\overrightarrow{MB}$ suy ra $M=\\dfrac{A+3B}{4}=\\left(\\dfrac52;\\dfrac12;\\dfrac12\\right)$, nên $x_M+y_M+z_M=\\dfrac72=3{,}5$.",
    "points": 0.5,
    "tags": [
      "Tọa độ điểm chia đoạn",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hinh12-21",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho hình lập phương $ABCD.A'B'C'D'$ cạnh $4$ (như hình bên dưới). Khoảng cách từ $A$ đến mặt phẳng $(A'BD)$ bằng (làm tròn đến hàng phần trăm).",
    "answer": "2,31",
    "explanation": "Chọn $A(0;0;0)$, $B(4;0;0)$, $D(0;4;0)$, $A'(0;0;4)$. Mặt phẳng $(A'BD)$ là $x+y+z-4=0$, nên $d=\\dfrac{4}{\\sqrt3}=\\dfrac{4\\sqrt3}{3}\\approx 2{,}31$.",
    "points": 0.5,
    "tags": [
      "Khoảng cách",
      "Hình lập phương",
      "VD"
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
      "diagonals": false
    }
  },
  {
    "id": "thpt-hinh12-23",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trong hệ trục $Oxyz$ (đơn vị mét), hình hộp chữ nhật $ABCD.A'B'C'D'$ có $AB=6$, $AD=4$, $AA'=3$ với $A$ trùng gốc $O$, $B\\in Ox$, $D\\in Oy$, $A'\\in Oz$. Góc giữa hai thanh $AC'$ và $BA'$ bằng bao nhiêu độ? (làm tròn đến hàng đơn vị)",
    "answer": "59",
    "explanation": "$\\overrightarrow{AC'}=(6;4;3)$, $\\overrightarrow{BA'}=(-6;0;3)$. Ta có $\\cos\\varphi=\\dfrac{|-36+0+9|}{\\sqrt{61}\\cdot\\sqrt{45}}=\\dfrac{27}{\\sqrt{2745}}\\approx 0{,}5154$, suy ra $\\varphi\\approx 58{,}98^\\circ$, làm tròn được $59$.",
    "points": 0.5,
    "tags": [
      "Góc giữa hai đường thẳng",
      "Hình hộp chữ nhật",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hinh12-24",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một cột ăng-ten thẳng đứng có chân tại gốc $O$ và đỉnh $T(0;0;15)$ (đơn vị mét). Một sợi cáp nối $T$ với điểm $A(9;12;0)$ trên mặt đất. Độ dài sợi cáp $TA$ bằng (mét, làm tròn đến hàng phần mười).",
    "answer": "21,2",
    "explanation": "$TA=\\sqrt{9^2+12^2+15^2}=\\sqrt{450}\\approx 21{,}21$, làm tròn được $21{,}2$.",
    "points": 0.5,
    "tags": [
      "Độ dài véc-tơ",
      "Bài toán thực tế",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hinh12-25",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Căn phòng có dạng hình hộp chữ nhật $ABCD.A'B'C'D'$ với $AB=6$ m, $AD=4$ m, $AA'=3$ m, đặt trong hệ trục $Oxyz$ sao cho $A$ trùng gốc $O$, $B\\in Ox$, $D\\in Oy$, $A'\\in Oz$. Một tấm kính phẳng đi qua ba điểm $B$, $D$, $C'$. Khoảng cách từ $A'$ đến tấm kính bằng (mét, làm tròn đến hàng phần trăm).",
    "answer": "4,46",
    "explanation": "Ta có $\\overrightarrow{BD}=(-6;4;0)$, $\\overrightarrow{BC'}=(0;4;3)$, $\\overrightarrow{BD}\\times\\overrightarrow{BC'}=(12;18;-24)$, tỉ lệ với $(2;3;-4)$. Mặt kính: $2x+3y-4z-12=0$. Khoảng cách từ $A'(0;0;3)$: $d=\\dfrac{|-12-12|}{\\sqrt{29}}=\\dfrac{24}{\\sqrt{29}}\\approx 4{,}46$.",
    "points": 0.5,
    "tags": [
      "Khoảng cách",
      "Bài toán thực tế",
      "Phương trình mặt phẳng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hinh12-26",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Lều có dạng hình chóp $S.ABCD$, đáy $ABCD$ là hình chữ nhật với $AB=6$ m, $AD=8$ m; cột $SA$ vuông góc với mặt đất và $SA=6$ m (như hình bên dưới). Khoảng cách từ $A$ đến mặt mái $(SCD)$ bằng (mét, làm tròn đến hàng phần mười).",
    "answer": "4,8",
    "explanation": "Vì $CD\\perp AD$ và $CD\\perp SA$ nên $CD\\perp(SAD)$, do đó $(SCD)\\perp(SAD)$ theo giao tuyến $SD$. Kẻ $AH\\perp SD$ thì $AH\\perp(SCD)$ và $AH=\\dfrac{SA\\cdot AD}{\\sqrt{SA^2+AD^2}}=\\dfrac{6\\cdot 8}{10}=4{,}8$.",
    "points": 0.5,
    "tags": [
      "Khoảng cách",
      "Bài toán thực tế",
      "Chóp",
      "VD"
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
      "height": false,
      "diagonals": false
    }
  },
  {
    "id": "thpt-hinh12-27",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một khối hộp chữ nhật có kích thước $6$ cm, $4$ cm, $3$ cm. Một con kiến đi từ đỉnh $A$ đến đỉnh $C'$ đối diện với $A$ qua khối hộp, và chỉ đi trên bề mặt khối hộp. Độ dài quãng đường ngắn nhất mà kiến có thể đi (cm, làm tròn đến hàng phần trăm) bằng",
    "answer": "9,22",
    "explanation": "Trải các mặt của hình hộp trên một mặt phẳng, ta được các độ dài $\\sqrt{(a+b)^2+c^2}$, $\\sqrt{(a+c)^2+b^2}$, $\\sqrt{(b+c)^2+a^2}$ với $a=6$, $b=4$, $c=3$. Giá trị nhỏ nhất là $\\sqrt{6^2+(4+3)^2}=\\sqrt{85}\\approx 9{,}22$.",
    "points": 0.5,
    "tags": [
      "Bài toán thực tế",
      "Quãng đường ngắn nhất",
      "Hình hộp chữ nhật",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hinh12-29",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho hình hộp chữ nhật $ABCD.A'B'C'D'$ có $AB=4$, $AD=3$, $AA'=m$ với $m>0$. Biết khoảng cách từ $A$ đến mặt phẳng $(A'BD)$ bằng $2$. Giá trị của $m$ (làm tròn đến hàng phần trăm) bằng",
    "answer": "3,62",
    "explanation": "Chọn $A(0;0;0)$, $B(4;0;0)$, $D(0;3;0)$, $A'(0;0;m)$. Mặt phẳng $(A'BD)$ là $\\dfrac{x}{4}+\\dfrac{y}{3}+\\dfrac{z}{m}=1$. Khoảng cách từ $A$ bằng $2$ nên $\\dfrac{1}{\\frac1{16}+\\frac19+\\frac1{m^2}}=4$, suy ra $\\dfrac{1}{m^2}=\\dfrac{11}{144}$, $m=\\dfrac{12}{\\sqrt{11}}\\approx 3{,}62$.",
    "points": 0.5,
    "tags": [
      "Khoảng cách",
      "Phương trình mặt phẳng theo đoạn chắn",
      "Hình hộp chữ nhật",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hinh12-30",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trong không gian $Oxyz$ (đơn vị mét), một cột ăng-ten đặt dọc theo đường thẳng $\\Delta$ có phương trình tham số $x=1+t$, $y=2+2t$, $z=3$. Một thiết bị thu đặt tại điểm $M(4;0;3)$. Khoảng cách từ $M$ đến cột ăng-ten bằng (làm tròn đến hàng phần trăm).",
    "answer": "3,58",
    "explanation": "$\\Delta$ đi qua $M_0(1;2;3)$ có véc-tơ chỉ phương $\\vec u=(1;2;0)$. Với $\\overrightarrow{M_0M}=(3;-2;0)$, ta có $[\\overrightarrow{M_0M},\\vec u]=(0;0;8)$. Vậy $d=\\dfrac{8}{\\sqrt5}\\approx 3{,}58$.",
    "points": 0.5,
    "tags": [
      "Khoảng cách từ điểm đến đường thẳng",
      "Bài toán thực tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa1011-01",
    "subject": "Hoá học",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Nguyên tử Fe có số hiệu nguyên tử Z = 26. Cấu hình electron của Fe ở trạng thái cơ bản là:",
    "options": [
      {
        "key": "A",
        "text": "[Ar]3d⁶4s²"
      },
      {
        "key": "B",
        "text": "[Ar]3d⁸"
      },
      {
        "key": "C",
        "text": "[Ar]3d⁴4s²"
      },
      {
        "key": "D",
        "text": "[Ar]3d⁵4s¹"
      }
    ],
    "answer": "A",
    "explanation": "Fe có Z = 26, cấu hình đầy đủ 1s²2s²2p⁶3s²3p⁶3d⁶4s², viết gọn là [Ar]3d⁶4s². B và C sai số electron ở phân lớp 3d. D là cấu hình của Cr (Z = 24).",
    "points": 0.25,
    "tags": [
      "cấu tạo nguyên tử",
      "cấu hình electron",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa1011-02",
    "subject": "Hoá học",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Nguyên tử X có tổng số hạt proton, nơtron và electron bằng 52, trong đó số hạt mang điện nhiều hơn số hạt không mang điện là 16. Vị trí của X trong bảng tuần hoàn là:",
    "options": [
      {
        "key": "A",
        "text": "Chu kỳ 3, nhóm VA"
      },
      {
        "key": "B",
        "text": "Chu kỳ 2, nhóm VIIA"
      },
      {
        "key": "C",
        "text": "Chu kỳ 3, nhóm VIIA"
      },
      {
        "key": "D",
        "text": "Chu kỳ 4, nhóm VIIA"
      }
    ],
    "answer": "C",
    "explanation": "Gọi Z là số proton, N là số nơtron: 2Z + N = 52 và 2Z − N = 16, suy ra Z = 17, N = 18, A = 35. Cấu hình 1s²2s²2p⁶3s²3p⁵ cho thấy X có 3 lớp electron (chu kỳ 3) và 7 electron hoá trị (nhóm VIIA). X là Cl.",
    "points": 0.25,
    "tags": [
      "bảng tuần hoàn",
      "cấu tạo nguyên tử",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa1011-03",
    "subject": "Hoá học",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho phản ứng: Cu + HNO₃ → Cu(NO₃)₂ + NO + H₂O. Khi cân bằng phương trình với hệ số nguyên tối giản, tổng hệ số của tất cả các chất trong phương trình là:",
    "options": [
      {
        "key": "A",
        "text": "18"
      },
      {
        "key": "B",
        "text": "20"
      },
      {
        "key": "C",
        "text": "22"
      },
      {
        "key": "D",
        "text": "24"
      }
    ],
    "answer": "B",
    "explanation": "Cu nhường 2e (0 → +2), N nhận 3e (+5 → +2). Phương trình cân bằng: 3Cu + 8HNO₃ → 3Cu(NO₃)₂ + 2NO + 4H₂O. Tổng hệ số = 3 + 8 + 3 + 2 + 4 = 20.",
    "points": 0.25,
    "tags": [
      "phản ứng oxi hoá – khử",
      "cân bằng phương trình",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa1011-04",
    "subject": "Hoá học",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cân bằng phương trình: KMnO₄ + FeSO₄ + H₂SO₄ → K₂SO₄ + MnSO₄ + Fe₂(SO₄)₃ + H₂O. Với hệ số nguyên tối giản, tổng hệ số của các chất trong phương trình là:",
    "options": [
      {
        "key": "A",
        "text": "30"
      },
      {
        "key": "B",
        "text": "34"
      },
      {
        "key": "C",
        "text": "36"
      },
      {
        "key": "D",
        "text": "40"
      }
    ],
    "answer": "C",
    "explanation": "Mn: +7 → +2 (nhận 5e), Fe: +2 → +3 (nhường 1e). Cân bằng electron và nguyên tố: 2KMnO₄ + 10FeSO₄ + 8H₂SO₄ → K₂SO₄ + 2MnSO₄ + 5Fe₂(SO₄)₃ + 8H₂O. Tổng hệ số = 2 + 10 + 8 + 1 + 2 + 5 + 8 = 36.",
    "points": 0.25,
    "tags": [
      "phản ứng oxi hoá – khử",
      "cân bằng phương trình",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa1011-05",
    "subject": "Hoá học",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Xét phản ứng: Fe + CuSO₄ → FeSO₄ + Cu. Với mỗi phát biểu sau, chọn Đ (đúng) hoặc S (sai):",
    "options": [
      {
        "key": "a",
        "text": "Fe là chất khử."
      },
      {
        "key": "b",
        "text": "Ion Cu²⁺ bị oxi hoá trong phản ứng."
      },
      {
        "key": "c",
        "text": "Quá trình Fe → Fe²⁺ + 2e là quá trình oxi hoá."
      },
      {
        "key": "d",
        "text": "Fe²⁺ là chất oxi hoá trong phản ứng này."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đ: Fe nhường electron, số oxi hoá tăng từ 0 lên +2. b) S: Cu²⁺ nhận electron và bị khử thành Cu. c) Đ: quá trình nhường electron là oxi hoá. d) S: trong phản ứng này Fe²⁺ là sản phẩm, không nhận electron.",
    "points": 1,
    "tags": [
      "phản ứng oxi hoá – khử",
      "số oxi hoá",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa1011-06",
    "subject": "Hoá học",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Hình bên dưới biểu diễn sơ đồ electron của nguyên tử Cl. Với mỗi phát biểu sau về liên kết trong NaCl và HCl, chọn Đ hoặc S:",
    "options": [
      {
        "key": "a",
        "text": "Nguyên tử Cl có 7 electron ở lớp ngoài cùng."
      },
      {
        "key": "b",
        "text": "Trong HCl, cặp electron liên kết lệch về phía Cl nên liên kết là cộng hoá trị phân cực."
      },
      {
        "key": "c",
        "text": "Trong NaCl, nguyên tử Na nhường 1 electron cho Cl và hình thành liên kết ion."
      },
      {
        "key": "d",
        "text": "Liên kết trong phân tử Cl₂ là liên kết ion."
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) Đ: cấu hình 3s²3p⁵ có 7 electron lớp ngoài cùng. b) Đ: độ âm điện của Cl lớn hơn H nên cặp electron lệch về Cl. c) Đ: Na (độ âm điện nhỏ) nhường 1e cho Cl tạo ion Na⁺ và Cl⁻. d) S: Cl₂ có liên kết cộng hoá trị không phân cực vì hai nguyên tử giống nhau.",
    "points": 1,
    "tags": [
      "liên kết hoá học",
      "cấu tạo nguyên tử",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "electron",
      "element": "Cl"
    }
  },
  {
    "id": "thpt-hoa1011-07",
    "subject": "Hoá học",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Bảng dưới đây cho năng lượng liên kết trung bình. Xét phản ứng đốt cháy metan: CH₄(k) + 2O₂(k) → CO₂(k) + 2H₂O(k). Với mỗi phát biểu sau, chọn Đ hoặc S:",
    "options": [
      {
        "key": "a",
        "text": "Biến thiên enthalpy chuẩn của phản ứng khoảng −706 kJ."
      },
      {
        "key": "b",
        "text": "Phản ứng toả nhiệt."
      },
      {
        "key": "c",
        "text": "Tổng năng lượng cần để phá vỡ liên kết ở các chất đầu là 3358 kJ."
      },
      {
        "key": "d",
        "text": "Phản ứng cần hấp thu 706 kJ để phá vỡ liên kết."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "ΔrH = Σ E(chất đầu) − Σ E(sản phẩm) = (4·414 + 2·498) − (2·745 + 4·467) = 2652 − 3358 = −706 kJ. a) Đ, b) Đ vì ΔrH < 0. c) S: chất đầu cần 2652 kJ, còn 3358 kJ là năng lượng giải phóng khi tạo liên kết ở sản phẩm. d) S: phản ứng giải phóng 706 kJ.",
    "points": 1,
    "tags": [
      "năng lượng hoá học",
      "enthalpy",
      "năng lượng liên kết",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "table",
      "title": "Năng lượng liên kết trung bình",
      "data": "C–H; O=O; C=O; O–H\nNăng lượng (kJ/mol): 414; 498; 745; 467"
    }
  },
  {
    "id": "thpt-hoa1011-08",
    "subject": "Hoá học",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hình bên dưới biểu diễn cấu hình electron của nguyên tử Cr (Z = 24) ở trạng thái cơ bản. Số electron độc thân trong nguyên tử Cr là bao nhiêu?",
    "answer": "6",
    "explanation": "Cấu hình Cr là [Ar]3d⁵4s¹. Phân lớp 3d⁵ có 5 electron độc thân (mỗi orbital một electron) và 4s¹ có 1 electron độc thân. Tổng cộng 6.",
    "points": 0.5,
    "tags": [
      "cấu tạo nguyên tử",
      "cấu hình electron",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "electron",
      "element": "Cr"
    }
  },
  {
    "id": "thpt-hoa1011-09",
    "subject": "Hoá học",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho năng lượng liên kết (kJ/mol): H–H 436; Cl–Cl 243; H–Cl 432. Tính biến thiên enthalpy chuẩn của phản ứng H₂(k) + Cl₂(k) → 2HCl(k), theo kJ/mol.",
    "answer": "-185",
    "explanation": "ΔrH = (436 + 243) − 2·432 = 679 − 864 = −185 kJ/mol.",
    "points": 0.5,
    "tags": [
      "năng lượng hoá học",
      "enthalpy",
      "năng lượng liên kết",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa1011-10",
    "subject": "Hoá học",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hình bên dưới là đồ thị nồng độ chất X (mol/L) theo thời gian t (s) của một phản ứng có hệ số tỉ lượng của X bằng 1. Tốc độ trung bình của phản ứng trong khoảng từ t = 2 s đến t = 10 s là bao nhiêu mol/(L·s)? (Làm tròn đến hai chữ số thập phân.)",
    "answer": "0,42",
    "explanation": "Đọc đồ thị: C(2) = 5 mol/L và C(10) ≈ 1,667 mol/L. Tốc độ trung bình = (5 − 1,667) / (10 − 2) ≈ 0,4167, làm tròn thành 0,42 mol/(L·s).",
    "points": 0.5,
    "tags": [
      "tốc độ phản ứng",
      "đồ thị nồng độ – thời gian",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "10/(1+0.5x)"
      ],
      "xMin": 0,
      "xMax": 12
    }
  },
  {
    "id": "thpt-hoa1011-11",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Phát biểu nào sau đây đúng?",
    "options": [
      {
        "key": "A",
        "text": "Dung dịch NH₃ làm quỳ tím chuyển sang màu đỏ."
      },
      {
        "key": "B",
        "text": "Khi đun nóng muối NH₄NO₂ thu được khí N₂."
      },
      {
        "key": "C",
        "text": "Liên kết trong phân tử NH₃ là liên kết ion."
      },
      {
        "key": "D",
        "text": "Phân tử NH₃ có dạng hình vuông phẳng."
      }
    ],
    "answer": "B",
    "explanation": "NH₄NO₂ → N₂ + 2H₂O khi đun nóng. A sai: dung dịch NH₃ làm quỳ tím chuyển xanh yếu. C sai: liên kết trong NH₃ là cộng hoá trị phân cực. D sai: NH₃ có dạng hình chóp tam giác.",
    "points": 0.25,
    "tags": [
      "nitrogen",
      "ammonia",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa1011-12",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho 12,8 g Cu tác dụng hoàn toàn với dung dịch H₂SO₄ đặc, nóng, dư. Khí SO₂ là sản phẩm khử duy nhất. Thể tích SO₂ thu được ở đkc (1 mol khí chiếm 24,79 L) là:",
    "options": [
      {
        "key": "A",
        "text": "2,479 L"
      },
      {
        "key": "B",
        "text": "9,916 L"
      },
      {
        "key": "C",
        "text": "1,2395 L"
      },
      {
        "key": "D",
        "text": "4,958 L"
      }
    ],
    "answer": "D",
    "explanation": "n Cu = 12,8 / 64 = 0,2 mol. Cu nhường 2e, S(+6) nhận 2e thành S(+4), nên n SO₂ = 0,2 mol và V = 0,2 · 24,79 = 4,958 L. A ứng với 0,1 mol, B ứng với 0,4 mol, C ứng với 0,05 mol.",
    "points": 0.25,
    "tags": [
      "sulfur",
      "phản ứng với H₂SO₄ đặc",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa1011-13",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho 2-methylbut-1-ene (CH₂=C(CH₃)–CH₂–CH₃) tác dụng với HBr. Theo quy tắc Markovnikov, sản phẩm chính là:",
    "options": [
      {
        "key": "A",
        "text": "1-bromo-2-methylbutane"
      },
      {
        "key": "B",
        "text": "1-bromobutane"
      },
      {
        "key": "C",
        "text": "2-bromobutane"
      },
      {
        "key": "D",
        "text": "2-bromo-2-methylbutane"
      }
    ],
    "answer": "D",
    "explanation": "H⁺ cộng vào C ít nhóm thế (CH₂=), Br⁻ cộng vào C bậc cao hơn (C số 2) nên tạo 2-bromo-2-methylbutane. A sai vì Br gắn sai vị trí. B và C sai vì mất một nguyên tử C của mạch.",
    "points": 0.25,
    "tags": [
      "hydrocarbon",
      "alkene",
      "quy tắc Markovnikov",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa1011-14",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Phenol không phản ứng với dung dịch NaHCO₃ nhưng phản ứng được với dung dịch NaOH. Điều này chứng tỏ:",
    "options": [
      {
        "key": "A",
        "text": "Phenol có tính axit mạnh hơn H₂CO₃."
      },
      {
        "key": "B",
        "text": "Phenol có tính bazơ mạnh."
      },
      {
        "key": "C",
        "text": "Phenol có tính axit yếu hơn H₂CO₃ nhưng vẫn là axit, phản ứng được với bazơ mạnh."
      },
      {
        "key": "D",
        "text": "Phenol là chất trung tính."
      }
    ],
    "answer": "C",
    "explanation": "Phenol không đẩy được CO₂ khỏi NaHCO₃ nên tính axit yếu hơn H₂CO₃. Tuy vậy phenol vẫn có tính axit nên tác dụng với NaOH tạo C₆H₅ONa và H₂O. A sai vì phenol yếu hơn H₂CO₃. B và D sai.",
    "points": 0.25,
    "tags": [
      "phenol",
      "tính axit",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa1011-15",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Trộn 100 mL dung dịch HCl có pH = 1 với 100 mL dung dịch NaOH 0,02 M. Coi thể tích dung dịch sau khi trộn là 200 mL. pH của dung dịch thu được là:",
    "options": [
      {
        "key": "A",
        "text": "1,40"
      },
      {
        "key": "B",
        "text": "1,00"
      },
      {
        "key": "C",
        "text": "2,00"
      },
      {
        "key": "D",
        "text": "12,60"
      }
    ],
    "answer": "A",
    "explanation": "n H⁺ = 0,1 · 0,1 = 0,01 mol; n OH⁻ = 0,02 · 0,1 = 0,002 mol. H⁺ dư = 0,008 mol, [H⁺] = 0,008 / 0,2 = 0,04 M, pH = −lg 0,04 ≈ 1,40.",
    "points": 0.25,
    "tags": [
      "cân bằng ion",
      "pH",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa1011-16",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Ở nhiệt độ không đổi, phản ứng H₂(k) + I₂(k) ⇌ 2HI(k) có Kc = 64. Cho 1 mol H₂ và 1 mol I₂ vào bình kín dung tích 1 L. Khi đạt cân bằng, số mol HI trong bình là:",
    "options": [
      {
        "key": "A",
        "text": "0,80 mol"
      },
      {
        "key": "B",
        "text": "0,40 mol"
      },
      {
        "key": "C",
        "text": "1,20 mol"
      },
      {
        "key": "D",
        "text": "1,60 mol"
      }
    ],
    "answer": "D",
    "explanation": "Gọi x là số mol H₂ phản ứng: [HI] = 2x, [H₂] = [I₂] = 1 − x. Kc = (2x)² / (1 − x)² = 64 nên 2x / (1 − x) = 8, suy ra x = 0,8 và n HI = 1,6 mol. A là giá trị của x, B và C là kết quả khi lập sai tỉ lệ.",
    "points": 0.25,
    "tags": [
      "cân bằng hoá học",
      "hằng số cân bằng",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa1011-17",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Hợp chất có công thức cấu tạo như hình bên dưới. Tên thay thế (IUPAC) của hợp chất là:",
    "options": [
      {
        "key": "A",
        "text": "butan-1-ol"
      },
      {
        "key": "B",
        "text": "butan-2-ol"
      },
      {
        "key": "C",
        "text": "2-methylpropan-1-ol"
      },
      {
        "key": "D",
        "text": "2-methylpropan-2-ol"
      }
    ],
    "answer": "B",
    "explanation": "Mạch chính có 4 nguyên tử C, nhóm –OH gắn vào C số 2 nên gọi là butan-2-ol. A sai vị trí nhóm –OH. C và D là alcohol có mạch chính 3 C với nhánh methyl.",
    "points": 0.25,
    "tags": [
      "alcohol",
      "danh pháp",
      "NB"
    ],
    "variable": false,
    "figure": {
      "kind": "struct",
      "formula": "CH3-CH(OH)-CH2-CH3"
    }
  },
  {
    "id": "thpt-hoa1011-18",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Dung dịch CH₃COOH 0,1 M có Ka = 1,8·10⁻⁵ ở 25 °C. Bỏ qua sự phân li của nước. Với mỗi phát biểu sau, chọn Đ hoặc S:",
    "options": [
      {
        "key": "a",
        "text": "pH của dung dịch khoảng 2,87."
      },
      {
        "key": "b",
        "text": "Độ điện li α của CH₃COOH khoảng 1,34%."
      },
      {
        "key": "c",
        "text": "Thêm vài giọt dung dịch HCl thì cân bằng CH₃COOH ⇌ CH₃COO⁻ + H⁺ chuyển dịch theo chiều thuận."
      },
      {
        "key": "d",
        "text": "Pha loãng dung dịch 10 lần thì pH tăng đúng 1 đơn vị."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "[H⁺] = √(Ka·C) = √(1,8·10⁻⁶) ≈ 1,34·10⁻³ M, pH ≈ 2,87 và α = 1,34·10⁻³ / 0,1 ≈ 1,34%. c) S: thêm H⁺ làm cân bằng chuyển dịch theo chiều nghịch. d) S: sau khi pha loãng 10 lần, [H⁺] ≈ 4,24·10⁻⁴ M, pH ≈ 3,37, chỉ tăng khoảng 0,5 đơn vị.",
    "points": 1,
    "tags": [
      "cân bằng ion",
      "pH",
      "axit yếu",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa1011-19",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cho hai chất: ancol etylic (C₂H₅OH) và phenol (C₆H₅OH). Với mỗi phát biểu sau, chọn Đ hoặc S:",
    "options": [
      {
        "key": "a",
        "text": "Phenol tác dụng được với dung dịch NaOH, còn ancol etylic thì không."
      },
      {
        "key": "b",
        "text": "Phenol tác dụng với dung dịch Br₂ tạo kết tủa trắng 2,4,6-tribromophenol."
      },
      {
        "key": "c",
        "text": "Ancol etylic có tính axit mạnh hơn phenol."
      },
      {
        "key": "d",
        "text": "Đốt cháy hoàn toàn 0,1 mol phenol thu được 0,6 mol CO₂."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đ. b) Đ, đây là phản ứng đặc trưng nhận biết phenol. c) S: phenol có tính axit yếu còn ancol etylic gần như trung tính. d) Đ: C₆H₅OH có 6 nguyên tử C nên 0,1 mol cho 0,6 mol CO₂.",
    "points": 1,
    "tags": [
      "phenol",
      "ancol",
      "tính axit",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa1011-20",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét các phát biểu về aldehyde, ketone và carboxylic acid. Với mỗi phát biểu sau, chọn Đ hoặc S:",
    "options": [
      {
        "key": "a",
        "text": "Formaldehyde (HCHO) tham gia phản ứng tráng bạc."
      },
      {
        "key": "b",
        "text": "Cứ 1 mol HCHO tham gia phản ứng tráng bạc thu được 2 mol Ag."
      },
      {
        "key": "c",
        "text": "Nhiệt độ sôi của CH₃COOH thấp hơn nhiệt độ sôi của C₂H₅OH."
      },
      {
        "key": "d",
        "text": "Propanone (CH₃COCH₃) không có phản ứng tráng bạc."
      }
    ],
    "answer": "ĐSSĐ",
    "explanation": "a) Đ. b) S: HCHO → (NH₄)₂CO₃ + 4Ag, nên 1 mol HCHO tạo 4 mol Ag. c) S: CH₃COOH sôi ở khoảng 118 °C, cao hơn C₂H₅OH (khoảng 78 °C) do liên kết hydrogen bền hơn. d) Đ: xeton không bị oxi hoá bởi thuốc thử Tollens.",
    "points": 1,
    "tags": [
      "aldehyde",
      "ketone",
      "carboxylic acid",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa1011-21",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Hình bên dưới là công thức cấu tạo của hợp chất hữu cơ X. Với mỗi phát biểu sau, chọn Đ hoặc S:",
    "options": [
      {
        "key": "a",
        "text": "Tên thay thế của X là 2-methylbutane."
      },
      {
        "key": "b",
        "text": "Có ba đồng phân cấu tạo ứng với công thức phân tử của X."
      },
      {
        "key": "c",
        "text": "Khi thế một nguyên tử H của X bằng Cl (chiếu sáng, tỉ lệ 1 : 1), thu được tối đa 3 dẫn xuất monochloro."
      },
      {
        "key": "d",
        "text": "Trong phân tử X có một nguyên tử C bậc III."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "X là C₅H₁₂ (2-methylbutane). a) Đ. b) Đ: pentane, 2-methylbutane và 2,2-dimethylpropane. c) S: có 4 dẫn xuất monochloro (1-chloro-2-methylbutane, 2-chloro-2-methylbutane, 2-chloro-3-methylbutane, 1-chloro-3-methylbutane). d) Đ: C số 2 liên kết với 3 nguyên tử C.",
    "points": 1,
    "tags": [
      "hydrocarbon",
      "alkane",
      "đồng phân",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "struct",
      "formula": "CH3-CH(CH3)-CH2-CH3"
    }
  },
  {
    "id": "thpt-hoa1011-22",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét các phát biểu về nitrogen và hợp chất của nitrogen. Với mỗi phát biểu sau, chọn Đ hoặc S:",
    "options": [
      {
        "key": "a",
        "text": "NH₃ có tính bazơ yếu do nguyên tử N còn cặp electron tự do."
      },
      {
        "key": "b",
        "text": "Dung dịch NH₃ làm quỳ tím chuyển sang màu đỏ."
      },
      {
        "key": "c",
        "text": "Trong phân tử NH₃, nitrogen có số oxi hoá −3."
      },
      {
        "key": "d",
        "text": "Trong NH₄NO₃, hai nguyên tử nitrogen có số oxi hoá khác nhau."
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) Đ. b) S: dung dịch NH₃ làm quỳ tím chuyển xanh yếu. c) Đ: H có số oxi hoá +1 nên N là −3. d) Đ: N trong NH₄⁺ là −3, N trong NO₃⁻ là +5.",
    "points": 1,
    "tags": [
      "nitrogen",
      "ammonia",
      "số oxi hoá",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa1011-23",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hình bên dưới là công thức cấu tạo của ancol etylic. Đốt cháy hoàn toàn 4,6 g ancol này cần bao nhiêu lít khí O₂ ở đkc (1 mol khí chiếm 24,79 L)? (Làm tròn đến một chữ số thập phân.)",
    "answer": "7,4",
    "explanation": "n C₂H₅OH = 4,6 / 46 = 0,1 mol. C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O nên n O₂ = 0,3 mol, V = 0,3 · 24,79 = 7,437 ≈ 7,4 L.",
    "points": 0.5,
    "tags": [
      "alcohol",
      "phản ứng cháy",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "struct",
      "formula": "CH3-CH2-OH"
    }
  },
  {
    "id": "thpt-hoa1011-24",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hỗn hợp X gồm CH₃COOH và HCOOH có tổng khối lượng 7,5 g. Trung hoà hoàn toàn X cần vừa đủ 0,15 mol NaOH. Tính phần trăm khối lượng của CH₃COOH trong X (làm tròn đến số nguyên %).",
    "answer": "34",
    "explanation": "Gọi x, y lần lượt là số mol CH₃COOH và HCOOH: x + y = 0,15 và 60x + 46y = 7,5, suy ra x ≈ 0,0429 mol, m CH₃COOH ≈ 2,571 g, %CH₃COOH ≈ 34,3% ≈ 34%.",
    "points": 0.5,
    "tags": [
      "carboxylic acid",
      "hỗn hợp",
      "phản ứng trung hoà",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa1011-25",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hỗn hợp X gồm HCHO và CH₃CHO có tổng khối lượng 7,4 g, số mol hai chất bằng nhau. Cho X tác dụng hoàn toàn với lượng dư dung dịch AgNO₃ trong NH₃, đun nóng. Khối lượng Ag tạo thành là bao nhiêu gam? (Làm tròn đến một chữ số thập phân.)",
    "answer": "64,8",
    "explanation": "Đặt a là số mol mỗi chất: 30a + 44a = 7,4 nên a = 0,1 mol. HCHO tạo 4Ag, CH₃CHO tạo 2Ag, n Ag = 0,4 + 0,2 = 0,6 mol, m Ag = 0,6 · 108 = 64,8 g.",
    "points": 0.5,
    "tags": [
      "carbonyl",
      "phản ứng tráng bạc",
      "hỗn hợp",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa1011-26",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Sục 0,3 mol khí NO₂ vào nước dư, xảy ra phản ứng 3NO₂ + H₂O → 2HNO₃ + NO. Thể tích khí NO thu được ở đkc (1 mol khí chiếm 24,79 L) là bao nhiêu lít? (Làm tròn đến một chữ số thập phân.)",
    "answer": "2,5",
    "explanation": "Theo phương trình, 3 mol NO₂ cho 1 mol NO, nên 0,3 mol NO₂ cho 0,1 mol NO. V = 0,1 · 24,79 = 2,479 ≈ 2,5 L.",
    "points": 0.5,
    "tags": [
      "nitrogen",
      "oxide của nitrogen",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa1011-27",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Đốt cháy hoàn toàn 0,1 mol hỗn hợp X gồm C₂H₆ và C₃H₈ thu được 0,36 mol H₂O. Phần trăm số mol C₃H₈ trong X là bao nhiêu? (Làm tròn đến số nguyên %.)",
    "answer": "60",
    "explanation": "Gọi a, b lần lượt là số mol C₂H₆ và C₃H₈: a + b = 0,1 và 3a + 4b = 0,36, suy ra b = 0,06 và a = 0,04. %C₃H₈ = 0,06 / 0,1 = 60%.",
    "points": 0.5,
    "tags": [
      "hydrocarbon",
      "ankan",
      "phản ứng cháy",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa1011-28",
    "subject": "Hoá học",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho 0,2 mol H₂S tác dụng với 0,15 mol SO₂ theo phương trình 2H₂S + SO₂ → 3S↓ + 2H₂O. Biết hiệu suất phản ứng là 80% (tính theo chất hết). Khối lượng S thu được là bao nhiêu gam? (Làm tròn đến hai chữ số thập phân.)",
    "answer": "7,68",
    "explanation": "SO₂ dư nên H₂S hết trước. Theo lý thuyết, 0,2 mol H₂S cho 0,3 mol S. Với hiệu suất 80%: n S = 0,3 · 0,8 = 0,24 mol, m S = 0,24 · 32 = 7,68 g.",
    "points": 0.5,
    "tags": [
      "sulfur",
      "hiệu suất phản ứng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa12-01",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong các chất sau, chất nào là ester?",
    "options": [
      {
        "key": "A",
        "text": "CH$_3$COOCH$_3$"
      },
      {
        "key": "B",
        "text": "CH$_3$COOH"
      },
      {
        "key": "C",
        "text": "CH$_3$OCH$_3$"
      },
      {
        "key": "D",
        "text": "C$_2$H$_5$OH"
      }
    ],
    "answer": "A",
    "explanation": "Ester có nhóm –COO– liên kết trực tiếp với hai gốc hydrocarbon. CH$_3$COOCH$_3$ (methyl acetate) là ester. CH$_3$COOH là carboxylic acid, CH$_3$OCH$_3$ là ether, C$_2$H$_5$OH là alcohol.",
    "points": 0.25,
    "tags": [
      "Ester – lipid",
      "nhận biết ester",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa12-02",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Amine nào sau đây là amine bậc hai?",
    "options": [
      {
        "key": "A",
        "text": "CH$_3$NH$_2$"
      },
      {
        "key": "B",
        "text": "CH$_3$NHCH$_3$"
      },
      {
        "key": "C",
        "text": "(CH$_3$)$_3$N"
      },
      {
        "key": "D",
        "text": "C$_6$H$_5$NH$_2$"
      }
    ],
    "answer": "B",
    "explanation": "Bậc của amine là số gốc hydrocarbon liên kết với nguyên tử N. CH$_3$NHCH$_3$ có hai gốc CH$_3$ nên là amine bậc hai. CH$_3$NH$_2$ và C$_6$H$_5$NH$_2$ là amine bậc một; (CH$_3$)$_3$N là amine bậc ba.",
    "points": 0.25,
    "tags": [
      "Amine",
      "bậc của amine",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa12-03",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Polymer nào sau đây được điều chế bằng phản ứng trùng ngưng?",
    "options": [
      {
        "key": "A",
        "text": "Polyethylene"
      },
      {
        "key": "B",
        "text": "Poly(vinyl chloride)"
      },
      {
        "key": "C",
        "text": "Nylon-6,6"
      },
      {
        "key": "D",
        "text": "Polystyrene"
      }
    ],
    "answer": "C",
    "explanation": "Nylon-6,6 được tổng hợp từ hexamethylenediamine và adipic acid bằng phản ứng trùng ngưng, có giải phóng nước. Polyethylene, poly(vinyl chloride) và polystyrene được điều chế bằng phản ứng trùng hợp.",
    "points": 0.25,
    "tags": [
      "Polymer",
      "trùng ngưng",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa12-04",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Dãy gồm các kim loại đều phản ứng mạnh với nước ở nhiệt độ thường là",
    "options": [
      {
        "key": "A",
        "text": "Mg, Al, Fe"
      },
      {
        "key": "B",
        "text": "Cu, Ag, Au"
      },
      {
        "key": "C",
        "text": "Zn, Pb, Sn"
      },
      {
        "key": "D",
        "text": "Na, K, Ca"
      }
    ],
    "answer": "D",
    "explanation": "Na, K và Ca phản ứng với nước ở nhiệt độ thường giải phóng H$_2$. Mg chỉ phản ứng chậm với nước nóng; Al, Fe, Zn, Pb, Sn hầu như không phản ứng với nước ở nhiệt độ thường; Cu, Ag, Au không phản ứng.",
    "points": 0.25,
    "tags": [
      "Kim loại nhóm IA, IIA",
      "tính chất hoá học",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa12-05",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong pin điện hoá Zn–Cu (pin Daniell), điện cực âm (anode) là điện cực nào và xảy ra quá trình nào?",
    "options": [
      {
        "key": "A",
        "text": "Zn; bị oxi hoá: Zn → Zn$^{2+}$ + 2e"
      },
      {
        "key": "B",
        "text": "Cu; bị oxi hoá: Cu → Cu$^{2+}$ + 2e"
      },
      {
        "key": "C",
        "text": "Zn; bị khử: Zn$^{2+}$ + 2e → Zn"
      },
      {
        "key": "D",
        "text": "Cu; bị khử: Cu$^{2+}$ + 2e → Cu"
      }
    ],
    "answer": "A",
    "explanation": "Thế điện cực chuẩn của Zn (−0,76 V) âm hơn của Cu (+0,34 V) nên Zn là cực âm và bị oxi hoá. Cu là cực dương, tại đó ion Cu$^{2+}$ bị khử thành Cu.",
    "points": 0.25,
    "tags": [
      "Pin điện – điện phân",
      "pin điện hoá",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa12-06",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Điện phân dung dịch CuSO$_4$ với điện cực trơ. Ở catode xảy ra quá trình nào?",
    "options": [
      {
        "key": "A",
        "text": "2H$_2$O → 4H$^+$ + O$_2$ + 4e"
      },
      {
        "key": "B",
        "text": "Cu$^{2+}$ + 2e → Cu"
      },
      {
        "key": "C",
        "text": "2Cl$^-$ → Cl$_2$ + 2e"
      },
      {
        "key": "D",
        "text": "2H$_2$O + 2e → H$_2$ + 2OH$^-$"
      }
    ],
    "answer": "B",
    "explanation": "Ở catode xảy ra quá trình khử. Ion Cu$^{2+}$ có tính oxi hoá mạnh hơn H$_2$O nên bị khử trước: Cu$^{2+}$ + 2e → Cu. Phương án A xảy ra ở anode; phương án C không đúng vì dung dịch không chứa Cl$^-$.",
    "points": 0.25,
    "tags": [
      "Điện phân",
      "catode",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa12-07",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong phức chất [Cu(NH$_3$)$_4$]$^{2+}$, ion trung tâm và số phối trí của nó lần lượt là",
    "options": [
      {
        "key": "A",
        "text": "Cu$^{2+}$; 2"
      },
      {
        "key": "B",
        "text": "NH$_3$; 4"
      },
      {
        "key": "C",
        "text": "Cu$^{2+}$; 4"
      },
      {
        "key": "D",
        "text": "Cu; 4"
      }
    ],
    "answer": "C",
    "explanation": "Ion trung tâm là Cu$^{2+}$. Mỗi phân tử NH$_3$ là một phối tử cho một cặp electron tự do; có 4 phối tử nên số phối trí bằng 4.",
    "points": 0.25,
    "tags": [
      "Phức chất",
      "số phối trí",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa12-08",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Thuỷ phân hoàn toàn 48,6 gam tinh bột thành glucose với hiệu suất 80%. Cho toàn bộ lượng glucose thu được tác dụng với lượng dư dung dịch AgNO$_3$/NH$_3$, đun nóng. Khối lượng Ag thu được là",
    "options": [
      {
        "key": "A",
        "text": "25,92 gam"
      },
      {
        "key": "B",
        "text": "38,88 gam"
      },
      {
        "key": "C",
        "text": "64,80 gam"
      },
      {
        "key": "D",
        "text": "51,84 gam"
      }
    ],
    "answer": "D",
    "explanation": "(C$_6$H$_{10}$O$_5$)$_n$ có M = 162, nên n tinh bột = 48,6 : 162 = 0,3 mol. Lượng glucose thu được là 0,3 × 0,8 = 0,24 mol. Mỗi glucose tạo 2Ag, suy ra n Ag = 0,48 mol và m Ag = 0,48 × 108 = 51,84 gam.",
    "points": 0.25,
    "tags": [
      "Carbohydrate",
      "tinh bột",
      "tráng bạc",
      "hiệu suất",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa12-09",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Sục từ từ khí CO$_2$ vào dung dịch chứa 0,2 mol Ca(OH)$_2$. Đồ thị dưới đây biểu diễn số mol kết tủa theo số mol CO$_2$ đã dùng, như hình bên dưới. Khi số mol CO$_2$ là 0,3 mol, khối lượng kết tủa thu được là",
    "options": [
      {
        "key": "A",
        "text": "10 gam"
      },
      {
        "key": "B",
        "text": "5 gam"
      },
      {
        "key": "C",
        "text": "15 gam"
      },
      {
        "key": "D",
        "text": "20 gam"
      }
    ],
    "answer": "A",
    "explanation": "Đến 0,2 mol CO$_2$, Ca(OH)$_2$ tạo 0,2 mol CaCO$_3$. CO$_2$ dư 0,1 mol hoà tan 0,1 mol CaCO$_3$ theo CaCO$_3$ + CO$_2$ + H$_2$O → Ca(HCO$_3$)$_2$. Kết tủa còn lại 0,1 mol, tương ứng 10 gam.",
    "points": 0.25,
    "tags": [
      "Kim loại kiềm thổ",
      "CO$_2$ tác dụng kiềm",
      "đồ thị",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "chemgraph",
      "xName": "n CO2",
      "yName": "n↓",
      "points": "(0; 0) (0,2; 0,2) (0,4; 0)"
    }
  },
  {
    "id": "thpt-hoa12-10",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hợp chất hữu cơ có cấu tạo như hình bên dưới. Oxi hoá hợp chất này bằng CuO đun nóng (vừa đủ), sản phẩm hữu cơ chính thu được là",
    "options": [
      {
        "key": "A",
        "text": "(CH$_3$)$_2$CH–COOH"
      },
      {
        "key": "B",
        "text": "(CH$_3$)$_2$CH–CHO"
      },
      {
        "key": "C",
        "text": "(CH$_3$)$_2$C=O"
      },
      {
        "key": "D",
        "text": "CH$_3$CH$_2$CH$_2$CHO"
      }
    ],
    "answer": "B",
    "explanation": "Hợp chất là 2-methylpropan-1-ol, một alcohol bậc một. Alcohol bậc một bị CuO oxi hoá thành aldehyde: (CH$_3$)$_2$CH–CH$_2$OH → (CH$_3$)$_2$CH–CHO (2-methylpropanal). Phương án C là ketone chỉ tạo từ alcohol bậc hai; phương án A là acid do oxi hoá quá mức.",
    "points": 0.25,
    "tags": [
      "Alcohol",
      "oxi hoá alcohol bậc một",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "struct",
      "formula": "CH3-CH(CH3)-CH2-OH"
    }
  },
  {
    "id": "thpt-hoa12-11",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Đun nóng 17,6 gam ester X (CH$_3$COOC$_2$H$_5$) với 150 ml dung dịch NaOH 1M. Sau khi phản ứng xảy ra hoàn toàn, cô cạn dung dịch thu được m gam muối khan. Giá trị của m là",
    "options": [
      {
        "key": "A",
        "text": "16,4 gam"
      },
      {
        "key": "B",
        "text": "9,2 gam"
      },
      {
        "key": "C",
        "text": "12,3 gam"
      },
      {
        "key": "D",
        "text": "17,6 gam"
      }
    ],
    "answer": "C",
    "explanation": "n X = 17,6 : 88 = 0,2 mol; n NaOH = 0,15 mol, nên NaOH hết trước. CH$_3$COOC$_2$H$_5$ + NaOH → CH$_3$COONa + C$_2$H$_5$OH. Muối thu được là 0,15 mol CH$_3$COONa, m = 0,15 × 82 = 12,3 gam.",
    "points": 0.25,
    "tags": [
      "Ester",
      "xà phòng hoá",
      "chất dư",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa12-12",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Nhỏ từ từ dung dịch NaOH vào 200 ml dung dịch AlCl$_3$ 0,5M. Đồ thị dưới đây biểu diễn số mol kết tủa Al(OH)$_3$ theo số mol OH$^-$ đã dùng, như hình bên dưới. Số mol OH$^-$ cần dùng để thu được 3,9 gam kết tủa là",
    "options": [
      {
        "key": "A",
        "text": "0,15 mol"
      },
      {
        "key": "B",
        "text": "0,35 mol"
      },
      {
        "key": "C",
        "text": "0,45 mol"
      },
      {
        "key": "D",
        "text": "0,15 mol hoặc 0,35 mol"
      }
    ],
    "answer": "D",
    "explanation": "n Al$^{3+}$ = 0,2 × 0,5 = 0,1 mol. Kết tủa 3,9 gam tương ứng 0,05 mol Al(OH)$_3$. Trường hợp kết tủa chưa bị hoà tan: n OH$^-$ = 3 × 0,05 = 0,15 mol. Trường hợp đã hoà tan một phần: 0,3 mol OH$^-$ tạo 0,1 mol kết tủa, cần thêm 0,05 mol OH$^-$ để hoà tan 0,05 mol Al(OH)$_3$, tổng 0,35 mol.",
    "points": 0.25,
    "tags": [
      "Nhôm và hợp chất",
      "đồ thị",
      "hai nghiệm",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "chemgraph",
      "xName": "n OH-",
      "yName": "n↓",
      "points": "(0; 0) (0,3; 0,1) (0,4; 0)"
    }
  },
  {
    "id": "thpt-hoa12-13",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Triolein có công thức (C$_{17}$H$_{33}$COO)$_3$C$_3$H$_5$. Xét các phát biểu sau về triolein:",
    "options": [
      {
        "key": "a",
        "text": "Triolein là triester của glycerol với oleic acid."
      },
      {
        "key": "b",
        "text": "Thuỷ phân triolein trong môi trường acid thu được glycerol và muối sodium oleate."
      },
      {
        "key": "c",
        "text": "Triolein phản ứng với H$_2$ dư (xúc tác Ni, đun nóng) tạo thành tristearin."
      },
      {
        "key": "d",
        "text": "Phân tử khối của triolein là 882."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a Đúng: triolein là ester của glycerol với ba oleic acid. b Sai: thuỷ phân trong môi trường acid thu được oleic acid tự do, không phải muối sodium oleate. c Đúng: ba liên kết đôi C=C được cộng H$_2$ thành liên kết đơn, tạo tristearin. d Sai: triolein C$_{57}$H$_{104}$O$_6$ có M = 884.",
    "points": 1,
    "tags": [
      "Ester – lipid",
      "chất béo",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa12-14",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Thí nghiệm: cho 0,1 mol mỗi kim loại Mg, Al, Zn, Fe lần lượt tác dụng hết với dung dịch HCl dư; thể tích khí H$_2$ (đktc) thu được như hình bên dưới. Xét các phát biểu sau:",
    "options": [
      {
        "key": "a",
        "text": "Mg và Zn cùng thu được 2,24 lít khí H$_2$."
      },
      {
        "key": "b",
        "text": "Al cho thể tích khí H$_2$ lớn nhất trong bốn kim loại."
      },
      {
        "key": "c",
        "text": "Hoà tan 0,1 mol Al trong dung dịch HCl dư thu được 2,24 lít khí H$_2$."
      },
      {
        "key": "d",
        "text": "Khi hoà tan đồng thời 0,1 mol Mg và 0,1 mol Fe trong HCl dư, thể tích H$_2$ thu được là 3,36 lít."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a Đúng: Mg + 2HCl → MgCl$_2$ + H$_2$ và Zn tương tự, mỗi kim loại 0,1 mol cho 0,1 mol H$_2$ = 2,24 lít. b Đúng: Al cho 0,15 mol H$_2$ = 3,36 lít, lớn nhất. c Sai: 0,1 mol Al cho 0,15 mol H$_2$ (3,36 lít). d Sai: 0,1 mol Mg và 0,1 mol Fe cho tổng 0,2 mol H$_2$ = 4,48 lít.",
    "points": 1,
    "tags": [
      "Kim loại nhóm IIA, IIIA",
      "tính khử",
      "bài toán khí H$_2$",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "bar",
      "title": "Thể tích H2 (đktc) thu được",
      "xLabel": "Kim loại",
      "yLabel": "V (lít)",
      "data": "Mg; Al; Zn; Fe\nThể tích H2 (L): 2,24; 3,36; 2,24; 2,24"
    }
  },
  {
    "id": "thpt-hoa12-15",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Glycine (H$_2$N–CH$_2$–COOH) là amino acid đơn giản nhất. Xét các phát biểu sau về glycine:",
    "options": [
      {
        "key": "a",
        "text": "Glycine là α-amino acid."
      },
      {
        "key": "b",
        "text": "Dung dịch glycine không làm đổi màu quỳ tím."
      },
      {
        "key": "c",
        "text": "0,1 mol glycine tác dụng vừa đủ với 0,2 mol NaOH."
      },
      {
        "key": "d",
        "text": "Đốt cháy hoàn toàn 7,5 gam glycine thu được 0,3 mol CO$_2$."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a Đúng. b Đúng: glycine có một nhóm –NH$_2$ và một nhóm –COOH nên dung dịch gần như trung tính. c Sai: glycine tác dụng với NaOH theo tỉ lệ 1 : 1, 0,1 mol glycine chỉ cần 0,1 mol NaOH. d Sai: M = 75, 7,5 gam tương ứng 0,1 mol; 0,1 mol glycine có 2 nguyên tử C nên tạo 0,2 mol CO$_2$.",
    "points": 1,
    "tags": [
      "Amino acid",
      "tính chất",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa12-16",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Điện phân 200 ml dung dịch X gồm CuSO$_4$ 0,1M và NaCl 0,5M với điện cực trơ, có màng ngăn, cường độ dòng điện không đổi 1,93 A. Coi hiệu suất 100%, bỏ qua sự hoà tan khí và bay hơi nước; F = 96500. Xét các phát biểu sau:",
    "options": [
      {
        "key": "a",
        "text": "Sau 1000 giây, khối lượng Cu bám vào catode là 1,28 gam."
      },
      {
        "key": "b",
        "text": "Sau 1000 giây, thể tích khí Cl$_2$ thoát ra ở anode (đktc) là 0,224 lít."
      },
      {
        "key": "c",
        "text": "Sau 1000 giây, ở catode xảy ra quá trình khử ion Na$^+$."
      },
      {
        "key": "d",
        "text": "Sau 2000 giây, thể tích khí thoát ra ở anode (đktc) là 0,448 lít."
      }
    ],
    "answer": "SĐSĐ",
    "explanation": "Số mol electron: n e = 1,93 × 1000 / 96500 = 0,02 mol. a Sai: Cu$^{2+}$ bị khử trước, 0,02 mol e chỉ khử 0,01 mol Cu = 0,64 gam. b Đúng: 2Cl$^-$ → Cl$_2$ + 2e, 0,02 mol e cho 0,01 mol Cl$_2$ = 0,224 lít. c Sai: Na$^+$ không bị khử trong dung dịch nước. d Đúng: sau 2000 giây có 0,04 mol e, Cu$^{2+}$ (0,02 mol) đã bị khử hết; anode cho 0,02 mol Cl$_2$ = 0,448 lít (Cl$^-$ còn dư nên chưa có O$_2$).",
    "points": 1,
    "tags": [
      "Điện phân",
      "CuSO$_4$ và NaCl",
      "định luật Faraday",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa12-17",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho các phát biểu sau về kim loại nhóm IA, IIA và hợp chất của chúng:",
    "options": [
      {
        "key": "a",
        "text": "Kim loại kiềm thổ có tính khử mạnh hơn kim loại kiềm cùng chu kì."
      },
      {
        "key": "b",
        "text": "Nhôm bền trong không khí do có lớp màng Al$_2$O$_3$ bảo vệ bề mặt."
      },
      {
        "key": "c",
        "text": "Ca(OH)$_2$ ít tan trong nước."
      },
      {
        "key": "d",
        "text": "Dung dịch Na$_2$CO$_3$ có môi trường trung tính."
      }
    ],
    "answer": "SĐĐS",
    "explanation": "a Sai: trong cùng chu kì, kim loại nhóm IA có tính khử mạnh hơn nhóm IIA (Na mạnh hơn Mg). b Đúng: lớp Al$_2$O$_3$ bền, bảo vệ nhôm khỏi bị oxi hoá tiếp. c Đúng: Ca(OH)$_2$ là chất ít tan. d Sai: ion CO$_3^{2-}$ thuỷ phân tạo OH$^-$ nên dung dịch có môi trường kiềm (pH > 7).",
    "points": 1,
    "tags": [
      "Nhóm IA, IIA",
      "nhôm",
      "tính chất",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa12-18",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hợp chất hữu cơ X có cấu tạo như hình bên dưới. Xét các phát biểu sau:",
    "options": [
      {
        "key": "a",
        "text": "X là alanine."
      },
      {
        "key": "b",
        "text": "Dung dịch X làm quỳ tím chuyển sang màu đỏ."
      },
      {
        "key": "c",
        "text": "X có thể trùng ngưng tạo polymer có cấu trúc (–NH–CH(CH$_3$)–CO–)$_n$."
      },
      {
        "key": "d",
        "text": "Khi ngưng tụ hoàn toàn 17,8 gam X, thu được tối đa 0,2 mol dipeptide."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a Đúng: H$_2$N–CH(CH$_3$)–COOH là alanine. b Sai: X có một nhóm –NH$_2$ và một nhóm –COOH nên trung tính, không đổi màu quỳ. c Đúng: trùng ngưng alanine tạo poly(alanine). d Sai: M = 89, 17,8 gam ứng với 0,2 mol X; hai phân tử X tạo một dipeptide, nên tối đa 0,1 mol dipeptide.",
    "points": 1,
    "tags": [
      "Amino acid",
      "peptide",
      "polymer",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "struct",
      "formula": "H2N-CH(CH3)-COOH"
    }
  },
  {
    "id": "thpt-hoa12-19",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Xét các phát biểu sau về polymer:",
    "options": [
      {
        "key": "a",
        "text": "PVC được điều chế bằng phản ứng trùng hợp vinyl chloride."
      },
      {
        "key": "b",
        "text": "Nylon-6,6 được điều chế bằng phản ứng trùng hợp hexamethylenediamine với adipic acid."
      },
      {
        "key": "c",
        "text": "Cao su buna-S có chứa liên kết đôi C=C trong mạch polymer."
      },
      {
        "key": "d",
        "text": "Polymer PVC có phân tử khối 625 000 thì hệ số trùng hợp n = 10 000."
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a Đúng: CH$_2$=CHCl trùng hợp thành PVC. b Sai: nylon-6,6 được điều chế bằng phản ứng trùng ngưng, có tách nước. c Đúng: buna-S được tạo từ buta-1,3-diene và styrene, mạch còn chứa liên kết đôi. d Đúng: mắt xích C$_2$H$_3$Cl có M = 62,5, n = 625 000 : 62,5 = 10 000.",
    "points": 1,
    "tags": [
      "Polymer",
      "trùng hợp – trùng ngưng",
      "hệ số trùng hợp",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa12-20",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho nguyên tử sắt (Fe, Z = 26) như hình bên dưới. Xét các phát biểu sau:",
    "options": [
      {
        "key": "a",
        "text": "Fe thuộc chu kì 4, nhóm VIIIB trong bảng tuần hoàn."
      },
      {
        "key": "b",
        "text": "Ion Fe$^{2+}$ có cấu hình electron [Ar]3d$^6$."
      },
      {
        "key": "c",
        "text": "Ion Fe$^{3+}$ có 6 electron ở phân lớp 3d."
      },
      {
        "key": "d",
        "text": "Hoà tan hoàn toàn 11,2 gam Fe trong dung dịch H$_2$SO$_4$ loãng dư, thu được dung dịch X; để oxi hoá hết Fe$^{2+}$ trong X cần vừa đủ 0,04 mol KMnO$_4$ trong môi trường H$_2$SO$_4$."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a Đúng: cấu hình [Ar]3d$^6$4s$^2$ cho biết Fe ở chu kì 4, nhóm VIIIB. b Đúng: khi mất 2 electron 4s, Fe$^{2+}$ có [Ar]3d$^6$. c Sai: Fe$^{3+}$ là [Ar]3d$^5$, có 5 electron 3d. d Đúng: 0,2 mol Fe$^{2+}$ nhường 0,2 mol e; MnO$_4^-$ nhận 5e, cần 0,04 mol KMnO$_4$.",
    "points": 1,
    "tags": [
      "Cấu hình electron",
      "Fe",
      "chuẩn độ KMnO$_4$",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "electron",
      "element": "Fe"
    }
  },
  {
    "id": "thpt-hoa12-21",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính phân tử khối của saccharose (C$_{12}$H$_{22}$O$_{11}$). Biết nguyên tử khối: H = 1; C = 12; O = 16.",
    "answer": "342",
    "explanation": "M = 12 × 12 + 22 × 1 + 11 × 16 = 144 + 22 + 176 = 342.",
    "points": 0.5,
    "tags": [
      "Carbohydrate",
      "phân tử khối",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa12-22",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Số amine bậc một có công thức phân tử C$_3$H$_9$N là bao nhiêu?",
    "answer": "2",
    "explanation": "Các amine bậc một C$_3$H$_9$N là CH$_3$CH$_2$CH$_2$NH$_2$ và (CH$_3$)$_2$CHNH$_2$. Đáp số là 2.",
    "points": 0.5,
    "tags": [
      "Amine",
      "đồng phân",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa12-23",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Đun nóng 8,8 gam hợp chất hữu cơ có cấu tạo như hình bên dưới với 150 ml dung dịch NaOH 1M (dư). Sau khi phản ứng hoàn toàn, khối lượng muối thu được là bao nhiêu gam? Đáp số làm tròn đến chữ số thập phân thứ nhất.",
    "answer": "8,2",
    "explanation": "M = 88 nên n = 8,8 : 88 = 0,1 mol. Thuỷ phân tạo 0,1 mol CH$_3$COONa (M = 82), m = 8,2 gam. NaOH dư nên không ảnh hưởng đến khối lượng muối.",
    "points": 0.5,
    "tags": [
      "Ester",
      "xà phòng hoá",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "struct",
      "formula": "CH3-COO-CH2-CH3"
    }
  },
  {
    "id": "thpt-hoa12-24",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Xà phòng hoá hoàn toàn 44,5 gam tristearin (C$_{17}$H$_{35}$COO)$_3$C$_3$H$_5$ bằng dung dịch NaOH vừa đủ, hiệu suất phản ứng 90%. Khối lượng muối sodium stearate thu được là bao nhiêu gam? Đáp số làm tròn đến chữ số thập phân thứ nhất.",
    "answer": "41,3",
    "explanation": "M tristearin = 890, n = 44,5 : 890 = 0,05 mol. Thu được 0,15 mol C$_{17}$H$_{35}$COONa (M = 306), tương ứng 45,9 gam. Với hiệu suất 90%: m = 45,9 × 0,9 = 41,31 ≈ 41,3 gam.",
    "points": 0.5,
    "tags": [
      "Chất béo",
      "xà phòng hoá",
      "hiệu suất",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa12-25",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Điện phân nóng chảy Al$_2$O$_3$ với cường độ dòng điện không đổi 9,65 A trong 2000 giây, hiệu suất 80%. Khối lượng nhôm thu được là bao nhiêu gam? Biết F = 96500; làm tròn đến hai chữ số thập phân.",
    "answer": "1,44",
    "explanation": "n e = 9,65 × 2000 / 96500 = 0,2 mol. Al$^{3+}$ + 3e → Al nên n Al lí thuyết = 0,2 / 3 mol. Với hiệu suất 80%: m = 0,2/3 × 0,8 × 27 = 1,44 gam.",
    "points": 0.5,
    "tags": [
      "Điện phân",
      "nhôm",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa12-26",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hoà tan hoàn toàn 7,8 gam hỗn hợp gồm Mg và Al vào dung dịch HCl dư, thu được 8,96 lít khí H$_2$ (đktc). Phần trăm khối lượng của Mg trong hỗn hợp là bao nhiêu %? Đáp số làm tròn đến chữ số thập phân thứ nhất.",
    "answer": "30,8",
    "explanation": "Gọi n Mg = x, n Al = y. Ta có 24x + 27y = 7,8 và x + 1,5y = 0,4 (n H$_2$ = 8,96 : 22,4 = 0,4). Giải ra x = 0,1 và y = 0,2. %Mg = 2,4 / 7,8 × 100 ≈ 30,8%.",
    "points": 0.5,
    "tags": [
      "Kim loại",
      "hỗn hợp",
      "bảo toàn electron",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa12-27",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Đốt cháy hoàn toàn 5,9 gam một amine X đơn chức, mạch hở, no (không xét bậc), thu được CO$_2$, H$_2$O và N$_2$. Khối lượng H$_2$O thu được là bao nhiêu gam?",
    "answer": "8,1",
    "explanation": "Amine no đơn chức có công thức C$_n$H$_{2n+3}$N, M = 14n + 17 = 59 nên n = 3, X là C$_3$H$_9$N; n X = 0,1 mol. Đốt cháy: C$_3$H$_9$N + O$_2$ → 3CO$_2$ + 4,5H$_2$O + 0,5N$_2$, nên n H$_2$O = 0,45 mol, m = 8,1 gam.",
    "points": 0.5,
    "tags": [
      "Amine",
      "đốt cháy",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa12-28",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho nguyên tử đồng (Cu) như hình bên dưới. Hoà tan hoàn toàn 6,4 gam Cu bằng dung dịch HNO$_3$ đặc, nóng, dư, chỉ thu được khí NO$_2$ duy nhất. Thể tích NO$_2$ (đktc) thu được là bao nhiêu lít?",
    "answer": "4,48",
    "explanation": "n Cu = 6,4 : 64 = 0,1 mol; Cu → Cu$^{2+}$ + 2e nên nhường 0,2 mol e. N$^{+5}$ + 1e → N$^{+4}$, do đó n NO$_2$ = 0,2 mol và V = 0,2 × 22,4 = 4,48 lít.",
    "points": 0.5,
    "tags": [
      "Kim loại tác dụng HNO$_3$",
      "bảo toàn electron",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "electron",
      "element": "Cu"
    }
  },
  {
    "id": "thpt-hoa12-29",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Lên men m gam glucose thành ethanol với hiệu suất 80%. Toàn bộ khí CO$_2$ sinh ra được hấp thụ hết vào dung dịch Ca(OH)$_2$ dư, thu được 40 gam kết tủa. Giá trị của m là bao nhiêu gam?",
    "answer": "45",
    "explanation": "n CaCO$_3$ = 0,4 mol nên n CO$_2$ = 0,4 mol. C$_6$H$_{12}$O$_6$ → 2CO$_2$ nên glucose phản ứng là 0,2 mol; với H = 80%, glucose ban đầu là 0,25 mol, m = 0,25 × 180 = 45 gam.",
    "points": 0.5,
    "tags": [
      "Carbohydrate",
      "lên men",
      "hiệu suất",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-hoa12-30",
    "subject": "Hoá học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Xét pin điện hoá Zn–Ag ở điều kiện chuẩn, thế điện cực chuẩn của các cặp oxi hoá – khử cho như hình bên dưới. Khi khối lượng cực Zn giảm 6,5 gam (hiệu suất 100%), khối lượng Ag bám lên cực dương là bao nhiêu gam?",
    "answer": "21,6",
    "explanation": "n Zn = 6,5 : 65 = 0,1 mol, nhường 0,2 mol e. Ag$^+$ + e → Ag nên n Ag = 0,2 mol, m = 0,2 × 108 = 21,6 gam. (Suất điện động chuẩn của pin là 0,80 − (−0,76) = 1,56 V, không cần cho bài toán này.)",
    "points": 0.5,
    "tags": [
      "Pin điện",
      "thế điện cực chuẩn",
      "bảo toàn electron",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "bar",
      "title": "Thế điện cực chuẩn E° (V)",
      "xLabel": "Cặp oxi hoá – khử",
      "yLabel": "E° (V)",
      "data": "Zn; Fe; Cu; Ag\nE° (V): -0,76; -0,44; 0,34; 0,80"
    }
  },
  {
    "id": "thpt-khonggian-01",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình vuông cạnh $a$, cạnh bên $SA$ vuông góc với mặt phẳng $(ABCD)$ và $SA=a\\sqrt{2}$ (như hình bên dưới). Góc giữa đường thẳng $SC$ và mặt phẳng $(ABCD)$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$45^\\circ$"
      },
      {
        "key": "B",
        "text": "$30^\\circ$"
      },
      {
        "key": "C",
        "text": "$60^\\circ$"
      },
      {
        "key": "D",
        "text": "$90^\\circ$"
      }
    ],
    "answer": "A",
    "explanation": "Vì $SA\\perp(ABCD)$ nên $AC$ là hình chiếu của $SC$ lên $(ABCD)$, góc cần tìm là $\\widehat{SCA}$. Ta có $AC=a\\sqrt2$ và $\\tan\\widehat{SCA}=\\dfrac{SA}{AC}=\\dfrac{a\\sqrt2}{a\\sqrt2}=1$, suy ra $\\widehat{SCA}=45^\\circ$.",
    "points": 0.25,
    "tags": [
      "quan hệ vuông góc",
      "góc giữa đường thẳng và mặt phẳng",
      "hình chóp",
      "NB"
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
        "D",
        "O"
      ],
      "height": false,
      "diagonals": false
    }
  },
  {
    "id": "thpt-khonggian-02",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho hình lập phương $ABCD.A'B'C'D'$ có cạnh bằng $3$ cm (như hình bên dưới). Độ dài đoạn thẳng $AC'$ bằng bao nhiêu centimét? Kết quả làm tròn đến hàng phần mười.",
    "answer": "5,2",
    "explanation": "$AC'^2=AB^2+AD^2+AA'^2=27$ nên $AC'=3\\sqrt3\\approx 5{,}196$, làm tròn được $5{,}2$.",
    "points": 0.5,
    "tags": [
      "quan hệ vuông góc",
      "đường chéo hình lập phương",
      "NB"
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
      "diagonals": false
    }
  },
  {
    "id": "thpt-khonggian-03",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cho hình lăng trụ đứng $ABC.A'B'C'$ có đáy $ABC$ là tam giác vuông tại $A$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "$AA'\\perp AB$"
      },
      {
        "key": "b",
        "text": "$(ABC)\\perp(ABB'A')$"
      },
      {
        "key": "c",
        "text": "$AC'\\perp BC$"
      },
      {
        "key": "d",
        "text": "$A'B'\\perp(ACC'A')$"
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng, vì lăng trụ đứng có $AA'\\perp(ABC)$ nên $AA'\\perp AB$. b) Đúng, vì $(ABB'A')$ chứa $AA'\\perp(ABC)$ nên hai mặt phẳng vuông góc. c) Sai: $\\overrightarrow{AC'}\\cdot\\overrightarrow{BC}=AC^2\\neq 0$ (ví dụ $AB=AC=AA'=1$ cho tích bằng $1$). d) Đúng, vì $A'B'\\perp A'C'$ và $A'B'\\perp AA'$ nên $A'B'\\perp(ACC'A')$.",
    "points": 1,
    "tags": [
      "quan hệ vuông góc",
      "lăng trụ đứng",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-khonggian-04",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hình chóp $S.ABC$ có $SA\\perp(ABC)$, tam giác $ABC$ vuông tại $B$ với $AB=3$, $BC=4$ và $SA=6$ (như hình bên dưới). Khoảng cách từ điểm $A$ đến mặt phẳng $(SBC)$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{3\\sqrt5}{5}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{6\\sqrt2}{5}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{12\\sqrt5}{5}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{6\\sqrt5}{5}$"
      }
    ],
    "answer": "D",
    "explanation": "Ta có $BC\\perp AB$ và $BC\\perp SA$ nên $BC\\perp(SAB)$, suy ra $(SBC)\\perp(SAB)$ theo giao tuyến $SB$. Kẻ $AH\\perp SB$ thì $AH\\perp(SBC)$. Trong tam giác vuông $SAB$ có $SB=\\sqrt{SA^2+AB^2}=3\\sqrt5$, nên $AH=\\dfrac{SA\\cdot AB}{SB}=\\dfrac{18}{3\\sqrt5}=\\dfrac{6\\sqrt5}{5}$.",
    "points": 0.25,
    "tags": [
      "khoảng cách",
      "từ điểm đến mặt phẳng",
      "hình chóp",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "pyramid3-sa",
      "names": [
        "S",
        "A",
        "B",
        "C"
      ],
      "height": false,
      "diagonals": false
    }
  },
  {
    "id": "thpt-khonggian-05",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho hình chóp $S.ABC$ có đáy $ABC$ là tam giác đều cạnh $6$ cm, cạnh bên $SA$ vuông góc với mặt phẳng $(ABC)$ và $SA=4$ cm. Thể tích khối chóp $S.ABC$ bằng bao nhiêu centimét khối? Kết quả làm tròn đến hàng phần mười.",
    "answer": "20,8",
    "explanation": "$S_{ABC}=\\dfrac{6^2\\sqrt3}{4}=9\\sqrt3$. Thể tích $V=\\dfrac13\\cdot 9\\sqrt3\\cdot 4=12\\sqrt3\\approx 20{,}78$, làm tròn được $20{,}8$.",
    "points": 0.5,
    "tags": [
      "thể tích",
      "khối chóp",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-khonggian-06",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một bể nước có dạng hình lăng trụ đứng, đáy là tam giác vuông với hai cạnh góc vuông bằng $3$ m và $4$ m, chiều cao của bể bằng $2{,}5$ m. Thể tích tối đa mà bể có thể chứa được là",
    "options": [
      {
        "key": "A",
        "text": "$15\\ \\text{m}^3$"
      },
      {
        "key": "B",
        "text": "$30\\ \\text{m}^3$"
      },
      {
        "key": "C",
        "text": "$7{,}5\\ \\text{m}^3$"
      },
      {
        "key": "D",
        "text": "$12\\ \\text{m}^3$"
      }
    ],
    "answer": "A",
    "explanation": "Diện tích đáy $S=\\dfrac12\\cdot3\\cdot4=6\\ \\text{m}^2$, thể tích $V=S\\cdot h=6\\cdot 2{,}5=15\\ \\text{m}^3$.",
    "points": 0.25,
    "tags": [
      "thể tích",
      "lăng trụ",
      "bài thực tế",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-khonggian-07",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình vuông cạnh $a$, cạnh bên $SA$ vuông góc với mặt phẳng $(ABCD)$ và $SA=a\\sqrt2$. Gọi $\\varphi$ là số đo góc nhị diện $[S,BC,A]$. Khẳng định nào đúng?",
    "options": [
      {
        "key": "A",
        "text": "$\\tan\\varphi=\\dfrac{\\sqrt2}{2}$"
      },
      {
        "key": "B",
        "text": "$\\varphi=45^\\circ$"
      },
      {
        "key": "C",
        "text": "$\\varphi=60^\\circ$"
      },
      {
        "key": "D",
        "text": "$\\tan\\varphi=\\sqrt2$"
      }
    ],
    "answer": "D",
    "explanation": "Ta có $BC\\perp AB$ và $BC\\perp SA$ nên $BC\\perp(SAB)$, do đó $BC\\perp SB$. Góc nhị diện $[S,BC,A]$ có số đo bằng $\\widehat{SBA}$. Trong tam giác vuông $SAB$: $\\tan\\widehat{SBA}=\\dfrac{SA}{AB}=\\dfrac{a\\sqrt2}{a}=\\sqrt2$.",
    "points": 0.25,
    "tags": [
      "góc nhị diện",
      "hình chóp",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-khonggian-08",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cho hình hộp chữ nhật $ABCD.A'B'C'D'$ có $AB=2$, $AD=2$, $AA'=4$ (như hình bên dưới). Gọi $M$ là trung điểm của $CC'$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "$AC'=2\\sqrt6$"
      },
      {
        "key": "b",
        "text": "Góc giữa $AM$ và $(ABCD)$ bằng $45^\\circ$"
      },
      {
        "key": "c",
        "text": "Khoảng cách từ $A$ đến mặt phẳng $(A'BD)$ bằng $\\dfrac43$"
      },
      {
        "key": "d",
        "text": "Thể tích khối tứ diện $AA'BD$ bằng $\\dfrac83$"
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "Chọn hệ tọa độ $A(0;0;0)$, $B(2;0;0)$, $D(0;2;0)$, $A'(0;0;4)$, $C'(2;2;4)$, $M(2;2;2)$. a) Đúng: $AC'=\\sqrt{4+4+16}=2\\sqrt6$. b) Sai: $\\overrightarrow{AM}=(2;2;2)$, hình chiếu có độ dài $2\\sqrt2$ nên $\\tan\\alpha=\\dfrac{2}{2\\sqrt2}=\\dfrac{\\sqrt2}{2}$, không phải $45^\\circ$. c) Đúng: $(A'BD)$ có phương trình $2x+2y+z-4=0$, khoảng cách từ $A$ là $\\dfrac{4}{3}$. d) Đúng: $V=\\dfrac16\\left|\\overrightarrow{AA'}\\cdot(\\overrightarrow{AB}\\times\\overrightarrow{AD})\\right|=\\dfrac16\\cdot 16=\\dfrac83$.",
    "points": 1,
    "tags": [
      "véc-tơ",
      "khoảng cách",
      "góc",
      "hình hộp chữ nhật",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "box",
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
      "diagonals": false
    }
  },
  {
    "id": "thpt-khonggian-09",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho hình chóp $S.ABC$ có đáy $ABC$ là tam giác đều cạnh $4$ cm, $SA\\perp(ABC)$ và góc giữa mặt phẳng $(SBC)$ với mặt phẳng $(ABC)$ bằng $30^\\circ$. Khoảng cách từ $A$ đến mặt phẳng $(SBC)$ bằng bao nhiêu centimét? Kết quả làm tròn đến hàng phần mười.",
    "answer": "1,7",
    "explanation": "Gọi $M$ là trung điểm $BC$, $AM=2\\sqrt3$. Vì $BC\\perp(SAM)$ nên góc giữa $(SBC)$ và $(ABC)$ là $\\widehat{SMA}=30^\\circ$, suy ra $SA=AM\\tan30^\\circ=2$ và $SM=\\sqrt{SA^2+AM^2}=4$. Kẻ $AH\\perp SM$ thì $AH\\perp(SBC)$, nên $AH=\\dfrac{SA\\cdot AM}{SM}=\\dfrac{2\\cdot2\\sqrt3}{4}=\\sqrt3\\approx1{,}73$, làm tròn được $1{,}7$.",
    "points": 0.5,
    "tags": [
      "khoảng cách",
      "góc nhị diện",
      "hình chóp",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-khonggian-10",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho hình lập phương $ABCD.A'B'C'D'$ có cạnh bằng $6$ cm. Khoảng cách giữa hai đường thẳng $AB'$ và $BC'$ bằng bao nhiêu centimét? Kết quả làm tròn đến hàng phần mười.",
    "answer": "3,5",
    "explanation": "Chọn hệ tọa độ $A(0;0;0)$, $B(6;0;0)$, $D(0;6;0)$, $A'(0;0;6)$. Khi đó $\\overrightarrow{AB'}=(6;0;6)$, $\\overrightarrow{BC'}=(0;6;6)$, và $\\vec n=(1;1;-1)$ vuông góc cả hai. Khoảng cách $d=\\dfrac{|\\overrightarrow{AB}\\cdot\\vec n|}{|\\vec n|}=\\dfrac{6}{\\sqrt3}=2\\sqrt3\\approx 3{,}46$, làm tròn được $3{,}5$.",
    "points": 0.5,
    "tags": [
      "khoảng cách giữa hai đường thẳng chéo nhau",
      "hình lập phương",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-khonggian-11",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hình hộp $ABCD.A'B'C'D'$. Gọi $G$ là trọng tâm tam giác $A'BD$. Biết $\\overrightarrow{AG}=k\\,\\overrightarrow{AC'}$, giá trị của $k$ là",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac12$"
      },
      {
        "key": "B",
        "text": "$\\dfrac13$"
      },
      {
        "key": "C",
        "text": "$\\dfrac23$"
      },
      {
        "key": "D",
        "text": "$\\dfrac14$"
      }
    ],
    "answer": "B",
    "explanation": "Vì $G$ là trọng tâm tam giác $A'BD$ nên $\\overrightarrow{AG}=\\dfrac13\\left(\\overrightarrow{AA'}+\\overrightarrow{AB}+\\overrightarrow{AD}\\right)$. Theo quy tắc hình hộp, $\\overrightarrow{AC'}=\\overrightarrow{AB}+\\overrightarrow{AD}+\\overrightarrow{AA'}$. Do đó $\\overrightarrow{AG}=\\dfrac13\\overrightarrow{AC'}$, suy ra $k=\\dfrac13$.",
    "points": 0.25,
    "tags": [
      "véc-tơ trong không gian",
      "trọng tâm",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-khonggian-12",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một chiếc lều có dạng hình chóp tứ giác đều $S.ABCD$, đáy là hình vuông cạnh $2$ m, các cạnh bên đều dài $3$ m (như hình bên dưới). Chiều cao $SO$ của lều bằng bao nhiêu mét? Kết quả làm tròn đến hàng phần trăm.",
    "answer": "2,65",
    "explanation": "$AC=2\\sqrt2$ nên $OA=\\sqrt2$. Trong tam giác vuông $SOA$: $SO=\\sqrt{SA^2-OA^2}=\\sqrt{9-2}=\\sqrt7\\approx 2{,}6458$, làm tròn được $2{,}65$.",
    "points": 0.5,
    "tags": [
      "bài thực tế",
      "chóp tứ giác đều",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "pyramid4-regular",
      "names": [
        "S",
        "A",
        "B",
        "C",
        "D",
        "O"
      ],
      "height": true,
      "diagonals": false
    }
  },
  {
    "id": "thpt-khonggian-13",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hình chóp $S.ABC$ có $SA\\perp(ABC)$, tam giác $ABC$ vuông cân tại $B$ và $SA=2AB$. Biết khoảng cách từ $A$ đến mặt phẳng $(SBC)$ bằng $2$ cm. Thể tích khối chóp $S.ABC$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{10\\sqrt5}{3}\\ \\text{cm}^3$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{5\\sqrt5}{3}\\ \\text{cm}^3$"
      },
      {
        "key": "C",
        "text": "$5\\sqrt5\\ \\text{cm}^3$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{5\\sqrt5}{6}\\ \\text{cm}^3$"
      }
    ],
    "answer": "B",
    "explanation": "Đặt $AB=BC=x$, $SA=2x$. Vì $BC\\perp AB$ và $BC\\perp SA$ nên $BC\\perp(SAB)$; khoảng cách từ $A$ đến $(SBC)$ là $AH$ với $H$ là hình chiếu của $A$ lên $SB$: $AH=\\dfrac{SA\\cdot AB}{SB}=\\dfrac{2x^2}{x\\sqrt5}=\\dfrac{2x}{\\sqrt5}$. Từ $\\dfrac{2x}{\\sqrt5}=2$ suy ra $x=\\sqrt5$, $SA=2\\sqrt5$. Thể tích $V=\\dfrac13\\cdot\\dfrac{x^2}{2}\\cdot SA=\\dfrac13\\cdot\\dfrac52\\cdot2\\sqrt5=\\dfrac{5\\sqrt5}{3}$.",
    "points": 0.25,
    "tags": [
      "thể tích",
      "khoảng cách",
      "hình chóp",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-khonggian-14",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cho hình chóp đều $S.ABC$ có cạnh đáy bằng $6$ và cạnh bên bằng $5$; $O$ là tâm tam giác $ABC$ (như hình bên dưới). Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "$SO=\\sqrt{13}$"
      },
      {
        "key": "b",
        "text": "Côsin của góc giữa $SA$ và $(ABC)$ bằng $\\dfrac{\\sqrt3}{5}$"
      },
      {
        "key": "c",
        "text": "Khoảng cách từ $O$ đến mặt phẳng $(SBC)$ bằng $\\dfrac{\\sqrt{39}}{4}$"
      },
      {
        "key": "d",
        "text": "Côsin của góc giữa $(SBC)$ và $(ABC)$ bằng $\\dfrac{\\sqrt3}{4}$"
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "$OA=\\dfrac{6}{\\sqrt3}=2\\sqrt3$ nên $SO=\\sqrt{25-12}=\\sqrt{13}$: a) Đúng. b) Sai: $\\cos\\widehat{SAO}=\\dfrac{OA}{SA}=\\dfrac{2\\sqrt3}{5}$. Gọi $M$ là trung điểm $BC$: $OM=\\sqrt3$, $SM=\\sqrt{SB^2-BM^2}=4$. c) Đúng: $d(O,(SBC))=\\dfrac{SO\\cdot OM}{SM}=\\dfrac{\\sqrt{13}\\cdot\\sqrt3}{4}=\\dfrac{\\sqrt{39}}{4}$. d) Đúng: góc giữa $(SBC)$ và $(ABC)$ là $\\widehat{SMO}$, có $\\cos\\widehat{SMO}=\\dfrac{OM}{SM}=\\dfrac{\\sqrt3}{4}$.",
    "points": 1,
    "tags": [
      "khoảng cách",
      "góc",
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
        "C",
        "O"
      ],
      "height": true,
      "diagonals": false
    }
  },
  {
    "id": "thpt-khonggian-15",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cho hình hộp chữ nhật $ABCD.A'B'C'D'$ có $AB=2$, $AD=3$, $AA'=6$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "$AC'=7$"
      },
      {
        "key": "b",
        "text": "$\\overrightarrow{AC'}\\perp\\overrightarrow{BD'}$"
      },
      {
        "key": "c",
        "text": "$\\cos\\left(\\overrightarrow{AC'},\\overrightarrow{AB}\\right)=\\dfrac27$"
      },
      {
        "key": "d",
        "text": "$\\overrightarrow{AC'}\\cdot\\overrightarrow{AD}=6$"
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "Chọn $\\overrightarrow{AB},\\overrightarrow{AD},\\overrightarrow{AA'}$ làm cơ sở vuông góc đôi một với tọa độ $\\overrightarrow{AC'}=(2;3;6)$, $\\overrightarrow{BD'}=(-2;3;6)$, $\\overrightarrow{AB}=(2;0;0)$, $\\overrightarrow{AD}=(0;3;0)$. a) Đúng: $|\\overrightarrow{AC'}|=\\sqrt{4+9+36}=7$. b) Sai: $\\overrightarrow{AC'}\\cdot\\overrightarrow{BD'}=-4+9+36=41\\neq0$. c) Đúng: $\\cos=\\dfrac{4}{7\\cdot2}=\\dfrac27$. d) Sai: $\\overrightarrow{AC'}\\cdot\\overrightarrow{AD}=9$.",
    "points": 1,
    "tags": [
      "véc-tơ trong không gian",
      "tích vô hướng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-khonggian-16",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Mái của một chiếc lều có dạng hình chóp tứ giác đều $S.ABCD$ với đáy là hình vuông cạnh $4$ m, các cạnh bên dài $4$ m; $O$ là tâm đáy (như hình bên dưới). Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Chiều cao $SO=2\\sqrt3$ m"
      },
      {
        "key": "b",
        "text": "Góc giữa cạnh bên $SA$ và mặt đáy bằng $45^\\circ$"
      },
      {
        "key": "c",
        "text": "Côsin của góc giữa mặt bên $(SAB)$ và mặt đáy bằng $\\dfrac{2}{\\sqrt3}$"
      },
      {
        "key": "d",
        "text": "Diện tích xung quanh của lều bằng $16\\sqrt3$ m$^2$"
      }
    ],
    "answer": "SĐSĐ",
    "explanation": "$OA=2\\sqrt2$, $SO=\\sqrt{16-8}=2\\sqrt2$. a) Sai, $SO=2\\sqrt2$. b) Đúng: tam giác $SOA$ vuông cân tại $O$ nên góc $\\widehat{SAO}=45^\\circ$. c) Sai: gọi $M$ là trung điểm $AB$, $OM=2$, $SM=\\sqrt{SO^2+OM^2}=2\\sqrt3$, $\\cos\\widehat{SMO}=\\dfrac{OM}{SM}=\\dfrac{1}{\\sqrt3}$. d) Đúng: $S_{xq}=4\\cdot\\dfrac12\\cdot4\\cdot2\\sqrt3=16\\sqrt3$ m$^2$.",
    "points": 1,
    "tags": [
      "bài thực tế",
      "chóp tứ giác đều",
      "góc",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "pyramid4-regular",
      "names": [
        "S",
        "A",
        "B",
        "C",
        "D",
        "O"
      ],
      "height": true,
      "diagonals": false
    }
  },
  {
    "id": "thpt-khonggian-17",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình vuông cạnh $a$, cạnh bên $SA$ vuông góc với mặt phẳng đáy và $SA=a$ (như hình bên dưới). Số đo góc nhị diện $[B,SC,D]$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$60^\\circ$"
      },
      {
        "key": "B",
        "text": "$90^\\circ$"
      },
      {
        "key": "C",
        "text": "$120^\\circ$"
      },
      {
        "key": "D",
        "text": "$\\arccos\\dfrac13$"
      }
    ],
    "answer": "C",
    "explanation": "Chọn $a=1$ và tọa độ $A(0;0;0)$, $B(1;0;0)$, $D(0;1;0)$, $C(1;1;0)$, $S(0;0;1)$. Hạ $BI\\perp SC$ và $DI\\perp SC$ với cùng chân $I=\\left(\\tfrac23;\\tfrac23;\\tfrac13\\right)$ (đối xứng qua mặt $SAC$). Khi đó $\\overrightarrow{IB}=\\left(\\tfrac13;-\\tfrac23;-\\tfrac13\\right)$, $\\overrightarrow{ID}=\\left(-\\tfrac23;\\tfrac13;-\\tfrac13\\right)$, $\\cos\\widehat{BID}=\\dfrac{-\\frac13}{\\frac23}=-\\dfrac12$. Vậy góc nhị diện bằng $120^\\circ$. Kết quả không phụ thuộc $a$.",
    "points": 0.25,
    "tags": [
      "góc nhị diện",
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
        "D",
        "O"
      ],
      "height": false,
      "diagonals": false
    }
  },
  {
    "id": "thpt-khonggian-18",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình vuông cạnh $3$ cm, cạnh bên $SA$ vuông góc với mặt phẳng đáy và $SA=4$ cm (như hình bên dưới). Khoảng cách giữa hai đường thẳng $BD$ và $SC$ bằng bao nhiêu centimét? Kết quả làm tròn đến hàng phần trăm.",
    "answer": "1,46",
    "explanation": "Chọn $A(0;0;0)$, $B(3;0;0)$, $D(0;3;0)$, $C(3;3;0)$, $S(0;0;4)$. Vectơ $\\vec n=(2;2;3)$ vuông góc cả $BD$ và $SC$. Với $\\overrightarrow{BS}=(-3;0;4)$: $d=\\dfrac{|\\overrightarrow{BS}\\cdot\\vec n|}{|\\vec n|}=\\dfrac{6}{\\sqrt{17}}\\approx1{,}455$, làm tròn được $1{,}46$.",
    "points": 0.5,
    "tags": [
      "khoảng cách giữa hai đường thẳng chéo nhau",
      "phương pháp tọa độ",
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
        "D",
        "O"
      ],
      "height": false,
      "diagonals": false
    }
  },
  {
    "id": "thpt-khonggian-19",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho tứ diện $ABCD$ có $AB=4$, $CD=6$, khoảng cách giữa hai đường thẳng $AB$ và $CD$ bằng $2$, góc giữa hai đường thẳng $AB$ và $CD$ bằng $60^\\circ$. Thể tích khối tứ diện $ABCD$ bằng bao nhiêu? Kết quả làm tròn đến hàng phần mười.",
    "answer": "6,9",
    "explanation": "Thể tích tứ diện: $V=\\dfrac16\\cdot AB\\cdot CD\\cdot d(AB,CD)\\cdot\\sin\\varphi$ với $\\varphi$ là góc giữa $AB$ và $CD$. Do đó $V=\\dfrac16\\cdot4\\cdot6\\cdot2\\cdot\\dfrac{\\sqrt3}{2}=4\\sqrt3\\approx6{,}93$, làm tròn được $6{,}9$.",
    "points": 0.5,
    "tags": [
      "thể tích",
      "tứ diện",
      "khoảng cách giữa hai đường thẳng chéo nhau",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-khonggian-20",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Người ta làm một bể nước có nắp dạng hình hộp chữ nhật, đáy là hình vuông cạnh $x$ (m), chiều cao $h$ (m), thể tích bể bằng $32\\ \\text{m}^3$. Để tổng diện tích toàn phần của bể nhỏ nhất thì $x$ bằng bao nhiêu mét? Kết quả làm tròn đến hàng phần mười.",
    "answer": "3,2",
    "explanation": "Từ $x^2h=32$ suy ra $h=\\dfrac{32}{x^2}$. Diện tích toàn phần $S_{tp}=2x^2+4xh=2x^2+\\dfrac{128}{x}$. Ta có $S'=4x-\\dfrac{128}{x^2}=0\\Leftrightarrow x^3=32$, suy ra $x=2\\sqrt[3]{4}\\approx3{,}17$, làm tròn được $3{,}2$.",
    "points": 0.5,
    "tags": [
      "ứng dụng đạo hàm",
      "bài thực tế",
      "hình hộp chữ nhật",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-khonggian-21",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cho hình chóp $S.ABC$ có $SA\\perp(ABC)$, tam giác $ABC$ vuông tại $C$ với $AC=3$, $BC=4$ và $SA=4$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "$BC\\perp(SAB)$"
      },
      {
        "key": "b",
        "text": "Khoảng cách từ $A$ đến mặt phẳng $(SBC)$ bằng $\\dfrac{12}{5}$"
      },
      {
        "key": "c",
        "text": "Khoảng cách giữa hai đường thẳng $SB$ và $AC$ bằng $2\\sqrt2$"
      },
      {
        "key": "d",
        "text": "$\\tan$ của góc giữa $(SBC)$ và $(ABC)$ bằng $\\dfrac45$"
      }
    ],
    "answer": "SĐĐS",
    "explanation": "Chọn $C(0;0;0)$, $A(3;0;0)$, $B(0;4;0)$, $S(3;0;4)$. a) Sai: $BC\\perp AC$ và $BC\\perp SA$ nên $BC\\perp(SAC)$, nhưng $BC$ không vuông góc $AB$ (tam giác $ABC$ không vuông tại $B$) nên không vuông góc $(SAB)$. b) Đúng: $BC\\perp(SAC)$ nên $(SBC)\\perp(SAC)$ theo $SC$; kẻ $AH\\perp SC$ thì $d=AH=\\dfrac{SA\\cdot AC}{SC}=\\dfrac{12}{5}$ với $SC=5$. c) Đúng: $\\vec n=(0;1;1)$ vuông góc $\\overrightarrow{AC}$ và $\\overrightarrow{SB}$, nên $d=\\dfrac{|\\overrightarrow{CB}\\cdot\\vec n|}{|\\vec n|}=\\dfrac{4}{\\sqrt2}=2\\sqrt2$. d) Sai: vì $BC\\perp AC$ và $BC\\perp SC$, góc nhị diện có tang bằng $\\dfrac{SA}{AC}=\\dfrac43$.",
    "points": 1,
    "tags": [
      "khoảng cách",
      "góc nhị diện",
      "hình chóp",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-khonggian-22",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho lăng trụ đứng $ABC.A'B'C'$ có đáy $ABC$ là tam giác vuông cân tại $A$, $AB=AC=x$, $AA'=2x$. Biết khoảng cách từ $A$ đến mặt phẳng $(A'BC)$ bằng $2$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "$x=3$"
      },
      {
        "key": "b",
        "text": "Thể tích khối lăng trụ $ABC.A'B'C'$ bằng $27$"
      },
      {
        "key": "c",
        "text": "Khoảng cách từ $B$ đến mặt phẳng $(AA'C)$ bằng $6$"
      },
      {
        "key": "d",
        "text": "Khoảng cách từ $A'$ đến mặt phẳng $(ABC)$ bằng $3$"
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "Chọn $A(0;0;0)$, $B(x;0;0)$, $C(0;x;0)$, $A'(0;0;2x)$. Mặt phẳng $(A'BC)$ có phương trình $2X+2Y+Z=2x$, nên $d(A,(A'BC))=\\dfrac{2x}{3}=2$, suy ra $x=3$. a) Đúng. b) Đúng: $V=\\dfrac12\\cdot3\\cdot3\\cdot6=27$. c) Sai: $(AA'C)$ là mặt phẳng $x=0$ nên $d(B,(AA'C))=x=3$. d) Sai: $d(A',(ABC))=AA'=6$.",
    "points": 1,
    "tags": [
      "khoảng cách",
      "lăng trụ đứng",
      "thể tích",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-khonggian-23",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho hình hộp chữ nhật $ABCD.A'B'C'D'$ có $AB=3$, $AD=4$, $AA'=12$. Góc giữa đường thẳng $AC'$ và mặt phẳng $(ABCD)$ bằng bao nhiêu độ? Kết quả làm tròn đến hàng đơn vị.",
    "answer": "67",
    "explanation": "Hình chiếu của $AC'$ lên $(ABCD)$ là $AC$ với $AC=\\sqrt{3^2+4^2}=5$. Góc cần tìm là $\\widehat{C'AC}$ với $\\tan\\widehat{C'AC}=\\dfrac{CC'}{AC}=\\dfrac{12}{5}$, suy ra $\\widehat{C'AC}\\approx67{,}38^\\circ$, làm tròn được $67$.",
    "points": 0.5,
    "tags": [
      "góc giữa đường thẳng và mặt phẳng",
      "hình hộp chữ nhật",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-khonggian-24",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình vuông cạnh $a$, $SA\\perp(ABCD)$ và $SA=a$. Gọi $\\alpha$ là góc giữa đường thẳng $SC$ và mặt phẳng $(SBD)$. Giá trị $\\sin\\alpha$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{\\sqrt3}{3}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac23$"
      },
      {
        "key": "C",
        "text": "$\\dfrac13$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{\\sqrt2}{3}$"
      }
    ],
    "answer": "C",
    "explanation": "Chọn $a=1$, $A(0;0;0)$, $B(1;0;0)$, $D(0;1;0)$, $C(1;1;0)$, $S(0;0;1)$. Mặt phẳng $(SBD)$ có phương trình $x+y+z-1=0$, vectơ pháp tuyến $\\vec n=(1;1;1)$. Với $\\overrightarrow{SC}=(1;1;-1)$: $\\sin\\alpha=\\dfrac{|\\vec n\\cdot\\overrightarrow{SC}|}{|\\vec n|\\,|\\overrightarrow{SC}|}=\\dfrac{1}{3}$.",
    "points": 0.25,
    "tags": [
      "góc giữa đường thẳng và mặt phẳng",
      "phương pháp tọa độ",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-khonggian-25",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho hình lăng trụ đứng $ABC.A'B'C'$ có đáy $ABC$ là tam giác đều cạnh $2$. Biết khoảng cách từ $A$ đến mặt phẳng $(A'BC)$ bằng $\\dfrac{\\sqrt6}{2}$. Thể tích khối lăng trụ $ABC.A'B'C'$ bằng bao nhiêu?",
    "answer": "3",
    "explanation": "Gọi $M$ là trung điểm $BC$, $AM=\\sqrt3$. Vì $BC\\perp(AA'M)$ nên $d(A,(A'BC))=AH$ với $H$ là hình chiếu của $A$ lên $A'M$. Đặt $AA'=h$: $AH=\\dfrac{h\\sqrt3}{\\sqrt{h^2+3}}=\\dfrac{\\sqrt6}{2}$, suy ra $h^2=3$, $h=\\sqrt3$. Thể tích $V=S_{ABC}\\cdot h=\\sqrt3\\cdot\\sqrt3=3$.",
    "points": 0.5,
    "tags": [
      "thể tích",
      "lăng trụ đứng",
      "khoảng cách",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-kinhdien-01",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Tính tích phân $\\int_1^2 (4x^3-2x)\\,dx$.",
    "options": [
      {
        "key": "A",
        "text": "6"
      },
      {
        "key": "B",
        "text": "9"
      },
      {
        "key": "C",
        "text": "12"
      },
      {
        "key": "D",
        "text": "18"
      }
    ],
    "answer": "C",
    "explanation": "Một nguyên hàm của $4x^3-2x$ là $x^4-x^2$. Suy ra $\\int_1^2 (4x^3-2x)\\,dx=(2^4-2^2)-(1^4-1^2)=12-0=12$.",
    "points": 0.25,
    "tags": [
      "tích phân",
      "tính tích phân cơ bản",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-kinhdien-02",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Họ nguyên hàm của hàm số $f(x)=\\sin 2x$ là:",
    "options": [
      {
        "key": "A",
        "text": "$\\frac{1}{2}\\cos 2x+C$"
      },
      {
        "key": "B",
        "text": "$-2\\cos 2x+C$"
      },
      {
        "key": "C",
        "text": "$2\\cos 2x+C$"
      },
      {
        "key": "D",
        "text": "$-\\frac{1}{2}\\cos 2x+C$"
      }
    ],
    "answer": "D",
    "explanation": "$\\int \\sin 2x\\,dx=-\\dfrac{1}{2}\\cos 2x+C$, vì $\\left(-\\dfrac{1}{2}\\cos 2x\\right)'=\\sin 2x$.",
    "points": 0.25,
    "tags": [
      "nguyên hàm",
      "hàm lượng giác",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-kinhdien-03",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một chất điểm chuyển động thẳng có quãng đường $s(t)=t^3-6t^2+9t$ (m), với $t\\ge 0$ tính bằng giây. Vận tốc tức thời của chất điểm tại thời điểm $t=4$ s bằng bao nhiêu m/s?",
    "options": [
      {
        "key": "A",
        "text": "9"
      },
      {
        "key": "B",
        "text": "-3"
      },
      {
        "key": "C",
        "text": "15"
      },
      {
        "key": "D",
        "text": "0"
      }
    ],
    "answer": "A",
    "explanation": "Vận tốc là đạo hàm của quãng đường: $v(t)=s'(t)=3t^2-12t+9$. Suy ra $v(4)=48-48+9=9$ m/s.",
    "points": 0.25,
    "tags": [
      "đạo hàm",
      "vận tốc tức thời",
      "chuyển động thẳng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-kinhdien-04",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Diện tích hình phẳng giới hạn bởi parabol $y=x^2$ và đường thẳng $y=2x$ như hình bên dưới bằng bao nhiêu?",
    "options": [
      {
        "key": "A",
        "text": "$\\frac{8}{3}$"
      },
      {
        "key": "B",
        "text": "2"
      },
      {
        "key": "C",
        "text": "$\\frac{1}{3}$"
      },
      {
        "key": "D",
        "text": "$\\frac{4}{3}$"
      }
    ],
    "answer": "D",
    "explanation": "Hoành độ giao điểm: $x^2=2x\\Leftrightarrow x=0$ hoặc $x=2$. Trên $[0;2]$ có $2x\\ge x^2$ nên $S=\\int_0^2 (2x-x^2)\\,dx=\\left[x^2-\\dfrac{x^3}{3}\\right]_0^2=4-\\dfrac{8}{3}=\\dfrac{4}{3}$.",
    "points": 0.25,
    "tags": [
      "diện tích hình phẳng",
      "hai đường cong",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "oxy",
      "xMin": -1,
      "xMax": 3,
      "yMin": -1,
      "yMax": 5,
      "items": "(P): y = x^2\nd: y = 2x"
    }
  },
  {
    "id": "thpt-kinhdien-05",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Người ta xây một bể nước hình hộp chữ nhật không có nắp, đáy là hình vuông cạnh $x$ (m), chiều cao $h$ (m), thể tích bể bằng $54\\ \\text{m}^3$. Chi phí xây đáy là $400$ nghìn đồng/m$^2$, chi phí xây các mặt bên là $100$ nghìn đồng/m$^2$. Tổng chi phí nhỏ nhất để xây bể bằng bao nhiêu nghìn đồng?",
    "options": [
      {
        "key": "A",
        "text": "9720"
      },
      {
        "key": "B",
        "text": "10800"
      },
      {
        "key": "C",
        "text": "12600"
      },
      {
        "key": "D",
        "text": "7200"
      }
    ],
    "answer": "B",
    "explanation": "Từ $x^2h=54$ suy ra $h=\\dfrac{54}{x^2}$. Tổng chi phí $C(x)=400x^2+100\\cdot 4xh=400x^2+\\dfrac{21600}{x}$ với $x>0$. Ta có $C'(x)=800x-\\dfrac{21600}{x^2}$, $C'(x)=0\\Leftrightarrow x^3=27\\Leftrightarrow x=3$. Lập bảng biến thiên, $C$ nhỏ nhất tại $x=3$: $C(3)=3600+7200=10800$ (nghìn đồng).",
    "points": 0.25,
    "tags": [
      "ứng dụng đạo hàm",
      "tối ưu",
      "chi phí làm bể",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-kinhdien-06",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một nhà sản xuất có hàm cầu $p(q)=300-5q$ (nghìn đồng/sản phẩm), trong đó $q$ là số sản phẩm bán ra, $0\\le q\\le 60$. Doanh thu lớn nhất có thể đạt được là bao nhiêu nghìn đồng?",
    "options": [
      {
        "key": "A",
        "text": "9000"
      },
      {
        "key": "B",
        "text": "6000"
      },
      {
        "key": "C",
        "text": "4500"
      },
      {
        "key": "D",
        "text": "3000"
      }
    ],
    "answer": "C",
    "explanation": "Doanh thu $R(q)=q\\cdot p(q)=300q-5q^2$. Ta có $R'(q)=300-10q$, $R'(q)=0\\Leftrightarrow q=30\\in[0;60]$. Lập bảng biến thiên, $R$ lớn nhất tại $q=30$: $R(30)=9000-4500=4500$ nghìn đồng.",
    "points": 0.25,
    "tags": [
      "ứng dụng đạo hàm",
      "hàm cầu",
      "doanh thu",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-kinhdien-07",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Hai đèn chiếu sáng $A$ và $B$ đặt cách nhau $6$ m trên cùng một đường thẳng (như hình bên dưới). Cường độ sáng của đèn $A$ là $8$, của đèn $B$ là $1$. Độ rọi tại một điểm $M$ trên đoạn $AB$ là tổng độ rọi do hai đèn gây ra, trong đó độ rọi do một đèn gây ra tại $M$ bằng cường độ sáng của đèn chia cho bình phương khoảng cách từ đèn đến $M$. Điểm $M$ cách $A$ bao nhiêu mét thì độ rọi tại $M$ nhỏ nhất?",
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
        "text": "5"
      },
      {
        "key": "D",
        "text": "4"
      }
    ],
    "answer": "D",
    "explanation": "Đặt $x=AM$ với $0<x<6$, khi đó $BM=6-x$ và độ rọi $E(x)=\\dfrac{8}{x^2}+\\dfrac{1}{(6-x)^2}$. Ta có $E'(x)=-\\dfrac{16}{x^3}+\\dfrac{2}{(6-x)^3}$. $E'(x)=0\\Leftrightarrow x^3=8(6-x)^3\\Leftrightarrow x=2(6-x)\\Leftrightarrow x=4$. $E$ giảm trên $(0;4)$ và tăng trên $(4;6)$ nên nhỏ nhất tại $x=4$, với $E(4)=\\dfrac{3}{4}$.",
    "points": 0.25,
    "tags": [
      "ứng dụng đạo hàm",
      "tối ưu",
      "độ rọi ánh sáng",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "scene",
      "text": "A(0; 0) M(2.5; 0) B(6; 0)\nAB\nkích thước AB \"6 m\""
    }
  },
  {
    "id": "thpt-kinhdien-08",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một vật thể có đáy là hình phẳng giới hạn bởi parabol $y=4-x^2$ và trục hoành. Cắt vật thể bởi mặt phẳng vuông góc với trục $Ox$ tại điểm có hoành độ $x$ ($-2\\le x\\le 2$), thiết diện thu được là một hình vuông có một cạnh nằm trên đáy. Thể tích của vật thể bằng bao nhiêu?",
    "options": [
      {
        "key": "A",
        "text": "$\\frac{256}{15}$"
      },
      {
        "key": "B",
        "text": "32"
      },
      {
        "key": "C",
        "text": "$\\frac{512}{15}$"
      },
      {
        "key": "D",
        "text": "$\\frac{64}{3}$"
      }
    ],
    "answer": "C",
    "explanation": "Cạnh hình vuông ở thiết diện có độ dài $4-x^2$, nên diện tích thiết diện $S(x)=(4-x^2)^2$. Thể tích $V=\\int_{-2}^{2}(4-x^2)^2\\,dx=\\int_{-2}^{2}(16-8x^2+x^4)\\,dx=\\dfrac{512}{15}$.",
    "points": 0.25,
    "tags": [
      "thể tích vật thể",
      "thiết diện",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-kinhdien-09",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Tốc độ tăng dân số của một thành phố (nghìn người/năm) sau $t$ năm kể từ thời điểm $t=0$ được cho bởi $r(t)=\\dfrac{150}{t+3}$, $t\\ge 0$. Số dân tăng thêm của thành phố trong 9 năm đầu tiên (từ $t=0$ đến $t=9$) bằng bao nhiêu nghìn người?",
    "options": [
      {
        "key": "A",
        "text": "$150\\ln 4$"
      },
      {
        "key": "B",
        "text": "$150\\ln 12$"
      },
      {
        "key": "C",
        "text": "450"
      },
      {
        "key": "D",
        "text": "$150\\ln 3$"
      }
    ],
    "answer": "A",
    "explanation": "Số dân tăng thêm bằng $\\int_0^9 \\dfrac{150}{t+3}\\,dt=150\\left(\\ln 12-\\ln 3\\right)=150\\ln 4\\approx 207{,}9$ (nghìn người).",
    "points": 0.25,
    "tags": [
      "tốc độ thay đổi",
      "ứng dụng tích phân",
      "dân số",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-kinhdien-10",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Bạn An đứng tại điểm $A$ trên bờ một con sông thẳng, cần đến điểm $B$ ở bờ bên kia. Biết khoảng cách từ $B$ đến bờ sông là $0{,}8$ km và hình chiếu vuông góc của $B$ lên bờ cách $A$ một đoạn $1$ km. An chạy trên bờ với vận tốc $5$ km/h, bơi với vận tốc $3$ km/h. An chạy dọc bờ đến điểm $M$ rồi bơi thẳng đến $B$. Thời gian ngắn nhất để An đến $B$ bằng bao nhiêu phút?",
    "options": [
      {
        "key": "A",
        "text": "25,6"
      },
      {
        "key": "B",
        "text": "24,8"
      },
      {
        "key": "C",
        "text": "28,0"
      },
      {
        "key": "D",
        "text": "20,0"
      }
    ],
    "answer": "B",
    "explanation": "Đặt $AM=x$ km, $0\\le x\\le 1$. Thời gian $T(x)=\\dfrac{x}{5}+\\dfrac{\\sqrt{(1-x)^2+0{,}64}}{3}$ (giờ). $T'(x)=\\dfrac{1}{5}-\\dfrac{1-x}{3\\sqrt{(1-x)^2+0{,}64}}=0\\Leftrightarrow x=0{,}4$. Khi đó $T(0{,}4)=0{,}08+\\dfrac{1}{3}\\approx 0{,}4133$ giờ $\\approx 24{,}8$ phút, nhỏ nhất (so với $T(0)\\approx 25{,}6$ phút và $T(1)=28$ phút).",
    "points": 0.25,
    "tags": [
      "ứng dụng đạo hàm",
      "tối ưu",
      "chạy-bơi",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-kinhdien-11",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một cửa hàng bán một loại sản phẩm với hàm cầu $p(q)=80-q$ (nghìn đồng/sản phẩm), $0\\le q\\le 80$, trong đó $q$ là số sản phẩm bán được. Xét tính đúng, sai của các khẳng định sau.",
    "options": [
      {
        "key": "a",
        "text": "Doanh thu khi bán $q$ sản phẩm là $R(q)=80q-q^2$ (nghìn đồng)."
      },
      {
        "key": "b",
        "text": "Doanh thu tăng khi $q$ thuộc khoảng $(0;40)$."
      },
      {
        "key": "c",
        "text": "Doanh thu lớn nhất đạt được là $1800$ nghìn đồng."
      },
      {
        "key": "d",
        "text": "Khi bán $60$ sản phẩm thì doanh thu là $1200$ nghìn đồng."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: $R(q)=q(80-q)=80q-q^2$. b) Đúng: $R'(q)=80-2q>0$ với $q<40$. c) Sai: $R$ lớn nhất tại $q=40$, $R(40)=1600$ nghìn đồng. d) Đúng: $R(60)=60\\cdot 20=1200$.",
    "points": 1,
    "tags": [
      "hàm cầu",
      "doanh thu",
      "đạo hàm",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-kinhdien-12",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một ô tô chuyển động thẳng với vận tốc $v(t)=6-2t$ (m/s), $t\\ge 0$ tính bằng giây. Xét tính đúng, sai của các khẳng định sau.",
    "options": [
      {
        "key": "a",
        "text": "Quãng đường ô tô đi được trong 3 giây đầu là 9 m."
      },
      {
        "key": "b",
        "text": "Tại thời điểm $t=0$, vận tốc của ô tô bằng 6 m/s."
      },
      {
        "key": "c",
        "text": "Ô tô dừng lại tại thời điểm $t=3$ giây."
      },
      {
        "key": "d",
        "text": "Quãng đường ô tô đi được trong 5 giây đầu là 25 m."
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) Đúng: $\\int_0^3(6-2t)\\,dt=9$. b) Đúng: $v(0)=6$. c) Đúng: $v(3)=0$. d) Sai: $v(t)<0$ khi $t>3$ nên quãng đường là $\\int_0^3(6-2t)\\,dt+\\int_3^5(2t-6)\\,dt=9+4=13$ m, không phải 25 m.",
    "points": 1,
    "tags": [
      "quãng đường",
      "vận tốc",
      "tích phân",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-kinhdien-13",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho parabol $(P): y=4-x^2$ và đường thẳng $d: y=x+2$ có đồ thị như hình bên dưới. Gọi $S$ là diện tích hình phẳng giới hạn bởi $(P)$ và $d$. Xét tính đúng, sai của các khẳng định sau.",
    "options": [
      {
        "key": "a",
        "text": "Hoành độ giao điểm của $(P)$ và $d$ là $x=-2$ và $x=1$."
      },
      {
        "key": "b",
        "text": "$S=\\dfrac{9}{2}$ (đơn vị diện tích)."
      },
      {
        "key": "c",
        "text": "Trên khoảng $(-2;1)$, parabol $(P)$ nằm phía dưới đường thẳng $d$."
      },
      {
        "key": "d",
        "text": "Phần diện tích của hình phẳng nằm bên phải trục $Oy$ bằng $3$."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) Đúng: $4-x^2=x+2\\Leftrightarrow x^2+x-2=0\\Leftrightarrow x=-2$ hoặc $x=1$. b) Đúng: $S=\\int_{-2}^{1}(2-x-x^2)\\,dx=\\dfrac{9}{2}$. c) Sai: tại $x=0$ thì $4>2$, parabol nằm phía trên $d$. d) Sai: phần bên phải $Oy$ có diện tích $\\int_0^1(2-x-x^2)\\,dx=\\dfrac{7}{6}$.",
    "points": 1,
    "tags": [
      "diện tích hình phẳng",
      "parabol và đường thẳng",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "oxy",
      "xMin": -3,
      "xMax": 2,
      "yMin": -1,
      "yMax": 5,
      "items": "(P): y = 4 - x^2\nd: y = x + 2"
    }
  },
  {
    "id": "thpt-kinhdien-14",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Người ta làm một thùng tôn hình hộp chữ nhật không nắp, đáy là hình vuông cạnh $x$ (dm), chiều cao $h$ (dm). Tổng diện tích tôn dùng làm thùng (gồm đáy và bốn mặt bên) bằng $108$ dm$^2$; bỏ qua độ dày và mép nối. Xét tính đúng, sai của các khẳng định sau.",
    "options": [
      {
        "key": "a",
        "text": "$h=\\dfrac{108-x^2}{4x}$."
      },
      {
        "key": "b",
        "text": "Thể tích của thùng là $V(x)=\\dfrac{108x-x^3}{4}$ (dm$^3$)."
      },
      {
        "key": "c",
        "text": "Thể tích lớn nhất của thùng bằng $144$ dm$^3$."
      },
      {
        "key": "d",
        "text": "Thể tích của thùng lớn nhất khi cạnh đáy $x=6$ dm."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: $x^2+4xh=108$ nên $h=\\dfrac{108-x^2}{4x}$. b) Đúng: $V=x^2h=\\dfrac{108x-x^3}{4}$ với $0<x<\\sqrt{108}$. c) Sai: $V'(x)=\\dfrac{108-3x^2}{4}=0\\Leftrightarrow x=6$ và $V(6)=108$ dm$^3$. d) Đúng: $V'>0$ khi $x<6$ và $V'<0$ khi $x>6$ nên $V$ đạt lớn nhất tại $x=6$.",
    "points": 1,
    "tags": [
      "ứng dụng đạo hàm",
      "thể tích",
      "tối ưu",
      "thùng tôn",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-kinhdien-15",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hình phẳng $(H)$ giới hạn bởi parabol $(P): y=x^2$ (với $x\\ge 0$), đường thẳng $y=4$ và trục $Oy$, như hình bên dưới. Gọi $V_x$ và $V_y$ lần lượt là thể tích khối tròn xoay tạo thành khi quay $(H)$ quanh trục $Ox$ và quanh trục $Oy$. Xét tính đúng, sai của các khẳng định sau.",
    "options": [
      {
        "key": "a",
        "text": "$V_y=8\\pi$."
      },
      {
        "key": "b",
        "text": "$V_x=\\dfrac{128\\pi}{5}$."
      },
      {
        "key": "c",
        "text": "$V_y=16\\pi$."
      },
      {
        "key": "d",
        "text": "$V_x>3V_y$."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: khi quay quanh $Oy$, với mỗi $y\\in[0;4]$ thiết diện là đĩa bán kính $\\sqrt{y}$ nên $V_y=\\pi\\int_0^4 y\\,dy=8\\pi$. b) Đúng: quay quanh $Ox$ với $0\\le x\\le 2$ ta được vòng tròn bán kính ngoài $4$, bán kính trong $x^2$: $V_x=\\pi\\int_0^2(16-x^4)\\,dx=\\dfrac{128\\pi}{5}$. c) Sai: $V_y=8\\pi$. d) Đúng: $V_x=25{,}6\\pi>24\\pi=3V_y$.",
    "points": 1,
    "tags": [
      "thể tích khối tròn xoay",
      "quay quanh Oy",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "oxy",
      "xMin": -1,
      "xMax": 3,
      "yMin": -1,
      "yMax": 5,
      "items": "(P): y = x^2\nd: y = 4"
    }
  },
  {
    "id": "thpt-kinhdien-16",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=f(t)$ có đồ thị như hình bên dưới. Đặt $F(x)=\\displaystyle\\int_0^x f(t)\\,dt$. Xét tính đúng, sai của các khẳng định sau.",
    "options": [
      {
        "key": "a",
        "text": "$F$ đạt cực đại tại $x=-2$ và $F(-2)=\\dfrac{16}{3}$."
      },
      {
        "key": "b",
        "text": "$F$ đạt cực tiểu tại $x=-2$."
      },
      {
        "key": "c",
        "text": "Giá trị nhỏ nhất của $F$ trên đoạn $[0;3]$ bằng $-\\dfrac{16}{3}$."
      },
      {
        "key": "d",
        "text": "Phương trình $F(x)=0$ có đúng ba nghiệm thực phân biệt."
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "Ta có $F'(x)=f(x)=x^2-4$ và $F(x)=\\dfrac{x^3}{3}-4x$. a) Đúng: $F'$ đổi dấu từ $+$ sang $-$ tại $x=-2$ và $F(-2)=\\dfrac{16}{3}$. b) Sai: $x=-2$ là điểm cực đại, không phải cực tiểu. c) Đúng: trên $[0;3]$ có $F(0)=0$, $F(2)=-\\dfrac{16}{3}$, $F(3)=-3$ nên giá trị nhỏ nhất là $-\\dfrac{16}{3}$. d) Đúng: $F(x)=x\\left(\\dfrac{x^2}{3}-4\\right)=0\\Leftrightarrow x=0$ hoặc $x=\\pm 2\\sqrt{3}$.",
    "points": 1,
    "tags": [
      "tích phân hàm số xác định bởi tích phân",
      "cực trị",
      "giá trị nhỏ nhất",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "x^2-4"
      ],
      "xMin": -3,
      "xMax": 3
    }
  },
  {
    "id": "thpt-kinhdien-17",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một chất điểm chuyển động thẳng có gia tốc $a(t)=6t-4$ (m/s$^2$), $t\\ge 0$ tính bằng giây. Tại thời điểm $t=0$, vận tốc của chất điểm bằng $2$ m/s và chất điểm ở gốc quãng đường $O$. Xét tính đúng, sai của các khẳng định sau.",
    "options": [
      {
        "key": "a",
        "text": "Vận tốc của chất điểm tại thời điểm $t=2$ s bằng $6$ m/s."
      },
      {
        "key": "b",
        "text": "Vận tốc nhỏ nhất của chất điểm đạt được tại $t=\\dfrac{2}{3}$ s."
      },
      {
        "key": "c",
        "text": "Quãng đường chất điểm đi được trong 2 giây đầu bằng $6$ m."
      },
      {
        "key": "d",
        "text": "Chất điểm dừng lại tại thời điểm $t=1$ s."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "Từ $v'(t)=a(t)$ và $v(0)=2$ suy ra $v(t)=3t^2-4t+2$, $s(t)=t^3-2t^2+2t$. a) Đúng: $v(2)=12-8+2=6$. b) Đúng: $v$ là tam thức bậc hai có hệ số $a=3>0$, đỉnh tại $t=\\dfrac{2}{3}$, nên $\\min v=v\\left(\\dfrac{2}{3}\\right)=\\dfrac{2}{3}$ m/s. c) Sai: $v(t)>0$ với mọi $t$ nên quãng đường là $s(2)=4$ m. d) Sai: $v(1)=1\\ne 0$.",
    "points": 1,
    "tags": [
      "gia tốc",
      "vận tốc",
      "quãng đường",
      "tích phân",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-kinhdien-18",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Tốc độ phát triển của một quần thể (nghìn cá thể/năm) sau $t$ năm được mô hình bởi $r(t)=t\\,e^{-t}$, $t\\ge 0$. Xét tính đúng, sai của các khẳng định sau.",
    "options": [
      {
        "key": "a",
        "text": "Tốc độ phát triển lớn nhất đạt được tại $t=1$."
      },
      {
        "key": "b",
        "text": "Tốc độ phát triển lớn nhất bằng $1$ nghìn cá thể/năm."
      },
      {
        "key": "c",
        "text": "$\\displaystyle\\int_0^1 r(t)\\,dt=1-\\dfrac{2}{e}$."
      },
      {
        "key": "d",
        "text": "Số cá thể tăng thêm trong 2 năm đầu nhỏ hơn 1 nghìn cá thể."
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "$r'(t)=e^{-t}(1-t)$, nên $r'(t)=0\\Leftrightarrow t=1$, $r$ đạt cực đại tại $t=1$ với $r(1)=\\dfrac{1}{e}\\approx 0{,}37$. a) Đúng. b) Sai: giá trị lớn nhất là $\\dfrac{1}{e}$. c) Đúng: $\\int_0^1 te^{-t}\\,dt=\\left[-(t+1)e^{-t}\\right]_0^1=1-\\dfrac{2}{e}$. d) Đúng: $\\int_0^2 te^{-t}\\,dt=1-\\dfrac{3}{e^2}\\approx 0{,}59<1$.",
    "points": 1,
    "tags": [
      "tốc độ thay đổi",
      "cực trị",
      "tích phân",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-kinhdien-19",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính $\\displaystyle\\int_{-1}^{1}\\left(x^4+2x\\right)dx$. Viết kết quả dưới dạng số thập phân.",
    "answer": "0,4",
    "explanation": "$\\int_{-1}^{1}x^4\\,dx=\\dfrac{2}{5}$ và $\\int_{-1}^{1}2x\\,dx=0$ (hàm lẻ trên đoạn đối xứng). Vậy kết quả là $\\dfrac{2}{5}=0{,}4$.",
    "points": 0.5,
    "tags": [
      "tích phân",
      "tính tích phân cơ bản",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-kinhdien-20",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính diện tích hình phẳng giới hạn bởi đồ thị hàm số $y=x^3$ và đường thẳng $y=x$ như hình bên dưới. Viết kết quả dưới dạng số thập phân.",
    "answer": "0,5",
    "explanation": "Hoành độ giao điểm: $x^3=x\\Leftrightarrow x\\in\\{-1;0;1\\}$. $S=\\int_{-1}^{0}(x^3-x)\\,dx+\\int_{0}^{1}(x-x^3)\\,dx=\\dfrac{1}{4}+\\dfrac{1}{4}=\\dfrac{1}{2}=0{,}5$.",
    "points": 0.5,
    "tags": [
      "diện tích hình phẳng",
      "hai đường cong",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "oxy",
      "xMin": -2,
      "xMax": 2,
      "yMin": -2,
      "yMax": 2,
      "items": "(C): y = x^3\nd: y = x"
    }
  },
  {
    "id": "thpt-kinhdien-21",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một chất điểm chuyển động thẳng có quãng đường $s(t)=2t^3-9t^2+12t$ (m), $t\\ge 0$ tính bằng giây. Tại thời điểm vận tốc triệt tiêu lần thứ hai, gia tốc của chất điểm bằng bao nhiêu m/s$^2$?",
    "answer": "6",
    "explanation": "$v(t)=s'(t)=6t^2-18t+12=6(t-1)(t-2)$, $v(t)=0$ tại $t=1$ và $t=2$. Gia tốc $a(t)=v'(t)=12t-18$, nên $a(2)=6$ m/s$^2$.",
    "points": 0.5,
    "tags": [
      "đạo hàm",
      "vận tốc",
      "gia tốc",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-kinhdien-22",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một vật chuyển động thẳng với vận tốc $v(t)=2+6\\sqrt{t}$ (m/s), $t\\ge 0$ tính bằng giây. Quãng đường vật đi được trong 9 giây đầu tiên bằng bao nhiêu mét?",
    "answer": "126",
    "explanation": "$\\int_0^9 (2+6\\sqrt{t})\\,dt=\\left[2t+4t\\sqrt{t}\\right]_0^9=18+108=126$ m.",
    "points": 0.5,
    "tags": [
      "quãng đường",
      "tích phân",
      "căn thức",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-kinhdien-23",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Gọi $V$ là thể tích khối tròn xoay tạo thành khi quay quanh trục $Ox$ hình phẳng giới hạn bởi đồ thị hàm số $y=\\dfrac{1}{\\sqrt{x+1}}$, trục $Ox$ và hai đường thẳng $x=0$, $x=3$ (như hình bên dưới). Tính $V$, làm tròn kết quả đến hàng phần trăm.",
    "answer": "4,36",
    "explanation": "$V=\\pi\\int_0^3 \\dfrac{1}{x+1}\\,dx=\\pi\\ln 4\\approx 4{,}36$.",
    "points": 0.5,
    "tags": [
      "thể tích khối tròn xoay",
      "quay quanh Ox",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "1/sqrt(x+1)"
      ],
      "xMin": 0,
      "xMax": 4
    }
  },
  {
    "id": "thpt-kinhdien-24",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Số lượng vi khuẩn trong một mẫu nuôi cấy tăng với tốc độ $r(t)=400e^{\\frac{t}{2}}$ (con/giờ), $t\\ge 0$ tính bằng giờ. Số lượng vi khuẩn tăng thêm trong 2 giờ đầu là bao nhiêu con (làm tròn kết quả đến hàng đơn vị)?",
    "answer": "1375",
    "explanation": "$\\int_0^2 400e^{\\frac{t}{2}}\\,dt=800\\left(e-1\\right)\\approx 1374{,}6$, làm tròn thành $1375$ con.",
    "points": 0.5,
    "tags": [
      "tốc độ tăng trưởng",
      "hàm mũ",
      "tích phân",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-kinhdien-25",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một chất điểm chuyển động thẳng với vận tốc $v(t)=t^2+t$ (m/s), $0\\le t\\le 3$. Vận tốc trung bình của chất điểm trên khoảng thời gian $[0;3]$ bằng bao nhiêu m/s?",
    "answer": "4,5",
    "explanation": "Vận tốc trung bình $\\bar v=\\dfrac{1}{3}\\int_0^3 (t^2+t)\\,dt=\\dfrac{1}{3}\\left(9+\\dfrac{9}{2}\\right)=\\dfrac{9}{2}=4{,}5$ m/s.",
    "points": 0.5,
    "tags": [
      "giá trị trung bình",
      "vận tốc trung bình",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-kinhdien-26",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cửa sổ Norman có dạng một hình chữ nhật ở phía dưới ghép với nửa hình tròn ở phía trên, đường kính nửa hình tròn trùng với cạnh trên của hình chữ nhật. Chu vi khung cửa sổ (gồm cạnh đáy, hai cạnh bên và cung tròn) bằng $10$ m. Gọi $x$ (m) là bán kính nửa hình tròn. Để diện tích cửa sổ lớn nhất, giá trị của $x$ bằng bao nhiêu mét (làm tròn kết quả đến hàng phần mười)?",
    "answer": "1,4",
    "explanation": "Gọi $h$ là chiều cao phần hình chữ nhật: $2x+2h+\\pi x=10$, suy ra $h=\\dfrac{10-(2+\\pi)x}{2}$. Diện tích $S(x)=2xh+\\dfrac{\\pi x^2}{2}=10x-\\left(2+\\dfrac{\\pi}{2}\\right)x^2$. $S'(x)=10-(4+\\pi)x=0\\Leftrightarrow x=\\dfrac{10}{4+\\pi}\\approx 1{,}40$ m. Đây là điểm cực đại duy nhất nên $S$ lớn nhất tại đó.",
    "points": 0.5,
    "tags": [
      "ứng dụng đạo hàm",
      "tối ưu",
      "cửa sổ Norman",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-kinhdien-27",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tìm giá trị dương của tham số $a$ sao cho diện tích hình phẳng giới hạn bởi đồ thị hàm số $y=x^2-ax$ và trục hoành bằng $36$.",
    "answer": "6",
    "explanation": "Đồ thị cắt trục hoành tại $x=0$ và $x=a$, trên $(0;a)$ thì $x^2-ax\\le 0$. Diện tích $S=\\int_0^a (ax-x^2)\\,dx=\\dfrac{a^3}{2}-\\dfrac{a^3}{3}=\\dfrac{a^3}{6}$. Từ $\\dfrac{a^3}{6}=36$ suy ra $a^3=216$, $a=6$.",
    "points": 0.5,
    "tags": [
      "diện tích hình phẳng",
      "tham số",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-kinhdien-28",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trong mặt phẳng $Oxy$ cho điểm $A(0;4)$ và parabol $(P): y=x^2$ (như hình bên dưới). Điểm $M$ di chuyển trên $(P)$. Khoảng cách ngắn nhất từ $A$ đến $M$ bằng bao nhiêu (làm tròn kết quả đến hàng phần trăm)?",
    "answer": "1,94",
    "explanation": "Với $M(x;x^2)$, $AM^2=x^2+(x^2-4)^2$. Đặt $t=x^2\\ge 0$, $AM^2=g(t)=t^2-7t+16$, $g'(t)=2t-7=0\\Leftrightarrow t=\\dfrac{7}{2}$. Khi đó $g\\left(\\dfrac{7}{2}\\right)=\\dfrac{15}{4}$ nên $AM_{\\min}=\\sqrt{\\dfrac{15}{4}}\\approx 1{,}94$.",
    "points": 0.5,
    "tags": [
      "ứng dụng đạo hàm",
      "khoảng cách ngắn nhất",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "oxy",
      "xMin": -3,
      "xMax": 3,
      "yMin": -1,
      "yMax": 6,
      "items": "A(0; 4)\n(P): y = x^2"
    }
  },
  {
    "id": "thpt-kinhdien-29",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho hàm số $y=\\dfrac{4}{x}$ có đồ thị $(C)$. Với $a>0$, tiếp tuyến của $(C)$ tại điểm có hoành độ $x=a$ cắt hai trục tọa độ tại hai điểm $P$ và $Q$. Khi $a$ thay đổi, diện tích tam giác $OPQ$ bằng bao nhiêu?",
    "answer": "8",
    "explanation": "$y'=-\\dfrac{4}{x^2}$. Tiếp tuyến tại $x=a$: $y=-\\dfrac{4}{a^2}(x-a)+\\dfrac{4}{a}$. Cắt $Ox$ tại $P(2a;0)$, cắt $Oy$ tại $Q\\left(0;\\dfrac{8}{a}\\right)$. Diện tích $S_{OPQ}=\\dfrac{1}{2}\\cdot 2a\\cdot\\dfrac{8}{a}=8$, không phụ thuộc $a$.",
    "points": 0.5,
    "tags": [
      "tiếp tuyến",
      "diện tích tam giác",
      "đạo hàm",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-kinhdien-30",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một hình chữ nhật có cạnh đáy nằm trên trục $Ox$, đối xứng qua trục $Oy$, hai đỉnh phía trên nằm trên parabol $y=9-x^2$ (như hình bên dưới). Diện tích lớn nhất của hình chữ nhật bằng bao nhiêu (làm tròn kết quả đến hàng đơn vị)?",
    "answer": "21",
    "explanation": "Gọi $x$ ($0<x<3$) là hoành độ đỉnh phía trên bên phải, diện tích $S(x)=2x(9-x^2)=18x-2x^3$. $S'(x)=18-6x^2=0\\Leftrightarrow x=\\sqrt{3}$, $S(\\sqrt{3})=12\\sqrt{3}\\approx 20{,}78$, làm tròn thành $21$.",
    "points": 0.5,
    "tags": [
      "ứng dụng đạo hàm",
      "tối ưu",
      "hình chữ nhật nội tiếp",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "9-x^2"
      ],
      "xMin": -4,
      "xMax": 4
    }
  },
  {
    "id": "thpt-lop1011-01",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong các mệnh đề sau, mệnh đề nào là mệnh đề sai?",
    "options": [
      {
        "key": "A",
        "text": "Với mọi số thực $x$, $x^2 \\ge 0$."
      },
      {
        "key": "B",
        "text": "Có một số nguyên $n$ sao cho $n^2=2$."
      },
      {
        "key": "C",
        "text": "Phương trình $x^2-5x+6=0$ có nghiệm."
      },
      {
        "key": "D",
        "text": "$2+3=5$."
      }
    ],
    "answer": "B",
    "explanation": "Không có số nguyên nào có bình phương bằng 2 vì $\\sqrt{2}$ là số vô tỉ, nên mệnh đề B sai. Các mệnh đề A, C, D đúng ($x^2-5x+6=(x-2)(x-3)$ có nghiệm $x=2$, $x=3$).",
    "points": 0.25,
    "tags": [
      "Mệnh đề",
      "Mệnh đề tồn tại",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-lop1011-02",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho các tập hợp $A=\\{x\\in\\mathbb{Z}\\mid -3\\le x<4\\}$ và $B=\\{x\\in\\mathbb{N}\\mid x^2<10\\}$. Số phần tử của tập hợp $A\\setminus B$ là bao nhiêu?",
    "options": [
      {
        "key": "A",
        "text": "4"
      },
      {
        "key": "B",
        "text": "7"
      },
      {
        "key": "C",
        "text": "3"
      },
      {
        "key": "D",
        "text": "6"
      }
    ],
    "answer": "C",
    "explanation": "$A=\\{-3;-2;-1;0;1;2;3\\}$ và $B=\\{0;1;2;3\\}$ vì $x^2<10$ với $x\\in\\mathbb{N}$ khi và chỉ khi $x\\le 3$. Vậy $A\\setminus B=\\{-3;-2;-1\\}$ có 3 phần tử.",
    "points": 0.25,
    "tags": [
      "Tập hợp",
      "Phép toán trên tập hợp",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-lop1011-03",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Một cơ sở sản xuất hai loại sản phẩm X và Y. Mỗi sản phẩm X cần 2 kg nguyên liệu và 1 giờ máy; mỗi sản phẩm Y cần 1 kg nguyên liệu và 1 giờ máy. Cơ sở có tối đa 12 kg nguyên liệu và tối đa 8 giờ máy trong một ngày. Mỗi sản phẩm X lãi 4 triệu đồng, mỗi sản phẩm Y lãi 3 triệu đồng. Lợi nhuận lớn nhất trong một ngày là bao nhiêu triệu đồng?",
    "options": [
      {
        "key": "A",
        "text": "24"
      },
      {
        "key": "B",
        "text": "28"
      },
      {
        "key": "C",
        "text": "32"
      },
      {
        "key": "D",
        "text": "40"
      }
    ],
    "answer": "B",
    "explanation": "Gọi $x$, $y$ là số sản phẩm X, Y ($x,y\\ge 0$). Ràng buộc: $2x+y\\le 12$ và $x+y\\le 8$; lợi nhuận $F=4x+3y$. Các đỉnh của miền nghiệm là $(0;0)$, $(6;0)$, $(4;4)$, $(0;8)$ với $F=0;\\,24;\\,28;\\,24$. Vậy lợi nhuận lớn nhất là 28 triệu đồng khi $x=4$, $y=4$.",
    "points": 0.25,
    "tags": [
      "Bất phương trình bậc nhất hai ẩn",
      "Bài toán tối ưu",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-lop1011-04",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Một quả bóng được đá lên từ mặt đất theo quỹ đạo parabol. Gọi $x$ (m) là khoảng cách theo phương ngang tính từ điểm đá và $h(x)=-\\dfrac{1}{2}x^2+3x$ (m) là độ cao của bóng, với $0\\le x\\le 6$; quỹ đạo được mô tả như hình bên dưới. Bóng ở độ cao không thấp hơn 4 m trên một đoạn theo phương ngang có độ dài bao nhiêu mét?",
    "options": [
      {
        "key": "A",
        "text": "1"
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
        "text": "4"
      }
    ],
    "answer": "B",
    "explanation": "$h(x)\\ge 4 \\Leftrightarrow -\\dfrac12x^2+3x-4\\ge 0 \\Leftrightarrow x^2-6x+8\\le 0 \\Leftrightarrow 2\\le x\\le 4$. Độ dài đoạn đó là $4-2=2$ m.",
    "points": 0.25,
    "tags": [
      "Hàm số bậc hai",
      "Parabol thực tế",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "-0.5x^2+3x"
      ],
      "xMin": 0,
      "xMax": 6
    }
  },
  {
    "id": "thpt-lop1011-05",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Để đo khoảng cách giữa hai điểm $B$ và $C$ nằm hai bên một hồ nước, người ta chọn điểm $A$ sao cho $AB=5$ m, $AC=8$ m và $\\widehat{BAC}=60^\\circ$. Khoảng cách $BC$ bằng bao nhiêu mét?",
    "options": [
      {
        "key": "A",
        "text": "7"
      },
      {
        "key": "B",
        "text": "$\\sqrt{129}$"
      },
      {
        "key": "C",
        "text": "6"
      },
      {
        "key": "D",
        "text": "49"
      }
    ],
    "answer": "A",
    "explanation": "Theo định lí côsin: $BC^2=AB^2+AC^2-2\\cdot AB\\cdot AC\\cos 60^\\circ=25+64-40=49$, suy ra $BC=7$ m.",
    "points": 0.25,
    "tags": [
      "Hệ thức lượng trong tam giác",
      "Ứng dụng đo đạc",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-lop1011-06",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho tam giác $ABC$ có trọng tâm $G$. Khẳng định nào sau đây đúng?",
    "options": [
      {
        "key": "A",
        "text": "$\\overrightarrow{GA}+\\overrightarrow{GB}+\\overrightarrow{GC}=\\overrightarrow{AB}$"
      },
      {
        "key": "B",
        "text": "$\\overrightarrow{GA}+\\overrightarrow{GB}+\\overrightarrow{GC}=\\overrightarrow{BC}$"
      },
      {
        "key": "C",
        "text": "$\\overrightarrow{GA}+\\overrightarrow{GB}+\\overrightarrow{GC}=2\\overrightarrow{AG}$"
      },
      {
        "key": "D",
        "text": "$\\overrightarrow{GA}+\\overrightarrow{GB}+\\overrightarrow{GC}=\\overrightarrow{0}$"
      }
    ],
    "answer": "D",
    "explanation": "Vì $G$ là trọng tâm nên $\\overrightarrow{GA}+\\overrightarrow{GB}+\\overrightarrow{GC}=\\overrightarrow{0}$. Ba đáp án còn lại sai vì vế phải khác $\\overrightarrow{0}$ (các véc-tơ $\\overrightarrow{AB}$, $\\overrightarrow{BC}$, $2\\overrightarrow{AG}$ đều khác $\\overrightarrow{0}$).",
    "points": 0.25,
    "tags": [
      "Véc-tơ",
      "Trọng tâm tam giác",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-lop1011-07",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong mặt phẳng $Oxy$, đường tròn $(C)$ có tâm $I$ và đi qua điểm $M$ (vị trí như hình bên dưới). Phương trình tiếp tuyến của $(C)$ tại $M$ là",
    "options": [
      {
        "key": "A",
        "text": "$x+y-7=0$"
      },
      {
        "key": "B",
        "text": "$x-y+1=0$"
      },
      {
        "key": "C",
        "text": "$x+y-5=0$"
      },
      {
        "key": "D",
        "text": "$x-y-1=0$"
      }
    ],
    "answer": "A",
    "explanation": "Tiếp tuyến tại $M$ vuông góc với bán kính $IM$. Ta có $\\overrightarrow{IM}=(2;2)$ nên tiếp tuyến nhận $(1;1)$ làm vectơ pháp tuyến và đi qua $M(3;4)$: $(x-3)+(y-4)=0$, tức $x+y-7=0$.",
    "points": 0.25,
    "tags": [
      "Đường tròn",
      "Phương trình tiếp tuyến",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "oxy",
      "xMin": -1,
      "xMax": 5,
      "yMin": -1,
      "yMax": 6,
      "items": "I(1; 2)\nM(3; 4)"
    }
  },
  {
    "id": "thpt-lop1011-08",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Một vật được ném lên từ độ cao 1 m so với mặt đất. Độ cao $h$ (m) của vật sau $t$ giây là $h(t)=-5t^2+20t+1$ với $t\\ge 0$ (đồ thị $h(t)$ như hình bên dưới). Xét tính đúng, sai của các khẳng định sau.",
    "options": [
      {
        "key": "a",
        "text": "Tại thời điểm ném $t=0$, vật ở độ cao 1 m."
      },
      {
        "key": "b",
        "text": "Độ cao lớn nhất mà vật đạt được là 20 m."
      },
      {
        "key": "c",
        "text": "Trong khoảng thời gian từ $t=1$ giây đến $t=3$ giây, vật ở độ cao không thấp hơn 16 m."
      },
      {
        "key": "d",
        "text": "Vật chạm đất đúng sau 4 giây kể từ lúc ném."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) $h(0)=1$: Đúng. b) $h(t)=-5(t-2)^2+21$ nên độ cao lớn nhất là 21 m tại $t=2$: Sai. c) $h(t)-16=-5(t-1)(t-3)\\ge 0$ với $t\\in[1;3]$: Đúng. d) $h(4)=1\\ne 0$; nghiệm dương của $-5t^2+20t+1=0$ là $t=\\dfrac{20+\\sqrt{420}}{10}\\approx 4{,}05$ giây: Sai.",
    "points": 1,
    "tags": [
      "Hàm số bậc hai",
      "Chuyển động ném",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "-5x^2+20x+1"
      ],
      "xMin": 0,
      "xMax": 5
    }
  },
  {
    "id": "thpt-lop1011-09",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Một mảnh vườn có dạng tam giác $ABC$ vuông tại $A$ như hình bên dưới, với $AB=4$ m và $AC=3$ m. Gọi $H$ là chân đường cao kẻ từ $A$ xuống cạnh $BC$. Xét tính đúng, sai của các khẳng định sau.",
    "options": [
      {
        "key": "a",
        "text": "Cạnh $BC$ dài 5 m."
      },
      {
        "key": "b",
        "text": "$\\sin B=\\dfrac35$."
      },
      {
        "key": "c",
        "text": "Diện tích mảnh vườn bằng 12 m$^2$."
      },
      {
        "key": "d",
        "text": "Đường cao $AH$ dài 2,4 m."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) $BC=\\sqrt{4^2+3^2}=5$ m: Đúng. b) $\\sin B=\\dfrac{AC}{BC}=\\dfrac35$: Đúng. c) Diện tích bằng $\\dfrac12\\cdot 4\\cdot 3=6$ m$^2$, không phải 12 m$^2$: Sai. d) $AH=\\dfrac{AB\\cdot AC}{BC}=\\dfrac{12}{5}=2{,}4$ m: Đúng.",
    "points": 1,
    "tags": [
      "Hệ thức lượng trong tam giác",
      "Ứng dụng thực tế",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "scene",
      "text": "A(0; 0) B(4; 0) C(0; 3)\nAB, BC, CA\nvuông BAC\nkích thước AB \"4 m\"\nkích thước AC \"3 m\""
    }
  },
  {
    "id": "thpt-lop1011-10",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Trong mặt phẳng $Oxy$, cho ba điểm $A$, $B$, $C$ và đường thẳng $d$ như hình bên dưới. Xét tính đúng, sai của các khẳng định sau.",
    "options": [
      {
        "key": "a",
        "text": "Đường trung trực của đoạn $AB$ đi qua gốc tọa độ $O$."
      },
      {
        "key": "b",
        "text": "Phương trình đường thẳng $AB$ là $x+2y-3=0$."
      },
      {
        "key": "c",
        "text": "Khoảng cách từ $A$ đến đường thẳng $d$ bằng $2$."
      },
      {
        "key": "d",
        "text": "Điểm $C$ thuộc đường thẳng $d$."
      }
    ],
    "answer": "SĐSĐ",
    "explanation": "a) Trung điểm của $AB$ là $(1;1)$, $\\overrightarrow{AB}=(4;-2)$ nên trung trực có phương trình $2x-y-1=0$, không đi qua $O$: Sai. b) $\\overrightarrow{AB}=(4;-2)$ có vectơ pháp tuyến $(2;4)$; đường thẳng qua $A(-1;2)$ là $2(x+1)+4(y-2)=0$, tức $x+2y-3=0$: Đúng. c) $d(A,d)=\\dfrac{|-1-4+3|}{\\sqrt{1+4}}=\\dfrac{2}{\\sqrt5}\\ne 2$: Sai. d) Thay $C(-3;0)$ vào $d$: $-3-0+3=0$: Đúng.",
    "points": 1,
    "tags": [
      "Phương trình đường thẳng",
      "Khoảng cách",
      "Tọa độ trong mặt phẳng Oxy",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "oxy",
      "xMin": -4,
      "xMax": 4,
      "yMin": -1,
      "yMax": 4,
      "items": "A(-1; 2)\nB(3; 0)\nC(-3; 0)\nd: x - 2y + 3 = 0"
    }
  },
  {
    "id": "thpt-lop1011-11",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Một biển quảng cáo có dạng phần mặt phẳng giới hạn bởi parabol $(P): y=-x^2+4$ và trục hoành (đơn vị: mét). Xét tính đúng, sai của các khẳng định sau.",
    "options": [
      {
        "key": "a",
        "text": "Đỉnh của $(P)$ là điểm $I(0;4)$."
      },
      {
        "key": "b",
        "text": "$(P)$ cắt trục hoành tại hai điểm cách nhau 4 m."
      },
      {
        "key": "c",
        "text": "Đường thẳng $y=x+2$ cắt $(P)$ tại hai điểm có tổng hoành độ bằng $0$."
      },
      {
        "key": "d",
        "text": "Hàm số $y=-x^2+4$ đồng biến trên khoảng $(0;+\\infty)$."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) Parabol có đỉnh $I(0;4)$: Đúng. b) Giao với trục hoành: $-x^2+4=0$ có hai nghiệm $x=\\pm 2$, cách nhau 4 m: Đúng. c) Hoành độ giao điểm thỏa $-x^2+4=x+2$ hay $x^2+x-2=0$, tức $x=1$ hoặc $x=-2$, tổng bằng $-1\\ne 0$: Sai. d) Hệ số $a=-1<0$ nên hàm số nghịch biến trên $(0;+\\infty)$: Sai.",
    "points": 1,
    "tags": [
      "Hàm số bậc hai",
      "Parabol và đường thẳng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-lop1011-12",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trong mặt phẳng $Oxy$, cho elip $(E):\\dfrac{x^2}{25}+\\dfrac{y^2}{9}=1$ có hai tiêu điểm $F_1$, $F_2$. Gọi $M(x_M;y_M)$ là điểm thuộc $(E)$ có $x_M>0$ sao cho $\\widehat{F_1MF_2}=90^\\circ$. Tính $|y_M|$. Viết kết quả dưới dạng số thập phân (làm tròn đến hàng phần trăm nếu kết quả không nguyên).",
    "answer": "2,25",
    "explanation": "Ta có $a=5$, $b=3$, $c=\\sqrt{a^2-b^2}=4$. Góc $\\widehat{F_1MF_2}=90^\\circ$ khi và chỉ khi $M$ nằm trên đường tròn $x^2+y^2=c^2=16$. Thay $y^2=16-x^2$ vào (E): $\\dfrac{x^2}{25}+\\dfrac{16-x^2}{9}=1$, suy ra $x^2=\\dfrac{175}{16}$, do đó $y^2=\\dfrac{81}{16}$ và $|y_M|=\\dfrac94=2{,}25$.",
    "points": 0.5,
    "tags": [
      "Elip",
      "Tiêu điểm",
      "Đường tròn",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-lop1011-13",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trong mặt phẳng $Oxy$, cho ba điểm $A(1;2)$, $B(3;-1)$, $C(-1;4)$. Biết $ABCD$ là hình bình hành, hãy tìm hoành độ của đỉnh $D$.",
    "answer": "-3",
    "explanation": "Hình bình hành $ABCD$ có $\\overrightarrow{AB}=\\overrightarrow{DC}$, suy ra $D=A+C-B=(-3;7)$. Hoành độ của $D$ là $-3$.",
    "points": 0.5,
    "tags": [
      "Véc-tơ",
      "Tọa độ điểm",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-lop1011-14",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho các số thực $x,y\\ge 0$ thỏa mãn $x+2y\\ge 4$ và $3x+y\\ge 6$. Giá trị nhỏ nhất của biểu thức $F=2x+3y$ bằng bao nhiêu? Viết kết quả dưới dạng số thập phân.",
    "answer": "6,8",
    "explanation": "Miền nghiệm có ba đỉnh là $(0;6)$, $(4;0)$ và $\\left(\\dfrac85;\\dfrac65\\right)$ (giao của hai đường thẳng $x+2y=4$ và $3x+y=6$). Giá trị $F$ tại các đỉnh lần lượt là $18$, $8$, $6{,}8$. Vì miền nghiệm không bị chặn về phía $F$ tăng nên $\\min F=6{,}8$.",
    "points": 0.5,
    "tags": [
      "Bất phương trình bậc nhất hai ẩn",
      "Bài toán tối ưu",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-lop1011-15",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tìm $m$ để đỉnh của parabol $y=x^2-4x+m$ nằm trên trục hoành.",
    "answer": "4",
    "explanation": "Hoành độ đỉnh là $x=2$, tung độ đỉnh là $y=4-8+m=m-4$. Đỉnh nằm trên trục hoành khi $m-4=0$, tức $m=4$.",
    "points": 0.5,
    "tags": [
      "Hàm số bậc hai",
      "Đỉnh parabol",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-lop1011-16",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Giá trị của giới hạn $\\lim\\limits_{x\\to 2}\\dfrac{x^2-4}{x-2}$ bằng bao nhiêu?",
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
        "text": "Không tồn tại"
      },
      {
        "key": "D",
        "text": "4"
      }
    ],
    "answer": "D",
    "explanation": "Với $x\\ne 2$ ta có $\\dfrac{x^2-4}{x-2}=x+2$, nên giới hạn bằng $2+2=4$.",
    "points": 0.25,
    "tags": [
      "Giới hạn của hàm số",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-lop1011-17",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Hàm số $f(x)=\\dfrac{(x-1)(x+2)}{x-3}$ liên tục trên từng khoảng xác định của nó. Dựa vào bảng xét dấu của $f(x)$ như hình bên dưới, tập nghiệm của bất phương trình $f(x)\\le 0$ là",
    "options": [
      {
        "key": "A",
        "text": "$(-\\infty;-2]\\cup[1;3)$"
      },
      {
        "key": "B",
        "text": "$[-2;1]\\cup(3;+\\infty)$"
      },
      {
        "key": "C",
        "text": "$(-\\infty;-2)\\cup(1;3)$"
      },
      {
        "key": "D",
        "text": "$[-2;1]\\cup[3;+\\infty)$"
      }
    ],
    "answer": "A",
    "explanation": "Từ bảng xét dấu: $f(x)<0$ trên $(-\\infty;-2)\\cup(1;3)$; $f(x)=0$ khi $x=-2$ hoặc $x=1$; $f$ không xác định tại $x=3$. Vậy $f(x)\\le 0$ khi $x\\in(-\\infty;-2]\\cup[1;3)$.",
    "points": 0.25,
    "tags": [
      "Hàm số liên tục",
      "Xét dấu biểu thức",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "signtable",
      "expr": "(x-1)(x+2)/(x-3)"
    }
  },
  {
    "id": "thpt-lop1011-18",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình bình hành tâm $O$ (như hình bên dưới). Gọi $M$ là trung điểm của $SC$. Khẳng định nào sau đây đúng?",
    "options": [
      {
        "key": "A",
        "text": "$OM\\parallel (SCD)$"
      },
      {
        "key": "B",
        "text": "$OM\\parallel SB$"
      },
      {
        "key": "C",
        "text": "$OM\\parallel SA$"
      },
      {
        "key": "D",
        "text": "$OM\\parallel (SBC)$"
      }
    ],
    "answer": "C",
    "explanation": "Trong tam giác $SAC$, $O$ và $M$ lần lượt là trung điểm của $AC$ và $SC$ nên $OM$ là đường trung bình, suy ra $OM\\parallel SA$. Các khẳng định còn lại sai: $M$ thuộc $SC$ nên đường thẳng $OM$ cắt hai mặt phẳng $(SCD)$ và $(SBC)$ tại $M$; và $OM\\parallel SA$ nên không song song với $SB$.",
    "points": 0.25,
    "tags": [
      "Quan hệ song song trong không gian",
      "Đường trung bình",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "pyramid4",
      "names": [
        "S",
        "A",
        "B",
        "C",
        "D"
      ],
      "height": false,
      "diagonals": true,
      "extras": "O = AC cắt BD\nM = trung điểm SC\nOM"
    }
  },
  {
    "id": "thpt-lop1011-19",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=f(x)=x^3-3x$ có đồ thị như hình bên dưới. Xét tính đúng, sai của các khẳng định sau.",
    "options": [
      {
        "key": "a",
        "text": "$\\lim\\limits_{x\\to 0}f(x)=1$."
      },
      {
        "key": "b",
        "text": "$\\lim\\limits_{x\\to 2}f(x)=2$."
      },
      {
        "key": "c",
        "text": "$\\lim\\limits_{x\\to 1}f(x)=2$."
      },
      {
        "key": "d",
        "text": "Hàm số $f(x)$ liên tục trên $\\mathbb{R}$."
      }
    ],
    "answer": "SĐSĐ",
    "explanation": "Hàm số $f(x)=x^3-3x$ là đa thức nên liên tục trên $\\mathbb{R}$, do đó $\\lim\\limits_{x\\to x_0}f(x)=f(x_0)$. Ta có $f(0)=0$, $f(2)=2$, $f(1)=-2$. Vậy a) Sai, b) Đúng, c) Sai, d) Đúng.",
    "points": 1,
    "tags": [
      "Giới hạn hàm số",
      "Hàm số liên tục",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "x^3-3x"
      ],
      "xMin": -2,
      "xMax": 2
    }
  },
  {
    "id": "thpt-lop1011-20",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $f(x)=\\dfrac{x^2-4}{x-2}$ khi $x>2$ và $f(x)=2x+m$ khi $x\\le 2$, với $m$ là tham số thực. Xét tính đúng, sai của các khẳng định sau.",
    "options": [
      {
        "key": "a",
        "text": "Hàm số liên tục tại $x=2$ khi $m=0$."
      },
      {
        "key": "b",
        "text": "$\\lim\\limits_{x\\to 2^+}f(x)=4$."
      },
      {
        "key": "c",
        "text": "Với $m=1$, hàm số liên tục tại $x=2$."
      },
      {
        "key": "d",
        "text": "Phương trình $f(x)=0$ có nghiệm thuộc khoảng $(2;+\\infty)$."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "Với $x>2$: $f(x)=x+2$ nên $\\lim\\limits_{x\\to2^+}f(x)=4$ (b đúng). Ta có $f(2)=4+m=\\lim\\limits_{x\\to2^-}f(x)$, còn $\\lim\\limits_{x\\to2^+}f(x)=4$; hàm số liên tục tại $2$ khi $4+m=4$, tức $m=0$ (a đúng; c sai vì với $m=1$ thì $f(2)=5\\ne 4$). Với $x>2$ thì $f(x)=x+2>4$ nên $f(x)=0$ không có nghiệm trong $(2;+\\infty)$ (d sai).",
    "points": 1,
    "tags": [
      "Hàm số liên tục",
      "Tham số",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-lop1011-21",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét hàm số $y=3\\sin x+4\\cos x$. Xét tính đúng, sai của các khẳng định sau.",
    "options": [
      {
        "key": "a",
        "text": "Hàm số có tập xác định là $\\mathbb{R}$ và tuần hoàn với chu kỳ $2\\pi$."
      },
      {
        "key": "b",
        "text": "Giá trị lớn nhất của hàm số bằng $5$."
      },
      {
        "key": "c",
        "text": "Khi $y=5$ thì $\\tan x=\\dfrac43$."
      },
      {
        "key": "d",
        "text": "Phương trình $y=0$ có nghiệm thuộc khoảng $(0;\\pi)$."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "Viết $y=5\\sin(x+\\varphi)$ với $\\cos\\varphi=\\dfrac35$, $\\sin\\varphi=\\dfrac45$. Vì $-5\\le y\\le 5$ và hàm số tuần hoàn với chu kỳ $2\\pi$ nên a) và b) đúng. Đạt $y=5$ khi $\\sin x=\\dfrac35$, $\\cos x=\\dfrac45$, tức $\\tan x=\\dfrac34$, nên c) sai. Phương trình $y=0$ tương đương $\\tan x=-\\dfrac43$, có nghiệm $x=\\pi-\\arctan\\dfrac43\\in\\left(\\dfrac{\\pi}{2};\\pi\\right)\\subset(0;\\pi)$, nên d) đúng.",
    "points": 1,
    "tags": [
      "Hàm số lượng giác",
      "Giá trị lớn nhất",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-lop1011-22",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cho tứ diện $ABCD$ có $M$, $N$, $P$ lần lượt là trung điểm của $AB$, $AC$, $AD$ (như hình bên dưới). Xét tính đúng, sai của các khẳng định sau.",
    "options": [
      {
        "key": "a",
        "text": "$MN\\parallel (BCD)$."
      },
      {
        "key": "b",
        "text": "$MN\\parallel BD$."
      },
      {
        "key": "c",
        "text": "$(MNP)\\parallel (BCD)$."
      },
      {
        "key": "d",
        "text": "$NP\\parallel (ABD)$."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) $MN$ là đường trung bình của tam giác $ABC$ nên $MN\\parallel BC\\subset (BCD)$, và $MN\\not\\subset (BCD)$: Đúng. b) $MN\\parallel BC$, không song song với $BD$: Sai. c) $MN\\parallel BC$ và $MP\\parallel BD$ nên $(MNP)\\parallel (BCD)$: Đúng. d) $NP\\parallel CD$ mà $CD$ cắt $(ABD)$ tại $D$ nên $NP$ không song song với $(ABD)$: Sai.",
    "points": 1,
    "tags": [
      "Quan hệ song song trong không gian",
      "Tứ diện",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "tetrahedron",
      "names": [
        "A",
        "B",
        "C",
        "D"
      ],
      "height": false,
      "diagonals": false
    }
  },
  {
    "id": "thpt-lop1011-23",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính tổng các nghiệm thuộc khoảng $[0;2\\pi)$ của phương trình $\\sin x+\\cos x=1$. Viết kết quả dưới dạng số thập phân, làm tròn đến hàng phần trăm.",
    "answer": "1,57",
    "explanation": "Ta có $\\sin x+\\cos x=\\sqrt2\\sin\\left(x+\\dfrac{\\pi}{4}\\right)=1$ nên $\\sin\\left(x+\\dfrac{\\pi}{4}\\right)=\\dfrac{\\sqrt2}{2}$. Trên $[0;2\\pi)$ phương trình có hai nghiệm $x=0$ và $x=\\dfrac{\\pi}{2}$. Tổng bằng $\\dfrac{\\pi}{2}\\approx 1{,}57$.",
    "points": 0.5,
    "tags": [
      "Phương trình lượng giác",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-lop1011-24",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính giới hạn $\\lim\\limits_{x\\to 2}\\dfrac{x^3-8}{x^2-4}$.",
    "answer": "3",
    "explanation": "Với $x\\ne 2$: $\\dfrac{x^3-8}{x^2-4}=\\dfrac{(x-2)(x^2+2x+4)}{(x-2)(x+2)}=\\dfrac{x^2+2x+4}{x+2}$. Giới hạn bằng $\\dfrac{12}{4}=3$.",
    "points": 0.5,
    "tags": [
      "Giới hạn của hàm số",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-lop1011-25",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Biết $\\lim\\limits_{x\\to 1}\\dfrac{x^2+ax+b}{x-1}=5$, với $a$, $b$ là các hằng số. Tính $a+b$.",
    "answer": "-1",
    "explanation": "Vì mẫu dần về $0$ mà giới hạn hữu hạn nên tử phải có nghiệm $x=1$, tức $1+a+b=0$. Khi đó $x^2+ax+b=(x-1)(x+c)$ với $a=c-1$, $b=-c$; giới hạn bằng $1+c=5$, suy ra $c=4$, $a=3$, $b=-4$ và $a+b=-1$.",
    "points": 0.5,
    "tags": [
      "Giới hạn của hàm số",
      "Tham số",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-lop1011-26",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Phương trình $x^3-3x-1=0$ có ba nghiệm thực $x_1$, $x_2$, $x_3$. Tính $x_1^2+x_2^2+x_3^2$.",
    "answer": "6",
    "explanation": "Hàm $f(x)=x^3-3x-1$ liên tục trên $\\mathbb{R}$ và đổi dấu trên các khoảng $(-2;-1)$, $(-1;0)$, $(1;2)$ nên phương trình có ba nghiệm thực. Theo định lí Viète, $x_1+x_2+x_3=0$ và $x_1x_2+x_2x_3+x_3x_1=-3$. Do đó $x_1^2+x_2^2+x_3^2=(x_1+x_2+x_3)^2-2(x_1x_2+x_2x_3+x_3x_1)=6$.",
    "points": 0.5,
    "tags": [
      "Hàm số liên tục",
      "Định lí Viète",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-lop1011-27",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tìm giá trị lớn nhất của hàm số $y=2\\sin x+\\cos x+1$. Viết kết quả dưới dạng số thập phân, làm tròn đến hàng phần trăm.",
    "answer": "3,24",
    "explanation": "Với biểu thức $a\\sin x+b\\cos x$ có giá trị lớn nhất $\\sqrt{a^2+b^2}$, ta có $\\max(2\\sin x+\\cos x)=\\sqrt5$. Suy ra $\\max y=\\sqrt5+1\\approx 3{,}24$.",
    "points": 0.5,
    "tags": [
      "Hàm số lượng giác",
      "Giá trị lớn nhất",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-lop1011-28",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tìm số thực $a$ biết $\\lim\\limits_{x\\to 0}\\dfrac{\\sqrt{1+ax}-1}{x}=2$.",
    "answer": "4",
    "explanation": "Nhân liên hợp: $\\dfrac{\\sqrt{1+ax}-1}{x}=\\dfrac{a}{\\sqrt{1+ax}+1}$ với $x\\ne 0$. Giới hạn bằng $\\dfrac a2$, nên $\\dfrac a2=2$, suy ra $a=4$.",
    "points": 0.5,
    "tags": [
      "Giới hạn của hàm số",
      "Tham số",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-lop1011-29",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình bình hành, thể tích khối chóp bằng $81$ (như hình bên dưới). Mặt phẳng song song với $(ABCD)$ cắt các cạnh $SA$, $SB$, $SC$, $SD$ lần lượt tại $A'$, $B'$, $C'$, $D'$ sao cho $SA'=\\dfrac23SA$. Tính thể tích khối chóp $S.A'B'C'D'$.",
    "answer": "24",
    "explanation": "Mặt phẳng $(A'B'C'D')$ song song với đáy nên $\\dfrac{SA'}{SA}=\\dfrac{SB'}{SB}=\\dfrac{SC'}{SC}=\\dfrac{SD'}{SD}=\\dfrac23$, và $S.A'B'C'D'$ là ảnh của $S.ABCD$ qua phép vị tự tâm $S$ tỉ số $\\dfrac23$. Thể tích tỉ lệ với $\\left(\\dfrac23\\right)^3=\\dfrac{8}{27}$, nên $V=81\\cdot\\dfrac{8}{27}=24$.",
    "points": 0.5,
    "tags": [
      "Quan hệ song song trong không gian",
      "Thể tích khối chóp",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "pyramid4",
      "names": [
        "S",
        "A",
        "B",
        "C",
        "D"
      ],
      "height": false,
      "diagonals": false
    }
  },
  {
    "id": "thpt-lop1011-30",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho hàm số $f(x)=\\dfrac{\\sqrt{x+3}-\\sqrt3}{x}$ khi $x\\ne 0$ và $f(0)=a$. Tìm $a$ để hàm số liên tục tại $x=0$. Viết kết quả dưới dạng số thập phân, làm tròn đến hàng phần trăm.",
    "answer": "0,29",
    "explanation": "Với $x\\ne 0$ ta có $\\dfrac{\\sqrt{x+3}-\\sqrt3}{x}=\\dfrac{1}{\\sqrt{x+3}+\\sqrt3}$, nên $\\lim\\limits_{x\\to 0}f(x)=\\dfrac{1}{2\\sqrt3}=\\dfrac{\\sqrt3}{6}\\approx 0{,}29$. Hàm số liên tục tại $0$ khi $a=\\dfrac{\\sqrt3}{6}\\approx 0{,}29$.",
    "points": 0.5,
    "tags": [
      "Hàm số liên tục",
      "Giới hạn",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly1011-01",
    "subject": "Vật lí",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Một vật được thả rơi tự do từ độ cao 80 m so với mặt đất. Lấy $g = 10$ m/s². Thời gian vật rơi đến khi chạm đất là",
    "options": [
      {
        "key": "A",
        "text": "2 s"
      },
      {
        "key": "B",
        "text": "4 s"
      },
      {
        "key": "C",
        "text": "8 s"
      },
      {
        "key": "D",
        "text": "16 s"
      }
    ],
    "answer": "B",
    "explanation": "Từ $h=\\frac{1}{2}gt^2$ suy ra $t=\\sqrt{\\frac{2h}{g}}=\\sqrt{\\frac{2\\cdot 80}{10}}=4$ s.",
    "points": 0.25,
    "tags": [
      "Động học",
      "Rơi tự do",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly1011-02",
    "subject": "Vật lí",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Đồ thị vận tốc – thời gian của một chất điểm chuyển động thẳng như hình bên dưới. Quãng đường chất điểm đi được trong 7 s đầu là",
    "options": [
      {
        "key": "A",
        "text": "12 m"
      },
      {
        "key": "B",
        "text": "16 m"
      },
      {
        "key": "C",
        "text": "20 m"
      },
      {
        "key": "D",
        "text": "24 m"
      }
    ],
    "answer": "C",
    "explanation": "Quãng đường bằng diện tích phần dưới đồ thị $v$–$t$: $\\frac{1}{2}\\cdot 2\\cdot 4+3\\cdot 4+\\frac{1}{2}\\cdot 2\\cdot 4=4+12+4=20$ m.",
    "points": 0.25,
    "tags": [
      "Động học",
      "Đồ thị v–t",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "motion",
      "yName": "v (m/s)",
      "tName": "t (s)",
      "points": "(0; 0) (2; 4) (5; 4) (7; 0)"
    }
  },
  {
    "id": "thpt-ly1011-03",
    "subject": "Vật lí",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Đồ thị vận tốc – thời gian của một xe chuyển động thẳng nhanh dần đều từ trạng thái đứng yên như hình bên dưới. Gia tốc của xe (m/s²) là bao nhiêu?",
    "answer": "2",
    "explanation": "Gia tốc là độ dốc của đồ thị $v$–$t$: $a=\\frac{\\Delta v}{\\Delta t}=\\frac{10-0}{5-0}=2$ m/s².",
    "points": 0.5,
    "tags": [
      "Động học",
      "Chuyển động thẳng biến đổi đều",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "motion",
      "yName": "v (m/s)",
      "tName": "t (s)",
      "points": "(0; 0) (5; 10)"
    }
  },
  {
    "id": "thpt-ly1011-04",
    "subject": "Vật lí",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Cho các phát biểu về định luật Newton và lực ma sát. Với mỗi ý, chọn Đúng (Đ) hoặc Sai (S).",
    "options": [
      {
        "key": "a",
        "text": "Lực và phản lực luôn cùng độ lớn, cùng phương, ngược chiều và đặt vào hai vật khác nhau."
      },
      {
        "key": "b",
        "text": "Khối lượng là đại lượng đặc trưng cho mức quán tính của vật."
      },
      {
        "key": "c",
        "text": "Một vật chịu tác dụng của các lực cân bằng thì luôn đứng yên."
      },
      {
        "key": "d",
        "text": "Lực ma sát nghỉ tác dụng lên vật đứng yên luôn có độ lớn bằng 0."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) Đúng: đó là nội dung định luật III Newton. b) Đúng: khối lượng là số đo mức quán tính. c) Sai: vật chịu lực cân bằng có thể đứng yên hoặc chuyển động thẳng đều. d) Sai: lực ma sát nghỉ có độ lớn bằng lực đẩy/kéo ngoài và có thể khác 0 khi vật đứng yên.",
    "points": 1,
    "tags": [
      "Định luật Newton",
      "Lực ma sát",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly1011-05",
    "subject": "Vật lí",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Một vật nhỏ trượt không ma sát từ đỉnh xuống chân một mặt phẳng nghiêng có góc $30^\\circ$ so với phương ngang như hình bên dưới. Chiều dài mặt phẳng nghiêng là 20 m, vận tốc đầu bằng 0. Lấy $g = 10$ m/s². Thời gian vật trượt hết mặt phẳng nghiêng là",
    "options": [
      {
        "key": "A",
        "text": "2,83 s"
      },
      {
        "key": "B",
        "text": "2,00 s"
      },
      {
        "key": "C",
        "text": "4,00 s"
      },
      {
        "key": "D",
        "text": "5,66 s"
      }
    ],
    "answer": "A",
    "explanation": "Gia tốc $a=g\\sin 30^\\circ=5$ m/s². Từ $s=\\frac{1}{2}at^2$: $t=\\sqrt{\\frac{2s}{a}}=\\sqrt{\\frac{40}{5}}=2\\sqrt{2}\\approx 2{,}83$ s.",
    "points": 0.25,
    "tags": [
      "Mặt phẳng nghiêng",
      "Động lực học",
      "VD"
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
    "id": "thpt-ly1011-06",
    "subject": "Vật lí",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một vật khối lượng 2 kg trượt xuống mặt phẳng nghiêng góc $30^\\circ$ so với phương ngang như hình bên dưới; hệ số ma sát trượt giữa vật và mặt phẳng nghiêng là 0,2. Lấy $g = 10$ m/s². Gia tốc của vật (m/s²) làm tròn đến hai chữ số thập phân là bao nhiêu?",
    "answer": "3,27",
    "explanation": "Định luật II Newton theo phương dốc: $mg\\sin\\alpha-\\mu mg\\cos\\alpha=ma$, suy ra $a=g(\\sin\\alpha-\\mu\\cos\\alpha)=10(0{,}5-0{,}2\\cdot 0{,}866)\\approx 3{,}27$ m/s².",
    "points": 0.5,
    "tags": [
      "Mặt phẳng nghiêng",
      "Ma sát trượt",
      "VD"
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
    "id": "thpt-ly1011-07",
    "subject": "Vật lí",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Một cần cẩu nâng đều vật khối lượng 200 kg lên cao 10 m trong thời gian 20 s. Lấy $g = 10$ m/s². Xét các phát biểu sau. Với mỗi ý, chọn Đúng (Đ) hoặc Sai (S).",
    "options": [
      {
        "key": "a",
        "text": "Công của trọng lực tác dụng lên vật trong quá trình nâng là $-20$ kJ."
      },
      {
        "key": "b",
        "text": "Công suất trung bình của lực nâng là 1 kW."
      },
      {
        "key": "c",
        "text": "Nếu thời gian nâng là 40 s thì công suất trung bình của lực nâng là 2 kW."
      },
      {
        "key": "d",
        "text": "Nếu hiệu suất của động cơ cần cẩu là 80% thì công toàn phần động cơ tiêu thụ là 25 kJ."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: $A_P=-mgh=-200\\cdot 10\\cdot 10=-20\\,000$ J. b) Đúng: lực nâng đều bằng trọng lực nên $A=20$ kJ, $P=\\frac{A}{t}=1000$ W. c) Sai: khi $t=40$ s thì $P=\\frac{20\\,000}{40}=500$ W = 0,5 kW. d) Đúng: $A_{\\text{tp}}=\\frac{A_{\\text{ích}}}{H}=\\frac{20}{0{,}8}=25$ kJ.",
    "points": 1,
    "tags": [
      "Công",
      "Công suất",
      "Hiệu suất",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly1011-08",
    "subject": "Vật lí",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một vật nhỏ được thả rơi tự do từ độ cao 45 m so với mặt đất, bỏ qua sức cản không khí. Lấy $g = 10$ m/s², mốc thế năng tại mặt đất. Khi động năng bằng hai lần thế năng, tốc độ của vật (m/s) làm tròn đến một chữ số thập phân là bao nhiêu?",
    "answer": "24,5",
    "explanation": "Cơ năng bảo toàn: $mgH=mgh+W_đ=3mgh$ nên $h=15$ m. Khi đó $v=\\sqrt{2g(H-h)}=\\sqrt{600}\\approx 24{,}5$ m/s.",
    "points": 0.5,
    "tags": [
      "Cơ năng",
      "Bảo toàn cơ năng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly1011-09",
    "subject": "Vật lí",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Một viên đạn khối lượng 10 g bay theo phương ngang với tốc độ 500 m/s, cắm vào một bao cát khối lượng 1,99 kg đang đứng yên trên mặt phẳng ngang nhẵn và nằm gọn trong bao cát. Bỏ qua khối lượng cát bị bắn ra. Tốc độ của hệ ngay sau va chạm là",
    "options": [
      {
        "key": "A",
        "text": "0,25 m/s"
      },
      {
        "key": "B",
        "text": "5 m/s"
      },
      {
        "key": "C",
        "text": "25 m/s"
      },
      {
        "key": "D",
        "text": "2,5 m/s"
      }
    ],
    "answer": "D",
    "explanation": "Bảo toàn động lượng: $mv=(m+M)v'$, suy ra $v'=\\frac{0{,}01\\cdot 500}{2}=2{,}5$ m/s.",
    "points": 0.25,
    "tags": [
      "Động lượng",
      "Va chạm mềm",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly1011-10",
    "subject": "Vật lí",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Vật $m_1 = 2$ kg chuyển động trên mặt phẳng ngang nhẵn với tốc độ 4 m/s, va chạm đàn hồi xuyên tâm với vật $m_2 = 1$ kg đang đứng yên. Sau va chạm, $m_2$ trượt lên mặt phẳng nghiêng nhẵn góc $30^\\circ$ so với phương ngang như hình bên dưới. Lấy $g = 10$ m/s². Quãng đường lớn nhất $m_2$ đi lên được trên mặt phẳng nghiêng (m), làm tròn đến hai chữ số thập phân, là bao nhiêu?",
    "answer": "2,84",
    "explanation": "Va chạm đàn hồi: $v_2'=\\frac{2m_1}{m_1+m_2}v_1=\\frac{16}{3}$ m/s. Bảo toàn cơ năng trên dốc nhẵn: $s=\\frac{v_2'^2}{2g\\sin 30^\\circ}=\\frac{256/9}{10}\\approx 2{,}84$ m.",
    "points": 0.5,
    "tags": [
      "Động lượng",
      "Va chạm đàn hồi",
      "Mặt phẳng nghiêng",
      "VDC"
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
    "id": "thpt-ly1011-11",
    "subject": "Vật lí",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Một vật được ném ngang từ độ cao 20 m so với mặt đất với tốc độ đầu 10 m/s. Bỏ qua sức cản không khí, lấy $g = 10$ m/s². Xét các phát biểu sau. Với mỗi ý, chọn Đúng (Đ) hoặc Sai (S).",
    "options": [
      {
        "key": "a",
        "text": "Thời gian chuyển động của vật là 4 s."
      },
      {
        "key": "b",
        "text": "Tầm ném xa của vật là 20 m."
      },
      {
        "key": "c",
        "text": "Tốc độ của vật khi chạm đất là 20 m/s."
      },
      {
        "key": "d",
        "text": "Khi chạm đất, vectơ vận tốc hợp với phương ngang một góc xấp xỉ $63{,}4^\\circ$."
      }
    ],
    "answer": "SĐSĐ",
    "explanation": "a) Sai: $t=\\sqrt{\\frac{2h}{g}}=2$ s. b) Đúng: $L=v_0t=20$ m. c) Sai: $v_y=gt=20$ m/s, $v=\\sqrt{10^2+20^2}=\\sqrt{500}\\approx 22{,}4$ m/s. d) Đúng: $\\tan\\alpha=\\frac{v_y}{v_0}=2$, $\\alpha\\approx 63{,}4^\\circ$.",
    "points": 1,
    "tags": [
      "Chuyển động ném ngang",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly1011-12",
    "subject": "Vật lí",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Hai vật có khối lượng $m_1 = 3$ kg và $m_2 = 2$ kg được treo ở hai đầu một sợi dây nhẹ, không giãn, vắt qua ròng rọc nhẹ; bỏ qua ma sát, $m_1$ đi xuống. Lấy $g = 10$ m/s². Lực căng của dây là",
    "options": [
      {
        "key": "A",
        "text": "24 N"
      },
      {
        "key": "B",
        "text": "12 N"
      },
      {
        "key": "C",
        "text": "30 N"
      },
      {
        "key": "D",
        "text": "18 N"
      }
    ],
    "answer": "A",
    "explanation": "Gia tốc $a=\\frac{(m_1-m_2)g}{m_1+m_2}=2$ m/s². Với vật $m_2$: $T-m_2g=m_2a$, suy ra $T=m_2(g+a)=24$ N.",
    "points": 0.25,
    "tags": [
      "Động lực học",
      "Hệ vật – ròng rọc",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly1011-13",
    "subject": "Vật lí",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Một thùng hàng khối lượng 20 kg được kéo đều trên sàn nhà nằm ngang bằng lực $F = 50$ N theo phương ngang, thùng đi được quãng đường 10 m. Xét các phát biểu sau. Với mỗi ý, chọn Đúng (Đ) hoặc Sai (S).",
    "options": [
      {
        "key": "a",
        "text": "Công của lực kéo $F$ bằng 500 J."
      },
      {
        "key": "b",
        "text": "Công của lực ma sát bằng $+500$ J."
      },
      {
        "key": "c",
        "text": "Công của trọng lực bằng 2000 J."
      },
      {
        "key": "d",
        "text": "Tổng công của các lực tác dụng lên thùng bằng 0."
      }
    ],
    "answer": "ĐSSĐ",
    "explanation": "a) Đúng: $A=Fs=50\\cdot 10=500$ J. b) Sai: ma sát cản chuyển động nên công âm, $-500$ J. c) Sai: trọng lực vuông góc với phương chuyển động nên công bằng 0. d) Đúng: thùng chuyển động đều nên động năng không đổi, tổng công bằng 0.",
    "points": 1,
    "tags": [
      "Công",
      "Lực ma sát",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly1011-14",
    "subject": "Vật lí",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một viên đạn khối lượng 2 kg đang bay theo phương ngang với tốc độ 10 m/s thì nổ thành hai mảnh có khối lượng bằng nhau. Mảnh thứ nhất bay thẳng đứng xuống dưới với tốc độ 20 m/s; bỏ qua trọng lực trong thời gian nổ. Tốc độ của mảnh thứ hai ngay sau khi nổ (m/s), làm tròn đến một chữ số thập phân, là bao nhiêu?",
    "answer": "28,3",
    "explanation": "Bảo toàn động lượng: $\\vec p_2=\\vec p-\\vec p_1$ với $p=20$ kg·m/s (phương ngang) và $p_1=20$ kg·m/s (thẳng đứng). Suy ra $p_2=\\sqrt{20^2+20^2}\\approx 28{,}3$ kg·m/s; khối lượng mảnh là 1 kg nên $v_2\\approx 28{,}3$ m/s.",
    "points": 0.5,
    "tags": [
      "Động lượng",
      "Nổ",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly1011-15",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Một vật dao động điều hoà theo phương trình $x=5\\cos(4\\pi t)$ (cm), $t$ tính bằng giây. Chu kỳ dao động của vật là",
    "options": [
      {
        "key": "A",
        "text": "$4\\pi$ s"
      },
      {
        "key": "B",
        "text": "2 s"
      },
      {
        "key": "C",
        "text": "0,5 s"
      },
      {
        "key": "D",
        "text": "0,25 s"
      }
    ],
    "answer": "C",
    "explanation": "Tần số góc $\\omega=4\\pi$ rad/s, nên $T=\\frac{2\\pi}{\\omega}=0{,}5$ s.",
    "points": 0.25,
    "tags": [
      "Dao động điều hoà",
      "Chu kỳ",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly1011-16",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Đồ thị li độ – thời gian của một vật dao động điều hoà như hình bên dưới ($x$ tính bằng cm, $t$ tính bằng s). Biên độ và chu kỳ dao động của vật lần lượt là",
    "options": [
      {
        "key": "A",
        "text": "$A = 2$ cm; $T = 4$ s"
      },
      {
        "key": "B",
        "text": "$A = 4$ cm; $T = 4$ s"
      },
      {
        "key": "C",
        "text": "$A = 8$ cm; $T = 4$ s"
      },
      {
        "key": "D",
        "text": "$A = 4$ cm; $T = 2$ s"
      }
    ],
    "answer": "B",
    "explanation": "Từ đồ thị, biên độ $A=4$ cm. Trên đoạn $[0; 8]$ s có hai chu kỳ đầy đủ nên $T=4$ s.",
    "points": 0.25,
    "tags": [
      "Dao động điều hoà",
      "Đồ thị li độ–thời gian",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "4*cos(1.5708*x)"
      ],
      "xMin": 0,
      "xMax": 8
    }
  },
  {
    "id": "thpt-ly1011-17",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một con lắc lò xo gồm vật nhỏ khối lượng 0,4 kg và lò xo có độ cứng $k = 100$ N/m, dao động điều hoà với biên độ $A = 5$ cm. Khi động năng bằng 3 lần thế năng, tốc độ của vật (m/s) làm tròn đến hai chữ số thập phân là bao nhiêu?",
    "answer": "0,68",
    "explanation": "$\\omega=\\sqrt{\\frac{k}{m}}=5\\sqrt{10}$ rad/s. Khi $W_đ=3W_t$ thì $|x|=\\frac{A}{2}$, nên $v=\\omega\\sqrt{A^2-x^2}=\\omega A\\frac{\\sqrt{3}}{2}\\approx 0{,}68$ m/s.",
    "points": 0.5,
    "tags": [
      "Con lắc lò xo",
      "Năng lượng dao động",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly1011-18",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một sóng cơ có tần số 50 Hz lan truyền trong một môi trường với tốc độ 4 m/s. Bước sóng của sóng (m) là bao nhiêu?",
    "answer": "0,08",
    "explanation": "$\\lambda=\\frac{v}{f}=\\frac{4}{50}=0{,}08$ m.",
    "points": 0.5,
    "tags": [
      "Sóng cơ",
      "Bước sóng",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly1011-19",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Một sợi dây đàn hồi dài 60 cm, hai đầu cố định, đang có sóng dừng. Trên dây quan sát được 4 nút sóng (kể cả hai nút ở hai đầu dây). Bước sóng trên dây là",
    "options": [
      {
        "key": "A",
        "text": "20 cm"
      },
      {
        "key": "B",
        "text": "30 cm"
      },
      {
        "key": "C",
        "text": "40 cm"
      },
      {
        "key": "D",
        "text": "60 cm"
      }
    ],
    "answer": "C",
    "explanation": "4 nút tương ứng 3 bó sóng: $L=3\\cdot\\frac{\\lambda}{2}$, suy ra $\\lambda=\\frac{2L}{3}=40$ cm.",
    "points": 0.25,
    "tags": [
      "Sóng dừng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly1011-20",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Trên mặt nước, hai nguồn sóng kết hợp $S_1$, $S_2$ dao động cùng pha, cùng tần số, cách nhau $S_1S_2 = 16$ cm, tạo ra sóng có bước sóng $\\lambda = 4$ cm. Xét các phát biểu sau. Với mỗi ý, chọn Đúng (Đ) hoặc Sai (S).",
    "options": [
      {
        "key": "a",
        "text": "Trên đoạn $S_1S_2$ có 9 điểm dao động với biên độ cực đại, kể cả hai nguồn."
      },
      {
        "key": "b",
        "text": "Trên đoạn $S_1S_2$, không kể hai nguồn, có 8 điểm dao động với biên độ cực đại."
      },
      {
        "key": "c",
        "text": "Điểm $M$ cách $S_1$ là 10 cm và cách $S_2$ là 6 cm nằm trên một cực tiểu giao thoa."
      },
      {
        "key": "d",
        "text": "Nếu tăng tần số dao động của hai nguồn thì số điểm cực đại trên đoạn $S_1S_2$ tăng."
      }
    ],
    "answer": "ĐSSĐ",
    "explanation": "Cực đại: $d_1-d_2=k\\lambda$ với $|k\\lambda|\\le S_1S_2$, tức $|k|\\le 4$. a) Đúng: có 9 giá trị $k$ (kể cả $k=\\pm 4$ tại hai nguồn). b) Sai: không kể nguồn còn 7 điểm. c) Sai: $d_1-d_2=4=1\\cdot\\lambda$ nên M nằm trên cực đại. d) Đúng: tăng tần số thì $\\lambda$ giảm, $|k|$ tối đa tăng nên số cực đại tăng.",
    "points": 1,
    "tags": [
      "Giao thoa sóng",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly1011-21",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Một điện tích điểm $q = 2\\cdot 10^{-6}$ C đặt tại điểm có cường độ điện trường $E = 5000$ V/m. Độ lớn lực điện tác dụng lên điện tích là",
    "options": [
      {
        "key": "A",
        "text": "0,1 N"
      },
      {
        "key": "B",
        "text": "0,001 N"
      },
      {
        "key": "C",
        "text": "10 N"
      },
      {
        "key": "D",
        "text": "0,01 N"
      }
    ],
    "answer": "D",
    "explanation": "$F=|q|E=2\\cdot 10^{-6}\\cdot 5000=10^{-2}$ N.",
    "points": 0.25,
    "tags": [
      "Điện trường",
      "Lực điện",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly1011-22",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Điện trường đều có cường độ $E = 2000$ V/m. Hai điểm M, N nằm trên cùng một đường sức, cách nhau 5 cm. Hiệu điện thế giữa M và N có độ lớn là",
    "options": [
      {
        "key": "A",
        "text": "100 V"
      },
      {
        "key": "B",
        "text": "40 V"
      },
      {
        "key": "C",
        "text": "400 V"
      },
      {
        "key": "D",
        "text": "10 V"
      }
    ],
    "answer": "A",
    "explanation": "$U=Ed=2000\\cdot 0{,}05=100$ V.",
    "points": 0.25,
    "tags": [
      "Điện trường đều",
      "Hiệu điện thế",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly1011-23",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một electron (khối lượng $m=9{,}1\\cdot 10^{-31}$ kg, điện tích $|e|=1{,}6\\cdot 10^{-19}$ C) đi từ trạng thái nghỉ, được tăng tốc bởi hiệu điện thế $U = 100$ V. Tốc độ của electron sau khi được tăng tốc, tính theo đơn vị $10^6$ m/s và làm tròn đến hai chữ số thập phân, là bao nhiêu?",
    "answer": "5,93",
    "explanation": "Định lí động năng: $\\frac{1}{2}mv^2=|e|U$, suy ra $v=\\sqrt{\\frac{2|e|U}{m}}\\approx 5{,}93\\cdot 10^6$ m/s.",
    "points": 0.5,
    "tags": [
      "Điện trường",
      "Chuyển động của hạt trong điện trường",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly1011-24",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Một tụ điện phẳng không khí có điện dung $C = 2$ μF được nối với nguồn điện có hiệu điện thế $U = 12$ V. Sau đó ngắt tụ khỏi nguồn rồi tăng khoảng cách giữa hai bản tụ lên gấp đôi. Xét các phát biểu sau. Với mỗi ý, chọn Đúng (Đ) hoặc Sai (S).",
    "options": [
      {
        "key": "a",
        "text": "Điện tích của tụ khi còn nối với nguồn là 24 μC."
      },
      {
        "key": "b",
        "text": "Sau khi ngắt khỏi nguồn, điện tích của tụ giảm còn một nửa khi tăng khoảng cách hai bản."
      },
      {
        "key": "c",
        "text": "Điện dung của tụ sau khi tăng khoảng cách là 1 μF."
      },
      {
        "key": "d",
        "text": "Hiệu điện thế giữa hai bản tụ sau khi tăng khoảng cách là 24 V."
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) Đúng: $Q=CU=24$ μC. b) Sai: sau khi ngắt nguồn, điện tích không đổi. c) Đúng: $C=\\frac{\\varepsilon S}{4\\pi kd}$ tỉ lệ nghịch với $d$ nên $C'=1$ μF. d) Đúng: $U'=\\frac{Q}{C'}=24$ V.",
    "points": 1,
    "tags": [
      "Tụ điện",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly1011-25",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho mạch điện như hình bên dưới. Cường độ dòng điện chạy trong mạch chính là",
    "options": [
      {
        "key": "A",
        "text": "1 A"
      },
      {
        "key": "B",
        "text": "2 A"
      },
      {
        "key": "C",
        "text": "2,4 A"
      },
      {
        "key": "D",
        "text": "12 A"
      }
    ],
    "answer": "B",
    "explanation": "Định luật Ôm toàn mạch: $I=\\frac{E}{R+r}=\\frac{12}{5+1}=2$ A.",
    "points": 0.25,
    "tags": [
      "Định luật Ôm toàn mạch",
      "Mạch điện",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "circuit",
      "text": "nguồn E = 12 V, r = 1 Ω\nR = 5 Ω"
    }
  },
  {
    "id": "thpt-ly1011-26",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho mạch điện như hình bên dưới. Cường độ dòng điện qua điện trở $R_1$ (A) làm tròn đến hai chữ số thập phân là bao nhiêu?",
    "answer": "1,71",
    "explanation": "$R_{23}=\\frac{6\\cdot 3}{6+3}=2\\ \\Omega$, $I=\\frac{E}{R_1+R_{23}+r}=\\frac{12}{7}\\approx 1{,}71$ A; đây cũng là cường độ qua $R_1$ vì $R_1$ nối tiếp với cụm song song.",
    "points": 0.5,
    "tags": [
      "Mạch điện hỗn hợp",
      "Định luật Ôm",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "circuit",
      "text": "nguồn E = 12 V, r = 1 Ω\nR1=4Ω - (R2=6Ω // R3=3Ω)"
    }
  },
  {
    "id": "thpt-ly1011-27",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cho mạch điện như hình bên dưới. Xét các phát biểu sau. Với mỗi ý, chọn Đúng (Đ) hoặc Sai (S).",
    "options": [
      {
        "key": "a",
        "text": "Cường độ dòng điện trong mạch chính là 1,8 A."
      },
      {
        "key": "b",
        "text": "Hiệu điện thế giữa hai đầu mạch ngoài là 7,2 V."
      },
      {
        "key": "c",
        "text": "Cường độ dòng điện qua $R_2$ là 0,6 A."
      },
      {
        "key": "d",
        "text": "Công suất tỏa nhiệt trên $R_3$ là 2,16 W."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "$R_N=R_1+\\frac{R_2R_3}{R_2+R_3}=2+2=4\\ \\Omega$, $I=\\frac{9}{4+1}=1{,}8$ A. a) Đúng. b) Đúng: $U_N=IR_N=7{,}2$ V. c) Sai: $U_{23}=1{,}8\\cdot 2=3{,}6$ V nên $I_2=\\frac{3{,}6}{3}=1{,}2$ A. d) Đúng: $I_3=\\frac{3{,}6}{6}=0{,}6$ A, $P_3=3{,}6\\cdot 0{,}6=2{,}16$ W.",
    "points": 1,
    "tags": [
      "Mạch điện hỗn hợp",
      "Công suất điện",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "circuit",
      "text": "nguồn E = 9 V, r = 1 Ω\nR1=2Ω - (R2=3Ω // R3=6Ω)"
    }
  },
  {
    "id": "thpt-ly1011-28",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Một nguồn điện có suất điện động $E = 12$ V, điện trở trong $r = 2\\ \\Omega$ mắc nối tiếp với một biến trở $R$ và một bóng đèn ghi 6 V – 6 W. Điều chỉnh biến trở để đèn sáng bình thường. Giá trị của biến trở khi đó là",
    "options": [
      {
        "key": "A",
        "text": "2 Ω"
      },
      {
        "key": "B",
        "text": "6 Ω"
      },
      {
        "key": "C",
        "text": "8 Ω"
      },
      {
        "key": "D",
        "text": "4 Ω"
      }
    ],
    "answer": "D",
    "explanation": "Đèn sáng bình thường: $I=\\frac{P}{U}=1$ A và $R_đ=\\frac{U^2}{P}=6\\ \\Omega$. Định luật Ôm toàn mạch: $I=\\frac{E}{R_đ+R+r}$ nên $R=\\frac{E}{I}-R_đ-r=12-6-2=4\\ \\Omega$.",
    "points": 0.25,
    "tags": [
      "Định luật Ôm toàn mạch",
      "Công suất định mức",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly1011-29",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một con lắc lò xo gồm vật nhỏ khối lượng 0,5 kg và lò xo có độ cứng $k = 200$ N/m dao động điều hoà trên trục Ox. Khi vật đi qua vị trí có li độ $x = 3$ cm thì tốc độ của vật là 0,4 m/s. Biên độ dao động của vật (cm), làm tròn đến hai chữ số thập phân, là bao nhiêu?",
    "answer": "3,61",
    "explanation": "$\\omega=\\sqrt{\\frac{k}{m}}=20$ rad/s. $A=\\sqrt{x^2+\\frac{v^2}{\\omega^2}}=\\sqrt{3^2+2^2}\\approx 3{,}61$ cm.",
    "points": 0.5,
    "tags": [
      "Con lắc lò xo",
      "Hệ thức độc lập thời gian",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly1011-30",
    "subject": "Vật lí",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Hai điểm M, N nằm trên cùng một đường sức của điện trường đều có cường độ $E = 500$ V/m, $MN = 8$ cm; M gần bản dương hơn N. Xét các phát biểu sau. Với mỗi ý, chọn Đúng (Đ) hoặc Sai (S).",
    "options": [
      {
        "key": "a",
        "text": "Hiệu điện thế giữa M và N là $U_{MN}=40$ V."
      },
      {
        "key": "b",
        "text": "Công của lực điện khi proton di chuyển từ M đến N là $6{,}4\\cdot 10^{-18}$ J."
      },
      {
        "key": "c",
        "text": "Công của lực điện khi electron di chuyển từ M đến N là $+6{,}4\\cdot 10^{-18}$ J."
      },
      {
        "key": "d",
        "text": "Cường độ điện trường tại N bằng 500 V/m."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "$U_{MN}=Ed=500\\cdot 0{,}08=40$ V. a) Đúng. b) Đúng: $A=qU_{MN}=1{,}6\\cdot 10^{-19}\\cdot 40=6{,}4\\cdot 10^{-18}$ J. c) Sai: với electron $A=-|e|U_{MN}<0$. d) Đúng: điện trường đều có cường độ không đổi.",
    "points": 1,
    "tags": [
      "Điện trường đều",
      "Công của lực điện",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly12-01",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Nhiệt lượng cần cung cấp để làm nóng chảy hoàn toàn 2 kg chất rắn ở nhiệt độ nóng chảy, biết nhiệt nóng chảy riêng của chất đó là $\\lambda = 1{,}8\\cdot10^5$ J/kg, bằng bao nhiêu?",
    "options": [
      {
        "key": "A",
        "text": "$9\\cdot10^4$ J"
      },
      {
        "key": "B",
        "text": "$2{,}5\\cdot10^5$ J"
      },
      {
        "key": "C",
        "text": "$3{,}6\\cdot10^5$ J"
      },
      {
        "key": "D",
        "text": "$1{,}8\\cdot10^5$ J"
      }
    ],
    "answer": "C",
    "explanation": "Nhiệt lượng để nóng chảy hoàn toàn: $Q = \\lambda m = 1{,}8\\cdot10^5 \\cdot 2 = 3{,}6\\cdot10^5$ J. Phương án D là lấy đúng nhiệt nóng chảy riêng nhưng quên nhân với khối lượng.",
    "points": 0.25,
    "tags": [
      "nhiệt học",
      "nóng chảy",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly12-02",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Hình bên dưới biểu diễn hai trạng thái 1 và 2 của một lượng khí lí tưởng xác định trong hệ tọa độ p–V (p tính bằng atm, V tính bằng lít). Quá trình 1 → 2 là đẳng nhiệt. Biết khí ở trạng thái 1 có nhiệt độ $T_1 = 300$ K và $R = 0{,}082$ L·atm/(mol·K). Số mol khí trong bình là bao nhiêu?",
    "options": [
      {
        "key": "A",
        "text": "0,16 mol"
      },
      {
        "key": "B",
        "text": "0,016 mol"
      },
      {
        "key": "C",
        "text": "1,63 mol"
      },
      {
        "key": "D",
        "text": "0,33 mol"
      }
    ],
    "answer": "A",
    "explanation": "Từ hình, trạng thái 1 có $p_1 = 4$ atm, $V_1 = 1$ L. Áp dụng $pV = nRT$: $n = \\dfrac{p_1V_1}{RT_1} = \\dfrac{4\\cdot1}{0{,}082\\cdot300} \\approx 0{,}16$ mol. Phương án B lệch dấu thập phân; C dùng nhầm $T = 30$ K; D dùng nhầm $T = 150$ K.",
    "points": 0.25,
    "tags": [
      "khí lí tưởng",
      "phương trình trạng thái",
      "đồ thị p–V",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "gas",
      "axes": "pV",
      "states": "1: (1; 4)\n2: (4; 1)",
      "processes": "1-2: đẳng nhiệt",
      "ticks": "value"
    }
  },
  {
    "id": "thpt-ly12-03",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Dòng điện thẳng, dài vô hạn có cường độ $I = 5$ A đặt trong chân không. Cảm ứng từ tại điểm M cách dây 10 cm có độ lớn bằng bao nhiêu? Lấy $\\mu_0 = 4\\pi\\cdot10^{-7}$ H/m.",
    "options": [
      {
        "key": "A",
        "text": "$2\\cdot10^{-5}$ T"
      },
      {
        "key": "B",
        "text": "$5\\cdot10^{-6}$ T"
      },
      {
        "key": "C",
        "text": "$10^{-6}$ T"
      },
      {
        "key": "D",
        "text": "$10^{-5}$ T"
      }
    ],
    "answer": "D",
    "explanation": "$B = \\dfrac{\\mu_0 I}{2\\pi r} = 2\\cdot10^{-7}\\cdot\\dfrac{5}{0{,}1} = 10^{-5}$ T. Phương án A dùng nhầm $r = 5$ cm (hoặc nhân thừa hệ số 2); B dùng công thức thiếu hệ số 2 ($\\mu_0 I/(4\\pi r)$); C quên chia cho $r$.",
    "points": 0.25,
    "tags": [
      "từ trường",
      "dòng điện thẳng dài",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly12-04",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một bình kín chứa khí lí tưởng ở 27 °C với áp suất 1,2 atm. Đun nóng khí trong bình (thể tích không đổi) đến 127 °C, sau đó mở một van nhỏ để khí thoát ra ngoài ở nhiệt độ không đổi 127 °C cho đến khi áp suất trong bình còn 1,2 atm. Tỉ số giữa khối lượng khí còn lại trong bình và khối lượng khí ban đầu là bao nhiêu?",
    "options": [
      {
        "key": "A",
        "text": "0,50"
      },
      {
        "key": "B",
        "text": "0,75"
      },
      {
        "key": "C",
        "text": "0,80"
      },
      {
        "key": "D",
        "text": "1,33"
      }
    ],
    "answer": "B",
    "explanation": "Đẳng tích từ 300 K đến 400 K: $p_2 = p_1\\dfrac{T_2}{T_1} = 1{,}2\\cdot\\dfrac{400}{300} = 1{,}6$ atm. Khi thoát khí ở thể tích và nhiệt độ không đổi, khối lượng khí tỉ lệ với áp suất, nên tỉ số cần tìm là $\\dfrac{1{,}2}{1{,}6} = 0{,}75$. Phương án D là nghịch đảo của đáp số; A và C do làm tròn hoặc tính sai bước đẳng tích.",
    "points": 0.25,
    "tags": [
      "khí lí tưởng",
      "đẳng tích",
      "đẳng nhiệt",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly12-05",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Thả một miếng nhôm khối lượng 0,5 kg ở 120 °C vào 2 kg nước ở 20 °C, đựng trong một nhiệt lượng kế có nhiệt dung không đáng kể. Bỏ qua mất mát nhiệt ra môi trường. Biết nhiệt dung riêng của nhôm là 880 J/(kg·K) và của nước là 4200 J/(kg·K). Nhiệt độ cân bằng của hệ gần nhất với giá trị nào?",
    "options": [
      {
        "key": "A",
        "text": "25,0 °C"
      },
      {
        "key": "B",
        "text": "22,5 °C"
      },
      {
        "key": "C",
        "text": "30,0 °C"
      },
      {
        "key": "D",
        "text": "40,0 °C"
      }
    ],
    "answer": "A",
    "explanation": "Phương trình cân bằng nhiệt: $m_1c_1(120 - t) = m_2c_2(t - 20)$ với $m_1c_1 = 440$ J/K và $m_2c_2 = 8400$ J/K. Suy ra $t \\approx 24{,}98\\,^\\circ$C, làm tròn thành 25,0 °C. Các phương án còn lại là kết quả khi bỏ sót một hệ số nhiệt dung hoặc nhầm dấu trong phương trình.",
    "points": 0.25,
    "tags": [
      "nhiệt lượng",
      "phương trình cân bằng nhiệt",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly12-06",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Hình bên dưới là đồ thị biểu diễn sự biến thiên của từ thông Φ qua một vòng dây dẫn kín, phẳng theo thời gian t. Độ lớn suất điện động cảm ứng xuất hiện trong vòng dây trong khoảng thời gian từ 0 đến 0,5 s là bao nhiêu?",
    "options": [
      {
        "key": "A",
        "text": "10 mV"
      },
      {
        "key": "B",
        "text": "5 mV"
      },
      {
        "key": "C",
        "text": "40 mV"
      },
      {
        "key": "D",
        "text": "20 mV"
      }
    ],
    "answer": "D",
    "explanation": "Trong 0 → 0,5 s, từ thông tăng từ 0 đến 10 mWb = $10^{-2}$ Wb. Theo định luật Faraday: $|e| = \\dfrac{|\\Delta\\Phi|}{\\Delta t} = \\dfrac{10^{-2}}{0{,}5} = 0{,}02$ V = 20 mV. Phương án A bỏ qua $\\Delta t$; B dùng nhầm $\\Delta t = 2$ s; C dùng nhầm $\\Delta t = 0{,}25$ s.",
    "points": 0.25,
    "tags": [
      "cảm ứng điện từ",
      "định luật Faraday",
      "đồ thị Φ–t",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "motion",
      "yName": "Φ (mWb)",
      "tName": "t (s)",
      "points": "(0; 0) (0,5; 10) (1,0; 10) (1,5; 4)"
    }
  },
  {
    "id": "thpt-ly12-07",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Chất phóng xạ có chu kì bán rã 8 ngày. Ban đầu một mẫu chất này có khối lượng 40 g. Sau 24 ngày, khối lượng chất phóng xạ còn lại trong mẫu là bao nhiêu?",
    "options": [
      {
        "key": "A",
        "text": "10 g"
      },
      {
        "key": "B",
        "text": "5 g"
      },
      {
        "key": "C",
        "text": "2,5 g"
      },
      {
        "key": "D",
        "text": "20 g"
      }
    ],
    "answer": "B",
    "explanation": "Số chu kì bán rã: $24/8 = 3$. Khối lượng còn lại: $m = m_0\\cdot2^{-3} = 40/8 = 5$ g. Phương án A chỉ tính 2 chu kì; C tính 4 chu kì; D chỉ tính 1 chu kì.",
    "points": 0.25,
    "tags": [
      "hạt nhân",
      "chu kì bán rã",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly12-08",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Khí lí tưởng được nhốt trong một xi lanh thẳng đứng bởi một pit-tông có khối lượng 10 kg và diện tích 50 cm², khí nằm phía dưới pit-tông. Ban đầu chiều cao cột khí là 20 cm, nhiệt độ 300 K. Áp suất khí quyển $p_0 = 10^5$ Pa, bỏ qua ma sát, lấy $g = 10$ m/s². Nung nóng khí chậm đến khi pit-tông đi lên thêm 4 cm. Công do khí thực hiện trong quá trình này là bao nhiêu?",
    "options": [
      {
        "key": "A",
        "text": "20 J"
      },
      {
        "key": "B",
        "text": "2,4 J"
      },
      {
        "key": "C",
        "text": "24 J"
      },
      {
        "key": "D",
        "text": "4 J"
      }
    ],
    "answer": "C",
    "explanation": "Pit-tông cân bằng nên áp suất khí không đổi: $p = p_0 + \\dfrac{mg}{S} = 10^5 + \\dfrac{10\\cdot10}{5\\cdot10^{-3}} = 1{,}2\\cdot10^5$ Pa. Độ tăng thể tích: $\\Delta V = S\\,\\Delta h = 5\\cdot10^{-3}\\cdot0{,}04 = 2\\cdot10^{-4}$ m³. Công: $A = p\\Delta V = 1{,}2\\cdot10^5\\cdot2\\cdot10^{-4} = 24$ J. Phương án A bỏ qua áp lực do pit-tông (chỉ dùng $p_0$).",
    "points": 0.25,
    "tags": [
      "khí lí tưởng",
      "đẳng áp",
      "công của khí",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly12-09",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một êlectron (điện tích $-1{,}6\\cdot10^{-19}$ C, khối lượng $9{,}1\\cdot10^{-31}$ kg) bay với vận tốc $2\\cdot10^6$ m/s vuông góc với các đường sức của một từ trường đều có cảm ứng từ $B = 0{,}01$ T. Bán kính quỹ đạo của êlectron gần nhất với giá trị nào?",
    "options": [
      {
        "key": "A",
        "text": "1,14 mm"
      },
      {
        "key": "B",
        "text": "1,14 cm"
      },
      {
        "key": "C",
        "text": "0,11 mm"
      },
      {
        "key": "D",
        "text": "11,4 mm"
      }
    ],
    "answer": "A",
    "explanation": "Lực Lo-ren-xơ đóng vai trò lực hướng tâm: $|q|vB = \\dfrac{mv^2}{r}$, suy ra $r = \\dfrac{mv}{|q|B} = \\dfrac{9{,}1\\cdot10^{-31}\\cdot2\\cdot10^6}{1{,}6\\cdot10^{-19}\\cdot0{,}01} \\approx 1{,}14\\cdot10^{-3}$ m = 1,14 mm. Các phương án B, C, D là lỗi đổi đơn vị.",
    "points": 0.25,
    "tags": [
      "từ trường",
      "lực Lo-ren-xơ",
      "chuyển động trong từ trường",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly12-10",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho mạch điện như hình bên dưới: nguồn điện có suất điện động E và điện trở trong r, cuộn cảm L có điện trở thuần không đáng kể. Sau khi đóng khóa K và dòng điện trong mạch đã ổn định, năng lượng từ trường tích trữ trong cuộn cảm bằng bao nhiêu?",
    "options": [
      {
        "key": "A",
        "text": "1,6 J"
      },
      {
        "key": "B",
        "text": "3,2 J"
      },
      {
        "key": "C",
        "text": "0,4 J"
      },
      {
        "key": "D",
        "text": "0,8 J"
      }
    ],
    "answer": "D",
    "explanation": "Khi dòng điện ổn định, cuộn cảm không cản trở: $I = \\dfrac{E}{R + r} = \\dfrac{6}{2{,}5 + 0{,}5} = 2$ A. Năng lượng từ trường: $W = \\dfrac{1}{2}LI^2 = \\dfrac{1}{2}\\cdot0{,}4\\cdot2^2 = 0{,}8$ J. Phương án A quên hệ số $\\tfrac12$; C quên bình phương $I$; B do tính sai cường độ dòng điện.",
    "points": 0.25,
    "tags": [
      "cảm ứng điện từ",
      "tự cảm",
      "năng lượng từ trường",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "circuit",
      "text": "nguồn E = 6 V, r = 0.5 Ω\nK - L=0.4H - R=2.5Ω"
    }
  },
  {
    "id": "thpt-ly12-11",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Hạt nhân $^{238}_{92}\\text{U}$ phân rã thành hạt nhân bền $^{206}_{82}\\text{Pb}$ sau một chuỗi các phóng xạ $\\alpha$ và $\\beta^-$ (bỏ qua các hạt nhân trung gian). Số lần phóng xạ $\\alpha$ và $\\beta^-$ lần lượt là bao nhiêu?",
    "options": [
      {
        "key": "A",
        "text": "6 lần α; 8 lần $\\beta^-$"
      },
      {
        "key": "B",
        "text": "8 lần α; 6 lần $\\beta^-$"
      },
      {
        "key": "C",
        "text": "8 lần α; 8 lần $\\beta^-$"
      },
      {
        "key": "D",
        "text": "6 lần α; 6 lần $\\beta^-$"
      }
    ],
    "answer": "B",
    "explanation": "Mỗi phóng xạ α giảm số khối 4 và số proton 2; mỗi phóng xạ $\\beta^-$ tăng số proton 1 và không đổi số khối. Từ số khối: $4x = 238 - 206 = 32$, suy ra $x = 8$. Từ số proton: $92 = 82 + 2x - y$, suy ra $y = 6$.",
    "points": 0.25,
    "tags": [
      "hạt nhân",
      "phóng xạ α và β",
      "định luật bảo toàn",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly12-12",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Tia phóng xạ nào sau đây không bị lệch trong điện trường và trong từ trường?",
    "options": [
      {
        "key": "A",
        "text": "Tia α"
      },
      {
        "key": "B",
        "text": "Tia $\\beta^-$"
      },
      {
        "key": "C",
        "text": "Tia $\\gamma$"
      },
      {
        "key": "D",
        "text": "Tia $\\beta^+$"
      }
    ],
    "answer": "C",
    "explanation": "Tia γ là sóng điện từ có bước sóng rất ngắn, không mang điện nên không bị lệch. Tia α, β⁻ và β⁺ đều mang điện nên bị lệch trong điện trường và từ trường.",
    "points": 0.25,
    "tags": [
      "hạt nhân",
      "tia phóng xạ",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly12-13",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Người ta cung cấp nhiệt lượng cho 0,5 kg nước đá ở $-10\\,^\\circ$C để biến nó thành nước ở $20\\,^\\circ$C. Biết nhiệt dung riêng của nước đá là 2100 J/(kg·K), của nước là 4200 J/(kg·K), nhiệt nóng chảy riêng của nước đá là $3{,}4\\cdot10^5$ J/kg. Bỏ qua mất mát nhiệt và nhiệt dung của bình chứa. Xét tính đúng/sai của các phát biểu sau.",
    "options": [
      {
        "key": "a",
        "text": "Nhiệt lượng cần để nước đá tăng nhiệt độ từ −10 °C đến 0 °C là 10 500 J."
      },
      {
        "key": "b",
        "text": "Nhiệt lượng cần để nóng chảy hoàn toàn nước đá ở 0 °C là $1{,}7\\cdot10^5$ J."
      },
      {
        "key": "c",
        "text": "Nhiệt lượng cần để nước tăng nhiệt độ từ 0 °C đến 20 °C là $2{,}1\\cdot10^4$ J."
      },
      {
        "key": "d",
        "text": "Tổng nhiệt lượng cần cung cấp là $2{,}225\\cdot10^5$ J."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: $Q_1 = 0{,}5\\cdot2100\\cdot10 = 10\\,500$ J. b) Đúng: $Q_2 = \\lambda m = 3{,}4\\cdot10^5\\cdot0{,}5 = 1{,}7\\cdot10^5$ J. c) Sai: $Q_3 = 0{,}5\\cdot4200\\cdot20 = 4{,}2\\cdot10^4$ J. d) Đúng: $Q = 10\\,500 + 170\\,000 + 42\\,000 = 222\\,500$ J $= 2{,}225\\cdot10^5$ J.",
    "points": 1,
    "tags": [
      "nhiệt học",
      "nóng chảy",
      "đồ thị t–Q",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly12-14",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Hình bên dưới biểu diễn quá trình biến đổi trạng thái của một lượng khí lí tưởng xác định trong hệ tọa độ p–T (T tính bằng K, p tính bằng atm). Xét tính đúng/sai của các phát biểu sau.",
    "options": [
      {
        "key": "a",
        "text": "Quá trình 1 → 2 là quá trình đẳng tích."
      },
      {
        "key": "b",
        "text": "Thể tích của khí không đổi trong quá trình 2 → 3."
      },
      {
        "key": "c",
        "text": "Thể tích của khí ở trạng thái 3 lớn hơn thể tích ở trạng thái 1."
      },
      {
        "key": "d",
        "text": "Trong quá trình 1 → 2, khí không thực hiện công và nhận nhiệt lượng bằng độ biến thiên nội năng của khí."
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) Đúng: $p$ tăng tỉ lệ với $T$ ($p/T = 1/300 = 2/600$) nên thể tích không đổi. b) Sai: quá trình 2 → 3 là đẳng nhiệt, áp suất giảm từ 2 atm xuống 1 atm nên thể tích tăng gấp đôi. c) Đúng: $V_3 = 2V_2 = 2V_1 > V_1$. d) Đúng: $\\Delta V = 0$ nên $A = 0$, theo nguyên lí I: $Q = \\Delta U$.",
    "points": 1,
    "tags": [
      "khí lí tưởng",
      "đẳng tích",
      "đẳng nhiệt",
      "nguyên lí I",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "gas",
      "axes": "pT",
      "states": "1: (300; 1)\n2: (600; 2)\n3: (600; 1)",
      "processes": "1-2: đẳng tích\n2-3: đẳng nhiệt",
      "ticks": "value"
    }
  },
  {
    "id": "thpt-ly12-15",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một đoạn dây dẫn thẳng dài 20 cm mang dòng điện 4 A, đặt vuông góc với các đường sức của một từ trường đều có cảm ứng từ $B = 0{,}25$ T. Xét tính đúng/sai của các phát biểu sau.",
    "options": [
      {
        "key": "a",
        "text": "Độ lớn lực từ tác dụng lên đoạn dây là 0,2 N."
      },
      {
        "key": "b",
        "text": "Nếu đoạn dây đặt song song với các đường sức từ thì lực từ có độ lớn cực đại 0,2 N."
      },
      {
        "key": "c",
        "text": "Nếu tăng cường độ dòng điện lên 2 lần và giảm chiều dài đoạn dây còn một nửa (vẫn vuông góc với B) thì lực từ tăng gấp đôi."
      },
      {
        "key": "d",
        "text": "Phương của lực từ vuông góc với cả đoạn dây và các đường sức từ."
      }
    ],
    "answer": "ĐSSĐ",
    "explanation": "a) Đúng: $F = BIl = 0{,}25\\cdot4\\cdot0{,}2 = 0{,}2$ N. b) Sai: khi song song, $F = 0$. c) Sai: $F \\propto Il$ không đổi khi $I$ tăng 2 lần và $l$ giảm một nửa. d) Đúng: lực từ vuông góc với mặt phẳng chứa dây và B.",
    "points": 1,
    "tags": [
      "từ trường",
      "lực từ",
      "lực Ampe",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly12-16",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một khung dây dẫn phẳng hình chữ nhật, diện tích $S = 0{,}02$ m², gồm $N = 100$ vòng dây, quay đều với tần số 50 vòng/s quanh một trục nằm trong mặt phẳng khung và vuông góc với các đường sức của một từ trường đều $B = 0{,}1$ T. Xét tính đúng/sai của các phát biểu sau.",
    "options": [
      {
        "key": "a",
        "text": "Từ thông cực đại qua một vòng dây là $2\\cdot10^{-3}$ Wb."
      },
      {
        "key": "b",
        "text": "Suất điện động cảm ứng cực đại trong khung là 62,8 V."
      },
      {
        "key": "c",
        "text": "Tần số của suất điện động cảm ứng là 100 Hz."
      },
      {
        "key": "d",
        "text": "Khi mặt phẳng khung vuông góc với đường sức từ thì suất điện động cảm ứng có độ lớn cực đại."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) Đúng: $\\Phi_0 = BS = 0{,}1\\cdot0{,}02 = 2\\cdot10^{-3}$ Wb. b) Đúng: $E_0 = NBS\\omega = 100\\cdot0{,}1\\cdot0{,}02\\cdot100\\pi \\approx 62{,}8$ V. c) Sai: tần số suất điện động bằng tần số quay, $f = 50$ Hz. d) Sai: khi mặt phẳng khung vuông góc với B, tốc độ biến thiên từ thông bằng 0 nên $e = 0$.",
    "points": 1,
    "tags": [
      "cảm ứng điện từ",
      "khung dây quay",
      "suất điện động xoay chiều",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly12-17",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Đồ thị trong hình bên dưới biểu diễn số hạt nhân còn lại $N$ (đơn vị $10^8$ hạt) của một mẫu chất phóng xạ tại các thời điểm $t$. Xét tính đúng/sai của các phát biểu sau.",
    "options": [
      {
        "key": "a",
        "text": "Chu kì bán rã của chất phóng xạ là 4 ngày."
      },
      {
        "key": "b",
        "text": "Sau 8 ngày, số hạt nhân còn lại trong mẫu là $8\\cdot10^8$ hạt."
      },
      {
        "key": "c",
        "text": "Trong khoảng thời gian từ 4 ngày đến 8 ngày, số hạt nhân bị phân rã là $4\\cdot10^8$ hạt."
      },
      {
        "key": "d",
        "text": "Sau 12 ngày, số hạt nhân còn lại trong mẫu là $4\\cdot10^8$ hạt."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng: $N$ giảm từ $16\\cdot10^8$ còn $8\\cdot10^8$ sau 4 ngày. b) Sai: sau 8 ngày $N = 4\\cdot10^8$ hạt. c) Đúng: $8\\cdot10^8 - 4\\cdot10^8 = 4\\cdot10^8$ hạt. d) Sai: sau 12 ngày $N = 2\\cdot10^8$ hạt.",
    "points": 1,
    "tags": [
      "hạt nhân",
      "chu kì bán rã",
      "đọc bảng số liệu",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "line",
      "title": "Số hạt nhân còn lại theo thời gian",
      "xLabel": "t (ngày)",
      "yLabel": "N (10^8 hạt)",
      "data": "0; 4; 8; 12\nN: 16; 8; 4; 2"
    }
  },
  {
    "id": "thpt-ly12-18",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một lượng khí lí tưởng xác định biến đổi qua hai quá trình như hình bên dưới (p tính bằng atm, V tính bằng lít). Biết khí ở trạng thái 1 có nhiệt độ $T_1 = 300$ K và $R = 0{,}082$ L·atm/(mol·K). Xét tính đúng/sai của các phát biểu sau.",
    "options": [
      {
        "key": "a",
        "text": "Nhiệt độ của khí ở trạng thái 2 bằng 300 K."
      },
      {
        "key": "b",
        "text": "Nhiệt độ của khí ở trạng thái 3 bằng 600 K."
      },
      {
        "key": "c",
        "text": "Trong quá trình 2 → 3, khí nhận công 405 J từ bên ngoài."
      },
      {
        "key": "d",
        "text": "Số mol khí trong bình khoảng 0,16 mol."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: quá trình 1 → 2 đẳng nhiệt vì $p_1V_1 = p_2V_2 = 4$ atm·L. b) Đúng: quá trình 2 → 3 đẳng áp nên $T_3/T_2 = V_3/V_2 = 2$. c) Sai: khí giãn nở và thực hiện công $A = p\\Delta V = 2\\cdot2 = 4$ L·atm $\\approx 405$ J, không nhận công. d) Đúng: $n = \\dfrac{4\\cdot1}{0{,}082\\cdot300} \\approx 0{,}16$ mol.",
    "points": 1,
    "tags": [
      "khí lí tưởng",
      "đồ thị p–V",
      "công của khí",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "gas",
      "axes": "pV",
      "states": "1: (1; 4)\n2: (2; 2)\n3: (4; 2)",
      "processes": "1-2: đẳng nhiệt\n2-3: đẳng áp",
      "ticks": "value"
    }
  },
  {
    "id": "thpt-ly12-19",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một máy biến áp lí tưởng có cuộn sơ cấp 1000 vòng và cuộn thứ cấp 200 vòng. Đặt vào hai đầu cuộn sơ cấp điện áp xoay chiều hiệu dụng 220 V, nối hai đầu cuộn thứ cấp với điện trở $R = 10$ Ω. Xét tính đúng/sai của các phát biểu sau.",
    "options": [
      {
        "key": "a",
        "text": "Điện áp hiệu dụng ở hai đầu cuộn thứ cấp là 110 V."
      },
      {
        "key": "b",
        "text": "Cường độ dòng điện hiệu dụng trong cuộn thứ cấp là 4,4 A."
      },
      {
        "key": "c",
        "text": "Công suất ở cuộn sơ cấp lớn hơn công suất ở cuộn thứ cấp."
      },
      {
        "key": "d",
        "text": "Máy biến áp này là máy hạ áp."
      }
    ],
    "answer": "SĐSĐ",
    "explanation": "a) Sai: $U_2 = U_1 N_2/N_1 = 220\\cdot200/1000 = 44$ V. b) Đúng: $I_2 = U_2/R = 44/10 = 4{,}4$ A. c) Sai: máy biến áp lí tưởng có $P_1 = P_2$. d) Đúng: $N_2 < N_1$ nên điện áp giảm.",
    "points": 1,
    "tags": [
      "cảm ứng điện từ",
      "máy biến áp",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly12-20",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một mẫu chất phóng xạ X có chu kì bán rã $T = 2$ ngày. Ban đầu mẫu có khối lượng 8 g, khối lượng mol của X là 200 g/mol, $N_A = 6{,}02\\cdot10^{23}$ mol⁻¹. Xét tính đúng/sai của các phát biểu sau.",
    "options": [
      {
        "key": "a",
        "text": "Sau 6 ngày, khối lượng chất X còn lại trong mẫu là 1 g."
      },
      {
        "key": "b",
        "text": "Hằng số phóng xạ của X là 0,693 ngày⁻¹."
      },
      {
        "key": "c",
        "text": "Độ phóng xạ ban đầu của mẫu khoảng $9{,}7\\cdot10^{16}$ Bq."
      },
      {
        "key": "d",
        "text": "Sau 4 ngày, số hạt nhân X còn lại trong mẫu là $1{,}2\\cdot10^{22}$ hạt."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng: 6 ngày = 3 chu kì nên $m = 8/2^3 = 1$ g. b) Sai: $\\lambda = \\ln 2/T = 0{,}347$ ngày⁻¹ (0,693 là $\\ln 2$). c) Đúng: $N_0 = \\dfrac{8}{200}\\cdot6{,}02\\cdot10^{23} = 2{,}408\\cdot10^{22}$ hạt, $\\lambda = \\dfrac{\\ln2}{2\\cdot86400} \\approx 4{,}01\\cdot10^{-6}$ s⁻¹, $H_0 = \\lambda N_0 \\approx 9{,}7\\cdot10^{16}$ Bq. d) Sai: sau 4 ngày $N = N_0/4 \\approx 6{,}0\\cdot10^{21}$ hạt.",
    "points": 1,
    "tags": [
      "hạt nhân",
      "độ phóng xạ",
      "chu kì bán rã",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly12-21",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính nhiệt lượng cần cung cấp để đun nóng 0,5 kg nước từ 20 °C lên 40 °C. Biết nhiệt dung riêng của nước là 4200 J/(kg·K). Đáp số tính theo đơn vị kilôjun (kJ).",
    "answer": "42",
    "explanation": "$Q = mc\\Delta t = 0{,}5\\cdot4200\\cdot20 = 42\\,000$ J = 42 kJ.",
    "points": 0.5,
    "tags": [
      "nhiệt học",
      "nhiệt lượng",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly12-22",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một lượng khí lí tưởng có nhiệt độ 127 °C. Nhiệt độ tuyệt đối tương ứng của khí này là bao nhiêu kelvin?",
    "answer": "400",
    "explanation": "$T = t + 273 = 127 + 273 = 400$ K.",
    "points": 0.5,
    "tags": [
      "khí lí tưởng",
      "nhiệt độ tuyệt đối",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly12-23",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một đoạn dây dẫn thẳng dài 0,5 m đặt vuông góc với đường sức của từ trường đều có cảm ứng từ $B = 0{,}2$ T. Dòng điện qua dây có cường độ 2 A. Tính độ lớn lực từ tác dụng lên đoạn dây, theo đơn vị niutơn (N).",
    "answer": "0,2",
    "explanation": "$F = BIl\\sin\\alpha = 0{,}2\\cdot2\\cdot0{,}5\\cdot1 = 0{,}2$ N.",
    "points": 0.5,
    "tags": [
      "từ trường",
      "lực từ",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly12-24",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một thanh dẫn dài 40 cm chuyển động tịnh tiến với vận tốc 5 m/s, vuông góc với các đường sức của từ trường đều có cảm ứng từ 0,2 T. Thanh thuộc một mạch kín. Suất điện động cảm ứng xuất hiện trong thanh có độ lớn bằng bao nhiêu vôn (V)?",
    "answer": "0,4",
    "explanation": "$e = Blv = 0{,}2\\cdot0{,}4\\cdot5 = 0{,}4$ V.",
    "points": 0.5,
    "tags": [
      "cảm ứng điện từ",
      "suất điện động cảm ứng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly12-25",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một bình chứa 20 lít khí lí tưởng ở nhiệt độ 27 °C và áp suất 3 atm. Lấy $R = 0{,}082$ L·atm/(mol·K). Số mol khí trong bình là bao nhiêu mol? Làm tròn kết quả đến một chữ số thập phân.",
    "answer": "2,4",
    "explanation": "$n = \\dfrac{pV}{RT} = \\dfrac{3\\cdot20}{0{,}082\\cdot300} \\approx 2{,}44$ mol, làm tròn 2,4 mol.",
    "points": 0.5,
    "tags": [
      "khí lí tưởng",
      "phương trình trạng thái",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly12-26",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hai chất phóng xạ A và B có chu kì bán rã lần lượt là 2 ngày và 4 ngày. Ban đầu số hạt nhân của hai chất bằng nhau. Sau bao nhiêu ngày thì tỉ số số hạt nhân còn lại $N_A/N_B$ bằng $\\dfrac{1}{4}$?",
    "answer": "8",
    "explanation": "$\\dfrac{N_A}{N_B} = \\dfrac{2^{-t/2}}{2^{-t/4}} = 2^{-t/4} = 2^{-2}$, suy ra $t = 8$ ngày.",
    "points": 0.5,
    "tags": [
      "hạt nhân",
      "chu kì bán rã",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly12-27",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Từ thông qua một vòng dây dẫn kín tăng đều từ 0 đến 0,04 Wb trong thời gian 0,02 s. Độ lớn suất điện động cảm ứng trung bình xuất hiện trong vòng dây là bao nhiêu vôn (V)?",
    "answer": "2",
    "explanation": "$|e_{tb}| = \\dfrac{\\Delta\\Phi}{\\Delta t} = \\dfrac{0{,}04}{0{,}02} = 2$ V.",
    "points": 0.5,
    "tags": [
      "cảm ứng điện từ",
      "định luật Faraday",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly12-28",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một lượng khí lí tưởng xác định ở trạng thái 1 có áp suất 2 atm, thể tích 6 lít và nhiệt độ 300 K. Đưa khí sang trạng thái 2 có áp suất 3 atm và nhiệt độ 400 K. Thể tích của khí ở trạng thái 2 bằng bao nhiêu lít? Làm tròn kết quả đến một chữ số thập phân.",
    "answer": "5,3",
    "explanation": "$V_2 = \\dfrac{p_1V_1T_2}{p_2T_1} = \\dfrac{2\\cdot6\\cdot400}{3\\cdot300} \\approx 5{,}3$ lít.",
    "points": 0.5,
    "tags": [
      "khí lí tưởng",
      "phương trình trạng thái",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly12-29",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một ống dây hình trụ dài 50 cm, gồm 1000 vòng dây, tiết diện ngang 10 cm². Trong ống dây, cường độ dòng điện tăng đều từ 0 đến 2 A trong thời gian 0,1 s. Lấy $\\mu_0 = 4\\pi\\cdot10^{-7}$ H/m và bỏ qua mọi hiện tượng khác. Độ lớn suất điện động tự cảm xuất hiện trong ống dây là bao nhiêu vôn (V)? Làm tròn đến hai chữ số thập phân.",
    "answer": "0,05",
    "explanation": "$L = \\dfrac{\\mu_0N^2S}{l} = \\dfrac{4\\pi\\cdot10^{-7}\\cdot10^6\\cdot10^{-3}}{0{,}5} \\approx 2{,}51\\cdot10^{-3}$ H. $|e_{tc}| = L\\dfrac{\\Delta I}{\\Delta t} = 2{,}51\\cdot10^{-3}\\cdot\\dfrac{2}{0{,}1} \\approx 0{,}05$ V.",
    "points": 0.5,
    "tags": [
      "cảm ứng điện từ",
      "tự cảm",
      "ống dây",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-ly12-30",
    "subject": "Vật lí",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho phản ứng hạt nhân: $^{2}_{1}\\text{H} + {}^{3}_{1}\\text{H} \\to {}^{4}_{2}\\text{He} + {}^{1}_{0}\\text{n}$. Biết khối lượng các hạt nhân: $m_D = 2{,}0141$ u, $m_T = 3{,}0160$ u, $m_{\\alpha} = 4{,}0026$ u, $m_n = 1{,}0087$ u; $1$ u $= 931{,}5$ MeV/c². Năng lượng tỏa ra trong một phản ứng là bao nhiêu MeV? Làm tròn đến một chữ số thập phân.",
    "answer": "17,5",
    "explanation": "$\\Delta m = (m_D + m_T) - (m_\\alpha + m_n) = 5{,}0301 - 5{,}0113 = 0{,}0188$ u. $E = \\Delta m\\cdot931{,}5 \\approx 17{,}5$ MeV.",
    "points": 0.5,
    "tags": [
      "hạt nhân",
      "năng lượng phản ứng hạt nhân",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-mulog-01",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Nghiệm của phương trình $2^{x-1}=8$ là",
    "options": [
      {
        "key": "A",
        "text": "$x=2$"
      },
      {
        "key": "B",
        "text": "$x=3$"
      },
      {
        "key": "C",
        "text": "$x=4$"
      },
      {
        "key": "D",
        "text": "$x=5$"
      }
    ],
    "answer": "C",
    "explanation": "Vì $8=2^3$ nên $2^{x-1}=2^3$, suy ra $x-1=3$, tức $x=4$.",
    "points": 0.25,
    "tags": [
      "Mũ - Logarit",
      "phương trình mũ",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-mulog-02",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Ông An gửi tiết kiệm 100 triệu đồng với lãi suất 7% một năm, tiền lãi được nhập vào vốn sau mỗi năm (lãi kép). Sau đúng 3 năm, khi không rút lãi và không gửi thêm, tổng số tiền (gốc và lãi) ông An nhận được gần nhất với số nào sau đây?",
    "options": [
      {
        "key": "A",
        "text": "121,00 triệu đồng"
      },
      {
        "key": "B",
        "text": "122,50 triệu đồng"
      },
      {
        "key": "C",
        "text": "114,49 triệu đồng"
      },
      {
        "key": "D",
        "text": "130,00 triệu đồng"
      }
    ],
    "answer": "B",
    "explanation": "Số tiền sau $n$ năm là $100(1+0{,}07)^n$. Với $n=3$ ta có $100\\cdot1{,}07^3\\approx122{,}50$ triệu đồng. Phương án A là tính lãi đơn, C là chỉ tính đến năm thứ 2.",
    "points": 0.25,
    "tags": [
      "Mũ - Logarit",
      "lãi suất kép",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-mulog-03",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hàm số $y=x^3-3x+1$ có đồ thị $(C)$. Có bao nhiêu tiếp tuyến của $(C)$ đi qua điểm $A(0;3)$?",
    "options": [
      {
        "key": "A",
        "text": "1"
      },
      {
        "key": "B",
        "text": "0"
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
    "explanation": "Tiếp tuyến tại điểm có hoành độ $x_0$ là $y=(3x_0^2-3)(x-x_0)+x_0^3-3x_0+1$. Thay $x=0$, $y=3$ ta được $-2x_0^3+1=3$, tức $x_0^3=-1$, nên $x_0=-1$ là nghiệm duy nhất. Tiếp tuyến khi đó là $y=3$. Vậy chỉ có 1 tiếp tuyến.",
    "points": 0.25,
    "tags": [
      "Đạo hàm",
      "tiếp tuyến",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-mulog-04",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Một rạp hát có 20 hàng ghế. Hàng đầu tiên có 15 ghế, mỗi hàng sau có nhiều hơn hàng liền trước 2 ghế. Tổng số ghế của rạp là",
    "options": [
      {
        "key": "A",
        "text": "620"
      },
      {
        "key": "B",
        "text": "640"
      },
      {
        "key": "C",
        "text": "710"
      },
      {
        "key": "D",
        "text": "680"
      }
    ],
    "answer": "D",
    "explanation": "Số ghế các hàng lập thành cấp số cộng có $u_1=15$, $d=2$, $n=20$. Tổng $S=\\frac{20}{2}(2\\cdot15+19\\cdot2)=680$.",
    "points": 0.25,
    "tags": [
      "Cấp số cộng",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-mulog-05",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Ông Bình vay ngân hàng 500 triệu đồng với lãi suất 1% mỗi tháng. Ông trả nợ theo hình thức trả góp: mỗi tháng trả số tiền bằng nhau vào cuối tháng và trả hết nợ sau đúng 12 tháng. Số tiền ông Bình phải trả mỗi tháng gần nhất với số nào sau đây?",
    "options": [
      {
        "key": "A",
        "text": "44,42 triệu đồng"
      },
      {
        "key": "B",
        "text": "41,67 triệu đồng"
      },
      {
        "key": "C",
        "text": "45,00 triệu đồng"
      },
      {
        "key": "D",
        "text": "46,11 triệu đồng"
      }
    ],
    "answer": "A",
    "explanation": "Gọi $A=500$, $r=0{,}01$, $n=12$. Số tiền trả mỗi tháng là $m=\\frac{A\\,r(1+r)^n}{(1+r)^n-1}$. Có $(1{,}01)^{12}\\approx1{,}126825$ nên $m\\approx44{,}42$ triệu đồng. Phương án B là chia đều gốc mà bỏ qua tiền lãi.",
    "points": 0.25,
    "tags": [
      "Cấp số nhân",
      "trả góp",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-mulog-06",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hàm số $f(x)=2\\sin x+3$ có đồ thị như hình bên dưới, với $0\\le x\\le 2\\pi$. Số nghiệm của phương trình $f(x)=4$ trên đoạn $[0;2\\pi]$ là",
    "options": [
      {
        "key": "A",
        "text": "1"
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
        "text": "4"
      }
    ],
    "answer": "B",
    "explanation": "$f(x)=4\\Leftrightarrow\\sin x=\\frac12$. Trên $[0;2\\pi]$, phương trình có hai nghiệm $x=\\frac{\\pi}{6}$ và $x=\\frac{5\\pi}{6}$.",
    "points": 0.25,
    "tags": [
      "Hàm lượng giác",
      "phương trình lượng giác",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "2sin(x)+3"
      ],
      "xMin": 0,
      "xMax": 6.3
    }
  },
  {
    "id": "thpt-mulog-07",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Số lượng vi khuẩn trong một mẫu nuôi cấy sau $t$ giờ được mô hình bởi $N(t)=500\\cdot2^{\\frac{t}{3}}$ (con), với $t\\ge0$. Sau khoảng bao lâu (làm tròn đến hàng phần mười) thì số lượng vi khuẩn đạt ít nhất $10^6$ con?",
    "options": [
      {
        "key": "A",
        "text": "30,0 giờ"
      },
      {
        "key": "B",
        "text": "10,9 giờ"
      },
      {
        "key": "C",
        "text": "32,9 giờ"
      },
      {
        "key": "D",
        "text": "36,0 giờ"
      }
    ],
    "answer": "C",
    "explanation": "$500\\cdot2^{t/3}\\ge10^6\\Leftrightarrow2^{t/3}\\ge2000\\Leftrightarrow t\\ge3\\log_2 2000\\approx32{,}9$ giờ. Phương án B là lấy $\\log_2 2000$ mà quên nhân 3.",
    "points": 0.25,
    "tags": [
      "Mũ - Logarit",
      "tăng trưởng",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-mulog-08",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Có bao nhiêu số nguyên thuộc tập nghiệm của bất phương trình $\\log_{\\frac12}(x^2-3x+2)\\ge\\log_{\\frac12}(x+4)$?",
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
        "text": "4"
      },
      {
        "key": "D",
        "text": "3"
      }
    ],
    "answer": "D",
    "explanation": "Điều kiện: $x^2-3x+2>0$ và $x+4>0$, tức $x\\in(-4;1)\\cup(2;+\\infty)$. Vì cơ số $\\frac12<1$ nên bất phương trình tương đương $x^2-3x+2\\le x+4$, tức $2-\\sqrt6\\le x\\le2+\\sqrt6$. Giao các điều kiện được $x\\in[2-\\sqrt6;1)\\cup(2;2+\\sqrt6]$, xấp xỉ $[-0{,}45;1)\\cup(2;4{,}45]$. Các số nguyên là $0$, $3$, $4$.",
    "points": 0.25,
    "tags": [
      "Mũ - Logarit",
      "bất phương trình logarit",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-mulog-09",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=f(x)=x^3-3x^2$ có bảng biến thiên như hình bên dưới. Xét tính đúng sai của các ý sau:",
    "options": [
      {
        "key": "a",
        "text": "$f'(x)=3x^2-6x$."
      },
      {
        "key": "b",
        "text": "Hàm số đồng biến trên khoảng $(2;+\\infty)$."
      },
      {
        "key": "c",
        "text": "Hàm số đạt cực đại tại $x=2$."
      },
      {
        "key": "d",
        "text": "Phương trình $f(x)=-1$ có ba nghiệm phân biệt."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) $f'(x)=3x^2-6x$: Đúng. b) $f'(x)=3x(x-2)>0$ khi $x>2$ hoặc $x<0$, nên hàm số đồng biến trên $(2;+\\infty)$: Đúng. c) $f'$ đổi dấu từ âm sang dương tại $x=2$ nên $x=2$ là điểm cực tiểu, không phải cực đại: Sai. d) Cực đại $f(0)=0$, cực tiểu $f(2)=-4$, đường thẳng $y=-1$ cắt đồ thị tại ba điểm phân biệt: Đúng.",
    "points": 1,
    "tags": [
      "Đạo hàm",
      "khảo sát hàm số",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "vartable",
      "expr": "x^3-3x^2",
      "fname": "y"
    }
  },
  {
    "id": "thpt-mulog-10",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Anh Nam có mức lương khởi điểm 8 triệu đồng mỗi tháng. Cứ sau 3 năm, lương tháng được tăng thêm 10% so với mức ngay trước đó (tăng vào đầu năm thứ 4, thứ 7, thứ 10, ...). Mức lương theo từng giai đoạn được cho trong hình bên dưới. Xét tính đúng sai của các ý sau:",
    "options": [
      {
        "key": "a",
        "text": "Lương tháng của anh Nam trong năm thứ 4 là 8,8 triệu đồng."
      },
      {
        "key": "b",
        "text": "Lương tháng của anh Nam trong năm thứ 10 là 10,5 triệu đồng."
      },
      {
        "key": "c",
        "text": "Tổng số tiền lương anh Nam nhận được trong 6 năm đầu là 604,8 triệu đồng."
      },
      {
        "key": "d",
        "text": "Lương tháng của anh Nam trong năm thứ 7 là 9,6 triệu đồng."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "Lương các giai đoạn là 8; 8,8; 9,68; 10,648 triệu đồng mỗi tháng. a) Năm 4 thuộc giai đoạn 2 có lương 8,8: Đúng. b) Năm 10 có ba lần tăng, lương là $8\\cdot1{,}1^3=10{,}648$: Sai. c) $36\\cdot8+36\\cdot8{,}8=604{,}8$: Đúng. d) Năm 7 có lương $8\\cdot1{,}1^2=9{,}68$: Sai.",
    "points": 1,
    "tags": [
      "Cấp số nhân",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "bar",
      "title": "Lương tháng theo giai đoạn",
      "xLabel": "Giai đoạn",
      "yLabel": "triệu đồng",
      "data": "Năm 1-3; Năm 4-6; Năm 7-9; Năm 10-12\nLương: 8; 8,8; 9,68; 10,648"
    }
  },
  {
    "id": "thpt-mulog-11",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Mực nước tại một bến cảng trong một chu kỳ thủy triều được mô tả bởi hàm số $h(x)=3\\cos x+5$ (mét), với $0\\le x\\le2\\pi$ và đồ thị như hình bên dưới. Xét tính đúng sai của các ý sau:",
    "options": [
      {
        "key": "a",
        "text": "Giá trị lớn nhất của $h(x)$ trên $[0;2\\pi]$ bằng 7."
      },
      {
        "key": "b",
        "text": "Giá trị nhỏ nhất của $h(x)$ trên $[0;2\\pi]$ bằng 2."
      },
      {
        "key": "c",
        "text": "Phương trình $h(x)=5$ có ba nghiệm thuộc $[0;2\\pi]$."
      },
      {
        "key": "d",
        "text": "Hàm số $h(x)$ nghịch biến trên khoảng $(0;\\pi)$."
      }
    ],
    "answer": "SĐSĐ",
    "explanation": "$h'(x)=-3\\sin x$. a) Giá trị lớn nhất là $8$ khi $\\cos x=1$: Sai. b) Giá trị nhỏ nhất là $2$ khi $x=\\pi$: Đúng. c) $h(x)=5\\Leftrightarrow\\cos x=0$, có hai nghiệm $x=\\frac{\\pi}{2}$, $x=\\frac{3\\pi}{2}$: Sai. d) $h'(x)<0$ trên $(0;\\pi)$ nên nghịch biến: Đúng.",
    "points": 1,
    "tags": [
      "Hàm lượng giác",
      "ứng dụng thực tế",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "3cos(x)+5"
      ],
      "xMin": 0,
      "xMax": 6.3
    }
  },
  {
    "id": "thpt-mulog-12",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Một chất điểm chuyển động thẳng có quãng đường $s(t)=t^3-6t^2+9t$ (mét), với $t\\ge0$ tính bằng giây. Đồ thị hàm vận tốc $v(t)=s'(t)$ trên đoạn $[0;4]$ được cho trong hình bên dưới. Xét tính đúng sai của các ý sau:",
    "options": [
      {
        "key": "a",
        "text": "Vận tốc của chất điểm tại thời điểm $t=0$ bằng $-9$ m/s."
      },
      {
        "key": "b",
        "text": "Chất điểm đổi chiều chuyển động tại các thời điểm $t=1$ s và $t=3$ s."
      },
      {
        "key": "c",
        "text": "Gia tốc của chất điểm tại thời điểm $t=2$ s bằng 0."
      },
      {
        "key": "d",
        "text": "Vận tốc nhỏ nhất của chất điểm trên đoạn $[0;4]$ bằng $-2$ m/s."
      }
    ],
    "answer": "SĐĐS",
    "explanation": "$v(t)=3t^2-12t+9=3(t-1)(t-3)$ và $a(t)=6t-12$. a) $v(0)=9$ m/s: Sai. b) $v$ đổi dấu qua $t=1$ và $t=3$: Đúng. c) $a(2)=0$: Đúng. d) Trên $[0;4]$, $v$ đạt nhỏ nhất tại $t=2$ với $v(2)=-3$ (còn $v(0)=v(4)=9$): Sai.",
    "points": 1,
    "tags": [
      "Đạo hàm",
      "vận tốc tức thời",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "3x^2-12x+9"
      ],
      "xMin": 0,
      "xMax": 4
    }
  },
  {
    "id": "thpt-mulog-13",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Xét phương trình $\\log_2(x+1)+\\log_2(x-1)=3$. Xét tính đúng sai của các ý sau:",
    "options": [
      {
        "key": "a",
        "text": "Điều kiện xác định của phương trình là $x>1$."
      },
      {
        "key": "b",
        "text": "$x=-3$ là một nghiệm của phương trình."
      },
      {
        "key": "c",
        "text": "Phương trình có đúng một nghiệm."
      },
      {
        "key": "d",
        "text": "Nghiệm của phương trình thuộc khoảng $(2;4)$."
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) Cần $x+1>0$ và $x-1>0$, tức $x>1$: Đúng. b) Phương trình tương đương $(x+1)(x-1)=8$, tức $x^2=9$, $x=\\pm3$; $x=-3$ không thỏa điều kiện: Sai. c) Chỉ có $x=3$: Đúng. d) $3\\in(2;4)$: Đúng.",
    "points": 1,
    "tags": [
      "Mũ - Logarit",
      "phương trình logarit",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-mulog-14",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $y=\\frac{x+1}{x-1}$ có đồ thị $(C)$. Gọi $\\Delta$ là tiếp tuyến của $(C)$ tại điểm có hoành độ $x_0=3$. Xét tính đúng sai của các ý sau:",
    "options": [
      {
        "key": "a",
        "text": "$y(3)=2$."
      },
      {
        "key": "b",
        "text": "Hệ số góc của $\\Delta$ bằng $\\frac12$."
      },
      {
        "key": "c",
        "text": "$\\Delta$ cắt trục hoành tại điểm có hoành độ bằng 6."
      },
      {
        "key": "d",
        "text": "Diện tích tam giác tạo bởi $\\Delta$ và hai trục tọa độ bằng $12{,}25$."
      }
    ],
    "answer": "ĐSSĐ",
    "explanation": "$y'=\\frac{-2}{(x-1)^2}$ nên $y'(3)=-\\frac12$. a) $y(3)=\\frac{4}{2}=2$: Đúng. b) Hệ số góc là $-\\frac12$: Sai. $\\Delta: y=-\\frac12(x-3)+2=-\\frac12x+\\frac72$. c) Cho $y=0$ được $x=7$: Sai. d) Cho $x=0$ được $y=\\frac72$, diện tích $S=\\frac12\\cdot7\\cdot\\frac72=\\frac{49}{4}=12{,}25$: Đúng.",
    "points": 1,
    "tags": [
      "Đạo hàm",
      "tiếp tuyến",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-mulog-15",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Dân số của một thành phố (đơn vị: triệu người) được mô hình bởi $P(t)=20\\cdot1{,}02^{t}$, trong đó $t$ là số năm kể từ năm 2020 (ứng với $t=0$). Xét tính đúng sai của các ý sau:",
    "options": [
      {
        "key": "a",
        "text": "Dân số của thành phố năm 2020 là 20 triệu người."
      },
      {
        "key": "b",
        "text": "Dự báo dân số năm 2030 khoảng 24,4 triệu người."
      },
      {
        "key": "c",
        "text": "Tốc độ tăng dân số tại thời điểm $t=0$ khoảng 0,40 triệu người mỗi năm."
      },
      {
        "key": "d",
        "text": "Sau 20 năm kể từ năm 2020, dân số vượt 30 triệu người."
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) $P(0)=20$: Đúng. b) $P(10)=20\\cdot1{,}02^{10}\\approx24{,}38$: Đúng. c) $P'(t)=20\\ln1{,}02\\cdot1{,}02^t$ nên $P'(0)=20\\ln1{,}02\\approx0{,}396$: Đúng. d) $P(20)=20\\cdot1{,}02^{20}\\approx29{,}72<30$: Sai.",
    "points": 1,
    "tags": [
      "Mũ - Logarit",
      "tăng trưởng dân số",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-mulog-16",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính giá trị của biểu thức $\\log_2 24-\\log_2 3$.",
    "answer": "3",
    "explanation": "$\\log_2 24-\\log_2 3=\\log_2\\frac{24}{3}=\\log_2 8=3$.",
    "points": 0.5,
    "tags": [
      "Mũ - Logarit",
      "tính giá trị biểu thức",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-mulog-17",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho hàm số $y=x^3-2x^2+5x$. Giá trị của đạo hàm $y'$ tại $x=1$ bằng bao nhiêu?",
    "answer": "4",
    "explanation": "$y'=3x^2-4x+5$ nên $y'(1)=3-4+5=4$.",
    "points": 0.5,
    "tags": [
      "Đạo hàm",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-mulog-18",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một đu quay có bán kính 10 m, tâm cách mặt đất 12 m và quay đều. Cabin xuất phát từ vị trí thấp nhất. Gọi $\\alpha$ (radian) là góc quay của cabin kể từ vị trí thấp nhất, khi đó độ cao của cabin so với mặt đất là $h(\\alpha)=12-10\\cos\\alpha$ (mét), với $0\\le\\alpha\\le2\\pi$, có đồ thị như hình bên dưới. Khi cabin lần đầu tiên đạt độ cao 17 m thì $\\alpha$ bằng bao nhiêu radian? (Đáp số làm tròn đến hàng phần trăm.)",
    "answer": "2,09",
    "explanation": "$12-10\\cos\\alpha=17\\Leftrightarrow\\cos\\alpha=-\\frac12$. Nghiệm nhỏ nhất trên $[0;2\\pi]$ là $\\alpha=\\frac{2\\pi}{3}\\approx2{,}09$.",
    "points": 0.5,
    "tags": [
      "Hàm lượng giác",
      "mô hình hóa",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "12-10cos(x)"
      ],
      "xMin": 0,
      "xMax": 6.3
    }
  },
  {
    "id": "thpt-mulog-19",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Gửi 200 triệu đồng vào ngân hàng với lãi suất 6% một năm, lãi kép hàng năm, không rút lãi và không gửi thêm. Sau ít nhất bao nhiêu năm thì tổng số tiền (gốc và lãi) vượt 300 triệu đồng? (Đáp số là số năm nguyên.)",
    "answer": "7",
    "explanation": "$200\\cdot1{,}06^n>300\\Leftrightarrow n>\\log_{1{,}06}1{,}5\\approx6{,}96$, nên $n=7$. Kiểm tra: $200\\cdot1{,}06^6\\approx283{,}7$ (chưa vượt), $200\\cdot1{,}06^7\\approx300{,}7$ (vượt).",
    "points": 0.5,
    "tags": [
      "Mũ - Logarit",
      "lãi suất kép",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-mulog-20",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một quả bóng được thả rơi từ độ cao 10 m xuống sàn nhà. Sau mỗi lần chạm sàn, bóng nảy lên đến độ cao bằng $\\frac34$ độ cao ngay trước đó, và cứ thế nảy mãi cho đến khi dừng hẳn. Tổng quãng đường (mét) bóng đi được từ lúc thả đến khi bóng dừng hẳn là bao nhiêu?",
    "answer": "70",
    "explanation": "Quãng đường bằng $10+2\\left(7{,}5+7{,}5\\cdot\\frac34+7{,}5\\cdot\\left(\\frac34\\right)^2+\\cdots\\right)=10+2\\cdot\\frac{7{,}5}{1-\\frac34}=10+60=70$ m.",
    "points": 0.5,
    "tags": [
      "Cấp số nhân",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-mulog-21",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Mực nước tại một cảng (mét) sau $t$ giờ, với $0\\le t\\le24$, được cho bởi $h(t)=4+3\\sin\\left(\\frac{\\pi t}{6}\\right)$. Trong 24 giờ kể từ $t=0$, có bao nhiêu thời điểm mà mực nước đạt đúng 5,5 m?",
    "answer": "4",
    "explanation": "$h(t)=5{,}5\\Leftrightarrow\\sin\\frac{\\pi t}{6}=\\frac12$. Với $0\\le\\frac{\\pi t}{6}\\le4\\pi$ thì $\\frac{\\pi t}{6}\\in\\left\\{\\frac{\\pi}{6},\\frac{5\\pi}{6},\\frac{13\\pi}{6},\\frac{17\\pi}{6}\\right\\}$, tức $t\\in\\{1;5;13;17\\}$. Có 4 thời điểm.",
    "points": 0.5,
    "tags": [
      "Hàm lượng giác",
      "mô hình thủy triều",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-mulog-22",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Doanh thu của một cửa hàng trong 4 quý đầu năm được cho trong hình bên dưới. Doanh thu mỗi quý đều tăng so với quý trước theo cùng một tỉ lệ. Dự báo doanh thu quý thứ 6 (triệu đồng, làm tròn đến hàng đơn vị) là bao nhiêu?",
    "answer": "161",
    "explanation": "Các doanh thu lập thành cấp số nhân có $u_1=100$, $q=1{,}1$. Vậy $u_6=100\\cdot1{,}1^5\\approx161{,}05\\approx161$.",
    "points": 0.5,
    "tags": [
      "Cấp số nhân",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "bar",
      "title": "Doanh thu 4 quý đầu năm",
      "xLabel": "Quý",
      "yLabel": "triệu đồng",
      "data": "Q1; Q2; Q3; Q4\nDoanh thu: 100; 110; 121; 133,1"
    }
  },
  {
    "id": "thpt-mulog-23",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Từ điểm $A$ trên mặt đất cách chân tháp $B$ một khoảng $AB=30$ m, người ta nhìn thấy đỉnh $C$ của tháp dưới góc nâng $40^\\circ$ so với phương nằm ngang (tam giác $ABC$ vuông tại $B$, hình vẽ minh họa). Chiều cao $BC$ của tháp (mét) làm tròn đến hàng phần mười là bao nhiêu?",
    "answer": "25,2",
    "explanation": "$BC=AB\\cdot\\tan40^\\circ=30\\cdot0{,}8391\\approx25{,}2$ m.",
    "points": 0.5,
    "tags": [
      "Lượng giác",
      "bài toán thực tế",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "scene",
      "text": "A(0; 0) B(5; 0) C(5; 4.2)\nAB, BC, CA\nvuông ABC\nkích thước AB \"30 m\""
    }
  },
  {
    "id": "thpt-mulog-24",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một cửa hàng nhập một loại sản phẩm với giá 50 nghìn đồng mỗi sản phẩm. Nếu bán với giá $p$ nghìn đồng mỗi sản phẩm (với $50\\le p\\le100$) thì số sản phẩm bán được là $Q(p)=600-6p$. Để lợi nhuận lớn nhất, giá bán $p$ (nghìn đồng) bằng bao nhiêu?",
    "answer": "75",
    "explanation": "Lợi nhuận $L(p)=(p-50)(600-6p)$, có $L'(p)=900-12p$. Giải $L'(p)=0$ được $p=75$. Khi đó $L(75)=25\\cdot150=3750$ nghìn đồng.",
    "points": 0.5,
    "tags": [
      "Đạo hàm",
      "bài toán tối ưu",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-mulog-25",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một khoản tiền gửi có lãi suất 5% một năm, lãi kép hàng năm. Số năm nguyên dương nhỏ nhất để số tiền gửi ban đầu tăng gấp đôi trở lên là bao nhiêu?",
    "answer": "15",
    "explanation": "Cần $1{,}05^n\\ge2\\Leftrightarrow n\\ge\\log_{1{,}05}2\\approx14{,}21$, nên $n=15$. Kiểm tra: $1{,}05^{14}\\approx1{,}98<2$ và $1{,}05^{15}\\approx2{,}08\\ge2$.",
    "points": 0.5,
    "tags": [
      "Mũ - Logarit",
      "lãi suất kép",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-oxyz-01",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong không gian $Oxyz$, cho $\\vec{a}=(1;-2;3)$ và $\\vec{b}=(2;1;-1)$. Tích vô hướng $\\vec{a}\\cdot\\vec{b}$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$5$"
      },
      {
        "key": "B",
        "text": "$-3$"
      },
      {
        "key": "C",
        "text": "$3$"
      },
      {
        "key": "D",
        "text": "$-5$"
      }
    ],
    "answer": "B",
    "explanation": "$\\vec{a}\\cdot\\vec{b}=1\\cdot 2+(-2)\\cdot 1+3\\cdot(-1)=2-2-3=-3$.",
    "points": 0.25,
    "tags": [
      "Tọa độ véc-tơ",
      "Tích vô hướng",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-oxyz-02",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong không gian $Oxyz$, khoảng cách từ điểm $M(1;2;-1)$ đến mặt phẳng $(P): 2x-y+2z-5=0$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{7}{9}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{1}{3}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{7}{3}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{5}{3}$"
      }
    ],
    "answer": "C",
    "explanation": "$d(M,(P))=\\dfrac{|2\\cdot 1-2+2\\cdot(-1)-5|}{\\sqrt{2^2+(-1)^2+2^2}}=\\dfrac{|-7|}{3}=\\dfrac{7}{3}$.",
    "points": 0.25,
    "tags": [
      "Khoảng cách",
      "Mặt phẳng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-oxyz-03",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong không gian $Oxyz$, mặt phẳng $(\\alpha)$ đi qua điểm $M(1;2;3)$ và song song với giá của hai vectơ $\\vec{a}=(1;0;2)$, $\\vec{b}=(0;1;-1)$. Phương trình của $(\\alpha)$ là",
    "options": [
      {
        "key": "A",
        "text": "$2x-y-z-3=0$"
      },
      {
        "key": "B",
        "text": "$x+2y+3z-12=0$"
      },
      {
        "key": "C",
        "text": "$2x+y+z-7=0$"
      },
      {
        "key": "D",
        "text": "$2x-y-z+3=0$"
      }
    ],
    "answer": "D",
    "explanation": "$\\vec{n}=[\\vec{a},\\vec{b}]=(-2;1;1)$ là véc-tơ pháp tuyến của $(\\alpha)$. Phương trình: $-2(x-1)+(y-2)+(z-3)=0\\Leftrightarrow 2x-y-z+3=0$.",
    "points": 0.25,
    "tags": [
      "Phương trình mặt phẳng",
      "Tích có hướng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-oxyz-04",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong không gian $Oxyz$, cho mặt cầu $(S):(x-1)^2+(y+2)^2+(z-3)^2=16$ có tâm $I$ như hình bên dưới, và mặt phẳng $(P): x+2y-2z+1=0$. Bán kính đường tròn giao tuyến của $(P)$ và $(S)$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{4\\sqrt{5}}{3}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{8\\sqrt{5}}{3}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{4\\sqrt{3}}{3}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{2\\sqrt{5}}{3}$"
      }
    ],
    "answer": "A",
    "explanation": "$I(1;-2;3)$, $R=4$. $d(I,(P))=\\dfrac{|1-4-6+1|}{3}=\\dfrac{8}{3}$. Bán kính đường tròn: $r=\\sqrt{R^2-d^2}=\\sqrt{16-\\dfrac{64}{9}}=\\dfrac{4\\sqrt{5}}{3}$.",
    "points": 0.25,
    "tags": [
      "Mặt cầu",
      "Giao tuyến",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "sphere",
      "names": [
        "I"
      ],
      "height": false,
      "diagonals": false
    }
  },
  {
    "id": "thpt-oxyz-05",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong không gian $Oxyz$, cho hai mặt phẳng $(\\alpha): x+y+z-1=0$ và $(\\beta): x-y+2z=0$. Côsin của góc giữa $(\\alpha)$ và $(\\beta)$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{2}{3}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{\\sqrt{2}}{3}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{\\sqrt{3}}{3}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{1}{3}$"
      }
    ],
    "answer": "B",
    "explanation": "$\\cos\\varphi=\\dfrac{|1\\cdot 1+1\\cdot(-1)+1\\cdot 2|}{\\sqrt{3}\\cdot\\sqrt{6}}=\\dfrac{2}{\\sqrt{18}}=\\dfrac{\\sqrt{2}}{3}$.",
    "points": 0.25,
    "tags": [
      "Góc giữa hai mặt phẳng",
      "Mặt phẳng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-oxyz-06",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong không gian $Oxyz$ (đơn vị km), drone $A$ bay theo phương trình $\\vec{r}_A(t)=(1+2t;\\,3-t;\\,2+2t)$ và drone $B$ bay theo $\\vec{r}_B(t)=(4-t;\\,1+t;\\,5-2t)$, với $t\\ge 0$ là thời gian tính bằng giờ. Khoảng cách nhỏ nhất giữa hai drone trong quá trình bay bằng",
    "options": [
      {
        "key": "A",
        "text": "$\\sqrt{\\dfrac{29}{13}}$ km"
      },
      {
        "key": "B",
        "text": "$\\dfrac{\\sqrt{13}}{29}$ km"
      },
      {
        "key": "C",
        "text": "$\\sqrt{\\dfrac{13}{29}}$ km"
      },
      {
        "key": "D",
        "text": "$\\dfrac{13}{29}$ km"
      }
    ],
    "answer": "C",
    "explanation": "$\\overrightarrow{AB}(t)=\\vec{r}_B(t)-\\vec{r}_A(t)=(3-3t;\\,2t-2;\\,3-4t)$, nên $AB^2(t)=29t^2-50t+22$. Hàm này đạt giá trị nhỏ nhất tại $t=\\dfrac{25}{29}$ (thỏa $t\\ge 0$), với $AB^2=\\dfrac{13}{29}$. Vậy khoảng cách nhỏ nhất là $\\sqrt{\\dfrac{13}{29}}$ km.",
    "points": 0.25,
    "tags": [
      "Khoảng cách",
      "Bài toán thực tế",
      "Véc-tơ",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-oxyz-07",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong không gian $Oxyz$, cho mặt cầu $(S): x^2+y^2+z^2-2x+4y-6z+5=0$. Mặt phẳng song song với $(Q): 2x-2y+z-1=0$ và tiếp xúc với $(S)$ có phương trình là",
    "options": [
      {
        "key": "A",
        "text": "$2x-2y+z-9=0$"
      },
      {
        "key": "B",
        "text": "$2x-2y+z+9=0$"
      },
      {
        "key": "C",
        "text": "$2x-2y+z-18=0$"
      },
      {
        "key": "D",
        "text": "$2x-2y+z=0$ hoặc $2x-2y+z-18=0$"
      }
    ],
    "answer": "D",
    "explanation": "$(S)$ có tâm $I(1;-2;3)$ và $R=3$. Mặt phẳng cần tìm có dạng $2x-2y+z+D=0$, với $\\dfrac{|2\\cdot 1-2\\cdot(-2)+3+D|}{3}=3\\Leftrightarrow |9+D|=9\\Leftrightarrow D=0$ hoặc $D=-18$.",
    "points": 0.25,
    "tags": [
      "Mặt cầu",
      "Tiếp xúc",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-oxyz-08",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Trong không gian $Oxyz$, đường thẳng $d$ có phương trình tham số $x=1+2t$, $y=-t$, $z=3+2t$, và mặt phẳng $(P): x+2y-2z+1=0$. Sin của góc giữa $d$ và $(P)$ bằng",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{4}{9}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{5}{9}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{2}{3}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{\\sqrt{5}}{3}$"
      }
    ],
    "answer": "A",
    "explanation": "$\\vec{u}=(2;-1;2)$ là véc-tơ chỉ phương của $d$, $\\vec{n}=(1;2;-2)$ là véc-tơ pháp tuyến của $(P)$. $\\sin\\varphi=\\dfrac{|\\vec{u}\\cdot\\vec{n}|}{|\\vec{u}|\\cdot|\\vec{n}|}=\\dfrac{|-4|}{3\\cdot 3}=\\dfrac{4}{9}$.",
    "points": 0.25,
    "tags": [
      "Góc giữa đường thẳng và mặt phẳng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-oxyz-09",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Trong không gian $Oxyz$, cho bốn điểm $A(1;0;0)$, $B(0;2;0)$, $C(0;0;3)$, $D(1;1;1)$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "$\\overrightarrow{AB}=(-1;2;0)$."
      },
      {
        "key": "b",
        "text": "$|\\overrightarrow{AC}|=10$."
      },
      {
        "key": "c",
        "text": "$\\overrightarrow{AB}\\cdot\\overrightarrow{AC}=-1$."
      },
      {
        "key": "d",
        "text": "Thể tích khối tứ diện $ABCD$ bằng $\\dfrac{5}{6}$."
      }
    ],
    "answer": "ĐSSĐ",
    "explanation": "a) Đúng: $\\overrightarrow{AB}=(-1;2;0)$. b) Sai: $\\overrightarrow{AC}=(-1;0;3)$ nên $|\\overrightarrow{AC}|=\\sqrt{10}$. c) Sai: $\\overrightarrow{AB}\\cdot\\overrightarrow{AC}=1+0+0=1$. d) Đúng: $\\overrightarrow{AB}\\times\\overrightarrow{AC}=(6;3;2)$, $\\overrightarrow{AD}=(0;1;1)$, nên $V=\\dfrac{|6\\cdot 0+3\\cdot 1+2\\cdot 1|}{6}=\\dfrac{5}{6}$.",
    "points": 1,
    "tags": [
      "Tọa độ véc-tơ",
      "Tích vô hướng",
      "Thể tích",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-oxyz-10",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Trong không gian $Oxyz$ (đơn vị km), một drone xuất phát từ điểm $M(3;0;5)$ và bay theo đường thẳng $d$ có phương trình tham số $x=3+t$, $y=t$, $z=5-2t$ ($t\\ge 0$ tính bằng giờ). Trạm rađa đặt tại gốc tọa độ $O$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Điểm $M$ thuộc mặt phẳng $(Oxz)$."
      },
      {
        "key": "b",
        "text": "Khi $t$ tăng thì độ cao $z$ của drone tăng."
      },
      {
        "key": "c",
        "text": "Khoảng cách từ $O$ đến đường thẳng $d$ lớn hơn $5$ km."
      },
      {
        "key": "d",
        "text": "Đường thẳng $d$ đi qua điểm $N(4;1;3)$."
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) Đúng: $M$ có $y=0$. b) Sai: $z=5-2t$ giảm khi $t$ tăng. c) Đúng: với $\\overrightarrow{OM}=(3;0;5)$ và $\\vec{u}=(1;1;-2)$, $\\overrightarrow{OM}\\times\\vec{u}=(-5;11;3)$ nên $d(O,d)=\\dfrac{\\sqrt{155}}{\\sqrt{6}}\\approx 5{,}08>5$. d) Đúng: với $t=1$ thì điểm thuộc $d$ là $(4;1;3)$.",
    "points": 1,
    "tags": [
      "Đường thẳng",
      "Khoảng cách",
      "Bài toán thực tế",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-oxyz-11",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Trong không gian $Oxyz$, cho mặt cầu $(S): x^2+y^2+z^2-4x+2y-2z-3=0$ và mặt phẳng $(P): x+y+z-4=0$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Tâm của $(S)$ là $I(2;-1;1)$."
      },
      {
        "key": "b",
        "text": "Bán kính của $(S)$ bằng $3$."
      },
      {
        "key": "c",
        "text": "$(P)$ cắt $(S)$ theo một đường tròn có bán kính bằng $3$."
      },
      {
        "key": "d",
        "text": "Khoảng cách từ $I$ đến $(P)$ bằng $\\dfrac{2\\sqrt{3}}{3}$."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "$(S)$ viết lại là $(x-2)^2+(y+1)^2+(z-1)^2=9$ nên $I(2;-1;1)$, $R=3$: a) Đúng, b) Đúng. c) Sai: $d(I,(P))=\\dfrac{|2-1+1-4|}{\\sqrt{3}}=\\dfrac{2\\sqrt{3}}{3}$, bán kính đường tròn là $r=\\sqrt{9-\\dfrac{4}{3}}=\\sqrt{\\dfrac{23}{3}}\\neq 3$. d) Đúng.",
    "points": 1,
    "tags": [
      "Mặt cầu",
      "Khoảng cách",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-oxyz-12",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hình hộp chữ nhật $ABCD.A'B'C'D'$ như hình bên dưới, với $A(0;0;0)$, $B(2;0;0)$, $D(0;3;0)$, $A'(0;0;4)$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "$AC'=\\sqrt{29}$."
      },
      {
        "key": "b",
        "text": "Góc giữa $AC'$ và mặt phẳng $(ABCD)$ lớn hơn $45^\\circ$."
      },
      {
        "key": "c",
        "text": "$B'D'$ vuông góc với $AC'$."
      },
      {
        "key": "d",
        "text": "Khoảng cách từ $C$ đến mặt phẳng $(AB'D')$ bằng $\\dfrac{24}{\\sqrt{61}}$."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "Ta có $C(2;3;0)$, $C'(2;3;4)$, $B'(2;0;4)$, $D'(0;3;4)$. a) Đúng: $\\overrightarrow{AC'}=(2;3;4)$, $AC'=\\sqrt{29}$. b) Đúng: $\\sin\\varphi=\\dfrac{4}{\\sqrt{29}}\\approx 0{,}743$, $\\varphi\\approx 47{,}97^\\circ$. c) Sai: $\\overrightarrow{B'D'}\\cdot\\overrightarrow{AC'}=(-2;3;0)\\cdot(2;3;4)=5\\neq 0$. d) Đúng: mặt phẳng $(AB'D')$ là $6x+4y-3z=0$, nên $d(C,(AB'D'))=\\dfrac{|12+12|}{\\sqrt{61}}=\\dfrac{24}{\\sqrt{61}}$.",
    "points": 1,
    "tags": [
      "Hình hộp chữ nhật",
      "Góc",
      "Khoảng cách",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "box",
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
      "diagonals": false
    }
  },
  {
    "id": "thpt-oxyz-13",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Trong không gian $Oxyz$, cho mặt cầu $(S): (x-2)^2+(y-1)^2+(z-3)^2=4$ có tâm $I$ như hình bên dưới, và đường thẳng $d: x=1+t$, $y=2-t$, $z=3+2t$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "$d$ cắt $(S)$ tại hai điểm phân biệt."
      },
      {
        "key": "b",
        "text": "Điểm $(2;1;4)$ thuộc $d$."
      },
      {
        "key": "c",
        "text": "Khoảng cách từ $I$ đến $d$ bằng $\\dfrac{2\\sqrt{3}}{3}$."
      },
      {
        "key": "d",
        "text": "Độ dài dây cung giao bởi $d$ và $(S)$ bằng $2\\sqrt{6}$."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "Thay $(1+t;\\,2-t;\\,3+2t)$ vào $(S)$ được $6t^2-4t-2=0$, có hai nghiệm $t=1$ và $t=-\\dfrac{1}{3}$. a) Đúng. b) Sai: với $t=1$ thì $z=5\\neq 4$. c) Đúng: $\\overrightarrow{IM_0}=(-1;1;0)$ với $M_0(1;2;3)\\in d$, $\\vec{u}=(1;-1;2)$, $\\overrightarrow{IM_0}\\times\\vec{u}=(2;2;0)$, nên $d(I,d)=\\dfrac{2\\sqrt{2}}{\\sqrt{6}}=\\dfrac{2\\sqrt{3}}{3}$. d) Sai: dây cung bằng $2\\sqrt{R^2-d^2}=2\\sqrt{\\dfrac{8}{3}}=\\dfrac{4\\sqrt{6}}{3}\\neq 2\\sqrt{6}$.",
    "points": 1,
    "tags": [
      "Mặt cầu",
      "Đường thẳng",
      "Dây cung",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "sphere",
      "names": [
        "I"
      ],
      "height": false,
      "diagonals": false
    }
  },
  {
    "id": "thpt-oxyz-14",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Trong không gian $Oxyz$, cho mặt phẳng $(P): x-y+z-2=0$ và điểm $M(x;y;z)$ thuộc $(P)$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Giá trị nhỏ nhất của $OM$ bằng $\\dfrac{2\\sqrt{3}}{3}$."
      },
      {
        "key": "b",
        "text": "Tồn tại điểm $M\\in(P)$ sao cho $OM=2$."
      },
      {
        "key": "c",
        "text": "Điểm $M_0\\left(\\dfrac{2}{3};-\\dfrac{2}{3};\\dfrac{2}{3}\\right)$ là điểm thuộc $(P)$ gần $O$ nhất."
      },
      {
        "key": "d",
        "text": "Khi $M$ thuộc giao tuyến của $(P)$ và $(Oxy)$ thì $OM$ nhỏ nhất bằng $1$."
      }
    ],
    "answer": "ĐĐĐS",
    "explanation": "a) Đúng: $d(O,(P))=\\dfrac{|-2|}{\\sqrt{3}}=\\dfrac{2\\sqrt{3}}{3}$. b) Đúng, vì $OM$ nhận mọi giá trị từ $\\dfrac{2\\sqrt{3}}{3}$ trở lên. c) Đúng: $M_0$ là hình chiếu vuông góc của $O$ lên $(P)$, $\\overrightarrow{OM_0}=\\dfrac{2}{3}(1;-1;1)$ và $M_0\\in(P)$. d) Sai: với $z=0$ thì $y=x-2$, $OM^2=x^2+(x-2)^2\\ge 2$, nên $OM_{\\min}=\\sqrt{2}$.",
    "points": 1,
    "tags": [
      "Khoảng cách",
      "Cực trị hình học",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-oxyz-15",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình vuông, với $A(0;0;0)$, $B(2;0;0)$, $C(2;2;0)$, $D(0;2;0)$, $S(1;1;3)$, như hình bên dưới. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "$SA=SB$."
      },
      {
        "key": "b",
        "text": "Thể tích khối chóp $S.ABCD$ bằng $4$."
      },
      {
        "key": "c",
        "text": "Góc giữa $SA$ và mặt phẳng $(ABCD)$ nhỏ hơn $60^\\circ$."
      },
      {
        "key": "d",
        "text": "Khoảng cách từ $A$ đến mặt phẳng $(SBC)$ bằng $2$."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) Đúng: $SA=SB=\\sqrt{11}$. b) Đúng: $S_{ABCD}=4$, chiều cao $h=3$, nên $V=\\dfrac{1}{3}\\cdot 4\\cdot 3=4$. c) Sai: $\\tan\\varphi=\\dfrac{3}{\\sqrt{2}}$, $\\varphi\\approx 64{,}76^\\circ>60^\\circ$. d) Sai: mặt phẳng $(SBC)$ là $3x+z-6=0$, nên $d(A,(SBC))=\\dfrac{6}{\\sqrt{10}}=\\dfrac{3\\sqrt{10}}{5}\\approx 1{,}90\\neq 2$.",
    "points": 1,
    "tags": [
      "Hình chóp",
      "Thể tích",
      "Khoảng cách",
      "Góc",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "pyramid4",
      "names": [
        "S",
        "A",
        "B",
        "C",
        "D"
      ],
      "height": false,
      "diagonals": false
    }
  },
  {
    "id": "thpt-oxyz-16",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trong không gian $Oxyz$, cho tứ diện $ABCD$ như hình bên dưới, với $A(1;2;3)$, $B(3;0;1)$, $C(-1;4;2)$, $D(0;0;0)$. Tổng $x_G+y_G+z_G$ của trọng tâm $G$ của tam giác $ABC$ bằng",
    "answer": "5",
    "explanation": "$G=\\left(\\dfrac{1+3-1}{3};\\dfrac{2+0+4}{3};\\dfrac{3+1+2}{3}\\right)=(1;2;2)$, nên $x_G+y_G+z_G=5$.",
    "points": 0.5,
    "tags": [
      "Tọa độ trọng tâm",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "tetrahedron",
      "names": [
        "A",
        "B",
        "C",
        "D"
      ],
      "height": false,
      "diagonals": false,
      "extras": "G = trọng tâm ABC"
    }
  },
  {
    "id": "thpt-oxyz-17",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trong không gian $Oxyz$, cho vectơ $\\vec{u}=2\\vec{i}-3\\vec{j}+6\\vec{k}$. Độ dài của $\\vec{u}$ bằng",
    "answer": "7",
    "explanation": "$|\\vec{u}|=\\sqrt{2^2+(-3)^2+6^2}=\\sqrt{49}=7$.",
    "points": 0.5,
    "tags": [
      "Độ dài véc-tơ",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-oxyz-18",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trong không gian $Oxyz$, cho điểm $A(2;-1;3)$. Gọi $M$ là điểm đối xứng với $A$ qua mặt phẳng $(Oxy)$. Tính $x_M+y_M+z_M$.",
    "answer": "-2",
    "explanation": "$M(2;-1;-3)$, nên $x_M+y_M+z_M=2-1-3=-2$.",
    "points": 0.5,
    "tags": [
      "Điểm đối xứng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-oxyz-19",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trong không gian $Oxyz$, mặt phẳng $(\\alpha)$ cắt các trục $Ox$, $Oy$, $Oz$ lần lượt tại $A(1;0;0)$, $B(0;2;0)$, $C(0;0;3)$. Khoảng cách từ gốc $O$ đến $(\\alpha)$ bằng (đơn vị độ dài, làm tròn đến hàng phần trăm).",
    "answer": "0,86",
    "explanation": "$(\\alpha)$: $6x+3y+2z-6=0$, nên $d(O,(\\alpha))=\\dfrac{6}{\\sqrt{49}}=\\dfrac{6}{7}\\approx 0{,}86$.",
    "points": 0.5,
    "tags": [
      "Phương trình mặt phẳng theo đoạn chắn",
      "Khoảng cách",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-oxyz-20",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hai drone cùng bay trong không gian $Oxyz$ (đơn vị km). Drone thứ nhất có vị trí $\\vec{r}_1(t)=(2+3t;\\,1-t;\\,4)$, drone thứ hai có vị trí $\\vec{r}_2(t)=(5-t;\\,3+t;\\,2+t)$, với $t\\ge 0$ là thời gian tính bằng phút. Thời điểm $t$ (phút) mà khoảng cách giữa hai drone nhỏ nhất là (làm tròn đến hàng phần trăm).",
    "answer": "0,48",
    "explanation": "$\\vec{r}_2(t)-\\vec{r}_1(t)=(3-4t;\\,2+2t;\\,t-2)$, bình phương độ dài là $f(t)=21t^2-20t+17$. Hàm $f$ đạt giá trị nhỏ nhất tại $t=\\dfrac{10}{21}\\approx 0{,}48$.",
    "points": 0.5,
    "tags": [
      "Bài toán thực tế",
      "Khoảng cách",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-oxyz-21",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trong không gian $Oxyz$, cho mặt cầu $(S): (x-1)^2+(y-2)^2+(z+1)^2=25$ có tâm $I$ như hình bên dưới, và mặt phẳng $(P): x+2y+2z-1=0$. Bán kính đường tròn giao tuyến của $(S)$ và $(P)$ bằng (làm tròn đến hàng phần trăm).",
    "answer": "4,96",
    "explanation": "$d(I,(P))=\\dfrac{|1+4-2-1|}{3}=\\dfrac{2}{3}$, nên $r=\\sqrt{25-\\dfrac{4}{9}}=\\dfrac{\\sqrt{221}}{3}\\approx 4{,}96$.",
    "points": 0.5,
    "tags": [
      "Mặt cầu",
      "Giao tuyến",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "geo3d",
      "shape": "sphere",
      "names": [
        "I"
      ],
      "height": false,
      "diagonals": false
    }
  },
  {
    "id": "thpt-oxyz-22",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trong không gian $Oxyz$, đường thẳng $d_1$ có vectơ chỉ phương $(1;m;1)$ và đường thẳng $d_2$ có vectơ chỉ phương $(m;1;1)$. Biết góc giữa $d_1$ và $d_2$ bằng $60^\\circ$. Tổng tất cả các giá trị thực của $m$ thỏa mãn điều kiện trên bằng",
    "answer": "2",
    "explanation": "$\\cos 60^\\circ=\\dfrac{|2m+1|}{m^2+2}=\\dfrac{1}{2}\\Leftrightarrow 2|2m+1|=m^2+2$. Trường hợp $2m+1\\ge 0$: $m^2-4m=0$, $m\\in\\{0;4\\}$. Trường hợp $2m+1<0$: $m^2+4m+4=0$, $m=-2$. Tổng: $0+4-2=2$.",
    "points": 0.5,
    "tags": [
      "Góc giữa hai đường thẳng",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-oxyz-23",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trên bản đồ tọa độ $Oxy$ (đơn vị km), trạm rađa đặt tại gốc $O$. Đường bay thẳng của một máy bay đi qua hai điểm $A(0;12)$ và $B(9;0)$ như hình bên dưới. Khoảng cách ngắn nhất từ trạm rađa $O$ đến đường bay (km) là (làm tròn đến hàng phần mười).",
    "answer": "7,2",
    "explanation": "Đường bay $AB$: $\\dfrac{x}{9}+\\dfrac{y}{12}=1\\Leftrightarrow 4x+3y-36=0$, nên $d(O,AB)=\\dfrac{36}{5}=7{,}2$.",
    "points": 0.5,
    "tags": [
      "Bài toán thực tế",
      "Khoảng cách",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "scene",
      "text": "O(0; 0) A(0; 12) B(9; 0)\nOA, OB, AB\nvuông AOB\nkích thước OA \"12 km\""
    }
  },
  {
    "id": "thpt-oxyz-24",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Khinh khí cầu bay đều trong không gian $Oxyz$ theo đường thẳng $d$: $x=1+2t$, $y=3+t$, $z=2+t$ (đơn vị km, $t\\ge 0$ tính bằng phút). Trạm thu sóng đặt tại $A(4;5;4)$. Thời điểm $t$ (phút) khinh khí cầu gần trạm $A$ nhất là (làm tròn đến hàng phần trăm).",
    "answer": "1,67",
    "explanation": "Với $M(t)\\in d$, $\\overrightarrow{AM}(t)=(2t-3;\\,t-2;\\,t-2)$, nên $f(t)=AM^2=6t^2-20t+17$. Hàm $f$ đạt giá trị nhỏ nhất tại $t=\\dfrac{5}{3}\\approx 1{,}67$.",
    "points": 0.5,
    "tags": [
      "Bài toán thực tế",
      "Khoảng cách nhỏ nhất",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-oxyz-25",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trong không gian $Oxyz$, cho hai điểm $A(1;2;3)$ và $B(4;-2;-1)$. Điểm $M$ thay đổi trên mặt phẳng $(Oxy)$. Giá trị nhỏ nhất của $MA+MB$ bằng (làm tròn đến hàng phần trăm).",
    "answer": "6,40",
    "explanation": "$A$ và $B$ nằm khác phía đối với $(Oxy)$ nên $MA+MB\\ge AB$, dấu bằng xảy ra khi $M$ là giao điểm của đoạn $AB$ với $(Oxy)$. Ta có $AB=\\sqrt{3^2+4^2+4^2}=\\sqrt{41}\\approx 6{,}40$.",
    "points": 0.5,
    "tags": [
      "Cực trị hình học",
      "Bài toán thực tế",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh12-01",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Dạng đột biến nào sau đây làm thay đổi số lượng nhiễm sắc thể trong tế bào?",
    "options": [
      {
        "key": "A",
        "text": "Đột biến gen"
      },
      {
        "key": "B",
        "text": "Đột biến lệch bội"
      },
      {
        "key": "C",
        "text": "Đột biến đảo đoạn nhiễm sắc thể"
      },
      {
        "key": "D",
        "text": "Đột biến thay thế một cặp nuclêôtit"
      }
    ],
    "answer": "B",
    "explanation": "Đột biến lệch bội làm tăng hoặc giảm số lượng nhiễm sắc thể ở một hoặc một số cặp nhiễm sắc thể tương đồng, ví dụ thể ba hoặc thể một. Đột biến gen và đột biến đảo đoạn không làm thay đổi số lượng nhiễm sắc thể.",
    "points": 0.25,
    "tags": [
      "đột biến nhiễm sắc thể",
      "lệch bội",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh12-02",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Nhân tố nào sau đây không làm thay đổi tần số alen của quần thể?",
    "options": [
      {
        "key": "A",
        "text": "Đột biến gen"
      },
      {
        "key": "B",
        "text": "Di nhập gen"
      },
      {
        "key": "C",
        "text": "Chọn lọc tự nhiên"
      },
      {
        "key": "D",
        "text": "Giao phối ngẫu nhiên"
      }
    ],
    "answer": "D",
    "explanation": "Giao phối ngẫu nhiên chỉ tổ hợp lại các alen đã có trong quần thể, làm thay đổi tần số kiểu gen nhưng không làm thay đổi tần số alen. Đột biến, di nhập gen và chọn lọc tự nhiên đều có thể làm thay đổi tần số alen.",
    "points": 0.25,
    "tags": [
      "nhân tố tiến hoá",
      "tần số alen",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh12-03",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Ở một loài, hai cặp gen A, a và B, b nằm trên hai cặp nhiễm sắc thể khác nhau, mỗi gen quy định một tính trạng và trội hoàn toàn. Phép lai $AaBb \\times aabb$ cho đời con có tỉ lệ kiểu hình A-B- là bao nhiêu?",
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
        "text": "12,5%"
      }
    ],
    "answer": "A",
    "explanation": "Phép lai $Aa \\times aa$ cho đời con mang A- với tỉ lệ $1/2$. Phép lai $Bb \\times bb$ cho B- với tỉ lệ $1/2$. Hai cặp gen phân li độc lập nên tỉ lệ A-B- là $1/2 \\times 1/2 = 1/4 = 25\\%$.",
    "points": 0.25,
    "tags": [
      "lai hai cặp tính trạng",
      "phân li độc lập",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh12-04",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Ở ruồi giấm, hai gen A, a và B, b cùng nằm trên một cặp nhiễm sắc thể thường, khoảng cách giữa hai gen là 20 cM (tần số hoán vị gen f = 20%). Cho phép lai $\\frac{AB}{ab} \\times \\frac{AB}{ab}$, hoán vị gen xảy ra ở cả hai giới. Tỉ lệ kiểu gen $\\frac{AB}{AB}$ ở đời con là bao nhiêu?",
    "options": [
      {
        "key": "A",
        "text": "4%"
      },
      {
        "key": "B",
        "text": "9%"
      },
      {
        "key": "C",
        "text": "16%"
      },
      {
        "key": "D",
        "text": "25%"
      }
    ],
    "answer": "C",
    "explanation": "Cơ thể $\\frac{AB}{ab}$ với f = 20% cho giao tử AB = ab = 40%, Ab = aB = 10%. Tỉ lệ $\\frac{AB}{AB}$ ở đời con là 0,4 × 0,4 = 16%.",
    "points": 0.25,
    "tags": [
      "hoán vị gen",
      "tần số hoán vị",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh12-05",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Ở đậu Hà Lan, hai cặp gen phân li độc lập và trội lặn hoàn toàn. Phép lai $AaBb \\times AaBb$ cho đời con có tỉ lệ kiểu hình là bao nhiêu?",
    "options": [
      {
        "key": "A",
        "text": "9 : 3 : 3 : 1"
      },
      {
        "key": "B",
        "text": "3 : 1"
      },
      {
        "key": "C",
        "text": "1 : 2 : 1"
      },
      {
        "key": "D",
        "text": "3 : 3 : 1 : 1"
      }
    ],
    "answer": "A",
    "explanation": "Phép lai $Aa \\times Aa$ cho tỉ lệ trội : lặn là 3 : 1; phép lai $Bb \\times Bb$ cũng cho 3 : 1. Tổ hợp hai cặp: (3 : 1)(3 : 1) = 9 : 3 : 3 : 1.",
    "points": 0.25,
    "tags": [
      "lai hai cặp tính trạng",
      "phân li độc lập",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh12-06",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Ở người, bệnh M do một alen lặn nằm trên nhiễm sắc thể X, không có alen tương ứng trên Y. Người mẹ có kiểu gen $X^AX^a$ (bình thường nhưng mang gen bệnh) lấy chồng có kiểu gen $X^aY$ (bị bệnh M). Biết cặp vợ chồng này sinh một người con trai, xác suất để người con trai đó bị bệnh M là bao nhiêu?",
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
        "text": "50%"
      },
      {
        "key": "D",
        "text": "100%"
      }
    ],
    "answer": "C",
    "explanation": "Con trai nhận Y từ bố và nhận X^A hoặc X^a từ mẹ với xác suất ngang nhau. Con trai bị bệnh có kiểu gen X^aY, xác suất 1/2 = 50%.",
    "points": 0.25,
    "tags": [
      "di truyền liên kết giới tính",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh12-07",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một quần thể động vật ngẫu phối, đang ở trạng thái cân bằng di truyền, có tần số alen A = 0,6 và alen a = 0,4 (gen nằm trên nhiễm sắc thể thường). Tỉ lệ kiểu gen dị hợp Aa trong quần thể là bao nhiêu?",
    "options": [
      {
        "key": "A",
        "text": "0,16"
      },
      {
        "key": "B",
        "text": "0,36"
      },
      {
        "key": "C",
        "text": "0,24"
      },
      {
        "key": "D",
        "text": "0,48"
      }
    ],
    "answer": "D",
    "explanation": "Quần thể cân bằng có cấu trúc p²AA + 2pqAa + q²aa = 1. Tỉ lệ Aa = 2pq = 2 × 0,6 × 0,4 = 0,48.",
    "points": 0.25,
    "tags": [
      "Hardy–Weinberg",
      "cấu trúc di truyền quần thể",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh12-08",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Ở một loài thực vật, quần thể ban đầu có cấu trúc di truyền như hình bên dưới. Cho các cá thể của quần thể tự thụ phấn bắt buộc qua một thế hệ. Tỉ lệ kiểu gen dị hợp Aa ở thế hệ F1 là bao nhiêu?",
    "options": [
      {
        "key": "A",
        "text": "50%"
      },
      {
        "key": "B",
        "text": "25%"
      },
      {
        "key": "C",
        "text": "12,5%"
      },
      {
        "key": "D",
        "text": "75%"
      }
    ],
    "answer": "B",
    "explanation": "Cá thể Aa tự thụ phấn cho Aa với tỉ lệ 1/2, nên Aa ở F1 = 50% × 1/2 = 25%. Cá thể AA và aa tự thụ phấn không tạo ra Aa.",
    "points": 0.25,
    "tags": [
      "tự thụ phấn",
      "cấu trúc di truyền quần thể",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "table",
      "title": "Cấu trúc di truyền của quần thể P",
      "data": "AA; Aa; aa\nTỉ lệ (%): 25; 50; 25"
    }
  },
  {
    "id": "thpt-sinh12-09",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Ở một loài, ba cặp gen A/a, B/b, D/d phân li độc lập và trội lặn hoàn toàn. Phép lai $AaBbDd \\times AaBbDd$ cho đời con. Tỉ lệ cá thể dị hợp về cả ba cặp gen (kiểu gen AaBbDd) là bao nhiêu?",
    "options": [
      {
        "key": "A",
        "text": "$\\frac{1}{16}$"
      },
      {
        "key": "B",
        "text": "$\\frac{1}{4}$"
      },
      {
        "key": "C",
        "text": "$\\frac{1}{8}$"
      },
      {
        "key": "D",
        "text": "$\\frac{1}{32}$"
      }
    ],
    "answer": "C",
    "explanation": "Mỗi cặp Aa × Aa cho kiểu gen Aa với tỉ lệ 1/2. Ba cặp gen phân li độc lập nên tỉ lệ AaBbDd = (1/2)³ = 1/8.",
    "points": 0.25,
    "tags": [
      "lai nhiều cặp tính trạng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh12-10",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Ở một loài, hai gen A/a và B/b liên kết trên một cặp nhiễm sắc thể thường, tần số hoán vị gen là 20%. Cho cơ thể có kiểu gen $\\frac{AB}{ab}$ lai phân tích với cơ thể $\\frac{ab}{ab}$. Tỉ lệ cá thể con mang kiểu hình trội về cả hai tính trạng (A-B-) là bao nhiêu?",
    "options": [
      {
        "key": "A",
        "text": "40%"
      },
      {
        "key": "B",
        "text": "10%"
      },
      {
        "key": "C",
        "text": "50%"
      },
      {
        "key": "D",
        "text": "20%"
      }
    ],
    "answer": "A",
    "explanation": "Cơ thể $\\frac{ab}{ab}$ chỉ cho giao tử ab. Con mang kiểu hình A-B- phải nhận giao tử AB từ $\\frac{AB}{ab}$, chiếm (1 − f)/2 = (1 − 0,2)/2 = 40%.",
    "points": 0.25,
    "tags": [
      "hoán vị gen",
      "lai phân tích",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh12-11",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Ở một loài thực vật, hai cặp gen A/a và B/b phân li độc lập, trội lặn hoàn toàn. Kiểu gen có cả A và B quy định hoa đỏ; các kiểu gen còn lại quy định hoa trắng. Lấy ngẫu nhiên một cây hoa đỏ từ đời con của phép lai $AaBb \\times AaBb$. Xác suất để cây này có kiểu gen đồng hợp về cả hai cặp gen là bao nhiêu?",
    "options": [
      {
        "key": "A",
        "text": "$\\frac{1}{16}$"
      },
      {
        "key": "B",
        "text": "$\\frac{1}{9}$"
      },
      {
        "key": "C",
        "text": "$\\frac{1}{3}$"
      },
      {
        "key": "D",
        "text": "$\\frac{1}{4}$"
      }
    ],
    "answer": "B",
    "explanation": "Tỉ lệ hoa đỏ (A-B-) là 9/16. Tỉ lệ kiểu gen AABB là 1/16. Xác suất có điều kiện = (1/16) : (9/16) = 1/9.",
    "points": 0.25,
    "tags": [
      "xác suất có điều kiện",
      "lai hai cặp tính trạng",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh12-12",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Ở người, bệnh P do một alen lặn nằm trên nhiễm sắc thể thường quy định; alen trội tương ứng quy định người bình thường. Người vợ bình thường có em trai bị bệnh P, bố mẹ người vợ đều bình thường. Người chồng bình thường có em gái bị bệnh P, bố mẹ người chồng đều bình thường. Xác suất cặp vợ chồng này sinh một người con trai bị bệnh P là bao nhiêu?",
    "options": [
      {
        "key": "A",
        "text": "$\\frac{1}{9}$"
      },
      {
        "key": "B",
        "text": "$\\frac{1}{12}$"
      },
      {
        "key": "C",
        "text": "$\\frac{1}{36}$"
      },
      {
        "key": "D",
        "text": "$\\frac{1}{18}$"
      }
    ],
    "answer": "D",
    "explanation": "Người vợ bình thường, bố mẹ bình thường, có em trai bị bệnh nên bố mẹ đều dị hợp Aa; người vợ có kiểu gen AA : Aa = 1 : 2, xác suất mang alen bệnh là 2/3. Tương tự người chồng cũng có xác suất 2/3. Con bị bệnh (aa) = 2/3 × 2/3 × 1/4 = 1/9. Con trai bị bệnh = 1/9 × 1/2 = 1/18.",
    "points": 0.25,
    "tags": [
      "phả hệ",
      "xác suất có điều kiện",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh12-13",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một loài có bộ nhiễm sắc thể lưỡng bội 2n = 8. Trong tế bào sinh dưỡng của một thể ba nhiễm thuộc loài này, có bao nhiêu nhiễm sắc thể?",
    "answer": "9",
    "explanation": "Thể ba nhiễm có bộ nhiễm sắc thể 2n + 1 = 8 + 1 = 9.",
    "points": 0.5,
    "tags": [
      "lệch bội",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh12-14",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Ở một quần thể ngẫu phối, gen có hai alen A và a nằm trên nhiễm sắc thể thường. Số lượng cá thể của các kiểu gen được cho như hình bên dưới. Tần số alen a của quần thể là bao nhiêu? (Viết kết quả dạng số thập phân.)",
    "answer": "0,3",
    "explanation": "Tổng số alen = 2 × 1000 = 2000. Số alen a = 420 (từ Aa) + 2 × 90 (từ aa) = 600. Tần số a = 600 / 2000 = 0,3.",
    "points": 0.5,
    "tags": [
      "tần số alen",
      "cấu trúc di truyền quần thể",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "table",
      "title": "Số cá thể theo kiểu gen",
      "data": "AA; Aa; aa\nSố cá thể: 490; 420; 90"
    }
  },
  {
    "id": "thpt-sinh12-15",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trong một quần thể cân bằng di truyền, gen gồm hai alen A (trội) và a (lặn) nằm trên nhiễm sắc thể thường. Tỉ lệ kiểu hình của quần thể được cho như hình bên dưới. Trong số các cá thể mang kiểu hình trội, tỉ lệ cá thể dị hợp Aa là bao nhiêu phần trăm? (Làm tròn đến một chữ số thập phân.)",
    "answer": "33,3",
    "explanation": "Kiểu hình lặn aa = 4% nên q² = 0,04, q = 0,2 và p = 0,8. Tỉ lệ Aa = 2pq = 0,32; tỉ lệ kiểu hình trội = 0,96. Tỉ lệ Aa trong số trội = 0,32 / 0,96 ≈ 33,3%.",
    "points": 0.5,
    "tags": [
      "Hardy–Weinberg",
      "xác suất có điều kiện",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "pie",
      "title": "Tỉ lệ kiểu hình của quần thể",
      "data": "Trội; Lặn\nTỉ lệ (%): 96; 4"
    }
  },
  {
    "id": "thpt-sinh12-16",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Ở một loài, ba cặp gen A/a, B/b, D/d phân li độc lập và trội lặn hoàn toàn. Phép lai $AaBbDd \\times AaBbDd$ cho đời con. Tỉ lệ cá thể mang kiểu hình A-bbD- là bao nhiêu phần trăm? (Làm tròn đến một chữ số thập phân.)",
    "answer": "14,1",
    "explanation": "Tỉ lệ A- = 3/4; bb = 1/4; D- = 3/4. Tỉ lệ A-bbD- = 3/4 × 1/4 × 3/4 = 9/64 ≈ 14,06%, làm tròn 14,1%.",
    "points": 0.5,
    "tags": [
      "lai nhiều cặp tính trạng",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh12-17",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một quần thể động vật có 200 cá thể ở thời điểm ban đầu, tăng trưởng theo mô hình hàm số mũ không giới hạn. Mỗi năm, số sinh là 25% và số tử là 5% so với số cá thể đầu năm (không xét di cư, nhập cư). Sau 2 năm, quần thể có bao nhiêu cá thể?",
    "answer": "288",
    "explanation": "Tốc độ tăng trưởng mỗi năm r = 25% − 5% = 20%, nên N_t = N_0 × (1 + 0,2)^t. Sau 2 năm: N = 200 × 1,2² = 288 cá thể.",
    "points": 0.5,
    "tags": [
      "tăng trưởng quần thể",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh12-18",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trong một chuỗi thức ăn gồm ba mắt xích: cỏ → sâu → chim. Năng lượng tích luỹ ở cỏ và sâu trong một năm được cho như hình bên dưới. Hiệu suất sinh thái giữa sâu và chim là 8%. Năng lượng tích luỹ ở chim trong một năm là bao nhiêu kJ?",
    "answer": "96",
    "explanation": "Năng lượng ở chim = năng lượng ở sâu × hiệu suất sinh thái = 1200 × 8% = 96 kJ.",
    "points": 0.5,
    "tags": [
      "dòng năng lượng",
      "hệ sinh thái",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "bar",
      "title": "Năng lượng tích luỹ trong một năm",
      "xLabel": "Bậc dinh dưỡng",
      "yLabel": "kJ",
      "data": "Cỏ; Sâu\nNăng lượng (kJ): 10000; 1200"
    }
  },
  {
    "id": "thpt-sinh12-19",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Ở một loài, hai gen A/a và B/b cùng nằm trên một cặp nhiễm sắc thể thường, tần số hoán vị gen là 20%. Cho phép lai $\\frac{AB}{ab} \\times \\frac{Ab}{aB}$, hoán vị xảy ra ở cả hai giới. Tỉ lệ cá thể con mang kiểu hình A-B- là bao nhiêu phần trăm?",
    "answer": "54",
    "explanation": "P(aa) = 0,5 × 0,5 = 0,25 (giao tử mang a chiếm 0,5 ở mỗi bên); P(bb) = 0,5 × 0,5 = 0,25; P(aabb) = 0,4 (ab từ cây AB/ab) × 0,1 (ab từ cây Ab/aB) = 0,04. P(A-B-) = 1 − 0,25 − 0,25 + 0,04 = 0,54 = 54%.",
    "points": 0.5,
    "tags": [
      "hoán vị gen",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh12-20",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Ở người, bệnh M do một alen lặn nằm trên nhiễm sắc thể X quy định, không có alen tương ứng trên Y. Trong một quần thể cân bằng di truyền, số nam và số nữ bằng nhau, tỉ lệ người bị bệnh M ở nam và nữ được cho như hình bên dưới. Tỉ lệ người (cả nam và nữ) bị bệnh M trong quần thể là bao nhiêu phần trăm? (Viết kết quả dạng số thập phân.)",
    "answer": "5,5",
    "explanation": "Tỉ lệ nam bị bệnh = 10%, tỉ lệ nữ bị bệnh = 1%. Vì số nam bằng số nữ nên tỉ lệ chung = (10% + 1%) / 2 = 5,5%.",
    "points": 0.5,
    "tags": [
      "di truyền liên kết giới tính",
      "quần thể",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "table",
      "title": "Tỉ lệ người bị bệnh M",
      "data": "Nam; Nữ\nTỉ lệ bị bệnh (%): 10; 1"
    }
  },
  {
    "id": "thpt-sinh12-21",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Ở người, bệnh M do một alen lặn nằm trên nhiễm sắc thể X quy định, không có alen tương ứng trên Y; alen trội tương ứng quy định bình thường. Người vợ bình thường có em trai bị bệnh M; bố và mẹ của người vợ đều bình thường. Người chồng bình thường. Xác suất cặp vợ chồng này sinh một người con gái mang alen bệnh M (dị hợp) là bao nhiêu phần trăm? (Viết kết quả dạng số thập phân.)",
    "answer": "12,5",
    "explanation": "Mẹ của người vợ mang X^A X^a, nên người vợ (bình thường) có xác suất 1/2 là dị hợp. Người chồng X^AY. Con gái mang alen bệnh = 1/2 (là con gái) × 1/2 (vợ dị hợp) × 1/2 (vợ truyền X^a) = 1/8 = 12,5%.",
    "points": 0.5,
    "tags": [
      "di truyền liên kết giới tính",
      "xác suất có điều kiện",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh12-22",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Ở một quần thể ngẫu phối, gen có hai alen A và a nằm trên nhiễm sắc thể thường. Ở thế hệ P, tần số alen a = 0,2. Các cá thể mang kiểu gen aa không có khả năng sinh sản (chọn lọc chống lại hoàn toàn thể đồng hợp lặn). Coi quần thể cân bằng di truyền ở mỗi thế hệ, không có đột biến và di nhập gen. Sau hai thế hệ chọn lọc, tần số alen a là bao nhiêu? (Làm tròn đến hai chữ số thập phân.)",
    "answer": "0,14",
    "explanation": "Mỗi thế hệ chọn lọc, q' = q / (1 + q), nên 1/q tăng thêm 1. Ta có 1/q₂ = 1/0,2 + 2 = 7, q₂ = 1/7 ≈ 0,14.",
    "points": 0.5,
    "tags": [
      "chọn lọc tự nhiên",
      "tần số alen",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh12-23",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Đọc các nhận định sau về cơ chế di truyền và biến dị ở sinh vật nhân thực, xác định mỗi ý đúng (Đ) hay sai (S).",
    "options": [
      {
        "key": "a",
        "text": "Đột biến gen là biến đổi trong cấu trúc của gen, liên quan đến một hoặc một số cặp nuclêôtit."
      },
      {
        "key": "b",
        "text": "Đột biến gen luôn có hại cho thể đột biến vì làm thay đổi prôtêin tương ứng."
      },
      {
        "key": "c",
        "text": "Mã di truyền có tính thoái hoá, nghĩa là một bộ ba mã hoá cho nhiều loại axit amin."
      },
      {
        "key": "d",
        "text": "Mã di truyền có tính phổ biến, tức là hầu hết các loài sinh vật dùng chung một bộ mã di truyền."
      }
    ],
    "answer": "ĐSSĐ",
    "explanation": "a Đ: đột biến gen liên quan đến một hoặc một số cặp nuclêôtit. b S: nhiều đột biến gen trung tính hoặc có lợi. c S: tính thoái hoá là nhiều bộ ba cùng mã hoá một axit amin; mỗi bộ ba chỉ mã hoá một loại axit amin. d Đ: mã di truyền có tính phổ biến ở hầu hết các loài.",
    "points": 1,
    "tags": [
      "đột biến gen",
      "mã di truyền",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh12-24",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Ở một loài động vật, hai gen A, a và B, b cùng nằm trên một cặp nhiễm sắc thể thường, trội lặn hoàn toàn; tần số hoán vị gen là 20% ở cả hai giới. Cho phép lai $\\frac{Ab}{aB} \\times \\frac{Ab}{aB}$. Xét các nhận định về đời con.",
    "options": [
      {
        "key": "a",
        "text": "Tỉ lệ kiểu hình A-B- ở đời con là 51%."
      },
      {
        "key": "b",
        "text": "Tỉ lệ kiểu hình aabb ở đời con là 4%."
      },
      {
        "key": "c",
        "text": "Tỉ lệ kiểu hình A-bb ở đời con là 24%."
      },
      {
        "key": "d",
        "text": "Đời con có 10 loại kiểu gen khác nhau."
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "Mỗi cây cho giao tử Ab = aB = 40%, AB = ab = 10%. a Đ: aabb = 0,1 × 0,1 = 1%; A-bb = P(bb) − P(aabb) = 0,25 − 0,01 = 24%; A-B- = 1 − 0,01 − 0,24 − 0,24 = 51%. b S: aabb chỉ 1%. c Đ: A-bb = 24%. d Đ: 4 loại giao tử cho 10 loại kiểu gen khác nhau.",
    "points": 1,
    "tags": [
      "hoán vị gen",
      "lai hai cặp tính trạng",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh12-25",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Ở một loài thực vật, gen A quy định hoa đỏ trội hoàn toàn so với a quy định hoa trắng, gen nằm trên nhiễm sắc thể thường. Khảo sát một quần thể gồm 100 cây có số lượng kiểu gen như hình bên dưới. Xét các nhận định sau.",
    "options": [
      {
        "key": "a",
        "text": "Tần số alen A của quần thể là 0,6."
      },
      {
        "key": "b",
        "text": "Quần thể này chưa đạt trạng thái cân bằng di truyền."
      },
      {
        "key": "c",
        "text": "Nếu cho quần thể tự thụ phấn bắt buộc qua một thế hệ, tỉ lệ cây dị hợp Aa ở thế hệ con là 24%."
      },
      {
        "key": "d",
        "text": "Nếu cho quần thể ngẫu phối qua một thế hệ, tỉ lệ cây hoa trắng ở thế hệ con là 36%."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "Tần số A = (2 × 36 + 48) / 200 = 0,6. Quần thể có 0,36 : 0,48 : 0,16 = 0,6² : 2 × 0,6 × 0,4 : 0,4², nên đã cân bằng (b S). Tự thụ phấn: Aa = 48% × 1/2 = 24% (c Đ). Ngẫu phối: hoa trắng = q² = 0,16, không phải 36% (d S).",
    "points": 1,
    "tags": [
      "Hardy–Weinberg",
      "tự thụ phấn",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "table",
      "title": "Số lượng cây theo kiểu gen",
      "data": "AA; Aa; aa\nSố cây: 36; 48; 16"
    }
  },
  {
    "id": "thpt-sinh12-26",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Ở người, bệnh M do một alen lặn nằm trên nhiễm sắc thể X quy định, không có alen tương ứng trên Y; alen trội tương ứng quy định bình thường. Người phụ nữ II là con gái của một người đàn ông bị bệnh M và một người mẹ bình thường. Người phụ nữ II lấy người đàn ông bình thường (không mang alen bệnh). Không xét đột biến mới. Xét các nhận định sau.",
    "options": [
      {
        "key": "a",
        "text": "Người phụ nữ II có kiểu gen đồng hợp tử về alen bình thường."
      },
      {
        "key": "b",
        "text": "Xác suất sinh con trai bị bệnh M của cặp vợ chồng này là 25%."
      },
      {
        "key": "c",
        "text": "Trong số các con gái của cặp vợ chồng này, tỉ lệ con gái mang alen bệnh là 50%."
      },
      {
        "key": "d",
        "text": "Xác suất sinh một đứa con bị bệnh M (không phân biệt giới tính) là 1/2."
      }
    ],
    "answer": "SĐĐS",
    "explanation": "Người phụ nữ II nhận X^a từ bố bị bệnh nên là X^AX^a, dị hợp (a S). Vợ X^AX^a × chồng X^AY: con trai bị bệnh = 1/2 (nhận X^a từ mẹ) × 1/2 = 1/4 (b Đ). Con gái có 1/2 là X^AX^a (c Đ). Xác suất sinh con bị bệnh không phân biệt giới = 1/4, không phải 1/2 (d S).",
    "points": 1,
    "tags": [
      "di truyền liên kết giới tính",
      "phả hệ",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh12-27",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Ở một quần thể ngẫu phối, gen có hai alen A và a (A trội hoàn toàn) nằm trên nhiễm sắc thể thường. Thế hệ xuất phát (hợp tử) có cấu trúc 0,36 AA : 0,48 Aa : 0,16 aa. Các cá thể aa chết trước tuổi sinh sản nên không tham gia sinh sản. Xét các nhận định sau.",
    "options": [
      {
        "key": "a",
        "text": "Tần số alen a trong quần thể trước khi chọn lọc là 0,4."
      },
      {
        "key": "b",
        "text": "Sau chọn lọc, các cá thể trưởng thành có tỉ lệ kiểu gen AA : Aa = 3 : 4."
      },
      {
        "key": "c",
        "text": "Tần số alen a trong các giao tử do cá thể trưởng thành tạo ra là 3/7 (khoảng 0,43)."
      },
      {
        "key": "d",
        "text": "Nếu chọn lọc tiếp tục diễn ra qua hai thế hệ, tần số alen a giảm xuống còn 0,25."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a Đ: q = 0,16 + 0,48/2 = 0,4. b Đ: sau khi aa chết, AA : Aa = 0,36 : 0,48 = 3 : 4. c S: giao tử a = (4/7) × 1/2 = 2/7 ≈ 0,29, không phải 3/7. d S: q₁ = 2/7, q₂ = q₁/(1 + q₁) = 2/9 ≈ 0,22, không phải 0,25.",
    "points": 1,
    "tags": [
      "chọn lọc tự nhiên",
      "tần số alen",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh12-28",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Đồ thị dưới đây biểu diễn tốc độ tăng trưởng của một quần thể (trục y, cá thể/năm) theo kích thước quần thể (trục x, cá thể) như hình bên dưới. Quần thể tăng trưởng theo mô hình logistic dN/dt = rN(1 − N/K) với r = 0,5 và K = 1000 cá thể. Xét các nhận định sau.",
    "options": [
      {
        "key": "a",
        "text": "Khi kích thước quần thể là 200 cá thể, tốc độ tăng trưởng là 80 cá thể/năm."
      },
      {
        "key": "b",
        "text": "Tốc độ tăng trưởng đạt giá trị lớn nhất khi quần thể có 500 cá thể."
      },
      {
        "key": "c",
        "text": "Khi quần thể có 800 cá thể, tốc độ tăng trưởng là 200 cá thể/năm."
      },
      {
        "key": "d",
        "text": "Khi kích thước quần thể đạt K = 1000 cá thể, tốc độ tăng trưởng bằng 0."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "dN/dt = 0,5N(1 − N/1000). a Đ: N = 200 cho 0,5 × 200 × 0,8 = 80. b Đ: đạt cực đại tại N = K/2 = 500, khi đó 0,5 × 500 × 0,5 = 125. c S: N = 800 cho 0,5 × 800 × 0,2 = 80, không phải 200. d Đ: N = K cho dN/dt = 0.",
    "points": 1,
    "tags": [
      "tăng trưởng quần thể",
      "logistic",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "x(1-x/1000)/2"
      ],
      "xMin": 0,
      "xMax": 1000
    }
  },
  {
    "id": "thpt-sinh12-29",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Ở người, bệnh P do một gen lặn nằm trên nhiễm sắc thể thường quy định (alen trội tương ứng quy định bình thường). Trong một quần thể người đang cân bằng di truyền, tỉ lệ người bị bệnh P là 1/10 000. Xét các nhận định sau (lấy gần đúng khi cần).",
    "options": [
      {
        "key": "a",
        "text": "Tỉ lệ người mang kiểu gen dị hợp trong quần thể xấp xỉ 2%."
      },
      {
        "key": "b",
        "text": "Tần số alen bệnh trong quần thể là 0,1."
      },
      {
        "key": "c",
        "text": "Một cặp vợ chồng bình thường, không có quan hệ họ hàng, sinh con bị bệnh P với xác suất khoảng 0,01%."
      },
      {
        "key": "d",
        "text": "Người bình thường có em gái bị bệnh P thì xác suất người đó mang alen bệnh là 2/3."
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "q² = 1/10 000 nên q = 0,01. a Đ: 2pq = 2 × 0,99 × 0,01 ≈ 0,0198. b S: q = 0,01, không phải 0,1. c Đ: mỗi người bình thường mang alen bệnh với xác suất ≈ 0,0198; sinh con bệnh = 0,0198² × 1/4 ≈ 0,0098%. d Đ: bố mẹ đều Aa nên người bình thường có tỉ lệ AA : Aa = 1 : 2, xác suất mang alen 2/3.",
    "points": 1,
    "tags": [
      "Hardy–Weinberg",
      "xác suất có điều kiện",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-sinh12-30",
    "subject": "Sinh học",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Ở một loài thực vật, lai hai dòng hoa hồng thuần chủng khác kiểu gen, thu được F1 toàn hoa đỏ. Cho F1 tự thụ phấn, thu được F2 có số lượng cây như hình bên dưới. Biết hai cặp gen phân li độc lập, kiểu gen A-B- quy định hoa đỏ; A-bb và aaB- quy định hoa hồng; aabb quy định hoa trắng. Xét các nhận định sau.",
    "options": [
      {
        "key": "a",
        "text": "F1 có kiểu gen dị hợp về cả hai cặp gen."
      },
      {
        "key": "b",
        "text": "Màu hoa do hai cặp gen không alen tương tác với nhau quy định."
      },
      {
        "key": "c",
        "text": "Tỉ lệ cây hoa hồng ở F2 là 50%."
      },
      {
        "key": "d",
        "text": "Cho cây hoa hồng có kiểu gen Aabb ở F2 tự thụ phấn, đời con có tỉ lệ cây hoa trắng là 1/4."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a Đ: F1 đỏ là AaBb. b Đ: hai cặp gen không alen tương tác quy định màu hoa. c S: hoa hồng = 75/200 = 37,5%, không phải 50%. d Đ: Aabb tự thụ cho aabb (hoa trắng) với tỉ lệ 1/4 × 1 = 1/4.",
    "points": 1,
    "tags": [
      "tương tác gen",
      "lai hai cặp tính trạng",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "bar",
      "title": "Kiểu hình ở F2",
      "xLabel": "Kiểu hình",
      "yLabel": "Số cây",
      "data": "Đỏ; Hồng; Trắng\nSố cây: 112; 75; 13"
    }
  },
  {
    "id": "thpt-thongke2-01",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Có 8 bạn đăng kí tham gia 3 môn thi khác nhau là Toán, Vật lí và Hóa học. Mỗi môn do đúng một bạn phụ trách và mỗi bạn chỉ phụ trách tối đa một môn. Hỏi có bao nhiêu cách phân công?",
    "options": [
      {
        "key": "A",
        "text": "56"
      },
      {
        "key": "B",
        "text": "168"
      },
      {
        "key": "C",
        "text": "512"
      },
      {
        "key": "D",
        "text": "336"
      }
    ],
    "answer": "D",
    "explanation": "Mỗi môn ứng với một bạn khác nhau, thứ tự quan trọng nên đây là chỉnh hợp chập 3 của 8: $\\mathrm{A}_8^3=8\\cdot7\\cdot6=336$.",
    "points": 0.25,
    "tags": [
      "chỉnh hợp",
      "bài đếm",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-thongke2-02",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Lớp có 7 bạn nam và 5 bạn nữ. Cần chọn 4 bạn đi dự trại hè. Hỏi có bao nhiêu cách chọn sao cho trong 4 bạn được chọn có ít nhất một bạn nữ?",
    "options": [
      {
        "key": "A",
        "text": "35"
      },
      {
        "key": "B",
        "text": "420"
      },
      {
        "key": "C",
        "text": "460"
      },
      {
        "key": "D",
        "text": "495"
      }
    ],
    "answer": "C",
    "explanation": "Tổng số cách chọn 4 bạn từ 12 bạn là $\\mathrm{C}_{12}^4=495$. Số cách chọn 4 bạn toàn nam là $\\mathrm{C}_7^4=35$. Đáp số $495-35=460$.",
    "points": 0.25,
    "tags": [
      "tổ hợp",
      "phần bù",
      "chọn nhóm có ràng buộc",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-thongke2-03",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Gieo một con xúc xắc cân đối và đồng chất. Gọi $A$ là biến cố “số chấm xuất hiện là số chẵn” và $B$ là biến cố “số chấm xuất hiện không nhỏ hơn 4”. Tính xác suất của biến cố $A\\cup B$.",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{2}{3}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{1}{2}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{5}{6}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{1}{3}$"
      }
    ],
    "answer": "A",
    "explanation": "$A=\\{2;4;6\\}$, $B=\\{4;5;6\\}$, $A\\cup B=\\{2;4;5;6\\}$. Vậy $P(A\\cup B)=\\dfrac{4}{6}=\\dfrac{2}{3}$.",
    "points": 0.25,
    "tags": [
      "xác suất cổ điển",
      "biến cố hợp",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-thongke2-04",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho $P(A)=0{,}3$, $P(B)=0{,}6$ và $P(A\\cap B)=0{,}18$. Tính $P(A\\cup B)$.",
    "options": [
      {
        "key": "A",
        "text": "0,72"
      },
      {
        "key": "B",
        "text": "0,9"
      },
      {
        "key": "C",
        "text": "0,18"
      },
      {
        "key": "D",
        "text": "0,54"
      }
    ],
    "answer": "A",
    "explanation": "Theo công thức cộng xác suất: $P(A\\cup B)=P(A)+P(B)-P(A\\cap B)=0{,}3+0{,}6-0{,}18=0{,}72$.",
    "points": 0.25,
    "tags": [
      "biến cố hợp",
      "biến cố giao",
      "công thức cộng xác suất",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-thongke2-05",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Biểu đồ bên dưới thống kê thời gian chờ (phút) của 40 khách hàng tại một quầy giao dịch. Tìm mốt của mẫu số liệu ghép nhóm (làm tròn đến hàng phần mười).",
    "options": [
      {
        "key": "A",
        "text": "31,8"
      },
      {
        "key": "B",
        "text": "32,5"
      },
      {
        "key": "C",
        "text": "30,0"
      },
      {
        "key": "D",
        "text": "35,0"
      }
    ],
    "answer": "A",
    "explanation": "Nhóm chứa mốt là [30; 35) vì có tần số lớn nhất 14. Mốt $M_o=30+\\dfrac{14-10}{(14-10)+(14-7)}\\cdot5=30+\\dfrac{20}{11}\\approx31{,}8$.",
    "points": 0.25,
    "tags": [
      "mẫu số liệu ghép nhóm",
      "mốt",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "hist",
      "title": "Thời gian chờ của 40 khách hàng",
      "xLabel": "Thời gian (phút)",
      "yLabel": "Số khách hàng",
      "data": "[20; 25) [25; 30) [30; 35) [35; 40) [40; 45)\nSố khách hàng: 6; 10; 14; 7; 3"
    }
  },
  {
    "id": "thpt-thongke2-06",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Sơ đồ cây bên dưới cho biết xác suất ngày mai có mưa và xác suất đường trong khu phố bị ngập trong từng trường hợp. Tính xác suất đường trong khu phố bị ngập vào ngày mai.",
    "options": [
      {
        "key": "A",
        "text": "0,24"
      },
      {
        "key": "B",
        "text": "0,07"
      },
      {
        "key": "C",
        "text": "0,80"
      },
      {
        "key": "D",
        "text": "0,31"
      }
    ],
    "answer": "D",
    "explanation": "$P(\\text{ngập})=0{,}3\\cdot0{,}8+0{,}7\\cdot0{,}1=0{,}24+0{,}07=0{,}31$.",
    "points": 0.25,
    "tags": [
      "công thức xác suất toàn phần",
      "sơ đồ cây",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "probtree",
      "text": "Mưa: 0,3\n  Ngập: 0,8\n  Không ngập: 0,2\nKhông mưa: 0,7\n  Ngập: 0,1\n  Không ngập: 0,9"
    }
  },
  {
    "id": "thpt-thongke2-07",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Bảng thống kê bên dưới cho biết kết quả kiểm tra kĩ năng của 50 học sinh khối 12, phân theo giới tính. Chọn ngẫu nhiên một học sinh trong số các em đạt yêu cầu. Tính xác suất em đó là nam (làm tròn đến hàng phần trăm).",
    "options": [
      {
        "key": "A",
        "text": "0,45"
      },
      {
        "key": "B",
        "text": "0,55"
      },
      {
        "key": "C",
        "text": "0,36"
      },
      {
        "key": "D",
        "text": "0,60"
      }
    ],
    "answer": "B",
    "explanation": "Số học sinh đạt yêu cầu là $18+15=33$, trong đó có 18 nam. Xác suất cần tìm là $\\dfrac{18}{33}\\approx0{,}55$.",
    "points": 0.25,
    "tags": [
      "xác suất có điều kiện",
      "bảng số liệu",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "table",
      "title": "Kết quả kiểm tra kĩ năng của 50 học sinh",
      "data": "Đạt; Không đạt\nNam: 18; 12\nNữ: 15; 5"
    }
  },
  {
    "id": "thpt-thongke2-08",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một nhà máy nhận linh kiện từ ba nhà cung cấp X, Y, Z với tỉ lệ lần lượt là 40%, 35% và 25% tổng số linh kiện. Tỉ lệ linh kiện lỗi của X, Y, Z lần lượt là 2%, 4% và 5%. Lấy ngẫu nhiên một linh kiện và thấy linh kiện đó bị lỗi. Xác suất linh kiện đó do Z cung cấp là bao nhiêu (làm tròn đến hàng phần trăm)?",
    "options": [
      {
        "key": "A",
        "text": "0,40"
      },
      {
        "key": "B",
        "text": "0,25"
      },
      {
        "key": "C",
        "text": "0,36"
      },
      {
        "key": "D",
        "text": "0,33"
      }
    ],
    "answer": "C",
    "explanation": "$P(\\text{lỗi})=0{,}4\\cdot0{,}02+0{,}35\\cdot0{,}04+0{,}25\\cdot0{,}05=0{,}008+0{,}014+0{,}0125=0{,}0345$. Theo công thức Bayes, $P(\\text{Z}\\mid\\text{lỗi})=\\dfrac{0{,}0125}{0{,}0345}\\approx0{,}36$.",
    "points": 0.25,
    "tags": [
      "công thức Bayes",
      "công thức xác suất toàn phần",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-thongke2-09",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Trên mặt phẳng cho 8 điểm phân biệt, trong đó có đúng 4 điểm cùng nằm trên một đường thẳng và không có ba điểm nào khác thẳng hàng. Hỏi có bao nhiêu tam giác có ba đỉnh là ba trong số 8 điểm đã cho?",
    "options": [
      {
        "key": "A",
        "text": "56"
      },
      {
        "key": "B",
        "text": "52"
      },
      {
        "key": "C",
        "text": "48"
      },
      {
        "key": "D",
        "text": "60"
      }
    ],
    "answer": "B",
    "explanation": "Số bộ ba điểm bất kì là $\\mathrm{C}_8^3=56$. Có $\\mathrm{C}_4^3=4$ bộ ba điểm thẳng hàng (cùng nằm trên đường thẳng đã cho) không tạo thành tam giác. Số tam giác là $56-4=52$.",
    "points": 0.25,
    "tags": [
      "tổ hợp",
      "phần bù",
      "hình học tổ hợp",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-thongke2-10",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "trac-nghiem",
    "prompt": "Chọn ngẫu nhiên đồng thời hai số khác nhau từ tập hợp {1; 2; 3; …; 10}. Tính xác suất để tổng hai số được chọn là một số chẵn.",
    "options": [
      {
        "key": "A",
        "text": "$\\dfrac{1}{2}$"
      },
      {
        "key": "B",
        "text": "$\\dfrac{2}{9}$"
      },
      {
        "key": "C",
        "text": "$\\dfrac{4}{9}$"
      },
      {
        "key": "D",
        "text": "$\\dfrac{5}{9}$"
      }
    ],
    "answer": "C",
    "explanation": "Tổng hai số chẵn khi hai số cùng tính chẵn lẻ. Số cách chọn hai số cùng chẵn hoặc cùng lẻ là $2\\cdot\\mathrm{C}_5^2=20$. Số cách chọn bất kì là $\\mathrm{C}_{10}^2=45$. Xác suất là $\\dfrac{20}{45}=\\dfrac{4}{9}$.",
    "points": 0.25,
    "tags": [
      "xác suất cổ điển",
      "tổ hợp",
      "biến cố",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-thongke2-11",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Trong một hộp có 4 viên bi đỏ, 3 viên bi xanh và 2 viên bi vàng có kích thước như nhau. Lấy ngẫu nhiên đồng thời 2 viên bi từ hộp. Xét tính đúng, sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Số cách lấy 2 viên bi từ hộp là 36."
      },
      {
        "key": "b",
        "text": "Xác suất hai viên bi lấy ra cùng màu bằng $\\dfrac{5}{18}$."
      },
      {
        "key": "c",
        "text": "Xác suất lấy được ít nhất một viên bi đỏ bằng 0,6."
      },
      {
        "key": "d",
        "text": "Xác suất hai viên bi lấy ra khác màu bằng $\\dfrac{13}{18}$."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: $\\mathrm{C}_9^2=36$. b) Đúng: số cách lấy cùng màu là $\\mathrm{C}_4^2+\\mathrm{C}_3^2+\\mathrm{C}_2^2=6+3+1=10$, nên xác suất là $\\dfrac{10}{36}=\\dfrac{5}{18}$. c) Sai: có $\\mathrm{C}_5^2=10$ cách lấy hai bi không đỏ, nên $P=1-\\dfrac{10}{36}=\\dfrac{13}{18}\\approx0{,}72$. d) Đúng: khác màu là phần bù của cùng màu, $P=1-\\dfrac{5}{18}=\\dfrac{13}{18}$.",
    "points": 1,
    "tags": [
      "xác suất cổ điển",
      "biến cố đối",
      "tổ hợp",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-thongke2-12",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Từ các chữ số 0, 1, 2, 3, 4, 5 lập các số tự nhiên gồm 4 chữ số đôi một khác nhau. Xét tính đúng, sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Có 300 số được lập."
      },
      {
        "key": "b",
        "text": "Có 160 số chẵn được lập."
      },
      {
        "key": "c",
        "text": "Có 180 số lớn hơn 3000."
      },
      {
        "key": "d",
        "text": "Có 110 số chia hết cho 5."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng: có $6\\cdot5\\cdot4\\cdot3=360$ số, trừ $5\\cdot4\\cdot3=60$ số có chữ số 0 đứng đầu, còn $300$. b) Sai: số chẵn gồm tận cùng bằng 0 (60 số) và tận cùng bằng 2 hoặc 4 ($2\\cdot4\\cdot4\\cdot3=96$ số), tổng $156$. c) Đúng: chữ số đầu thuộc $\\{3;4;5\\}$ có 3 cách, ba chữ số còn lại $5\\cdot4\\cdot3=60$ cách, tổng $180$. d) Sai: tận cùng 0 có 60 số, tận cùng 5 có $4\\cdot4\\cdot3=48$ số, tổng $108$.",
    "points": 1,
    "tags": [
      "chỉnh hợp",
      "số tự nhiên",
      "bài đếm có ràng buộc",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-thongke2-13",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Biểu đồ bên dưới thống kê chiều cao của 30 học sinh một lớp. Xét tính đúng, sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Chiều cao trung bình của 30 học sinh là 162,7 cm (làm tròn đến hàng phần mười)."
      },
      {
        "key": "b",
        "text": "Nhóm chứa trung vị của mẫu số liệu ghép nhóm này là [160; 165)."
      },
      {
        "key": "c",
        "text": "Khoảng biến thiên của mẫu số liệu ghép nhóm này là 20."
      },
      {
        "key": "d",
        "text": "Mốt của mẫu số liệu ghép nhóm này là 162,5 cm."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "Giá trị đại diện: 152,5; 157,5; 162,5; 167,5; 172,5. a) Đúng: $\\bar x=\\dfrac{4880}{30}\\approx162{,}7$. b) Đúng: $n/2=15$ nằm giữa các cỡ tích lũy 10 và 20 nên nhóm chứa trung vị là [160; 165). c) Sai: khoảng biến thiên là $175-150=25$. d) Sai: $M_o=160+\\dfrac{10-7}{(10-7)+(10-6)}\\cdot5\\approx162{,}1$.",
    "points": 1,
    "tags": [
      "mẫu số liệu ghép nhóm",
      "trung bình",
      "trung vị",
      "mốt",
      "khoảng biến thiên",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "hist",
      "title": "Chiều cao của 30 học sinh",
      "xLabel": "Chiều cao (cm)",
      "yLabel": "Số học sinh",
      "data": "[150; 155) [155; 160) [160; 165) [165; 170) [170; 175)\nSố học sinh: 3; 7; 10; 6; 4"
    }
  },
  {
    "id": "thpt-thongke2-14",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Biểu đồ bên dưới thống kê thời gian đi từ nhà đến trường (phút) của học sinh hai lớp 12A và 12B, mỗi lớp 30 học sinh. Xét tính đúng, sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Số trung bình của mẫu số liệu lớp 12A là 22 phút."
      },
      {
        "key": "b",
        "text": "Số trung bình của mẫu số liệu lớp 12B bằng 22 phút."
      },
      {
        "key": "c",
        "text": "Độ phân tán của lớp 12A lớn hơn lớp 12B nếu đo bằng độ lệch chuẩn."
      },
      {
        "key": "d",
        "text": "Khoảng tứ phân vị của lớp 12B lớn hơn khoảng tứ phân vị của lớp 12A."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng: $\\bar x_A=\\dfrac{4\\cdot5+8\\cdot15+12\\cdot25+5\\cdot35+1\\cdot45}{30}=22$. b) Sai: $\\bar x_B=\\dfrac{2\\cdot5+6\\cdot15+14\\cdot25+6\\cdot35+2\\cdot45}{30}=25$. c) Đúng: $s_A\\approx10{,}05$ và $s_B\\approx9{,}66$. d) Sai: $\\Delta_Q^A\\approx14{,}38$ và $\\Delta_Q^B\\approx11{,}67$.",
    "points": 1,
    "tags": [
      "mẫu số liệu ghép nhóm",
      "so sánh độ phân tán",
      "độ lệch chuẩn",
      "khoảng tứ phân vị",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "table",
      "title": "Thời gian đi từ nhà đến trường của học sinh hai lớp",
      "data": "[0; 10) [10; 20) [20; 30) [30; 40) [40; 50)\nLớp 12A: 4; 8; 12; 5; 1\nLớp 12B: 2; 6; 14; 6; 2"
    }
  },
  {
    "id": "thpt-thongke2-15",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một nhà máy sản xuất sản phẩm bằng hai dây chuyền. Sơ đồ cây bên dưới cho biết tỉ lệ sản phẩm do mỗi dây chuyền sản xuất và tỉ lệ sản phẩm lỗi tương ứng. Chọn ngẫu nhiên một sản phẩm của nhà máy. Xét tính đúng, sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Xác suất sản phẩm được chọn là sản phẩm lỗi bằng 0,038."
      },
      {
        "key": "b",
        "text": "Biết sản phẩm được chọn là sản phẩm lỗi, xác suất sản phẩm đó do dây chuyền 1 sản xuất là 0,53."
      },
      {
        "key": "c",
        "text": "Xác suất sản phẩm được chọn không bị lỗi bằng 0,962."
      },
      {
        "key": "d",
        "text": "Biết sản phẩm được chọn là sản phẩm lỗi, xác suất sản phẩm đó do dây chuyền 2 sản xuất là 0,4."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng: $P(\\text{lỗi})=0{,}6\\cdot0{,}03+0{,}4\\cdot0{,}05=0{,}038$. b) Sai: $P(\\text{DC1}\\mid\\text{lỗi})=\\dfrac{0{,}018}{0{,}038}\\approx0{,}47$. c) Đúng: $1-0{,}038=0{,}962$. d) Sai: $P(\\text{DC2}\\mid\\text{lỗi})=\\dfrac{0{,}02}{0{,}038}\\approx0{,}53$.",
    "points": 1,
    "tags": [
      "công thức Bayes",
      "công thức xác suất toàn phần",
      "sơ đồ cây",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "probtree",
      "text": "Dây chuyền 1: 0,6\n  Lỗi: 0,03\n  Không lỗi: 0,97\nDây chuyền 2: 0,4\n  Lỗi: 0,05\n  Không lỗi: 0,95"
    }
  },
  {
    "id": "thpt-thongke2-16",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Có 6 đội bóng tham gia một giải đấu. Xét tính đúng, sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Nếu mỗi cặp đội gặp nhau đúng một trận thì có 15 trận đấu."
      },
      {
        "key": "b",
        "text": "Nếu mỗi cặp đội gặp nhau hai trận (lượt đi và lượt về) thì có 20 trận đấu."
      },
      {
        "key": "c",
        "text": "Có 120 cách chọn 3 đội trong 6 đội để lập ban tổ chức."
      },
      {
        "key": "d",
        "text": "Có 120 cách xếp thứ hạng nhất, nhì, ba (không có đồng hạng) cho 6 đội."
      }
    ],
    "answer": "ĐSSĐ",
    "explanation": "a) Đúng: $\\mathrm{C}_6^2=15$. b) Sai: mỗi cặp có 2 trận nên $2\\cdot15=30$ trận. c) Sai: chọn 3 đội không phân biệt thứ tự là $\\mathrm{C}_6^3=20$ cách. d) Đúng: xếp thứ hạng có thứ tự nên $\\mathrm{A}_6^3=120$.",
    "points": 1,
    "tags": [
      "tổ hợp",
      "chỉnh hợp",
      "phân biệt thứ tự",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-thongke2-17",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "dung-sai",
    "prompt": "Ba học sinh A, B, C làm bài kiểm tra độc lập với nhau. Xác suất đạt yêu cầu của A, B, C lần lượt là 0,6; 0,7 và 0,5. Xét tính đúng, sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Xác suất cả ba học sinh đều đạt yêu cầu là 0,21."
      },
      {
        "key": "b",
        "text": "Xác suất có ít nhất một học sinh đạt yêu cầu là 0,94."
      },
      {
        "key": "c",
        "text": "Xác suất đúng hai học sinh đạt yêu cầu là 0,5."
      },
      {
        "key": "d",
        "text": "Xác suất chỉ học sinh B đạt yêu cầu là 0,21."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) Đúng: $0{,}6\\cdot0{,}7\\cdot0{,}5=0{,}21$. b) Đúng: $1-0{,}4\\cdot0{,}3\\cdot0{,}5=0{,}94$. c) Sai: $0{,}6\\cdot0{,}7\\cdot0{,}5+0{,}6\\cdot0{,}3\\cdot0{,}5+0{,}4\\cdot0{,}7\\cdot0{,}5=0{,}21+0{,}09+0{,}14=0{,}44$. d) Sai: $0{,}4\\cdot0{,}7\\cdot0{,}5=0{,}14$.",
    "points": 1,
    "tags": [
      "biến cố độc lập",
      "biến cố giao",
      "biến cố hợp",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-thongke2-18",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một bệnh có tỉ lệ mắc trong dân cư là 2%. Một xét nghiệm cho kết quả dương tính với người mắc bệnh với xác suất 0,9 và cho kết quả dương tính với người không mắc bệnh với xác suất 0,1. Chọn ngẫu nhiên một người và thực hiện hai lần xét nghiệm độc lập với nhau. Xét tính đúng, sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Xác suất lần xét nghiệm thứ nhất cho kết quả dương tính là 0,116."
      },
      {
        "key": "b",
        "text": "Biết lần xét nghiệm thứ nhất cho kết quả dương tính, xác suất người đó mắc bệnh là 0,12."
      },
      {
        "key": "c",
        "text": "Biết cả hai lần xét nghiệm đều dương tính, xác suất người đó mắc bệnh là 0,5."
      },
      {
        "key": "d",
        "text": "Xác suất cả hai lần xét nghiệm đều âm tính là 0,79 (làm tròn đến hàng phần trăm)."
      }
    ],
    "answer": "ĐSSĐ",
    "explanation": "a) Đúng: $0{,}02\\cdot0{,}9+0{,}98\\cdot0{,}1=0{,}116$. b) Sai: $P(\\text{bệnh}\\mid\\text{dương})=\\dfrac{0{,}018}{0{,}116}\\approx0{,}16$. c) Sai: $P(\\text{dương},\\text{dương})=0{,}02\\cdot0{,}81+0{,}98\\cdot0{,}01=0{,}026$, nên $P(\\text{bệnh}\\mid\\text{hai dương})=\\dfrac{0{,}0162}{0{,}026}\\approx0{,}62$. d) Đúng: $0{,}02\\cdot0{,}01+0{,}98\\cdot0{,}81=0{,}794\\approx0{,}79$.",
    "points": 1,
    "tags": [
      "công thức Bayes",
      "biến cố độc lập",
      "công thức xác suất toàn phần",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-thongke2-19",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Có 4 bạn nam và 4 bạn nữ ngồi quanh một bàn tròn (hai cách xếp được coi là giống nhau nếu có thể nhận được từ nhau bằng cách xoay bàn). Hỏi có bao nhiêu cách xếp sao cho nam và nữ ngồi xen kẽ nhau?",
    "answer": "144",
    "explanation": "Xếp 4 bạn nam quanh bàn tròn có $(4-1)!=6$ cách. Giữa các bạn nam có 4 chỗ trống, xếp 4 bạn nữ vào đó có $4!=24$ cách. Đáp số $6\\cdot24=144$.",
    "points": 0.5,
    "tags": [
      "hoán vị vòng quanh",
      "xếp chỗ có ràng buộc",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-thongke2-20",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Lớp có 5 bạn nam và 6 bạn nữ. Chọn một nhóm gồm 5 bạn, trong đó có đúng 2 bạn nam. Sau đó, trong nhóm vừa chọn, chọn một bạn làm nhóm trưởng và một bạn khác làm nhóm phó. Hỏi có bao nhiêu cách thực hiện?",
    "answer": "4000",
    "explanation": "Chọn 2 nam từ 5 nam: $\\mathrm{C}_5^2=10$ cách. Chọn 3 nữ từ 6 nữ: $\\mathrm{C}_6^3=20$ cách. Chọn nhóm trưởng và nhóm phó có thứ tự từ 5 bạn: $\\mathrm{A}_5^2=20$ cách. Đáp số $10\\cdot20\\cdot20=4000$.",
    "points": 0.5,
    "tags": [
      "tổ hợp",
      "chỉnh hợp",
      "quy tắc nhân",
      "bài đếm có ràng buộc",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-thongke2-21",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Rút ngẫu nhiên một lá bài từ bộ bài tú lơ khơ 52 lá. Tính xác suất lá bài rút ra là lá át hoặc là lá bài cơ (làm tròn đến hàng phần trăm, ghi đáp án dưới dạng số thập phân).",
    "answer": "0,31",
    "explanation": "Có 4 lá át, 13 lá cơ và 1 lá vừa át vừa cơ, nên số kết quả thuận lợi là $4+13-1=16$. Xác suất là $\\dfrac{16}{52}=\\dfrac{4}{13}\\approx0{,}31$.",
    "points": 0.5,
    "tags": [
      "xác suất cổ điển",
      "biến cố hợp",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-thongke2-22",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Trong một hộp có 10 viên bi được đánh số từ 1 đến 10. Lấy ngẫu nhiên đồng thời 3 viên bi từ hộp. Tính xác suất cả 3 viên bi lấy ra đều mang số chẵn (làm tròn đến hàng phần trăm, ghi đáp án dưới dạng số thập phân).",
    "answer": "0,08",
    "explanation": "Số kết quả đồng khả năng là $\\mathrm{C}_{10}^3=120$. Số cách lấy 3 bi chẵn từ 5 bi chẵn là $\\mathrm{C}_5^3=10$. Xác suất là $\\dfrac{10}{120}=\\dfrac{1}{12}\\approx0{,}08$.",
    "points": 0.5,
    "tags": [
      "xác suất cổ điển",
      "tổ hợp",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-thongke2-23",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Biểu đồ bên dưới thống kê điểm đánh giá sản phẩm của 40 khách hàng. Tính trung vị của mẫu số liệu ghép nhóm này (làm tròn đến hàng phần mười, ghi đáp án dưới dạng số thập phân).",
    "answer": "75,8",
    "explanation": "$n=40$, cỡ mẫu $n/2=20$. Nhóm chứa trung vị là [70; 80) vì tần số tích lũy đến [60; 70) là 13 và đến [70; 80) là 25. Trung vị $M_e=70+\\dfrac{20-13}{12}\\cdot10\\approx75{,}8$.",
    "points": 0.5,
    "tags": [
      "mẫu số liệu ghép nhóm",
      "trung vị",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "hist",
      "title": "Điểm đánh giá sản phẩm của 40 khách hàng",
      "xLabel": "Điểm",
      "yLabel": "Số khách hàng",
      "data": "[50; 60) [60; 70) [70; 80) [80; 90) [90; 100)\nSố khách hàng: 5; 8; 12; 10; 5"
    }
  },
  {
    "id": "thpt-thongke2-24",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một lô hàng có 10 sản phẩm, trong đó có 3 phế phẩm. Lấy ngẫu nhiên lần lượt, không hoàn lại, hai sản phẩm từ lô hàng. Biết sản phẩm lấy ra lần đầu là chính phẩm, tính xác suất sản phẩm lấy ra lần thứ hai là phế phẩm (làm tròn đến hàng phần trăm, ghi đáp án dưới dạng số thập phân).",
    "answer": "0,33",
    "explanation": "Sau khi lấy ra một chính phẩm, lô hàng còn 9 sản phẩm, trong đó có 3 phế phẩm. Xác suất cần tìm là $\\dfrac{3}{9}\\approx0{,}33$.",
    "points": 0.5,
    "tags": [
      "xác suất có điều kiện",
      "lấy mẫu không hoàn lại",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-thongke2-25",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Biểu đồ bên dưới thống kê số lần đi siêu thị trong một tháng của 25 khách hàng. Tính độ lệch chuẩn của mẫu số liệu ghép nhóm này (làm tròn đến hàng phần mười, ghi đáp án dưới dạng số thập phân).",
    "answer": "4,5",
    "explanation": "Giá trị đại diện: 2; 6; 10; 14; 18. Số trung bình $\\bar x\\approx10{,}16$. Phương sai $s^2\\approx19{,}81$. Độ lệch chuẩn $s=\\sqrt{19{,}81}\\approx4{,}45\\approx4{,}5$.",
    "points": 0.5,
    "tags": [
      "mẫu số liệu ghép nhóm",
      "phương sai",
      "độ lệch chuẩn",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "hist",
      "title": "Số lần đi siêu thị trong một tháng",
      "xLabel": "Số lần",
      "yLabel": "Số khách hàng",
      "data": "[0; 4) [4; 8) [8; 12) [12; 16) [16; 20)\nSố khách hàng: 2; 6; 9; 5; 3"
    }
  },
  {
    "id": "thpt-thongke2-26",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Sơ đồ cây bên dưới cho biết xác suất thời tiết của hai ngày liên tiếp ở một địa phương. Biết ngày mai trời nắng, tính xác suất hôm nay trời nắng (làm tròn đến hàng phần trăm, ghi đáp án dưới dạng số thập phân).",
    "answer": "0,72",
    "explanation": "$P(\\text{mai nắng})=0{,}6\\cdot0{,}7+0{,}4\\cdot0{,}4=0{,}42+0{,}16=0{,}58$. Theo công thức Bayes, $P(\\text{hôm nay nắng}\\mid\\text{mai nắng})=\\dfrac{0{,}42}{0{,}58}\\approx0{,}72$.",
    "points": 0.5,
    "tags": [
      "công thức Bayes",
      "công thức xác suất toàn phần",
      "sơ đồ cây",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "probtree",
      "text": "Hôm nay nắng: 0,6\n  Mai nắng: 0,7\n  Mai không nắng: 0,3\nHôm nay không nắng: 0,4\n  Mai nắng: 0,4\n  Mai không nắng: 0,6"
    }
  },
  {
    "id": "thpt-thongke2-27",
    "subject": "Toán",
    "grades": [
      "Lớp 11"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Gieo hai con xúc xắc cân đối và đồng chất. Tính xác suất để tổng số chấm xuất hiện trên hai con xúc xắc chia hết cho 3 (làm tròn đến hàng phần trăm, ghi đáp án dưới dạng số thập phân).",
    "answer": "0,33",
    "explanation": "Không gian mẫu có $6\\cdot6=36$ kết quả. Các tổng chia hết cho 3 là 3, 6, 9, 12 với số kết quả lần lượt là 2, 5, 4, 1, tổng 12. Xác suất là $\\dfrac{12}{36}=\\dfrac{1}{3}\\approx0{,}33$.",
    "points": 0.5,
    "tags": [
      "xác suất cổ điển",
      "biến cố",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-thongke2-28",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Từ các chữ số 1, 2, 3, 4, 5, 6 có thể lập được bao nhiêu số tự nhiên chẵn gồm 3 chữ số đôi một khác nhau?",
    "answer": "60",
    "explanation": "Chữ số hàng đơn vị thuộc {2; 4; 6} nên có 3 cách. Chữ số hàng trăm lấy từ 5 chữ số còn lại: 5 cách. Chữ số hàng chục lấy từ 4 chữ số còn lại: 4 cách. Đáp số $3\\cdot5\\cdot4=60$.",
    "points": 0.5,
    "tags": [
      "chỉnh hợp",
      "số tự nhiên",
      "bài đếm có ràng buộc",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-thongke2-29",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Có 9 học sinh cần chia thành 3 nhóm, mỗi nhóm 3 học sinh (các nhóm không phân biệt thứ tự). Hỏi có bao nhiêu cách chia?",
    "answer": "280",
    "explanation": "Chọn 3 học sinh vào nhóm thứ nhất: $\\mathrm{C}_9^3=84$ cách. Chọn 3 học sinh vào nhóm thứ hai từ 6 học sinh còn lại: $\\mathrm{C}_6^3=20$ cách. Nhóm cuối cùng là 3 học sinh còn lại. Vì các nhóm không phân biệt thứ tự nên chia cho $3!=6$: $\\dfrac{84\\cdot20}{6}=280$.",
    "points": 0.5,
    "tags": [
      "tổ hợp",
      "chia nhóm",
      "bài đếm",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-thongke2-30",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một học sinh làm bài trắc nghiệm, mỗi câu có 4 phương án trả lời và chỉ một phương án đúng. Xác suất học sinh đó biết bài là 0,6. Nếu biết bài thì trả lời đúng chắc chắn; nếu không biết thì chọn ngẫu nhiên một phương án. Biết học sinh trả lời đúng một câu được chọn ngẫu nhiên, tính xác suất học sinh đó thực sự biết bài (làm tròn đến hàng phần trăm, ghi đáp án dưới dạng số thập phân).",
    "answer": "0,86",
    "explanation": "$P(\\text{đúng})=0{,}6\\cdot1+0{,}4\\cdot0{,}25=0{,}7$. Theo công thức Bayes, $P(\\text{biết}\\mid\\text{đúng})=\\dfrac{0{,}6}{0{,}7}\\approx0{,}86$.",
    "points": 0.5,
    "tags": [
      "công thức Bayes",
      "công thức xác suất toàn phần",
      "sơ đồ cây",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "probtree",
      "text": "Biết bài: 0,6\n  Đúng: 1\n  Sai: 0\nKhông biết bài: 0,4\n  Đúng: 0,25\n  Sai: 0,75"
    }
  },
  {
    "id": "thpt-tichphan-01",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Họ nguyên hàm của hàm số $f(x)=3x^2-2x+1$ là:",
    "options": [
      {
        "key": "A",
        "text": "$3x^3-2x^2+x+C$"
      },
      {
        "key": "B",
        "text": "$x^3-2x^2+x+C$"
      },
      {
        "key": "C",
        "text": "$x^3-x^2+x+C$"
      },
      {
        "key": "D",
        "text": "$6x-2+C$"
      }
    ],
    "answer": "C",
    "explanation": "Áp dụng $\\int x^n\\,dx=\\frac{x^{n+1}}{n+1}+C$ với $n\\neq -1$: $\\int(3x^2-2x+1)\\,dx=x^3-x^2+x+C$. Phương án A không chia cho số mũ mới (giữ nguyên hệ số $3$ và $-2$), B quên chia bậc mới ở hạng tử $-2x$, D lấy đạo hàm thay vì nguyên hàm.",
    "points": 0.25,
    "tags": [
      "nguyên hàm",
      "bảng nguyên hàm cơ bản",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-tichphan-02",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Tính tích phân $\\int_0^2 (x^2+1)\\,dx$.",
    "options": [
      {
        "key": "A",
        "text": "$\\frac{8}{3}$"
      },
      {
        "key": "B",
        "text": "$\\frac{10}{3}$"
      },
      {
        "key": "C",
        "text": "$6$"
      },
      {
        "key": "D",
        "text": "$\\frac{14}{3}$"
      }
    ],
    "answer": "D",
    "explanation": "$\\int_0^2 (x^2+1)\\,dx=\\left[\\frac{x^3}{3}+x\\right]_0^2=\\frac{8}{3}+2=\\frac{14}{3}$. Phương án A quên phần $\\int_0^2 dx=2$.",
    "points": 0.25,
    "tags": [
      "tích phân",
      "tính tích phân cơ bản",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-tichphan-03",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hàm số $y=x^3-3x$ có đồ thị như hình bên dưới. Diện tích hình phẳng giới hạn bởi đồ thị hàm số và trục hoành bằng bao nhiêu?",
    "options": [
      {
        "key": "A",
        "text": "$\\frac{9}{4}$"
      },
      {
        "key": "B",
        "text": "$\\frac{9}{2}$"
      },
      {
        "key": "C",
        "text": "$9$"
      },
      {
        "key": "D",
        "text": "$0$"
      }
    ],
    "answer": "B",
    "explanation": "Đồ thị cắt trục hoành tại $x=-\\sqrt{3}$, $x=0$, $x=\\sqrt{3}$, tạo thành hai phần đối xứng qua gốc tọa độ. Có $\\int_0^{\\sqrt3}(x^3-3x)\\,dx=\\left[\\frac{x^4}{4}-\\frac{3x^2}{2}\\right]_0^{\\sqrt3}=-\\frac{9}{4}$, nên mỗi phần có diện tích $\\frac{9}{4}$. Tổng $S=\\frac{9}{2}$. Phương án D do tính thẳng $\\int_{-\\sqrt3}^{\\sqrt3}$ mà không lấy trị tuyệt đối, nên bị triệt tiêu.",
    "points": 0.25,
    "tags": [
      "diện tích hình phẳng",
      "đồ thị hàm bậc ba",
      "TH"
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
    "id": "thpt-tichphan-04",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một chất điểm chuyển động thẳng với vận tốc $v(t)=t^2-4t+3$ (m/s), $t\\ge 0$. Quãng đường chất điểm đi được từ thời điểm $t=0$ đến $t=4$ (giây) là bao nhiêu mét?",
    "options": [
      {
        "key": "A",
        "text": "$4$"
      },
      {
        "key": "B",
        "text": "$\\frac{4}{3}$"
      },
      {
        "key": "C",
        "text": "$\\frac{8}{3}$"
      },
      {
        "key": "D",
        "text": "$8$"
      }
    ],
    "answer": "A",
    "explanation": "$v(t)=0$ khi $t=1$ hoặc $t=3$, nên $v$ đổi dấu trên $[0;4]$. Quãng đường $s=\\int_0^4|v(t)|\\,dt=\\int_0^1 v\\,dt-\\int_1^3 v\\,dt+\\int_3^4 v\\,dt=\\frac{4}{3}+\\frac{4}{3}+\\frac{4}{3}=4$ m. Phương án B là độ dời $\\int_0^4 v\\,dt=\\frac{4}{3}$, không phải quãng đường.",
    "points": 0.25,
    "tags": [
      "ứng dụng tích phân",
      "chuyển động v(t)",
      "quãng đường",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-tichphan-05",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho parabol $(P)$ và đường thẳng $d$ có đồ thị như hình bên dưới. Diện tích hình phẳng giới hạn bởi $(P)$ và $d$ bằng:",
    "options": [
      {
        "key": "A",
        "text": "$\\frac{16}{3}$"
      },
      {
        "key": "B",
        "text": "$\\frac{8}{3}$"
      },
      {
        "key": "C",
        "text": "$\\frac{32}{3}$"
      },
      {
        "key": "D",
        "text": "$\\frac{64}{3}$"
      }
    ],
    "answer": "C",
    "explanation": "Hoành độ giao điểm: $x^2-2x=2x \\Leftrightarrow x=0$ hoặc $x=4$. Trên $[0;4]$ có $2x\\ge x^2-2x$. Vậy $S=\\int_0^4\\left(2x-x^2+2x\\right)dx=\\int_0^4(4x-x^2)\\,dx=\\left[2x^2-\\frac{x^3}{3}\\right]_0^4=\\frac{32}{3}$.",
    "points": 0.25,
    "tags": [
      "diện tích hình phẳng",
      "parabol và đường thẳng",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "oxy",
      "xMin": -1,
      "xMax": 5,
      "yMin": -2,
      "yMax": 10,
      "items": "(P): y = x^2 - 2x\nd: y = 2x"
    }
  },
  {
    "id": "thpt-tichphan-06",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Gọi $V$ là thể tích khối tròn xoay sinh ra khi quay quanh trục $Ox$ hình phẳng giới hạn bởi đồ thị hàm số $y=\\sqrt{x}$, trục $Ox$ và đường thẳng $x=4$. Tính $V$.",
    "options": [
      {
        "key": "A",
        "text": "$4\\pi$"
      },
      {
        "key": "B",
        "text": "$16\\pi$"
      },
      {
        "key": "C",
        "text": "$\\frac{8\\pi}{3}$"
      },
      {
        "key": "D",
        "text": "$8\\pi$"
      }
    ],
    "answer": "D",
    "explanation": "$V=\\pi\\int_0^4 (\\sqrt{x})^2\\,dx=\\pi\\int_0^4 x\\,dx=\\pi\\left[\\frac{x^2}{2}\\right]_0^4=8\\pi$.",
    "points": 0.25,
    "tags": [
      "thể tích khối tròn xoay",
      "quay quanh Ox",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-tichphan-07",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Gọi $V$ là thể tích khối tròn xoay sinh ra khi quay quanh trục $Ox$ hình phẳng giới hạn bởi hai đường $y=x^2$ và $y=2x$. Tính $V$.",
    "options": [
      {
        "key": "A",
        "text": "$\\frac{32\\pi}{15}$"
      },
      {
        "key": "B",
        "text": "$\\frac{64\\pi}{15}$"
      },
      {
        "key": "C",
        "text": "$\\frac{16\\pi}{3}$"
      },
      {
        "key": "D",
        "text": "$\\frac{64\\pi}{5}$"
      }
    ],
    "answer": "B",
    "explanation": "Hoành độ giao điểm: $x^2=2x \\Leftrightarrow x=0$ hoặc $x=2$. Trên $[0;2]$ có $2x\\ge x^2$. Vậy $V=\\pi\\int_0^2\\left[(2x)^2-(x^2)^2\\right]dx=\\pi\\int_0^2(4x^2-x^4)\\,dx=\\pi\\left[\\frac{4x^3}{3}-\\frac{x^5}{5}\\right]_0^2=\\pi\\left(\\frac{32}{3}-\\frac{32}{5}\\right)=\\frac{64\\pi}{15}$.",
    "points": 0.25,
    "tags": [
      "thể tích khối tròn xoay",
      "quay quanh Ox",
      "hai đường cong",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-tichphan-08",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hàm số $N(t)=\\frac{2t+1}{t+1}$ có đồ thị như hình bên dưới. Giá trị của $\\int_0^3 N(t)\\,dt$ bằng:",
    "options": [
      {
        "key": "A",
        "text": "$6-2\\ln 2$"
      },
      {
        "key": "B",
        "text": "$6+2\\ln 2$"
      },
      {
        "key": "C",
        "text": "$4-2\\ln 2$"
      },
      {
        "key": "D",
        "text": "$6-\\ln 2$"
      }
    ],
    "answer": "A",
    "explanation": "Ta có $\\frac{2t+1}{t+1}=2-\\frac{1}{t+1}$, nên $\\int_0^3 N(t)\\,dt=\\left[2t-\\ln(t+1)\\right]_0^3=6-\\ln 4=6-2\\ln 2$. Phương án B sai dấu khi lấy nguyên hàm của $\\frac{1}{t+1}$.",
    "points": 0.25,
    "tags": [
      "tích phân",
      "hàm hữu tỉ",
      "logarit",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "(2x+1)/(x+1)"
      ],
      "xMin": 0,
      "xMax": 4
    }
  },
  {
    "id": "thpt-tichphan-09",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $f(x)=3x^2-2x+1$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "$F(x)=x^3-x^2+x$ là một nguyên hàm của $f(x)$ trên $\\mathbb{R}$."
      },
      {
        "key": "b",
        "text": "$\\int_0^1 f(x)\\,dx=2$."
      },
      {
        "key": "c",
        "text": "Nguyên hàm $F(x)$ của $f(x)$ thỏa $F(0)=2$ có $F(1)=3$."
      },
      {
        "key": "d",
        "text": "$\\int_{-1}^{1} f(x)\\,dx=0$."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng: $F'(x)=3x^2-2x+1=f(x)$. b) Sai: $\\int_0^1 f(x)\\,dx=\\left[x^3-x^2+x\\right]_0^1=1$. c) Đúng: $F(x)=x^3-x^2+x+C$, $F(0)=C=2$ nên $F(1)=1-1+1+2=3$. d) Sai: $\\int_{-1}^1 f(x)\\,dx=\\left[x^3-x^2+x\\right]_{-1}^1=1-(-3)=4$.",
    "points": 1,
    "tags": [
      "nguyên hàm",
      "tích phân",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-tichphan-10",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho parabol $(P)$ và đường thẳng $d$ có đồ thị như hình bên dưới. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Hoành độ giao điểm của $(P)$ và $d$ là $x=-2$ và $x=1$."
      },
      {
        "key": "b",
        "text": "Diện tích hình phẳng giới hạn bởi $(P)$ và $d$ bằng $\\frac{9}{2}$."
      },
      {
        "key": "c",
        "text": "Diện tích hình phẳng giới hạn bởi $(P)$ và $d$ bằng $\\frac{27}{2}$."
      },
      {
        "key": "d",
        "text": "Khi quay hình phẳng giới hạn bởi $(P)$ và $d$ quanh trục $Ox$ thì thể tích khối tròn xoay là $\\frac{108\\pi}{5}$."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "Giải $-x^2+4=x+2 \\Leftrightarrow x^2+x-2=0$, được $x=-2$ hoặc $x=1$. Trên $[-2;1]$ có $-x^2+4\\ge x+2$. a) Đúng. b) $S=\\int_{-2}^{1}(-x^2-x+2)\\,dx=\\left[-\\frac{x^3}{3}-\\frac{x^2}{2}+2x\\right]_{-2}^{1}=\\frac{7}{6}+\\frac{10}{3}=\\frac{9}{2}$: đúng. c) Sai, vì diện tích là $\\frac{9}{2}$. d) $V=\\pi\\int_{-2}^{1}\\left[(-x^2+4)^2-(x+2)^2\\right]dx=\\pi\\int_{-2}^{1}(x^4-9x^2-4x+12)\\,dx=\\frac{108\\pi}{5}$: đúng.",
    "points": 1,
    "tags": [
      "diện tích hình phẳng",
      "thể tích khối tròn xoay",
      "parabol và đường thẳng",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "oxy",
      "xMin": -3,
      "xMax": 3,
      "yMin": -6,
      "yMax": 5,
      "items": "(P): y = -x^2 + 4\nd: y = x + 2"
    }
  },
  {
    "id": "thpt-tichphan-11",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một chất điểm chuyển động thẳng với vận tốc $v(t)=3t^2-6t+4$ (m/s), $t\\ge 0$, và tại $t=0$ đang ở gốc tọa độ trên đường thẳng. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Gia tốc của chất điểm tại thời điểm $t$ là $a(t)=6t-6$ (m/s²)."
      },
      {
        "key": "b",
        "text": "Vận tốc nhỏ nhất của chất điểm bằng $0$ m/s."
      },
      {
        "key": "c",
        "text": "Quãng đường chất điểm đi được trong khoảng thời gian từ $t=0$ đến $t=2$ bằng $4$ m."
      },
      {
        "key": "d",
        "text": "Quãng đường chất điểm đi được trong 3 giây đầu bằng $10$ m."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng: $a(t)=v'(t)=6t-6$. b) Sai: $v(t)=3(t-1)^2+1\\ge 1$, giá trị nhỏ nhất là $1$ tại $t=1$. c) Đúng: $v(t)>0$ nên quãng đường bằng $\\int_0^2 v\\,dt=\\left[t^3-3t^2+4t\\right]_0^2=4$ m. d) Sai: $\\int_0^3 v\\,dt=27-27+12=12$ m.",
    "points": 1,
    "tags": [
      "chuyển động v(t)",
      "quãng đường",
      "gia tốc",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-tichphan-12",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Lưu lượng nước chảy vào một bể tại thời điểm $t$ phút là $q(t)=t^2+2$ (lít/phút), với $0\\le t\\le 6$. Lúc đầu bể không có nước. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Sau 6 phút, lượng nước chảy vào bể là 84 lít."
      },
      {
        "key": "b",
        "text": "Tại thời điểm $t=3$ phút, lưu lượng nước là 11 lít/phút."
      },
      {
        "key": "c",
        "text": "Lượng nước chảy vào bể trong khoảng từ phút thứ 3 đến phút thứ 6 là 60 lít."
      },
      {
        "key": "d",
        "text": "Lưu lượng trung bình trên đoạn $[0;6]$ là 12 lít/phút."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) Đúng: $\\int_0^6(t^2+2)\\,dt=\\left[\\frac{t^3}{3}+2t\\right]_0^6=72+12=84$ lít. b) Đúng: $q(3)=9+2=11$. c) Sai: $\\int_3^6 q\\,dt=\\left[\\frac{t^3}{3}+2t\\right]_3^6=84-15=69$ lít. d) Sai: lưu lượng trung bình là $\\frac{84}{6}=14$ lít/phút.",
    "points": 1,
    "tags": [
      "ứng dụng tích phân",
      "lưu lượng",
      "tích phân",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-tichphan-13",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Cho hàm số $f(x)=x^2-4x+3$ có bảng xét dấu như hình bên dưới. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "$f(x)\\le 0$ với mọi $x\\in[1;3]$."
      },
      {
        "key": "b",
        "text": "$\\int_1^3 f(x)\\,dx=\\frac{4}{3}$."
      },
      {
        "key": "c",
        "text": "Diện tích hình phẳng giới hạn bởi đồ thị $y=f(x)$, trục hoành và hai đường thẳng $x=1$, $x=3$ bằng $\\frac{4}{3}$."
      },
      {
        "key": "d",
        "text": "$\\int_0^4 |f(x)|\\,dx=4$."
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) Đúng: theo bảng xét dấu, $f(x)<0$ trên $(1;3)$. b) Sai: $\\int_1^3 f(x)\\,dx=\\left[\\frac{x^3}{3}-2x^2+3x\\right]_1^3=-\\frac{4}{3}$. c) Đúng: diện tích bằng $\\left|\\int_1^3 f(x)\\,dx\\right|=\\frac{4}{3}$. d) Đúng: $\\int_0^4|f(x)|\\,dx=\\frac{4}{3}+\\frac{4}{3}+\\frac{4}{3}=4$.",
    "points": 1,
    "tags": [
      "xét dấu",
      "diện tích hình phẳng",
      "tích phân có trị tuyệt đối",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "signtable",
      "expr": "(x-1)(x-3)"
    }
  },
  {
    "id": "thpt-tichphan-14",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một biển quảng cáo hình phẳng trong mặt phẳng tọa độ $Oxy$ (đơn vị mét) được giới hạn bởi hai parabol $(P_1): y=4-x^2$ và $(P_2): y=x^2-2$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Hoành độ giao điểm của $(P_1)$ và $(P_2)$ là $x=-\\sqrt{3}$ và $x=\\sqrt{3}$."
      },
      {
        "key": "b",
        "text": "Diện tích biển quảng cáo bằng $8\\sqrt{3}$ m²."
      },
      {
        "key": "c",
        "text": "Nếu sơn biển với giá 200 000 đồng/m² thì chi phí sơn khoảng 2,5 triệu đồng."
      },
      {
        "key": "d",
        "text": "Phần biển nằm phía dưới trục hoành có diện tích $\\frac{4\\sqrt{2}}{3}$ m²."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) Đúng: $4-x^2=x^2-2 \\Leftrightarrow x^2=3$. b) Đúng: trên $[-\\sqrt3;\\sqrt3]$ có $(P_1)\\ge(P_2)$, nên $S=\\int_{-\\sqrt3}^{\\sqrt3}(6-2x^2)\\,dx=\\left[6x-\\frac{2x^3}{3}\\right]_{-\\sqrt3}^{\\sqrt3}=8\\sqrt3\\approx 13,86$ m². c) Sai: $8\\sqrt3\\cdot 200\\,000\\approx 2\\,771\\,000$ đồng, tức khoảng 2,8 triệu đồng. d) Sai: phần dưới trục hoành là $\\int_{-\\sqrt2}^{\\sqrt2}(2-x^2)\\,dx=\\frac{8\\sqrt2}{3}$ m².",
    "points": 1,
    "tags": [
      "ứng dụng tích phân",
      "diện tích hình phẳng",
      "bài toán thực tế",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-tichphan-15",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Số lượng (nghìn con) của một đàn sinh vật sau $t$ năm được mô hình hóa bởi $N(t)=\\frac{2t+3}{t+1}$, $t\\ge 0$. Xét tính đúng sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "$N(0)=3$."
      },
      {
        "key": "b",
        "text": "$N(t)\\ge 3$ với mọi $t\\ge 0$."
      },
      {
        "key": "c",
        "text": "Hàm số $N(t)$ nghịch biến trên khoảng $(0;+\\infty)$."
      },
      {
        "key": "d",
        "text": "$\\int_0^3 N(t)\\,dt=6+2\\ln 2$."
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "Ta có $N(t)=2+\\frac{1}{t+1}$. a) Đúng: $N(0)=3$. b) Sai: $N(t)$ giảm dần về 2, nên $N(t)<3$ với mọi $t>0$. c) Đúng: $N'(t)=-\\frac{1}{(t+1)^2}<0$. d) Đúng: $\\int_0^3\\left(2+\\frac{1}{t+1}\\right)dt=\\left[2t+\\ln(t+1)\\right]_0^3=6+\\ln 4=6+2\\ln 2$.",
    "points": 1,
    "tags": [
      "ứng dụng đạo hàm và tích phân",
      "mô hình hàm phân thức",
      "đơn điệu",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-tichphan-16",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính $\\int_1^3 2x\\,dx$.",
    "answer": "8",
    "explanation": "$\\int_1^3 2x\\,dx=\\left[x^2\\right]_1^3=9-1=8$.",
    "points": 0.5,
    "tags": [
      "tích phân",
      "tính tích phân cơ bản",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-tichphan-17",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính diện tích hình phẳng giới hạn bởi parabol $y=x^2-4$ và trục hoành (đơn vị diện tích). Kết quả làm tròn đến hàng phần mười.",
    "answer": "10,7",
    "explanation": "Parabol cắt trục hoành tại $x=\\pm 2$. $S=\\int_{-2}^{2}|x^2-4|\\,dx=2\\int_0^2(4-x^2)\\,dx=2\\left(8-\\frac{8}{3}\\right)=\\frac{32}{3}\\approx 10,7$.",
    "points": 0.5,
    "tags": [
      "diện tích hình phẳng",
      "parabol",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-tichphan-18",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một chất điểm chuyển động thẳng với vận tốc $v(t)=3t^2-12t+9$ (m/s), $t\\ge 0$. Quãng đường chất điểm đi được trong 4 giây đầu tiên là bao nhiêu mét?",
    "answer": "12",
    "explanation": "$v(t)=0$ khi $t=1$ hoặc $t=3$. Có $\\int_0^1 v\\,dt=4$, $\\int_1^3 v\\,dt=-4$, $\\int_3^4 v\\,dt=4$. Quãng đường $=4+4+4=12$ m.",
    "points": 0.5,
    "tags": [
      "chuyển động v(t)",
      "quãng đường",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-tichphan-19",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Diện tích hình phẳng giới hạn bởi hai đồ thị $y=\\sqrt{x}$ và $y=x^2$ như hình bên dưới bằng bao nhiêu (đơn vị diện tích)? Kết quả làm tròn đến hàng phần trăm.",
    "answer": "0,33",
    "explanation": "Hoành độ giao điểm: $\\sqrt{x}=x^2 \\Leftrightarrow x=0$ hoặc $x=1$. Trên $[0;1]$ có $\\sqrt{x}\\ge x^2$. Vậy $S=\\int_0^1(\\sqrt{x}-x^2)\\,dx=\\frac{2}{3}-\\frac{1}{3}=\\frac{1}{3}\\approx 0,33$.",
    "points": 0.5,
    "tags": [
      "diện tích hình phẳng",
      "căn thức",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "sqrt(x)",
        "x^2"
      ],
      "xMin": 0,
      "xMax": 1.5
    }
  },
  {
    "id": "thpt-tichphan-20",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Hình phẳng giới hạn bởi đồ thị hàm số $y=x+1$, trục $Ox$ và hai đường thẳng $x=0$, $x=2$ quay quanh trục $Ox$ tạo thành khối tròn xoay có thể tích $V=a\\pi$. Tìm $a$, làm tròn đến hàng phần trăm.",
    "answer": "8,67",
    "explanation": "$V=\\pi\\int_0^2(x+1)^2\\,dx=\\pi\\left[\\frac{(x+1)^3}{3}\\right]_0^2=\\frac{26\\pi}{3}$, suy ra $a=\\frac{26}{3}\\approx 8,67$.",
    "points": 0.5,
    "tags": [
      "thể tích khối tròn xoay",
      "quay quanh Ox",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-tichphan-21",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Tính $\\int_1^e \\frac{\\ln x}{x}\\,dx$. Viết kết quả dưới dạng số thập phân.",
    "answer": "0,5",
    "explanation": "Đặt $t=\\ln x$, suy ra $dt=\\frac{dx}{x}$. Đổi cận: $x=1\\Rightarrow t=0$, $x=e\\Rightarrow t=1$. Có $\\int_0^1 t\\,dt=\\frac{1}{2}=0,5$.",
    "points": 0.5,
    "tags": [
      "tích phân",
      "đổi biến số",
      "logarit",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-tichphan-22",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một bể chứa ban đầu có 100 lít nước. Từ thời điểm $t=0$ (phút), nước chảy vào bể với tốc độ $6\\sqrt{t}$ (lít/phút) và đồng thời nước thoát ra khỏi bể với tốc độ $2t$ (lít/phút), với $0\\le t\\le 4$. Sau 4 phút, bể có bao nhiêu lít nước?",
    "answer": "116",
    "explanation": "Lượng nước thay đổi thêm là $\\int_0^4(6\\sqrt{t}-2t)\\,dt=\\left[4t^{3/2}-t^2\\right]_0^4=32-16=16$ lít. Tổng lượng nước: $100+16=116$ lít.",
    "points": 0.5,
    "tags": [
      "ứng dụng tích phân",
      "lưu lượng",
      "căn thức",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-tichphan-23",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Nồng độ của một loại thuốc trong máu (mg/L) sau $t$ giờ là $C(t)=\\frac{15t}{t^2+9}$, $t\\ge 0$. Nồng độ trung bình trong 3 giờ đầu (mg/L) là bao nhiêu? Kết quả làm tròn đến hàng phần trăm.",
    "answer": "1,73",
    "explanation": "$\\int_0^3 C(t)\\,dt=\\frac{15}{2}\\left[\\ln(t^2+9)\\right]_0^3=\\frac{15}{2}\\ln 2$. Nồng độ trung bình $=\\frac{1}{3}\\cdot\\frac{15}{2}\\ln 2=\\frac{5}{2}\\ln 2\\approx 1,73$.",
    "points": 0.5,
    "tags": [
      "giá trị trung bình",
      "logarit",
      "bài toán thực tế",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-tichphan-24",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Mặt cắt của một cổng có dạng parabol $y=6-\\frac{3}{8}x^2$ (đơn vị mét) với $-4\\le x\\le 4$, như hình bên dưới. Phần cổng nằm phía trên đường thẳng $y=3$ có diện tích bao nhiêu mét vuông? Kết quả làm tròn đến hàng phần mười.",
    "answer": "11,3",
    "explanation": "Hoành độ giao điểm: $6-\\frac{3}{8}x^2=3 \\Leftrightarrow x=\\pm 2\\sqrt{2}$. $S=\\int_{-2\\sqrt2}^{2\\sqrt2}\\left(3-\\frac{3}{8}x^2\\right)dx=2\\left[3x-\\frac{x^3}{8}\\right]_0^{2\\sqrt2}=2(6\\sqrt2-2\\sqrt2)=8\\sqrt2\\approx 11,3$.",
    "points": 0.5,
    "tags": [
      "diện tích hình phẳng",
      "bài toán thực tế",
      "parabol",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "6-3x^2/8",
        "3"
      ],
      "xMin": -5,
      "xMax": 5
    }
  },
  {
    "id": "thpt-tichphan-25",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho hình phẳng giới hạn bởi đồ thị $y=\\sin x$, trục $Ox$ và hai đường thẳng $x=0$, $x=\\pi$ như hình bên dưới. Quay hình phẳng đó quanh trục $Ox$ ta được khối tròn xoay có thể tích $V$. Tính $V$, làm tròn đến hàng phần trăm.",
    "answer": "4,93",
    "explanation": "$V=\\pi\\int_0^\\pi\\sin^2x\\,dx=\\pi\\int_0^\\pi\\frac{1-\\cos 2x}{2}\\,dx=\\pi\\cdot\\frac{\\pi}{2}=\\frac{\\pi^2}{2}\\approx 4,93$.",
    "points": 0.5,
    "tags": [
      "thể tích khối tròn xoay",
      "hàm lượng giác",
      "hạ bậc",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "graph",
      "curves": [
        "sin(x)"
      ],
      "xMin": 0,
      "xMax": 3.5
    }
  },
  {
    "id": "thpt-xacsuat-01",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Cho hai biến cố $A$ và $B$ với $P(A)=0{,}5$, $P(B)=0{,}4$ và $P(A\\cap B)=0{,}2$. Tính xác suất có điều kiện $P(B\\mid A)$.",
    "options": [
      {
        "key": "A",
        "text": "0,2"
      },
      {
        "key": "B",
        "text": "0,4"
      },
      {
        "key": "C",
        "text": "0,5"
      },
      {
        "key": "D",
        "text": "0,8"
      }
    ],
    "answer": "B",
    "explanation": "$P(B\\mid A)=\\dfrac{P(A\\cap B)}{P(A)}=\\dfrac{0{,}2}{0{,}5}=0{,}4$.",
    "points": 0.25,
    "tags": [
      "xác suất có điều kiện",
      "công thức nhân xác suất",
      "NB"
    ],
    "variable": false
  },
  {
    "id": "thpt-xacsuat-02",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Một tổ có 5 học sinh nam và 7 học sinh nữ. Có bao nhiêu cách chọn ra 2 học sinh nam và 3 học sinh nữ từ tổ đó?",
    "options": [
      {
        "key": "A",
        "text": "350"
      },
      {
        "key": "B",
        "text": "210"
      },
      {
        "key": "C",
        "text": "175"
      },
      {
        "key": "D",
        "text": "420"
      }
    ],
    "answer": "A",
    "explanation": "Chọn 2 nam từ 5 nam có $\\mathrm{C}_5^2=10$ cách; chọn 3 nữ từ 7 nữ có $\\mathrm{C}_7^3=35$ cách. Theo quy tắc nhân, số cách là $10\\cdot35=350$.",
    "points": 0.25,
    "tags": [
      "tổ hợp",
      "quy tắc nhân",
      "chọn nhóm có ràng buộc",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-xacsuat-03",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Thời gian hoàn thành một bài kiểm tra của 30 học sinh được thống kê trong biểu đồ bên dưới. Tính thời gian hoàn thành trung bình của 30 học sinh (làm tròn đến hàng phần mười).",
    "options": [
      {
        "key": "A",
        "text": "22,5"
      },
      {
        "key": "B",
        "text": "21,8"
      },
      {
        "key": "C",
        "text": "23,0"
      },
      {
        "key": "D",
        "text": "22,3"
      }
    ],
    "answer": "D",
    "explanation": "Giá trị đại diện của các nhóm: 12,5; 17,5; 22,5; 27,5; 32,5. Số trung bình $\\bar x=\\dfrac{4\\cdot12{,}5+6\\cdot17{,}5+10\\cdot22{,}5+7\\cdot27{,}5+3\\cdot32{,}5}{30}=\\dfrac{670}{30}\\approx22{,}3$ phút.",
    "points": 0.25,
    "tags": [
      "mẫu số liệu ghép nhóm",
      "số trung bình",
      "TH"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "hist",
      "title": "Thời gian hoàn thành bài kiểm tra",
      "xLabel": "Thời gian (phút)",
      "yLabel": "Số học sinh",
      "data": "[10; 15) [15; 20) [20; 25) [25; 30) [30; 35)\nSố học sinh: 4; 6; 10; 7; 3"
    }
  },
  {
    "id": "thpt-xacsuat-04",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Có hai hộp bi. Chọn ngẫu nhiên một hộp rồi lấy ngẫu nhiên một viên bi từ hộp đó. Sơ đồ cây bên dưới cho biết xác suất chọn mỗi hộp và xác suất lấy được bi mỗi màu trong từng hộp. Biết viên bi lấy ra có màu đỏ, tính xác suất viên bi đó được lấy từ hộp I (làm tròn đến hàng phần trăm).",
    "options": [
      {
        "key": "A",
        "text": "0,25"
      },
      {
        "key": "B",
        "text": "0,40"
      },
      {
        "key": "C",
        "text": "0,78"
      },
      {
        "key": "D",
        "text": "0,22"
      }
    ],
    "answer": "D",
    "explanation": "$P(\\text{Đỏ})=0{,}4\\cdot0{,}25+0{,}6\\cdot0{,}6=0{,}46$. Theo công thức Bayes, $P(\\text{Hộp I}\\mid\\text{Đỏ})=\\dfrac{0{,}4\\cdot0{,}25}{0{,}46}=\\dfrac{0{,}10}{0{,}46}\\approx0{,}22$.",
    "points": 0.25,
    "tags": [
      "sơ đồ cây",
      "công thức xác suất toàn phần",
      "công thức Bayes",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "probtree",
      "text": "Hộp I: 0,4\n  Xanh: 0,75\n  Đỏ: 0,25\nHộp II: 0,6\n  Xanh: 0,4\n  Đỏ: 0,6"
    }
  },
  {
    "id": "thpt-xacsuat-05",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Ở một địa phương, 2% dân số mắc một bệnh A. Một xét nghiệm cho kết quả dương tính với người mắc bệnh với xác suất 0,9 và cho kết quả dương tính với người không mắc bệnh với xác suất 0,05. Chọn ngẫu nhiên một người và thấy kết quả xét nghiệm dương tính. Xác suất người đó thực sự mắc bệnh A là bao nhiêu (làm tròn đến hàng phần trăm)?",
    "options": [
      {
        "key": "A",
        "text": "0,02"
      },
      {
        "key": "B",
        "text": "0,90"
      },
      {
        "key": "C",
        "text": "0,27"
      },
      {
        "key": "D",
        "text": "0,50"
      }
    ],
    "answer": "C",
    "explanation": "$P(\\text{dương})=0{,}02\\cdot0{,}9+0{,}98\\cdot0{,}05=0{,}018+0{,}049=0{,}067$. Theo công thức Bayes, $P(\\text{mắc}\\mid\\text{dương})=\\dfrac{0{,}018}{0{,}067}\\approx0{,}27$.",
    "points": 0.25,
    "tags": [
      "công thức Bayes",
      "công thức xác suất toàn phần",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-xacsuat-06",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "trac-nghiem",
    "prompt": "Xếp 5 bạn An, Bình, Cường, Dũng, Em thành một hàng ngang. Có bao nhiêu cách xếp sao cho An và Bình không đứng cạnh nhau?",
    "options": [
      {
        "key": "A",
        "text": "48"
      },
      {
        "key": "B",
        "text": "72"
      },
      {
        "key": "C",
        "text": "24"
      },
      {
        "key": "D",
        "text": "96"
      }
    ],
    "answer": "B",
    "explanation": "Số cách xếp 5 bạn là $5!=120$. Số cách xếp mà An và Bình đứng cạnh nhau là $2\\cdot4!=48$ (coi hai bạn là một khối, hai bạn đổi chỗ cho nhau). Đáp số: $120-48=72$.",
    "points": 0.25,
    "tags": [
      "hoán vị",
      "xếp chỗ có ràng buộc",
      "phần bù",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-xacsuat-07",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Biểu đồ bên dưới thống kê số giờ tự học trong tuần của 20 học sinh. Tính độ lệch chuẩn của mẫu số liệu ghép nhóm này (làm tròn đến hàng phần trăm).",
    "options": [
      {
        "key": "A",
        "text": "10,91"
      },
      {
        "key": "B",
        "text": "119,00"
      },
      {
        "key": "C",
        "text": "11,20"
      },
      {
        "key": "D",
        "text": "10,50"
      }
    ],
    "answer": "A",
    "explanation": "Giá trị đại diện: 5; 15; 25; 35; 45. Số trung bình $\\bar x=24$. Phương sai $s^2=\\dfrac{1}{20}\\left(2\\cdot19^2+5\\cdot9^2+8\\cdot1^2+3\\cdot11^2+2\\cdot21^2\\right)=\\dfrac{2380}{20}=119$. Độ lệch chuẩn $s=\\sqrt{119}\\approx10{,}91$.",
    "points": 0.25,
    "tags": [
      "mẫu số liệu ghép nhóm",
      "phương sai",
      "độ lệch chuẩn",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "hist",
      "title": "Số giờ tự học trong tuần",
      "xLabel": "Số giờ",
      "yLabel": "Số học sinh",
      "data": "[0; 10) [10; 20) [20; 30) [30; 40) [40; 50)\nSố học sinh: 2; 5; 8; 3; 2"
    }
  },
  {
    "id": "thpt-xacsuat-08",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "trac-nghiem",
    "prompt": "Một nhà máy có ba máy cùng sản xuất một loại sản phẩm. Máy I sản xuất 50% số sản phẩm, máy II sản xuất 30%, máy III sản xuất 20%. Tỉ lệ phế phẩm của ba máy lần lượt là 1%, 2% và 3%. Lấy ngẫu nhiên một sản phẩm và thấy là phế phẩm. Xác suất sản phẩm đó do máy II sản xuất là bao nhiêu (làm tròn đến hàng phần trăm)?",
    "options": [
      {
        "key": "A",
        "text": "0,30"
      },
      {
        "key": "B",
        "text": "0,50"
      },
      {
        "key": "C",
        "text": "0,35"
      },
      {
        "key": "D",
        "text": "0,20"
      }
    ],
    "answer": "C",
    "explanation": "$P(\\text{phế})=0{,}5\\cdot0{,}01+0{,}3\\cdot0{,}02+0{,}2\\cdot0{,}03=0{,}017$. Theo công thức Bayes, $P(\\text{máy II}\\mid\\text{phế})=\\dfrac{0{,}3\\cdot0{,}02}{0{,}017}=\\dfrac{0{,}006}{0{,}017}\\approx0{,}35$.",
    "points": 0.25,
    "tags": [
      "công thức Bayes",
      "công thức xác suất toàn phần",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-xacsuat-09",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Trong một trường THPT, 60% học sinh là nữ. Tỉ lệ học sinh nữ biết bơi là 40%, tỉ lệ học sinh nam biết bơi là 70%. Chọn ngẫu nhiên một học sinh của trường. Xét tính đúng, sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Xác suất chọn được học sinh biết bơi là 0,52."
      },
      {
        "key": "b",
        "text": "Biết học sinh được chọn biết bơi, xác suất em đó là nữ là 0,4."
      },
      {
        "key": "c",
        "text": "Xác suất chọn được học sinh vừa là nữ vừa biết bơi là 0,24."
      },
      {
        "key": "d",
        "text": "Biết học sinh được chọn không biết bơi, xác suất em đó là nam là 0,5."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "a) Đúng: $0{,}6\\cdot0{,}4+0{,}4\\cdot0{,}7=0{,}52$. b) Sai: $P(\\text{nữ}\\mid\\text{bơi})=\\dfrac{0{,}24}{0{,}52}\\approx0{,}46$. c) Đúng: $P(\\text{nữ}\\cap\\text{bơi})=0{,}6\\cdot0{,}4=0{,}24$. d) Sai: $P(\\text{nam}\\mid\\text{không bơi})=\\dfrac{0{,}4\\cdot0{,}3}{0{,}48}=0{,}25$.",
    "points": 1,
    "tags": [
      "xác suất toàn phần",
      "xác suất có điều kiện",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-xacsuat-10",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Một hộp chứa 6 viên bi xanh và 4 viên bi đỏ có kích thước như nhau. Lấy lần lượt không hoàn lại hai viên bi từ hộp. Xét tính đúng, sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Xác suất viên bi lấy ra lần thứ nhất màu xanh bằng 0,6."
      },
      {
        "key": "b",
        "text": "Biết viên bi lấy ra lần thứ nhất màu xanh, xác suất viên bi lấy ra lần thứ hai màu đỏ bằng $\\dfrac{4}{9}$."
      },
      {
        "key": "c",
        "text": "Xác suất hai viên bi lấy ra cùng màu bằng 0,45."
      },
      {
        "key": "d",
        "text": "Xác suất viên bi lấy ra lần thứ hai màu xanh bằng 0,5."
      }
    ],
    "answer": "ĐĐSS",
    "explanation": "a) Đúng: $\\dfrac{6}{10}=0{,}6$. b) Đúng: sau khi lấy một bi xanh còn 9 bi, trong đó có 4 bi đỏ, nên xác suất bằng $\\dfrac49$. c) Sai: $P(\\text{cùng màu})=\\dfrac{6}{10}\\cdot\\dfrac59+\\dfrac{4}{10}\\cdot\\dfrac39=\\dfrac{42}{90}=\\dfrac{7}{15}\\approx0{,}47$. d) Sai: $P(\\text{lần 2 xanh})=\\dfrac{6}{10}\\cdot\\dfrac59+\\dfrac{4}{10}\\cdot\\dfrac69=0{,}6$.",
    "points": 1,
    "tags": [
      "xác suất có điều kiện",
      "lấy bi không hoàn lại",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-xacsuat-11",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Có hai hộp bi. Chọn ngẫu nhiên một hộp theo tỉ lệ ghi ở nhánh thứ nhất của sơ đồ cây bên dưới, rồi lấy ngẫu nhiên một viên bi từ hộp đó. Xét tính đúng, sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Xác suất lấy được viên bi màu xanh là 0,48."
      },
      {
        "key": "b",
        "text": "Biết viên bi lấy ra có màu đỏ, xác suất viên bi đó thuộc hộp I là 0,46 (làm tròn đến hàng phần trăm)."
      },
      {
        "key": "c",
        "text": "Xác suất lấy được viên bi màu đỏ là 0,5."
      },
      {
        "key": "d",
        "text": "Biết viên bi lấy ra có màu xanh, xác suất viên bi đó thuộc hộp II là 0,875."
      }
    ],
    "answer": "ĐĐSĐ",
    "explanation": "a) Đúng: $0{,}3\\cdot0{,}2+0{,}7\\cdot0{,}6=0{,}48$. b) Đúng: $P(\\text{đỏ})=0{,}3\\cdot0{,}8+0{,}7\\cdot0{,}4=0{,}52$, $P(\\text{I}\\mid\\text{đỏ})=\\dfrac{0{,}24}{0{,}52}\\approx0{,}46$. c) Sai: $P(\\text{đỏ})=0{,}52$. d) Đúng: $P(\\text{II}\\mid\\text{xanh})=\\dfrac{0{,}7\\cdot0{,}6}{0{,}48}=0{,}875$.",
    "points": 1,
    "tags": [
      "sơ đồ cây",
      "công thức xác suất toàn phần",
      "công thức Bayes",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "probtree",
      "text": "Hộp I: 0,3\n  Xanh: 0,2\n  Đỏ: 0,8\nHộp II: 0,7\n  Xanh: 0,6\n  Đỏ: 0,4"
    }
  },
  {
    "id": "thpt-xacsuat-12",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Một tổ có 6 học sinh nam và 4 học sinh nữ. Chọn ngẫu nhiên 3 học sinh từ tổ để tham gia một hoạt động. Xét tính đúng, sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Số cách chọn 3 học sinh từ 10 học sinh là 120."
      },
      {
        "key": "b",
        "text": "Số cách chọn 3 học sinh có đúng 1 học sinh nữ là 80."
      },
      {
        "key": "c",
        "text": "Số cách chọn 3 học sinh có ít nhất 1 học sinh nữ là 100."
      },
      {
        "key": "d",
        "text": "Số cách chọn 3 học sinh toàn nam là 20."
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) Đúng: $\\mathrm{C}_{10}^3=120$. b) Sai: $\\mathrm{C}_4^1\\cdot\\mathrm{C}_6^2=4\\cdot15=60$. c) Đúng: $120-\\mathrm{C}_6^3=120-20=100$ (trừ trường hợp toàn nam). d) Đúng: $\\mathrm{C}_6^3=20$.",
    "points": 1,
    "tags": [
      "tổ hợp",
      "chọn nhóm có ràng buộc",
      "phần bù",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-xacsuat-13",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Xếp 4 bạn nam và 3 bạn nữ ngồi thành một hàng ngang gồm 7 ghế. Xét tính đúng, sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Có 5040 cách xếp khác nhau."
      },
      {
        "key": "b",
        "text": "Có 1440 cách xếp sao cho 3 bạn nữ luôn ngồi cạnh nhau."
      },
      {
        "key": "c",
        "text": "Có 2880 cách xếp sao cho không có hai bạn nữ nào ngồi cạnh nhau."
      },
      {
        "key": "d",
        "text": "Có 1440 cách xếp sao cho bạn nam A và bạn nữ B ngồi cạnh nhau."
      }
    ],
    "answer": "ĐSSĐ",
    "explanation": "a) Đúng: $7!=5040$. b) Sai: coi 3 bạn nữ là một khối, có $5!\\cdot3!=720$ cách. c) Sai: xếp 4 nam có $4!=24$ cách, tạo 5 khe trống, chọn 3 khe để xếp nữ có $\\mathrm{C}_5^3=10$ cách, xếp nữ có $3!=6$ cách; tổng $24\\cdot10\\cdot6=1440$. d) Đúng: coi A và B là một khối, có $2\\cdot6!=1440$ cách.",
    "points": 1,
    "tags": [
      "hoán vị",
      "xếp chỗ có ràng buộc",
      "phần bù",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-xacsuat-14",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "dung-sai",
    "prompt": "Biểu đồ bên dưới thống kê điểm kiểm tra (thang điểm 10) của 20 học sinh. Xét tính đúng, sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Điểm trung bình của 20 học sinh là 4,6."
      },
      {
        "key": "b",
        "text": "Trung vị của mẫu số liệu ghép nhóm này là 4,8."
      },
      {
        "key": "c",
        "text": "Khoảng biến thiên của mẫu số liệu ghép nhóm này là 10."
      },
      {
        "key": "d",
        "text": "Độ lệch chuẩn của mẫu số liệu ghép nhóm này là 3,84."
      }
    ],
    "answer": "ĐSĐS",
    "explanation": "Giá trị đại diện: 1; 3; 5; 7; 9. a) Đúng: $\\bar x=\\dfrac{2\\cdot1+5\\cdot3+9\\cdot5+3\\cdot7+1\\cdot9}{20}=\\dfrac{92}{20}=4{,}6$. b) Sai: $n/2=10$ thuộc nhóm [4; 6), $M_e=4+\\dfrac{10-7}{9}\\cdot2\\approx4{,}67$. c) Đúng: $10-0=10$. d) Sai: phương sai là $s^2=3{,}84$, còn độ lệch chuẩn là $s=\\sqrt{3{,}84}\\approx1{,}96$.",
    "points": 1,
    "tags": [
      "mẫu số liệu ghép nhóm",
      "trung bình",
      "trung vị",
      "phương sai",
      "VDC"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "hist",
      "title": "Điểm kiểm tra của 20 học sinh",
      "xLabel": "Điểm",
      "yLabel": "Số học sinh",
      "data": "[0; 2) [2; 4) [4; 6) [6; 8) [8; 10)\nSố học sinh: 2; 5; 9; 3; 1"
    }
  },
  {
    "id": "thpt-xacsuat-15",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "dung-sai",
    "prompt": "Trong một hộp có 5 viên bi đỏ và 3 viên bi xanh có kích thước như nhau. Lấy ngẫu nhiên đồng thời 3 viên bi từ hộp. Xét tính đúng, sai của các khẳng định sau:",
    "options": [
      {
        "key": "a",
        "text": "Số cách lấy 3 viên bi từ hộp là 56."
      },
      {
        "key": "b",
        "text": "Xác suất lấy được đúng 2 viên bi đỏ là 0,45."
      },
      {
        "key": "c",
        "text": "Xác suất lấy được 3 viên bi cùng màu là $\\dfrac{11}{56}$."
      },
      {
        "key": "d",
        "text": "Xác suất lấy được ít nhất 1 viên bi xanh là $\\dfrac{23}{28}$."
      }
    ],
    "answer": "ĐSĐĐ",
    "explanation": "a) Đúng: $\\mathrm{C}_8^3=56$. b) Sai: $\\dfrac{\\mathrm{C}_5^2\\cdot\\mathrm{C}_3^1}{56}=\\dfrac{30}{56}=\\dfrac{15}{28}\\approx0{,}54$. c) Đúng: $\\dfrac{\\mathrm{C}_5^3+\\mathrm{C}_3^3}{56}=\\dfrac{11}{56}$. d) Đúng: $1-\\dfrac{\\mathrm{C}_5^3}{56}=\\dfrac{46}{56}=\\dfrac{23}{28}$.",
    "points": 1,
    "tags": [
      "tổ hợp",
      "xác suất cổ điển",
      "biến cố đối",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-xacsuat-16",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Cho $P(A)=0{,}6$ và $P(B\\mid A)=0{,}25$. Tính $P(A\\cap B)$. Ghi đáp án dưới dạng số thập phân.",
    "answer": "0,15",
    "explanation": "$P(A\\cap B)=P(A)\\cdot P(B\\mid A)=0{,}6\\cdot0{,}25=0{,}15$.",
    "points": 0.5,
    "tags": [
      "xác suất có điều kiện",
      "công thức nhân xác suất",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-xacsuat-17",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Từ các chữ số 1, 2, 3, 4, 5, 6 có thể lập được bao nhiêu số tự nhiên gồm 3 chữ số đôi một khác nhau?",
    "answer": "120",
    "explanation": "Số cách lập là chỉnh hợp chập 3 của 6 phần tử: $A_6^3=6\\cdot5\\cdot4=120$.",
    "points": 0.5,
    "tags": [
      "chỉnh hợp",
      "số tự nhiên",
      "TH"
    ],
    "variable": false
  },
  {
    "id": "thpt-xacsuat-18",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Biểu đồ bên dưới thống kê số cuốn sách mỗi học sinh đọc trong một học kỳ của 40 học sinh. Tính khoảng tứ phân vị của mẫu số liệu ghép nhóm này (làm tròn đến hàng phần trăm, ghi đáp án dưới dạng số thập phân).",
    "answer": "9,58",
    "explanation": "$n=40$. Nhóm chứa $Q_1$ là [5; 10) vì cỡ mẫu $n/4=10$ nằm giữa 4 và 12: $Q_1=5+\\dfrac{10-4}{8}\\cdot5=8{,}75$. Nhóm chứa $Q_3$ là [15; 20) vì $3n/4=30$ nằm giữa 24 và 33: $Q_3=15+\\dfrac{30-24}{9}\\cdot5\\approx18{,}33$. Khoảng tứ phân vị $\\Delta_Q=18{,}33-8{,}75\\approx9{,}58$.",
    "points": 0.5,
    "tags": [
      "mẫu số liệu ghép nhóm",
      "tứ phân vị",
      "khoảng tứ phân vị",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "stats",
      "chart": "hist",
      "title": "Số sách đọc trong học kỳ",
      "xLabel": "Số cuốn sách",
      "yLabel": "Số học sinh",
      "data": "[0; 5) [5; 10) [10; 15) [15; 20) [20; 25)\nSố học sinh: 4; 8; 12; 9; 7"
    }
  },
  {
    "id": "thpt-xacsuat-19",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Ở một trường, 30% học sinh chơi bóng đá. Trong số học sinh chơi bóng đá, 20% là nữ; trong số học sinh không chơi bóng đá, 50% là nữ. Chọn ngẫu nhiên một học sinh nữ của trường. Tính xác suất em đó chơi bóng đá (làm tròn đến hàng phần trăm, ghi đáp án dưới dạng số thập phân).",
    "answer": "0,15",
    "explanation": "$P(\\text{nữ})=0{,}3\\cdot0{,}2+0{,}7\\cdot0{,}5=0{,}41$. $P(\\text{bóng đá}\\mid\\text{nữ})=\\dfrac{0{,}3\\cdot0{,}2}{0{,}41}=\\dfrac{0{,}06}{0{,}41}\\approx0{,}15$.",
    "points": 0.5,
    "tags": [
      "xác suất toàn phần",
      "xác suất có điều kiện",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-xacsuat-20",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Xếp 5 bạn An, Bình, Cường, Dũng, Em vào một dãy 5 ghế kê thành hàng ngang. Hỏi có bao nhiêu cách xếp sao cho An ngồi ghế đầu tiên và Bình không ngồi ghế cuối cùng?",
    "answer": "18",
    "explanation": "An ngồi ghế thứ nhất (1 cách). Bình chọn một trong ba ghế 2, 3, 4 (3 cách). Ba bạn còn lại xếp vào ba ghế còn trống (kể cả ghế cuối) có $3!=6$ cách. Đáp số $3\\cdot6=18$.",
    "points": 0.5,
    "tags": [
      "hoán vị",
      "xếp chỗ có ràng buộc",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-xacsuat-21",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Gieo hai lần liên tiếp một con xúc xắc cân đối và đồng chất. Biết tổng số chấm xuất hiện trên hai lần gieo lớn hơn 8, tính xác suất để lần gieo thứ nhất xuất hiện mặt 6 chấm. Ghi đáp án dưới dạng số thập phân.",
    "answer": "0,4",
    "explanation": "Các kết quả có tổng lớn hơn 8: tổng 9 (4 cách), 10 (3 cách), 11 (2 cách), 12 (1 cách), tổng cộng 10 kết quả. Trong đó lần 1 ra mặt 6 là (6;3), (6;4), (6;5), (6;6): 4 kết quả. Xác suất cần tìm là $\\dfrac{4}{10}=0{,}4$.",
    "points": 0.5,
    "tags": [
      "xác suất có điều kiện",
      "xác suất cổ điển",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-xacsuat-22",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một lớp có 9 học sinh. Cần chọn một ban cán sự gồm 1 lớp trưởng, 1 lớp phó và 2 thư ký (hai thư ký có vai trò như nhau). Hỏi có bao nhiêu cách chọn ban cán sự?",
    "answer": "1512",
    "explanation": "Lớp trưởng: 9 cách; lớp phó: 8 cách; hai thư ký là một tổ hợp chập 2 của 7 học sinh còn lại: $\\mathrm{C}_7^2=21$ cách. Theo quy tắc nhân: $9\\cdot8\\cdot21=1512$.",
    "points": 0.5,
    "tags": [
      "chỉnh hợp",
      "tổ hợp",
      "bài đếm",
      "VD"
    ],
    "variable": false
  },
  {
    "id": "thpt-xacsuat-23",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Một xạ thủ bắn 3 viên đạn độc lập vào bia, xác suất bắn trúng mỗi viên là 0,8. Biết xạ thủ bắn trúng đúng 2 viên, tính xác suất viên đạn đầu tiên bắn trúng (làm tròn đến hàng phần trăm, ghi đáp án dưới dạng số thập phân).",
    "answer": "0,67",
    "explanation": "Có 3 kết quả trúng đúng 2 viên (TTK, TKT, KTT), mỗi kết quả có xác suất $0{,}8^2\\cdot0{,}2=0{,}128$; tổng $0{,}384$. Trong đó viên đầu trúng ở TTK và TKT, có tổng xác suất $0{,}256$. Xác suất cần tìm $=\\dfrac{0{,}256}{0{,}384}=\\dfrac23\\approx0{,}67$.",
    "points": 0.5,
    "tags": [
      "xác suất có điều kiện",
      "sơ đồ cây",
      "lược đồ Bernoulli",
      "VDC"
    ],
    "variable": false
  },
  {
    "id": "thpt-xacsuat-24",
    "subject": "Toán",
    "grades": [
      "Lớp 12"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Mỗi ngày bạn An chọn ngẫu nhiên một trong hai tuyến đường đến trường theo tỉ lệ ghi ở nhánh thứ nhất của sơ đồ cây bên dưới. Xác suất đến trường đúng giờ trên mỗi tuyến được ghi ở nhánh thứ hai. Tính xác suất ngày hôm đó An đến trường đúng giờ (ghi đáp án dưới dạng số thập phân).",
    "answer": "0,82",
    "explanation": "$P(\\text{đúng giờ})=0{,}6\\cdot0{,}9+0{,}4\\cdot0{,}7=0{,}54+0{,}28=0{,}82$.",
    "points": 0.5,
    "tags": [
      "sơ đồ cây",
      "công thức xác suất toàn phần",
      "VD"
    ],
    "variable": false,
    "figure": {
      "kind": "probtree",
      "text": "Tuyến A: 0,6\n  Đúng giờ: 0,9\n  Trễ: 0,1\nTuyến B: 0,4\n  Đúng giờ: 0,7\n  Trễ: 0,3"
    }
  },
  {
    "id": "thpt-xacsuat-25",
    "subject": "Toán",
    "grades": [
      "Lớp 10"
    ],
    "type": "tra-loi-ngan",
    "prompt": "Có bao nhiêu số tự nhiên gồm 4 chữ số đôi một khác nhau và chia hết cho 5?",
    "answer": "952",
    "explanation": "Gọi số là $\\overline{abcd}$ với $d\\in\\{0;5\\}$. Với $d=0$: chọn có thứ tự $a,b,c$ từ 9 chữ số $1,\\dots,9$: $A_9^3=504$ cách. Với $d=5$: $a$ có 8 cách (khác 0 và 5), $b,c$ chọn có thứ tự từ 8 chữ số còn lại: $A_8^2=56$ cách, nên có $8\\cdot56=448$ số. Đáp số $504+448=952$.",
    "points": 0.5,
    "tags": [
      "chỉnh hợp",
      "số tự nhiên",
      "chia hết",
      "VDC"
    ],
    "variable": false
  }
]
