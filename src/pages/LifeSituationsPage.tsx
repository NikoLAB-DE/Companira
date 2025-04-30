import React, { useState, useMemo } from 'react';
import SidebarTree from '@/components/lifesituations/SidebarTree';
import ContentPanel from '@/components/lifesituations/ContentPanel';
import treeData from '@/data/lifeSituationsTree.json';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils"; // Import cn utility

interface TreeNode {
  id: string;
  title: string;
  children?: TreeNode[];
}

// Recursive function to sort tree nodes alphabetically by title
const sortTreeNodes = (nodes: TreeNode[]): TreeNode[] => {
  const sortedNodes = [...nodes].sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  return sortedNodes.map(node => {
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: sortTreeNodes(node.children),
      };
    }
    return node;
  });
};

const LifeSituationsPage: React.FC = () => {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedTopicTitle, setSelectedTopicTitle] = useState<string | null>(null);
  const [selectedTopicPath, setSelectedTopicPath] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Sidebar starts open

  // Memoize the sorted tree data to prevent re-sorting on every render
  const sortedTreeData = useMemo(() => sortTreeNodes(treeData), []);

  const handleSelectTopic = (id: string, title: string, path: string[]) => {
    console.log(`Topic selected - ID: ${id}, Title: ${title}, Path: ${path.join(' / ')}`);
    setSelectedTopicId(id);
    setSelectedTopicTitle(title);
    setSelectedTopicPath(path);
    // Optionally close sidebar on mobile after selection?
    // if (window.innerWidth < 768) { setSidebarOpen(false); }
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    // Use flex-col on small screens, flex-row on medium and up
    <div className="flex flex-col md:flex-row h-[calc(100vh-var(--navbar-height))] relative"> {/* Adjust height calculation */}
      {/* Sidebar */}
      <aside
        className={cn(
          `
          absolute md:relative z-20 md:z-auto
          h-full md:h-auto
          border-r border-border
          bg-background md:bg-muted/20  /* Different background for mobile overlay vs desktop */
          overflow-y-auto transition-transform duration-300 ease-in-out
          `,
          sidebarOpen ? 'translate-x-0 w-64 md:w-72' : '-translate-x-full w-64 md:w-0 md:translate-x-0'
          // Use translate-x for smooth slide-in/out, adjust width on md+
        )}
      >
         {/* Add padding inside the sidebar */}
         <div className="p-4">
            <h2 className="text-lg font-semibold mb-3 text-foreground">Life Situations</h2>
            <SidebarTree
              nodes={sortedTreeData}
              selectedTopicId={selectedTopicId}
              onSelectTopic={handleSelectTopic}
              // No need to pass level or parentPath here, SidebarTree initializes them
            />
         </div>
      </aside>

      {/* Sidebar Toggle Button - Position adjusted */}
      <button
        onClick={toggleSidebar}
        className={cn(`
          fixed md:absolute top-[calc(var(--navbar-height)+0.5rem)] /* Position below navbar */
          z-30 /* Ensure button is above sidebar */
          bg-muted border border-l-0 border-border rounded-r p-1 /* Style */
          hover:bg-accent transition-colors
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        `,
         sidebarOpen ? 'left-64 md:left-72' : 'left-0' // Adjust position based on sidebar state
        )}
        style={{ transition: 'left 0.3s ease-in-out' }} // Smooth transition for button position
        aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {sidebarOpen ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 bg-background overflow-y-auto transition-all duration-300 ease-in-out",
        // Add padding-left on md+ screens when sidebar is open to prevent overlap
        "md:pl-0" // No padding when sidebar is closed or on small screens
        // The ContentPanel itself has padding, so we might not need margin/padding here
        // Adjust if content overlaps with the absolute positioned sidebar toggle
      )}>
        <ContentPanel
          topicId={selectedTopicId}
          topicTitle={selectedTopicTitle}
          topicPath={selectedTopicPath}
        />
      </main>

       {/* Overlay for mobile when sidebar is open */}
       {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-10 md:hidden"
          onClick={toggleSidebar} // Close sidebar on overlay click
        ></div>
      )}
    </div>
  );
};

export default LifeSituationsPage;
