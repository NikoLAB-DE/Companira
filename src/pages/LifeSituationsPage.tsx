import React, { useState, useMemo } from 'react';
import SidebarTree from '@/components/lifesituations/SidebarTree';
import ContentPanel from '@/components/lifesituations/ContentPanel';
import treeData from '@/data/lifeSituationsTree.json';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TreeNode {
  id: string;
  title: string;
  children?: TreeNode[];
}

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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const sortedTreeData = useMemo(() => sortTreeNodes(treeData), []);

  const handleSelectTopic = (id: string, title: string, path: string[]) => {
    console.log(`Topic selected - ID: ${id}, Title: ${title}, Path: ${path.join(' / ')}`);
    setSelectedTopicId(id);
    setSelectedTopicTitle(title);
    setSelectedTopicPath(path);
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <div className="flex h-full relative">
      <aside
        className={`
          ${sidebarOpen ? 'w-64 md:w-72' : 'w-0'}
          flex-shrink-0 border-r overflow-y-auto bg-muted/20
          transition-all duration-300 ease-in-out
        `}
        style={{ minWidth: sidebarOpen ? undefined : '0' }}
      >
        {sidebarOpen && (
          <SidebarTree
            nodes={sortedTreeData}
            selectedTopicId={selectedTopicId}
            onSelectTopic={handleSelectTopic}
          />
        )}
      </aside>

      <button
        onClick={toggleSidebar}
        className={`
          absolute top-4 z-30
          bg-muted border border-border rounded-l px-1.5 py-1
          hover:bg-accent transition-colors
        `}
        style={{
          left: sidebarOpen ? '16rem' : '0',
        }}
        aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {sidebarOpen ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      <main className="flex-1 bg-background overflow-y-auto transition-all duration-300 ease-in-out">
        <ContentPanel
          topicId={selectedTopicId}
          topicTitle={selectedTopicTitle}
          topicPath={selectedTopicPath}
        />
      </main>
    </div>
  );
};

export default LifeSituationsPage;
