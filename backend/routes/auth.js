const express = require('express')
const jwt = require('jsonwebtoken')
const { authMiddleware } = require('../middleware/auth')
const { findAdmin } = require('../utils/adminUsers')
const { appendLog } = require('../utils/adminLog')
const router = express.Router()

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  const { username = '', password = '' } = req.body
  try {
    const admin = await findAdmin(username, password)

    if (!admin) {
      appendLog('login', { actor: username || 'unknown', status: 'failed', message: 'Invalid credentials' })
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(admin, process.env.JWT_SECRET, { expiresIn: '7d' })
    appendLog('login', { actor: admin.username, status: 'success', message: `${admin.role} logged in` })
    return res.json({ token, admin })
  } catch (err) {
    next(err)
  }
})

router.get('/me', authMiddleware, (req, res) => {
  res.json({ ok: true, admin: req.admin })
})

module.exports = router
