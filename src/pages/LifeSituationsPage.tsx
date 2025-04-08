import React, { useState, useMemo } from 'react';
import SidebarTree from '@/components/lifesituations/SidebarTree';
import ContentPanel from '@/components/lifesituations/ContentPanel';
import treeData from '@/data/lifeSituationsTree.json'; // Import the local JSON data

interface TreeNode {
  id: string;
  title: string;
  children?: TreeNode[];
}

// Recursive function to sort nodes and their children alphabetically by title
const sortTreeNodes = (nodes: TreeNode[]): TreeNode[] => {
  // Sort the current level
  const sortedNodes = [...nodes].sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  // Recursively sort children
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

  // Sort the tree data once using useMemo
  const sortedTreeData = useMemo(() => sortTreeNodes(treeData), []);

  const handleSelectTopic = (id: string, title: string) => {
    console.log(`Topic selected - ID: ${id}, Title: ${title}`);
    setSelectedTopicId(id);
    setSelectedTopicTitle(title);
  };

  return (
    // Use flex and ensure it fills the parent's height (which is now scrollable)
    // Removed flex-grow and overflow-hidden as scrolling is handled by parent
    <div className="flex h-full">
      {/* Sidebar: Fixed width, scrolls internally */}
      <aside className="w-64 md:w-72 flex-shrink-0 border-r overflow-y-auto bg-muted/20">
        <SidebarTree
          nodes={sortedTreeData} // Pass the sorted data
          selectedTopicId={selectedTopicId}
          onSelectTopic={handleSelectTopic}
        />
      </aside>

      {/* Main Content Area: Takes remaining space, scrolls internally */}
      <main className="flex-1 bg-background overflow-y-auto">
        <ContentPanel
          topicId={selectedTopicId}
          topicTitle={selectedTopicTitle}
        />
      </main>
    </div>
  );
};

export default LifeSituationsPage;
