import React from 'react';

interface TreeNode {
  id: string;
  title: string;
  children?: TreeNode[];
}

interface SidebarTreeProps {
  nodes: TreeNode[];
  selectedTopicId: string | null;
  onSelectTopic: (id: string, title: string, path: string[]) => void;
  parentPath?: string[];
}

const SidebarTree: React.FC<SidebarTreeProps> = ({
  nodes,
  selectedTopicId,
  onSelectTopic,
  parentPath = [],
}) => {
  return (
    <ul className="pl-4">
      {nodes.map((node) => {
        const currentPath = [...parentPath, node.title];
        const isSelected = node.id === selectedTopicId;

        return (
          <li key={node.id} className="mb-1">
            <button
              onClick={() => onSelectTopic(node.id, node.title, currentPath)}
              className={`text-left w-full px-2 py-1 rounded hover:bg-accent transition-colors ${
                isSelected ? 'bg-accent font-semibold' : ''
              }`}
            >
              {node.title}
            </button>
            {node.children && node.children.length > 0 && (
              <SidebarTree
                nodes={node.children}
                selectedTopicId={selectedTopicId}
                onSelectTopic={onSelectTopic}
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
