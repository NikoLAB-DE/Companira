import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, LogOut, UserCircle, LayoutGrid, Wrench, BarChart2, BookOpen, Info, MessageSquare /* Added Chat icon */ } from 'lucide-react'; // Added MessageSquare

const Navbar = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    // Navigation is handled within signOut or by AuthProvider listener
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Side: Logo/Brand and Main Links */}
          <div className="flex items-center space-x-6">
            {/* Companira Logo/Brand Link */}
            <Link to="/" className="text-xl font-bold text-primary flex items-center">
              Companira
            </Link>
            {/* --- Desktop Navigation Links --- */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
               {/* Home/Chat Link */}
               <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors flex items-center">
                 {user ? <MessageSquare className="h-4 w-4 mr-1.5" /> : <LayoutGrid className="h-4 w-4 mr-1.5" />}
                 {user ? 'Chat' : 'Home'}
               </Link>
               {/* Life Situations Link (Always Visible) */}
               <Link to="/life-situations" className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors flex items-center">
                 <BookOpen className="h-4 w-4 mr-1.5" /> Life Situations
               </Link>
               {/* Analysis Link (Logged-in only) */}
               {user && (
                 <Link to="/analysis" className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors flex items-center">
                   <BarChart2 className="h-4 w-4 mr-1.5" /> Analysis
                 </Link>
               )}
               {/* Tools Link (Logged-in only) */}
               {user && (
                 <Link to="/tools" className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors flex items-center">
                   <Wrench className="h-4 w-4 mr-1.5" /> Tools
                 </Link>
               )}
               {/* About Link (Always Visible) */}
               <Link to="/about" className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors flex items-center">
                 <Info className="h-4 w-4 mr-1.5" /> About
               </Link>
            </div>
          </div>

          {/* Right Side: Theme Toggle, Auth Buttons/User Menu */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Theme Toggle Button */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {authLoading ? (
              <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
            ) : user ? (
              <>
                {/* User Avatar and Nickname */}
                <Link to="/profile" className="flex items-center space-x-2 hover:bg-accent p-1 rounded-md transition-colors">
                   <Avatar className="h-8 w-8">
                     <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                       {getInitials(user.nickname)}
                     </AvatarFallback>
                   </Avatar>
                   <span className="text-sm font-medium hidden sm:inline">{user.nickname}</span>
                </Link>

                {/* Sign Out Button */}
                <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
                  <LogOut className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                </Button>
              </>
            ) : (
              <>
                {/* Login/Signup Buttons */}
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Log In
                </Button>
                <Button variant="default" size="sm" onClick={() => navigate('/signup')}>
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>

         {/* --- Mobile Navigation Links --- */}
         <div className="md:hidden flex justify-around items-center py-2 border-t border-border bg-card">
             {/* Home/Chat Link */}
             <Link to="/" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex flex-col items-center text-center px-1">
               {user ? <MessageSquare className="h-5 w-5 mb-0.5" /> : <LayoutGrid className="h-5 w-5 mb-0.5" />}
               {user ? 'Chat' : 'Home'}
             </Link>
             {/* Life Situations Link (Always Visible) */}
             <Link to="/life-situations" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex flex-col items-center text-center px-1">
               <BookOpen className="h-5 w-5 mb-0.5" /> Situations
             </Link>
             {/* Analysis Link (Logged-in only) */}
             {user && (
               <Link to="/analysis" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex flex-col items-center text-center px-1">
                 <BarChart2 className="h-5 w-5 mb-0.5" /> Analysis
               </Link>
             )}
             {/* Tools Link (Logged-in only) */}
             {user && (
               <Link to="/tools" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex flex-col items-center text-center px-1">
                 <Wrench className="h-5 w-5 mb-0.5" /> Tools
               </Link>
             )}
             {/* About Link (Always Visible) */}
             <Link to="/about" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex flex-col items-center text-center px-1">
               <Info className="h-5 w-5 mb-0.5" /> About
             </Link>
             {/* Profile link only shown if logged in on mobile */}
             {user && (
                <Link to="/profile" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex flex-col items-center text-center px-1">
                  <UserCircle className="h-5 w-5 mb-0.5" /> Profile
                </Link>
             )}
         </div>
      </div>
    </nav>
  );
};

export default Navbar;
