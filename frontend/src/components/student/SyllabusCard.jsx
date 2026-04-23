import { useState } from 'react'
import PDFViewer from '../shared/PDFViewer'
import { getDriveEmbedUrl } from '../../utils/driveUrl'

export default function SyllabusCard({ note }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button onClick={() => setOpen(!open)}>
        {open ? 'Close Syllabus' : 'View Syllabus'}
      </button>
      {open && <PDFViewer url={getDriveEmbedUrl(note.drive_url)} />}
    </div>
  )
}
