import { useState, useEffect } from 'react';
import './App.css';

const MAX_HISTORY_ITEMS = 5;

function App() {
  const [mac, setMac] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [deviceStatus, setDeviceStatus] = useState({});

  useEffect(() => {
    const savedHistory = localStorage.getItem('wolHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('wolHistory', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    const checkAllDevicesStatus = async () => {
      const newStatus = { ...deviceStatus };
      for (const item of history) {
        if (item.ipAddress) {
          try {
            const res = await fetch(`/api/status?ip=${encodeURIComponent(item.ipAddress)}`);
            if (res.ok) {
              const data = await res.json();
              newStatus[item.ipAddress] = data.online;
            }
          } catch (err) {
            console.error(`Error checking status for ${item.ipAddress}:`, err);
          }
        }
      }
      setDeviceStatus(newStatus);
    };

    // Initial check
    checkAllDevicesStatus();

    // Set up periodic checking every 30 seconds
    const intervalId = setInterval(checkAllDevicesStatus, 30000);

    return () => clearInterval(intervalId);
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
        updateHistory(mac, deviceName, ipAddress);
        setStatus({ message: data.message, isError: false });

        if (ipAddress) {
          let attempts = 0;
          const maxAttempts = 10;
          const checkStatus = async () => {
            attempts++;
            console.log(`Checking status... Attempt ${attempts}`);
            try {
              const statusRes = await fetch(`/api/status?ip=${encodeURIComponent(ipAddress)}`);
              if (!statusRes.ok) throw new Error('Failed to check status');
              const statusData = await statusRes.json();
              if (statusData.online) {
                setStatus(prev => ({ ...prev, message: `${prev.message} Device is online.` }));
                clearInterval(intervalId);
              } else if (attempts >= maxAttempts) {
                setStatus(prev => ({ ...prev, message: `${prev.message} Device did not come online.` }));
                clearInterval(intervalId);
              }
            } catch (err) {
              if (attempts >= maxAttempts) {
                setStatus(prev => ({ ...prev, message: `${prev.message} Error checking status.` }));
                clearInterval(intervalId);
              }
            }
          };
          const intervalId = setInterval(checkStatus, 2000);
          checkStatus();
        }
      } else {
        setStatus({ message: `Error: ${data.error}`, isError: true });
      }
    } catch (err) {
      setStatus({ message: `Error: ${err.message}`, isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryWake = (item) => {
    return async () => {
      setMac(item.mac);
      setDeviceName(item.deviceName);
      setIpAddress(item.ipAddress || '');

      if (!validateMac(item.mac)) {
        setStatus({ message: 'Error: Invalid MAC address format', isError: true });
        return;
      }

      setLoading(true);
      setStatus(null);
      try {
        const res = await fetch(`/api/wake?mac=${item.mac}`);
        const data = await res.json();
        if (res.ok) {
          updateHistory(item.mac, item.deviceName, item.ipAddress);
          setStatus({ message: data.message, isError: false });

          if (item.ipAddress) {
            let attempts = 0;
            const maxAttempts = 10;
            const checkStatus = async () => {
              attempts++;
              console.log(`Checking status... Attempt ${attempts}`);
              try {
                const statusRes = await fetch(`/api/status?ip=${encodeURIComponent(item.ipAddress)}`);
                if (!statusRes.ok) throw new Error('Failed to check status');
                const statusData = await statusRes.json();
                if (statusData.online) {
                  setStatus(prev => ({ ...prev, message: `${prev.message} Device is online.` }));
                  clearInterval(intervalId);
                } else if (attempts >= maxAttempts) {
                  setStatus(prev => ({ ...prev, message: `${prev.message} Device did not come online.` }));
                  clearInterval(intervalId);
                }
              } catch (err) {
                if (attempts >= maxAttempts) {
                  setStatus(prev => ({ ...prev, message: `${prev.message} Error checking status.` }));
                  clearInterval(intervalId);
                }
              }
            };
            const intervalId = setInterval(checkStatus, 2000);
            checkStatus();
          }
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

  const updateHistory = (macToUpdate, deviceNameToUpdate, ipToUpdate) => {
    const targetMac = macToUpdate || mac;
    const targetDeviceName = deviceNameToUpdate || deviceName;
    const targetIp = ipToUpdate || ipAddress;

    const existingIndex = history.findIndex(item => item.mac === targetMac);
    const newItem = { mac: targetMac, deviceName: targetDeviceName, ipAddress: targetIp };

    const newHistory = existingIndex > -1
      ? history.map((item, idx) => idx === existingIndex ? newItem : item)
      : [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);

    setHistory(newHistory);
  };

  const handleRemoveHistoryItem = (index) => {
    const newHistory = history.filter((_, i) => i !== index);
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
          <div>
            <label htmlFor="ipAddress">IP Address/Hostname</label>
            <input
              id="ipAddress"
              type="text"
              placeholder="IP Address or Hostname (e.g., 192.168.1.100)"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              className="ipInput"
            />
          </div>
          <button
            onClick={handleWake}
            disabled={loading || !mac}
            className="wakeButton"
          >
            {loading ? 'Sending...' : 'Wake'}
          </button>
          <button
            onClick={() => {
              setMac('');
              setDeviceName('');
              setIpAddress('');
              setStatus('');
            }}
            className="clearButton"
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
                    {item.ipAddress && (
                      <div className="deviceStatus">
                        <span className="ipAddress">IP: {item.ipAddress}</span>
                        <span className={`statusIndicator ${deviceStatus[item.ipAddress] ? 'online' : 'offline'}`}>
                          {deviceStatus[item.ipAddress] ? '🟢 Online' : '⚫ Offline'}
                        </span>
                      </div>
                    )}
                    <div className="historyActions">
                      <button
                        onClick={handleHistoryWake(item)}
                        className="actionButton wakeAction"
                      >
                        Wake
                      </button>
                      <button
                        onClick={() => handleRemoveHistoryItem(index)}
                        className="actionButton removeAction"
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