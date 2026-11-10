import express from 'express'
import { requireAuth } from '../middlewares/requireAuth.js' // owned by the auth module
import { listSessionRegistrations } from '../controllers/registrations.controller.js'

const router = express.Router()

// GET /api/sessions/:id/registrations
router.get('/:id/registrations', requireAuth, listSessionRegistrations)

export default router