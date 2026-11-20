import { clearBoardImages } from '@/board/imgStore'

export const DISCARD_USER_VIEW = 'dethinhbien-discard-user-view'

const localPrefixes = [
  'soandethi-docs', // đề và slide đã lưu
  'dethinhbien-v1', // đề, nháp, chat và kết quả từ trình soạn cũ
  'dethinhbien-online', // nháp và lịch sử đề online
  'dethinhbien-boards', 'derou.board.', // bảng vẽ hiện tại và bản lưu cũ
  'dethinhbien-uploads', // thư viện ảnh đã tải lên
  'derou.ai-chat.', // chat AI và tên tệp theo tài liệu
  'dethinhbien-student', 'dethinhbien-device', // tên/lớp/chỗ ngồi và mã thiết bị gắn với bài nộp
  'dero.adminMe', 'dethinhbien-quota:', // cache vai trò và hạn mức theo tài khoản
  'dethinhbien-sync-', // chủ bản đệm và meta theo loại dữ liệu
  'slide-recent-graphics', // lịch sử hình đã chọn trong trình soạn
]
// Giữ điều khoản (dero.terms-accepted), chế độ di động, cờ đã đọc cảnh báo web,
// tools.subject, lưới/đường gióng và chế độ chọn mẫu slide: thiết lập trên máy.
const sessionPrefixes = [
  'dethinhbien-compose-session', 'dethinhbien-student-ok:', // tab đang soạn và đề học sinh đã qua bước nhập tên
  'dethinhbien-auth-flow', 'dethinhbien-return', // dấu vết của luồng đăng nhập
]
// Giữ announcements-seen và derou.chunk-reload-at: trạng thái thông báo và chặn vòng lặp tải lại.

function purgeStorage(storage: Storage, prefixes: string[]) {
  for (let i = storage.length - 1; i >= 0; i--) {
    const key = storage.key(i)
    if (key && prefixes.some((prefix) => key.startsWith(prefix))) storage.removeItem(key)
  }
}

function purgeUserSessionData() {
  try {
    purgeStorage(sessionStorage, sessionPrefixes)
  } catch (err) {
    console.warn('Không dọn được dữ liệu trong sessionStorage', err)
  }
}

function purgeLocalStorage() {
  try {
    purgeStorage(localStorage, localPrefixes)
  } catch (err) {
    console.warn('Không dọn được dữ liệu trong localStorage', err)
  }
}

export async function purgeUserData() {
  purgeLocalStorage()
  purgeUserSessionData()
  try {
    await clearBoardImages()
  } finally {
    // Tác vụ đã bắt đầu trước lúc tháo UI có thể vừa trả kết quả trong lúc chờ IndexedDB.
    purgeLocalStorage()
    purgeUserSessionData()
  }
}
