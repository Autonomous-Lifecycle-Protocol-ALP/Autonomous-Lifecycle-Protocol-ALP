import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'

function Security() {
  const [killSwitchActive, setKillSwitchActive] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleEmergencyStop() {
    try {
      setLoading(true)
      await invoke('emergency_stop')
      setKillSwitchActive(true)
    } catch (err) {
      setScanResult(`Error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleSecurityScan() {
    try {
      setLoading(true)
      setScanResult(null)
      const result = await invoke('security_scan')
      setScanResult(result)
    } catch (err) {
      setScanResult(`Error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="page-title">Security</h2>

      {killSwitchActive && (
        <div className="warning-banner">
          <span className="icon">⚠️</span>
          <div className="text">
            <strong>EMERGENCY STOP ACTIVATED</strong>
            <div style={{ marginTop: 4, fontSize: 12, opacity: 0.8 }}>
              The kill switch has been triggered. All operations are halted.
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-header">Kill Switch</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className={`status-dot ${killSwitchActive ? 'red' : 'green'}`}></span>
              <span style={{ fontSize: 16, fontFamily: 'var(--font-heading)', letterSpacing: 1 }}>
                {killSwitchActive ? 'TRIGGERED' : 'SAFE'}
              </span>
            </div>
            <button
              className="btn btn-danger"
              onClick={handleEmergencyStop}
              disabled={loading || killSwitchActive}
              style={{ padding: '14px 24px', fontSize: 16, letterSpacing: 1 }}
            >
              {loading ? 'Processing...' : killSwitchActive ? 'ACTIVATED' : 'EMERGENCY STOP'}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">Security Scan</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <button
              className="btn btn-warning"
              onClick={handleSecurityScan}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Scanning...
                </>
              ) : (
                'Run Security Scan'
              )}
            </button>
            {scanResult && (
              <div className="mono-block" style={{ fontSize: 13 }}>
                {scanResult}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Security Status</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Kill Switch</div>
            <div style={{ fontSize: 16, marginTop: 6, color: killSwitchActive ? 'var(--accent-red)' : 'var(--accent-green)' }}>
              {killSwitchActive ? 'Triggered' : 'Active'}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Policy Engine</div>
            <div style={{ fontSize: 16, marginTop: 6, color: 'var(--accent-green)' }}>Running</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Audit Log</div>
            <div style={{ fontSize: 16, marginTop: 6, color: 'var(--accent-green)' }}>Active</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Security
