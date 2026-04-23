import '../styles/PYQSubjectPage.css'
import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { usePYQs } from '../hooks/usePYQs'
import { getSchemeIdForSemester } from '../data/schemes'
import PDFViewer from '../components/shared/PDFViewer'
import { getDriveEmbedUrl } from '../utils/driveUrl'
import { formatCourseLabel } from '../utils/courseCatalog'

function PaperRow({ paper, label }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`paper-row ${open ? 'paper-row--open' : ''}`}>
      <button type="button" className="paper-row__header" onClick={() => setOpen(!open)}>
        <span className="paper-row__title">{label}</span>
        <span className="paper-row__action">{open ? 'Close' : 'View paper'}</span>
      </button>
      {open && (
        <div className="paper-row__viewer">
          <PDFViewer url={getDriveEmbedUrl(paper.drive_url)} />
        </div>
      )}
    </div>
  )
}

function PaperBlock({ title, description, emptyText, papers, getLabel }) {
  return (
    <section className="paper-block">
      <div className="paper-block__header">
        <div>
          <h2 className="paper-block__title">{title}</h2>
          <p className="paper-block__description">{description}</p>
        </div>
        <span className="paper-block__count">{papers.length}</span>
      </div>
      <div className="paper-block__list">
        {papers.length === 0
          ? <p className="paper-block__empty">{emptyText}</p>
          : papers.map(paper => (
            <PaperRow key={paper.id} paper={paper} label={getLabel(paper)} />
          ))
        }
      </div>
    </section>
  )
}

function parsePYQSubjectId(subjectId = '') {
  const decoded = decodeURIComponent(subjectId)
  const [semesterPart, ...codeParts] = decoded.split('-')
  const selectedSemester = Number(semesterPart)
  const subjectCode = codeParts.join('-').trim()

  if (!selectedSemester || !subjectCode) return null
  return { selectedSemester, subjectCode }
}

export default function PYQSubjectPage() {
  const { subjectId } = useParams()
  const { pyqs, loading, error } = usePYQs()

  if (loading) {
    return (
      <main className="pyq-subject-page">
        <p className="paper-block__empty">Loading...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="pyq-subject-page">
        <div className="pyq-subject-page__header">
          <Link to="/pyqs" className="subject-page__back">← Back to courses</Link>
          <h1 className="subject-page__title">Unable to load subject</h1>
          <p className="pyq-subject-page__meta">Please try again in a moment.</p>
        </div>
      </main>
    )
  }

  const parsed = parsePYQSubjectId(subjectId)
  if (!parsed) {
    return (
      <main className="pyq-subject-page">
        <div className="pyq-subject-page__header">
          <Link to="/pyqs" className="subject-page__back">← Back to courses</Link>
          <h1 className="subject-page__title">Invalid subject link</h1>
          <p className="pyq-subject-page__meta">Open PYQs and select a subject again.</p>
        </div>
      </main>
    )
  }

  const subjectPYQs = pyqs.filter(paper => (
    paper.subject_code === parsed.subjectCode &&
    paper.semester === parsed.selectedSemester
  ))
  const subjectName = subjectPYQs[0]?.subject_name || parsed.subjectCode
  const semester = subjectPYQs[0]?.semester || parsed.selectedSemester
  const schemeId = getSchemeIdForSemester(semester)
  const backPath = semester ? `/pyqs/scheme/${schemeId}/semester/${semester}` : '/pyqs'

  if (subjectPYQs.length === 0) {
    return (
      <main className="pyq-subject-page">
        <div className="pyq-subject-page__header">
          <Link to={backPath} className="subject-page__back">← Back to courses</Link>
          <h1 className="subject-page__title">{parsed.subjectCode}</h1>
          <p className="pyq-subject-page__meta">No papers found for this subject yet.</p>
        </div>
      </main>
    )
  }

  const pyqPapers = subjectPYQs
    .filter(paper => paper.exam_type === 'SEE')
    .sort((a, b) => (b.year || 0) - (a.year || 0) || (a.paper_number || 0) - (b.paper_number || 0))

  const ciePapers = subjectPYQs
    .filter(paper => paper.exam_type !== 'SEE')
    .sort((a, b) => a.exam_type.localeCompare(b.exam_type))

  return (
    <main className="pyq-subject-page">
      <div className="pyq-subject-page__header">
        <Link to={backPath} className="subject-page__back">
          ← Back to courses
        </Link>
        <h1 className="subject-page__title">{formatCourseLabel(parsed.subjectCode, subjectName)}</h1>
        {semester ? <p className="pyq-subject-page__meta">Semester {semester}</p> : null}
      </div>

      <div className="paper-block-grid">
        <PaperBlock
          title="PYQs"
          description="SEE previous year question papers."
          emptyText="No SEE PYQs uploaded yet."
          papers={pyqPapers}
          getLabel={paper => `${paper.year || 'Year'}${paper.paper_number ? ` · Paper ${paper.paper_number}` : ''}`}
        />
        <PaperBlock
          title="CIE"
          description="Internal assessment papers."
          emptyText="No CIE papers uploaded yet."
          papers={ciePapers}
          getLabel={paper => paper.exam_type.replace('CIE', 'CIE ')}
        />
      </div>
    </main>
  )
}
