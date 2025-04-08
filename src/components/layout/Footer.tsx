import React from 'react';
import { Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-card border-t border-border py-3 mt-auto"> {/* Reduced py-6 to py-3 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center text-xs"> {/* Reduced text size to text-xs */}
          <div className="flex items-center mb-2 md:mb-0"> {/* Reduced mb-4 to mb-2 */}
            <span className="text-muted-foreground">© {new Date().getFullYear()} Companira</span>
          </div>

          <div className="flex items-center text-muted-foreground mb-2 md:mb-0"> {/* Added mb-2 for spacing on mobile */}
            <span className="flex items-center">
              Made with <Heart className="h-3 w-3 mx-1 text-destructive" /> {/* Reduced icon size */}
              for mental wellbeing
            </span>
          </div>

          <div className="flex space-x-4"> {/* Reduced space-x-6 to space-x-4 */}
            <a href="#" className="text-primary hover:underline"> {/* Removed text-sm */}
              Privacy
            </a>
            <a href="#" className="text-primary hover:underline"> {/* Removed text-sm */}
              Terms
            </a>
            <a href="#" className="text-primary hover:underline"> {/* Removed text-sm */}
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
