import { publishDoc, setListed } from '@/lib/community'
import { itemToDoc, type OnlineItem } from '@/lib/onlineExam'
import { useOnline } from '@/store/online'

/** Link mở đề đã xuất bản; ai có link đều làm được, không cần đăng nhập. */
export const shareUrl = (publishedId: string) => `${window.location.origin}/de-online/${publishedId}`

/**
 * Xuất bản đề: `listed` = hiện trong danh sách cộng đồng, false = chỉ học sinh có link làm được.
 * Đề đã xuất bản thì cập nhật đúng bản đó (giữ link và kết quả của học sinh). Cần đăng nhập.
 */
export async function publishItem(item: OnlineItem, listed: boolean): Promise<string> {
  const row = await publishDoc(itemToDoc(item), listed, item.publishedId)
  useOnline.getState().update(item.id, { publishedId: row.id, publishedListed: row.listed })
  return row.id
}

/** Đưa đề đã xuất bản lên danh sách cộng đồng (hoặc rút xuống, chỉ còn link). */
export async function listItem(item: OnlineItem, listed: boolean): Promise<void> {
  if (!item.publishedId) return
  await setListed(item.publishedId, listed)
  useOnline.getState().update(item.id, { publishedListed: listed })
}
