function getApiBaseUrl() {
  const base = import.meta.env.VITE_API_URL
  return base ? base.replace(/\/+$/, '') : ''
}

function buildApiFileUrl(fileId) {
  const path = `/api/files/${fileId}`
  const apiBase = getApiBaseUrl()
  return apiBase ? `${apiBase}${path}` : path
}

export function getDriveEmbedUrl(pdfUrl) {
  if (!pdfUrl) return ''
  if (pdfUrl.startsWith('/api/files/')) {
    const match = pdfUrl.match(/\/api\/files\/([a-zA-Z0-9_-]+)/)
    return match ? buildApiFileUrl(match[1]) : pdfUrl
  }

  const pathMatch = pdfUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)
  const queryMatch = pdfUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  const fileId = pathMatch?.[1] || queryMatch?.[1]

  return fileId ? buildApiFileUrl(fileId) : pdfUrl
}
