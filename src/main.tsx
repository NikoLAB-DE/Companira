import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { checkSupabaseConnection } from './lib/supabase'
import { ThemeProvider } from './contexts/ThemeContext' // Import ThemeProvider

// Check Supabase connection on app start
checkSupabaseConnection()
  .then(isConnected => {
    if (!isConnected) {
      console.warn('Unable to connect to Supabase. Some features may not work correctly.');
    }
  });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Wrap with ThemeProvider */}
    <ThemeProvider defaultTheme="light" storageKey="companira-theme">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)
