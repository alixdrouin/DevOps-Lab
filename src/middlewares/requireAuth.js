// TEMPORAIRE : à supprimer quand le vrai login existe
export function requireAuth(req, res, next) {
    const id = req.headers['x-user-id']
    if (!id) return res.status(401).json({ message: 'Please log in' })
    req.user = { id }
    next()
}