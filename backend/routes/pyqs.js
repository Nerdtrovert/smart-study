const express = require('express')
const { readJSON } = require('../utils/jsonStore')
const { protectRecordPdf } = require('../utils/pdfLinks')
const router = express.Router()

// GET /api/pyqs — returns full pyqs.json
router.get('/', async (req, res, next) => {
  try {
    const data = await readJSON('pyqs')
    res.json({ ...data, pyqs: data.pyqs.map(protectRecordPdf) })
  } catch (err) { next(err) }
})

module.exports = router
