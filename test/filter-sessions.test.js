import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import StudySession from '../src/models/StudySession.js'

vi.mock('../src/models/StudySession.js', () => ({
  default: {
    find: vi.fn()
  }
}))

describe('STUD-17 - Filter Sessions', () => {
  const sessions = [
    {
      subject: 'Math',
      date: new Date('2026-11-15'),
      startTime: '10:00'
    },
    {
      subject: 'Physics',
      date: new Date('2026-11-16'),
      startTime: '14:00'
    },
    {
      subject: 'Math',
      date: new Date('2026-11-17'),
      startTime: '09:00'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    StudySession.find.mockImplementation((filters) => {
      const results = sessions.filter((session) => {
        const subjectMatches =
          !filters.subject || filters.subject.test(session.subject)

        const dateMatches =
          !filters.date ||
          (session.date >= filters.date.$gte &&
            session.date < filters.date.$lt)

        return subjectMatches && dateMatches
      })

      return {
        sort: () => ({
          lean: async () => results
        })
      }
    })
  })

  it('returns all sessions without filters', async () => {
    const res = await request(app).get('/api/sessions')

    expect(res.status).toBe(200)
    expect(res.body.sessions).toHaveLength(3)
  })

  it('filters sessions by subject', async () => {
    const res = await request(app)
      .get('/api/sessions')
      .query({ subject: 'Math' })

    expect(res.status).toBe(200)
    expect(res.body.sessions).toHaveLength(2)
    expect(res.body.sessions.every(s => s.subject === 'Math')).toBe(true)
  })

  it('filters sessions by date', async () => {
    const res = await request(app)
      .get('/api/sessions')
      .query({ date: '2026-11-16' })

    expect(res.status).toBe(200)
    expect(res.body.sessions).toHaveLength(1)
    expect(res.body.sessions[0].subject).toBe('Physics')
  })

  it('combines subject and date filters', async () => {
    const res = await request(app)
      .get('/api/sessions')
      .query({ subject: 'Math', date: '2026-11-15' })

    expect(res.status).toBe(200)
    expect(res.body.sessions).toHaveLength(1)
    expect(res.body.sessions[0].subject).toBe('Math')
  })

  it('returns a message when no sessions match', async () => {
    const res = await request(app)
      .get('/api/sessions')
      .query({ subject: 'Chemistry' })

    expect(res.status).toBe(200)
    expect(res.body.sessions).toEqual([])
    expect(res.body.message).toBe('No sessions match your filters')
  })

  it('resets filters to show all sessions', async () => {
    await request(app)
      .get('/api/sessions')
      .query({ subject: 'Math' })

    const res = await request(app).get('/api/sessions')

    expect(res.status).toBe(200)
    expect(res.body.sessions).toHaveLength(3)
  })

  it('rejects invalid dates', async () => {
    const res = await request(app)
      .get('/api/sessions')
      .query({ date: '2026-13-45' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Invalid date')
  })
})
