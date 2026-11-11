import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { getDatabase } from '../../config/database.js'
import { requireAuth } from '../../middleware/auth.js'

const router = Router()

// STUD-12: Edit a tutoring session
router.patch('/api/sessions/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params
    const { subject, date, time, place, maxSeats } = req.body

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid session ID' })
    }

    const tutorId = req.user.id
    const db = getDatabase()
    const sessions = db.collection('sessions')

    const session = await sessions.findOne({
      _id: new ObjectId(id)
    })

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      })
    }

    // Only the tutor who owns the session can edit it
    if (String(session.tutorId) !== String(tutorId)) {
      return res.status(403).json({
        error: 'Only the tutor can edit this session'
      })
    }

    // Cancelled sessions cannot be edited
    if (session.status === 'Cancelled') {
      return res.status(409).json({
        error: 'Cannot edit a cancelled session'
      })
    }

    const updates = {}

    if (subject !== undefined) updates.subject = subject
    if (date !== undefined) updates.date = date
    if (time !== undefined) updates.time = time
    if (place !== undefined) updates.place = place

    if (maxSeats !== undefined) {
      if (!Number.isInteger(maxSeats) || maxSeats < 1) {
        return res.status(400).json({
          error: 'Invalid maximum seats'
        })
      }

      const registeredCount = await db
        .collection('registrations')
        .countDocuments({
          sessionId: session._id,
          status: 'registered'
        })

      if (maxSeats < registeredCount) {
        return res.status(400).json({
          error: 'Maximum seats cannot be lower than registered students'
        })
      }

      updates.maxSeats = maxSeats
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'No valid fields provided'
      })
    }

    await sessions.updateOne(
      { _id: session._id },
      { $set: updates }
    )

    const updatedSession = await sessions.findOne({
      _id: session._id
    })

    return res.status(200).json({
      message: 'Session updated successfully',
      session: updatedSession
    })
  } catch (error) {
    next(error)
  }
})

// STUD-12: Cancel a tutoring session
router.patch('/api/sessions/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid session ID'
      })
    }

    const tutorId = req.user.id
    const db = getDatabase()
    const sessions = db.collection('sessions')

    const session = await sessions.findOne({
      _id: new ObjectId(id)
    })

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      })
    }

    // Only the session's tutor can cancel it
    if (String(session.tutorId) !== String(tutorId)) {
      return res.status(403).json({
        error: 'Only the tutor can cancel this session'
      })
    }

    if (session.status === 'Cancelled') {
      return res.status(409).json({
        error: 'Session already cancelled'
      })
    }

    await sessions.updateOne(
      { _id: session._id },
      { $set: { status: 'Cancelled' } }
    )

    return res.status(200).json({
      message: 'Session cancelled successfully',
      status: 'Cancelled'
    })
  } catch (error) {
    next(error)
  }
})

export default router
