import { Router } from 'express'
import StudySession from '../../models/StudySession.js'

const router = Router()

console.log('STUD-17 filter route loaded')

router.get('/api/sessions', async (req, res, next) => {
  try {
    const { subject, date } = req.query
    const filters = {}

    // Filter by subject
    if (subject !== undefined) {
      if (typeof subject !== 'string') {
        return res.status(400).json({ error: 'Invalid subject' })
      }

      if (subject.trim()) {
        const escapedSubject = subject.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        filters.subject = new RegExp(`^${escapedSubject}$`, 'i')
      }
    }

    // Filter by date
    if (date !== undefined) {
      if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
          error: 'Date must use YYYY-MM-DD format'
        })
      }

      const start = new Date(`${date}T00:00:00.000Z`)

      if (Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== date) {
        return res.status(400).json({ error: 'Invalid date' })
      }

      const end = new Date(start)
      end.setUTCDate(end.getUTCDate() + 1)

      filters.date = { $gte: start, $lt: end }
    }

    const sessions = await StudySession.find(filters)
      .sort({ date: 1, startTime: 1 })
      .lean()

    return res.status(200).json({
      message: sessions.length
        ? 'Sessions retrieved successfully'
        : 'No sessions match your filters',
      sessions
    })
  } catch (error) {
    next(error)
  }
})

export default router
