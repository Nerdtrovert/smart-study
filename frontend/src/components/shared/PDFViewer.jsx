import '../../styles/PDFViewer.css'
import { useState } from 'react'

export default function PDFViewer({ url }) {
  const [actionError, setActionError] = useState('')
  const downloadUrl = url ? (url.includes('?') ? `${url}&download=1` : `${url}?download=1`) : ''

  const fetchPdfBlob = async targetUrl => {
    const response = await fetch(targetUrl)
    if (!response.ok) {
      throw new Error('Could not open this PDF right now.')
    }

    const blob = await response.blob()
    if (!blob.size) {
      throw new Error('Received an empty PDF file.')
    }

    return blob
  }

  const printPDF = async () => {
    if (!url) return
    setActionError('')

    try {
      const blob = await fetchPdfBlob(url)
      const blobUrl = URL.createObjectURL(blob)
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = '0'
      iframe.src = blobUrl
      iframe.onload = () => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        window.setTimeout(() => {
          iframe.remove()
          URL.revokeObjectURL(blobUrl)
        }, 1000)
      }
      document.body.appendChild(iframe)
    } catch (err) {
      setActionError(err.message || 'Could not print this PDF.')
    }
  }

  const downloadPDF = async () => {
    if (!downloadUrl) return
    setActionError('')

    try {
      const blob = await fetchPdfBlob(downloadUrl)
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = 'document.pdf'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      setActionError(err.message || 'Could not download this PDF.')
    }
  }

  return (
    <div className="pdf-viewer">
      <div className="pdf-viewer__toolbar">
        <span className="pdf-viewer__title">PDF reader</span>
        <div className="pdf-viewer__actions">
          <button type="button" className="pdf-viewer__button" onClick={printPDF}>
            Print
          </button>
          <button type="button" className="pdf-viewer__button" onClick={downloadPDF}>
            Download
          </button>
        </div>
      </div>
      {actionError && <p className="pdf-viewer__error">{actionError}</p>}
      <div className="pdf-viewer__embed-container" style={{ height: '70vh', width: '100%' }}>
        <iframe
          src={`${url}#view=FitH&navpanes=0&toolbar=0`}
          title="PDF Viewer"
          width="100%"
          height="100%"
          style={{ border: 'none' }}
        />
      </div>
    </div>
  )
}
