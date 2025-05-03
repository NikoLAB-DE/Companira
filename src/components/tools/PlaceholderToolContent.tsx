import React from 'react';
import { cn } from '@/lib/utils';

interface PlaceholderToolContentProps {
  contentPlaceholder: string;
  isMaximized: boolean;
}

const PlaceholderToolContent: React.FC<PlaceholderToolContentProps> = ({ contentPlaceholder, isMaximized }) => {
  return (
    <div className={cn(
      "text-center p-4 flex items-center justify-center h-full",
      "text-gray-500 dark:text-gray-400", // Dark mode text
      isMaximized ? 'flex-col' : '' // Center vertically in maximized view
    )}>
      <p className={isMaximized ? 'mb-4' : ''}>
        {contentPlaceholder}
        {isMaximized && <span className="block mt-4 text-sm">(Full tool interface will appear here)</span>}
      </p>
    </div>
  );
};

export default PlaceholderToolContent;
