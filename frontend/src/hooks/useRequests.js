import { useState } from 'react'
import axios from 'axios'

export function useRequests() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const submitRequest = async (form) => {
    setLoading(true)
    try {
      await axios.post('/api/requests', form)
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  return { submitRequest, loading, error }
}
