import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

export function useAutoRefreshData(endpoint, responseKey) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get(endpoint)
      const records = Array.isArray(response.data?.[responseKey]) ? response.data[responseKey] : []
      setData(records)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }, [endpoint, responseKey])

  useEffect(() => {
    fetchData()

    const refetchWhenVisible = () => {
      if (!document.hidden) fetchData()
    }

    const intervalId = window.setInterval(fetchData, 30000)
    window.addEventListener('focus', fetchData)
    window.addEventListener('smart-study:data-updated', fetchData)
    document.addEventListener('visibilitychange', refetchWhenVisible)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', fetchData)
      window.removeEventListener('smart-study:data-updated', fetchData)
      document.removeEventListener('visibilitychange', refetchWhenVisible)
    }
  }, [fetchData])

  return { data, loading, error, refresh: fetchData }
}
