const express = require('express')
const { readJSON } = require('../utils/jsonStore')
const { protectRecordPdf } = require('../utils/pdfLinks')
const { normalizeBranch } = require('../utils/branch')
const router = express.Router()

// GET /api/notes — returns full notes.json
router.get('/', async (req, res, next) => {
  try {
    const data = await readJSON('notes')
    const notes = data.notes.map(record => ({
      ...record,
      branch: normalizeBranch(record.branch),
    }))
    res.json({ ...data, notes: notes.map(protectRecordPdf) })
  } catch (err) { next(err) }
})

module.exports = router
