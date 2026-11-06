import { Router } from 'express'

const router = Router()

// STUD-22: example sessions (no database yet)
const sessions = [
  { id: 1, subject: 'Maths', date: '2026-11-10', tutor: 'Alix' },
  { id: 2, subject: 'Physics', date: '2026-11-11', tutor: 'Mariem' },
  { id: 3, subject: 'English', date: '2026-11-10', tutor: 'Chaima' }
]

// Returns the date of the next day, e.g. '2026-11-09' -> '2026-11-10'
function getTomorrow (today) {
  const date = new Date(today)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

// GET the reminders to send for tomorrow's sessions
router.get('/api/reminders', (req, res) => {
  const today = req.query.today || new Date().toISOString().slice(0, 10)
  if (isNaN(new Date(today))) {
    return res.status(400).json({ error: 'Invalid date' })
  }
  const tomorrow = getTomorrow(today)
  const reminders = sessions
    .filter(s => s.date === tomorrow)
    .map(s => ({
      sessionId: s.id,
      message: `Reminder: ${s.subject} session tomorrow (${s.date}) with ${s.tutor}`
    }))
  res.status(200).json(reminders)
})

export default router
