export const SCHEMES = [
  {
    id: '2022',
    title: '2022 Scheme',
    semesters: [4],
    descriptions: {
      notes: 'Currently available for 4th semester notes.',
      pyqs: 'Currently available for 4th semester PYQs.',
    },
  },
  {
    id: '2025',
    title: '2025 Scheme',
    semesters: [2],
    descriptions: {
      notes: 'Currently available for 2nd semester notes.',
      pyqs: 'Currently available for 2nd semester PYQs.',
    },
  },
]

export function getOrdinal(value) {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const mod100 = value % 100
  return `${value}${suffixes[(mod100 - 20) % 10] || suffixes[mod100] || suffixes[0]}`
}

export function getSchemes(mode) {
  return SCHEMES.map(scheme => ({
    ...scheme,
    description: scheme.descriptions?.[mode] || '',
  }))
}

export function getSchemeIdForSemester(semester) {
  return Number(semester) === 2 ? '2025' : '2022'
}
