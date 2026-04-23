export function getDriveEmbedUrl(pdfUrl) {
  if (!pdfUrl) return ''
  if (pdfUrl.startsWith('/api/files/')) return pdfUrl

  const pathMatch = pdfUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)
  const queryMatch = pdfUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  const fileId = pathMatch?.[1] || queryMatch?.[1]

  return fileId ? `/api/files/${fileId}` : pdfUrl
}
