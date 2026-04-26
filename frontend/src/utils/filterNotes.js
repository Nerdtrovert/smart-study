import { BRANCHES } from '../data/branches'
import { normalizeBranch } from './branch'

// Derive available filter options from current notes + active filters
export function filterOptions(notes, filters, mode = 'notes') {
  const semesters = [...new Set(notes.map(n => n.semester))].sort((a, b) => a - b)
  const selectedBranch = normalizeBranch(filters.branch)

  const inSem = filters.semester ? notes.filter(n => n.semester === Number(filters.semester)) : notes
  const branches = mode === 'notes'
    ? BRANCHES.filter(branch => inSem.some(n => normalizeBranch(n.branch) === branch))
    : []

  const inBranch = (mode === 'notes' && selectedBranch)
    ? inSem.filter(n => normalizeBranch(n.branch) === selectedBranch)
    : inSem
  const subjects = [...new Set(inBranch.map(n => n.subject_name || n.subject))].sort()

  return { semesters, branches, subjects }
}

// Filter notes array by active filters
export function filterNotes(notes, filters, mode = 'notes') {
  const selectedBranch = normalizeBranch(filters.branch)
  return notes.filter(n => {
    if (filters.semester && n.semester !== Number(filters.semester)) return false
    if (mode === 'notes' && selectedBranch && normalizeBranch(n.branch) !== selectedBranch) return false
    if (filters.subject && (n.subject_name || n.subject) !== filters.subject) return false
    return true
  })
}

// Collapse filtered notes into unique subject cards
export function uniqueSubjects(filtered, mode = 'notes') {
  const map = new Map()
  filtered.forEach(n => {
    const name = n.subject_name || n.subject
    const branch = normalizeBranch(n.branch)
    const key = mode === 'notes' ? `${n.semester}-${branch}-${name}` : n.subject_code
    if (!map.has(key)) {
      map.set(key, { key, name, branch, semester: n.semester, code: n.subject_code, count: 0 })
    }
    map.get(key).count++
  })
  return [...map.values()]
}
