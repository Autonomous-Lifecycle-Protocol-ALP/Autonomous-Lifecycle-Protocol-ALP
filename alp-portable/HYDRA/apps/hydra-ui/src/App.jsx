import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Models from './components/Models'
import Creative from './components/Creative'
import Security from './components/Security'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'models':
        return <Models />
      case 'creative':
        return <Creative />
      case 'security':
        return <Security />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="app">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main">
        {renderContent()}
      </main>
    </div>
  )
}

export default App
