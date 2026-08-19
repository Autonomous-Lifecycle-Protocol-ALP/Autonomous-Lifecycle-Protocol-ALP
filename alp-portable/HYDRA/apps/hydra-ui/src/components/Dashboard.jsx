import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

function Dashboard() {
  const [hardware, setHardware] = useState(null)
  const [daemonStatus, setDaemonStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    async function loadData() {
      try {
        setLoading(true)
        const [hwRaw, statusRaw] = await Promise.all([
          invoke('get_hardware_profile'),
          invoke('get_daemon_status'),
        ])

        if (!mounted) return

        const hw = parseHardwareProfile(hwRaw)
        setHardware(hw)

        try {
          setDaemonStatus(JSON.parse(statusRaw))
        } catch {
          setDaemonStatus(null)
        }
      } catch (err) {
        if (mounted) setError(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadData()
    return () => { mounted = false }
  }, [])

  function parseHardwareProfile(raw) {
    const result = {}
    const content = raw.replace(/^HardwareProfile\s*\{\s*/, '').replace(/\s*\}\s*$/, '')
    const pairs = content.split(', ')
    for (const pair of pairs) {
      const idx = pair.indexOf(': ')
      if (idx !== -1) {
        const key = pair.slice(0, idx).trim()
        let value = pair.slice(idx + 2).trim()
        result[key] = value
      }
    }
    return result
  }

  function formatUptime(seconds) {
    if (!seconds && seconds !== 0) return '--'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div>
        <h2 className="page-title">Dashboard</h2>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="loading-spinner"></div>
            <span>Loading system status...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h2 className="page-title">Dashboard</h2>
        <div className="error-message">Failed to load dashboard: {error}</div>
      </div>
    )
  }

  const modelCount = daemonStatus?.models_loaded ?? 0
  const tasksProcessed = daemonStatus?.tasks_processed ?? 0
  const uptime = daemonStatus?.uptime ?? null
  const running = daemonStatus?.running ?? false

  return (
    <div>
      <h2 className="page-title">Dashboard</h2>

      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-header">System</div>
          {hardware && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>OS</span>
                <div style={{ fontSize: 14, marginTop: 2 }}>{hardware.os || '--'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Architecture</span>
                <div style={{ fontSize: 14, marginTop: 2 }}>{hardware.arch || '--'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>CPU Cores</span>
                <div style={{ fontSize: 14, marginTop: 2 }}>{hardware.cpu_cores || '--'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Total RAM</span>
                <div style={{ fontSize: 14, marginTop: 2 }}>{hardware.total_ram_mb ? `${hardware.total_ram_mb} MB` : '--'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Available RAM</span>
                <div style={{ fontSize: 14, marginTop: 2 }}>{hardware.available_ram_mb ? `${hardware.available_ram_mb} MB` : '--'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>GPU</span>
                <div style={{ fontSize: 14, marginTop: 2 }}>
                  {hardware.has_gpu === 'true' ? `Yes (${hardware.gpu_name || 'Unknown'})` : 'No'}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">Daemon</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Status</span>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 6 }}>
                <span className={`status-dot ${running ? 'green' : 'red'}`}></span>
                <span style={{ fontSize: 14 }}>{running ? 'Running' : 'Stopped'}</span>
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Tasks Processed</span>
              <div className="stat-value" style={{ fontSize: 22 }}>{tasksProcessed}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Uptime</span>
              <div style={{ fontSize: 14, marginTop: 2, fontFamily: 'var(--font-body)' }}>{formatUptime(uptime)}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">Models</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Loaded Models</span>
              <div className="stat-value" style={{ fontSize: 22 }}>{modelCount}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Model Directory</span>
              <div style={{ fontSize: 12, marginTop: 2, color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                {hardware ? '~/.hydra/models' : '--'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Hardware Profile</div>
        <div className="mono-block">
          {hardware ? Object.entries(hardware).map(([key, value]) => (
            <div key={key}>{key}: {value}</div>
          )) : 'No hardware data available'}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
