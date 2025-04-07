import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming you have this utility

interface TreeNode {
  id: string;
  title: string;
  children?: TreeNode[];
}

interface SidebarTreeProps {
  nodes: TreeNode[];
  selectedTopicId: string | null;
  onSelectTopic: (id: string, title: string) => void;
  // isSidebarOpen?: boolean; // Optional: if needed for internal adjustments
}

interface TreeItemProps {
  node: TreeNode;
  level: number;
  selectedTopicId: string | null;
  onSelectTopic: (id: string, title: string) => void;
}

const TreeItem: React.FC<TreeItemProps> = ({ node, level, selectedTopicId, onSelectTopic }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.id === selectedTopicId;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering select when toggling
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = () => {
    onSelectTopic(node.id, node.title);
    // Optionally expand parent nodes if a child is selected (more complex logic)
    if (hasChildren && !isOpen) {
       // setIsOpen(true); // Decide if selecting a parent should auto-open it
    }
  };

  return (
    <div className="text-sm">
      <div
        className={cn(
          'flex items-center py-1.5 px-2 rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground whitespace-nowrap', // Added whitespace-nowrap
          isSelected && 'bg-primary/10 text-primary font-medium', // Highlight selected
          // level > 0 && `pl-${level * 4 + 2}` // Indentation based on level (pl-2, pl-6, pl-10) - Replaced with style
        )}
        onClick={handleSelect}
        style={{ paddingLeft: `${level * 1 + 0.5}rem` }} // More reliable indentation
      >
        {hasChildren && (
          <button
            onClick={handleToggle}
            className="mr-1 p-0.5 rounded hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring flex-shrink-0" // Added flex-shrink-0
            aria-label={isOpen ? 'Collapse' : 'Expand'}
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        )}
        {!hasChildren && <span className="w-5 mr-1 flex-shrink-0"></span>} {/* Placeholder for alignment, Added flex-shrink-0 */}
        <span className="truncate">{node.title}</span>
      </div>
      {hasChildren && isOpen && (
        <div className="mt-1">
          {node.children?.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedTopicId={selectedTopicId}
              onSelectTopic={onSelectTopic}
            />
          ))}
        </div>
      )}
    </div>
  );
};


const SidebarTree: React.FC<SidebarTreeProps> = ({ nodes, selectedTopicId, onSelectTopic }) => {
  return (
    // Added h-full and overflow-y-auto here
    <nav className="space-y-1 p-4 h-full overflow-y-auto">
       <h3 className="text-lg font-semibold mb-3 px-2 whitespace-nowrap">Explore Topics</h3>
      {nodes.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          level={0}
          selectedTopicId={selectedTopicId}
          onSelectTopic={onSelectTopic}
        />
      ))}
    </nav>
  );
};

export default SidebarTree;
