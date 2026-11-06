import request from 'supertest'
import app from '../src/app.js'
import { describe, it, expect } from 'vitest'

describe('STUD-23 - Cancellation alert', () => {
  it('returns an alert for each cancelled session', async () => {
    const res = await request(app).get('/api/cancellation-alerts')
    expect(res.status).toBe(200)
    expect(res.body.length).toBe(2)
  })

  it('does not alert for a planned session', async () => {
    const res = await request(app).get('/api/cancellation-alerts')
    const ids = res.body.map(a => a.sessionId)
    expect(ids).not.toContain(2)
  })

  it('writes a clear message', async () => {
    const res = await request(app).get('/api/cancellation-alerts')
    expect(res.body[0].message).toContain('Maths')
    expect(res.body[0].message).toContain('cancelled')
  })
})
