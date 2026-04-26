const express = require('express')
const path = require('path')
const { authMiddleware, mainAdminOnly } = require('../middleware/auth')
const { readJSON } = require('../utils/jsonStore')
const { protectRecordPdf } = require('../utils/pdfLinks')
const { getLogFilePath, appendLog, resetLogs, getLogSettings } = require('../utils/adminLog')

const router = express.Router()

function courseLabel(code, name) {
  const normalizedCode = `${code || ''}`.trim().toUpperCase()
  const cleanName = `${name || ''}`.trim()
  if (!normalizedCode) return cleanName
  if (!cleanName || cleanName.toUpperCase() === normalizedCode) return normalizedCode
  return `${normalizedCode} - ${cleanName}`
}

router.get('/me', authMiddleware, (req, res) => {
  res.json({ ok: true, admin: req.admin })
})

router.get('/files', authMiddleware, async (req, res, next) => {
  try {
    const [notesData, pyqsData] = await Promise.all([
      readJSON('notes'),
      readJSON('pyqs')
    ])

    const notes = notesData.notes.map(record => ({
      ...protectRecordPdf(record),
      collection: 'notes',
      label: `${courseLabel(record.subject_code, record.subject)} ${record.type === 'module' ? `Module ${record.module_number}` : 'Syllabus'}`
    }))
    const pyqs = pyqsData.pyqs.map(record => ({
      ...protectRecordPdf(record),
      collection: 'pyqs',
      label: `${courseLabel(record.subject_code, record.subject_name)} ${record.exam_type}${record.year ? ` ${record.year}` : ''}`
    }))

    res.json({ files: [...notes, ...pyqs], canDelete: Boolean(req.admin?.isMain) })
  } catch (err) {
    next(err)
  }
})

router.get('/logs/download', authMiddleware, mainAdminOnly, (req, res) => {
  const file = getLogFilePath()
  appendLog('log_download', {
    actor: req.admin.username,
    actorName: req.admin.name,
    status: 'success',
    message: 'Admin log downloaded'
  })
  res.download(file, `smart-study-admin-${new Date().toISOString().split('T')[0]}.log`)
})

router.get('/logs', authMiddleware, mainAdminOnly, (req, res) => {
  const file = getLogFilePath()
  res.sendFile(path.resolve(file))
})

router.get('/logs/settings', authMiddleware, mainAdminOnly, (req, res) => {
  res.json({ ok: true, ...getLogSettings() })
})

router.post('/logs/reset', authMiddleware, mainAdminOnly, (req, res) => {
  resetLogs()
  res.json({ ok: true })
})

module.exports = router
