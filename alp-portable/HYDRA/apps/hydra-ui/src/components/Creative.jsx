import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'

const MODALITIES = [
  { id: 'text', label: 'Text' },
  { id: 'image', label: 'Image' },
  { id: 'video', label: 'Video' },
  { id: '3d', label: '3D' },
  { id: 'audio', label: 'Audio' },
  { id: 'code', label: 'Code' },
]

function Creative() {
  const [goal, setGoal] = useState('')
  const [modality, setModality] = useState('text')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function handleGenerate() {
    if (!goal.trim()) return

    try {
      setLoading(true)
      setError(null)
      setResult(null)
      const response = await invoke('run_creative', { goal: goal.trim() })
      setResult(JSON.parse(response))
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="page-title">Creative Pipeline</h2>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">Modality</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {MODALITIES.map((m) => (
            <button
              key={m.id}
              className={`btn ${modality === m.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setModality(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">Goal / Prompt</div>
        <textarea
          className="textarea"
          placeholder="Describe your creative goal...&#10;&#10;Examples:&#10;- Create a logo and banner for a tech startup&#10;- Design a 3D model for a website&#10;- Write a hello world program in Rust"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={loading || !goal.trim()}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Generating...
              </>
            ) : (
              'Generate'
            )}
          </button>
        </div>
      </div>

      {error && <div className="error-message">Error: {error}</div>}

      {result && (
        <div className="card-glow">
          <div className="card-header">Result</div>
          <div style={{ marginBottom: 12 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Goal: </span>
            <span style={{ fontSize: 14 }}>{result.goal}</span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Summary: </span>
          </div>
          <div className="mono-block" style={{ marginBottom: 16 }}>
            {result.summary}
          </div>
          {result.artifacts && result.artifacts.length > 0 && (
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 8 }}>Artifacts:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.artifacts.map((artifact, idx) => (
                  <div key={idx} className="artifact-item">
                    <div>
                      <span className="modality">{artifact.modality}</span>
                    </div>
                    <div className="path">{artifact.path}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Creative
