import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotes } from '../../hooks/useNotes'
import { formatCourseLabel } from '../../utils/courseCatalog'
import { normalizeBranch } from '../../utils/branch'
import { getSchemeIdForSemester } from '../../data/schemes'
import '../../styles/GlobalSearch.css'

function buildSearchIndex(notes) {
  const subjectMap = new Map()

  notes.forEach(note => {
    const code = note.subject_code || note.subject || ''
    const branch = normalizeBranch(note.branch)
    const sem = note.semester
    const key = `${sem}-${branch}-${code}`

    if (!subjectMap.has(key)) {
      const schemeId = getSchemeIdForSemester(sem)
      subjectMap.set(key, {
        type: 'subject',
        key,
        code,
        label: formatCourseLabel(code, note.subject_name || ''),
        branch,
        semester: sem,
        url: `/notes/${encodeURIComponent(`${sem}-${branch}-${code}`)}`,
        schemeId,
        modules: []
      })
    }

    if (note.type === 'module') {
      subjectMap.get(key).modules.push({
        type: 'module',
        key: note.id,
        title: note.title,
        label: `${formatCourseLabel(code)} — ${note.title}`,
        subjectLabel: formatCourseLabel(code, note.subject_name || ''),
        semester: sem,
        branch,
        url: `/notes/${encodeURIComponent(`${sem}-${branch}-${code}`)}`
      })
    }
  })

  return [...subjectMap.values()]
}

function scoreMatch(text = '', query = '') {
  const t = text.toLowerCase()
  const q = query.toLowerCase()
  if (t === q) return 3
  if (t.startsWith(q)) return 2
  if (t.includes(q)) return 1
  return 0
}

function searchIndex(index, query) {
  if (!query.trim()) return []
  const q = query.trim()
  const results = []

  index.forEach(subject => {
    const score = Math.max(
      scoreMatch(subject.code, q),
      scoreMatch(subject.label, q),
      scoreMatch(`semester ${subject.semester}`, q),
      scoreMatch(subject.branch, q)
    )
    if (score > 0) {
      results.push({ ...subject, score, resultType: 'subject' })
    }

    subject.modules.forEach(mod => {
      const mScore = Math.max(
        scoreMatch(mod.title, q),
        scoreMatch(subject.code, q),
        scoreMatch(subject.label, q)
      )
      if (mScore > 0) {
        results.push({ ...mod, score: mScore - 0.5, resultType: 'module' })
      }
    })
  })

  return results.sort((a, b) => b.score - a.score).slice(0, 8)
}

export default function GlobalSearch({ onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const { notes } = useNotes()

  const index = useRef([])
  useEffect(() => {
    if (notes?.length) {
      index.current = buildSearchIndex(notes)
    }
  }, [notes])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const res = searchIndex(index.current, query)
    setResults(res)
    setActiveIndex(0)
  }, [query])

  // Push a fake history entry so the browser Back button closes the overlay
  // instead of navigating away from the app
  useEffect(() => {
    history.pushState({ searchOpen: true }, '')

    const handlePopState = () => {
      onClose()
    }
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [onClose])

  const handleSelect = useCallback((url) => {
    navigate(url)
    onClose()
  }, [navigate, onClose])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (results[activeIndex]) handleSelect(results[activeIndex].url)
    } else if (e.key === 'Escape') {
      history.back() // triggers popstate → onClose
    }
  }

  return (
    <div className="gs-overlay" onClick={onClose}>
      <div className="gs-modal" onClick={e => e.stopPropagation()}>
        <div className="gs-input-row">
          <svg className="gs-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            ref={inputRef}
            className="gs-input"
            type="text"
            placeholder="Search subjects, modules, courses…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          <kbd className="gs-esc" onClick={onClose}>Esc</kbd>
        </div>

        {query.trim() ? (
          results.length === 0 ? (
            <div className="gs-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <p>No results for <strong>"{query}"</strong></p>
              <span>Try a subject code like BCS401 or a name like DBMS</span>
            </div>
          ) : (
            <ul className="gs-results">
              {results.map((result, i) => (
                <li
                  key={result.key}
                  className={`gs-result ${i === activeIndex ? 'gs-result--active' : ''}`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => handleSelect(result.url)}
                >
                  <div className={`gs-result__icon gs-result__icon--${result.resultType}`}>
                    {result.resultType === 'subject' ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    )}
                  </div>
                  <div className="gs-result__body">
                    <span className="gs-result__title">
                      {result.resultType === 'subject' ? result.label : result.title}
                    </span>
                    {result.resultType === 'module' && (
                      <span className="gs-result__sub">{result.subjectLabel}</span>
                    )}
                    <div className="gs-result__tags">
                      <span className="gs-tag">Sem {result.semester}</span>
                      <span className="gs-tag">{result.branch}</span>
                      {result.resultType === 'module' && <span className="gs-tag gs-tag--blue">Module</span>}
                    </div>
                  </div>
                  <svg className="gs-result__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </li>
              ))}
            </ul>
          )
        ) : (
          <div className="gs-hint">
            <p>Start typing to search across all notes and subjects</p>
            <div className="gs-shortcuts">
              <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
              <span><kbd>↵</kbd> Open</span>
              <span><kbd>Esc</kbd> Close</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
