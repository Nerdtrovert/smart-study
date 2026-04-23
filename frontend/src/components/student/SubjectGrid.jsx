import { Link } from 'react-router-dom'
import SubjectCard from './SubjectCard'
import { filterNotes, uniqueSubjects } from '../../utils/filterNotes'

export default function SubjectGrid({ notes, filters, mode = 'notes' }) {
  const filtered = filterNotes(notes, filters, mode)
  const subjects = uniqueSubjects(filtered, mode)

  if (subjects.length === 0) return <p>No notes found for selected filters.</p>

  return (
    <div>
      {subjects.map(subj => (
        <Link
          key={subj.key}
          to={mode === 'notes' ? `/notes/${encodeURIComponent(subj.key)}` : `/pyqs/${encodeURIComponent(`${subj.semester}-${subj.code}`)}`}
        >
          <SubjectCard subject={subj} mode={mode} />
        </Link>
      ))}
    </div>
  )
}
