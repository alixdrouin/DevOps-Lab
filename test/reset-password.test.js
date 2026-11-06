import express from 'express'
import request from 'supertest'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { users } from '../src/data/users.js'
import resetPasswordRouter from '../src/routes/auto/reset-password.route.js'
import loginRouter from '../src/routes/auto/login.route.js'
import { sendResetEmail } from '../src/services/email.service.js'

const sentEmails = vi.hoisted(() => [])

vi.mock('../src/services/email.service.js', () => ({
  sendResetEmail: vi.fn(async (email, resetLink) => {
    sentEmails.push({ to: email, resetLink })
  })
}))

const app = express()
app.use(express.json())
app.use(resetPasswordRouter)
app.use(loginRouter)

const email = 'demo@studymatch.fr'
const demoUser = users.find(u => u.email === email)
const originalPassword = demoUser.password

beforeEach(() => {
  sentEmails.length = 0
  demoUser.password = originalPassword
  vi.mocked(sendResetEmail).mockReset()
  vi.mocked(sendResetEmail).mockImplementation(async (to, resetLink) => {
    sentEmails.push({ to, resetLink })
  })
})

afterEach(() => {
  vi.useRealTimers()
  demoUser.password = originalPassword
})

async function requestResetLink () {
  const response = await request(app)
    .post('/api/auth/forgot-password')
    .send({ email })

  expect(response.status).toBe(200)
  expect(sentEmails).toHaveLength(1)

  return new URL(sentEmails[0].resetLink).searchParams.get('token')
}

describe('Reset Password (STUD-8)', () => {
  it('accepts a password reset request', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email })

    expect(response.status).toBe(200)
    expect(sentEmails).toHaveLength(1)
    expect(sentEmails[0].to).toBe(email)
  })

  it('does not reveal whether an email exists', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'unknown@example.com' })

    expect(response.status).toBe(200)
    expect(sentEmails).toHaveLength(0)
  })

  it('rejects a missing email', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({})

    expect(response.status).toBe(400)
  })

  it('rejects an invalid token', async () => {
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: 'invalid-token',
        newPassword: 'NewPassword123!'
      })

    expect(response.status).toBe(400)
  })

  it('rejects a short password', async () => {
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: 'invalid-token',
        newPassword: '123'
      })

    expect(response.status).toBe(400)
  })

  it('sends a reset link containing a token', async () => {
    const token = await requestResetLink()

    expect(token).toBeTruthy()
    expect(token.length).toBe(64)
  })

  it('resets the password and allows login', async () => {
    const token = await requestResetLink()

    const resetResponse = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token,
        newPassword: 'NewPassword123!'
      })

    expect(resetResponse.status).toBe(200)

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email,
        password: 'NewPassword123!'
      })

    expect(loginResponse.status).toBe(200)
  })

  it('prevents reuse of a reset token', async () => {
    const token = await requestResetLink()

    const first = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token,
        newPassword: 'NewPassword123!'
      })

    const second = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token,
        newPassword: 'AnotherPassword123!'
      })

    expect(first.status).toBe(200)
    expect(second.status).toBe(400)
  })

  it('rejects expired reset tokens', async () => {
    const token = await requestResetLink()

    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(Date.now() + 16 * 60 * 1000)

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token,
        newPassword: 'NewPassword123!'
      })

    expect(response.status).toBe(400)
  })

  it('rejects an empty reset token', async () => {
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: '',
        newPassword: 'NewPassword123!'
      })

    expect(response.status).toBe(400)
  })

  it('accepts an email regardless of letter case', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'DEMO@STUDYMATCH.FR' })

    expect(response.status).toBe(200)
    expect(sentEmails).toHaveLength(1)
  })

  it('rejects an email containing only spaces', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: '   ' })

    expect(response.status).toBe(400)
  })

  it('rejects a non-string email', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 123 })

    expect(response.status).toBe(400)
  })

  it('returns 503 when email delivery fails', async () => {
    vi.mocked(sendResetEmail).mockRejectedValueOnce(
      new Error('SMTP unavailable')
    )

    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email })

    expect(response.status).toBe(503)
    expect(response.body.error).toBe(
      'Password reset email service is unavailable'
    )
  })

  it('rejects a reset link when the user no longer exists', async () => {
    const token = await requestResetLink()
    const index = users.findIndex(u => u.email === email)
    const removedUser = users.splice(index, 1)[0]

    try {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token,
          newPassword: 'NewPassword123!'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Invalid reset link')
    } finally {
      users.splice(index, 0, removedUser)
    }
  })
})
