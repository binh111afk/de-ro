import { publishDoc } from '@/lib/community'
import { itemToDoc, type OnlineItem } from '@/lib/onlineExam'
import { useOnline } from '@/store/online'

/** Link mở đề đã đăng; ai có link đều làm được, không cần đăng nhập. */
export const shareUrl = (publishedId: string) => `${window.location.origin}/de-online/${publishedId}`

/** Đăng đề lên cộng đồng và ghi lại id đề đăng vào lịch sử. Cần đăng nhập (báo lỗi nếu chưa). */
export async function publishItem(item: OnlineItem): Promise<string> {
  const row = await publishDoc(itemToDoc(item))
  useOnline.getState().update(item.id, { publishedId: row.id })
  return row.id
}
