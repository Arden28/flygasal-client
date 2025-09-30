import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import AuthAutoRefresh from './components/system/AuthAutoRefresh'

function App() {
  
  return (
    <AuthProvider>
      <AuthAutoRefresh intervalMs={0} />  {/* 0 = disabled, otherwise set to e.g. 15 * 60 * 1000 for 15 minutes */}
      <AppRoutes />
    </AuthProvider>
    );
}

export default App
