import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { name, email, message } = await req.json()

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  }

  const { error } = await resend.emails.send({
    from: 'OSL Contact <onboarding@resend.dev>',
    to: 'hi.oslab@gmail.com',
    subject: `[OSL] New message from ${name}`,
    replyTo: email,
    html: `
      <div style="font-family:monospace;max-width:560px;margin:0 auto;padding:32px;background:#ffffff;color:#171717;border:1px solid #e5e5e5;">
        <p style="color:#a3a3a3;font-size:12px;margin:0 0 24px;letter-spacing:0.1em;">OSL TERMINAL — incoming message</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">
          <tr>
            <td style="color:#a3a3a3;padding:6px 0;width:80px;">name</td>
            <td style="color:#a3a3a3;">→</td>
            <td style="color:#171717;padding:6px 0 6px 12px;">${name}</td>
          </tr>
          <tr>
            <td style="color:#a3a3a3;padding:6px 0;">email</td>
            <td style="color:#a3a3a3;">→</td>
            <td style="padding:6px 0 6px 12px;">
              <a href="mailto:${email}" style="color:#171717;">${email}</a>
            </td>
          </tr>
        </table>
        <div style="border-top:1px solid #e5e5e5;padding-top:20px;font-size:13px;color:#404040;line-height:1.8;white-space:pre-wrap;">${message}</div>
        <p style="margin:24px 0 0;font-size:11px;color:#a3a3a3;">reply to this email → goes directly to ${email}</p>
      </div>
    `,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
