import { Link } from 'react-router-dom'
import { ContactLinks } from '@/components/ContactLinks'

const UPDATED = '18/11/2026'

/** Đoạn văn là chuỗi; mảng chuỗi là danh sách gạch đầu dòng; 'contact' chèn khối liên hệ. */
type Block = string | string[] | 'contact'
type Section = { h: string; b: Block[] }

const PRIVACY_INTRO =
  "'đề rõ' (dero.id.vn) do Nguyễn Quang Bình vận hành với tư cách cá nhân. Chính sách này cho biết chúng tôi xử lý dữ liệu cá nhân của bạn thế nào, theo quy định của pháp luật về thương mại điện tử và bảo vệ dữ liệu cá nhân."

const PRIVACY: Section[] = [
  {
    h: '1. Mục đích và phạm vi thu thập',
    b: [
      'Chúng tôi chỉ thu thập dữ liệu cần để cung cấp dịch vụ soạn đề, slide và nạp điểm:',
      [
        'Thông tin tài khoản: họ tên, email, ảnh đại diện (khi đăng nhập bằng Google) hoặc email và mật khẩu (khi đăng ký bằng email).',
        'Nội dung bạn tạo hoặc tải lên: đề thi, câu hỏi, slide, bảng vẽ, tài liệu, ảnh chụp đề và nội dung trao đổi với trợ lý AI.',
        'Dữ liệu thi online: tên lớp, tên hoặc mã học sinh, bài làm do bạn hoặc học sinh nộp qua liên kết bạn tạo.',
        'Thông tin giao dịch nạp điểm: mã đơn, gói, số tiền, thời gian và nội dung chuyển khoản. Chúng tôi không thu thập số thẻ, mật khẩu hay mã OTP ngân hàng.',
        'Thông tin kỹ thuật cần cho vận hành: lượt dùng AI, số điểm đã dùng, địa chỉ IP khi gọi dịch vụ, dùng để tính điểm và chống lạm dụng.',
      ],
    ],
  },
  {
    h: '2. Phạm vi sử dụng thông tin',
    b: [
      [
        'Cung cấp các tính năng: lưu đề, soạn đề và slide bằng AI, chia sẻ đề lên mục cộng đồng.',
        'Xác nhận thanh toán, cộng điểm, đối soát giao dịch và xử lý giao dịch lỗi.',
        'Gửi email cần thiết như xác nhận tài khoản, đặt lại mật khẩu, thông báo thay đổi dịch vụ.',
        'Trả lời yêu cầu hỗ trợ, khiếu nại; phát hiện và ngăn chặn gian lận, lạm dụng.',
        'Thống kê ở dạng tổng hợp để cải thiện sản phẩm.',
      ],
      'Chúng tôi không bán dữ liệu cá nhân và không cung cấp dữ liệu cho bên thứ ba để quảng cáo.',
    ],
  },
  {
    h: '3. Dữ liệu từ Google',
    b: [
      'Khi bạn đăng nhập bằng Google, chúng tôi chỉ nhận email, tên và ảnh đại diện. Chúng tôi không truy cập Gmail, Drive hay dữ liệu Google nào khác.',
      'Việc sử dụng thông tin nhận từ Google API tuân theo Chính sách dữ liệu người dùng của Google API Services, bao gồm các yêu cầu về Sử dụng giới hạn (Limited Use).',
    ],
  },
  {
    h: '4. Thời gian lưu trữ',
    b: [
      'Thông tin tài khoản và nội dung của bạn được lưu trong suốt thời gian tài khoản còn hoạt động. Đề, tài liệu, bài thi bạn xoá sẽ bị xoá khỏi hệ thống.',
      'Đề bạn đã chia sẻ lên cộng đồng mà người khác đã sao về tài khoản của họ thì bản sao đó thuộc tài khoản của họ.',
      'Thông tin giao dịch nạp điểm được lưu theo thời hạn mà pháp luật về kế toán, thuế yêu cầu.',
    ],
  },
  {
    h: '5. Ai có thể tiếp cận thông tin',
    b: [
      [
        "Người vận hành 'đề rõ', chỉ trong phạm vi cần để vận hành và hỗ trợ.",
        'Nhà cung cấp hạ tầng: Vercel (máy chủ web), Supabase (xác thực và cơ sở dữ liệu), Cloudflare R2 (lưu trữ tệp).',
        'Đối tác công nghệ AI: phần nội dung bạn gửi cho trợ lý (lời nhắn, đề, ảnh) được xử lý tự động để trả kết quả và chỉ phục vụ đúng yêu cầu đó. Một số đối tác vận hành trên hạ tầng máy chủ quốc tế.',
        'Google, khi bạn chọn đăng nhập bằng tài khoản Google; PayOS và ngân hàng nơi bạn chuyển khoản.',
        'Cơ quan nhà nước có thẩm quyền khi có yêu cầu theo quy định của pháp luật.',
      ],
      'Đề bạn chủ động chia sẻ lên mục cộng đồng sẽ hiển thị công khai cho người dùng khác sau khi được duyệt.',
    ],
  },
  {
    h: '6. Biện pháp bảo mật',
    b: [
      "Toàn bộ kết nối tới 'đề rõ' dùng HTTPS. Mật khẩu được băm một chiều, không ai đọc được mật khẩu gốc, kể cả quản trị viên. Khoá truy cập dịch vụ bên ngoài được mã hoá khi lưu.",
      'Không hệ thống nào an toàn tuyệt đối. Nếu xảy ra sự cố lộ lọt dữ liệu, chúng tôi sẽ thông báo cho người dùng bị ảnh hưởng và cơ quan có thẩm quyền theo quy định.',
    ],
  },
  {
    h: '7. Xem, chỉnh sửa và xoá dữ liệu',
    b: [
      'Bạn xem thông tin tài khoản, số dư và lịch sử dùng điểm trong trang Hồ sơ; xem, sửa và xoá đề, slide, tài liệu, lớp và bài thi của mình bất cứ lúc nào.',
      'Thông tin nào không tự sửa được, hoặc muốn rút lại sự đồng ý, yêu cầu ngừng xử lý một phần dữ liệu, hãy liên hệ chúng tôi từ email đăng ký tài khoản. Chúng tôi xác nhận yêu cầu trong 24 giờ và hoàn tất trong 72 giờ kể từ khi xác nhận, trừ dữ liệu pháp luật bắt buộc phải lưu.',
    ],
  },
  {
    h: '8. Dữ liệu của học sinh',
    b: [
      'Khi dùng tính năng thi online, giáo viên là người quyết định thu thập dữ liệu của học sinh và chịu trách nhiệm thông báo, xin sự đồng ý của học sinh hoặc cha mẹ, người giám hộ khi pháp luật yêu cầu. Chúng tôi chỉ xử lý dữ liệu này để tổ chức thi và trả kết quả cho giáo viên.',
    ],
  },
  {
    h: '9. Tiếp nhận và giải quyết khiếu nại về dữ liệu cá nhân',
    b: ['Gửi phản ánh qua email hoặc Zalo bên dưới, nêu email tài khoản và nội dung cần xử lý. Chúng tôi phản hồi trong 24 giờ và giải quyết trong 72 giờ.', 'contact'],
  },
]

