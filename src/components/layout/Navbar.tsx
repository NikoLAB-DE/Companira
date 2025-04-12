import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Moon, Sun, LogOut, UserCircle, LayoutGrid, Wrench, BarChart2, BookOpen, Info,
  MessageSquare, // Added for Chat
  ClipboardList // Added for Tools
} from 'lucide-react';
import { cn } from '@/lib/utils'; // Import cn for conditional classes

const Navbar = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme(); // Ensure toggleTheme is correctly used

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

  const commonLinkClasses = "px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors flex items-center";
  const disabledLinkClasses = "opacity-50 cursor-not-allowed pointer-events-none";

  const mobileCommonLinkClasses = "text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex flex-col items-center text-center px-1";
  const mobileDisabledLinkClasses = "opacity-50 cursor-not-allowed pointer-events-none";


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
               {/* Home / Chat Link */}
               {user ? (
                 <Link to="/" className={cn(commonLinkClasses)}>
                   <MessageSquare className="h-4 w-4 mr-1.5" /> Chat
                 </Link>
               ) : (
                 <Link to="/" className={cn(commonLinkClasses)}>
                   Home
                 </Link>
               )}
               {/* Life Situations Link (Always Visible) */}
               <Link to="/life-situations" className={cn(commonLinkClasses)}>
                 <BookOpen className="h-4 w-4 mr-1.5" /> Life Situations
               </Link>
               {/* Analysis Link (Conditional) */}
               <Link
                 to="/analysis"
                 className={cn(commonLinkClasses, !user && disabledLinkClasses)}
                 aria-disabled={!user}
                 onClick={(e) => !user && e.preventDefault()} // Prevent navigation if disabled
               >
                 <BarChart2 className="h-4 w-4 mr-1.5" /> Analysis
               </Link>
               {/* Tools Link (Conditional) */}
               <Link
                 to="/tools"
                 className={cn(commonLinkClasses, !user && disabledLinkClasses)}
                 aria-disabled={!user}
                 onClick={(e) => !user && e.preventDefault()} // Prevent navigation if disabled
               >
                 <ClipboardList className="h-4 w-4 mr-1.5" /> Tools {/* Updated Icon */}
               </Link>
               {/* About Link (Always Visible) */}
               <Link to="/about" className={cn(commonLinkClasses)}>
                 <Info className="h-4 w-4 mr-1.5" /> About
               </Link>
            </div>
          </div>

          {/* Right Side: Theme Toggle, Auth Buttons/User Menu */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Theme Toggle Button - Ensure onClick directly calls toggleTheme */}
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
             {/* Home / Chat Link */}
             {user ? (
               <Link to="/" className={cn(mobileCommonLinkClasses)}>
                 <MessageSquare className="h-5 w-5 mb-0.5" /> Chat
               </Link>
             ) : (
               <Link to="/" className={cn(mobileCommonLinkClasses)}>
                 <LayoutGrid className="h-5 w-5 mb-0.5" /> Home
               </Link>
             )}
             {/* Life Situations Link (Always Visible) */}
             <Link to="/life-situations" className={cn(mobileCommonLinkClasses)}>
               <BookOpen className="h-5 w-5 mb-0.5" /> Situations
             </Link>
             {/* Analysis Link (Conditional) */}
             <Link
               to="/analysis"
               className={cn(mobileCommonLinkClasses, !user && mobileDisabledLinkClasses)}
               aria-disabled={!user}
               onClick={(e) => !user && e.preventDefault()} // Prevent navigation if disabled
             >
               <BarChart2 className="h-5 w-5 mb-0.5" /> Analysis
             </Link>
             {/* Tools Link (Conditional) */}
             <Link
               to="/tools"
               className={cn(mobileCommonLinkClasses, !user && mobileDisabledLinkClasses)}
               aria-disabled={!user}
               onClick={(e) => !user && e.preventDefault()} // Prevent navigation if disabled
             >
               <ClipboardList className="h-5 w-5 mb-0.5" /> Tools {/* Updated Icon */}
             </Link>
             {/* About Link (Always Visible) */}
             <Link to="/about" className={cn(mobileCommonLinkClasses)}>
               <Info className="h-5 w-5 mb-0.5" /> About
             </Link>
             {/* Profile link only shown if logged in on mobile */}
             {user && (
                <Link to="/profile" className={cn(mobileCommonLinkClasses)}>
                  <UserCircle className="h-5 w-5 mb-0.5" /> Profile
                </Link>
             )}
         </div>
      </div>
    </nav>
  );
};

export default Navbar;
