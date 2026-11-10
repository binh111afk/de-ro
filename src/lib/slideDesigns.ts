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
      elements: elements.map((el) => ({ ...el, id: uid() })),
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
}

export function resolveDesignId(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const q = norm(raw)
  const exact = SLIDE_DESIGNS.find((d) => d.id === raw || norm(d.id) === q)
  if (exact) return exact.id

  for (const [alias, id] of Object.entries(ALIASES)) {
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
