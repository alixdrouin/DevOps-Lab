import jwt from 'jsonwebtoken'

export function requireAuth (req, res, next) {
  const authorization = req.headers.authorization

  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required'
    })
  }

  const token = authorization.slice(7)

  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        error: 'Authentication is not configured'
      })
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256']
    })

    if (!payload.sub) {
      return res.status(401).json({
        error: 'Invalid authentication token'
      })
    }

    req.user = { id: payload.sub }
    next()
  } catch {
    return res.status(401).json({
      error: 'Invalid or expired authentication token'
    })
  }
}
