import '../styles/PYQSubjectPage.css'
import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { usePYQs } from '../hooks/usePYQs'
import { useNotes } from '../hooks/useNotes'
import { getSchemeIdForSemester } from '../data/schemes'
import PDFViewer from '../components/shared/PDFViewer'
import { getDriveEmbedUrl } from '../utils/driveUrl'
import { formatCourseLabel } from '../utils/courseCatalog'
import { normalizeBranch } from '../utils/branch'

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
  const { notes, loading: notesLoading } = useNotes()

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
          <p className="pyq-subject-page__meta">Open Important Questions and select a subject again.</p>
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
  const backNotesPath = semester ? `/notes/scheme/${schemeId}/semester/${semester}` : '/notes'

  const correspondingNotes = parsed ? notes.filter(
    n => n.semester === parsed.selectedSemester && (n.subject_code || n.subject) === parsed.subjectCode
  ) : []
  const uniqueNotesBranches = [...new Set(correspondingNotes.map(n => normalizeBranch(n.branch)).filter(Boolean))]

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
    .filter(paper => paper.exam_type === 'SEE' || paper.exam_type === 'PYQ')
    .sort((a, b) => (b.year || 0) - (a.year || 0) || (a.paper_number || 0) - (b.paper_number || 0))

  const qbPapers = subjectPYQs
    .filter(paper => paper.exam_type === 'QB')
    .sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at))

  const impPapers = subjectPYQs
    .filter(paper => paper.exam_type === 'IMP')
    .sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at))

  const assignmentPapers = subjectPYQs
    .filter(paper => paper.exam_type === 'ASSIGNMENT')
    .sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at))

  const ciePapers = subjectPYQs
    .filter(paper => ['CIE1', 'CIE2', 'CIE3'].includes(paper.exam_type))
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
        {pyqPapers.length > 0 && (
          <PaperBlock
            title="Previous Year Questions (PYQs)"
            description="SEE previous year question papers."
            emptyText="No SEE PYQs uploaded yet."
            papers={pyqPapers}
            getLabel={paper => `${paper.year || 'Year'}${paper.paper_number ? ` · Paper ${paper.paper_number}` : ''}`}
          />
        )}
        {qbPapers.length > 0 && (
          <PaperBlock
            title="Question Banks"
            description="Handcrafted and official question banks."
            emptyText="No question banks uploaded yet."
            papers={qbPapers}
            getLabel={paper => paper.title || 'Question Bank'}
          />
        )}
        {impPapers.length > 0 && (
          <PaperBlock
            title="Important Questions"
            description="Must-study questions for final exams."
            emptyText="No important questions uploaded yet."
            papers={impPapers}
            getLabel={paper => paper.title || 'Important Questions'}
          />
        )}
        {assignmentPapers.length > 0 && (
          <PaperBlock
            title="Assignment Questions"
            description="Internal/semester assignments and practice sets."
            emptyText="No assignments uploaded yet."
            papers={assignmentPapers}
            getLabel={paper => paper.title || 'Assignment Questions'}
          />
        )}
        {ciePapers.length > 0 && (
          <PaperBlock
            title="CIE Papers"
            description="Legacy internal assessment papers."
            emptyText="No CIE papers uploaded yet."
            papers={ciePapers}
            getLabel={paper => paper.exam_type.replace('CIE', 'CIE ')}
          />
        )}
      </div>

      {notesLoading ? (
        <p className="paper-block__empty">Checking for notes...</p>
      ) : uniqueNotesBranches.length > 0 ? (
        <div className="notes-links-section" style={{ marginTop: '36.8px' }}>
          <h3 style={{ fontSize: 'var(--fs-xl)', fontWeight: '500', marginBottom: '12px', color: 'var(--text)' }}>Study Notes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {uniqueNotesBranches.map(branch => {
              const notesPath = `/notes/${encodeURIComponent(`${parsed.selectedSemester}-${branch}-${parsed.subjectCode}`)}`
              return (
                <Link key={branch} to={notesPath} className="subject-page__pyq-link" style={{ marginTop: 0 }}>
                  <div className="subject-page__pyq-link__left">
                    <h3>View Notes ({branch})</h3>
                    <p>Module-wise study notes for {branch}</p>
                  </div>
                  <span className="subject-page__pyq-link__arrow" style={{ color: 'var(--green)' }}>→</span>
                </Link>
              )
            })}
          </div>
        </div>
      ) : (
        <Link to={backNotesPath} className="subject-page__pyq-link" style={{ marginTop: '36.8px' }}>
          <div className="subject-page__pyq-link__left">
            <h3>Notes & Study Materials</h3>
            <p>Browse notes for Semester {semester}</p>
          </div>
          <span className="subject-page__pyq-link__arrow" style={{ color: 'var(--green)' }}>→</span>
        </Link>
      )}
    </main>
  )
}
