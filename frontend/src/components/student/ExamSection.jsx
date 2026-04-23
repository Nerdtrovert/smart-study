import { useState } from 'react'
import PDFViewer from '../shared/PDFViewer'
import { getDriveEmbedUrl } from '../../utils/driveUrl'

// showYear: true for SEE (multiple years), false for CIE (single paper)
export default function ExamSection({ label, papers, showYear = false }) {
  const [activePaper, setActivePaper] = useState(null)

  if (papers.length === 0) return null

  return (
    <div>
      <h3>{label}</h3>
      <div>
        {papers.map(p => {
          const key = p.id
          const btnLabel = showYear ? `${p.year} · Paper ${p.paper_number}` : 'View'
          return (
            <button key={key} onClick={() => setActivePaper(activePaper === key ? null : key)}>
              {btnLabel}
            </button>
          )
        })}
      </div>
      {papers.map(p => (
        activePaper === p.id && (
          <PDFViewer key={p.id} url={getDriveEmbedUrl(p.drive_url)} />
        )
      ))}
    </div>
  )
}
