import type { DeckTheme, Slide, SlideTone } from '@/store/docs'
import {
  composeLayout,
  defaultTone,
  toneBackground,
  withPlaceholders,
  type SlideLayoutContent,
  type SlideLayoutId,
} from './slideLayouts'
import { DECK_THEMES, themeById } from './slideTheme'
import { applySkin, skinById, themeWithSkinFonts } from './slideSkins'

export interface SlideDesign {
  id: string // 'thanh-lich', 'tre-trung'…
  name: string // tên hiển thị tiếng Việt
  description: string // một câu: hợp với môn/lứa tuổi/dịp nào
  themeId: string // id trong DECK_THEMES, hoặc tự khai báo theme riêng nếu cần (thêm vào DECK_THEMES)
  decorKit?: string // id trong DECOR_KITS
  stylePack?: string // id trong SLIDE_STYLE_PACKS (dùng cho AI)
  /** dàn slide của bộ: layout + nội dung mẫu + tông nền */
  slides: Array<{ layout: SlideLayoutId; tone?: SlideTone; content: Partial<SlideLayoutContent> }>
}

const uid = () => Math.random().toString(36).slice(2, 10)

export const SLIDE_DESIGNS: SlideDesign[] = [
  {
    id: 'thanh-lich',
    name: 'Thanh lịch tối giản',
    description: 'Hiện đại, tinh tế; hợp báo cáo khoa học, hội thảo chuyên đề và tổng kết dự án.',
    themeId: 'sang',
    decorKit: 'toi-gian',
    stylePack: 'consulting',
    slides: [
      {
        layout: 'title',
        tone: 'accent',
        content: {
          kicker: 'BÁO CÁO KHOA HỌC',
          title: 'Phương Pháp Nghiên Cứu Khoa Học',
          subtitle: 'Quy trình thực nghiệm và xử lý số liệu chuẩn mực trong học tập',
        },
      },
      {
        layout: 'agenda',
        tone: 'soft',
        content: {
          kicker: 'MỤC LỤC',
          title: 'Nội Dung Báo Cáo',
          items: [
            'Tổng quan đề tài & mục tiêu',
            'Phương pháp thực nghiệm',
            'Kết quả & phân tích định lượng',
            'Kết luận & khuyến nghị',
          ],
        },
      },
      {
        layout: 'two-column',
        tone: 'theme',
        content: {
          title: 'Nguyên Tắc Cốt Lõi',
          left: [
            'Tính khách quan trong thu thập số liệu',
            'Khả năng lặp lại của quy trình thí nghiệm',
            'Minh bạch về phương sai và sai số',
          ],
          right: [
            'Mẫu khảo sát có kích thước đại diện',
            'Công cụ đo lường được hiệu chuẩn định kỳ',
            'Đối chiếu dữ liệu chéo từ nhiều nguồn',
          ],
        },
      },
      {
        layout: 'stats',
        tone: 'theme',
        content: {
          title: 'Dữ Liệu Khảo Sát Thực Tế',
          stats: [
            { value: '94.6%', label: 'Độ tin cậy mô hình thực nghiệm' },
            { value: '1,280', label: 'Mẫu dữ liệu được phân tích' },
            { value: '0.02', label: 'Mức sai số tiêu chuẩn cho phép' },
          ],
        },
      },
      {
        layout: 'quote',
        tone: 'soft',
        content: {
          quote: 'Khoa học là cách nhìn nhận sự thật bằng bằng chứng và tư duy phản biện độc lập.',
          author: 'Phương châm nghiên cứu hiện đại',
        },
      },
      {
        layout: 'statement',
        tone: 'accent',
        content: {
          kicker: 'KẾT LUẬN CHÍNH',
          body: 'Độ chính xác của dữ liệu quyết định giá trị thực tiễn của công trình nghiên cứu.',
          author: 'Hội đồng chuyên môn',
        },
      },
      {
        layout: 'closing',
        tone: 'soft',
        content: {
          title: 'Xin Cảm Ơn Thầy Cô & Các Bạn',
          subtitle: 'Rất mong nhận được đóng góp và câu hỏi thảo luận từ hội đồng.',
        },
      },
    ],
  },
  {
    id: 'tre-trung',
    name: 'Trẻ trung nhiều màu',
    description: 'Tươi vui, bắt mắt; hợp tiểu học, môn hoạt động trải nghiệm, kỹ năng sống.',
    themeId: 'tim',
    decorKit: 've-tay',
    stylePack: 'classroom',
    slides: [
      {
        layout: 'title',
        tone: 'accent',
        content: {
          kicker: 'KHÁM PHÁ TỰ NHIÊN',
          title: 'Thế Giới Động Vật Quanh Em',
          subtitle: 'Bài học sinh động dành cho các bạn nhỏ yêu thiên nhiên',
        },
      },
      {
        layout: 'hook',
        tone: 'soft',
        content: {
          kicker: 'CÙNG SUY NGHĨ NHÉ',
          title: 'Đố Bạn Biết?',
          body: 'Tại sao các loài động vật lại có hình dáng và màu sắc lông khác nhau?',
          items: ['Ngụy trang tránh kẻ thù', 'Thích nghi với khí hậu sống', 'Tìm kiếm thức ăn dễ dàng hơn'],
        },
      },
      {
        layout: 'cards',
        tone: 'theme',
        content: {
          title: 'Ba Nhóm Động Vật Chính',
          items: [
            'Động vật sống dưới nước: Cá heo, rùa biển bơi lội tung tăng',
            'Động vật trên cạn: Hổ, voi, thỏ chạy nhảy trong rừng',
            'Loài bay lượn trên trời: Chim bồ câu, đại bàng bay vút cao',
          ],
        },
      },
      {
        layout: 'comparison',
        tone: 'theme',
        content: {
          title: 'Động Vật Nuôi & Động Vật Hoang Dã',
          leftTitle: 'Vật Nuôi Trong Nhà',
          left: ['Chó, mèo, gà, vịt', 'Được con người chăm sóc', 'Hiền lành, thân thiết'],
          rightTitle: 'Động Vật Hoang Dã',
          right: ['Hổ, báo, sư tử, gấu', 'Tự săn mồi trong tự nhiên', 'Cần được bảo vệ sinh cảnh'],
        },
      },
      {
        layout: 'quiz',
        tone: 'soft',
        content: {
          kicker: 'ĐỐ VUI CÓ THƯỞNG',
          question: 'Loài thú nào sau đây bơi lội giỏi nhất dưới đại dương?',
          options: ['Hươu cao cổ', 'Cá voi xanh', 'Gấu trúc', 'Sóc túi'],
          answer: 'Cá voi xanh',
          explanation: 'Cá voi xanh là loài thú có vú lớn nhất hành tinh và bơi lội rất cừ dưới nước!',
        },
      },
      {
        layout: 'bullets',
        tone: 'theme',
        content: {
          title: 'Chúng Ta Cần Làm Gì Để Yêu Thương Động Vật?',
          bullets: [
            'Không săn bắt hoặc nuôi nhốt động vật hoang dã',
            'Chăm sóc chu đáo các bạn thú cưng trong gia đình',
            'Bảo vệ rừng xanh và giữ gìn môi trường sống trong lành',
          ],
        },
      },
      {
        layout: 'closing',
        tone: 'soft',
        content: {
          title: 'Bài Học Đến Đây Là Hết Rồi!',
          subtitle: 'Chúc các em có một buổi học thật nhiều niềm vui và khám phá mới!',
        },
      },
    ],
  },
  {
    id: 'hoc-thuat',
    name: 'Học thuật nghiêm túc',
    description: 'Trang trọng, dứt khoát, lập luận chặt chẽ; hợp THPT, bài giảng Toán, Lý, Hoá.',
    themeId: 'do',
    decorKit: 'hinh-hoc',
    stylePack: 'bold',
    slides: [
      {
        layout: 'title',
        tone: 'accent',
        content: {
          kicker: 'VẬT LÝ 10 — CHƯƠNG NĂNG LƯỢNG',
          title: 'Định Luật Bảo Toàn Năng Lượng',
          subtitle: 'Cơ năng, sự chuyển hóa năng lượng và ứng dụng trong tự nhiên',
        },
      },
      {
        layout: 'section',
        tone: 'accent',
        content: {
          kicker: 'PHẦN 1',
          title: 'Khái Niệm Cơ Năng & Thế Năng',
          subtitle: 'Khảo sát chuyển động của vật trong trường trọng lực đều',
        },
      },
      {
        layout: 'table',
        tone: 'theme',
        content: {
          title: 'Bảng Đối Chiếu Các Dạng Năng Lượng',
          rows: [
            ['Dạng năng lượng', 'Công thức xác định', 'Đặc điểm bảo toàn'],
            ['Động năng', '$W_d = \\tfrac{1}{2}mv^2$', 'Phụ thuộc vận tốc'],
            ['Thế năng trọng trường', '$W_t = mgh$', 'Phụ thuộc toạ độ cao'],
            ['Cơ năng toàn phần', '$W = W_d + W_t$', 'Hằng số trong trường thế'],
          ],
        },
      },
      {
        layout: 'example',
        tone: 'theme',
        content: {
          title: 'Bài Toán Mẫu: Thả Rơi Tự Do',
          problem:
            'Thả một vật có khối lượng $m = 2\\text{ kg}$ từ độ cao $h = 20\\text{ m}$. Bỏ qua ma sát không khí, lấy $g = 10\\text{ m/s}^2$. Tìm vận tốc khi chạm đất.',
          steps: [
            'Bảo toàn cơ năng giữa vị trí thả và mặt đất: $W_1 = W_2$',
            'Tại đỉnh: $W_1 = mgh = 2 \\times 10 \\times 20 = 400\\text{ J}$',
            'Khi chạm đất: $W_2 = \\tfrac{1}{2}mv^2 = 400\\text{ J} \\Rightarrow v = \\sqrt{2gh} = 20\\text{ m/s}$',
          ],
          conclusion: 'Vận tốc cực đại tại thời điểm chạm đất đạt $20\\text{ m/s}$.',
        },
      },
      {
        layout: 'comparison',
        tone: 'theme',
        content: {
          title: 'Va Chạm Đàn Hồi & Va Chạm Mềm',
          leftTitle: 'Va Chạm Đàn Hồi',
          left: ['Động năng bảo toàn tuyệt đối', 'Các vật tách rời sau tương tác', 'Không sinh nhiệt lượng hao phí'],
          rightTitle: 'Va Chạm Mềm',
          right: ['Động năng chuyển thành nội năng', 'Các vật dính liền cùng vận tốc', 'Cơ năng tổng cộng bị giảm sút'],
        },
      },
      {
        layout: 'quiz',
        tone: 'soft',
        content: {
          kicker: 'CÂU HỎI TRẮC NGHIỆM',
          question: 'Khi một vật ném thẳng đứng lên cao, đại lượng nào sau đây không đổi (bỏ qua sức cản)?',
          options: ['Động năng của vật', 'Thế năng trọng trường', 'Cơ năng toàn phần', 'Vận tốc tức thời'],
          answer: 'Cơ năng toàn phần',
          explanation: 'Chỉ có thế năng và động năng chuyển hoá lẫn nhau; cơ năng toàn phần được bảo toàn.',
        },
      },
      {
        layout: 'closing',
        tone: 'soft',
        content: {
          title: 'Củng Cố Kiến Thức & Bài Tập',
          subtitle: 'Làm bài tập 1, 2, 3 trang 112 SGK Vật Lý và chuẩn bị bài mới.',
        },
      },
    ],
  },
  {
    id: 'thien-nhien',
    name: 'Thiên nhiên xanh',
    description: 'Tươi mát, dịu mắt; hợp môn Sinh học, Địa lí, Môi trường và Khí hậu.',
    themeId: 'rung',
    decorKit: 'la-xanh',
    stylePack: 'bento',
    slides: [
      {
        layout: 'title',
        tone: 'accent',
        content: {
          kicker: 'ĐỊA LÝ & SINH THÁI HỌC',
          title: 'Vòng Tuần Hoàn Của Nước',
          subtitle: 'Hành trình kỳ diệu của nguồn nước duy trì sự sống trên Trái Đất',
        },
      },
      {
        layout: 'agenda',
        tone: 'soft',
        content: {
          kicker: 'LỘ TRÌNH KHÁM PHÁ',
          title: 'Các Giai Đoạn Chính',
          items: [
            'Hiện tượng bốc hơi và thoát hơi nước',
            'Ngưng tụ tạo mây trên khí quyển',
            'Mưa và sự phân bố giáng thủy',
            'Dòng chảy ngầm và bổ sung đại dương',
          ],
        },
      },
      {
        layout: 'cycle',
        tone: 'theme',
        content: {
          title: 'Chu Trình Vận Động Khép Kín',
          steps: [
            '1. Nắng chiếu bề mặt nước',
            '2. Hơi nước bốc lên cao',
            '3. Gặp lạnh ngưng tụ thành mây',
            '4. Mưa rơi tưới mát mặt đất',
            '5. Nước ngấm chảy về sông biển',
          ],
        },
      },
      {
        layout: 'cards',
        tone: 'theme',
        content: {
          title: 'Tác Động Của Nước Đến Hệ Sinh Thái',
          items: [
            'Thực vật rừng mưa: Duy trì độ ẩm và tuần hoàn chất hữu cơ',
            'Sông ngòi đồng bằng: Bồi đắp phù sa màu mỡ cho nông nghiệp',
            'Hồ nước ngọt tự nhiên: Cung cấp nước sinh hoạt cho con người',
          ],
        },
      },
      {
        layout: 'stats',
        tone: 'theme',
        content: {
          title: 'Những Con Số Về Tài Nguyên Nước',
          stats: [
            { value: '71%', label: 'Diện tích bề mặt Trái Đất là nước' },
            { value: '97.5%', label: 'Tỉ lệ nước mặn trong đại dương' },
            { value: '0.3%', label: 'Nước ngọt sông hồ con người dùng được' },
          ],
        },
      },
      {
        layout: 'statement',
        tone: 'accent',
        content: {
          kicker: 'THÔNG ĐIỆP BẢO VỆ',
          body: 'Bảo vệ nguồn nước sạch chính là bảo vệ sự sống còn của thế hệ tương lai.',
          author: 'Chương trình Môi trường Liên Hợp Quốc',
        },
      },
      {
        layout: 'closing',
        tone: 'soft',
        content: {
          title: 'Hành Động Nhỏ Vì Hành Tinh Xanh',
          subtitle: 'Tiết kiệm nước mỗi ngày và cùng nhau giữ gìn môi trường sống.',
        },
      },
    ],
  },
  {
    id: 'cong-nghe',
    name: 'Công nghệ tối màu',
    description: 'Hiện đại, tương phản cao, chuyên nghiệp; hợp Tin học, Công nghệ, AI và Lập trình.',
    themeId: 'dem-xanh',
    decorKit: 'hinh-hoc',
    stylePack: 'keynote',
    slides: [
      {
        layout: 'title',
        tone: 'accent',
        content: {
          kicker: 'CHUYỂN ĐỔI SỐ & TIN HỌC',
          title: 'Trí Tuệ Nhân Tạo & Tương Lai',
          subtitle: 'Khái niệm, nguyên lý hoạt động và ứng dụng của Machine Learning',
        },
      },
      {
        layout: 'statement',
        tone: 'accent',
        content: {
          kicker: 'XU THẾ THỜI ĐẠI',
          body: 'AI không thay thế con người, nhưng người biết dùng AI sẽ tạo ra đột phá vượt bậc.',
          author: 'Chuyên gia công nghệ số',
        },
      },
      {
        layout: 'timeline',
        tone: 'theme',
        content: {
          title: 'Lịch Sử Phát Triển Của AI',
          steps: [
            '1956: Khởi xướng hội nghị Dartmouth',
            '1997: Máy tính Deep Blue thắng cờ vua',
            '2012: Bùng nổ mạng nơ-ron học sâu (Deep Learning)',
            '2022+: Kỷ nguyên trí tuệ nhân tạo tạo sinh (Generative AI)',
          ],
        },
      },
      {
        layout: 'two-column',
        tone: 'theme',
        content: {
          title: 'Cơ Chế Máy Học Cơ Bản',
          left: [
            'Dữ liệu huấn luyện quy mô lớn',
            'Trích xuất đặc trưng tự động',
            'Mô hình hoá bằng đại số tuyến tính',
          ],
          right: [
            'Thuật toán tối ưu hoá Gradient Descent',
            'Kiểm thử trên tập dữ liệu độc lập',
            'Đánh giá độ chính xác và điều chỉnh siêu tham số',
          ],
        },
      },
      {
        layout: 'comparison',
        tone: 'theme',
        content: {
          title: 'Lập Trình Truyền Thống vs Máy Học',
          leftTitle: 'Lập Trình Truyền Thống',
          left: [
            'Quy tắc viết tay bằng code',
            'Nhận đầu vào trả ra đầu ra',
            'Khó giải bài toán thị giác & ngôn ngữ',
          ],
          rightTitle: 'Học Máy (Machine Learning)',
          right: [
            'Học quy luật từ dữ liệu mẫu',
            'Nhận đầu vào + đầu ra để tìm quy luật',
            'Xử lý vượt trội bài toán phức tạp',
          ],
        },
      },
      {
        layout: 'quiz',
        tone: 'soft',
        content: {
          kicker: 'KIỂM TRA HIỂU BIẾT',
          question: 'Mô hình ngôn ngữ lớn (LLM) học tập chủ yếu dựa trên kiến trúc nào?',
          options: [
            'Mạng nơ-ron biến đổi (Transformer)',
            'Giải thuật đệ quy tuyến tính',
            'Bảng băm và danh sách liên kết',
            'Thuật toán tìm kiếm theo chiều sâu',
          ],
          answer: 'Mạng nơ-ron biến đổi (Transformer)',
          explanation:
            'Kiến trúc Transformer với cơ chế tự chú ý (Self-Attention) là nền tảng của các mô hình LLM hiện đại.',
        },
      },
      {
        layout: 'closing',
        tone: 'soft',
        content: {
          title: 'Khám Phá & Sáng Tạo Cùng Công Nghệ',
          subtitle: 'Tài liệu thực hành và mã nguồn tham khảo đã được gửi trong nhóm học tập.',
        },
      },
    ],
  },
  {
    id: 'co-dien',
    name: 'Cổ điển giấy ấm',
    description: 'Trầm ấm, hoài niệm, trang nhã; hợp Ngữ văn, Lịch sử, Giáo dục công dân và Văn hoá.',
    themeId: 'giay-am',
    decorKit: 'hoa-diu',
    stylePack: 'editorial',
    slides: [
      {
        layout: 'title',
        tone: 'accent',
        content: {
          kicker: 'NGỮ VĂN & LỊCH SỬ',
          title: 'Hồn Nước Trong Ca Dao Dân Ca',
          subtitle: 'Vẻ đẹp tình yêu quê hương, đất nước và con người Việt Nam xưa',
        },
      },
      {
        layout: 'hook',
        tone: 'soft',
        content: {
          kicker: 'CẢM NHẬN ĐẦU GIỜ',
          title: 'Tiếng Hát Từ Cội Nguồn',
          body: 'Ca dao là tấm gương phản chiếu tâm hồn bình dị, lạc quan mà sâu sắc của người lao động qua ngàn đời.',
          items: ['Tình cảm gia đình, cha mẹ', 'Tình yêu đôi lứa trong sáng', 'Tình yêu xóm làng, đất nước'],
        },
      },
      {
        layout: 'quote',
        tone: 'soft',
        content: {
          quote:
            'Công cha như núi Thái Sơn, / Nghĩa mẹ như nước trong nguồn chảy ra. / Một lòng thờ mẹ kính cha, / Cho tròn chữ hiếu mới là đạo con.',
          author: 'Ca dao cổ truyền Việt Nam',
        },
      },
      {
        layout: 'cards',
        tone: 'theme',
        content: {
          title: 'Ba Chủ Đề Lớn Trong Văn Học Dân Gian',
          items: [
            'Công cha nghĩa mẹ: Núi cao biển rộng, đạo làm con hiếu thuận',
            'Nỗi niềm lao động: Cày đồng buổi ban trưa, quý từng hạt gạo',
            'Châm biếm thói hư tật xấu: Tiếng cười lạc quan, vượt khó',
          ],
        },
      },
      {
        layout: 'two-column',
        tone: 'theme',
        content: {
          title: 'Nghệ Thuật Ngôn Từ & Hình Ảnh',
          left: [
            'Thể thơ lục bát truyền thống uyển chuyển',
            'Cách gieo vần bằng trắc tự nhiên, ngọt ngào',
            'Sử dụng điệp từ điệp ngữ tạo nhịp điệu',
          ],
          right: [
            'Hình ảnh ẩn dụ gần gũi: con cò, bến nước',
            'Ngôn ngữ bình dị, mộc mạc mà thấm thía',
            'Dễ nhớ, dễ thuộc, truyền khẩu qua nhiều thế hệ',
          ],
        },
      },
      {
        layout: 'bullets',
        tone: 'theme',
        content: {
          title: 'Ý Nghĩa Giáo Dục Trong Nhà Trường',
          bullets: [
            'Bồi dưỡng lòng nhân ái, tình yêu cội nguồn dân tộc',
            'Hiểu sâu sắc hơn về đời sống tinh thần của cha ông',
            'Rèn luyện kỹ năng cảm thụ và hành văn giàu hình cảm',
          ],
        },
      },
      {
        layout: 'closing',
        tone: 'soft',
        content: {
          title: 'Giữ Gìn Bản Sắc Văn Hóa Dân Tộc',
          subtitle: 'Mời các em về nhà sưu tầm thêm 5 câu ca dao về tình cảm gia đình.',
        },
      },
    ],
  },
  {
    id: 'vui-nhon',
    name: 'Vui nhộn hoạt hình',
    description: 'Rực rỡ, lấp lánh, sinh động; hợp giờ sinh hoạt, trò chơi học tập, khởi động đầu giờ.',
    themeId: 'vang-nang',
    decorKit: 'lap-lanh',
    stylePack: 'classroom',
    slides: [
      {
        layout: 'title',
        tone: 'accent',
        content: {
          kicker: 'KHỞI ĐỘNG VUI VẺ',
          title: 'Đố Vui Nhanh Nhớ Nhanh',
          subtitle: 'Thử thách trí thông minh và tinh thần đồng đội của các tổ',
        },
      },
      {
        layout: 'hook',
        tone: 'soft',
        content: {
          kicker: 'LUẬT CHƠI DỄ ÒM',
          title: 'Sẵn Sàng Chưa Nào?',
          body: 'Mỗi đội sẽ có 15 giây để trả lời từng câu hỏi. Đội nào bấm chuông nhanh nhất và đúng sẽ nhận ngôi sao may mắn!',
          items: ['Hội ý nhanh trong tổ', 'Cử đại diện trả lời', 'Cổ vũ hết mình cho bạn'],
        },
      },
      {
        layout: 'cards',
        tone: 'theme',
        content: {
          title: 'Ba Vòng Thi Kịch Tính',
          items: [
            'Vòng 1 — Khởi động: 3 câu hỏi nhanh về tự nhiên quanh ta',
            'Vòng 2 — Tăng tốc: Tìm ô chữ bí mật và hình ảnh bí ẩn',
            'Vòng 3 — Về đích: Câu hỏi ngôi sao hy vọng nhân đôi điểm',
          ],
        },
      },
      {
        layout: 'quiz',
        tone: 'soft',
        content: {
          kicker: 'CÂU ĐỐ SỐ 1',
          question: 'Cái gì chặt không đứt, bứt không rời, phơi không khô, nấu không chín?',
          options: ['Dòng nước', 'Cơn gió', 'Bóng đèn', 'Ánh nắng'],
          answer: 'Dòng nước',
          explanation: 'Chính là dòng nước mát lành đấy các bạn nhỏ ơi!',
        },
      },
      {
        layout: 'two-column',
        tone: 'theme',
        content: {
          title: 'Đại Chiến Điểm Số: Đội Cam vs Đội Vàng',
          leftTitle: 'Đội Cam (Sư Tử)',
          left: [
            '120 điểm vòng Khởi động',
            'Bấm chuông nhanh 4/4 câu hỏi',
            'Tinh thần đoàn kết xuất sắc',
          ],
          rightTitle: 'Đội Vàng (Đại Bàng)',
          right: [
            '110 điểm bám đuổi sát nút',
            'Giải mã ô chữ bí mật nhanh nhất',
            'Cổ vũ sôi nổi nhất hội trường',
          ],
        },
      },
      {
        layout: 'statement',
        tone: 'accent',
        content: {
          kicker: 'TỔNG KẾT VÒNG THI',
          body: 'Chúc mừng tất cả các bạn nhỏ đã tham gia nhiệt tình và hoàn thành xuất sắc!',
          author: 'Ban giám khảo lớp học',
        },
      },
      {
        layout: 'closing',
        tone: 'soft',
        content: {
          title: 'Cả Lớp Cùng Hoan Hô Nào!',
          subtitle: 'Hẹn gặp lại các bạn trong những giờ sinh hoạt hào hứng tiếp theo!',
        },
      },
    ],
  },
  {
    id: 'bang-den',
    name: 'Bảng đen phấn trắng',
    description: 'Gần gũi như bảng lớp học; hợp bài tập Toán, công thức, bài giảng mẫu và chữa đề.',
    themeId: 'bang-den',
    decorKit: 've-tay',
    stylePack: 'classroom',
    slides: [
      {
        layout: 'title',
        tone: 'theme',
        content: {
          kicker: 'TOÁN LỚP 6 — BÀI TẬP VỀ NHÀ',
          title: 'Phân Số & Các Phép Tính',
          subtitle: 'Quy đồng mẫu số, cộng trừ nhân chia và ứng dụng giải toán',
        },
      },
      {
        layout: 'bullets',
        tone: 'theme',
        content: {
          title: 'Quy Tắc Cộng Trừ Cùng Mẫu',
          bullets: [
            'Muốn cộng hai phân số cùng mẫu: Cộng tử số và giữ nguyên mẫu số: $\\tfrac{a}{m} + \\tfrac{b}{m} = \\tfrac{a+b}{m}$',
            'Muốn trừ hai phân số cùng mẫu: Lấy tử trừ tử và giữ nguyên mẫu số: $\\tfrac{a}{m} - \\tfrac{b}{m} = \\tfrac{a-b}{m}$',
            'Rút gọn kết quả về phân số tối giản trước khi kết luận',
          ],
        },
      },
      {
        layout: 'example',
        tone: 'theme',
        content: {
          title: 'Ví Dụ Mẫu: Cộng Hai Phân Số Khác Mẫu',
          problem: 'Tính giá trị biểu thức: $A = \\tfrac{3}{4} + \\tfrac{2}{5}$',
          steps: [
            'Tìm mẫu số chung nhỏ nhất của 4 và 5: $\\text{MSCNN} = 20$',
            'Quy đồng phân số: $\\tfrac{3}{4} = \\tfrac{15}{20}$ và $\\tfrac{2}{5} = \\tfrac{8}{20}$',
            'Cộng hai tử số đã quy đồng: $\\tfrac{15}{20} + \\tfrac{8}{20} = \\tfrac{23}{20}$',
          ],
          conclusion: 'Đáp số: $A = \\tfrac{23}{20} = 1\\tfrac{3}{20}$.',
        },
      },
      {
        layout: 'cards',
        tone: 'theme',
        content: {
          title: 'Tính Chất Phép Nhân & Chia Phân Số',
          items: [
            'Nhân phân số: Tử nhân tử, mẫu nhân mẫu: $\\tfrac{a}{b} \\times \\tfrac{c}{d} = \\tfrac{a \\times c}{b \\times d}$',
            'Chia phân số: Nhân với phân số nghịch đảo: $\\tfrac{a}{b} : \\tfrac{c}{d} = \\tfrac{a}{b} \\times \\tfrac{d}{c}$',
            'Tính chất giao hoán và phân phối đối với phép cộng: $a(b + c) = ab + ac$',
          ],
        },
      },
      {
        layout: 'quiz',
        tone: 'theme',
        content: {
          kicker: 'LUYỆN TẬP NHANH',
          question: 'Kết quả của phép tính $\\tfrac{2}{3} \\times \\tfrac{9}{4}$ sau khi rút gọn là bao nhiêu?',
          options: ['$\\tfrac{3}{2}$', '$\\tfrac{18}{12}$', '$\\tfrac{1}{2}$', '$\\tfrac{2}{3}$'],
          answer: '$\\tfrac{3}{2}$',
          explanation: 'Ta có $\\tfrac{2 \\times 9}{3 \\times 4} = \\tfrac{18}{12} = \\tfrac{3}{2}$ (chia cả tử và mẫu cho 6).',
        },
      },
      {
        layout: 'statement',
        tone: 'theme',
        content: {
          kicker: 'LƯU Ý QUAN TRỌNG',
          body: 'Luôn tìm mẫu số chung nhỏ nhất trước khi quy đồng để phép tính gọn gàng nhất.',
          author: 'Thầy cô hướng dẫn',
        },
      },
      {
        layout: 'closing',
        tone: 'theme',
        content: {
          title: 'Hết Giờ Chữa Bài',
          subtitle: 'Các em ghi chép cẩn thận vào vở và làm tiếp bài 4, 5 trang 38 nhé.',
        },
      },
    ],
  },
  {
    id: 'pastel-mam-non',
    name: 'Pastel Mầm Non',
    description: 'Nền kem ấm, hồng – xanh ngọc – vàng bơ bo tròn mềm mại, thân thiện cho mầm non và tiểu học.',
    themeId: 'pastel-mam-non',
    decorKit: 'hoa-diu',
    stylePack: 'classroom',
    slides: [
      {
        layout: 'title',
        tone: 'accent',
        content: {
          kicker: 'Tiếng Việt Lớp 1 • Tuần 12',
          title: 'Khám Phá Thế Giới Loài Vật Quanh Em',
          subtitle: 'Cùng quan sát, gọi tên và kể chuyện về những người bạn nhỏ đáng yêu.',
        },
      },
      {
        layout: 'bullets',
        tone: 'soft',
        content: {
          kicker: 'Mục tiêu bài học',
          title: 'Hôm Nay Chúng Mình Học Gì?',
          subtitle: 'Ba hoạt động vui nhộn giúp các em nhớ nhanh và nói rõ ràng.',
          bullets: [
            'Nhận biết tên gọi: Phân biệt vật nuôi trong nhà và động vật sống trong rừng xanh.',
            'Mô tả đặc điểm: Nói được 2 câu trọn vẹn về màu lông, tiếng kêu và món ăn yêu thích.',
            'Yêu quý thiên nhiên: Biết chăm sóc thú cưng nhẹ nhàng và giữ vệ sinh môi trường.',
          ],
        },
      },
      {
        layout: 'cards',
        tone: 'theme',
        content: {
          kicker: 'Góc quan sát',
          title: 'Ba Người Bạn Thân Quen',
          items: [
            'Mèo Mướp Tinh Nghịch: Bộ lông vằn mềm mượt, đôi tai thính và bước đi thật nhẹ nhàng.',
            'Cún Con Trung Thành: Vẫy đuôi mừng rỡ mỗi khi bạn nhỏ đi học về và biết trông nhà.',
            'Thỏ Trắng Đáng Yêu: Đôi tai dài hồng hào, thích ăn cà rốt giòn tan vào buổi sáng.',
          ],
        },
      },
      {
        layout: 'comparison',
        tone: 'soft',
        content: {
          kicker: 'Hoạt động nhóm',
          title: 'Thi Đoán Tiếng Kêu & Bắt Chước',
          leftTitle: 'Bước 1: Lắng nghe',
          left: [
            'Cô mở âm thanh trong 5 giây.',
            'Cả nhóm giữ trật tự và lắng nghe kỹ.',
            'Giơ thẻ màu khi nhận ra con vật.',
          ],
          rightTitle: 'Bước 2: Chia sẻ',
          right: [
            'Đại diện nhóm nêu tên con vật đúng.',
            'Đặt một câu có từ chỉ hoạt động của con vật đó.',
          ],
        },
      },
      {
        layout: 'stats',
        tone: 'theme',
        content: {
          kicker: 'Thi đua khen thưởng',
          title: 'Bảng Sao Chăm Ngoan',
          stats: [
            { value: '120', label: 'Bông hoa điểm tốt cả lớp đạt được trong tuần' },
            { value: '15 phút', label: 'Thời gian kể chuyện sáng tạo theo tranh' },
            { value: '4 tổ', label: 'Cùng tham gia ghép hình con vật nhanh nhất' },
          ],
        },
      },
      {
        layout: 'closing',
        tone: 'soft',
        content: {
          title: 'Các Em Giỏi Lắm!',
          subtitle: 'Về nhà hãy vẽ một người bạn nhỏ mình yêu thích và kể cho bố mẹ nghe nhé.',
        },
      },
    ],
  },
  {
    id: 'bien-xanh',
    name: 'Biển Xanh Mát',
    description: 'Nền xanh băng dịu mắt, điểm nhấn đại dương và san hô rõ ràng cho khoa học tự nhiên, địa lý.',
    themeId: 'bien-xanh',
    decorKit: 'la-xanh',
    stylePack: 'bento',
    slides: [
      {
        layout: 'title',
        tone: 'accent',
        content: {
          kicker: 'Địa Lý & Khoa Học • Lớp 6',
          title: 'Hệ Sinh Thái Biển Và Vòng Tuần Hoàn Nước',
          subtitle: 'Tìm hiểu vai trò của đại dương đối với khí hậu và sự sống trên Trái Đất.',
        },
      },
      {
        layout: 'stats',
        tone: 'soft',
        content: {
          kicker: 'Số liệu nổi bật',
          title: 'Đại Dương Trên Hành Tinh Xanh',
          stats: [
            { value: '71%', label: 'Diện tích bề mặt Trái Đất được bao phủ bởi biển và đại dương' },
            { value: '97%', label: 'Tổng lượng nước trên hành tinh là nước mặn đại dương' },
            { value: '50%', label: 'Lượng khí oxy toàn cầu do thực vật phù du biển tạo ra' },
          ],
        },
      },
      {
        layout: 'cards',
        tone: 'theme',
        content: {
          kicker: 'Các tầng biển',
          title: 'Ba Đới Sống Đặc Trưng Dưới Mặt Nước',
          items: [
            'Tầng Mặt (0–200 m): Giàu ánh sáng, nơi tập trung rạn san hô, tảo biển và cá gần bờ.',
            'Tầng Chạng Vạng (200–1000 m): Ánh sáng yếu dần, sinh vật thích nghi phát quang sinh học.',
            'Tầng Biển Sâu (> 1000 m): Áp suất rất lớn, nhiệt độ ổn định quanh 2–4 °C.',
          ],
        },
      },
      {
        layout: 'comparison',
        tone: 'soft',
        content: {
          kicker: 'So sánh dòng biển',
          title: 'Ảnh Hưởng Của Dòng Biển Đến Khí Hậu',
          leftTitle: 'Dòng biển nóng',
          left: [
            'Chảy từ vùng xích đạo về phía hai cực.',
            'Mang theo hơi ẩm dồi dào.',
            'Giúp khí hậu ven biển ấm và mưa nhiều.',
          ],
          rightTitle: 'Dòng biển lạnh',
          right: [
            'Chảy từ vùng vĩ độ cao về xích đạo.',
            'Làm hạ nhiệt không khí vùng ven bờ.',
            'Hạn chế lượng mưa gây khí hậu khô.',
          ],
        },
      },
      {
        layout: 'bullets',
        tone: 'theme',
        content: {
          kicker: 'Bảo vệ môi trường',
          title: 'Hành Động Giữ Biển Xanh Sạch',
          subtitle: 'Những thay đổi nhỏ từ trường học giúp giảm rác thải nhựa đại dương.',
          bullets: [
            'Hạn chế nhựa dùng một lần: Sử dụng bình nước cá nhân và túi vải khi đi học, dã ngoại.',
            'Phân loại rác tại nguồn: Tách riêng chai nhựa, lon kim loại để tái chế đúng quy trình.',
            'Bảo vệ rạn san hô: Không khai thác san hô và nâng cao ý thức du lịch biển bền vững.',
          ],
        },
      },
      {
        layout: 'closing',
        tone: 'soft',
        content: {
          title: 'Giữ Xanh Cho Đại Dương',
          subtitle: 'Hoàn thành sơ đồ vòng tuần hoàn nước vào vở thực hành trước buổi học tới.',
        },
      },
    ],
  },
  {
    id: 'so-tay-o-li',
    name: 'Sổ Tay Ô Li',
    description: 'Giấy kẻ sổ tay mộc mạc với dòng lề đỏ, phù hợp ghi chép bài tập, ôn luyện và hướng dẫn.',
    themeId: 'so-tay-o-li',
    decorKit: 've-tay',
    stylePack: 'classroom',
    slides: [
      {
        layout: 'title',
        tone: 'accent',
        content: {
          kicker: 'Ôn Tập Ngữ Văn • Sổ Tay Ghi Nhớ',
          title: 'Phương Pháp Viết Đoạn Văn Nghị Luận Xã Hội',
          subtitle: 'Ghi chú từng bước lập dàn ý, chọn dẫn chứng đắt giá và diễn đạt mạch lạc.',
        },
      },
      {
        layout: 'bullets',
        tone: 'soft',
        content: {
          kicker: 'Cấu trúc chuẩn',
          title: 'Bốn Phần Không Thể Thiếu Trong Đoạn Văn',
          subtitle: 'Giữ độ dài cân đối khoảng 180–220 chữ, không xuống dòng tách đoạn.',
          bullets: [
            '1. Mở đoạn (1–2 câu): Dẫn trực tiếp vào vấn đề nghị luận nêu ở đề bài, ngắn gọn và đúng trọng tâm.',
            '2. Giải thích & Bàn luận: Làm rõ khái niệm cốt lõi và nêu tối thiểu hai lý lẽ thuyết phục.',
            '3. Dẫn chứng thực tế: Chọn một tấm gương cụ thể, chính xác và có sức lan toả tích cực.',
            '4. Phản đề & Bài học: Mở rộng góc nhìn trái chiều và rút ra hành động thiết thực cho bản thân.',
          ],
        },
      },
      {
        layout: 'comparison',
        tone: 'theme',
        content: {
          kicker: 'So sánh cách viết',
          title: 'Tránh Lan Man Khi Triển Khai Ý',
          leftTitle: 'Nên làm',
          left: [
            'Bám sát từ khoá của đề bài ở câu chủ đề.',
            'Ưu tiên câu văn ngắn, động từ rõ nghĩa.',
            'Dẫn chứng chọn lọc, cô đọng.',
          ],
          rightTitle: 'Cần tránh',
          right: [
            'Sa đà kể tiểu sử nhân vật dài dòng.',
            'Liệt kê nhiều khẩu hiệu sáo rỗng.',
            'Xuống dòng chia thành nhiều đoạn nhỏ.',
          ],
        },
      },
      {
        layout: 'table',
        tone: 'soft',
        content: {
          kicker: 'Thang kiểm tra nhanh',
          title: 'Bảng Tự Chấm Trước Khi Nộp Bài',
          rows: [
            ['Tiêu chí', 'Yêu cầu đạt', 'Điểm gợi ý'],
            ['Hình thức đoạn văn', 'Viết liền mạch 1 đoạn, đúng dung lượng', '0.25 đ'],
            ['Xác định đúng vấn đề', 'Trúng trọng tâm câu hỏi ngay câu đầu', '0.25 đ'],
            ['Lập luận & Dẫn chứng', 'Lý lẽ chặt chẽ, dẫn chứng xác thực', '1.00 đ'],
            ['Chính tả & Diễn đạt', 'Không lỗi câu, dùng từ tự nhiên', '0.50 đ'],
          ],
        },
      },
      {
        layout: 'quote',
        tone: 'theme',
        content: {
          kicker: 'Ghi chú bên lề',
          quote: 'Một lập luận hay không nằm ở số lượng chữ nhiều, mà ở sự chính xác của từng lý lẽ.',
          author: 'Mẹo phòng thi • Ghi vào sổ tay',
        },
      },
      {
        layout: 'closing',
        tone: 'soft',
        content: {
          title: 'Luyện Viết Mỗi Ngày 15 Phút',
          subtitle: 'Thực hành viết một đoạn văn mẫu theo sơ đồ vừa ghi trước giờ chữa bài.',
        },
      },
    ],
  },
  {
    id: 'cam-nang-dong',
    name: 'Cam Năng Động',
    description: 'Nền kem sáng kết hợp cam đất và chàm đậm đầy sức sống cho STEM, dự án nhóm và khởi động.',
    themeId: 'cam-nang-dong',
    decorKit: 'hinh-hoc',
    stylePack: 'bold',
    slides: [
      {
        layout: 'title',
        tone: 'accent',
        content: {
          kicker: 'Dự Án STEM • Sáng Tạo Kỹ Thuật',
          title: 'Thiết Kế Mô Hình Xe Thế Năng Chạy Bằng Dây Thun',
          subtitle: 'Vận dụng định luật bảo toàn cơ năng để chế tạo sản phẩm di chuyển xa nhất.',
        },
      },
      {
        layout: 'cards',
        tone: 'soft',
        content: {
          kicker: 'Quy trình kỹ thuật',
          title: 'Ba Giai Đoạn Thực Hiện Thử Thách',
          items: [
            'Bước 01 – Phác thảo: Chọn đường kính bánh xe, độ dài trục và vị trí móc dây thun hợp lý.',
            'Bước 02 – Lắp ráp: Cố định khung bìa cứng chắc chắn, giảm ma sát ở hai ổ trục quay.',
            'Bước 03 – Thử nghiệm: Đo quãng đường chạy thực tế 3 lần và điều chỉnh độ căng dây thun.',
          ],
        },
      },
      {
        layout: 'stats',
        tone: 'theme',
        content: {
          kicker: 'Chỉ tiêu đánh giá',
          title: 'Tiêu Chuẩn Hoàn Thành Sản Phẩm',
          stats: [
            { value: '≥ 4 m', label: 'Quãng đường di chuyển tối thiểu trên mặt sàn phẳng' },
            { value: '180 g', label: 'Khối lượng tối đa cho phép của toàn bộ thân xe' },
            { value: '25 phút', label: 'Thời gian lắp ráp và hiệu chỉnh trước khi thi đấu' },
          ],
        },
      },
      {
        layout: 'comparison',
        tone: 'soft',
        content: {
          kicker: 'Tối ưu lực đẩy',
          title: 'Kiểm Soát Độ Bám Và Ma Sát',
          leftTitle: 'Tăng độ bám bánh sau',
          left: [
            'Quấn vòng cao su mỏng quanh mép bánh.',
            'Truyền lực kéo ổn định không trượt.',
          ],
          rightTitle: 'Giảm ma sát trục quay',
          right: [
            'Luồn trục tre qua ống hút nhựa trơn.',
            'Giữ hai bánh thẳng hàng và song song.',
          ],
        },
      },
      {
        layout: 'bullets',
        tone: 'theme',
        content: {
          kicker: 'An toàn thực hành',
          title: 'Quy Tắc Tại Góc Chế Tạo',
          bullets: [
            'Kiểm tra dây thun trước khi kéo: Không dùng dây đã nứt hoặc kéo căng vượt giới hạn đàn hồi.',
            'Thao tác kéo cắt cẩn thận: Cắt bìa trên tấm lót chuyên dụng và thu gọn vật sắc ngay sau khi dùng.',
            'Ghi chép nhật ký thử nghiệm: Lưu lại thông số mỗi lần chỉnh sửa để cả nhóm rút kinh nghiệm.',
          ],
        },
      },
      {
        layout: 'closing',
        tone: 'soft',
        content: {
          title: 'Sẵn Sàng Vào Đường Đua!',
          subtitle: 'Các nhóm kiểm tra lần cuối khung xe và mang sản phẩm ra vạch xuất phát.',
        },
      },
    ],
  },
  {
    id: 'lich-su-co',
    name: 'Lịch Sử Cổ Điển',
    description: 'Giấy da ngà cổ điển với đỏ son và vàng đồng trang nghiêm cho lịch sử, văn học và di sản.',
    themeId: 'lich-su-co',
    decorKit: 'toi-gian',
    stylePack: 'editorial',
    slides: [
      {
        layout: 'title',
        tone: 'accent',
        content: {
          kicker: 'Lịch Sử Việt Nam • Thế Kỷ X – XIV',
          title: 'Văn Minh Đại Việt Thời Lý – Trần',
          subtitle: 'Dấu ấn xây dựng quốc gia độc lập, mở mang giáo dục và võ công giữ nước.',
        },
      },
      {
        layout: 'timeline',
        tone: 'soft',
        content: {
          kicker: 'Dòng thời gian',
          title: 'Những Mốc Son Định Hình Thời Đại',
          steps: [
            '1010: Dời Đô Về Thăng Long — Lý Thái Tổ ban Chiếu dời đô, mở ra trung tâm văn hoá lâu dài.',
            '1070: Lập Văn Miếu — Khởi đầu nền giáo dục Nho học và xây dựng Quốc Tử Giám năm 1076.',
            '1225: Nhà Trần Thành Lập — Củng cố bộ máy hành chính, phát triển đê điều và nông nghiệp.',
            '1288: Chiến Thắng Bạch Đằng — Quân dân nhà Trần đánh bại quân xâm lược Nguyên – Mông.',
          ],
        },
      },
      {
        layout: 'comparison',
        tone: 'theme',
        content: {
          kicker: 'Kinh tế & Xã hội',
          title: 'Nền Tảng Vững Mạnh Của Quốc Gia',
          leftTitle: 'Chính sách nông nghiệp',
          left: [
            'Đặt chức Hà đê sứ đắp đê phòng lụt.',
            'Thực hiện chính sách “ngụ binh ư nông”.',
            'Mở rộng diện tích canh tác vùng châu thổ.',
          ],
          rightTitle: 'Thủ công & Thương nghiệp',
          right: [
            'Nghề gốm men ngọc, men nâu phát triển.',
            'Cảng Vân Đồn giao thương sầm uất.',
            'Kinh thành Thăng Long có 61 phường phố.',
          ],
        },
      },
      {
        layout: 'cards',
        tone: 'soft',
        content: {
          kicker: 'Di sản văn hoá',
          title: 'Thành Tựu Kiến Trúc & Tư Tưởng',
          items: [
            'Chùa Một Cột: Biểu tượng tạo hình đoá sen vươn lên giữa mặt hồ Linh Chiểu.',
            'Hình Tượng Rồng Thời Lý: Đường nét uốn lượn mềm mại mang dấu ấn văn minh lúa nước.',
            'Hào Khí Đông A: Tinh thần đoàn kết trên dưới một lòng của vương triều và nhân dân.',
          ],
        },
      },
      {
        layout: 'quote',
        tone: 'theme',
        content: {
          kicker: 'Tư liệu lịch sử',
          quote: 'Nước Đại Việt ta từ trước vốn xưng nền văn hiến đã lâu, núi sông bờ cõi đã chia.',
          author: 'Nguyễn Trãi • Bình Ngô Đại Cáo',
        },
      },
      {
        layout: 'closing',
        tone: 'soft',
        content: {
          title: 'Di Sản Tiếp Nối Ngàn Năm',
          subtitle: 'Đọc thêm tư liệu Chiếu dời đô và chuẩn bị câu hỏi thảo luận về Hội nghị Diên Hồng.',
        },
      },
    ],
  },
  {
    id: 'phong-thi-nghiem',
    name: 'Phòng Thí Nghiệm',
    description: 'Nền trắng xanh kỹ thuật với tiêu đề monospace rõ ràng cho hoá học, sinh học và thực hành.',
    themeId: 'phong-thi-nghiem',
    decorKit: 'hinh-hoc',
    stylePack: 'consulting',
    slides: [
      {
        layout: 'title',
        tone: 'accent',
        content: {
          kicker: 'Hoá Học Thực Hành • Module 02',
          title: 'Xác Định Độ pH Của Dung Dịch Bằng Chất Chỉ Thị',
          subtitle: 'Quy trình chuẩn bị mẫu, đo màu chuẩn xác và ghi nhận sai số thí nghiệm.',
        },
      },
      {
        layout: 'table',
        tone: 'soft',
        content: {
          kicker: 'Thang đo chuẩn',
          title: 'Phân Loại Môi Trường Theo Giá Trị pH (25 °C)',
          rows: [
            ['Khoảng pH', 'Môi trường', 'Quỳ tím', 'Phenolphthalein'],
            ['pH < 7.0', 'Axit (Acid)', 'Hoá đỏ', 'Không màu'],
            ['pH = 7.0', 'Trung tính', 'Không đổi màu', 'Không màu'],
            ['pH > 7.0', 'Bazơ (Base)', 'Hoá xanh', 'Hoá hồng'],
          ],
        },
      },
      {
        layout: 'bullets',
        tone: 'theme',
        content: {
          kicker: 'Quy trình thao tác',
          title: 'Bốn Bước Đo Mẫu Chuẩn Trong Phòng Lab',
          bullets: [
            '1. Dán nhãn ống nghiệm: Ghi rõ ký hiệu mẫu A, B, C, D bằng bút chuyên dụng trước khi rót dung dịch.',
            '2. Lấy mẫu thể tích đều: Dùng ống nhỏ giọt riêng cho từng dung dịch để tránh nhiễm chéo.',
            '3. Nhỏ chất chỉ thị & đối chiếu: So màu ngay trên nền giấy trắng dưới ánh sáng tự nhiên ổn định.',
            '4. Ghi biên bản số liệu: Ghi cả giá trị đo được và nhận xét môi trường tương ứng vào bảng kết quả.',
          ],
        },
      },
      {
        layout: 'comparison',
        tone: 'soft',
        content: {
          kicker: 'An toàn phòng lab',
          title: 'Trang Bị Bảo Hộ & Xử Lý Sự Cố',
          leftTitle: 'Bắt buộc trước thực hành',
          left: [
            'Đeo kính bảo hộ và mặc áo blouse kín nút.',
            'Buộc gọn tóc, không nếm hay ngửi hoá chất.',
          ],
          rightTitle: 'Khi hoá chất bắn vào tay',
          right: [
            'Rửa dưới vòi nước sạch chảy ít nhất 10 phút.',
            'Báo ngay cho giáo viên phụ trách phòng.',
          ],
        },
      },
      {
        layout: 'stats',
        tone: 'theme',
        content: {
          kicker: 'Thông số kiểm chuẩn',
          title: 'Điều Kiện Chuẩn Của Phép Đo',
          stats: [
            { value: '25 °C', label: 'Nhiệt độ phòng tiêu chuẩn khi hiệu chuẩn máy đo pH' },
            { value: '±0.1', label: 'Sai số cho phép khi dùng cảm biến đo điện thế' },
            { value: '3 lần', label: 'Số lần lặp lại phép đo với mỗi mẫu dung dịch' },
          ],
        },
      },
      {
        layout: 'closing',
        tone: 'soft',
        content: {
          title: 'Hoàn Tất Báo Cáo Thí Nghiệm',
          subtitle: 'Thu dọn dụng cụ, rửa sạch ống nghiệm và nộp bảng số liệu theo nhóm.',
        },
      },
    ],
  },
  {
    id: 'bac-au-toi-gian',
    name: 'Bắc Âu Tối Giản',
    description: 'Nền xám tuyết tinh gọn với xanh slate và nhấn rỉ sét hiện đại cho thuyết trình chuyên đề.',
    themeId: 'bac-au-toi-gian',
    decorKit: 'toi-gian',
    stylePack: 'editorial',
    slides: [
      {
        layout: 'title',
        tone: 'accent',
        content: {
          kicker: 'Kỹ Năng Học Tập • Chuyên Đề Phương Pháp',
          title: 'Thiết Kế Bài Thuyết Trình Rõ Ý Và Ít Nhiễu',
          subtitle: 'Giảm tải chữ trên trang chiếu để người nghe tập trung vào thông điệp cốt lõi.',
        },
      },
      {
        layout: 'bullets',
        tone: 'soft',
        content: {
          kicker: 'Ba nguyên tắc cốt lõi',
          title: 'Cấu Trúc Một Trang Chiếu Đạt Chuẩn',
          subtitle: 'Khoảng trống giúp mắt nghỉ và dẫn hướng sự chú ý tự nhiên.',
          bullets: [
            'Một slide, một thông điệp: Tách các ý lớn thành trang riêng thay vì dồn nhiều đoạn văn lên cùng khung.',
            'Tiêu đề nói lên kết luận: Viết tiêu đề tóm tắt điều rút ra, không chỉ đặt tên chung chung.',
            'Ưu tiên tương phản và căn lề: Giữ tối đa hai họ chữ và thống nhất trục căn lề trái xuyên suốt bài.',
          ],
        },
      },
      {
        layout: 'comparison',
        tone: 'theme',
        content: {
          kicker: 'Trước và sau khi chỉnh',
          title: 'Biến Đoạn Văn Dài Thành Điểm Nhấn Trực Quan',
          leftTitle: 'Cách trình bày cũ',
          left: [
            'Sao chép nguyên 12 dòng từ báo cáo.',
            'Người nghe vừa đọc vừa mất tập trung.',
          ],
          rightTitle: 'Cách trình bày tối giản',
          right: [
            'Chọn 3 cụm từ khoá kèm một số liệu đối chứng.',
            'Phần diễn giải để người nói trình bày trực tiếp.',
          ],
        },
      },
      {
        layout: 'stats',
        tone: 'soft',
        content: {
          kicker: 'Quy ước đọc nhanh',
          title: 'Con Số Tham Khảo Khi Soạn Bài',
          stats: [
            { value: '≤ 35', label: 'Số từ tối đa khuyên dùng trên một trang nội dung chuẩn' },
            { value: '≥ 25%', label: 'Tỷ lệ khoảng trắng giữ bố cục thoáng và dễ quét mắt' },
            { value: '3 giây', label: 'Thời gian người xem nắm được ý chính của slide' },
          ],
        },
      },
      {
        layout: 'quote',
        tone: 'theme',
        content: {
          kicker: 'Góc nhìn thiết kế',
          quote: 'Sự đơn giản là loại bỏ những chi tiết thừa để phần quan trọng nhất được cất tiếng.',
          author: 'Nguyên tắc Thiết kế Bắc Âu',
        },
      },
      {
        layout: 'closing',
        tone: 'soft',
        content: {
          title: 'Ít Hơn Để Rõ Hơn',
          subtitle: 'Rà soát lại bài thuyết trình nhóm và rút gọn mỗi trang xuống dưới 35 từ.',
        },
      },
    ],
  },
  {
    id: 'hoa-si-mau-nuoc',
    name: 'Hoạ Sĩ Màu Nước',
    description: 'Giấy vẽ màu kem nhẹ với sắc tím oải hương và đất nung nghệ thuật cho văn học, mỹ thuật.',
    themeId: 'hoa-si-mau-nuoc',
    decorKit: 'hoa-diu',
    stylePack: 'editorial',
    slides: [
      {
        layout: 'title',
        tone: 'accent',
        content: {
          kicker: 'Mỹ Thuật & Cảm Thụ • Chuyên Đề Sáng Tác',
          title: 'Hòa Sắc Màu Nước Và Cảm Xúc Không Gian',
          subtitle: 'Khám phá kỹ thuật loang màu ướt trên ướt và cách phối gam màu tương đồng.',
        },
      },
      {
        layout: 'cards',
        tone: 'soft',
        content: {
          kicker: 'Kỹ thuật nền tảng',
          title: 'Ba Cách Đi Bút Cơ Bản Trong Màu Nước',
          items: [
            'Ướt Trên Ướt (Wet-on-Wet): Phết nước sạch lên giấy trước để mảng màu tự loang mềm êm.',
            'Ướt Trên Khô (Wet-on-Dry): Vẽ màu lên nền giấy khô để tạo đường viền sắc nét rõ chi tiết.',
            'Chồng Lớp (Glazing): Đợi lớp màu trước khô hẳn rồi phủ lớp màu trong suốt tăng chiều sâu.',
          ],
        },
      },
      {
        layout: 'comparison',
        tone: 'theme',
        content: {
          kicker: 'Bảng phối màu',
          title: 'Cân Bằng Gam Lạnh Và Gam Ấm',
          leftTitle: 'Gam tím – lam làm nền tĩnh',
          left: [
            'Pha loãng tím oải hương và xanh lam nhạt.',
            'Tạo cảm giác khoảng lùi xa cho bầu trời.',
          ],
          rightTitle: 'Gam đất nung làm điểm tụ',
          right: [
            'Đặt nét cam đất vào khu vực trung tâm.',
            'Giúp bức tranh có điểm nhấn ấm áp.',
          ],
        },
      },
      {
        layout: 'quote',
        tone: 'soft',
        content: {
          kicker: 'Cảm hứng sáng tác',
          quote: 'Màu sắc là phím đàn, đôi mắt là chiếc búa, còn tâm hồn là cây dương cầm với muôn dây rung.',
          author: 'Wassily Kandinsky',
        },
      },
      {
        layout: 'bullets',
        tone: 'theme',
        content: {
          kicker: 'Chuẩn bị hoạ cụ',
          title: 'Gợi Ý Chọn Giấy Và Cọ Cho Người Mới',
          bullets: [
            'Giấy định lượng ≥ 300 gsm: Bề mặt giấy dày giúp thấm nước tốt và không bị cong vênh.',
            'Hai bình nước rửa cọ riêng: Một bình rửa màu bẩn, bình còn lại giữ nước trong pha loang nền.',
            'Khăn giấy thấm điều tiết nước: Chạm nhẹ đầu cọ vào khăn trước khi đặt nét để kiểm soát độ ẩm.',
          ],
        },
      },
      {
        layout: 'closing',
        tone: 'soft',
        content: {
          title: 'Chúc Các Bạn Hoàn Thành Bức Tranh Đẹp',
          subtitle: 'Trưng bày bài vẽ lên bảng xưởng sau 30 phút thực hành và cùng nhận xét chéo.',
        },
      },
    ],
  },
  {
    id: 'vu-tru',
    name: 'Vũ Trụ Đêm',
    description: 'Nền tối sâu thăm thẳm với sắc tím thiên hà và xanh cực quang nổi bật cho thiên văn, công nghệ.',
    themeId: 'vu-tru',
    decorKit: 'lap-lanh',
    stylePack: 'keynote',
    slides: [
      {
        layout: 'title',
        tone: 'accent',
        content: {
          kicker: 'Thiên Văn Học • Hành Trình Khám Phá',
          title: 'Hệ Mặt Trời Và Những Hành Tinh Đá Khí',
          subtitle: 'Quan sát cấu trúc, quỹ đạo và đặc điểm khí quyển của tám hành tinh quay quanh Mặt Trời.',
        },
      },
      {
        layout: 'stats',
        tone: 'soft',
        content: {
          kicker: 'Quy mô thiên hà',
          title: 'Những Con Số Khó Hình Dung Trong Vũ Trụ',
          stats: [
            { value: '150 triệu km', label: 'Khoảng cách trung bình từ Trái Đất tới Mặt Trời (1 AU)' },
            { value: '8 phút 20 giây', label: 'Thời gian ánh sáng Mặt Trời truyền tới bề mặt Trái Đất' },
            { value: '8 hành tinh', label: 'Gồm 4 hành tinh đất đá vòng trong và 4 hành tinh khí khổng lồ' },
          ],
        },
      },
      {
        layout: 'cards',
        tone: 'theme',
        content: {
          kicker: 'Điểm dừng nổi bật',
          title: 'Ba Hành Tinh Đáng Chú Ý Trong Hệ Mặt Trời',
          items: [
            'Sao Hoả (Mars): Bề mặt giàu oxit sắt đỏ cam, có núi lửa lớn nhất và chỏm băng hai cực.',
            'Sao Mộc (Jupiter): Hành tinh lớn nhất với Vết Đỏ Lớn là cơn bão tồn tại hàng thế kỷ.',
            'Sao Thổ (Saturn): Nổi tiếng với hệ thống vành đai gồm hàng tỷ mảnh băng và đá vũ trụ.',
          ],
        },
      },
      {
        layout: 'comparison',
        tone: 'soft',
        content: {
          kicker: 'Phân loại cấu trúc',
          title: 'Hành Tinh Đất Đá Và Hành Tinh Khí Khổng Lồ',
          leftTitle: 'Bốn hành tinh vòng trong',
          left: [
            'Sao Thuỷ, Sao Kim, Trái Đất, Sao Hoả.',
            'Bề mặt rắn chắc, kích thước nhỏ.',
            'Ít hoặc không có vệ tinh tự nhiên.',
          ],
          rightTitle: 'Bốn hành tinh vòng ngoài',
          right: [
            'Sao Mộc, Sao Thổ, Thiên Vương, Hải Vương.',
            'Cấu tạo chủ yếu từ khí và băng.',
            'Sở hữu nhiều mặt trăng và vành đai.',
          ],
        },
      },
      {
        layout: 'table',
        tone: 'theme',
        content: {
          kicker: 'Đối chiếu quỹ đạo',
          title: 'Chu Kỳ Tự Quay Và Quay Quanh Mặt Trời',
          rows: [
            ['Hành tinh', 'Khoảng cách (AU)', 'Chu kỳ năm', 'Số vệ tinh lớn'],
            ['Trái Đất', '1.00 AU', '365.25 ngày', '1 (Mặt Trăng)'],
            ['Sao Hoả', '1.52 AU', '687 ngày', '2 (Phobos, Deimos)'],
            ['Sao Mộc', '5.20 AU', '11.86 năm', '95+ vệ tinh'],
          ],
        },
      },
      {
        layout: 'closing',
        tone: 'soft',
        content: {
          title: 'Ngước Nhìn Bầu Trời Đêm',
          subtitle: 'Thực hành định vị chòm sao Bắc Đẩu bằng bản đồ sao vào cuối tuần này.',
        },
      },
    ],
  },
  {
    id: 'rung-dem',
    name: 'Rừng Đêm',
    description: 'Nền xanh rừng thẳm tĩnh lặng với sắc lá sáng và vàng rêu ấm áp cho sinh thái, văn hoá.',
    themeId: 'rung-dem',
    decorKit: 'la-xanh',
    stylePack: 'keynote',
    slides: [
      {
        layout: 'title',
        tone: 'accent',
        content: {
          kicker: 'Sinh Thái Học • Rừng Nhiệt Đới',
          title: 'Đa Dạng Sinh Học Trong Rừng Mưa Nhiệt Đới',
          subtitle: 'Tìm hiểu cấu trúc tầng tán và mối quan hệ cộng sinh kỳ diệu giữa các loài.',
        },
      },
      {
        layout: 'bullets',
        tone: 'soft',
        content: {
          kicker: 'Cấu trúc không gian',
          title: 'Bốn Tầng Tán Của Rừng Nhiệt Đới',
          subtitle: 'Mỗi tầng ánh sáng nuôi dưỡng một quần xã sinh vật chuyên biệt.',
          bullets: [
            'Tầng vượt tán (35–50 m): Những cây cổ thụ đón trọn ánh nắng trực tiếp và gió mạnh trên đỉnh rừng.',
            'Tầng tán chính (20–35 m): Tạo mái che xanh khổng lồ, nơi cư ngụ của chim, linh trưởng và thực vật bì sinh.',
            'Tầng dưới tán (5–15 m): Cây bụi chịu bóng, dương xỉ lớn phát triển mạnh trong độ ẩm cao.',
            'Tầng thảm mục: Nấm, rêu và vi sinh vật phân giải lá rụng, trả lại dinh dưỡng cho đất rừng.',
          ],
        },
      },
      {
        layout: 'cards',
        tone: 'theme',
        content: {
          kicker: 'Cân bằng tự nhiên',
          title: 'Ba Vai Trò Không Thể Thay Thế Của Rừng',
          items: [
            'Bể Chứa Carbon: Hấp thụ hàng tỷ tấn CO₂ mỗi năm, điều hoà nhiệt độ toàn cầu.',
            'Giữ Nước & Chống Xói Mòn: Bộ rễ cây giữ chặt đất dốc và bổ sung mạch nước ngầm mùa khô.',
            'Ngân Hàng Dược Liệu: Lưu giữ nguồn gen phong phú phục vụ nghiên cứu y học và nông nghiệp.',
          ],
        },
      },
      {
        layout: 'comparison',
        tone: 'soft',
        content: {
          kicker: 'Hoạt động về đêm',
          title: 'Sự Sống Thức Giấc Khi Mặt Trời Lặn',
          leftTitle: 'Thực vật & Nấm phát sáng',
          left: [
            'Độ ẩm ban đêm tăng cao sau mưa.',
            'Một số loài nấm phát quang nhẹ thu hút côn trùng.',
          ],
          rightTitle: 'Động vật kiếm ăn đêm',
          right: [
            'Cú rừng, cầy hương dựa vào thính giác nhạy.',
            'Ếch cây hoạt động mạnh quanh các suối nhỏ.',
          ],
        },
      },
      {
        layout: 'quote',
        tone: 'theme',
        content: {
          kicker: 'Thông điệp bảo tồn',
          quote: 'Rừng không chỉ là tập hợp những thân cây, mà là một mạng lưới sự sống nương tựa vào nhau.',
          author: 'Tài liệu Sinh thái học Rừng',
        },
      },
      {
        layout: 'closing',
        tone: 'soft',
        content: {
          title: 'Chung Tay Giữ Màu Xanh Đại Ngàn',
          subtitle: 'Tìm hiểu một vườn quốc gia gần nơi em sinh sống và chia sẻ vào tiết sinh hoạt tới.',
        },
      },
    ],
  },
  {
    id: 'bac-ha',
    name: 'Bạc Hà Xanh Mát',
    description: 'Nền trắng ngà ánh lục bạc hà, điểm nhấn xanh lá đậm thanh lọc, tươi mới cho Sinh học và KHTN.',
    themeId: 'bac-ha',
    decorKit: 'la-xanh',
    stylePack: 'bento',
    slides: [
      {
        layout: 'title',
        tone: 'accent',
        content: {
          kicker: 'Sinh Học Lớp 10 • Chương III',
          title: 'Quang Hợp & Sự Sống Trên Hành Tinh Xanh',
          subtitle: 'Khám phá cơ chế hấp thu năng lượng ánh sáng và chuyển hoá carbon kỳ diệu của lục lạp.',
        },
      },
      {
        layout: 'bullets',
        tone: 'soft',
        content: {
          kicker: 'Vai trò sinh thái',
          title: 'Tại Sao Cây Xanh Là Lá Phổi Của Trái Đất?',
          subtitle: 'Ba đóng góp then chốt của thực vật quang hợp đối với khí quyển toàn cầu.',
          bullets: [
            'Cung cấp oxy tinh khiết: Giải phóng hàng tỷ tấn khí oxy nuôi dưỡng mọi sinh vật hiếu khí.',
            'Cân bằng khí hậu: Hấp thụ CO₂ trong khí quyển, giảm thiểu đáng kể hiệu ứng nhà kính.',
            'Nguồn năng lượng sơ cấp: Chuyển năng lượng mặt trời thành chất hữu cơ nuôi sống chuỗi thức ăn.',
          ],
        },
      },
      {
        layout: 'cards',
        tone: 'theme',
        content: {
          kicker: 'Cơ chế sinh học',
          title: 'Hai Pha Phản Ứng Trong Lục Lạp',
          items: [
            'Pha Sáng Thylakoid: Hấp thụ photon ánh sáng qua chlorophyll, quang phân ly nước và tổng hợp ATP, NADPH.',
            'Chu Trình Calvin: Diễn ra trong chất nền stroma, cố định phân tử CO₂ để tổng hợp đường glucose.',
            'Sản Phẩm Đầu Ra: Glucose tích luỹ thành tinh bột, đồng thời giải phóng khí oxy ra ngoài khí khổng.',
          ],
        },
      },
      {
        layout: 'comparison',
        tone: 'soft',
        content: {
          kicker: 'Thích nghi tiến hoá',
          title: 'So Sánh Quang Hợp Thực Vật C3 & C4',
          leftTitle: 'Nhóm thực vật C3',
          left: [
            'Phổ biến ở vùng khí hậu ôn hoà và nhiệt đới ẩm.',
            'Cố định CO₂ trực tiếp bằng enzyme Rubisco.',
            'Điểm bão hoà ánh sáng và nhiệt độ ở mức trung bình.',
          ],
          rightTitle: 'Nhóm thực vật C4',
          right: [
            'Thích nghi vùng nhiệt đới nắng gắt và khô hạn.',
            'Cố định CO₂ hai lần qua tế bào bao bó mạch.',
            'Năng suất quang hợp cao và tiết kiệm nước vượt trội.',
          ],
        },
      },
      {
        layout: 'stats',
        tone: 'theme',
        content: {
          kicker: 'Năng suất sinh học',
          title: 'Hiệu Quả Sinh Khối Rừng Tự Nhiên',
          stats: [
            { value: '90%', label: 'Sinh khối hữu cơ trên Trái Đất tạo ra từ thực vật' },
            { value: '120 tấn/ha', label: 'Lượng sinh khối rừng nhiệt đới cố định hằng năm' },
            { value: '2.500 tỷ', label: 'Cây xanh đang tích cực quang hợp trên hành tinh' },
          ],
        },
      },
      {
        layout: 'closing',
        tone: 'soft',
        content: {
          title: 'Bảo Vệ Mầm Xanh Tương Lai',
          subtitle: 'Mỗi mầm cây trồng xuống hôm nay là một lá chắn xanh bảo vệ sự sống mai sau.',
        },
      },
    ],
  },
  {
    id: 'hong-dao',
    name: 'Hồng Đào Dịu Êm',
    description: 'Nền kem đào êm ái, sắc san hô và đỏ ấm nồng nàn, cảm xúc cho Ngữ văn và Kỹ năng sống.',
    themeId: 'hong-dao',
    decorKit: 'hoa-diu',
    stylePack: 'editorial',
    slides: [
      {
        layout: 'title',
        tone: 'accent',
        content: {
          kicker: 'Kỹ Năng Sống • Chuyên Đề 4',
          title: 'Nghệ Thuật Lắng Nghe & Thấu Cảm',
          subtitle: 'Kết nối trái tim bằng sự hiện diện chân thành, ánh mắt tin cậy và lời nói ấm áp.',
        },
      },
      {
        layout: 'bullets',
        tone: 'soft',
        content: {
          kicker: 'Ba cấp độ lắng nghe',
          title: 'Học Cách Lắng Nghe Trọn Vẹn',
          subtitle: 'Từ việc nghe để đối đáp đến sự thấu cảm chiều sâu cảm xúc của người khác.',
          bullets: [
            'Nghe bề mặt: Chỉ ghi nhận âm thanh mà không đặt tâm trí vào câu chuyện đang diễn ra.',
            'Nghe tập trung: Nắm bắt thông tin, ghi nhớ ý chính để chuẩn bị phản hồi hợp lý.',
            'Nghe thấu cảm: Cảm nhận niềm vui, nỗi lo âu phía sau từng lời chia sẻ của người đối diện.',
          ],
        },
      },
      {
        layout: 'cards',
        tone: 'theme',
        content: {
          kicker: 'Chìa khoá kết nối',
          title: 'Bốn Bước Giao Tiếp Thấu Cảm',
          items: [
            'Hiện Diện Trọn Vẹn: Gác lại điện thoại, hướng ánh mắt chân thành và gật đầu khích lệ.',
            'Không Phán Xét Vội Vã: Tôn trọng góc nhìn riêng của bạn bè trước khi đưa ra nhận định.',
            'Đặt Câu Hỏi Mở: Khơi gợi chia sẻ sâu hơn bằng câu hỏi dịu dàng và mang tính nâng đỡ.',
          ],
        },
      },
      {
        layout: 'comparison',
        tone: 'soft',
        content: {
          kicker: 'Thực hành hội thoại',
          title: 'Lời Phê Bình Hay Sự Khích Lệ?',
          leftTitle: 'Phản ứng tiêu cực',
          left: [
            'Ngắt lời khi người khác chưa nói xong ý.',
            'Áp đặt quan điểm cá nhân một cách cứng nhắc.',
            'Tập trung vào lỗi sai thay vì sự cố gắng.',
          ],
          rightTitle: 'Ứng xử thấu cảm',
          right: [
            'Chờ đợi trong kiên nhẫn và đồng cảm.',
            'Xác nhận cảm xúc của bạn trước khi góp ý.',
            'Đồng hành tìm giải pháp cùng tiến bộ.',
          ],
        },
      },
      {
        layout: 'quote',
        tone: 'theme',
        content: {
          kicker: 'Thông điệp yêu thương',
          quote: 'Lắng nghe chân thành là món quà vô giá và dịu dàng nhất mà một người có thể trao tặng cho người khác.',
          author: 'Tâm lý học Ứng dụng',
        },
      },
      {
        layout: 'closing',
        tone: 'soft',
        content: {
          title: 'Mở Rộng Trái Tim Lắng Nghe',
          subtitle: 'Hãy dành 10 phút tối nay để lắng nghe câu chuyện của một người thân yêu quanh bạn.',
        },
      },
    ],
  },
  {
    id: 'oai-huong',
    name: 'Oải Hương Tím Nhạt',
    description: 'Sắc tím oải hương mơ màng, tím than thanh lịch và thi vị, phù hợp cho Âm nhạc, Mĩ thuật và Thơ ca.',
    themeId: 'oai-huong',
    decorKit: 'hoa-diu',
    stylePack: 'editorial',
    slides: [
      {
        layout: 'title',
        tone: 'accent',
        content: {
          kicker: 'Âm Nhạc & Mĩ Thuật • Lớp 8',
          title: 'Giai Điệu Cổ Điển & Sắc Màu Hội Hoạ',
          subtitle: 'Sự giao thoa diệu kỳ giữa tiết tấu âm thanh và ngôn ngữ đường nét trong không gian nghệ thuật.',
        },
      },
      {
        layout: 'bullets',
        tone: 'soft',
        content: {
          kicker: 'Nguyên lý đồng điệu',
          title: 'Khi Âm Thanh Chuyển Hoá Thành Màu Sắc',
          subtitle: 'Mỗi nốt nhạc ngân vang gợi lên một sắc thái thị giác phong phú trong tâm trí người thưởng thức.',
          bullets: [
            'Cao độ và sắc độ: Nốt cao mang ánh sáng trong trẻo, nốt trầm mang sắc màu đậm sâu bí ẩn.',
            'Tiết tấu và nhịp điệu: Tiết tấu dồn dập tạo nên những đường nét góc cạnh, tiết tấu êm dịu tạo đường cong uốn lượn.',
            'Chất cảm hoà âm: Sự phức hợp của dàn nhạc giao hưởng tạo nên các tầng lớp màu sắc đa tầng.',
          ],
        },
      },
      {
        layout: 'cards',
        tone: 'theme',
        content: {
          kicker: 'Tác gia tiêu biểu',
          title: 'Ba Bậc Thầy Sáng Tạo Cảm Xúc',
          items: [
            'Claude Debussy: Khắc hoạ ánh sáng biển cả và trăng đêm qua âm sắc piano trường phái ấn tượng.',
            'Vincent van Gogh: Đưa giai điệu xoáy cuộn mãnh liệt vào bầu trời đêm đầy sao và cánh đồng hoa.',
            'Frédéric Chopin: Gửi gắm chất thơ lãng mạn vào từng khúc dạ khúc nocturne êm dịu.',
          ],
        },
      },
      {
        layout: 'comparison',
        tone: 'soft',
        content: {
          kicker: 'Trường phái nghệ thuật',
          title: 'Cổ Điển Mực Thước & Ấn Tượng Tự Do',
          leftTitle: 'Chủ nghĩa cổ điển',
          left: [
            'Bố cục cân đối, tuân thủ tỉ lệ vàng chặt chẽ.',
            'Hoà âm chuẩn mực và giai điệu rõ ràng.',
            'Đề cao lý tính và vẻ đẹp hoàn mỹ khách quan.',
          ],
          rightTitle: 'Chủ nghĩa ấn tượng',
          right: [
            'Bắt trọn khoảnh khắc ánh sáng và cảm xúc tức thời.',
            'Màu sắc biến ảo, không viền ranh giới cứng nhắc.',
            'Khơi gợi trực giác và trí tưởng tượng bay bổng.',
          ],
        },
      },
      {
        layout: 'quote',
        tone: 'theme',
        content: {
          kicker: 'Cảm hứng sáng tạo',
          quote: 'Màu sắc là phím đàn, đôi mắt là búa gõ, tâm hồn là cây đàn dương cầm muôn điệu rung lên theo từng xúc cảm.',
          author: 'Wassily Kandinsky',
        },
      },
      {
        layout: 'closing',
        tone: 'soft',
        content: {
          title: 'Nuôi Dưỡng Tâm Hồn Yêu Nghệ Thuật',
          subtitle: 'Hãy thả mình vào một bản nhạc giao hưởng êm dịu khi vẽ bức tranh tuần này của em.',
        },
      },
    ],
  },
  {
    id: 'cat-vang',
    name: 'Cát Vàng Sa Mạc',
    description: 'Sắc be cát sa mạc mộc mạc, điểm nhấn nâu đất và xanh ô liu bền vững cho Địa lí, Du lịch và Lịch sử.',
    themeId: 'cat-vang',
    decorKit: 'toi-gian',
    stylePack: 'consulting',
    slides: [
      {
        layout: 'title',
        tone: 'accent',
        content: {
          kicker: 'Địa Lý Tự Nhiên • Thế Giới',
          title: 'Cảnh Quan Sa Mạc & Sự Thích Nghi Sinh Học',
          subtitle: 'Khám phá những vùng đất khô hạn nhất hành tinh và sức sống phi thường của sinh quyển.',
        },
      },
      {
        layout: 'bullets',
        tone: 'soft',
        content: {
          kicker: 'Đặc trưng địa lý',
          title: 'Quy Luật Tự Nhiên Của Vùng Đất Cát',
          subtitle: 'Ba yếu tố khí hậu định hình nên địa mạo và đời sống tại các hoang mạc lớn.',
          bullets: [
            'Biên độ nhiệt khắc nghiệt: Ban ngày nắng nóng gay gắt trên 45°C, ban đêm nhiệt độ hạ sâu.',
            'Quá trình phong hoá gió: Gió thổi tạo nên những cồn cát di động và hẻm núi sa thạch kỳ vĩ.',
            'Mạch nước ngầm hiếm hoi: O-a-xit xanh tươi là chiếc nôi nuôi dưỡng các nền văn minh sa mạc cổ đại.',
          ],
        },
      },
      {
        layout: 'cards',
        tone: 'theme',
        content: {
          kicker: 'Địa danh nổi tiếng',
          title: 'Ba Miền Sa Mạc Tiêu Biểu',
          items: [
            'Sa Mạc Sahara: Vùng hoang mạc nhiệt đới rộng lớn nhất thế giới trải dài qua Bắc Phi.',
            'Hoang Mạc Atacama: Nơi khô cằn nhất Trái Đất, nơi lý tưởng để đặt các kính thiên văn vũ trụ.',
            'Đồi Cát Bàu Trắng: Thắng cảnh cát trắng thoai thoải uốn lượn bên hồ sen mát lành tại Việt Nam.',
          ],
        },
      },
      {
        layout: 'comparison',
        tone: 'soft',
        content: {
          kicker: 'Chiến lược sinh tồn',
          title: 'Sự Thích Nghi Của Thực Vật & Động Vật',
          leftTitle: 'Thực vật chịu hạn',
          left: [
            'Lá biến thành gai nhọn để giảm thiểu thoát hơi nước.',
            'Thân mọng nước trữ nước qua nhiều tháng khô cằn.',
            'Rễ cọc đâm sâu chục mét tìm nguồn nước ngầm.',
          ],
          rightTitle: 'Động vật sa mạc',
          right: [
            'Hoạt động kiếm ăn vào ban đêm khi trời mát mẻ.',
            'Thận thích nghi cao, bảo tồn tối đa lượng nước cơ thể.',
            'Bộ lông sáng màu phản xạ bức xạ nhiệt mặt trời.',
          ],
        },
      },
      {
        layout: 'stats',
        tone: 'theme',
        content: {
          kicker: 'Số liệu sinh thái',
          title: 'Quy Mô Hoang Mạc Trên Địa Cầu',
          stats: [
            { value: '33%', label: 'Diện tích bề mặt lục địa là sa mạc và bán sa mạc' },
            { value: '50°C', label: 'Biên độ nhiệt chênh lệch giữa ngày và đêm tại Sahara' },
            { value: '< 250 mm', label: 'Lượng mưa trung bình hằng năm ở các vùng hoang mạc' },
          ],
        },
      },
      {
        layout: 'closing',
        tone: 'soft',
        content: {
          title: 'Hành Động Chống Sa Mạc Hoá',
          subtitle: 'Trồng cây gây rừng chắn cát là sứ mệnh bảo vệ đất đai cho các thế hệ tương lai.',
        },
      },
    ],
  },
  {
    id: 'chanh-tuoi',
    name: 'Chanh Tươi Sôi Nổi',
    description: 'Nền vàng chanh ánh trắng tươi mát, xanh lá sinh động, kích thích sự hứng khởi cho Tiểu học và Trò chơi.',
    themeId: 'chanh-tuoi',
    decorKit: 'lap-lanh',
    stylePack: 'classroom',
    slides: [
      {
        layout: 'title',
        tone: 'accent',
        content: {
          kicker: 'Toán Vui Lớp 3 • Tuần 15',
          title: 'Vương Quốc Số Học & Những Phép Tính Vui',
          subtitle: 'Cùng tham gia hành trình giải đố thông minh để chinh phục kho báu tri thức toán học.',
        },
      },
      {
        layout: 'bullets',
        tone: 'soft',
        content: {
          kicker: 'Luật chơi lớp học',
          title: 'Ba Quy Tắc Vàng Của Cuộc Thi',
          subtitle: 'Học mà chơi, chơi mà học giúp các bạn nhỏ rèn luyện tư duy nhanh nhẹn.',
          bullets: [
            'Quan sát kỹ đề bài: Đọc đề cẩn thận và xác định rõ yêu cầu phép tính cần làm.',
            'Tính nhẩm thông minh: Vận dụng bảng nhân chia và các mẹo tách số nhanh trong 30 giây.',
            'Hợp tác đồng đội: Cùng thảo luận nhóm nhỏ và giơ bảng đáp án thật chuẩn xác.',
          ],
        },
      },
      {
        layout: 'cards',
        tone: 'theme',
        content: {
          kicker: 'Các trạm thử thách',
          title: 'Ba Trạm Khám Phá Hấp Dẫn',
          items: [
            'Trạm 1: Khởi Động Nhân Chia: Ôn tập bảng cửu chương và giải cứu những chú sâu tinh nghịch.',
            'Trạm 2: Vượt Chướng Ngại: Ghép các mảnh ghép hình học để tìm ra diện tích khu vườn bí mật.',
            'Trạm 3: Về Đích Thông Thái: Giải câu đố toán đố logic cuối cùng để nhận huy hiệu sao vàng.',
          ],
        },
      },
      {
        layout: 'comparison',
        tone: 'soft',
        content: {
          kicker: 'Bí quyết tính nhẩm',
          title: 'Mẹo Tính Nhanh Hơn Mỗi Ngày',
          leftTitle: 'Cách đếm truyền thống',
          left: [
            'Đếm từng ngón tay mất nhiều thời gian.',
            'Dễ nhầm lẫn khi số lượng vượt quá mười.',
            'Khó thực hiện khi tính nhẩm dãy số dài.',
          ],
          rightTitle: 'Tách gộp số tròn chục',
          right: [
            'Gộp các cặp số có tổng bằng 10 hoặc 100.',
            'Nhân nhẩm với 5 bằng cách nhân 10 rồi chia 2.',
            'Tính nhẩm thần tốc và chính xác tuyệt đối.',
          ],
        },
      },
      {
        layout: 'stats',
        tone: 'theme',
        content: {
          kicker: 'Bảng vàng khen thưởng',
          title: 'Thành Tích Xuất Sắc Cả Lớp',
          stats: [
            { value: '100%', label: 'Học sinh tham gia trả lời đúng câu hỏi trạm 1' },
            { value: '15 câu', label: 'Thử thách toán đố vui được giải mã hoàn toàn' },
            { value: '4 đội', label: 'Cùng đạt danh hiệu Thám Tử Toán Học Thông Thái' },
          ],
        },
      },
      {
        layout: 'closing',
        tone: 'soft',
        content: {
          title: 'Chúc Mừng Các Bạn Nhỏ Xuất Sắc!',
          subtitle: 'Về nhà hãy đố bố mẹ những câu đố toán học vui nhộn hôm nay chúng mình đã học nhé.',
        },
      },
    ],
  },
  {
    id: 'bau-troi',
    name: 'Bầu Trời Xanh Trong',
    description: 'Sắc xanh thiên thanh bao la, cụm mây trắng êm đềm, tạo không gian thoáng đãng cho Khoa học và Vật lí.',
    themeId: 'bau-troi',
    decorKit: 'toi-gian',
    stylePack: 'keynote',
    slides: [
      {
        layout: 'title',
        tone: 'accent',
        content: {
          kicker: 'Vật Lý Khí Quyển • KHTN Lớp 8',
          title: 'Khí Quyển Trái Đất & Hiện Tượng Quang Học',
          subtitle: 'Giải mã màu xanh của vòm trời, ánh hoàng hôn rực rỡ và những dải cầu vồng sau mưa.',
        },
      },
      {
        layout: 'bullets',
        tone: 'soft',
        content: {
          kicker: 'Cấu trúc khí quyển',
          title: 'Các Tầng Không Gian Bao Bọc Địa Cầu',
          subtitle: 'Lớp vỏ khí quyển giữ nhiệt độ ôn hoà và bảo vệ mọi sự sống trước bức xạ vũ trụ.',
          bullets: [
            'Tầng đối lưu (0–12 km): Nơi diễn ra mọi hiện tượng thời tiết mưa, nắng, gió bão và mây trôi.',
            'Tầng bình lưu (12–50 km): Chứa tầng ozone quý giá hấp thụ tia cực tím nguy hại từ Mặt Trời.',
            'Tầng trung lưu & nhiệt quyển: Nơi các thiên thạch bốc cháy và tạo ra hiện tượng cực quang kỳ thú.',
          ],
        },
      },
      {
        layout: 'cards',
        tone: 'theme',
        content: {
          kicker: 'Hiện tượng quang học',
          title: 'Ba Tuyệt Tác Ánh Sáng Trên Trời',
          items: [
            'Tán Xạ Rayleigh: Các phân tử khí tán xạ bước sóng ngắn màu xanh mạnh hơn, tạo màu trời trong xanh.',
            'Khúc Xạ Giọt Nước: Ánh sáng tán sắc qua hàng triệu giọt mưa tạo nên dải cầu vồng 7 màu uốn lượn.',
            'Tán Xạ Hoàng Hôn: Khi Mặt Trời xuống thấp, ánh sáng đi qua tầng khí dày hơn khiến sắc đỏ vàng rực rỡ.',
          ],
        },
      },
      {
        layout: 'comparison',
        tone: 'soft',
        content: {
          kicker: 'Khí tượng học',
          title: 'Nhận Biết Thời Tiết Qua Đám Mây',
          leftTitle: 'Mây tích trời trong (Cumulus)',
          left: [
            'Mây trắng xốp bồng bềnh như bông gòn.',
            'Đáy mây phẳng, xuất hiện vào buổi sáng nắng đẹp.',
            'Báo hiệu thời tiết khô ráo, thuận lợi cho hoạt động ngoài trời.',
          ],
          rightTitle: 'Mây vũ tích dông sét (Cumulonimbus)',
          right: [
            'Cột mây khổng lồ hình đe màu xám đen đặc.',
            'Đỉnh mây vươn cao tới ranh giới tầng bình lưu.',
            'Báo hiệu mưa dông lớn, gió giật mạnh và sấm sét.',
          ],
        },
      },
      {
        layout: 'stats',
        tone: 'theme',
        content: {
          kicker: 'Thông số khí quyển',
          title: 'Các Hằng Số Khí Quyển Tiêu Chuẩn',
          stats: [
            { value: '101.3 kPa', label: 'Áp suất khí quyển tiêu chuẩn ở mực nước biển' },
            { value: '78%', label: 'Tỉ lệ khí Nitơ chiếm ưu thế trong thành phần không khí' },
            { value: '-56°C', label: 'Nhiệt độ thấp nhất ghi nhận tại đỉnh tầng đối lưu' },
          ],
        },
      },
      {
        layout: 'closing',
        tone: 'soft',
        content: {
          title: 'Chung Tay Giữ Bầu Trời Trong Lành',
          subtitle: 'Giảm khí thải carbon là hành động thiết thực gìn giữ màu xanh bao la cho tương lai.',
        },
      },
    ],
  },
  {
    id: 'bao-tuong',
    name: 'Báo Tường Xã Luận',
    description: 'Phong cách báo in truyền thống, tiêu đề có chân đĩnh đạc, viền kép và điểm đỏ cho Lịch sử, GDCD và Sự kiện.',
    themeId: 'bao-tuong',
    decorKit: 'toi-gian',
    stylePack: 'editorial',
    slides: [
      {
        layout: 'title',
        tone: 'accent',
        content: {
          kicker: 'Chuyên Đề Lịch Sử • Số Đặc Biệt',
          title: 'Ký Ức Lịch Sử & Tinh Thần Độc Lập Dân Tộc',
          subtitle: 'Những trang sử vàng chói lọi và bài học về ý chí tự lực, kiên cường bảo vệ non sông.',
        },
      },
      {
        layout: 'bullets',
        tone: 'soft',
        content: {
          kicker: 'Mốc son thời đại',
          title: 'Những Trang Sử Vàng Dân Tộc Khắc Ghi',
          subtitle: 'Ba chặng đường vẻ vang khẳng định chủ quyền và vị thế đất nước trên trường quốc tế.',
          bullets: [
            'Cách mạng Tháng Tám 1945: Khúc ca quật khởi giành chính quyền về tay nhân dân cả nước.',
            'Chiến thắng Điện Biên Phủ 1954: Mốc son lừng lẫy năm châu, chấn động địa cầu mở ra kỷ nguyên mới.',
            'Đại thắng Mùa Xuân 1975: Non sông thu về một mối, đất nước trọn niềm vui thống nhất hoàn toàn.',
          ],
        },
      },
      {
        layout: 'cards',
        tone: 'theme',
        content: {
          kicker: 'Tấm gương tiêu biểu',
          title: 'Ý Chí Kiên Cường Của Thế Hệ Đi Trước',
          items: [
            'Đại Tướng Võ Nguyên Giáp: Người anh cả của Quân đội Nhân dân Việt Nam với tài thao lược kiệt xuất.',
            'Anh Hùng Võ Thị Sáu: Biểu tượng bất khuất của tuổi trẻ kiên trung, dâng hiến trọn đời cho cách mạng.',
            'Lý Tự Trọng: Khắc sâu lời hiệu triệu bất hủ về con đường duy nhất của thanh niên là con đường cách mạng.',
          ],
        },
      },
      {
        layout: 'comparison',
        tone: 'soft',
        content: {
          kicker: 'Góc nhìn sử liệu',
          title: 'So Sánh Văn Kiện Hai Thời Kỳ Lịch Sử',
          leftTitle: 'Bản Tuyên Ngôn Độc Lập 1945',
          left: [
            'Khẳng định quyền con người và quyền dân tộc thiêng liêng.',
            'Tuyên bố xoá bỏ chế độ thực dân phong kiến hàng thế kỷ.',
            'Ý chí sắt đá toàn dân quyết giữ vững nền tự do.',
          ],
          rightTitle: 'Lời Kêu Gọi Toàn Quốc Kháng Chiến',
          right: [
            'Lời thề quyết tử cho Tổ quốc quyết sinh.',
            'Huy động sức mạnh toàn dân kháng chiến toàn diện.',
            'Trường kỳ kháng chiến ắt đi đến ngày toàn thắng.',
          ],
        },
      },
      {
        layout: 'quote',
        tone: 'theme',
        content: {
          kicker: 'Xã luận trang nhất',
          quote: 'Không có gì quý hơn độc lập, tự do. Nước Việt Nam là một, dân tộc Việt Nam là một. Sông có thể cạn, núi có thể mòn, song chân lý ấy không bao giờ thay đổi.',
          author: 'Chủ tịch Hồ Chí Minh',
        },
      },
      {
        layout: 'closing',
        tone: 'soft',
        content: {
          title: 'Viết Tiếp Truyền Thống Yêu Nước Hôm Nay',
          subtitle: 'Mỗi học sinh nỗ lực rèn đức luyện tài chính là đóng góp thiết thực xây dựng quê hương.',
        },
      },
    ],
  },
  {
    id: 'hinh-hoc-mau',
    name: 'Hình Học Bauhaus',
    description: 'Khối tròn, vuông, thoi màu sắc cơ bản tương phản mạnh kiểu Bauhaus, độc đáo cho Hình học và Kiến trúc.',
    themeId: 'hinh-hoc-mau',
    decorKit: 'toi-gian',
    stylePack: 'bold',
    slides: [
      {
        layout: 'title',
        tone: 'accent',
        content: {
          kicker: 'Toán Hình & Mĩ Thuật • Lớp 9',
          title: 'Ngôn Ngữ Hình Khối & Tỉ Lệ Vàng Kiến Trúc',
          subtitle: 'Ứng dụng hình học phẳng vào thiết kế công trình, đồ hoạ hiện đại và thị giác thị dân.',
        },
      },
      {
        layout: 'bullets',
        tone: 'soft',
        content: {
          kicker: 'Nguyên lý tạo hình',
          title: 'Ba Trụ Cột Của Thiết Kế Bauhaus',
          subtitle: 'Trường phái nghệ thuật kết hợp hoàn hảo giữa công năng sử dụng và vẻ đẹp hình khối thuần khiết.',
          bullets: [
            'Công năng định hình hình thể: Loại bỏ các chi tiết rườm rà, tập trung vào cấu trúc sử dụng tối ưu.',
            'Màu sắc cơ bản: Khai thác sức mạnh thị giác của bộ ba màu đỏ, vàng, xanh cobalt nguyên bản.',
            'Đơn vị hình học chuẩn: Xây dựng toàn bộ bố cục từ ba hình thái cơ bản vuông, tròn và tam giác.',
          ],
        },
      },
      {
        layout: 'cards',
        tone: 'theme',
        content: {
          kicker: 'Hình khối cốt lõi',
          title: 'Ý Nghĩa Biểu Trưng Của Hình Khối',
          items: [
            'Hình Vuông Kiên Định: Tượng trưng cho sự trật tự, vững chãi, cân bằng và tính kỷ luật kiến trúc.',
            'Đường Tròn Hoàn Hảo: Biểu thị tính chuyển động liên tục, sự mềm mại và không gian tuần hoàn vô tận.',
            'Tam Giác Chuyển Động: Tạo hướng nhìn năng động, xung lực phát triển và sự bứt phá mạnh mẽ.',
          ],
        },
      },
      {
        layout: 'comparison',
        tone: 'soft',
        content: {
          kicker: 'Đối chiếu phong cách',
          title: 'Kiến Trúc Cổ Điển & Bauhaus Hiện Đại',
          leftTitle: 'Kiến trúc cổ điển',
          left: [
            'Nhiều hoa văn đắp nổi cầu kỳ và trang trí phức tạp.',
            'Cột trụ đồ sộ, chia cắt không gian thành nhiều phòng nhỏ.',
            'Thi công thủ công tốn nhiều thời gian và chi phí.',
          ],
          rightTitle: 'Kiến trúc Bauhaus',
          right: [
            'Mặt đứng phẳng, cửa kính lớn đón trọn ánh sáng tự nhiên.',
            'Không gian mở liên thông, linh hoạt công năng sử dụng.',
            'Ứng dụng vật liệu thép, kính và bê tông đúc sẵn hiện đại.',
          ],
        },
      },
      {
        layout: 'stats',
        tone: 'theme',
        content: {
          kicker: 'Hằng số hình học',
          title: 'Tỉ Lệ Vàng Trong Tự Nhiên & Thiết Kế',
          stats: [
            { value: '1.618', label: 'Hằng số Phi (φ) định hình tỉ lệ vàng chuẩn mực trong nghệ thuật' },
            { value: '90°', label: 'Góc vuông định hình cấu trúc chịu lực và mặt bằng kiến trúc' },
            { value: '360°', label: 'Chu kỳ trọn vẹn của hình tròn và không gian đa chiều' },
          ],
        },
      },
      {
        layout: 'closing',
        tone: 'soft',
        content: {
          title: 'Sáng Tạo Không Giới Hạn Cùng Hình Khối',
          subtitle: 'Hãy thử phác thảo một mẫu logo ứng dụng chỉ từ ba hình khối cơ bản trong tuần này.',
        },
      },
    ],
  },
  {
    id: 'bang-trang',
    name: 'Bảng Trắng Giảng Đường',
    description: 'Mô phỏng mặt bảng trắng hiện đại, nét bút dạ xanh – đỏ sinh động, thân thuộc trong tiết học hằng ngày.',
    themeId: 'bang-trang',
    decorKit: 'toi-gian',
    stylePack: 'classroom',
    slides: [
      {
        layout: 'title',
        tone: 'accent',
        content: {
          kicker: 'Phương Pháp Học Tập • Tiết 5',
          title: 'Sơ Đồ Tư Duy & Kỹ Thuật Ghi Nhớ Nhanh',
          subtitle: 'Tối ưu hoá hiệu suất tiếp thu bài học bằng bút dạ màu sắc và từ khoá trực quan.',
        },
      },
      {
        layout: 'bullets',
        tone: 'soft',
        content: {
          kicker: 'Bốn bước cơ bản',
          title: 'Cách Vẽ Bản Đồ Tư Duy Hiệu Quả',
          subtitle: 'Chuyển đổi những trang sách dày đặc chữ thành bức tranh kiến thức sinh động và dễ nhớ.',
          bullets: [
            'Chủ đề trung tâm: Đặt chủ đề bài học ở chính giữa trang với hình vẽ nổi bật và màu sắc bắt mắt.',
            'Nhánh chính cấp 1: Vẽ các đường cong đậm toả ra các hướng đại diện cho các luận điểm lớn.',
            'Nhánh phụ & từ khoá: Điền các khái niệm chi tiết bằng chữ in hoa ngắn gọn, kèm biểu tượng ghi nhớ.',
          ],
        },
      },
      {
        layout: 'cards',
        tone: 'theme',
        content: {
          kicker: 'Quy ước màu bút dạ',
          title: 'Bộ Ba Bút Dạ Màu Cơ Bản',
          items: [
            'Bút Dạ Xanh Dương: Ghi chép nội dung chính, định nghĩa chuẩn mực và các bước triển khai bài học.',
            'Bút Dạ Đỏ Nổi Bật: Đánh dấu các công thức cốt lõi, lưu ý quan trọng và lỗi sai học sinh hay mắc.',
            'Bút Dạ Quang Vàng: Tô sáng từ khoá then chốt giúp mắt quét thông tin nhanh chóng khi ôn tập.',
          ],
        },
      },
      {
        layout: 'comparison',
        tone: 'soft',
        content: {
          kicker: 'Đánh giá phương pháp',
          title: 'Ghi Chép Truyền Thống Hay Mindmap?',
          leftTitle: 'Ghi chép một màu đều đặn',
          left: [
            'Chữ viết dài kín trang vở, dễ gây buồn ngủ và mỏi mắt.',
            'Khó tìm kiếm ý chính khi cần tra cứu nhanh trước giờ thi.',
            'Chỉ kích hoạt bán cầu não trái xử lý chuỗi ký tự đơn điệu.',
          ],
          rightTitle: 'Sơ đồ tư duy đa màu',
          right: [
            'Trực quan, sinh động với các nhánh màu và hình biểu trưng.',
            'Bao quát toàn bộ cấu trúc bài giảng chỉ trên một mặt giấy.',
            'Kích hoạt cả hai bán cầu não giúp ghi nhớ lâu gấp nhiều lần.',
          ],
        },
      },
      {
        layout: 'stats',
        tone: 'theme',
        content: {
          kicker: 'Nghiên cứu não bộ',
          title: 'Hiệu Quả Tiếp Thu Hình Ảnh Trực Quan',
          stats: [
            { value: '60.000x', label: 'Tốc độ não bộ xử lý hình ảnh nhanh hơn ký tự văn bản đơn thuần' },
            { value: '80%', label: 'Lượng kiến thức được ghi nhớ lâu dài khi học kèm hình ảnh minh hoạ' },
            { value: '20 phút', label: 'Thời gian lý tưởng để hoàn thiện một sơ đồ tư duy ôn tập bài giảng' },
          ],
        },
      },
      {
        layout: 'closing',
        tone: 'soft',
        content: {
          title: 'Bắt Đầu Với Trang Vở Của Em',
          subtitle: 'Hãy mở tập và vẽ ngay một sơ đồ tư duy tóm tắt bài học ngày hôm nay.',
        },
      },
    ],
  },
  {
    id: 'tet-xuan',
    name: 'Tết Xuân Truyền Thống',
    description: 'Sắc đỏ son may mắn, vàng kim ấm áp trên nền kem lễ hội, rộn ràng phong vị Tết Nguyên Đán và mùa xuân.',
    themeId: 'tet-xuan',
    decorKit: 'lap-lanh',
    stylePack: 'editorial',
    slides: [
      {
        layout: 'title',
        tone: 'accent',
        content: {
          kicker: 'Văn Hoá Truyền Thống • Mùa Xuân',
          title: 'Phong Vị Tết Cổ Truyền & Nét Đẹp Văn Hoá Việt',
          subtitle: 'Ý nghĩa phong tục ngày Tết Nguyên Đán, mâm ngũ quả, câu đối đỏ và sự sum vầy gia đình ấm áp.',
        },
      },
      {
        layout: 'bullets',
        tone: 'soft',
        content: {
          kicker: 'Phong tục nghìn năm',
          title: 'Ba Nét Đẹp Ngày Tết Không Thể Phai Mờ',
          subtitle: 'Những giá trị tinh thần thiêng liêng gắn kết các thế hệ người Việt trong dịp Tết sum vầy.',
          bullets: [
            'Bữa cơm tất niên chiều 30: Thời khắc mọi thành viên sum họp quanh mâm cơm, sẻ chia một năm đã qua.',
            'Phong tục chúc Tết & mừng tuổi: Trao nhau những phong bao lì xì đỏ thắm cùng lời chúc vạn sự như ý.',
            'Khai bút đầu xuân & hái lộc: Gửi gắm ước vọng về một năm mới học hành tiến bộ, công danh rộng mở.',
          ],
        },
      },
      {
        layout: 'cards',
        tone: 'theme',
        content: {
          kicker: 'Hương vị mùa xuân',
          title: 'Biểu Tượng Ẩm Thực & Hoa Tết',
          items: [
            'Bánh Chưng & Bánh Tét: Tượng trưng cho đất trời vuông tròn, lòng biết ơn sâu sắc đối với tổ tiên.',
            'Hoa Đào & Hoa Mai: Sắc hồng thắm miền Bắc xua tan giá rét, sắc vàng rực miền Nam đón tài lộc an khang.',
            'Mâm Ngũ Quả Ngày Tết: Ước mong năm mới cầu sung túc, vừa đủ tiêu xài và gia đạo bình an thịnh vượng.',
          ],
        },
      },
      {
        layout: 'comparison',
        tone: 'soft',
        content: {
          kicker: 'Bản sắc vùng miền',
          title: 'Hương Sắc Tết Bắc & Tết Nam',
          leftTitle: 'Tết cổ truyền miền Bắc',
          left: [
            'Tiết trời mưa phùn se lạnh đầu xuân ấm cúng.',
            'Cành đào phai chúm chím và chậu quất trĩu quả vàng.',
            'Mâm cỗ truyền thống canh bóng, giò lụa, nem rán.',
          ],
          rightTitle: 'Tết rực rỡ miền Nam',
          right: [
            'Nắng vàng rực rỡ chan hoà khắp các nẻo đường.',
            'Cành mai vàng bung nở năm cánh kiêu hãnh đón xuân.',
            'Thịt kho tàu nước dừa trứng cút và đĩa dưa giá thanh mát.',
          ],
        },
      },
      {
        layout: 'quote',
        tone: 'theme',
        content: {
          kicker: 'Hơi thở mùa xuân',
          quote: 'Tết là nơi để trở về, là lúc những người con xa xứ tìm về bên bếp lửa gia đình, cảm nhận trọn vẹn tình thân sau bao tháng ngày bôn ba.',
          author: 'Giai phẩm Mùa Xuân',
        },
      },
      {
        layout: 'closing',
        tone: 'soft',
        content: {
          title: 'Kính Chúc Năm Mới An Khang Thịnh Vượng!',
          subtitle: 'Cùng gửi những lời chúc tốt đẹp nhất tới thầy cô giáo, bạn bè và toàn thể gia đình yêu thương.',
        },
      },
    ],
  },
]

