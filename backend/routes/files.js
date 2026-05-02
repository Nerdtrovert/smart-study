const express = require('express')
const { getDriveClient } = require('../utils/driveUpload')
const { readJSON } = require('../utils/jsonStore')
const { extractDriveFileId } = require('../utils/pdfLinks')

const router = express.Router()

// ── In-memory record cache ──────────────────────────────────
// Avoids re-reading notes.json + pyqs.json on every PDF request.
// TTL: 5 minutes, max 200 entries.
const recordCache = new Map()
const CACHE_TTL_MS = 5 * 60 * 1000
const CACHE_MAX = 200

function cacheSet(key, value) {
  if (recordCache.size >= CACHE_MAX) {
    // Evict the oldest entry
    recordCache.delete(recordCache.keys().next().value)
  }
  recordCache.set(key, { value, expires: Date.now() + CACHE_TTL_MS })
}

function cacheGet(key) {
  const entry = recordCache.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expires) { recordCache.delete(key); return undefined }
  return entry.value
}

// Invalidate cache when data is updated (upload / delete)
function invalidateRecordCache() { recordCache.clear() }
// Allow other routes to call this
router.invalidateRecordCache = invalidateRecordCache

async function findKnownPdf(fileId) {
  const cached = cacheGet(fileId)
  if (cached !== undefined) return cached   // null is a valid cached result

  try {
    const [notesData, pyqsData] = await Promise.all([
      readJSON('notes'),
      readJSON('pyqs')
    ])
    const record = [...notesData.notes, ...pyqsData.pyqs].find(r => {
      const id = r.drive_file_id || extractDriveFileId(r.drive_url)
      return id === fileId
    }) || null

    cacheSet(fileId, record)
    return record
  } catch {
    return null
  }
}

function filenameFor(record) {
  const fallback = record?.subject_name || record?.subject || 'smart-study-pdf'
  const title = record?.title || fallback
  return `${title}`.replace(/[\\/:*?"<>|]+/g, '-')
}

// GET /api/files/:fileId
// Streams the PDF from Google Drive. We skip the metadata pre-flight and
// instead stream directly — Drive returns 404/403 in the stream response
// which we surface as an error. This cuts one full round-trip.
router.get('/:fileId', async (req, res, next) => {
  try {
    const { fileId } = req.params

    if (!/^[a-zA-Z0-9_-]+$/.test(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID format' })
    }

    const drive = getDriveClient()

    // Kick off record lookup and Drive stream in PARALLEL
    const [record, pdf] = await Promise.all([
      findKnownPdf(fileId),
      drive.files.get(
        { fileId, alt: 'media', supportsAllDrives: true },
        { responseType: 'stream' }
      ).catch(err => {
        const status = err.response?.status || err.code
        if (status === 404 || status === 403) {
          const e = new Error('PDF not found or access denied')
          e.statusCode = 404
          throw e
        }
        throw err
      })
    ])

    const displayName = record ? filenameFor(record) : 'smart-study'
    const contentLength = pdf.headers?.['content-length']

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `${req.query.download === '1' ? 'attachment' : 'inline'}; filename="${displayName}.pdf"`
    )
    if (contentLength) res.setHeader('Content-Length', contentLength)

    // Cache for 1 hour in the browser — PDFs don't change once uploaded
    res.setHeader('Cache-Control', 'private, max-age=3600, stale-while-revalidate=300')
    res.setHeader('X-Content-Type-Options', 'nosniff')

    pdf.data.on('error', next)
    pdf.data.pipe(res)
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message })
    next(err)
  }
})

module.exports = router
