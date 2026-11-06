import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  sendResetEmail,
  getTestEmails,
  clearTestEmails
} from '../src/services/email.service.js'

const mocks = vi.hoisted(() => ({
  createTransport: vi.fn(),
  sendMail: vi.fn()
}))

vi.mock('nodemailer', () => ({
  default: {
    createTransport: mocks.createTransport
  }
}))

const originalEnv = { ...process.env }

beforeEach(() => {
  vi.clearAllMocks()
  clearTestEmails()

  process.env.VITEST = 'true'
  process.env.NODE_ENV = 'test'

  delete process.env.SMTP_HOST
  delete process.env.SMTP_USER
  delete process.env.SMTP_PASSWORD
  delete process.env.SMTP_PORT
  delete process.env.SMTP_FROM

  mocks.createTransport.mockReturnValue({
    sendMail: mocks.sendMail
  })

  mocks.sendMail.mockResolvedValue({ messageId: 'test-message' })
})

afterEach(() => {
  vi.restoreAllMocks()
  process.env = { ...originalEnv }
})

describe('Email Service (STUD-8)', () => {
  it('records a reset email in test mode', async () => {
    await sendResetEmail(
      'demo@studymatch.fr',
      'http://localhost:3000/reset-password?token=abc'
    )

    const emails = getTestEmails()

    expect(emails).toHaveLength(1)
    expect(emails[0].to).toBe('demo@studymatch.fr')
    expect(emails[0].resetLink).toContain('token=abc')
  })

  it('clears recorded test emails', async () => {
    await sendResetEmail(
      'demo@studymatch.fr',
      'http://localhost:3000/reset-password?token=abc'
    )

    clearTestEmails()

    expect(getTestEmails()).toHaveLength(0)
  })

  it('does not expose the internal email array', async () => {
    await sendResetEmail(
      'demo@studymatch.fr',
      'http://localhost:3000/reset-password?token=abc'
    )

    const emails = getTestEmails()
    emails.pop()

    expect(getTestEmails()).toHaveLength(1)
  })

  it('rejects missing SMTP configuration outside test mode', async () => {
    delete process.env.VITEST
    process.env.NODE_ENV = 'production'

    await expect(
      sendResetEmail(
        'demo@studymatch.fr',
        'http://localhost:3000/reset-password?token=abc'
      )
    ).rejects.toThrow('SMTP email service is not configured')
  })

  it('sends email through SMTP when configured', async () => {
    delete process.env.VITEST
    process.env.NODE_ENV = 'production'

    process.env.SMTP_HOST = 'smtp.example.com'
    process.env.SMTP_USER = 'test@example.com'
    process.env.SMTP_PASSWORD = 'test-password'
    process.env.SMTP_PORT = '587'
    process.env.SMTP_FROM = 'StudyMatch <test@example.com>'

    await sendResetEmail(
      'demo@studymatch.fr',
      'http://localhost:3000/reset-password?token=abc'
    )

    expect(mocks.createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: 'test@example.com',
        pass: 'test-password'
      }
    })

    expect(mocks.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'demo@studymatch.fr',
        subject: 'StudyMatch - Reset your password'
      })
    )
  })

  it('uses secure SMTP on port 465', async () => {
    delete process.env.VITEST
    process.env.NODE_ENV = 'production'

    process.env.SMTP_HOST = 'smtp.example.com'
    process.env.SMTP_USER = 'test@example.com'
    process.env.SMTP_PASSWORD = 'test-password'
    process.env.SMTP_PORT = '465'

    await sendResetEmail(
      'demo@studymatch.fr',
      'http://localhost:3000/reset-password?token=abc'
    )

    expect(mocks.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 465,
        secure: true
      })
    )
  })
})
