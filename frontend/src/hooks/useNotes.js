import { useAutoRefreshData } from './useAutoRefreshData'

export function useNotes() {
  const { data, loading, error, refresh } = useAutoRefreshData('/api/notes', 'notes')
  return { notes: data, loading, error, refresh }
}
