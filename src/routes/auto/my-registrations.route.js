import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { getDatabase } from '../../config/database.js'
import { requireAuth } from '../../middleware/auth.js'

const router = Router()

// STUD-19: View my registered sessions
router.get('/api/my/registrations', requireAuth, async (req, res, next) => {
  try {
    const studentId = req.user.id
    const db = getDatabase()

    const registrations = await db.collection('registrations')
      .find({ studentId, status: 'registered' })
      .toArray()

    const sessionIds = registrations.map(registration => registration.sessionId)

    const sessions = await db.collection('sessions')
      .find({ _id: { $in: sessionIds.map(id => new ObjectId(id)) } })
      .toArray()

    const now = new Date()

    const upcoming = []
    const past = []

    for (const session of sessions) {
      const sessionDateTime = new Date(`${session.date}T${session.time}:00`)

      if (sessionDateTime > now) {
        upcoming.push(session)
      } else {
        past.push(session)
      }
    }

    upcoming.sort((a, b) =>
      new Date(`${a.date}T${a.time}:00`) -
      new Date(`${b.date}T${b.time}:00`)
    )

    past.sort((a, b) =>
      new Date(`${b.date}T${b.time}:00`) -
      new Date(`${a.date}T${a.time}:00`)
    )

    return res.status(200).json({
      upcoming,
      past,
      message: registrations.length === 0
        ? 'You have no registered sessions yet.'
        : null
    })
  } catch (error) {
    next(error)
  }
})

export default router
