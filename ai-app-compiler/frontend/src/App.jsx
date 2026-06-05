import { useState } from 'react'
import HomePage from './pages/HomePage'
import EvalPage from './pages/EvalPage'

export default function App() {
  const [activeTab, setActiveTab] = useState('compiler')

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon">⚡</div>
            <span className="logo-text">AI App Compiler</span>
            <span className="logo-badge">v1.0</span>
          </div>
          <nav className="nav-tabs">
            <button
              id="tab-compiler"
              className={`nav-tab ${activeTab === 'compiler' ? 'active' : ''}`}
              onClick={() => setActiveTab('compiler')}
            >
              🔧 Compiler
            </button>
            <button
              id="tab-eval"
              className={`nav-tab ${activeTab === 'eval' ? 'active' : ''}`}
              onClick={() => setActiveTab('eval')}
            >
              📊 Evaluation
            </button>
          </nav>
        </div>
      </header>
      <main className="main-content">
        {activeTab === 'compiler' ? <HomePage /> : <EvalPage />}
      </main>
    </div>
  )
}
