const { getDriveClient } = require('./driveUpload')
const { writeJSON } = require('./jsonStore')
const { normalizeBranch, isValidBranch } = require('./branch')

function toInt(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function titleFromName(name = '') {
  return `${name}`.replace(/\.pdf$/i, '').trim()
}

function normalizeExamType(value = '') {
  const cleaned = `${value}`.trim().toUpperCase().replace(/\s+/g, '')
  if (cleaned === 'SEE' || cleaned === 'PYQ') return 'SEE'
  if (cleaned === 'CIE1' || cleaned === 'CIE2' || cleaned === 'CIE3') return cleaned
  return ''
}

function normalizeUploadedAt(value, fallbackIso) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(`${value}`)) return value
  return `${fallbackIso}`.slice(0, 10)
}

function parseFilename(name = '') {
  const stem = titleFromName(name)
  const upper = stem.toUpperCase()
  const subjectMatch = upper.match(/\b[A-Z]{2,}\d{3,}[A-Z]?\b/)
  const semesterMatch = upper.match(/\b(?:SEM(?:ESTER)?)\s*[-_ ]?(\d)\b|\b(\d)\s*(?:ST|ND|RD|TH)?\s*SEM\b/)
  const moduleMatch = upper.match(/\bMODULE\s*[-_ ]?(\d+)\b/)
  const cieMatch = upper.match(/\bCIE\s*[-_ ]?([123])\b/)
  const yearMatch = upper.match(/\b(20\d{2})\b/)
  const paperMatch = upper.match(/\bPAPER\s*[-_ ]?(\d+)\b/)

  let branch = ''
  if (/\b(?:CSE|ISE|CSE[\/ _-]?ISE)\b/.test(upper)) branch = 'CSE/ISE'
  else if (/\bECE\b/.test(upper)) branch = 'ECE'
  else if (/\b(?:AI[&/ _-]?DS|AIDS)\b/.test(upper)) branch = 'AI&DS'
  else if (/\bCOMMON\b/.test(upper)) branch = 'Common'

  const noteType = /\bSYLLABUS\b/.test(upper)
    ? 'syllabus'
    : moduleMatch
      ? 'module'
      : ''

  const examType = /\bSEE\b|\bPYQ\b/.test(upper)
    ? 'SEE'
    : cieMatch
      ? `CIE${cieMatch[1]}`
      : ''

  return {
    title: stem,
    subject_code: subjectMatch ? subjectMatch[0] : '',
    semester: semesterMatch ? Number(semesterMatch[1] || semesterMatch[2]) : null,
    branch,
    note_type: noteType,
    module_number: moduleMatch ? Number(moduleMatch[1]) : null,
    exam_type: examType,
    year: yearMatch ? Number(yearMatch[1]) : null,
    paper_number: paperMatch ? Number(paperMatch[1]) : null,
  }
}

function buildNoteRecord(file, appProperties = {}) {
  const parsed = parseFilename(file.name)
  const semester = toInt(appProperties.semester) || parsed.semester
  const branch = normalizeBranch(appProperties.branch || parsed.branch)
  const subjectCode = `${appProperties.subject_code || parsed.subject_code || ''}`.trim().toUpperCase()
  const type = `${appProperties.note_type || parsed.note_type || ''}`.trim().toLowerCase()
  const moduleNumber = toInt(appProperties.module_number) || parsed.module_number
  const title = `${appProperties.title || parsed.title || titleFromName(file.name)}`.trim()
  const uploadedAt = normalizeUploadedAt(appProperties.uploaded_at, file.createdTime)

  if (!semester) return { error: 'Missing semester' }
  if (!subjectCode) return { error: 'Missing subject code' }
  if (!branch || !isValidBranch(branch)) return { error: 'Missing or invalid branch' }
  if (!type || !['module', 'syllabus'].includes(type)) return { error: 'Missing note type' }
  if (type === 'module' && !moduleNumber) return { error: 'Missing module number' }

  return {
    id: `note_${file.id}`,
    semester,
    branch,
    subject_code: subjectCode,
    subject: `${appProperties.subject || subjectCode}`.trim() || subjectCode,
    type,
    module_number: type === 'module' ? moduleNumber : null,
    title,
    drive_file_id: file.id,
    drive_url: `/api/files/${file.id}`,
    uploaded_at: uploadedAt,
  }
}

