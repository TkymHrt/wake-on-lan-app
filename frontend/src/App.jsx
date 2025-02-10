import { useState, useEffect } from 'react';
import './App.css';

const MAX_HISTORY_ITEMS = 5;

function App() {
  const [mac, setMac] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('wolHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('wolHistory', JSON.stringify(history));
  }, [history]);


  const validateMac = (mac) => {
    const regex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return regex.test(mac);
  };

  const handleWake = async () => {
    if (!validateMac(mac)) {
      setStatus({ message: 'Error: Invalid MAC address format (use XX:XX:XX:XX:XX:XX)', isError: true });
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/wake?mac=${mac}`);
      const data = await res.json();
      if (res.ok) {
        updateHistory();
        setStatus({ message: data.message, isError: false });
      } else {
        setStatus({ message: `Error: ${data.error}`, isError: true });
      }
    } catch (err) {
      setStatus({ message: `Error: ${err.message}`, isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryWake = (mac, deviceName) => {
    return async () => {
      if (!validateMac(mac)) {
        setStatus({ message: 'Error: Invalid MAC address format (use XX:XX:XX:XX:XX:XX)', isError: true });
        return;
      }

      setLoading(true);
      setStatus(null);
      try {
        const res = await fetch(`/api/wake?mac=${mac}`);
        const data = await res.json();
        if (res.ok) {
          updateHistory(mac, deviceName);
          setMac(mac);
          setDeviceName(deviceName);
          setStatus({ message: data.message, isError: false });
        } else {
          setStatus({ message: `Error: ${data.error}`, isError: true });
        }
      } catch (err) {
        setStatus({ message: `Error: ${err.message}`, isError: true });
      } finally {
        setLoading(false);
      }
    };
  };

  const updateHistory = (macToUpdate, deviceNameToUpdate) => {
    const targetMac = macToUpdate || mac;
    const targetDeviceName = deviceNameToUpdate || deviceName;

    const existingIndex = history.findIndex(item => item.mac === targetMac);
    if (existingIndex > -1) {
      const newHistory = [...history];
      newHistory[existingIndex] = {
        mac: targetMac,
        deviceName: targetDeviceName || history[existingIndex].deviceName
      };
      newHistory.sort((a, b) => (a.mac === targetMac ? -1 : b.mac === targetMac ? 1 : 0));
      setHistory(newHistory);
    } else {
      const newHistory = [{ mac: targetMac, deviceName: targetDeviceName }, ...history].slice(0, MAX_HISTORY_ITEMS);
      setHistory(newHistory);
    }
  };

  const handleRemoveHistoryItem = (index) => {
    const newHistory = [...history];
    newHistory.splice(index, 1);
    setHistory(newHistory);
  };

  return (
    <div className='App'>
      <div className="container">
        <h1>Wake on LAN</h1>
        <div className="inputGroup">
          <div>
            <label htmlFor="macAddress">MAC Address</label>
            <input
              id="macAddress"
              type="text"
              placeholder="MAC Address (e.g., AA:BB:CC:DD:EE:FF)"
              value={mac}
              onChange={(e) => setMac(e.target.value)}
              className="macInput"
            />
            {!validateMac(mac) && mac.length > 0 && (
              <p className="error">Invalid MAC address format</p>
            )}
          </div>
          <div>
            <label htmlFor="deviceName">Device Name</label>
            <input
              id="deviceName"
              type="text"
              placeholder="Device Name (Optional)"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="deviceNameInput"
            />
          </div>
          <button
            onClick={handleWake}
            disabled={loading || !mac}
            className="wakeButton"
            aria-label="Wake"
          >
            {loading ? 'Sending...' : 'Wake'}
          </button>
          <button
            onClick={() => {
              setMac('');
              setDeviceName('');
              setStatus('');
            }}
            className="clearButton"
            aria-label="Clear inputs"
          >
            Clear
          </button>
        </div>

        {status && (
          <div className={status.isError ? 'error' : 'success'}>
            {status.isError ? '❌' : '✅️'} {status.message}
          </div>
        )}

        {history.length > 0 && (
          <div className="historySection">
            <h3>Recent Devices</h3>
            <div className="historyList">
              {history.map((item, index) => (
                <div key={index} className="historyItemContainer">
                  <div className="historyItem">
                    <span className="deviceName">{item.deviceName || 'Unknown Device'}</span>
                    <span className="macAddress">{item.mac}</span>
                    <div className="historyActions">
                      <button
                        onClick={handleHistoryWake(item.mac, item.deviceName)}
                        className="actionButton wakeAction"
                        aria-label="Wake device"
                      >
                        Wake
                      </button>
                      <button
                        onClick={() => handleRemoveHistoryItem(index)}
                        className="actionButton removeAction"
                        aria-label="Remove from history"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;