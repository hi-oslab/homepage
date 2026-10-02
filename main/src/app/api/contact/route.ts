import { Resend } from 'resend'
import { CONTACT_FROM, CONTACT_TO } from '@/lib/contact'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

const LIMITS = { name: 80, email: 254, message: 5000 }
/** 폼을 연 뒤 이보다 빨리 보내면 사람이 아니다 */
const MIN_FILL_MS = 3000
/** IP당 10분에 5번까지 (서버 인스턴스마다 따로 세는 가벼운 제한) */
const RATE = { windowMs: 10 * 60 * 1000, max: 5 }
const hits = new Map<string, number[]>()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** 메일 본문에 넣는 값: HTML로 해석되지 않게 */
const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)

/** 'XgOeCVFADVuNmSWwuSVsEB' 같은 무작위 글자: 공백 없는 긴 영문에 대소문자가 자주 바뀐다 */
const looksRandom = (value: string) => {
  if (value.length < 12 || /\s/.test(value) || !/^[A-Za-z]+$/.test(value)) return false
  let switches = 0
  for (let index = 1; index < value.length; index += 1) {
    if ((value[index] === value[index].toUpperCase()) !== (value[index - 1] === value[index - 1].toUpperCase()))
      switches += 1
  }
  return switches >= value.length / 3
}

/** 'l.i.x.oj.a.xe62@gmail.com': Gmail은 점을 무시해서 봇이 주소를 무한히 바꿔 쓴다 */
const dottedGmail = (email: string) => {
  const [local, domain] = email.toLowerCase().split('@')
  return (domain === 'gmail.com' || domain === 'googlemail.com') && (local.match(/\./g)?.length ?? 0) >= 3
}

const rateLimited = (ip: string) => {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((at) => now - at < RATE.windowMs)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > RATE.max
}

/** 봇으로 보이면 보낸 척만 한다 (거절 이유를 알려 주면 우회를 시도하므로) */
const pretendSent = () => NextResponse.json({ ok: true })

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }
  const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
  const name = text(body.name)
  const email = text(body.email)
  const message = text(body.message)

  if (!name || !email || !message) return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  if (
    name.length > LIMITS.name ||
    email.length > LIMITS.email ||
    message.length > LIMITS.message ||
    !EMAIL_RE.test(email)
  )
    return NextResponse.json({ error: 'invalid fields' }, { status: 400 })

  // 1) 숨은 칸이 채워졌거나 2) 너무 빨리 보냈거나(폼을 거치지 않은 요청 포함)
  const elapsed = typeof body.elapsed === 'number' ? body.elapsed : 0
  if (text(body.website) || elapsed < MIN_FILL_MS) return pretendSent()
  // 3) 스팸 특징이 둘 이상
  if (Number(looksRandom(name)) + Number(looksRandom(message)) + Number(dottedGmail(email)) >= 2) return pretendSent()
  // 4) 같은 곳에서 너무 자주
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (rateLimited(ip)) return NextResponse.json({ error: 'too many requests' }, { status: 429 })

  const safe = { name: escapeHtml(name), email: escapeHtml(email), message: escapeHtml(message) }
  const { error } = await resend.emails.send({
    from: CONTACT_FROM,
    to: CONTACT_TO,
    // 제목은 한 줄로
    subject: `[OSL] New message from ${name.replace(/[\r\n]+/g, ' ')}`,
    replyTo: email,
    html: `
      <div style="font-family:monospace;max-width:560px;margin:0 auto;padding:32px;background:#ffffff;color:#171717;border:1px solid #e5e5e5;">
        <p style="color:#a3a3a3;font-size:12px;margin:0 0 24px;">OSL TERMINAL — incoming message</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">
          <tr>
            <td style="color:#a3a3a3;padding:6px 0;width:80px;">name</td>
            <td style="color:#a3a3a3;">→</td>
            <td style="color:#171717;padding:6px 0 6px 12px;">${safe.name}</td>
          </tr>
          <tr>
            <td style="color:#a3a3a3;padding:6px 0;">email</td>
            <td style="color:#a3a3a3;">→</td>
            <td style="padding:6px 0 6px 12px;">
              <a href="mailto:${safe.email}" style="color:#171717;">${safe.email}</a>
            </td>
          </tr>
        </table>
        <div style="border-top:1px solid #e5e5e5;padding-top:20px;font-size:13px;color:#404040;line-height:1.8;white-space:pre-wrap;">${safe.message}</div>
        <p style="margin:24px 0 0;font-size:11px;color:#a3a3a3;">reply to this email → goes directly to ${safe.email}</p>
      </div>
    `,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
