const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { authMiddleware, mainAdminOnly } = require('../middleware/auth')
const { uploadToDrive, deleteFromDrive } = require('../utils/driveUpload')
const { normalizeBranch, isValidBranch, getBranchOptions } = require('../utils/branch')
const { appendRecord, readJSON, removeRecord, updateRecord } = require('../utils/jsonStore')
const { appendLog } = require('../utils/adminLog')
const { extractDriveFileId } = require('../utils/pdfLinks')
const filesRouter = require('./files')
const router = express.Router()

const uploadDir = path.join(os.tmpdir(), 'smart-study-uploads')
fs.mkdirSync(uploadDir, { recursive: true })

const upload = multer({ dest: uploadDir })

function normalizeCourseCode(value = '') {
  return `${value}`.trim().toUpperCase()
}

function slugPart(value = '') {
  return `${value}`
    .trim()
    .toUpperCase()
    .replace(/&/g, 'AND')
    .replace(/[\/\s]+/g, '-')
    .replace(/[^A-Z0-9_-]/g, '')
}

function buildNoteFilename({ semester, branch, subjectCode, noteType, moduleNumber }) {
  const parts = ['NOTE', `SEM${semester}`, slugPart(branch), slugPart(subjectCode)]
  parts.push(noteType === 'module' && moduleNumber ? `MODULE${moduleNumber}` : 'SYLLABUS')
  return `${parts.join('_')}.pdf`
}

