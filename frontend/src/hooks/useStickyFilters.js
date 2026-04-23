import { useEffect, useState } from 'react'

export function useStickyFilters(storageKey, defaults) {
  const [filters, setFilters] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return defaults
      return { ...defaults, ...JSON.parse(raw) }
    } catch {
      return defaults
    }
  })

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(filters))
  }, [filters, storageKey])

  return { filters, setFilters }
}
