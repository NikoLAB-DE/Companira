import React from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom'; // Import Link

const FOOTER_HEIGHT = 56; // px, must match the height in styles

const Footer: React.FC = () => {
  return (
    <footer
      className="bg-card border-t border-border py-3 px-0 w-full fixed bottom-0 left-0 z-40"
      style={{ height: `${FOOTER_HEIGHT}px` }}
      data-testid="footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <div className="flex flex-col md:flex-row justify-between items-center w-full text-xs h-full">
          <div className="flex items-center mb-2 md:mb-0">
            <span className="text-muted-foreground">© {new Date().getFullYear()} Companira</span>
          </div>
          <div className="flex items-center text-muted-foreground mb-2 md:mb-0">
            <span className="flex items-center">
              Made with <Heart className="h-3 w-3 mx-1 text-destructive" />
              for mental wellbeing
            </span>
          </div>
          <div className="flex space-x-4">
            {/* Use Link for internal navigation */}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy
            </Link>
            <Link to="/terms" className="text-primary hover:underline">
              Terms
            </Link>
            <Link to="/about" className="text-primary hover:underline">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Placeholder pages for Privacy and Terms (if they don't exist)
// You might want to create actual pages later.
const PrivacyPage = () => <div className="p-8"><h1>Privacy Policy</h1><p>Details about privacy...</p></div>;
const TermsPage = () => <div className="p-8"><h1>Terms of Service</h1><p>Details about terms...</p></div>;

// You'll need to add routes for these in your main router (e.g., App.tsx)
// Example:
// <Route path="/privacy" element={<PrivacyPage />} />
// <Route path="/terms" element={<TermsPage />} />

export default Footer;
