import '../../styles/PDFViewer.css'
import { useState, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

// Load worker only once — use a local CDN-relative path for speed
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

// Detect mobile once at module level (doesn't change after load)
const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches

export default function PDFViewer({ url, filename = 'Smart_Study_Document.pdf' }) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [error, setError] = useState('')
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const containerRef = useRef(null)

  const downloadUrl = url ? (url.includes('?') ? `${url}&download=1` : `${url}?download=1`) : ''

  useEffect(() => {
    setPageNumber(1)
    setError('')
  }, [url])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(console.error)
    } else {
      document.exitFullscreen()
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toolbar = (
    <div className="pdf-viewer__toolbar">
      <div className="pdf-viewer__title-group">
        <svg className="pdf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        <span className="pdf-viewer__title">Document Reader</span>
      </div>
      <div className="pdf-viewer__actions">
        <button type="button" className="pdf-viewer__button" onClick={toggleFullscreen} title="Toggle Fullscreen">
          {isFullscreen
            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
          }
          <span className="sr-only">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
        </button>

        <a href={url} target="_blank" rel="noopener noreferrer" className="pdf-viewer__button" title="Open in New Tab">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          <span className="sr-only">Open</span>
        </a>

        <a href={downloadUrl} download={filename} className="pdf-viewer__button pdf-viewer__button--primary" title="Download PDF">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          <span className="button-text">Download</span>
        </a>
      </div>
    </div>
  )

  return (
    <div className={`pdf-viewer ${isFullscreen ? 'pdf-viewer--fullscreen' : ''}`} ref={containerRef}>
      {toolbar}

      <div className="pdf-viewer__embed-container">
        {error ? (
          <div className="pdf-viewer__error" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e07070' }}>
            {error}
          </div>

        ) : isMobile ? (
          /* ── Mobile: react-pdf — all pages stacked ─────────── */
          <div className="pdf-viewer__document">
            <Document
              file={url}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              onLoadError={err => setError(err.message)}
              loading={<div style={{ color: '#888', padding: '40px', textAlign: 'center' }}>Loading…</div>}
            >
              {numPages && Array.from({ length: numPages }, (_, i) => (
                <Page
                  key={i + 1}
                  pageNumber={i + 1}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  loading={null}
                  style={{ marginBottom: '8px' }}
                />
              ))}
            </Document>
          </div>

        ) : (
          /* ── Desktop: native browser iframe — instant! ─────── */
          <iframe
            key={url}
            src={url}
            title="PDF Viewer"
            className="pdf-viewer__iframe"
          />
        )}
      </div>

    </div>
  )
}

