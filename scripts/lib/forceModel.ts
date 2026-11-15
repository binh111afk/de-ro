/**
 * Trang đo (eval-exam, eval-slides): `?model=<tên>` thì mọi lượt gọi /api/llm gửi kèm model đó,
 * để đo một model dự phòng (vd DeepSeek chính hãng) mà không phải tắt model chính.
 */
const model = new URLSearchParams(location.search).get('model')
if (model) {
  const realFetch = window.fetch.bind(window)
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input).includes('/api/llm') && typeof init?.body === 'string') {
      init = { ...init, body: JSON.stringify({ ...JSON.parse(init.body), model }) }
    }
    return realFetch(input, init)
  }
}
export {}
