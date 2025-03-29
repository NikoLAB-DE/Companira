import React from 'react';
import { Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-card border-t border-border py-6 mt-8"> {/* Use card background and border */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <span className="text-muted-foreground">© {new Date().getFullYear()} Companira</span> {/* Use muted text */}
          </div>

          <div className="flex items-center text-muted-foreground text-sm"> {/* Use muted text */}
            <span className="flex items-center">
              Made with <Heart className="h-4 w-4 mx-1 text-destructive" /> for mental wellbeing {/* Use destructive (red) for heart */}
            </span>
          </div>

          <div className="flex space-x-6 mt-4 md:mt-0">
            {/* Use primary color for links */}
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
