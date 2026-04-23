function extractDriveFileId(value = '') {
  const fromPath = value.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (fromPath) return fromPath[1]

  const fromQuery = value.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (fromQuery) return fromQuery[1]

  const fromApi = value.match(/\/api\/files\/([a-zA-Z0-9_-]+)/)
  return fromApi ? fromApi[1] : null
}

function protectRecordPdf(record) {
  const fileId = record.drive_file_id || extractDriveFileId(record.drive_url)

  if (!fileId) return record

  const { drive_file_id, ...publicRecord } = record

  return {
    ...publicRecord,
    drive_url: `/api/files/${fileId}`,
    pdf_url: `/api/files/${fileId}`
  }
}

module.exports = { extractDriveFileId, protectRecordPdf }
