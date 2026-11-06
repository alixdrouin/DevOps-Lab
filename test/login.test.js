import request from 'supertest'
import app from '../src/app.js'
import { describe, it, expect } from 'vitest'

describe('Login (STUD-7)', () => {
  it('logs in with the right password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'demo@studymatch.fr', password: 'demo1234' })
    expect(res.status).toBe(200)
  })

  it('refuses a wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'demo@studymatch.fr', password: 'wrong' })
    expect(res.status).toBe(401)
  })

  it('logs out', async () => {
    const res = await request(app).post('/api/auth/logout')
    expect(res.status).toBe(200)
  })
})
