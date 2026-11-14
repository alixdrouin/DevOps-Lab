import request from 'supertest'
import app from '../src/app.js'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { connectDatabase, getDatabase, closeDatabase } from '../src/config/database.js'

describe('STUD-11 - Publish a study session', () => {
  beforeAll(async () => {
    // Safety: never run these tests on the main database
    if (!process.env.MONGODB_URI?.endsWith('/studymatch_test')) {
      throw new Error('Tests must use studymatch_test')
    }

    await connectDatabase()
  })

  afterAll(async () => {
    // Remove only sessions created by STUD-11 tests
    await getDatabase().collection('sessions').deleteMany({
      subject: 'STUD11_TEST_MATH'
    })

    await closeDatabase()
  })

  it('publishes a study session and saves it in MongoDB', async () => {
    const sessionData = {
      subject: 'STUD11_TEST_MATH',
      date: '2030-12-10',
      time: '14:00',
      place: 'Room B12',
      maxSeats: 10
    }

    // Send a POST request to publish the session
    const res = await request(app)
      .post('/api/sessions')
      .send(sessionData)

    // Check the API response
    expect(res.status).toBe(201)
    expect(res.body.message).toBe(
      'Study session published successfully'
    )
    expect(res.body.session.subject).toBe('STUD11_TEST_MATH')
    expect(res.body.session.maxSeats).toBe(10)
    expect(res.body.session).toHaveProperty('id')

    // Check that MongoDB really saved the session
    const savedSession = await getDatabase()
      .collection('sessions')
      .findOne({ subject: 'STUD11_TEST_MATH' })

    expect(savedSession).not.toBeNull()
    expect(savedSession.place).toBe('Room B12')
    expect(savedSession.maxSeats).toBe(10)
  })

  it('shows a published session in the upcoming sessions list', async () => {
    const sessionData = {
      subject: 'STUD11_TEST_MATH',
      date: '2030-12-15',
      time: '10:00',
      place: 'Room C15',
      maxSeats: 15
    }

    const created = await request(app)
      .post('/api/sessions')
      .send(sessionData)

    expect(created.status).toBe(201)

    const res = await request(app)
      .get('/api/sessions/upcoming')

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)

    const publishedSession = res.body.find(
      session => session._id === created.body.session.id
    )

    expect(publishedSession).toBeDefined()
    expect(publishedSession.subject).toBe('STUD11_TEST_MATH')
    expect(publishedSession.place).toBe('Room C15')
  })

  it('rejects a session with a missing subject', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({
        date: '2030-12-10',
        time: '14:00',
        place: 'Room B12',
        maxSeats: 10
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Missing required fields')
  })

  it('rejects a session in the past', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({
        subject: 'Mathematics',
        date: '2020-01-10',
        time: '14:00',
        place: 'Room B12',
        maxSeats: 10
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe(
      'Session date and time must be in the future'
    )
  })

  it('rejects an invalid calendar date', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({
        subject: 'Mathematics',
        date: '2030-02-30',
        time: '14:00',
        place: 'Room B12',
        maxSeats: 10
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Invalid date or time format')
  })

  it('rejects a negative number of seats', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({
        subject: 'Mathematics',
        date: '2030-12-10',
        time: '14:00',
        place: 'Room B12',
        maxSeats: -5
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe(
      'Maximum seats must be a positive integer'
    )
  })
})
