import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button'; // Import Button
import { PenTool, Pin, ListChecks, MapPin, Maximize2, Minimize2 } from 'lucide-react'; // Import new icons

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  contentPlaceholder: string;
}

const toolsData: Tool[] = [
  { 
    id: 'journaling', 
    title: 'Guided Journaling', 
    description: 'Structured prompts to help you reflect', 
    icon: PenTool, 
    iconColor: 'text-blue-600', 
    contentPlaceholder: 'Journaling prompts coming soon' 
  },
  { 
    id: 'pinned', 
    title: 'Pinned conversations', // Updated title
    description: 'Quick access to important chats', // Updated description
    icon: Pin, // Updated icon
    iconColor: 'text-green-600', 
    contentPlaceholder: 'Pinned conversations feature coming soon' 
  },
  { 
    id: 'todo', 
    title: 'To-Do-How-To', // Updated title
    description: 'Manage tasks and get guidance', // Updated description
    icon: ListChecks, // Updated icon
    iconColor: 'text-purple-600', 
    contentPlaceholder: 'To-Do list and guides coming soon' 
  },
  { 
    id: 'findHelp', 
    title: 'Find support, activities in your area', // Updated title
    description: 'Local resources and community connections', // Updated description
    icon: MapPin, // Updated icon
    iconColor: 'text-red-600', 
    contentPlaceholder: 'Local resource finder coming soon' 
  },
];

const ToolsPage: React.FC = () => {
  const [maximizedCardId, setMaximizedCardId] = useState<string | null>(null);

  const handleMaximize = (id: string) => {
    setMaximizedCardId(id);
  };

  const handleMinimize = () => {
    setMaximizedCardId(null);
  };

  const cardsToDisplay = maximizedCardId 
    ? toolsData.filter(tool => tool.id === maximizedCardId) 
    : toolsData;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Tools & Exercises</h1>
      {!maximizedCardId && (
         <p className="text-gray-600 mb-8">
           Explore additional tools and exercises to support your mental wellbeing.
           These features are coming soon. Click the expand icon to focus on a tool.
         </p>
      )}
     
      <div className={`grid gap-6 ${maximizedCardId ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        {cardsToDisplay.map((tool) => (
          <Card key={tool.id} className={maximizedCardId ? 'transition-all duration-300 ease-in-out' : ''}>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="flex items-center mb-1">
                  <tool.icon className={`h-5 w-5 mr-2 ${tool.iconColor}`} />
                  {tool.title}
                </CardTitle>
                <CardDescription>
                  {tool.description}
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => maximizedCardId ? handleMinimize() : handleMaximize(tool.id)}
                aria-label={maximizedCardId ? 'Minimize tool' : 'Maximize tool'}
              >
                {maximizedCardId ? (
                  <Minimize2 className="h-5 w-5" />
                ) : (
                  <Maximize2 className="h-5 w-5" />
                )}
              </Button>
            </CardHeader>
            <CardContent className={`flex items-center justify-center bg-gray-50 rounded-b-lg ${maximizedCardId ? 'min-h-[60vh]' : 'h-48'}`}>
              {/* Placeholder for actual tool content */}
              <p className="text-gray-500 text-center p-4"> 
                {tool.contentPlaceholder}
                {maximizedCardId && <span className="block mt-4 text-sm">(Full tool interface will appear here)</span>}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ToolsPage;