const TERMS_INTRO =
  "'đề rõ' giúp giáo viên soạn đề thi, slide bài giảng với sự hỗ trợ của AI. Trang này nêu đầy đủ những quy định khi bạn dùng dịch vụ. Cách chúng tôi xử lý dữ liệu cá nhân xem tại Chính sách quyền riêng tư."

const TERMS: Section[] = [
  {
    h: '1. Đơn vị cung cấp dịch vụ',
    b: ["Website 'đề rõ' (dero.id.vn) do Nguyễn Quang Bình vận hành với tư cách cá nhân.", 'contact'],
  },
  {
    h: '2. Chấp nhận điều khoản',
    b: ["Khi tạo tài khoản, đăng nhập, đặt hàng hoặc dùng 'đề rõ', bạn đồng ý với các điều khoản này và Chính sách quyền riêng tư. Nếu bạn không đồng ý, vui lòng ngừng sử dụng dịch vụ."],
  },
  {
    h: '3. Tài khoản',
    b: ['Bạn đăng nhập bằng Google hoặc email và mật khẩu. Hãy cung cấp thông tin đúng và giữ bí mật thông tin đăng nhập của mình. Bạn chịu trách nhiệm về mọi hoạt động diễn ra trong tài khoản.'],
  },
  {
    h: '4. Phương thức cung cấp dịch vụ',
    b: [
      "'đề rõ' là dịch vụ trực tuyến, dùng ngay trên trình duyệt sau khi đăng nhập, không cần cài đặt phần mềm. Sản phẩm bán trên web là điểm AI để dùng các tính năng có phí; không có hàng hoá vật lý nên không phát sinh giao hàng.",
      [
        'Tính năng chính: soạn đề từ câu lệnh, chỉnh sửa đề bằng chat với AI, soạn slide bài giảng, kho câu hỏi, kho hình minh họa SGK, bảng vẽ, thi online, xuất Word và in A4. Các tính năng có phí trừ điểm theo bảng giá.',
        'Thời điểm cung cấp: điểm được cộng tự động vào tài khoản ngay khi hệ thống nhận được tiền qua PayOS, thường sau khoảng 1 phút, và dùng được ngay.',
        'Thời hạn sử dụng: tài khoản không giới hạn thời gian. Điểm đã mua không hết hạn.',
        'Tra cứu: số dư và lịch sử dùng điểm xem tại trang Hồ sơ.',
      ],
    ],
  },
  {
    h: '5. Điểm AI',
    b: [
      [
        '1 điểm = 1.000 token AI. Chi phí hiện tại: soạn 1 đề 20 điểm; 1 bộ slide 15 trang 26 điểm; hỏi lại trước khi soạn 10 điểm; sửa/hỏi thêm 5 điểm; tìm trên web 5 điểm; ảnh minh họa 5 điểm.',
        'Tài khoản mới được tặng 120 điểm dùng thử, một lần duy nhất cho mỗi người.',
        "Điểm chỉ dùng để trả cho các tính năng có phí trên 'đề rõ'. Điểm không được quy đổi để rút tiền mặt, không chuyển nhượng sang tài khoản khác.",
        'Tạo nhiều tài khoản để nhận điểm dùng thử là vi phạm điều khoản, tài khoản vi phạm có thể bị khóa và điểm bị thu hồi.',
      ],
    ],
  },
  {
    h: '6. Sản phẩm và giá niêm yết',
    b: [
      "'đề rõ' bán điểm AI theo các gói: 2.000đ → 50 điểm; 5.000đ → 131 điểm; 10.000đ → 275 điểm; 20.000đ → 575 điểm; 50.000đ → 1.500 điểm. Giá niêm yết bằng đồng Việt Nam, là số tiền cuối cùng bạn trả: đã bao gồm thuế, không thu thêm phí xử lý hay phí nào khác. Phí chuyển khoản (nếu có) do ngân hàng của bạn quy định.",
      'Giá áp dụng là giá hiển thị tại thời điểm bạn đặt hàng. Khi thay đổi giá, chúng tôi cập nhật trên trang Bảng giá trước khi áp dụng. Giá mới không ảnh hưởng đến đơn đã tạo hoặc đã thanh toán trước đó.',
    ],
  },
  {
    h: '7. Thanh toán',
    b: [
      'Hiện chúng tôi chỉ nhận thanh toán bằng chuyển khoản ngân hàng qua mã VietQR (cổng PayOS), vào tài khoản đứng tên Nguyễn Quang Bình. Không thu tiền mặt, không nhận thẻ và không lưu thông tin tài khoản ngân hàng của bạn.',
      [
        'Bước 1: Tại trang Bảng giá, chọn gói hoặc nhập số tiền nạp lẻ.',
        'Bước 2: Kiểm tra đơn hàng: gói, số điểm nhận, phương thức thanh toán và tổng tiền đã gồm thuế.',
        'Bước 3: Bấm Thanh toán để đặt hàng. Mỗi đơn có mã đơn riêng và mã VietQR đã điền sẵn số tiền, nội dung chuyển khoản.',
        'Bước 4: Quét mã bằng ứng dụng ngân hàng bất kỳ và chuyển khoản trong thời hạn hiển thị trên mã.',
        'Bước 5: Hệ thống tự đối soát giao dịch, cộng điểm và báo thanh toán thành công, thường sau khoảng 1 phút.',
      ],
      'Hãy chuyển đúng số tiền và nội dung trên mã QR. Chuyển thiếu so với giá gói thì số tiền thực nhận được tính theo tỷ lệ nạp lẻ và đơn được đóng; chuyển dư thì phần dư được cộng thành điểm.',
    ],
  },
  {
    h: '8. Điều kiện và hạn chế cung cấp dịch vụ',
    b: [
      [
        'Thời gian và khu vực: dịch vụ trực tuyến, dùng được 24/7 ở mọi nơi có kết nối Internet.',
        'Đối tượng: giáo viên và người dùng có nhu cầu soạn đề. Người dưới 18 tuổi cần có sự đồng ý của cha mẹ hoặc người giám hộ trước khi mua điểm.',
        'Tính khả dụng: dịch vụ có thể tạm gián đoạn khi bảo trì, khi đối tác hạ tầng hoặc đối tác AI gặp sự cố, hoặc do sự kiện bất khả kháng. Bảo trì theo kế hoạch sẽ được báo trước trên web khi có thể.',
        'Giới hạn của AI: kết quả AI có thể sai hoặc thiếu, nhất là ở đáp án, công thức và hình vẽ; bạn cần đọc lại trước khi dùng. Tốc độ trả lời phụ thuộc độ dài yêu cầu và tình trạng hệ thống AI.',
        'Các tính năng gắn nhãn BETA (hiện tại: thi online, chấm bài) đang trong giai đoạn thử nghiệm, có thể thay đổi hoặc gián đoạn mà không báo trước.',
      ],
    ],
  },
  {
    h: '9. Chấm dứt dịch vụ và hoàn tiền',
    b: [
      [
        'Bạn có thể ngừng dùng dịch vụ bất cứ lúc nào.',
        'Chúng tôi có thể tạm khoá hoặc chấm dứt tài khoản vi phạm điều khoản này. Khi có thể, chúng tôi sẽ báo lý do qua email.',
      ],
      'Điểm đã mua không hoàn lại thành tiền. Chúng tôi hoàn tiền trong các trường hợp sau:',
      [
        'Đã chuyển tiền nhưng không nhận được điểm do lỗi hệ thống: chúng tôi cộng điểm, hoặc hoàn tiền nếu bạn yêu cầu.',
        'Chuyển nhầm, chuyển trùng hoặc giao dịch không khớp với đơn nào: hoàn lại số tiền đã chuyển.',
        'Giá hiển thị sai do lỗi kỹ thuật và bạn chọn không tiếp tục: hoàn lại toàn bộ số tiền đã chuyển.',
        'Chúng tôi ngừng cung cấp toàn bộ dịch vụ: hoàn tiền cho phần điểm đã mua còn lại, tính theo giá bạn đã trả.',
      ],
      'Tiền được hoàn bằng chuyển khoản về tài khoản đã thanh toán trong 7 ngày làm việc kể từ khi xác nhận yêu cầu. Để yêu cầu hoàn tiền, liên hệ qua kênh ở mục 1 kèm mã đơn hoặc ảnh giao dịch.',
    ],
  },
  {
    h: '10. Nội dung của bạn',
    b: [
      'Đề thi, câu hỏi và tệp bạn tạo hoặc tải lên vẫn thuộc về bạn. Bạn cam đoan có quyền dùng những nội dung đó, kể cả khi chụp ảnh hoặc chép lại từ tài liệu khác.',
      "Khi chia sẻ một đề hoặc câu hỏi lên mục cộng đồng, bạn cho phép 'đề rõ' hiển thị nội dung đó cho người dùng khác và cho họ sao chép về tài khoản của họ để chỉnh sửa. Bài chia sẻ được duyệt trước khi hiển thị. Nội dung vi phạm có thể bị gỡ.",
      'Hãy xuất bản sao (Word, PDF) cho những tài liệu quan trọng.',
    ],
  },
  {
    h: '11. Nội dung do AI tạo',
    b: ['Kết quả của trợ lý AI có thể sai hoặc thiếu, đặc biệt ở đáp án, công thức và hình vẽ. Hãy đọc và kiểm tra lại trước khi dùng cho kiểm tra, thi hoặc phát hành. Bạn chịu trách nhiệm về nội dung cuối cùng của đề mà bạn sử dụng.'],
  },
  {
    h: '12. Quyền và nghĩa vụ của các bên',
    b: [
      "Bên cung cấp 'đề rõ' có quyền và nghĩa vụ:",
      [
        'Công khai và thực hiện đúng giá, điều khoản đã công bố.',
        'Cộng đúng điểm cho giao dịch hợp lệ; giữ hệ thống vận hành an toàn, ổn định; lưu lịch sử đơn hàng và giao dịch để đối soát.',
        'Bảo vệ dữ liệu cá nhân theo Chính sách quyền riêng tư; tiếp nhận và giải quyết phản ánh, khiếu nại theo đúng thời hạn đã công bố.',
        'Được tạm khoá tài khoản lạm dụng, gian lận điểm hoặc gây hại cho hệ thống.',
      ],
      'Người dùng có quyền được cung cấp thông tin đầy đủ về dịch vụ, giá và điều kiện giao dịch trước khi đặt hàng; được bảo vệ quyền lợi người tiêu dùng và dữ liệu cá nhân; được khiếu nại khi quyền lợi bị ảnh hưởng. Người dùng có nghĩa vụ:',
      [
        'Cung cấp thông tin chính xác, thanh toán đúng số tiền và nội dung trên mã QR.',
        'Không đăng nội dung vi phạm pháp luật, xâm phạm bản quyền hoặc quyền riêng tư của người khác.',
        'Không dùng nhiều tài khoản hoặc tự động hoá để nhận điểm dùng thử, không tìm cách vượt hạn mức điểm hay dung lượng, không tấn công hoặc gây quá tải hệ thống.',
      ],
    ],
  },
  {
    h: '13. Tiếp nhận và giải quyết phản ánh, khiếu nại',
    b: [
      'Kênh tiếp nhận: email hoặc Zalo ở mục 1. Hãy nêu email tài khoản, mã đơn (nếu có) và mô tả vấn đề kèm ảnh chụp.',
      [
        'Bước 1: Chúng tôi xác nhận đã nhận phản ánh trong 24 giờ.',
        'Bước 2: Kiểm tra lịch sử tài khoản, đơn hàng và đối soát với sao kê ngân hàng; liên hệ lại nếu cần thêm thông tin.',
        'Bước 3: Trả lời kết quả và cách xử lý qua kênh bạn đã liên hệ.',
      ],
      'Thời hạn giải quyết dự kiến:',
      [
        'Giao dịch đã trừ tiền nhưng chưa cộng điểm: 1 ngày làm việc.',
        'Yêu cầu hoàn tiền: xác nhận trong 3 ngày làm việc, chuyển tiền trong 7 ngày làm việc sau khi xác nhận.',
        'Dữ liệu cá nhân: 72 giờ.',
        'Tài khoản bị khoá và các vấn đề khác: 5 ngày làm việc.',
      ],
      'Nếu không đồng ý với kết quả, bạn có thể đề nghị xem xét lại; hai bên ưu tiên thương lượng, hoà giải. Bạn cũng có quyền gửi yêu cầu đến cơ quan bảo vệ quyền lợi người tiêu dùng hoặc giải quyết tại toà án theo quy định của pháp luật Việt Nam.',
    ],
  },
  {
    h: '14. Thay đổi điều khoản',
    b: ['Điều khoản có thể được cập nhật. Ngày cập nhật gần nhất nằm ở đầu trang; thay đổi quan trọng về giá hoặc quyền lợi được thông báo trên web trước khi áp dụng. Việc tiếp tục dùng dịch vụ sau khi điều khoản thay đổi nghĩa là bạn chấp nhận bản mới.'],
  },
]

