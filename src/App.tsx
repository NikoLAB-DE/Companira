import "@/components/CalendarPicker/CalendarPicker.css";
import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
// Removed ThemeProvider import from here
import { ProfileProvider } from './contexts/ProfileContext';
import { ChatProvider } from './contexts/ChatContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import LifeSituationsPage from './pages/LifeSituationsPage';
import AnalysisPage from './pages/AnalysisPage';
import ToolsPage from './pages/ToolsPage';
import AboutPage from './pages/AboutPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { Toaster } from "@/components/ui/toaster";

// Placeholder pages for routes added in Footer
const PrivacyPage = () => <div className="p-8"><h1>Privacy Policy</h1><p>Details about privacy...</p></div>;
const TermsPage = () => <div className="p-8"><h1>Terms of Service</h1><p>Details about terms...</p></div>;


function App() {
  return (
    // Removed ThemeProvider wrapper from here
    <AuthProvider>
      <ProfileProvider>
        <ChatProvider>
          {/* Layout: flex-col, min-h-screen, with main flex-grow and footer fixed */}
          <div className="flex flex-col min-h-screen">
            <Navbar />
            {/* Add bottom padding equal to footer height to prevent overlap */}
            {/* Use pb-footer utility class defined in index.css */}
            <main className="flex-grow container mx-auto px-4 py-8 pb-footer">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/privacy" element={<PrivacyPage />} /> {/* Added Privacy Route */}
                <Route path="/terms" element={<TermsPage />} />   {/* Added Terms Route */}


                {/* Routes accessible by anyone */}
                <Route path="/" element={<HomePage />} />
                <Route path="/life-situations" element={<LifeSituationsPage />} />
                <Route path="/life-situations/:topicId" element={<LifeSituationsPage />} />

                {/* Protected Routes */}
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/analysis" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
                <Route path="/tools" element={<ProtectedRoute><ToolsPage /></ProtectedRoute>} />

                {/* Optional: 404 Not Found Route */}
                {/* <Route path="*" element={<NotFoundPage />} /> */}
              </Routes>
            </main>
            <Toaster />
            {/* Footer is now fixed and always visible */}
            <Footer />
          </div>
        </ChatProvider>
      </ProfileProvider>
    </AuthProvider>
    // Removed ThemeProvider wrapper from here
  );
}

export default App;
