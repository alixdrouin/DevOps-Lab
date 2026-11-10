import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../src/models/StudySession.js', () => ({ default: { findById: vi.fn() } }))
vi.mock('../src/models/Registration.js', () => ({ default: { find: vi.fn() } }))

const { default: StudySession } = await import('../src/models/StudySession.js')
const { default: Registration } = await import('../src/models/Registration.js')
const { getRegisteredStudents } = await import('../src/services/registrations.service.js')

const SESSION_ID = '64b7f0c2a1b2c3d4e5f60001'
const TUTOR_ID = '64b7f0c2a1b2c3d4e5f60002'
const OTHER_ID = '64b7f0c2a1b2c3d4e5f60003'

const mockSession = (value) =>
  StudySession.findById.mockReturnValue({ select: () => ({ lean: () => Promise.resolve(value) }) })

const mockRegistrations = (value) =>
  Registration.find.mockReturnValue({
    sort: () => ({ populate: () => ({ lean: () => Promise.resolve(value) }) })
  })

describe('getRegisteredStudents', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects an invalid id with 400', async () => {
    await expect(getRegisteredStudents('abc', TUTOR_ID)).rejects.toMatchObject({ status: 400 })
  })

  it('returns 404 when the session does not exist', async () => {
    mockSession(null)
    await expect(getRegisteredStudents(SESSION_ID, TUTOR_ID)).rejects.toMatchObject({ status: 404 })
  })

  it('returns 403 when the requester is not the tutor', async () => {
    mockSession({ tutor: TUTOR_ID, capacity: 5 })
    await expect(getRegisteredStudents(SESSION_ID, OTHER_ID)).rejects.toMatchObject({ status: 403 })
    expect(Registration.find).not.toHaveBeenCalled()
  })

  it('returns students (name, year, major) and seats taken / max for the tutor', async () => {
    mockSession({ tutor: TUTOR_ID, capacity: 5 })
    mockRegistrations([
      { student: { _id: 's1', name: 'Alice', year: 3, major: 'Data' } },
      { student: { _id: 's2', name: 'Bob', year: 2, major: 'Finance' } }
    ])

    const result = await getRegisteredStudents(SESSION_ID, TUTOR_ID)

    expect(result.seats).toEqual({ taken: 2, max: 5 })
    expect(result.students).toEqual([
      { id: 's1', name: 'Alice', year: 3, major: 'Data' },
      { id: 's2', name: 'Bob', year: 2, major: 'Finance' }
    ])
    expect(Registration.find).toHaveBeenCalledWith({ session: SESSION_ID, status: 'Confirmed' })
  })

  it('returns an empty list with 0 seats taken when nobody registered', async () => {
    mockSession({ tutor: TUTOR_ID, capacity: 10 })
    mockRegistrations([])
    const result = await getRegisteredStudents(SESSION_ID, TUTOR_ID)
    expect(result.seats).toEqual({ taken: 0, max: 10 })
    expect(result.students).toEqual([])
  })
})
