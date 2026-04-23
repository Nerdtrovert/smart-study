import '../styles/NotesPage.css'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useNotes } from '../hooks/useNotes'
import SchemePicker from '../components/shared/SchemePicker'
import { BRANCHES } from '../data/branches'
import { getOrdinal, getSchemes } from '../data/schemes'
import { useStickyFilters } from '../hooks/useStickyFilters'
import { formatCourseLabel } from '../utils/courseCatalog'

export default function NotesPage() {
  const { notes, loading, error } = useNotes()
  const { schemeId, semester } = useParams()
  const schemes = getSchemes('notes')
  const { filters, setFilters } = useStickyFilters('notes-page-filters', { search: '', sort: 'code' })

  const searchTerm = filters.search.trim().toLowerCase()
  const selectedScheme = schemes.find(scheme => scheme.id === schemeId)
  const selectedSemester = Number(semester)
  const hasSemesterSelection = Boolean(selectedScheme && selectedSemester)

  const semesterNotes = hasSemesterSelection
    ? notes.filter(note => note.semester === selectedSemester)
    : []

  const branchGroups = useMemo(() => {
    const availableBranches = BRANCHES.filter(branch => (
      semesterNotes.some(note => note.branch === branch)
    ))

    const sortSubjects = (a, b) => {
      if (filters.sort === 'recent') return b.latestAt - a.latestAt || a.courseCode.localeCompare(b.courseCode)
      if (filters.sort === 'name') return a.label.localeCompare(b.label)
      return a.courseCode.localeCompare(b.courseCode)
    }

    return availableBranches
      .map(branch => {
        const branchNotes = semesterNotes.filter(note => note.branch === branch)
        const byCode = new Map()

        branchNotes.forEach(note => {
          const courseCode = note.subject_code || note.subject
          if (!courseCode) return

          if (!byCode.has(courseCode)) {
            byCode.set(courseCode, {
              sample: note,
              courseCode,
              moduleCount: 0,
              latestAt: 0,
              label: formatCourseLabel(courseCode, note.subject),
            })
          }

          const entry = byCode.get(courseCode)
          if (note.type === 'module') entry.moduleCount += 1
          const uploadedAt = Date.parse(note.uploaded_at || '') || 0
          entry.latestAt = Math.max(entry.latestAt, uploadedAt)
        })

        const subjects = [...byCode.values()]
          .filter(subject => !searchTerm || subject.label.toLowerCase().includes(searchTerm) || subject.courseCode.toLowerCase().includes(searchTerm))
          .sort(sortSubjects)

        return { branch, subjects }
      })
      .filter(group => group.subjects.length > 0)
  }, [filters.sort, searchTerm, semesterNotes])

  const totalSubjects = branchGroups.reduce((acc, group) => acc + group.subjects.length, 0)

  const emptyMessage = !hasSemesterSelection
    ? null
    : searchTerm
    ? 'No courses match this search in the selected semester.'
    : 'No notes uploaded for this semester yet.'

  return (
    <main className="notes-page">
      <div className="notes-page__header">
        <h1 className="notes-page__title">Notes</h1>
        {hasSemesterSelection ? (
          <>
            <Link to="/notes" className="notes-page__back">← All schemes</Link>
            <p className="notes-page__subtitle">
              {selectedScheme.title}<span>·</span>{getOrdinal(selectedSemester)} Semester
            </p>
          </>
        ) : (
          <p className="notes-page__subtitle">Choose your scheme and semester to browse courses and subjects.</p>
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
        ? <p className="notes-empty">Could not load notes right now.</p>
        : !hasSemesterSelection
        ? <SchemePicker schemes={schemes} basePath="notes" />
        : totalSubjects === 0
        ? <p className="notes-empty">{emptyMessage}</p>
        : branchGroups.map(({ branch, subjects: subjectList }) => (
          <div key={branch} className="branch-section">
            <div className="branch-label">
              {branch} courses and subjects
            </div>
            <div className="subject-grid">
              {subjectList.map(subject => {
                const key = `${subject.sample.semester}-${subject.sample.branch}-${subject.courseCode}`
                return (
                  <Link
                    key={key}
                    to={`/notes/${encodeURIComponent(key)}`}
                    className="subject-card"
                  >
                    <div className="subject-card__name">{subject.label}</div>
                    <div className="subject-card__meta">
                      {branch}{subject.sample.semester ? ` · Sem ${subject.sample.semester}` : ''}
                    </div>
                    <div className="subject-card__footer">
                      <div className="subject-card__count">
                        <span className="subject-card__dot" />
                        {subject.moduleCount} module{subject.moduleCount !== 1 ? 's' : ''}
                      </div>
                      <span className="subject-card__arrow">→</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))
      }
    </main>
  )
}
