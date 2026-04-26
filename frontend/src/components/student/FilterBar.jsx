import { filterOptions } from '../../utils/filterNotes'
import { normalizeBranch } from '../../utils/branch'

// mode: 'notes' (default) | 'pyqs'
export default function FilterBar({ filters, onChange, notes, mode = 'notes' }) {
  const { semesters, branches, subjects } = filterOptions(notes, filters, mode)
  const selectedBranch = normalizeBranch(filters.branch)

  return (
    <div>
      <select value={filters.semester} onChange={e => onChange({ ...filters, semester: e.target.value, branch: '', subject: '' })}>
        <option value="">All semesters</option>
        {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
      </select>

      {mode === 'notes' && (
        <select value={selectedBranch} onChange={e => onChange({ ...filters, branch: e.target.value, subject: '' })}>
          <option value="">All branches</option>
          {branches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      )}

      <select value={filters.subject} onChange={e => onChange({ ...filters, subject: e.target.value })}>
        <option value="">All subjects</option>
        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  )
}