export default function Legal({ kind }: { kind: 'privacy' | 'terms' }) {
  const privacy = kind === 'privacy'
  const sections = privacy ? PRIVACY : TERMS
  return (
    <article className="mx-auto max-w-[760px] px-5 py-12 sm:px-6">
      <p className="eyebrow mb-3">Cập nhật {UPDATED}</p>
      <h1 className="font-display text-[34px] font-semibold leading-tight tracking-[-0.02em] text-ink">
        {privacy ? 'Chính sách quyền riêng tư' : 'Điều khoản sử dụng'}
      </h1>
      <p className="mt-5 text-[14.5px] leading-[1.75] text-ink-2">{privacy ? PRIVACY_INTRO : TERMS_INTRO}</p>
      <div className="mt-8 space-y-8">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="mb-2.5 text-[17px] font-semibold text-ink">{s.h}</h2>
            <div className="space-y-2 text-[14.5px] leading-[1.75] text-ink-2">
              {s.b.map((block, i) =>
                block === 'contact' ? (
                  <ContactLinks key={i} className="pt-1 text-[14px]" />
                ) : Array.isArray(block) ? (
                  <ul key={i} className="list-disc space-y-1 pl-5 marker:text-ink-4">
                    {block.map((t) => <li key={t}>{t}</li>)}
                  </ul>
                ) : (
                  <p key={i}>{block}</p>
                ),
              )}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-10 text-[14px] text-ink-3">
        <Link to={privacy ? '/dieu-khoan' : '/quyen-rieng-tu'} className="font-semibold text-clay hover:underline">
          {privacy ? 'Điều khoản sử dụng' : 'Chính sách quyền riêng tư'}
        </Link>
      </p>
    </article>
  )
}
