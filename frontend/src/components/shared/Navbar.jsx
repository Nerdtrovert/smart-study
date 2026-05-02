import '../../styles/Navbar.css'
import { Link, NavLink } from 'react-router-dom'
import { useState } from 'react'
import GlobalSearch from './GlobalSearch'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const toggleMenu = () => setMenuOpen(!menuOpen)
  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className="navbar">
      <Link to="/" className="navbar__logo" aria-label="Smart Study home">
        <img src="/favicon.png" alt="" className="navbar__logo-mark" />
        <span>Smart Study</span>
      </Link>
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
