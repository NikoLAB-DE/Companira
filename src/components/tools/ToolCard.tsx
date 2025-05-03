import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Maximize2, Minimize2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  contentPlaceholder: string;
  requiresAuth?: boolean;
  isNew?: boolean;
}

interface ToolCardProps {
  tool: Tool;
  isMaximized: boolean;
  user: ReturnType<typeof useAuth>['user'];
  onMaximize: (id: string, requiresAuth?: boolean) => void;
  onMinimize: () => void;
  children: React.ReactNode; // Content to display inside the card
}

const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  isMaximized,
  user,
  onMaximize,
  onMinimize,
  children,
}) => {
  const isLocked = tool.requiresAuth && !user;

  return (
    <Card key={tool.id} className={isMaximized ? 'transition-all duration-300 ease-in-out flex flex-col' : ''}>
      <CardHeader className="flex flex-row items-start justify-between flex-shrink-0">
        <div>
          <CardTitle className="flex items-center mb-1">
            <tool.icon className={`h-5 w-5 mr-2 ${tool.iconColor}`} />
            {tool.title}
            {tool.isNew && (
              <span className="ml-2 inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                New
              </span>
            )}
            {isLocked && !isMaximized && <Lock className="h-4 w-4 ml-2 text-gray-400" title="Login required" />}
          </CardTitle>
          <CardDescription>
            {tool.description}
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => isMaximized ? onMinimize() : onMaximize(tool.id, tool.requiresAuth)}
          aria-label={isMaximized ? 'Minimize tool' : 'Maximize tool'}
          disabled={isLocked && !isMaximized}
          title={isLocked && !isMaximized ? "Login required to use this tool" : (isMaximized ? 'Minimize tool' : 'Maximize tool')}
        >
          {isMaximized ? (
            <Minimize2 className="h-5 w-5" />
          ) : (
             isLocked ? <Lock className="h-5 w-5 text-gray-400" /> : <Maximize2 className="h-5 w-5" />
          )}
        </Button>
      </CardHeader>
      <CardContent className={cn(
        "bg-gray-50 dark:bg-slate-900 rounded-b-lg",
        isMaximized ? 'flex-grow p-0 overflow-y-auto' : 'h-48 p-4 overflow-y-auto'
      )}>
        {children} {/* Render the content passed as children */}
      </CardContent>
    </Card>
  );
};

export default ToolCard;
