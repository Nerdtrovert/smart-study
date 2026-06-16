const express = require('express')
const path = require('path')
const fs = require('fs')
const { authMiddleware, mainAdminOnly } = require('../middleware/auth')
const { readJSON } = require('../utils/jsonStore')
const { protectRecordPdf } = require('../utils/pdfLinks')
const { getLogFilePath, appendLog, resetLogs, getLogSettings } = require('../utils/adminLog')
const { normalizeBranch } = require('../utils/branch')
const { rebuildCatalogFromDrive } = require('../utils/driveCatalog')
const { DATA_DIR } = require('../utils/storagePaths')
const { listAdmins, createAdmin } = require('../utils/adminUsers')
const filesRouter = require('./files')

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
      ...protectRecordPdf({ ...record, branch: normalizeBranch(record.branch) }),
      collection: 'notes',
      label: `${courseLabel(record.subject_code, record.subject)} ${record.type === 'module' ? `Module ${record.module_number}` : 'Syllabus'}`
    }))
    const pyqs = pyqsData.pyqs.map(record => {
      let suffix = record.exam_type
      if (record.exam_type === 'SEE' || record.exam_type === 'PYQ') {
        suffix = `PYQ${record.year ? ` ${record.year}` : ''}${record.paper_number ? ` Paper ${record.paper_number}` : ''}`
      } else if (record.title) {
        suffix = `${record.exam_type === 'QB' ? 'Q-Bank' : record.exam_type === 'IMP' ? 'Imp Qs' : record.exam_type === 'ASSIGNMENT' ? 'Assignment' : record.exam_type} — ${record.title}`
      } else if (record.year) {
        suffix = `${record.exam_type}${record.year ? ` ${record.year}` : ''}`
      }
      return {
        ...protectRecordPdf(record),
        collection: 'pyqs',
        label: `${courseLabel(record.subject_code, record.subject_name)} ${suffix}`
      }
    })

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

router.get('/data/:name/download', authMiddleware, mainAdminOnly, (req, res) => {
  const allowed = new Set(['notes', 'pyqs', 'requests', 'admins'])
  const name = `${req.params.name || ''}`.trim().toLowerCase()

  if (!allowed.has(name)) {
    return res.status(400).json({ error: 'Unsupported data file' })
  }

  const file = path.join(DATA_DIR, `${name}.json`)
  if (!fs.existsSync(file)) {
    return res.status(404).json({ error: `${name}.json not found` })
  }

  appendLog('data_download', {
    actor: req.admin.username,
    actorName: req.admin.name,
    status: 'success',
    message: `Downloaded ${name}.json`,
  })
  res.download(file, `smart-study-${name}-${new Date().toISOString().split('T')[0]}.json`)
})

router.get('/logs', authMiddleware, mainAdminOnly, (req, res) => {
  const file = getLogFilePath()
  res.sendFile(path.resolve(file))
})

router.get('/logs/settings', authMiddleware, mainAdminOnly, (req, res) => {
  res.json({ ok: true, ...getLogSettings() })
})

router.get('/admins', authMiddleware, mainAdminOnly, async (req, res, next) => {
  try {
    const admins = await listAdmins()
    res.json({ ok: true, admins })
  } catch (err) {
    next(err)
  }
})

router.post('/admins', authMiddleware, mainAdminOnly, async (req, res, next) => {
  try {
    const admin = await createAdmin(req.body || {})
    appendLog('admin_create', {
      actor: req.admin.username,
      actorName: req.admin.name,
      status: 'success',
      message: `Created admin ${admin.username}`,
    })
    res.status(201).json({ ok: true, admin })
  } catch (err) {
    appendLog('admin_create', {
      actor: req.admin?.username,
      actorName: req.admin?.name,
      status: 'failed',
      message: err.message,
    })
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message })
    next(err)
  }
})

router.post('/logs/reset', authMiddleware, mainAdminOnly, (req, res) => {
  resetLogs()
  res.json({ ok: true })
})

router.post('/rebuild-catalog', authMiddleware, mainAdminOnly, async (req, res, next) => {
  try {
    const summary = await rebuildCatalogFromDrive()
    filesRouter.invalidateRecordCache()
    appendLog('catalog_rebuild', {
      actor: req.admin.username,
      actorName: req.admin.name,
      status: summary.unresolved.length ? 'warning' : 'success',
      message: `Scanned ${summary.scanned}, restored ${summary.restored}, unresolved ${summary.unresolved.length}`,
    })
    res.json({ ok: true, ...summary })
  } catch (err) {
    appendLog('catalog_rebuild', {
      actor: req.admin?.username,
      actorName: req.admin?.name,
      status: 'failed',
      message: err.message,
    })
    next(err)
  }
})

module.exports = router
