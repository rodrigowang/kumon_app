import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '20px',
      }}
    >
      <h1
        style={{
          fontSize: '48px',
          color: '#4CAF50',
          marginBottom: '24px',
          fontWeight: 800,
        }}
      >
        Kumon Math App
      </h1>
      <p style={{ fontSize: '24px', marginBottom: '32px' }}>
        Projeto inicializado com sucesso! ✅
      </p>
      <button
        data-testid="play-button"
        onClick={() => {
          setCount((c) => c + 1)
        }}
        style={{
          fontSize: '32px',
          padding: '20px 40px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '16px',
          cursor: 'pointer',
          fontWeight: 700,
          minWidth: '240px',
          minHeight: '80px',
          touchAction: 'manipulation',
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.95)'
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        Clique aqui: {count}
      </button>
      <p
        style={{
          fontSize: '18px',
          marginTop: '24px',
          color: '#666',
          textAlign: 'center',
        }}
      >
        TypeScript strict ✅ • ESLint ✅ • Prettier ✅ • PWA ✅
        <br />
        Zustand ✅ • Howler.js ✅ • Fonte Nunito ✅
      </p>
    </div>
  )
}

export default App
