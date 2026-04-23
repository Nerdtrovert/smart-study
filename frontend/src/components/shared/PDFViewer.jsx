import '../../styles/PDFViewer.css'
import { useState, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

export default function PDFViewer({ url }) {
  const [numPages, setNumPages] = useState(null)
  const [width, setWidth] = useState(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.getBoundingClientRect().width)
    }
  }, [])

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
    <div className="pdf-viewer" ref={containerRef}>
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
      <Document
        file={url}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={<p className="pdf-viewer__loading">Loading PDF...</p>}
        error={<p className="pdf-viewer__error">Failed to load PDF. Try refreshing.</p>}
      >
        <div className="pdf-viewer__pages">
          {Array.from({ length: numPages }, (_, i) => (
            <Page key={i + 1} pageNumber={i + 1} width={width || undefined}
              renderTextLayer renderAnnotationLayer={false} />
          ))}
        </div>
      </Document>
    </div>
  )
}
