import React from 'react';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const LockedToolContent: React.FC = () => {
  return (
    <div className={cn(
      "text-center p-4 flex flex-col items-center justify-center h-full",
      "text-gray-500 dark:text-gray-400" // Dark mode text
    )}>
      <Lock className="h-8 w-8 mx-auto mb-2" />
      <p>Please log in to use this tool.</p>
    </div>
  );
};

export default LockedToolContent;
