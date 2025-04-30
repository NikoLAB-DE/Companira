import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { checkSupabaseConnection } from './lib/supabase'
import { ThemeProvider } from './contexts/ThemeContext'
import { AdminProvider } from './contexts/AdminContext' // Import AdminProvider

// Check Supabase connection on app start
checkSupabaseConnection()
  .then(isConnected => {
    if (!isConnected) {
      console.warn('Unable to connect to Supabase. Some features may not work correctly.');
    }
  });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="light" storageKey="companira-theme">
        {/* Wrap App with AdminProvider */}
        <AdminProvider>
          <App />
        </AdminProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
