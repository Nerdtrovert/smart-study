import '../styles/SubjectPage.css'
import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { useNotes } from '../hooks/useNotes'
import { getSchemeIdForSemester } from '../data/schemes'
import PDFViewer from '../components/shared/PDFViewer'
import { getDriveEmbedUrl } from '../utils/driveUrl'
import { formatCourseLabel } from '../utils/courseCatalog'

function SyllabusCard({ note }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`syllabus-card ${open ? 'syllabus-card--open' : ''}`}>
      <div className="syllabus-card__label">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="syllabus-card__icon">S</div>
          <div>
            <div className="syllabus-card__text">Syllabus</div>
            <div className="syllabus-card__sub">Course outline & modules</div>
          </div>
        </div>
        <button className="btn btn--blue" onClick={() => setOpen(!open)}>
          {open ? 'Close' : 'View syllabus'}
        </button>
      </div>
      {open && (
        <div className="syllabus-card__viewer">
          <PDFViewer url={getDriveEmbedUrl(note.drive_url)} />
        </div>
      )}
    </div>
  )
}

function ModuleCard({ module }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`module-card ${open ? 'module-card--open' : ''}`}>
      <div className="module-card__header" onClick={() => setOpen(!open)}>
        <div className="module-card__left">
          <span className="module-card__num">{module.module_number}</span>
          <span className="module-card__title">{module.title}</span>
        </div>
        <span className="module-card__chevron">▼</span>
      </div>
      {open && (
        <div className="module-card__body">
          <PDFViewer url={getDriveEmbedUrl(module.drive_url)} />
        </div>
      )}
    </div>
  )
}

function parseSubjectId(subjectId = '') {
  const decoded = decodeURIComponent(subjectId)
  const [semesterPart, branch, ...subjectCodeParts] = decoded.split('-')
  const semester = Number(semesterPart)
  const subjectCode = subjectCodeParts.join('-').trim()

  if (!semester || !branch || !subjectCode) return null
  return { semester, branch, subjectCode }
}

export default function SubjectPage() {
  const { subjectId } = useParams()
  const { notes, loading, error } = useNotes()

  if (loading) return (
    <main className="subject-page">
      <p className="subject-page__loading">Loading...</p>
    </main>
  )

  if (error) {
    return (
      <main className="subject-page">
        <div className="subject-page__header">
          <Link to="/notes" className="subject-page__back">← Back to notes</Link>
          <h1 className="subject-page__title">Unable to load subject</h1>
          <p className="subject-page__meta">Please try again in a moment.</p>
        </div>
      </main>
    )
  }

  const parsed = parseSubjectId(subjectId)
  if (!parsed) {
    return (
      <main className="subject-page">
        <div className="subject-page__header">
          <Link to="/notes" className="subject-page__back">← Back to notes</Link>
          <h1 className="subject-page__title">Invalid subject link</h1>
          <p className="subject-page__meta">Open Notes and select a subject again.</p>
        </div>
      </main>
    )
  }

  const subjectNotes = notes.filter(
    n => n.semester === parsed.semester && n.branch === parsed.branch && (n.subject_code || n.subject) === parsed.subjectCode
  )
  const subjectName = subjectNotes[0]?.subject || parsed.subjectCode
  const syllabus = subjectNotes.find(n => n.type === 'syllabus')
  const modules  = subjectNotes
    .filter(n => n.type === 'module')
    .sort((a, b) => a.module_number - b.module_number)
  const schemeId = getSchemeIdForSemester(parsed.semester)
  const backPath = `/notes/scheme/${schemeId}/semester/${parsed.semester}`
  const pyqPath = `/pyqs/scheme/${schemeId}/semester/${parsed.semester}`

  if (subjectNotes.length === 0) {
    return (
      <main className="subject-page">
        <div className="subject-page__header">
          <Link to={backPath} className="subject-page__back">← Back to subjects</Link>
          <h1 className="subject-page__title">{parsed.subjectCode}</h1>
          <p className="subject-page__meta">No notes found for this subject yet.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="subject-page">
      <div className="subject-page__header">
        <Link to={backPath} className="subject-page__back">← Back to subjects</Link>
        <h1 className="subject-page__title">{formatCourseLabel(parsed.subjectCode, subjectName)}</h1>
        <p className="subject-page__meta">
          {parsed.branch}<span>·</span>Semester {parsed.semester}
        </p>
      </div>

      {syllabus && <SyllabusCard note={syllabus} />}

      <div className="module-list">
        {modules.length === 0
          ? <p className="module-list__empty">No modules uploaded yet.</p>
          : modules.map(m => <ModuleCard key={m.id} module={m} />)
        }
      </div>

      <Link to={pyqPath} className="subject-page__pyq-link">
        <div className="subject-page__pyq-link__left">
          <h3>Previous Year Questions</h3>
          <p>CIE and SEE papers for Semester {parsed.semester}</p>
        </div>
        <span className="subject-page__pyq-link__arrow">→</span>
      </Link>
    </main>
  )
}
