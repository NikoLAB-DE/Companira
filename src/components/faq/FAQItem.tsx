import React, { useState } from 'react';
// Removed framer-motion imports
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type FAQItem as FAQItemType } from '@/data/faqData';

interface FAQItemProps {
  item: FAQItemType;
  index: number;
}

const FAQItem: React.FC<FAQItemProps> = ({ item, index }) => {
  const [isOpen, setIsOpen] = useState(false);
  const itemId = `faq-item-${index}`;
  const contentId = `faq-content-${index}`;

  return (
    // Use card styling for each item, add subtle border
    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
      <button
        // Increase padding, add hover/focus states, ensure full width
        className={cn(
          "flex justify-between items-center w-full px-6 py-4 text-left focus:outline-none transition-colors duration-150",
          "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card" // Added hover/focus
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        id={itemId}
      >
        {/* Adjust font size/weight, use foreground color */}
        <h3 className="text-lg font-medium text-foreground">{item.question}</h3>
        {/* Use primary color for icon, switch icon based on state */}
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-primary flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-primary flex-shrink-0" />
        )}
      </button>

      {/* Removed AnimatePresence and motion.div - Corrected && */}
      {isOpen && ( // <-- Corrected from &amp;amp;&amp;
        <div
          id={contentId}
          role="region"
          aria-labelledby={itemId}
          className="overflow-hidden" // Keep basic styling
        >
          {/* Add padding to the answer, use muted foreground color */}
          <div className="px-6 pb-4 pt-2 text-muted-foreground">
            {item.answer}
          </div>
        </div>
      )}
      {/* Removed AnimatePresence closing tag */}
    </div>
  );
};

export default FAQItem;
