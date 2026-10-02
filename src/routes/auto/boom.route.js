/**
 * GET /boom → triggers an error to exercise the global error handler.
 */
import { Router } from 'express'

const router = Router()

router.get('/boom', (_req, _res, next) => {
  const err = new Error('Hello!')
  err.status = 500
  next(err)
})

export default router
