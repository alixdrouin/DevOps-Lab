import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'

describe('STUD-9 - Fill My Profile API', () => {
  const profile = {
    name: 'Mariem',
    year: 4,
    major: 'Data Science and AI',
    bio: 'Engineering student interested in AI.'
  }

  it('should create a student profile', async () => {
    const res = await request(app)
      .put('/api/profiles/1')
      .send(profile)

    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Mariem')
    expect(res.body.year).toBe(4)
    expect(res.body.major).toBe('Data Science and AI')
    expect(res.body.bio).toBe(profile.bio)
  })

  it('should allow other users to view the profile', async () => {
    const res = await request(app).get('/api/profiles/1')

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Mariem')
  })

  it('should allow updating the profile', async () => {
    const updatedProfile = {
      ...profile,
      bio: 'I am interested in Machine Learning.'
    }

    const res = await request(app)
      .put('/api/profiles/1')
      .send(updatedProfile)

    expect(res.status).toBe(200)
    expect(res.body.bio).toBe(updatedProfile.bio)

    const getRes = await request(app).get('/api/profiles/1')
    expect(getRes.body.bio).toBe(updatedProfile.bio)
  })

  it('should reject missing required fields', async () => {
    const res = await request(app)
      .put('/api/profiles/2')
      .send({ name: 'Student' })

    expect(res.status).toBe(400)
  })

  it('should return 404 for a nonexistent profile', async () => {
    const res = await request(app).get('/api/profiles/999')

    expect(res.status).toBe(404)
  })
})
it('should reject an invalid profile ID', async () => {
  const res = await request(app)
    .put('/api/profiles/0')
    .send({
      name: 'Mariem',
      year: 4,
      major: 'Data Science and AI',
      bio: 'Engineering student interested in AI.'
    })

  expect(res.status).toBe(400)
  expect(res.body.error).toBe('Invalid profile ID')
})