export function buildDesignSlides(design: SlideDesign, overrideTheme?: DeckTheme): Slide[] {
  const baseTheme = overrideTheme ?? themeById(design.themeId) ?? DECK_THEMES[0]
  const skin = skinById(design.id)
  const theme = skin ? themeWithSkinFonts(baseTheme, skin) : baseTheme
  const total = design.slides.length

  return design.slides.map((spec, i) => {
    const layoutId = spec.layout
    const tone = spec.tone ?? defaultTone(layoutId)
    const decorKit = design.decorKit
    const content: SlideLayoutContent = {
      ...withPlaceholders(layoutId, {}),
      ...spec.content,
      ...(decorKit ? { decorKit } : {}),
    }
    const elements = composeLayout(theme, layoutId, content, tone)
    const rawSlide: Slide = {
      id: uid(),
      layout: layoutId,
      tone,
      ...(decorKit ? { decorKit } : {}),
      background: toneBackground(theme, tone),
      // giữ id theo vai trò (title, kicker, subtitle…): applySkin đọc lại nội dung theo id này
      elements,
      transition: 'none',
    }
    return applySkin(rawSlide, design.id, theme, i, total)
  })
}

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()

const ALIASES: Record<string, string> = {
  'thanh lich': 'thanh-lich',
  'toi gian': 'thanh-lich',
  'minimal': 'thanh-lich',
  'tre trung': 'tre-trung',
  'tieu hoc': 'tre-trung',
  'nhieu mau': 'tre-trung',
  'hoc thuat': 'hoc-thuat',
  'nghiem tuc': 'hoc-thuat',
  'thpt': 'hoc-thuat',
  'thien nhien': 'thien-nhien',
  'xanh': 'thien-nhien',
  'sinh thai': 'thien-nhien',
  'cong nghe': 'cong-nghe',
  'toi mau': 'cong-nghe',
  'dark': 'cong-nghe',
  'tin hoc': 'cong-nghe',
  'co dien': 'co-dien',
  'giay am': 'co-dien',
  'vintage': 'co-dien',
  'van su': 'co-dien',
  'vui nhon': 'vui-nhon',
  'hoat hinh': 'vui-nhon',
  'vang nang': 'vui-nhon',
  'do vui': 'vui-nhon',
  'bang den': 'bang-den',
  'phan trang': 'bang-den',
  'chalkboard': 'bang-den',
  'pastel mam non': 'pastel-mam-non',
  'mam non': 'pastel-mam-non',
  'pastel': 'pastel-mam-non',
  'bien xanh': 'bien-xanh',
  'bien xanh mat': 'bien-xanh',
  'ocean': 'bien-xanh',
  'so tay o li': 'so-tay-o-li',
  'so tay': 'so-tay-o-li',
  'o li': 'so-tay-o-li',
  'notebook': 'so-tay-o-li',
  'cam nang dong': 'cam-nang-dong',
  'nang dong': 'cam-nang-dong',
  'lich su co': 'lich-su-co',
  'lich su co dien': 'lich-su-co',
  'lich su': 'lich-su-co',
  'phong thi nghiem': 'phong-thi-nghiem',
  'thi nghiem': 'phong-thi-nghiem',
  'lab': 'phong-thi-nghiem',
  'bac au toi gian': 'bac-au-toi-gian',
  'bac au': 'bac-au-toi-gian',
  'scandinavian': 'bac-au-toi-gian',
  'hoa si mau nuoc': 'hoa-si-mau-nuoc',
  'mau nuoc': 'hoa-si-mau-nuoc',
  'watercolor': 'hoa-si-mau-nuoc',
  'vu tru': 'vu-tru',
  'vu tru dem': 'vu-tru',
  'space': 'vu-tru',
  'rung dem': 'rung-dem',
  'forest': 'rung-dem',
  'bac ha': 'bac-ha',
  'bac ha xanh': 'bac-ha',
  'mint': 'bac-ha',
  'hong dao': 'hong-dao',
  'dao': 'hong-dao',
  'peach': 'hong-dao',
  'oai huong': 'oai-huong',
  'lavender': 'oai-huong',
  'cat vang': 'cat-vang',
  'sa mac': 'cat-vang',
  'desert': 'cat-vang',
  'chanh tuoi': 'chanh-tuoi',
  'chanh': 'chanh-tuoi',
  'lemon': 'chanh-tuoi',
  'lime': 'chanh-tuoi',
  'bau troi': 'bau-troi',
  'troi xanh': 'bau-troi',
  'sky': 'bau-troi',
  'bao tuong': 'bao-tuong',
  'tap chi': 'bao-tuong',
  'newspaper': 'bao-tuong',
  'xa luan': 'bao-tuong',
  'hinh hoc mau': 'hinh-hoc-mau',
  'bauhaus': 'hinh-hoc-mau',
  'bang trang': 'bang-trang',
  'whiteboard': 'bang-trang',
  'tet xuan': 'tet-xuan',
  'tet': 'tet-xuan',
  'xuan': 'tet-xuan',
}

