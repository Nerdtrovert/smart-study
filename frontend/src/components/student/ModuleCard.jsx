import { useState } from 'react'
import PDFViewer from '../shared/PDFViewer'
import { getDriveEmbedUrl } from '../../utils/driveUrl'

export default function ModuleCard({ module }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <div onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
        <h3>Module {module.module_number} — {module.title}</h3>
        <span>{open ? '▲ Close' : '▼ Open'}</span>
      </div>
      {open && <PDFViewer url={getDriveEmbedUrl(module.drive_url)} />}
    </div>
  )
}
