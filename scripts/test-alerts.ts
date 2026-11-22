import assert from 'node:assert/strict'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { evaluateAlerts, handleAlertRequest, type AlertMetrics } from '../server/alerts.ts'
import { json } from '../server/http.ts'

const emptyMetrics: AlertMetrics = {
  signups_1h: 0,
  ai_total_15m: 0,
  ai_err_15m: 0,
  ai_total_10m: 0,
  ai_ok_10m: 0,
  ai_cost_today: 0,
  maintenance_since: null,
}

function alerts(api: number, pay: number) {
  return evaluateAlerts({ ...emptyMetrics, api_5xx_15m: api, pay_failed_1h: pay })
}

function mockResponse(req?: Pick<IncomingMessage, 'url'>) {
  const out = { status: 0, payload: '' }
  const res = {
    req,
    writeHead(code: number) { out.status = code },
    end(payload: string) { out.payload = payload },
  } as unknown as ServerResponse
  return { res, out }
}

const originalFetch = globalThis.fetch
const originalNow = Date.now
const originalEnv = process.env
try {
  process.env = { ...originalEnv }
  delete process.env.ALERT_API_5XX
  delete process.env.ALERT_PAY_FAILED
  assert.deepEqual(evaluateAlerts(emptyMetrics), [])
  assert.deepEqual(alerts(4, 0), [])
  assert.deepEqual(alerts(5, 1), [
    ['api_5xx', 'API lỗi 5xx: 5 lần trong 15 phút.'],
    ['pay_failed', 'Đơn nạp PayOS lỗi: 1 đơn trong 1 giờ.'],
  ])
  assert.deepEqual(alerts(8, 3), [
    ['api_5xx', 'API lỗi 5xx: 8 lần trong 15 phút.'],
    ['pay_failed', 'Đơn nạp PayOS lỗi: 3 đơn trong 1 giờ.'],
  ])
  process.env.ALERT_API_5XX = '8'
  process.env.ALERT_PAY_FAILED = '3'
  assert.deepEqual(alerts(7, 2), [])
  assert.deepEqual(alerts(8, 3).map(([kind]) => kind), ['api_5xx', 'pay_failed'])
  console.log('OK evaluateAlerts · trường thiếu, ngưỡng mặc định và ngưỡng từ env')

  const calls: { url: string; init?: RequestInit }[] = []
  const response = mockResponse({ url: '/api/exam?token=sample' })
  let responseAtFetch: typeof response.out | undefined
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init })
    responseAtFetch = { ...response.out }
    return new Response(null, { status: 201 })
  }
  delete process.env.VITE_SUPABASE_URL
  process.env.SUPABASE_URL = 'https://sb.test/'
  delete process.env.SUPABASE_SERVICE_ROLE_KEY
  json(response.res, 502, { error: 'sample' })
  assert.equal(calls.length, 0)
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
  let now = Date.UTC(2026, 10, 22)
  Date.now = () => now
  json(response.res, 502, { error: 'sample' })
  assert.equal(calls.length, 1)
  assert.deepEqual(responseAtFetch, { status: 502, payload: '{"error":"sample"}' })
  assert.equal(calls[0].url, 'https://sb.test/rest/v1/api_errors')
  assert.equal(calls[0].init?.method, 'POST')
  assert.equal(new Headers(calls[0].init?.headers).get('apikey'), 'test-key')
  assert.equal(new Headers(calls[0].init?.headers).get('authorization'), 'Bearer test-key')
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { status: 502, path: '/api/exam' })

  json(response.res, 400, {})
  json(response.res, 503, {})
  json(mockResponse({ url: '/api/alert?x=1' }).res, 500, {})
  assert.equal(calls.length, 1)

  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init })
    throw new Error('Supabase unavailable')
  }
  const longPath = '/api/' + 'x'.repeat(250)
  assert.doesNotThrow(() => json(mockResponse({ url: longPath }).res, 500, {}))
  assert.deepEqual(JSON.parse(String(calls[1].init?.body)), { status: 500, path: longPath.slice(0, 200) })
  for (let i = 0; i < 25; i++) json(response.res, 500, {})
  assert.equal(calls.length, 20)
  now += 59_999
  json(response.res, 500, {})
  assert.equal(calls.length, 20)
  now += 1
  json(response.res, 500, {})
  assert.equal(calls.length, 21)
  console.log('OK json · phản hồi đã gửi, chỉ ghi status và path, bỏ qua lỗi fetch, tối đa 20 lượt mỗi phút')

  process.env.VITE_SUPABASE_URL = 'https://sb.test'
  process.env.ALERT_SECRET = 'test-secret-long-enough'
  process.env.TELEGRAM_BOT_TOKEN = 'test-bot'
  process.env.TELEGRAM_CHAT_ID = 'test-chat'
  const req = {
    url: '/api/alert',
    headers: { authorization: 'Bearer test-secret-long-enough' },
  } as IncomingMessage
  const cleanupUrl = 'https://sb.test/rest/v1/api_errors?at=lt.2026-11-19T00:01:00.000Z'
  for (const rejectCleanup of [false, true]) {
    const methods = new Map<string, string | undefined>()
    globalThis.fetch = async (input, init) => {
      const url = String(input)
      methods.set(url, init?.method)
      if (url === cleanupUrl) {
        if (rejectCleanup) throw new Error('Supabase unavailable')
        return new Response(null, { status: 404 })
      }
      if (url.endsWith('/rpc/alert_metrics')) return Response.json({ ...emptyMetrics, api_5xx_15m: 8, pay_failed_1h: 3 })
      if (url.includes('/alert_state?select=')) return Response.json([])
      return new Response(null, { status: 200 })
    }
    const { res, out } = mockResponse(req)
    await handleAlertRequest(req, res)
    assert.equal(methods.get(cleanupUrl), 'DELETE')
    assert.equal(out.status, 200)
    assert.deepEqual(JSON.parse(out.payload), { active: ['api_5xx', 'pay_failed'], sent: ['api_5xx', 'pay_failed'] })
  }
  console.log('OK handleAlertRequest · lỗi dọn bảng 404 hoặc lỗi mạng vẫn gửi cảnh báo')
} finally {
  globalThis.fetch = originalFetch
  Date.now = originalNow
  process.env = originalEnv
}
