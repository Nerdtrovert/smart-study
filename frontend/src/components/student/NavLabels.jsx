import { Link } from 'react-router-dom'

export default function NavLabels() {
  return (
    <div>
      <Link to="/notes">
        <div>
          <h2>Notes</h2>
          <p>Module-wise notes for all subjects</p>
        </div>
      </Link>
      <Link to="/pyqs">
        <div>
          <h2>Important Questions</h2>
          <p>Question banks, PYQs, and assignments</p>
        </div>
      </Link>
    </div>
  )
}
