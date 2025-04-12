import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils"; // Assuming you have a utility for class names

interface TreeNode {
  id: string;
  title: string;
  children?: TreeNode[];
}

interface SidebarTreeProps {
  nodes: TreeNode[];
  selectedTopicId: string | null;
  onSelectTopic: (id: string, title: string, path: string[]) => void;
  level?: number; // To track hierarchy level for styling
  parentPath?: string[];
}

const SidebarTree: React.FC<SidebarTreeProps> = ({
  nodes,
  selectedTopicId,
  onSelectTopic,
  level = 0, // Start at level 0
  parentPath = [],
}) => {
  const [openNodes, setOpenNodes] = useState<Record<string, boolean>>({});

  const toggleNode = (id: string) => {
    setOpenNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTopicClick = (node: TreeNode, currentPath: string[]) => {
    onSelectTopic(node.id, node.title, currentPath);
    // Also toggle if it has children
    if (node.children && node.children.length > 0) {
      toggleNode(node.id);
    }
  };

  const levelHoverBgClasses = [
    "hover:bg-accent",         // Level 0
    "hover:bg-accent/90",      // Level 1
    "hover:bg-accent/80",      // Level 2
    "hover:bg-accent/70",      // Level 3+
  ];

  const getLevelHoverBgClass = (level: number) => {
    return levelHoverBgClasses[Math.min(level, levelHoverBgClasses.length - 1)];
  };

  return (
    <ul className={cn("space-y-0.5", level > 0 && "pl-3")}>
      {nodes.map((node) => {
        const currentPath = [...parentPath, node.title];
        const isSelected = node.id === selectedTopicId;
        const hasChildren = node.children && node.children.length > 0;
        const isOpen = openNodes[node.id] ?? false;

        return (
          <li key={node.id}>
            <div className={cn(
              "flex items-center justify-between group rounded",
              getLevelHoverBgClass(level),
              isSelected ? "bg-accent" : "bg-transparent"
            )}>
              {/* Clickable area for selection AND toggling */}
              <button
                // Updated onClick handler
                onClick={() => handleTopicClick(node, currentPath)}
                className={cn(
                  "flex-grow text-left px-1.5 py-0.5 text-sm truncate flex items-center", // Added flex items-center
                  isSelected ? 'font-semibold text-accent-foreground' : 'text-foreground/90 hover:text-foreground',
                  // Removed w-full logic, let flex-grow handle it
                )}
              >
                 {/* Render arrow inline with text if it has children, but handle toggle via main button */}
                 {hasChildren && (
                   <span className="inline-block w-4 mr-1"> {/* Placeholder for alignment */}
                     {isOpen ? (
                       <ChevronDown className="h-4 w-4 text-orange-500" /> // Orange arrow
                     ) : (
                       <ChevronRight className="h-4 w-4 text-orange-500" /> // Orange arrow
                     )}
                   </span>
                 )}
                 {!hasChildren && <span className="inline-block w-4 mr-1"></span>} {/* Spacer for alignment */}
                {node.title}
              </button>

              {/* Separate, smaller click target specifically for the arrow (optional, could be removed if text click is sufficient) */}
              {/* If keeping this, ensure it ONLY toggles and doesn't select */}
              {/*
              {hasChildren && (
                <button
                  onClick={(e) => {
                     e.stopPropagation(); // Prevent selection/toggle from parent button
                     toggleNode(node.id);
                  }}
                  className="p-0.5 mr-1 rounded hover:bg-muted/50 flex-shrink-0"
                  aria-label={isOpen ? 'Collapse' : 'Expand'}
                  aria-expanded={isOpen}
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-orange-500" /> // Orange arrow
                  ) : (
                    <ChevronRight className="h-4 w-4 text-orange-500" /> // Orange arrow
                  )}
                </button>
              )}
              */}
            </div>
            {/* Recursively render children if the node is open */}
            {hasChildren && isOpen && (
              <SidebarTree
                nodes={node.children!}
                selectedTopicId={selectedTopicId}
                onSelectTopic={onSelectTopic}
                level={level + 1}
                parentPath={currentPath}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default SidebarTree;
