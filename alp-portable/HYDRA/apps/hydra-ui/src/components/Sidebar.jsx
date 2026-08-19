function Sidebar({ activeTab, onTabChange }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'models', label: 'Models', icon: '🧠' },
    { id: 'creative', label: 'Creative', icon: '🎨' },
    { id: 'security', label: 'Security', icon: '🛡️' },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>HYDRA</h1>
        <p>Portable AI</p>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => onTabChange(item.id)}
          >
            <span className="icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
