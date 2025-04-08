import { Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ChatProvider } from '@/contexts/ChatContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import ProfilePage from '@/pages/ProfilePage';
import MyDashboardPage from '@/pages/MyDashboardPage';
import LifeSituationsPage from '@/pages/LifeSituationsPage';
import AnalysisPage from '@/pages/AnalysisPage';
import ToolsPage from '@/pages/ToolsPage';
import AboutPage from '@/pages/AboutPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function AppLayout() {
  return (
    <div className="flex flex-col h-screen"> {/* Changed min-h-screen to h-screen */}
      <Navbar />
      {/* Make the main content area grow and scroll independently */}
      <main className="flex-grow overflow-y-auto"> {/* Removed flex flex-col, changed overflow-hidden to overflow-y-auto */}
        <Outlet /> {/* Child routes will render here */}
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <AuthProvider>
        <ProfileProvider>
          <ChatProvider>
            <Routes>
              <Route element={<AppLayout />}>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/life-situations" element={<LifeSituationsPage />} />
                <Route path="/about" element={<AboutPage />} />

                {/* Protected Routes */}
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                 <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <MyDashboardPage />
                  </ProtectedRoute>
                } />
                 <Route path="/analysis" element={
                  <ProtectedRoute>
                    <AnalysisPage />
                  </ProtectedRoute>
                } />
                 <Route path="/tools" element={
                  <ProtectedRoute>
                    <ToolsPage />
                  </ProtectedRoute>
                } />

                {/* Add other routes as needed */}
              </Route>
            </Routes>
          </ChatProvider>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
