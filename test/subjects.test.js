import request from 'supertest'
import app from '../src/app.js'
import { describe, it, expect } from 'vitest'

describe('STUD-10 - Strong subjects', () => {
  it('lists all subjects', async () => {
    const res = await request(app).get('/api/subjects')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('gets one subject', async () => {
    const res = await request(app).get('/api/subjects/1')
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Maths')
  })

  it('returns 404 for an unknown subject', async () => {
    const res = await request(app).get('/api/subjects/999')
    expect(res.status).toBe(404)
  })

  it('adds a subject', async () => {
    const res = await request(app).post('/api/subjects').send({ name: 'Physics', level: 'Intermediate' })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Physics')
  })

  it('refuses a subject with missing fields', async () => {
    const res = await request(app).post('/api/subjects').send({ name: 'Chemistry' })
    expect(res.status).toBe(400)
  })

  it('updates a subject', async () => {
    const res = await request(app).put('/api/subjects/1').send({ level: 'Expert' })
    expect(res.status).toBe(200)
    expect(res.body.level).toBe('Expert')
  })

  it('returns 404 when updating an unknown subject', async () => {
    const res = await request(app).put('/api/subjects/999').send({ level: 'Expert' })
    expect(res.status).toBe(404)
  })

  it('deletes a subject', async () => {
    const created = await request(app).post('/api/subjects').send({ name: 'History', level: 'Beginner' })
    const res = await request(app).delete(`/api/subjects/${created.body.id}`)
    expect(res.status).toBe(204)
  })

  it('returns 404 when deleting an unknown subject', async () => {
    const res = await request(app).delete('/api/subjects/999')
    expect(res.status).toBe(404)
  })
})
