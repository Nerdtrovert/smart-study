const express = require('express')
const { getDriveClient } = require('../utils/driveUpload')
const { readJSON } = require('../utils/jsonStore')
const { extractDriveFileId } = require('../utils/pdfLinks')

const router = express.Router()

async function findKnownPdf(fileId) {
  const [notesData, pyqsData] = await Promise.all([
    readJSON('notes'),
    readJSON('pyqs')
  ])

  return [...notesData.notes, ...pyqsData.pyqs].find(record => {
    const recordFileId = record.drive_file_id || extractDriveFileId(record.drive_url)
    return recordFileId === fileId
  })
}

function filenameFor(record) {
  const fallback = record.subject_name || record.subject || 'smart-study-pdf'
  const title = record.title || fallback
  return `${title}`.replace(/[\\/:*?"<>|]+/g, '-')
}

router.get('/:fileId', async (req, res, next) => {
  try {
    const { fileId } = req.params

    const record = /^[a-zA-Z0-9_-]+$/.test(fileId) ? await findKnownPdf(fileId) : null

    if (!record) {
      return res.status(404).json({ error: 'PDF not found' })
    }

    const drive = getDriveClient()
    const pdf = await drive.files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream' }
    )

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `${req.query.download === '1' ? 'attachment' : 'inline'}; filename="${filenameFor(record)}.pdf"`
    )
    res.setHeader('Cache-Control', 'private, no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')

    pdf.data.on('error', next)
    pdf.data.pipe(res)
  } catch (err) {
    next(err)
  }
})

module.exports = router
