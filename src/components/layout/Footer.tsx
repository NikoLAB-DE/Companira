import React from 'react';
import { Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-card border-t border-border py-6 mt-auto"> {/* Changed mt-8 to mt-auto to push footer down */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <span className="text-muted-foreground">© {new Date().getFullYear()} Companira</span>
          </div>

          <div className="flex items-center text-muted-foreground text-sm">
            <span className="flex items-center">
              Made with <Heart className="h-4 w-4 mx-1 text-destructive" /> for mental wellbeing
            </span>
          </div>

          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-primary hover:underline text-sm">
              Privacy
            </a>
            <a href="#" className="text-primary hover:underline text-sm">
              Terms
            </a>
            <a href="#" className="text-primary hover:underline text-sm">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
