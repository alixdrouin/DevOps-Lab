import { Router } from 'express'

const router = Router()

// STUD-23: example sessions (temporary list, to replace later)
const sessions = [
  { id: 1, subject: 'Maths', date: '2026-11-10', tutor: 'Alix', status: 'cancelled' },
  { id: 2, subject: 'Physics', date: '2026-11-11', tutor: 'Mariem', status: 'planned' },
  { id: 3, subject: 'English', date: '2026-11-12', tutor: 'Chaima', status: 'cancelled' }
]

// GET an alert for each cancelled session
router.get('/api/cancellation-alerts', (req, res) => {
  const alerts = sessions
    .filter(s => s.status === 'cancelled')
    .map(s => ({
      sessionId: s.id,
      message: `Alert: the ${s.subject} session on ${s.date} with ${s.tutor} is cancelled`
    }))
  res.status(200).json(alerts)
})

export default router
