import '../styles/HomePage.css'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import RequestBox from '../components/shared/RequestBox'
import GlobalSearch from '../components/shared/GlobalSearch'
import { useNotes } from '../hooks/useNotes'
import { usePYQs } from '../hooks/usePYQs'
import { formatCourseLabel } from '../utils/courseCatalog'
import { normalizeBranch } from '../utils/branch'
import brandLogo from '../assets/brand-logo.png'

export default function HomePage() {
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const { notes, loading: notesLoading, error: notesError } = useNotes()
  const { pyqs, loading: pyqsLoading, error: pyqsError } = usePYQs()

  const latestUploads = useMemo(() => {
    const noteUploads = notes
      .map(note => {
        const branch = normalizeBranch(note.branch)
        return {
          id: `note-${note.id}`,
          title: formatCourseLabel(note.subject_code || note.subject, note.subject),
          subtitle: `${branch || 'Branch'} · Sem ${note.semester} · ${note.type === 'module' ? `Module ${note.module_number}` : 'Syllabus'}`,
          uploadedAt: Date.parse(note.uploaded_at || '') || 0,
          path: note.semester && branch && (note.subject_code || note.subject)
            ? `/notes/${encodeURIComponent(`${note.semester}-${branch}-${note.subject_code || note.subject}`)}`
            : '/notes',
        }
      })

    const pyqUploads = pyqs
      .map(paper => {
        const typeLabel = paper.exam_type === 'QB' 
          ? 'Q-Bank' 
          : paper.exam_type === 'IMP' 
            ? 'Imp Qs' 
            : paper.exam_type === 'ASSIGNMENT' 
              ? 'Assignment' 
              : paper.exam_type === 'SEE'
                ? 'PYQ'
                : paper.exam_type
        return {
          id: `pyq-${paper.id}`,
          title: formatCourseLabel(paper.subject_code, paper.subject_name),
          subtitle: `Sem ${paper.semester} · ${typeLabel}${paper.year ? ` ${paper.year}` : ''}`,
          uploadedAt: Date.parse(paper.uploaded_at || '') || 0,
          path: paper.semester && paper.subject_code
            ? `/pyqs/${encodeURIComponent(`${paper.semester}-${paper.subject_code}`)}`
            : '/pyqs',
        }
      })

    return [...noteUploads, ...pyqUploads]
      .sort((a, b) => b.uploadedAt - a.uploadedAt)
      .slice(0, 3)
  }, [notes, pyqs])

  const isLoading = notesLoading || pyqsLoading
  const hasError = Boolean(notesError || pyqsError)

  useEffect(() => {
    if (location.hash !== '#requests') return
    const requestSection = document.getElementById('requests')
    if (!requestSection) return
    requestSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.hash])

  return (
    <>
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}

      <main className="home">
        {/* Hero */}
        <div className="hero">
          <img src={brandLogo} alt="Smart Study logo" className="hero__logo" />
          <span className="hero__eyebrow">Dr. HNNCE</span>
          <h1 className="hero__title">Smart Study</h1>
          <p className="hero__tagline">Study faster. Learn smarter.</p>
          
          <div className="hero__search-container">
            <button
              type="button"
              className="hero__search-bar"
              onClick={() => setSearchOpen(true)}
              aria-label="Search study materials"
            >
              <svg className="hero__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span>Search subjects, module notes, syllabus…</span>
            </button>
          </div>

          <p className="hero__sub">All notes. One place.</p>
        </div>

      {/* Nav labels */}
      <div className="nav-labels">
        <Link to="/notes" className="nav-label-card">
          <div className="nav-label-card__icon nav-label-card__icon--green" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M6 4.5h8.5A3.5 3.5 0 0 1 18 8v11H9A3 3 0 0 0 6 22V4.5Zm0 0H5.5A1.5 1.5 0 0 0 4 6v12.5A3.5 3.5 0 0 1 7.5 22H18" />
              <path d="M8.5 9.5h6M8.5 12.5h6M8.5 15.5h4.5" />
            </svg>
          </div>
          <h2>Notes</h2>
          <p>Module-wise notes for all subjects</p>
        </Link>
        <Link to="/pyqs" className="nav-label-card">
          <div className="nav-label-card__icon nav-label-card__icon--blue" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M8 4h8l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
              <path d="M16 4v4h4M9 12h6M9 16h6" />
            </svg>
          </div>
          <h2>Important Questions</h2>
          <p>Question banks, PYQs, and assignments</p>
        </Link>
      </div>

      <section className="latest-uploads">
        <div className="latest-uploads__header">
          <h2>Latest uploads</h2>
          <p>Recently added notes and papers across all sections.</p>
        </div>
        {isLoading ? (
          <p className="latest-uploads__empty">Loading latest uploads...</p>
        ) : hasError ? (
          <p className="latest-uploads__empty">Could not load latest uploads right now.</p>
        ) : latestUploads.length === 0 ? (
          <p className="latest-uploads__empty">No uploads yet.</p>
        ) : (
          <div className="latest-uploads__grid">
            {latestUploads.map(item => (
              <Link key={item.id} to={item.path} className="latest-upload-card">
                <p className="latest-upload-card__title">{item.title}</p>
                <p className="latest-upload-card__meta">{item.subtitle}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <RequestBox />
    </main>
  </>
)
}
