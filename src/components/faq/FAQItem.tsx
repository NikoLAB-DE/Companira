import React, { useState } from 'react';
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
    // Use card styling, reduced vertical padding
    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
      <button
        // Reduced padding, ensure full width, maintain focus/hover
        className={cn(
          "flex justify-between items-center w-full px-4 py-3 text-left focus:outline-none transition-colors duration-150", // Reduced py-4 to py-3, px-6 to px-4
          "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        id={itemId}
      >
        {/* Reduced font size */}
        <h3 className="text-base font-medium text-foreground">{item.question}</h3> {/* Changed text-lg to text-base */}
        {/* Use primary color for icon, switch icon based on state */}
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-primary flex-shrink-0" /> // Reduced icon size
        ) : (
          <ChevronDown className="h-4 w-4 text-primary flex-shrink-0" /> // Reduced icon size
        )}
      </button>

      {isOpen && (
        <div
          id={contentId}
          role="region"
          aria-labelledby={itemId}
          className="overflow-hidden"
        >
          {/* Reduced padding, smaller text size */}
          <div className="px-4 pb-3 pt-1 text-sm text-muted-foreground"> {/* Reduced padding, added text-sm */}
            {item.answer}
          </div>
        </div>
      )}
    </div>
  );
};

export default FAQItem;
