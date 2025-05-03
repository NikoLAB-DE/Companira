import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ListTodo, StickyNote, Pin, DraftingCompass, ChevronDown, ChevronUp } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface ExpandableCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode; // Content to show when expanded
  defaultOpen?: boolean;
}

const ExpandableCard: React.FC<ExpandableCardProps> = ({ title, description, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-3">
          {icon}
          <div>
            <CardTitle className="text-lg font-medium">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} aria-label={isOpen ? 'Collapse card' : 'Expand card'}>
          {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
        </Button>
      </CardHeader>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: 'auto' },
              collapsed: { opacity: 0, height: 0 }
            }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden" // Important for height animation
          >
            <CardContent className="pt-4">
              {children}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};


const MyDashboardPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        Organize your thoughts, track tasks, and pin important insights from your conversations.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* To-Do List Card */}
        <ExpandableCard
          title="To-Do List"
          description="Manage your tasks"
          icon={<ListTodo className="h-6 w-6 text-blue-600" />}
        >
          <div className="h-48 flex items-center justify-center bg-muted/30 rounded-md border border-dashed border-border">
            <p className="text-muted-foreground text-center text-sm">
              Simple task management coming soon. <br /> Add, check off, and prioritize.
            </p>
          </div>
        </ExpandableCard>

        {/* Sticky Notes Card */}
        <ExpandableCard
          title="Sticky Notes"
          description="Jot down quick thoughts"
          icon={<StickyNote className="h-6 w-6 text-yellow-600" />}
        >
           <div className="h-48 flex items-center justify-center bg-muted/30 rounded-md border border-dashed border-border">
            <p className="text-muted-foreground text-center text-sm">
              Digital sticky notes for reminders and ideas. <br /> Functionality coming soon.
            </p>
          </div>
        </ExpandableCard>

        {/* Pinned Items Card */}
        <ExpandableCard
          title="Pinned Items"
          description="Saved chat highlights"
          icon={<Pin className="h-6 w-6 text-green-600" />}
        >
           <div className="h-48 flex items-center justify-center bg-muted/30 rounded-md border border-dashed border-border">
            <p className="text-muted-foreground text-center text-sm">
              Pin important messages or insights from chats. <br /> Feature under development.
            </p>
          </div>
        </ExpandableCard>

        {/* Blank Workspace Card */}
        <ExpandableCard
          title="Workspace"
          description="Your flexible area"
          icon={<DraftingCompass className="h-6 w-6 text-purple-600" />}
          defaultOpen={true} // Example: Keep this one open by default
        >
           <div className="h-48 flex items-center justify-center bg-muted/30 rounded-md border border-dashed border-border">
            <p className="text-muted-foreground text-center text-sm">
              A blank canvas for your use. <br /> More tools might appear here later.
            </p>
          </div>
        </ExpandableCard>
      </div>
    </div>
  );
};

export default MyDashboardPage;
