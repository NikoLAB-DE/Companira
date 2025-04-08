import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TreeNode {
  id: string;
  title: string;
  children?: TreeNode[];
}

interface SidebarTreeProps {
  nodes: TreeNode[];
  selectedTopicId: string | null;
  onSelectTopic: (id: string, title: string) => void;
}

interface TreeItemProps {
  node: TreeNode;
  level: number;
  selectedTopicId: string | null;
  onSelectTopic: (id: string, title: string) => void;
}

const TreeItem: React.FC<TreeItemProps> = ({ node, level, selectedTopicId, onSelectTopic }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isLeaf = !node.children || node.children.length === 0;
  const isSelected = node.id === selectedTopicId;

  const handleToggle = (e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent click from bubbling up to the parent div's handler if needed
    if (!isLeaf) {
      setIsOpen(!isOpen);
    }
  };

  const handleClick = () => {
    if (isLeaf) {
      onSelectTopic(node.id, node.title);
    } else {
      // If a non-leaf node is clicked, toggle its state
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="text-sm">
      <div
        className={cn(
          'flex items-center py-1 px-2 rounded-md cursor-pointer group', // Reduced py-1.5 to py-1
          'hover:bg-accent hover:text-accent-foreground',
          isSelected && isLeaf && 'bg-primary/10 text-primary font-medium',
        )}
        onClick={handleClick}
        style={{ paddingLeft: `${level * 1 + 0.5}rem` }} // Indentation: 0.5rem base + 1rem per level
      >
        {/* Chevron Button: Only shown for non-leaf nodes */}
        {!isLeaf ? (
          <button
            onClick={handleToggle} // Chevron specifically handles toggle
            className="mr-1 p-0.5 rounded hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label={isOpen ? 'Collapse' : 'Expand'}
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          // Placeholder for alignment on leaf nodes
          <span className="w-5 mr-1 inline-block"></span> // w-5 matches approx width of button
        )}
        {/* Topic Title */}
        <span className="truncate">{node.title}</span>
      </div>
      {/* Children: Rendered only if not a leaf and is open */}
      {!isLeaf && isOpen && (
        <div className="mt-0.5"> {/* Reduced margin top */}
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
    <nav className="space-y-0.5 p-3"> {/* Reduced space-y and padding */}
       <h3 className="text-base font-semibold mb-2 px-2 text-foreground">Explore Topics</h3> {/* Adjusted size/margin */}
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
