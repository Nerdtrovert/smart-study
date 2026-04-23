import ModuleCard from './ModuleCard'

export default function ModuleList({ modules }) {
  if (modules.length === 0) return <p>No modules uploaded yet.</p>

  return (
    <div>
      {modules.map(mod => <ModuleCard key={mod.id} module={mod} />)}
    </div>
  )
}
