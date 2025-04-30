import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTheme } from '@/contexts/ThemeContext';
import { useAdmin } from '@/contexts/AdminContext'; // Import useAdmin
import {
  Moon, Sun, LogOut, UserCircle, LayoutGrid, Wrench, BarChart2, BookOpen, Info,
  MessageSquare,
  ClipboardList
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const Navbar = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { registerLogoClick } = useAdmin(); // Get registerLogoClick function

  const { data: darkLogoData } = supabase.storage.from('logo').getPublicUrl('companira_logo_dark_mode.png');
  const { data: lightLogoData } = supabase.storage.from('logo').getPublicUrl('companira_logo_light_mode.png');

  const darkLogoUrl = darkLogoData?.publicUrl;
  const lightLogoUrl = lightLogoData?.publicUrl;

  const handleSignOut = async () => {
    await signOut();
  };

  const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // Prevent navigation if it's just for admin activation
    // Allow navigation if admin is already active or if it's a normal click?
    // For simplicity, let's always register the click. Navigation still happens.
    registerLogoClick();
    // If you want to PREVENT navigation during the 5 clicks, you'd need more complex state.
    // Example: if (clickCount < 5) event.preventDefault();
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
            {/* Companira Logo/Brand Link - ADD onClick HANDLER */}
            <Link
              to="/"
              className="text-xl font-bold text-primary flex items-center"
              onClick={handleLogoClick} // Add the click handler here
            >
              {/* Theme-aware Logo */}
              {theme === 'dark' && darkLogoUrl &&
                <img src={darkLogoUrl} alt="Companira Logo Dark" width={40} height={40} className="mr-2 h-10 w-10 pointer-events-none" /> // Added pointer-events-none to img
              }
              {theme === 'light' && lightLogoUrl &&
                <img src={lightLogoUrl} alt="Companira Logo Light" width={40} height={40} className="mr-2 h-10 w-10 pointer-events-none" /> // Added pointer-events-none to img
              }
              {((!darkLogoUrl && theme === 'dark') || (!lightLogoUrl && theme === 'light')) &&
                <span className="mr-2 w-10 h-10"></span>
              }
              Companira
            </Link>
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
               {user ? (
                 <Link to="/" className={cn(commonLinkClasses)}>
                   <MessageSquare className="h-4 w-4 mr-1.5" /> Chat
                 </Link>
               ) : (
                 <Link to="/" className={cn(commonLinkClasses)}>
                   Home
                 </Link>
               )}
               <Link to="/life-situations" className={cn(commonLinkClasses)}>
                 <BookOpen className="h-4 w-4 mr-1.5" /> Life Situations
               </Link>
               <Link
                 to="/analysis"
                 className={cn(commonLinkClasses, !user && disabledLinkClasses)}
                 aria-disabled={!user}
                 onClick={(e) => !user && e.preventDefault()}
               >
                 <BarChart2 className="h-4 w-4 mr-1.5" /> Analysis
               </Link>
               <Link
                 to="/tools"
                 className={cn(commonLinkClasses, !user && disabledLinkClasses)}
                 aria-disabled={!user}
                 onClick={(e) => !user && e.preventDefault()}
               >
                 <ClipboardList className="h-4 w-4 mr-1.5" /> Tools
               </Link>
               <Link to="/about" className={cn(commonLinkClasses)}>
                 <Info className="h-4 w-4 mr-1.5" /> About
               </Link>
            </div>
          </div>

          {/* Right Side: Theme Toggle, Auth Buttons/User Menu */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {authLoading ? (
              <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
            ) : user ? (
              <>
                <Link to="/profile" className="flex items-center space-x-2 hover:bg-accent p-1 rounded-md transition-colors">
                   <Avatar className="h-8 w-8">
                     <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                       {getInitials(user.nickname)}
                     </AvatarFallback>
                   </Avatar>
                   <span className="text-sm font-medium hidden sm:inline">{user.nickname}</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
                  <LogOut className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                </Button>
              </>
            ) : (
              <>
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

         {/* Mobile Navigation Links */}
         <div className="md:hidden flex justify-around items-center py-2 border-t border-border bg-card">
             {user ? (
               <Link to="/" className={cn(mobileCommonLinkClasses)}>
                 <MessageSquare className="h-5 w-5 mb-0.5" /> Chat
               </Link>
             ) : (
               <Link to="/" className={cn(mobileCommonLinkClasses)}>
                 <LayoutGrid className="h-5 w-5 mb-0.5" /> Home
               </Link>
             )}
             <Link to="/life-situations" className={cn(mobileCommonLinkClasses)}>
               <BookOpen className="h-5 w-5 mb-0.5" /> Situations
             </Link>
             <Link
               to="/analysis"
               className={cn(mobileCommonLinkClasses, !user && mobileDisabledLinkClasses)}
               aria-disabled={!user}
               onClick={(e) => !user && e.preventDefault()}
             >
               <BarChart2 className="h-5 w-5 mb-0.5" /> Analysis
             </Link>
             <Link
               to="/tools"
               className={cn(mobileCommonLinkClasses, !user && mobileDisabledLinkClasses)}
               aria-disabled={!user}
               onClick={(e) => !user && e.preventDefault()}
             >
               <ClipboardList className="h-5 w-5 mb-0.5" /> Tools
             </Link>
             <Link to="/about" className={cn(mobileCommonLinkClasses)}>
               <Info className="h-5 w-5 mb-0.5" /> About
             </Link>
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
