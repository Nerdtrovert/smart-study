export default function SubjectCard({ subject, mode }) {
  return (
    <div>
      <h3>{subject.name}</h3>
      {mode === 'notes' && <p>{subject.branch} · Sem {subject.semester}</p>}
      {mode === 'pyqs' && <p>{subject.code} · Sem {subject.semester}</p>}
      <p>{subject.count} {mode === 'notes' ? 'modules' : 'papers'}</p>
    </div>
  )
}