function buildPyqFilename({ semester, subjectCode, examType, year, paperNumber }) {
  const parts = ['PYQ', `SEM${semester}`, slugPart(subjectCode), slugPart(examType)]
  if ((examType === 'SEE' || examType === 'PYQ') && year) parts.push(`${year}`)
  if ((examType === 'SEE' || examType === 'PYQ') && paperNumber) parts.push(`PAPER${paperNumber}`)
  return `${parts.join('_')}.pdf`
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

    const uploadedAt = new Date().toISOString().split('T')[0]
    const noteFilename = buildNoteFilename({
      semester: Number(semester),
      branch: normalizedBranch,
      subjectCode: normalizedCode,
      noteType: note_type,
      moduleNumber: note_type === 'module' ? Number(module_number) : null,
    })
    const driveFile = await uploadToDrive(req.file.path, noteFilename, {
      smartStudyType: 'note',
      semester: Number(semester),
      branch: normalizedBranch,
      subject_code: normalizedCode,
      subject: normalizedCode,
      note_type,
      module_number: note_type === 'module' ? Number(module_number) : '',
      title: note_type === 'module' ? `Module ${Number(module_number)}` : 'Syllabus',
      original_name: req.file.originalname.replace('.pdf', ''),
      uploaded_at: uploadedAt,
    })

    const record = {
      id: `note_${Date.now()}`,
      semester: Number(semester),
      branch: normalizedBranch,
      subject_code: normalizedCode,
      subject: normalizedCode,
      type: note_type,                                       // 'module' | 'syllabus'
      module_number: note_type === 'module' ? Number(module_number) : null,
      title: note_type === 'module' ? `Module ${Number(module_number)}` : 'Syllabus',
      drive_file_id: driveFile.fileId,
      drive_url: `/api/files/${driveFile.fileId}`,
      uploaded_at: uploadedAt
    }
    await appendRecord('notes', record)
    filesRouter.invalidateRecordCache()
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
    const isPyqOrSee = exam_type === 'SEE' || exam_type === 'PYQ'
    const validationError = requireFields(
      { ...req.body, subject_code: normalizedCode },
      req.file,
      isPyqOrSee
        ? ['semester', 'subject_code', 'exam_type', 'year', 'paper_number']
        : ['semester', 'subject_code', 'exam_type']
    )

    if (validationError) {
      appendLog('pyq_upload', { actor: req.admin.username, actorName: req.admin.name, status: 'failed', message: validationError })
      return res.status(400).json({ error: validationError })
    }

    const uploadedAt = new Date().toISOString().split('T')[0]
    const pyqFilename = buildPyqFilename({
      semester: Number(semester),
      subjectCode: normalizedCode,
      examType: exam_type,
      year: isPyqOrSee ? Number(year) : null,
      paperNumber: isPyqOrSee ? Number(paper_number) : null,
    })
    const driveFile = await uploadToDrive(req.file.path, pyqFilename, {
      smartStudyType: 'pyq',
      semester: Number(semester),
      subject_code: normalizedCode,
      subject_name: normalizedCode,
      exam_type,
      year: isPyqOrSee ? Number(year) : '',
      paper_number: isPyqOrSee ? Number(paper_number) : '',
      title: req.file.originalname.replace(/\.[^/.]+$/, ""),
      original_name: req.file.originalname.replace('.pdf', ''),
      uploaded_at: uploadedAt,
    })

    const record = {
      id: `pyq_${Date.now()}`,
      semester: Number(semester),
      subject_code: normalizedCode,
      subject_name: normalizedCode,
      exam_type,
      year: isPyqOrSee ? Number(year) : null,
      paper_number: isPyqOrSee ? Number(paper_number) : null,
      title: req.file.originalname.replace(/\.[^/.]+$/, ""),
      drive_file_id: driveFile.fileId,
      drive_url: `/api/files/${driveFile.fileId}`,
      uploaded_at: uploadedAt
    }
    await appendRecord('pyqs', record)
    filesRouter.invalidateRecordCache()
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

router.delete('/note/:id', authMiddleware, async (req, res, next) => {
  try {
    const data = await readJSON('notes')
    const record = data.notes.find(note => note.id === req.params.id)
    if (!record) return res.status(404).json({ error: 'Note not found' })

    await deleteStoredDriveFile(record)
    await removeRecord('notes', req.params.id)
    filesRouter.invalidateRecordCache()

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

router.delete('/pyq/:id', authMiddleware, async (req, res, next) => {
  try {
    const data = await readJSON('pyqs')
    const record = data.pyqs.find(paper => paper.id === req.params.id)
    if (!record) return res.status(404).json({ error: 'PYQ not found' })

    await deleteStoredDriveFile(record)
    await removeRecord('pyqs', req.params.id)
    filesRouter.invalidateRecordCache()

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

// PATCH /api/upload/note/:id  — edit editable fields
router.patch('/note/:id', authMiddleware, async (req, res, next) => {
  try {
    const allowed = ['title', 'module_number', 'subject_code', 'subject', 'semester', 'branch']
    const fields = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) fields[key] = req.body[key]
    }
    if (fields.subject_code !== undefined) fields.subject_code = normalizeCourseCode(fields.subject_code)
    if (fields.branch !== undefined) {
      fields.branch = normalizeBranch(fields.branch)
      if (!isValidBranch(fields.branch)) {
        return res.status(400).json({ error: `Branch must be one of: ${getBranchOptions().join(', ')}` })
      }
    }
    if (fields.module_number !== undefined && `${fields.module_number}` !== '') fields.module_number = Number(fields.module_number)
    if (fields.semester !== undefined && `${fields.semester}` !== '') fields.semester = Number(fields.semester)

    const updated = await updateRecord('notes', req.params.id, fields)
    if (!updated) return res.status(404).json({ error: 'Note not found' })
    filesRouter.invalidateRecordCache()

    appendLog('note_edit', {
      actor: req.admin.username,
      actorName: req.admin.name,
      status: 'success',
      message: `Edited note ${req.params.id}: ${JSON.stringify(fields)}`
    })
    res.json({ ok: true, record: updated })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/upload/pyq/:id  — edit editable fields
router.patch('/pyq/:id', authMiddleware, async (req, res, next) => {
  try {
    const allowed = ['subject_code', 'subject_name', 'exam_type', 'year', 'paper_number', 'semester', 'title']
    const fields = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) fields[key] = req.body[key]
    }
    if (fields.subject_code !== undefined) fields.subject_code = normalizeCourseCode(fields.subject_code)
    if (fields.exam_type !== undefined) fields.exam_type = `${fields.exam_type}`.trim().toUpperCase()
    if (fields.semester !== undefined && `${fields.semester}` !== '') fields.semester = Number(fields.semester)
    if (fields.year !== undefined && fields.year !== null && `${fields.year}` !== '') {
      fields.year = Number(fields.year)
    } else if (fields.year === null || `${fields.year}` === '') {
      fields.year = null
    }
    if (fields.paper_number !== undefined && fields.paper_number !== null && `${fields.paper_number}` !== '') {
      fields.paper_number = Number(fields.paper_number)
    } else if (fields.paper_number === null || `${fields.paper_number}` === '') {
      fields.paper_number = null
    }

    const updated = await updateRecord('pyqs', req.params.id, fields)
    if (!updated) return res.status(404).json({ error: 'PYQ not found' })
    filesRouter.invalidateRecordCache()

    appendLog('pyq_edit', {
      actor: req.admin.username,
      actorName: req.admin.name,
      status: 'success',
      message: `Edited pyq ${req.params.id}: ${JSON.stringify(fields)}`
    })
    res.json({ ok: true, record: updated })
  } catch (err) {
    next(err)
  }
})

module.exports = router
