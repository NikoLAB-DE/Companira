import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { ProfileProvider } from './contexts/ProfileContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import AboutPage from './pages/AboutPage';
import ToolsPage from './pages/ToolsPage';
import AnalysisPage from './pages/AnalysisPage';
import './index.css';
// No need to import useTheme here if Navbar handles the toggle

function App() {
  // Theme class is applied by ThemeProvider in ThemeContext.tsx
  return (
    <AuthProvider>
      <ChatProvider>
        <ProfileProvider>
          {/* The 'dark' class will be applied to <html> by ThemeProvider */}
          <div className="flex flex-col min-h-screen bg-background text-foreground"> {/* Ensure base colors are applied */}
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/tools" element={<ToolsPage />} />
                <Route path="/analysis" element={<AnalysisPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </ProfileProvider>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
