import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { ProfileProvider } from './contexts/ProfileContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer'; // Ensure Footer is imported
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import AboutPage from './pages/AboutPage';
import ToolsPage from './pages/ToolsPage';
import AnalysisPage from './pages/AnalysisPage';
import LifeSituationsPage from './pages/LifeSituationsPage';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <ProfileProvider>
          <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Navbar />
            {/* Main content area */}
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-6"> {/* Added container and padding */}
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/tools" element={<ToolsPage />} />
                <Route path="/analysis" element={<AnalysisPage />} />
                {/* Adjusted LifeSituationsPage route to not use container padding if it needs full width */}
                <Route path="/life-situations" element={<LifeSituationsPage />} />
              </Routes>
            </main>
            <Footer /> {/* Re-added the Footer component */}
          </div>
        </ProfileProvider>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
