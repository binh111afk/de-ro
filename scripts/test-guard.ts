/** Test lớp chặn lạm dụng API (server/guard.ts): Origin lạ, hạn mức khách theo IP, máy dev không bị chặn. */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { guard } from '../server/guard.ts'

let pass = 0
let fail = 0
const check = (name: string, ok: boolean) => {
  console.log(`${ok ? '✅' : '❌'} ${name}`)
  ok ? pass++ : fail++
}

function mock(headers: Record<string, string>, remote = '203.0.113.9') {
  const req = { method: 'POST', headers, socket: { remoteAddress: remote } } as unknown as IncomingMessage
  const out = { status: 0 }
  const res = {
    headersSent: false,
    writeHead(code: number) {
      out.status = code
      return this
    },
    setHeader() {},
    end() {},
  } as unknown as ServerResponse
  return { req, res, out }
}

const host = { host: 'de-ro-lac.vercel.app' }

{
  const m = mock({ ...host, origin: 'https://evil.example', 'x-forwarded-for': '198.51.100.1' })
  check('Origin trang lạ bị chặn 403', !(await guard(m.req, m.res, 'llm')) && m.out.status === 403)
}
{
  const m = mock({ ...host, origin: 'https://de-ro-lac.vercel.app', 'x-forwarded-for': '198.51.100.2' })
  check('Origin cùng trang được qua', await guard(m.req, m.res, 'llm'))
}
{
  let okCount = 0
  let last = 0
  for (let i = 0; i < 25; i++) {
    const m = mock({ ...host, 'x-forwarded-for': '198.51.100.3' })
    if (await guard(m.req, m.res, 'llm')) okCount++
    else last = m.out.status
  }
  check(`khách cùng IP: 20 lượt qua rồi 429 (qua ${okCount}, lỗi ${last})`, okCount === 20 && last === 429)
}
{
  const m = mock({ ...host, 'x-forwarded-for': '198.51.100.4' })
  check('IP khác vẫn có lượt riêng', await guard(m.req, m.res, 'llm'))
}
{
  let ok = true
  for (let i = 0; i < 50; i++) {
    const m = mock({ ...host }, '127.0.0.1')
    ok &&= await guard(m.req, m.res, 'llm')
  }
  check('máy dev (localhost) không bị giới hạn', ok)
}
{
  const m = mock({ ...host, 'x-forwarded-for': '198.51.100.5', authorization: 'Bearer token-sai' })
  check('token sai: coi như khách, vẫn qua lượt đầu', await guard(m.req, m.res, 'image'))
}

console.log(`\n${pass}/${pass + fail} pass, ${fail} fail`)
if (fail) process.exit(1)
