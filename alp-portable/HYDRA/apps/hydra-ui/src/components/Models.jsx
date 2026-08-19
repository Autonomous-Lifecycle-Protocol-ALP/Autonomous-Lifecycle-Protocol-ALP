import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'

function Models() {
  const [modelDir, setModelDir] = useState('')
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleScan() {
    try {
      setLoading(true)
      setError(null)
      const result = await invoke('list_models', { modelDir })
      setModels(result || [])
    } catch (err) {
      setError(String(err))
      setModels([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="page-title">Models</h2>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">Model Directory</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            className="input"
            type="text"
            placeholder="Enter model directory path..."
            value={modelDir}
            onChange={(e) => setModelDir(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
          />
          <button
            className="btn btn-primary"
            onClick={handleScan}
            disabled={loading || !modelDir.trim()}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Scanning...
              </>
            ) : (
              'Scan'
            )}
          </button>
        </div>
      </div>

      {error && <div className="error-message">Error: {error}</div>}

      {models.length === 0 && !loading && !error && (
        <div className="empty-state">
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
          <div>No models found</div>
          <div style={{ fontSize: 12, marginTop: 8, color: 'var(--text-muted)' }}>
            Enter a model directory path and click Scan
          </div>
        </div>
      )}

      {models.length > 0 && (
        <div className="grid grid-3">
          {models.map((model, idx) => (
            <div key={idx} className="card">
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>{model}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Backend: local-file
              </div>
              <div style={{ marginTop: 12 }}>
                <span className="status-dot green"></span>
                <span style={{ fontSize: 12, color: 'var(--accent-green)' }}>Available</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Models
