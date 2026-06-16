import '../../styles/Navbar.css'
import { Link, NavLink } from 'react-router-dom'
import { useState } from 'react'
import GlobalSearch from './GlobalSearch'
import brandLogo from '../../assets/brand-logo.png'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const toggleMenu = () => setMenuOpen(!menuOpen)
  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}

      <nav className="navbar">
        <div className="navbar__brand">
          <Link to="/" className="navbar__logo" aria-label="Smart Study home">
        <img src={brandLogo} alt="" className="navbar__logo-mark" />
        <span onClick={closeMenu}>Smart Study</span>
      </Link>

          {/* Mobile-only: search icon + hamburger */}
          <div className="navbar__brand-actions">
            <button
              className="navbar__search-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>

            <button
              className="navbar__toggle"
              onClick={toggleMenu}
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {menuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </>
                ) : (
                  <>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Desktop: links + search pill on the right */}
        <div className={`navbar__links ${menuOpen ? 'navbar__links--open' : ''}`}>
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>Home</NavLink>
          <NavLink to="/notes" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>Notes</NavLink>
          <NavLink to="/pyqs" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>Important Questions</NavLink>
          <Link to="/#requests" onClick={closeMenu}>Requests</Link>
          <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>Admin</NavLink>
          {/* Desktop search pill */}
          <button
            className="navbar__search-pill"
            onClick={() => setSearchOpen(true)}
            aria-label="Open search"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>Search…</span>
          </button>
        </div>
      </nav>
    </>
  )
}
