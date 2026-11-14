import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { MongoClient, ObjectId } from 'mongodb'
import app from '../src/app.js'

describe('STUD-12 - Edit or Cancel Session', () => {
  let client
  let sessions
  let registrations
  let sessionId

  const tutorId = 'tutor-1'
  const otherTutorId = 'tutor-2'

  function authToken (userId) {
    return jwt.sign(
      {},
      process.env.JWT_SECRET,
      {
        algorithm: 'HS256',
        subject: userId,
        expiresIn: '1h'
      }
    )
  }

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()

    // Connect the existing database helper used by the API.
    // This assumes the app's database connection is initialized
    // separately by the test setup.
    const { connectDatabase } = await import('../src/config/database.js')
    await connectDatabase()

    const db = client.db()
    sessions = db.collection('sessions')
    registrations = db.collection('registrations')
  })

  beforeEach(async () => {
    const result = await sessions.insertOne({
      tutorId,
      subject: 'Mathematics',
      date: '2026-12-10',
      time: '14:00',
      place: 'Room A',
      maxSeats: 5,
      status: 'Scheduled'
    })

    sessionId = result.insertedId
  })

  afterAll(async () => {
    if (client) {
      await client.close()
    }
  })

  it('allows the tutor to edit their session', async () => {
    const response = await request(app)
      .patch(`/api/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${authToken(tutorId)}`)
      .send({
        subject: 'Physics',
        place: 'Room B'
      })

    expect(response.status).toBe(200)
    expect(response.body.session.subject).toBe('Physics')
    expect(response.body.session.place).toBe('Room B')
  })

  it('prevents another tutor from editing the session', async () => {
    const response = await request(app)
      .patch(`/api/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${authToken(otherTutorId)}`)
      .send({ subject: 'Physics' })

    expect(response.status).toBe(403)
  })

  it('rejects maximum seats below registered students', async () => {
    await registrations.insertMany([
      {
        sessionId: new ObjectId(sessionId),
        studentId: 'student-1',
        status: 'registered'
      },
      {
        sessionId: new ObjectId(sessionId),
        studentId: 'student-2',
        status: 'registered'
      },
      {
        sessionId: new ObjectId(sessionId),
        studentId: 'student-3',
        status: 'registered'
      }
    ])

    const response = await request(app)
      .patch(`/api/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${authToken(tutorId)}`)
      .send({ maxSeats: 2 })

    expect(response.status).toBe(400)
  })

  it('allows the tutor to cancel their session', async () => {
    const response = await request(app)
      .patch(`/api/sessions/${sessionId}/cancel`)
      .set('Authorization', `Bearer ${authToken(tutorId)}`)

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('Cancelled')

    const savedSession = await sessions.findOne({
      _id: sessionId
    })

    expect(savedSession.status).toBe('Cancelled')
  })

  it('prevents another tutor from cancelling the session', async () => {
    const response = await request(app)
      .patch(`/api/sessions/${sessionId}/cancel`)
      .set('Authorization', `Bearer ${authToken(otherTutorId)}`)

    expect(response.status).toBe(403)
  })

  it('prevents editing a cancelled session', async () => {
    await sessions.updateOne(
      { _id: sessionId },
      { $set: { status: 'Cancelled' } }
    )

    const response = await request(app)
      .patch(`/api/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${authToken(tutorId)}`)
      .send({ subject: 'Physics' })

    expect(response.status).toBe(409)
  })

  it('rejects requests without authentication', async () => {
    const response = await request(app)
      .patch(`/api/sessions/${sessionId}`)
      .send({ subject: 'Physics' })

    expect(response.status).toBe(401)
  })
})
