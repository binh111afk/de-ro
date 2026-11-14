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
