const express = require('express')
const { readJSON, appendRecord } = require('../utils/jsonStore')
const { authMiddleware } = require('../middleware/auth')
const router = express.Router()

// POST /api/requests — student submits a request
router.post('/', async (req, res, next) => {
  try {
    const { subject, semester, message } = req.body
    if (!subject || !semester) return res.status(400).json({ error: 'subject and semester required' })

    const record = {
      id: `req_${Date.now()}`,
      subject,
      semester: Number(semester),
      message: message || '',
      submitted_at: new Date().toISOString()
    }
    await appendRecord('requests', record)
    res.json({ ok: true })
  } catch (err) { next(err) }
})

// GET /api/requests — admin only
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const data = await readJSON('requests')
    res.json(data)
  } catch (err) { next(err) }
})

module.exports = router
