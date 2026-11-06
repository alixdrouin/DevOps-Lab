import request from 'supertest'
import app from '../src/app.js'
import { describe, it, expect } from 'vitest'

describe('POST /api/auth/register', () => {
  it('accepts valid registration data', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice',
        email: 'alice@gmail.com',
        password: 'TestPassword123!'
      })

    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Registration data validated')
    expect(res.body.email).toBe('alice@gmail.com')
    expect(res.body).not.toHaveProperty('password')
  })

  it('rejects registration without password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice',
        email: 'alice@gmail.com'
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('All fields are required')
  })

  it('rejects invalid email addresses', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice',
        email: 'alicegmail.com',
        password: 'TestPassword123!'
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Invalid email address')
  })
})
