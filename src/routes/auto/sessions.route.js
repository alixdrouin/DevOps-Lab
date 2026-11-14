import { Router } from 'express'
import { getDatabase } from '../../config/database.js'

const router = Router()

// STUD-11: Publish a study session
router.post('/api/sessions', async (req, res) => {
  const { subject, date, time, place, onlineLink, maxSeats } = req.body

  // Check required fields

  // Check required fields
  if (
    typeof subject !== 'string' || !subject.trim() ||
    typeof date !== 'string' || !date.trim() ||
    typeof time !== 'string' || !time.trim() ||
    (
      (typeof place !== 'string' || !place.trim()) &&
      (typeof onlineLink !== 'string' || !onlineLink.trim())
    ) ||
    maxSeats === undefined || maxSeats === null
  ) {
    return res.status(400).json({
      error: 'Missing required fields'
    })
  }

  // Validate date and time formats
  const validDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(date)
  const validTimeFormat = /^([01]\d|2[0-3]):[0-5]\d$/.test(time)

  if (!validDateFormat || !validTimeFormat) {
    return res.status(400).json({
      error: 'Invalid date or time format'
    })
  }

  // Check that the calendar date really exists
  const [year, month, day] = date.split('-').map(Number)
  const calendarDate = new Date(Date.UTC(year, month - 1, day))

  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day
  ) {
    return res.status(400).json({
      error: 'Invalid date or time format'
    })
  }

  // STUD-11: Reject past dates
  const sessionDateTime = new Date(`${date}T${time}:00`)

  if (
    Number.isNaN(sessionDateTime.getTime()) ||
    sessionDateTime <= new Date()
  ) {
    return res.status(400).json({
      error: 'Session date and time must be in the future'
    })
  }

  // STUD-11: Validate maximum seats
  if (!Number.isInteger(maxSeats) || maxSeats <= 0) {
    return res.status(400).json({
      error: 'Maximum seats must be a positive integer'
    })
  }

  // Create a new study session
  const newSession = {
    subject,
    date,
    time,
    place: place || null,
    onlineLink: onlineLink || null,
    maxSeats,
    createdAt: new Date()
  }

  // Save the session in MongoDB
  const db = getDatabase()
  const result = await db.collection('sessions').insertOne(newSession)

  // Return the created session
  res.status(201).json({
    message: 'Study session published successfully',
    session: {
      ...newSession,
      id: result.insertedId.toString()
    }
  })
})

// STUD-11: List upcoming study sessions
router.get('/api/sessions/upcoming', async (req, res) => {
  try {
    const db = getDatabase()

    // Retrieve sessions from MongoDB
    const sessions = await db.collection('sessions').find({}).toArray()

    // Keep only future sessions
    const now = new Date()

    const upcomingSessions = sessions.filter(session => {
      const sessionDateTime = new Date(
        `${session.date}T${session.time}:00`
      )
      return sessionDateTime > now
    })

    // Sort sessions by date and time
    upcomingSessions.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}:00`)
      const dateB = new Date(`${b.date}T${b.time}:00`)
      return dateA - dateB
    })

    res.status(200).json(upcomingSessions)
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve upcoming sessions'
    })
  }
})

export default router
