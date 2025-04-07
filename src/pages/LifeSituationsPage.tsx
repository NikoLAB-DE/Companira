import React, { useState } from 'react';
import SidebarTree from '@/components/lifesituations/SidebarTree';
import ContentPanel from '@/components/lifesituations/ContentPanel';
import treeData from '@/data/lifeSituationsTree.json'; // Import the local JSON data
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelRightClose } from 'lucide-react';
import { cn } from '@/lib/utils';

const LifeSituationsPage: React.FC = () => {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedTopicTitle, setSelectedTopicTitle] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // State for sidebar visibility

  const handleSelectTopic = (id: string, title: string) => {
    console.log(`Topic selected - ID: ${id}, Title: ${title}`);
    setSelectedTopicId(id);
    setSelectedTopicTitle(title);
    // Optionally open sidebar if closed when a topic is selected
    // if (!isSidebarOpen) {
    //   setIsSidebarOpen(true);
    // }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    // Use flex-col for the page container to manage header/content/footer structure if needed,
    // but here we focus on the horizontal split for sidebar/content.
    // The parent App.tsx handles the overall vertical layout with header/footer.
    // h-[calc(100vh-8rem)] assumes header (4rem) + footer (approx 4rem). Adjust if footer height differs.
    // Or rely on flex-grow in App.tsx and set height here to h-full or similar if App structure allows.
    <div className="flex h-[calc(100vh-4rem-1px)]"> {/* Adjusted height: vh - navbar height - navbar border */}
      {/* Sidebar Container */}
      <div className={cn(
        "transition-all duration-300 ease-in-out flex-shrink-0 relative border-r bg-muted/20",
        isSidebarOpen ? "w-64 md:w-72" : "w-0 border-none overflow-hidden" // Collapse by setting width to 0
      )}>
        {/* Sidebar Content - Render only if open for clean collapse */}
        {isSidebarOpen && (
          <SidebarTree
            nodes={treeData}
            selectedTopicId={selectedTopicId}
            onSelectTopic={handleSelectTopic}
            // Pass isSidebarOpen if SidebarTree needs to adapt its internal layout
            // isSidebarOpen={isSidebarOpen}
          />
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden"> {/* Use flex-col and overflow-hidden */}
         {/* Toggle Button - Positioned relative to the main area */}
         <div className="absolute top-18 left-2 z-10"> {/* Adjust positioning as needed */}
           <Button
             variant="ghost"
             size="icon"
             onClick={toggleSidebar}
             className="bg-card border rounded-full shadow"
             aria-label={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
           >
             {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelRightClose className="h-5 w-5" />}
           </Button>
         </div>

        {/* Content Panel takes remaining space and scrolls */}
        <div className="flex-1 overflow-y-auto"> {/* This div handles the scrolling */}
          <ContentPanel
            topicId={selectedTopicId}
            topicTitle={selectedTopicTitle}
          />
        </div>
      </main>
    </div>
  );
};

export default LifeSituationsPage;
