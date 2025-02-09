import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [mac, setMac] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])

  useEffect(() => {
    // Load history from localStorage on component mount
    const savedHistory = localStorage.getItem('macHistory')
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])

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
      const res = await fetch(`/api/wake?mac=${mac}`)
      const data = await res.json()
      if (res.ok) {
        // Add to history if not already present
        if (!history.includes(mac)) {
          const newHistory = [mac, ...history].slice(0, 5) // Keep last 5 entries
          setHistory(newHistory)
          localStorage.setItem('macHistory', JSON.stringify(newHistory))
        }
        setStatus(data.message)
      } else {
        setStatus(`Error: ${data.error}`)
      }
    } catch (err) {
      setStatus(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleHistorySelect = (selectedMac) => {
    setMac(selectedMac)
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

      {history.length > 0 && (
        <div className="history-section">
          <h3>Recent MAC Addresses</h3>
          <div className="history-list">
            {history.map((historyMac, index) => (
              <button
                key={index}
                onClick={() => handleHistorySelect(historyMac)}
                className="history-item"
              >
                {historyMac}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
