import { useAutoRefreshData } from './useAutoRefreshData'

export function usePYQs() {
  const { data, loading, error, refresh } = useAutoRefreshData('/api/pyqs', 'pyqs')
  return { pyqs: data, loading, error, refresh }
}
