import '../../styles/Navbar.css'
import { Link, NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar__logo">Smart Study</Link>
      <div className="navbar__links">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink>
        <NavLink to="/notes" className={({ isActive }) => isActive ? 'active' : ''}>Notes</NavLink>
        <NavLink to="/pyqs" className={({ isActive }) => isActive ? 'active' : ''}>PYQs</NavLink>
        <Link to="/#requests">Requests</Link>
        <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>Admin</NavLink>
      </div>
    </nav>
  )
}