const SORTED_ALIASES = Object.entries(ALIASES).sort((a, b) => b[0].length - a[0].length)

export function resolveDesignId(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const q = norm(raw)
  const exact = SLIDE_DESIGNS.find((d) => d.id === raw || norm(d.id) === q || norm(d.name) === q)
  if (exact) return exact.id

  if (ALIASES[q]) return ALIASES[q]

  for (const [alias, id] of SORTED_ALIASES) {
    if (q.includes(alias)) return id
  }

  const byName = SLIDE_DESIGNS.find((d) => norm(d.name).includes(q) || q.includes(norm(d.name)))
  if (byName) return byName.id

  return undefined
}

export function designById(id: string | undefined): SlideDesign | undefined {
  if (!id) return undefined
  const resolved = resolveDesignId(id) ?? id
  return SLIDE_DESIGNS.find((d) => d.id === resolved)
}

/** Catalog gửi cho model khi lập dàn ý hoặc tư vấn thiết kế. */
export function designCatalogText(): string {
  return [
    'BỘ THIẾT KẾ MẪU (khi người dùng yêu cầu làm theo phong cách/thiết kế cụ thể, chọn đúng theme, decorKit, stylePack và nhịp bố cục tương ứng):',
    ...SLIDE_DESIGNS.map((d) => {
      const rhythm = d.slides.map((s) => s.layout).join(' → ')
      const skin = skinById(d.id)
      const geo = skin?.geometrySummary ? ` Ngôn ngữ hình khối: ${skin.geometrySummary}` : ''
      return `- ${d.id}: "${d.name}" — ${d.description} (theme: ${d.themeId}, decorKit: ${d.decorKit ?? 'none'}, stylePack: ${d.stylePack ?? 'none'}).${geo} Nhịp bố cục: ${rhythm}`
    }),
  ].join('\n')
}
