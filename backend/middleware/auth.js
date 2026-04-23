const jwt = require('jsonwebtoken')

function authMiddleware(req, res, next) {
  const header = req.headers['authorization']
  if (!header) return res.status(401).json({ error: 'No token' })

  const token = header.split(' ')[1]
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET)
    if (!req.admin.username) throw new Error('Invalid admin token')
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

function mainAdminOnly(req, res, next) {
  if (!req.admin?.isMain) return res.status(403).json({ error: 'Main admin only' })
  next()
}

module.exports = { authMiddleware, mainAdminOnly }
