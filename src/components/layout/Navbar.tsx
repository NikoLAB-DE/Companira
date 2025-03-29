import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, User, BarChart2, Wrench, Info, Menu, X, Sun, Moon } from 'lucide-react'; // Import Sun/Moon
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext'; // Import useTheme

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme(); // Use theme context
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navItems = [
    { path: '/', label: 'Chat', icon: <MessageSquare className="h-5 w-5" /> },
    { path: '/profile', label: 'Profile', icon: <User className="h-5 w-5" /> },
    { path: '/analysis', label: 'Analysis', icon: <BarChart2 className="h-5 w-5" /> },
    { path: '/tools', label: 'Tools', icon: <Wrench className="h-5 w-5" /> },
    { path: '/about', label: 'About', icon: <Info className="h-5 w-5" /> },
  ];

  return (
    <nav className="bg-card shadow-md border-b border-border sticky top-0 z-50"> {/* Make navbar sticky */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <MessageSquare className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-foreground">Companira</span>
              </Link>
            </div>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center md:space-x-1"> {/* Reduced space slightly */}
            {user && (
              <>
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out ${
                      location.pathname === item.path
                        ? 'bg-secondary text-secondary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </Link>
                ))}
                 <Button
                  variant="ghost" // Use ghost for subtle icon button
                  size="icon"
                  onClick={toggleTheme}
                  className="ml-2 text-muted-foreground hover:text-foreground hover:bg-muted"
                  aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                  {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => signOut()}
                  className="ml-2 border-primary text-primary hover:bg-primary/10"
                >
                  Sign Out
                </Button>
              </>
            )}
            {!user && (
              <div className="flex items-center space-x-2">
                 <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted"
                  aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                  {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </Button>
                <Link to="/login">
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">Log In</Button>
                </Link>
                <Link to="/signup">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
             {/* Theme toggle for mobile */}
             <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="mr-2 text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {user && (
              <>
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-150 ease-in-out ${
                      location.pathname === item.path
                        ? 'bg-secondary text-secondary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </Link>
                ))}
                <button
                  onClick={() => {
                    signOut();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center px-3 py-2 rounded-md text-base font-medium text-primary border border-primary hover:bg-primary/10 mt-2"
                >
                  Sign Out
                </button>
              </>
            )}
            {!user && (
              <div className="space-y-2 pt-2">
                <Link
                  to="/login"
                  className="block w-full px-3 py-2 rounded-md text-base font-medium text-center text-primary border border-primary hover:bg-primary/10"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="block w-full px-3 py-2 rounded-md text-base font-medium text-center text-primary-foreground bg-primary hover:bg-primary/90"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
