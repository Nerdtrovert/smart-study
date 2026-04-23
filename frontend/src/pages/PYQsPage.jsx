import '../styles/NotesPage.css'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usePYQs } from '../hooks/usePYQs'
import SchemePicker from '../components/shared/SchemePicker'
import { getOrdinal, getSchemes } from '../data/schemes'
import { useStickyFilters } from '../hooks/useStickyFilters'
import { formatCourseLabel } from '../utils/courseCatalog'

export default function PYQsPage() {
  const { pyqs, loading, error } = usePYQs()
  const { schemeId, semester } = useParams()
  const schemes = getSchemes('pyqs')
  const { filters, setFilters } = useStickyFilters('pyqs-page-filters', { search: '', sort: 'code' })
  const searchTerm = filters.search.trim().toLowerCase()

  const selectedScheme = schemes.find(scheme => scheme.id === schemeId)
  const selectedSemester = Number(semester)
  const hasSemesterSelection = Boolean(selectedScheme && selectedSemester)

  const semesterPYQs = hasSemesterSelection
    ? pyqs.filter(paper => paper.semester === selectedSemester)
    : []

  const subjects = useMemo(() => {
    const byCode = new Map()

    semesterPYQs.forEach(paper => {
      const subjectCode = paper.subject_code
      if (!subjectCode) return

      if (!byCode.has(subjectCode)) {
        byCode.set(subjectCode, {
          sample: paper,
          subjectCode,
          pyqCount: 0,
          cieCount: 0,
          latestAt: 0,
          label: formatCourseLabel(subjectCode, paper.subject_name),
        })
      }

      const entry = byCode.get(subjectCode)
      if (paper.exam_type === 'SEE') entry.pyqCount += 1
      else entry.cieCount += 1
      const uploadedAt = Date.parse(paper.uploaded_at || '') || 0
      entry.latestAt = Math.max(entry.latestAt, uploadedAt)
    })

    const sortSubjects = (a, b) => {
      if (filters.sort === 'recent') return b.latestAt - a.latestAt || a.subjectCode.localeCompare(b.subjectCode)
      if (filters.sort === 'name') return a.label.localeCompare(b.label)
      return a.subjectCode.localeCompare(b.subjectCode)
    }

    return [...byCode.values()]
      .filter(subject => !searchTerm || subject.label.toLowerCase().includes(searchTerm) || subject.subjectCode.toLowerCase().includes(searchTerm))
      .sort(sortSubjects)
  }, [filters.sort, searchTerm, semesterPYQs])

  const emptyMessage = !hasSemesterSelection
    ? null
    : searchTerm
    ? 'No courses match this search in the selected semester.'
    : 'No PYQs uploaded for this semester yet.'

  return (
    <main className="notes-page">
      <div className="notes-page__header">
        <h1 className="notes-page__title">PYQs</h1>
        {hasSemesterSelection ? (
          <>
            <Link to="/pyqs" className="notes-page__back">← All schemes</Link>
            <p className="notes-page__subtitle">
              {selectedScheme.title}<span>·</span>{getOrdinal(selectedSemester)} Semester
            </p>
          </>
        ) : (
          <p className="notes-page__subtitle">Choose your scheme and semester to browse courses and papers.</p>
        )}
      </div>

      {hasSemesterSelection && (
        <div className="notes-controls">
          <input
            className="input notes-controls__search"
            placeholder="Search by course code or name"
            value={filters.search}
            onChange={e => setFilters(current => ({ ...current, search: e.target.value }))}
          />
          <select
            className="select notes-controls__sort"
            value={filters.sort}
            onChange={e => setFilters(current => ({ ...current, sort: e.target.value }))}
          >
            <option value="code">Sort: Code (A-Z)</option>
            <option value="name">Sort: Course name</option>
            <option value="recent">Sort: Latest uploads</option>
          </select>
        </div>
      )}

      {loading
        ? <p className="notes-empty">Loading courses...</p>
        : error
        ? <p className="notes-empty">Could not load PYQs right now.</p>
        : !hasSemesterSelection
        ? <SchemePicker schemes={schemes} basePath="pyqs" />
        : subjects.length === 0
        ? <p className="notes-empty">{emptyMessage}</p>
        : (
          <div className="branch-section">
            <div className="branch-label">Courses and subjects</div>
            <div className="subject-grid">
              {subjects.map(subject => {
                const key = `${selectedSemester}-${subject.subjectCode}`

                return (
                  <Link
                    key={key}
                    to={`/pyqs/${encodeURIComponent(key)}`}
                    className="subject-card"
                  >
                    <div className="subject-card__name">{subject.label}</div>
                    <div className="subject-card__meta">
                      {subject.subjectCode}<span> · </span>Sem {subject.sample.semester}
                    </div>
                    <div className="subject-card__footer">
                      <div className="subject-card__count">
                        <span className="subject-card__dot" />
                        {subject.pyqCount} PYQ{subject.pyqCount !== 1 ? 's' : ''} · {subject.cieCount} CIE
                      </div>
                      <span className="subject-card__arrow">→</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )
      }
    </main>
  )
}