function buildPyqRecord(file, appProperties = {}) {
  const parsed = parseFilename(file.name)
  const semester = toInt(appProperties.semester) || parsed.semester
  const subjectCode = `${appProperties.subject_code || parsed.subject_code || ''}`.trim().toUpperCase()
  const examType = normalizeExamType(appProperties.exam_type || parsed.exam_type)
  const year = toInt(appProperties.year) || parsed.year
  const paperNumber = toInt(appProperties.paper_number) || parsed.paper_number
  const uploadedAt = normalizeUploadedAt(appProperties.uploaded_at, file.createdTime)

  if (!semester) return { error: 'Missing semester' }
  if (!subjectCode) return { error: 'Missing subject code' }
  if (!examType) return { error: 'Missing exam type' }
  if (examType === 'SEE' && !year) return { error: 'Missing SEE year' }
  if (examType === 'SEE' && !paperNumber) return { error: 'Missing SEE paper number' }

  return {
    id: `pyq_${file.id}`,
    semester,
    subject_code: subjectCode,
    subject_name: `${appProperties.subject_name || subjectCode}`.trim() || subjectCode,
    exam_type: examType,
    year: examType === 'SEE' ? year : null,
    paper_number: examType === 'SEE' ? paperNumber : null,
    drive_file_id: file.id,
    drive_url: `/api/files/${file.id}`,
    uploaded_at: uploadedAt,
  }
}

function recordFromDriveFile(file) {
  const appProperties = file.appProperties || {}
  const explicitType = `${appProperties.smartStudyType || ''}`.trim().toLowerCase()
  const parsed = parseFilename(file.name)

  if (explicitType === 'note' || (!explicitType && (appProperties.note_type || parsed.note_type))) {
    return { collection: 'notes', record: buildNoteRecord(file, appProperties) }
  }

  if (explicitType === 'pyq' || (!explicitType && (appProperties.exam_type || parsed.exam_type))) {
    return { collection: 'pyqs', record: buildPyqRecord(file, appProperties) }
  }

  return {
    collection: null,
    record: { error: 'Could not determine whether file is note or pyq' },
  }
}

async function listDriveCatalogFiles() {
  const drive = getDriveClient()
  const folderId = process.env.DRIVE_FOLDER_ID
  const files = []
  let pageToken

  do {
    const { data } = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false and mimeType = 'application/pdf'`,
      fields: 'nextPageToken, files(id, name, createdTime, appProperties)',
      pageSize: 1000,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      corpora: 'allDrives',
      pageToken,
    })

    files.push(...(data.files || []))
    pageToken = data.nextPageToken
  } while (pageToken)

  return files
}

async function rebuildCatalogFromDrive() {
  const files = await listDriveCatalogFiles()
  const notes = []
  const pyqs = []
  const unresolved = []

  for (const file of files) {
    const { collection, record } = recordFromDriveFile(file)
    if (record.error || !collection) {
      unresolved.push({
        fileId: file.id,
        name: file.name,
        reason: record.error || 'Unclassified file',
      })
      continue
    }

    if (collection === 'notes') notes.push(record)
    if (collection === 'pyqs') pyqs.push(record)
  }

  notes.sort((a, b) => `${a.subject_code}${a.type}${a.module_number || 0}`.localeCompare(`${b.subject_code}${b.type}${b.module_number || 0}`))
  pyqs.sort((a, b) => `${a.subject_code}${a.exam_type}${a.year || 0}${a.paper_number || 0}`.localeCompare(`${b.subject_code}${b.exam_type}${b.year || 0}${b.paper_number || 0}`))

  await writeJSON('notes', { notes })
  await writeJSON('pyqs', { pyqs })

  return {
    scanned: files.length,
    restored: notes.length + pyqs.length,
    notes: notes.length,
    pyqs: pyqs.length,
    unresolved,
  }
}

module.exports = {
  rebuildCatalogFromDrive,
  listDriveCatalogFiles,
}
