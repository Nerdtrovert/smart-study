const express = require('express')
const { readJSON } = require('../utils/jsonStore')
const { protectRecordPdf } = require('../utils/pdfLinks')
const router = express.Router()

// GET /api/notes — returns full notes.json
router.get('/', async (req, res, next) => {
  try {
    const data = await readJSON('notes')
    res.json({ ...data, notes: data.notes.map(protectRecordPdf) })
  } catch (err) { next(err) }
})

module.exports = router
