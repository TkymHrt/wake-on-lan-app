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

    checkAllDevicesStatus();
    const intervalId = setInterval(checkAllDevicesStatus, 30000);
    return () => clearInterval(intervalId);
  }, [history]);

  const validateMac = (mac) => {
    const regex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return regex.test(mac);
  };

  const handleWake = async (targetMac = mac, targetDeviceName = deviceName, targetIp = ipAddress) => {
    if (!validateMac(targetMac)) {
      setStatus({ message: 'Error: Invalid MAC address format (use XX:XX:XX:XX:XX:XX)', isError: true });
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/wake?mac=${targetMac}`);
      const data = await res.json();
      if (res.ok) {
        updateHistory(targetMac, targetDeviceName, targetIp);
        setStatus({ message: data.message, isError: false });

        if (targetIp) {
          let attempts = 0;
          const maxAttempts = 10;
          const checkStatus = async () => {
            attempts++;
            try {
              const statusRes = await fetch(`/api/status?ip=${encodeURIComponent(targetIp)}`);
              if (!statusRes.ok) throw new Error('Failed to check status');
              const statusData = await statusRes.json();
              if (statusData.online) {
                setStatus({ message: `${data.message}\nDevice is online.`, isError: false });
                clearInterval(intervalId);
              } else if (attempts >= maxAttempts) {
                setStatus({ message: `${data.message}\nDevice did not come online.`, isError: false });
                clearInterval(intervalId);
              }
            } catch (err) {
              if (attempts >= maxAttempts) {
                setStatus({ message: `${data.message}\nError checking status.`, isError: true });
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
        
        <header className="appHeader">
          <h1>Wake on LAN</h1>
        </header>

        <div className="mainSection">
          <div className="formCard">
            <div className="formSections">
              <div className="formSection">
                <div className="inputGroup">
                  <div className="inputWrapper">
                    <label htmlFor="macAddress">MAC Address <span className="required">*</span></label>
                    <input
                      id="macAddress"
                      type="text"
                      placeholder="例: AA:BB:CC:DD:EE:FF"
                      value={mac}
                      onChange={(e) => setMac(e.target.value)}
                      className="macInput"
                      disabled={loading}
                    />
                    {!validateMac(mac) && mac.length > 0 && (
                      <p className="inputError">無効なMACアドレス形式です</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="formSection">
                <div className="inputGroup">
                  <div className="inputWrapper">
                    <label htmlFor="deviceName">デバイス名</label>
                    <input
                      id="deviceName"
                      type="text"
                      placeholder="例: オフィスPC"
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      className="deviceNameInput"
                      disabled={loading}
                    />
                  </div>

                  <div className="inputWrapper">
                    <label htmlFor="ipAddress">IPアドレス/ホスト名</label>
                    <input
                      id="ipAddress"
                      type="text"
                      placeholder="例: 192.168.1.100"
                      value={ipAddress}
                      onChange={(e) => setIpAddress(e.target.value)}
                      className="ipInput"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="buttonGroup">
              <button
                onClick={() => handleWake()}
                disabled={loading || !mac}
                className="wakeButton"
              >
                {loading ? (
                  <span className="buttonContent">
                    <span className="buttonSpinner" />
                    送信中...
                  </span>
                ) : (
                  '起動する'
                )}
              </button>
              <button
                onClick={() => {
                  setMac('');
                  setDeviceName('');
                  setIpAddress('');
                  setStatus('');
                }}
                className="clearButton"
                disabled={loading}
              >
                クリア
              </button>
            </div>
          </div>

          {status && (
            <div className={`statusCard ${status.isError ? 'error' : 'success'}`}>
              <div className="statusHeader">
                <span className="statusIcon">{status.isError ? '❌' : '✅'}</span>
                <span className="statusTitle">{status.isError ? 'エラー' : '成功'}</span>
              </div>
              <div className="statusMessages">
                {status.message.split('\n').map((msg, i) => (
                  <div key={i} className="statusLine">{msg}</div>
                ))}
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="historyCard">
              <div className="historyHeader">
                <h2 className="sectionTitle">使用したデバイス</h2>
                <div className="historyHeaderActions">
                  <span className="historyCount">{history.length} デバイス</span>
                </div>
              </div>
              <div className="historyGrid">
                {history.map((item, index) => (
                  <div key={index} className="historyItemContainer">
                    <div className="historyItem">
                      <div className="itemHeader">
                        <span className="deviceName">{item.deviceName || 'Unknown Device'}</span>
                        {item.ipAddress && (
                          <span className={`statusBadge ${deviceStatus[item.ipAddress] ? 'online' : 'offline'}`}>
                            {deviceStatus[item.ipAddress] ? '🟢 オンライン' : '⚫ オフライン'}
                          </span>
                        )}
                      </div>
                      <div className="itemDetails">
                        <span className="macAddress">MAC: {item.mac}</span>
                        {item.ipAddress && (
                          <span className="ipAddress">IP: {item.ipAddress}</span>
                        )}
                      </div>
                      <div className="historyActions">
                        <button
                          onClick={() => handleWake(item.mac, item.deviceName, item.ipAddress)}
                          className="actionButton wakeAction"
                        >
                          起動
                        </button>
                        <button
                          onClick={() => handleRemoveHistoryItem(index)}
                          className="actionButton removeAction"
                        >
                          削除
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
    </div>
  );
}

export default App;