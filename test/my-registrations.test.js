import request from 'supertest'
import app from '../src/app.js'
import jwt from 'jsonwebtoken'

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { connectDatabase, getDatabase, closeDatabase } from '../src/config/database.js'

describe('STUD-19 - View my registrations', () => {
  beforeAll(async () => {
    if (!process.env.MONGODB_URI?.endsWith('/studymatch_test')) {
      throw new Error('Tests must use studymatch_test')
    }

    await connectDatabase()
  })

  afterAll(async () => {
    await closeDatabase()
  })

  it('shows a message when the student has no registrations', async () => {
    const studentId = 'STUD19_TEST_EMPTY_STUDENT'

    const existing = await getDatabase()
      .collection('registrations')
      .countDocuments({ studentId })

    expect(existing).toBe(0)

    const token = jwt.sign(
      {},
      process.env.JWT_SECRET,
      {
        algorithm: 'HS256',
        subject: studentId,
        expiresIn: '1h'
      }
    )

    const res = await request(app)
      .get('/api/my/registrations')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.upcoming).toEqual([])
    expect(res.body.past).toEqual([])
    expect(res.body.message).toBe(
      'You have no registered sessions yet.'
    )
  })

  it('lists upcoming registered sessions', async () => {
    const db = getDatabase()
    const studentId = 'STUD19_TEST_UPCOMING_STUDENT'

    const session = {
      subject: 'Mathematics',
      date: '2030-12-10',
      time: '14:00',
      place: 'Room B12',
      maxSeats: 10
    }

    const result = await db.collection('sessions')
      .insertOne(session)

    try {
      await db.collection('registrations').insertOne({
        studentId,
        sessionId: result.insertedId,
        status: 'registered'
      })

      const token = jwt.sign(
        {},
        process.env.JWT_SECRET,
        {
          algorithm: 'HS256',
          subject: studentId,
          expiresIn: '1h'
        }
      )

      const res = await request(app)
        .get('/api/my/registrations')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.upcoming).toHaveLength(1)
      expect(res.body.upcoming[0].subject).toBe('Mathematics')
      expect(res.body.upcoming[0].place).toBe('Room B12')
      expect(res.body.past).toHaveLength(0)
    } finally {
      await db.collection('registrations')
        .deleteMany({ studentId })

      await db.collection('sessions')
        .deleteOne({ _id: result.insertedId })
    }
  })

  it('lists past registered sessions', async () => {
    const db = getDatabase()
    const studentId = 'STUD19_TEST_PAST_STUDENT'

    const session = {
      subject: 'Physics',
      date: '2020-05-10',
      time: '10:00',
      place: 'Room A15',
      maxSeats: 10
    }

    const result = await db.collection('sessions')
      .insertOne(session)

    try {
      await db.collection('registrations').insertOne({
        studentId,
        sessionId: result.insertedId,
        status: 'registered'
      })

      const token = jwt.sign(
        {},
        process.env.JWT_SECRET,
        {
          algorithm: 'HS256',
          subject: studentId,
          expiresIn: '1h'
        }
      )

      const res = await request(app)
        .get('/api/my/registrations')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.past).toHaveLength(1)
      expect(res.body.past[0].subject).toBe('Physics')
      expect(res.body.past[0].place).toBe('Room A15')
      expect(res.body.upcoming).toHaveLength(0)
    } finally {
      await db.collection('registrations')
        .deleteMany({ studentId })

      await db.collection('sessions')
        .deleteOne({ _id: result.insertedId })
    }
  })

  it('rejects unauthenticated students', async () => {
    const res = await request(app)
      .get('/api/my/registrations')

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Authentication required')
  })

  it('sorts upcoming sessions by date and time', async () => {
    const db = getDatabase()
    const studentId = 'STUD19_TEST_SORT_STUDENT'

    const sessions = [
      {
        subject: 'Physics',
        date: '2030-12-15',
        time: '14:00',
        place: 'Room B'
      },
      {
        subject: 'Mathematics',
        date: '2030-12-10',
        time: '09:00',
        place: 'Room A'
      }
    ]

    const result = await db.collection('sessions')
      .insertMany(sessions)

    const sessionIds = Object.values(result.insertedIds)

    try {
      await db.collection('registrations').insertMany(
        sessionIds.map(sessionId => ({
          studentId,
          sessionId,
          status: 'registered'
        }))
      )

      const token = jwt.sign(
        {},
        process.env.JWT_SECRET,
        {
          algorithm: 'HS256',
          subject: studentId,
          expiresIn: '1h'
        }
      )

      const res = await request(app)
        .get('/api/my/registrations')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.upcoming).toHaveLength(2)
      expect(res.body.upcoming[0].subject).toBe('Mathematics')
      expect(res.body.upcoming[1].subject).toBe('Physics')
    } finally {
      await db.collection('registrations')
        .deleteMany({ studentId })

      await db.collection('sessions')
        .deleteMany({ _id: { $in: sessionIds } })
    }
  })

  it('sorts past sessions from newest to oldest', async () => {
    const db = getDatabase()
    const studentId = 'STUD19_TEST_PAST_SORT_STUDENT'

    const sessions = [
      {
        subject: 'History',
        date: '2020-01-10',
        time: '10:00',
        place: 'Room A'
      },
      {
        subject: 'Biology',
        date: '2022-06-15',
        time: '14:00',
        place: 'Room B'
      }
    ]

    const result = await db.collection('sessions')
      .insertMany(sessions)

    const sessionIds = Object.values(result.insertedIds)

    try {
      await db.collection('registrations').insertMany(
        sessionIds.map(sessionId => ({
          studentId,
          sessionId,
          status: 'registered'
        }))
      )

      const token = jwt.sign(
        {},
        process.env.JWT_SECRET,
        {
          algorithm: 'HS256',
          subject: studentId,
          expiresIn: '1h'
        }
      )

      const res = await request(app)
        .get('/api/my/registrations')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.past).toHaveLength(2)
      expect(res.body.past[0].subject).toBe('Biology')
      expect(res.body.past[1].subject).toBe('History')
    } finally {
      await db.collection('registrations')
        .deleteMany({ studentId })

      await db.collection('sessions')
        .deleteMany({ _id: { $in: sessionIds } })
    }
  })
})
