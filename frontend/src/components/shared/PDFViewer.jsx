import '../../styles/PDFViewer.css'

export default function PDFViewer({ url }) {
  const downloadUrl = url ? (url.includes('?') ? `${url}&download=1` : `${url}?download=1`) : ''

  const printPDF = () => {
    if (!url) return

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.src = url
    iframe.onload = () => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      window.setTimeout(() => iframe.remove(), 1000)
    }
    document.body.appendChild(iframe)
  }

  return (
    <div className="pdf-viewer">
      <div className="pdf-viewer__toolbar">
        <span className="pdf-viewer__title">PDF reader</span>
        <div className="pdf-viewer__actions">
          <button type="button" className="pdf-viewer__button" onClick={printPDF}>
            Print
          </button>
          <a className="pdf-viewer__button" href={downloadUrl}>
            Download
          </a>
        </div>
      </div>
      <div className="pdf-viewer__embed-container" style={{ height: '70vh', width: '100%' }}>
        <iframe
          src={url}
          title="PDF Viewer"
          width="100%"
          height="100%"
          style={{ border: 'none' }}
        />
      </div>
    </div>
  )
}
