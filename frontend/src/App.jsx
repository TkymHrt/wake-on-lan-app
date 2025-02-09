import { useState } from 'react'
import './App.css'

// Get API URL from environment or fallback to current host
const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8080`

function App() {
  const [mac, setMac] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const validateMac = (mac) => {
    const regex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/
    return regex.test(mac)
  }

  const handleWake = async () => {
    if (!validateMac(mac)) {
      setStatus('Error: Invalid MAC address format (use XX:XX:XX:XX:XX:XX)')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/wake?mac=${mac}`)
      const data = await res.json()
      setStatus(res.ok ? data.message : `Error: ${data.error}`)
    } catch (err) {
      setStatus(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1>Wake-on-LAN</h1>
      <div className="input-group">
        <input
          type="text"
          placeholder="Enter MAC address (e.g., AA:BB:CC:DD:EE:FF)"
          value={mac}
          onChange={(e) => setMac(e.target.value)}
          className="mac-input"
        />
        <button
          onClick={handleWake}
          disabled={loading || !mac}
          className="wake-button"
        >
          {loading ? 'Sending...' : 'Wake PC'}
        </button>
      </div>
      {status && <p className={status.includes('Error') ? 'error' : 'success'}>{status}</p>}
      <div className="api-info">
        <small>API Endpoint: {API_URL}</small>
      </div>
    </div>
  )
}

export default App
