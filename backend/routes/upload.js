const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { authMiddleware, mainAdminOnly } = require('../middleware/auth')
const { uploadToDrive, deleteFromDrive } = require('../utils/driveUpload')
const { normalizeBranch, isValidBranch, getBranchOptions } = require('../utils/branch')
const { appendRecord, readJSON, removeRecord } = require('../utils/jsonStore')
const { appendLog } = require('../utils/adminLog')
const { extractDriveFileId } = require('../utils/pdfLinks')
const router = express.Router()

const uploadDir = path.join(os.tmpdir(), 'smart-study-uploads')
fs.mkdirSync(uploadDir, { recursive: true })

const upload = multer({ dest: uploadDir })

function normalizeCourseCode(value = '') {
  return `${value}`.trim().toUpperCase()
}

function requireFields(body, file, fields) {
  if (!file) return 'PDF file is required'

  const missing = fields.filter(field => !body[field])
  if (missing.length > 0) return `Missing required field: ${missing.join(', ')}`

  return null
}

function cleanupFiles(...files) {
  files.filter(Boolean).forEach(file => {
    if (fs.existsSync(file)) fs.unlinkSync(file)
  })
}

function getStoredDriveFileId(record) {
  return record?.drive_file_id || extractDriveFileId(record?.drive_url)
}

async function deleteStoredDriveFile(record) {
  const fileId = getStoredDriveFileId(record)
  if (!fileId) return

  try {
    await deleteFromDrive(fileId)
  } catch (err) {
    if (err?.code === 404) return
    throw err
  }
}

// POST /api/upload/note
router.post('/note', authMiddleware, upload.single('file'), async (req, res, next) => {
  try {
    const { semester, branch, subject_code, note_type, module_number } = req.body
    const normalizedCode = normalizeCourseCode(subject_code)
    const normalizedBranch = normalizeBranch(branch)
    const validationError = requireFields(
      { ...req.body, branch: normalizedBranch, subject_code: normalizedCode },
      req.file,
      note_type === 'module'
        ? ['semester', 'branch', 'subject_code', 'note_type', 'module_number']
        : ['semester', 'branch', 'subject_code', 'note_type']
    )

    if (validationError) {
      appendLog('note_upload', { actor: req.admin.username, actorName: req.admin.name, status: 'failed', message: validationError })
      return res.status(400).json({ error: validationError })
    }
    if (!isValidBranch(normalizedBranch)) {
      const branchError = `Branch must be one of: ${getBranchOptions().join(', ')}`
      appendLog('note_upload', { actor: req.admin.username, actorName: req.admin.name, status: 'failed', message: branchError })
      return res.status(400).json({ error: branchError })
    }

    const driveFile = await uploadToDrive(req.file.path, req.file.originalname)

    const record = {
      id: `note_${Date.now()}`,
      semester: Number(semester),
      branch: normalizedBranch,
      subject_code: normalizedCode,
      subject: normalizedCode,
      type: note_type,                                       // 'module' | 'syllabus'
      module_number: note_type === 'module' ? Number(module_number) : null,
      title: req.file.originalname.replace('.pdf', ''),
      drive_file_id: driveFile.fileId,
      drive_url: `/api/files/${driveFile.fileId}`,
      uploaded_at: new Date().toISOString().split('T')[0]
    }
    await appendRecord('notes', record)
    appendLog('note_upload', {
      actor: req.admin.username,
      actorName: req.admin.name,
      status: 'success',
      message: `${normalizedCode} sem ${semester} ${note_type}${module_number ? ` ${module_number}` : ''}`
    })

    cleanupFiles(req.file.path)

    res.json({ ok: true, record })
  } catch (err) {
    appendLog('note_upload', { actor: req.admin?.username, actorName: req.admin?.name, status: 'failed', message: err.message })
    cleanupFiles(req.file?.path)
    next(err)
  }
})

// POST /api/upload/pyq
router.post('/pyq', authMiddleware, upload.single('file'), async (req, res, next) => {
  try {
    const { semester, subject_code, exam_type, year, paper_number } = req.body
    const normalizedCode = normalizeCourseCode(subject_code)
    const validationError = requireFields(
      { ...req.body, subject_code: normalizedCode },
      req.file,
      exam_type === 'SEE'
        ? ['semester', 'subject_code', 'exam_type', 'year', 'paper_number']
        : ['semester', 'subject_code', 'exam_type']
    )

    if (validationError) {
      appendLog('pyq_upload', { actor: req.admin.username, actorName: req.admin.name, status: 'failed', message: validationError })
      return res.status(400).json({ error: validationError })
    }

    const driveFile = await uploadToDrive(req.file.path, req.file.originalname)

    const record = {
      id: `pyq_${Date.now()}`,
      semester: Number(semester),
      subject_code: normalizedCode,
      subject_name: normalizedCode,
      exam_type,
      year: exam_type === 'SEE' ? Number(year) : null,
      paper_number: exam_type === 'SEE' ? Number(paper_number) : null,
      drive_file_id: driveFile.fileId,
      drive_url: `/api/files/${driveFile.fileId}`,
      uploaded_at: new Date().toISOString().split('T')[0]
    }
    await appendRecord('pyqs', record)
    appendLog('pyq_upload', {
      actor: req.admin.username,
      actorName: req.admin.name,
      status: 'success',
      message: `${normalizedCode} sem ${semester} ${exam_type}${year ? ` ${year}` : ''}`
    })

    cleanupFiles(req.file.path)

    res.json({ ok: true, record })
  } catch (err) {
    appendLog('pyq_upload', { actor: req.admin?.username, actorName: req.admin?.name, status: 'failed', message: err.message })
    cleanupFiles(req.file?.path)
    next(err)
  }
})

router.delete('/note/:id', authMiddleware, mainAdminOnly, async (req, res, next) => {
  try {
    const data = await readJSON('notes')
    const record = data.notes.find(note => note.id === req.params.id)
    if (!record) return res.status(404).json({ error: 'Note not found' })

    await deleteStoredDriveFile(record)
    await removeRecord('notes', req.params.id)

    appendLog('note_delete', {
      actor: req.admin.username,
      actorName: req.admin.name,
      status: 'success',
      message: `${record.subject} ${record.type}${record.module_number ? ` ${record.module_number}` : ''}`
    })
    res.json({ ok: true })
  } catch (err) {
    appendLog('note_delete', { actor: req.admin?.username, actorName: req.admin?.name, status: 'failed', message: err.message })
    next(err)
  }
})

router.delete('/pyq/:id', authMiddleware, mainAdminOnly, async (req, res, next) => {
  try {
    const data = await readJSON('pyqs')
    const record = data.pyqs.find(paper => paper.id === req.params.id)
    if (!record) return res.status(404).json({ error: 'PYQ not found' })

    await deleteStoredDriveFile(record)
    await removeRecord('pyqs', req.params.id)

    appendLog('pyq_delete', {
      actor: req.admin.username,
      actorName: req.admin.name,
      status: 'success',
      message: `${record.subject_code} ${record.exam_type}${record.year ? ` ${record.year}` : ''}`
    })
    res.json({ ok: true })
  } catch (err) {
    appendLog('pyq_delete', { actor: req.admin?.username, actorName: req.admin?.name, status: 'failed', message: err.message })
    next(err)
  }
})

module.exports = router
