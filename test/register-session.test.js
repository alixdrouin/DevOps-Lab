import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { MongoClient } from 'mongodb'
import app from '../src/app.js'
describe('STUD-14 - Register for a session', () => {
  let client
  let sessions
  let registrations
  let sessionId
  const createdSessionIds = []
  const studentId = '1'

  beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()

    const { connectDatabase } = await import('../src/config/database.js')
    await connectDatabase()

    const db = client.db()
    sessions = db.collection('sessions')
    registrations = db.collection('registrations')
  })

  beforeEach(async () => {
    const result = await sessions.insertOne({
      tutorId: 'tutor-1',
      subject: 'Mathematics',
      date: '2026-12-10',
      time: '14:00',
      place: 'Room A',
      maxSeats: 2,
      reservedSeats: 0,
      status: 'Scheduled'
    })

    sessionId = result.insertedId
    createdSessionIds.push(sessionId)
  })
  afterAll(async () => {
    if (client) {
      await registrations.deleteMany({
        sessionId: { $in: createdSessionIds }
      })

      await sessions.deleteMany({
        _id: { $in: createdSessionIds }
      })

      await client.close()
    }
  })
  it('allows an authenticated student to register for a session', async () => {
    const token = jwt.sign(
      {},
      process.env.JWT_SECRET,
      {
        algorithm: 'HS256',
        subject: studentId,
        expiresIn: '1h'
      }
    )

    const response = await request(app)
      .post(`/api/sessions/${sessionId}/register`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(201)
    expect(response.body.message).toBe(
      'Successfully registered for the session'
    )

    const registration = await registrations.findOne({
      sessionId,
      studentId,
      status: 'registered'
    })

    expect(registration).not.toBeNull()
  })

  it('prevents a student from registering twice', async () => {
    const token = jwt.sign({}, process.env.JWT_SECRET, {
      algorithm: 'HS256',
      subject: studentId,
      expiresIn: '1h'
    })

    const firstResponse = await request(app)
      .post(`/api/sessions/${sessionId}/register`)
      .set('Authorization', `Bearer ${token}`)

    const secondResponse = await request(app)
      .post(`/api/sessions/${sessionId}/register`)
      .set('Authorization', `Bearer ${token}`)

    expect(firstResponse.status).toBe(201)
    expect(secondResponse.status).toBe(409)

    const count = await registrations.countDocuments({
      sessionId,
      studentId,
      status: 'registered'
    })

    expect(count).toBe(1)
  })

  it('prevents registration when the session is full', async () => {
    const token = jwt.sign({}, process.env.JWT_SECRET, {
      algorithm: 'HS256',
      subject: studentId,
      expiresIn: '1h'
    })

    await registrations.insertMany([
      {
        sessionId,
        studentId: 'student-2',
        status: 'registered'
      },
      {
        sessionId,
        studentId: 'student-3',
        status: 'registered'
      }
    ])
    // Mark the session as full
    await sessions.updateOne(
      { _id: sessionId },
      {
        $set: {
          maxSeats: 2,
          reservedSeats: 2
        }
      }
    )
    const response = await request(app)
      .post(`/api/sessions/${sessionId}/register`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(409)

    const count = await registrations.countDocuments({
      sessionId,
      status: 'registered'
    })

    expect(count).toBe(2)
  })

  it('rejects registration without authentication', async () => {
    const response = await request(app)
      .post(`/api/sessions/${sessionId}/register`)

    expect(response.status).toBe(401)

    const count = await registrations.countDocuments({
      sessionId,
      status: 'registered'
    })

    expect(count).toBe(0)
  })

  it('rejects registration for a cancelled session', async () => {
    await sessions.updateOne(
      { _id: sessionId },
      { $set: { status: 'Cancelled' } }
    )

    const token = jwt.sign({}, process.env.JWT_SECRET, {
      algorithm: 'HS256',
      subject: studentId,
      expiresIn: '1h'
    })

    const response = await request(app)
      .post(`/api/sessions/${sessionId}/register`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(409)

    const count = await registrations.countDocuments({
      sessionId,
      status: 'registered'
    })

    expect(count).toBe(0)
  })

  it('prevents overbooking during simultaneous registrations', async () => {
    await sessions.updateOne(
      { _id: sessionId },
      { $set: { maxSeats: 1 } }
    )

    const createToken = (id) => jwt.sign(
      {},
      process.env.JWT_SECRET,
      {
        algorithm: 'HS256',
        subject: id,
        expiresIn: '1h'
      }
    )

    const [response1, response2] = await Promise.all([
      request(app)
        .post(`/api/sessions/${sessionId}/register`)
        .set('Authorization', `Bearer ${createToken('student-A')}`),

      request(app)
        .post(`/api/sessions/${sessionId}/register`)
        .set('Authorization', `Bearer ${createToken('student-B')}`)
    ])

    expect([response1.status, response2.status].sort()).toEqual([201, 409])

    const count = await registrations.countDocuments({
      sessionId,
      status: 'registered'
    })

    expect(count).toBe(1)
  })
})
