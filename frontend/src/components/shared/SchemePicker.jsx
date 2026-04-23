import { Link } from 'react-router-dom'
import { getOrdinal } from '../../data/schemes'

export default function SchemePicker({ schemes, basePath }) {
  return (
    <div className="scheme-grid">
      {schemes.map(scheme => (
        <section key={scheme.id} className="scheme-card">
          <div>
            <p className="scheme-card__eyebrow">{scheme.id}</p>
            <h2 className="scheme-card__title">{scheme.title}</h2>
            <p className="scheme-card__description">{scheme.description}</p>
          </div>
          <div className="semester-grid">
            {scheme.semesters.map(semester => (
              <Link
                key={semester}
                to={`/${basePath}/scheme/${scheme.id}/semester/${semester}`}
                className="semester-card"
              >
                <span className="semester-card__label">{getOrdinal(semester)} Semester</span>
                <span className="semester-card__arrow">→</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
