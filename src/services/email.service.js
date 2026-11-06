import nodemailer from 'nodemailer'

const testEmails = []

export async function sendResetEmail (email, resetLink) {
  if (process.env.VITEST === 'true' || process.env.NODE_ENV === 'test') {
    testEmails.push({ to: email, resetLink })
    return
  }

  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASSWORD
  ) {
    throw new Error('SMTP email service is not configured')
  }

  const port = Number(process.env.SMTP_PORT || 587)

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  })

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'StudyMatch - Reset your password',
    text: `Reset your password using this link:\n${resetLink}\n\nThis link expires in 15 minutes.`
  })
}

export function getTestEmails () {
  return [...testEmails]
}

export function clearTestEmails () {
  testEmails.length = 0
}
