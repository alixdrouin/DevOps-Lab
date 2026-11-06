import request from 'supertest'
import app from '../src/app.js'
import { describe, it, expect } from 'vitest'

describe('STUD-22 - Reminder the day before', () => {
  it('returns the 2 sessions happening tomorrow', async () => {
    const res = await request(app).get('/api/reminders?today=2026-11-09')
    expect(res.status).toBe(200)
    expect(res.body.length).toBe(2)
  })

  it('returns 1 session when only one is tomorrow', async () => {
    const res = await request(app).get('/api/reminders?today=2026-11-10')
    expect(res.status).toBe(200)
    expect(res.body.length).toBe(1)
    expect(res.body[0].message).toContain('Physics')
  })

  it('returns an empty list when nothing is tomorrow', async () => {
    const res = await request(app).get('/api/reminders?today=2026-12-20')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('uses the real date when no date is given', async () => {
    const res = await request(app).get('/api/reminders')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('refuses an invalid date', async () => {
    const res = await request(app).get('/api/reminders?today=hello')
    expect(res.status).toBe(400)
  })
})
