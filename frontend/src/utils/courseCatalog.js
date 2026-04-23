import catalog from '../data/courseCodes.json'

function normalizeCourseCode(value = '') {
  return `${value}`.trim().toUpperCase()
}

export function getCourseName(courseCode) {
  const normalized = normalizeCourseCode(courseCode)
  return catalog.courseCodes?.[normalized] || ''
}

export function formatCourseLabel(courseCode, fallbackName = '') {
  const normalizedCode = normalizeCourseCode(courseCode)
  const trimmedFallback = `${fallbackName}`.trim()
  const catalogName = getCourseName(normalizedCode)
  const resolvedName = (
    trimmedFallback && trimmedFallback.toUpperCase() !== normalizedCode
      ? trimmedFallback
      : catalogName || trimmedFallback
  )

  if (!normalizedCode) return resolvedName
  if (!resolvedName || resolvedName.toUpperCase() === normalizedCode) return normalizedCode
  return `${normalizedCode} - ${resolvedName}`
}
