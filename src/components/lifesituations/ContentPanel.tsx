import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // For GitHub Flavored Markdown (tables, etc.)
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Info } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext'; // Import useChat

interface ContentPanelProps {
  topicId: string | null;
  topicTitle: string | null;
}

const ContentPanel: React.FC<ContentPanelProps> = ({ topicId, topicTitle }) => {
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { sendMessage } = useChat(); // Get sendMessage from ChatContext

  useEffect(() => {
    const fetchTopicContent = async (id: string) => {
      setLoading(true);
      setError(null);
      setMarkdown(null); // Clear previous content

      try {
        console.log(`Fetching content for topic ID: ${id}`);
        const { data, error: dbError } = await supabase
          .from('topics') // Ensure this matches your table name
          .select('markdown')
          .eq('id', id)
          .single();

        if (dbError) {
          console.error('Supabase error fetching topic:', dbError);
          if (dbError.code === 'PGRST116') { // Not found
             setError(`Content not found for topic "${topicTitle || id}". It might not be created yet.`);
          } else {
             setError(`Failed to load content: ${dbError.message}`);
          }
          setMarkdown(null);
        } else if (data) {
          console.log(`Content fetched successfully for topic ID: ${id}`);
          setMarkdown(data.markdown);
        } else {
           console.warn(`No data returned for topic ID: ${id}`);
           setError(`No content available for topic "${topicTitle || id}".`);
           setMarkdown(null);
        }
      } catch (err: any) {
        console.error('Unexpected error fetching topic content:', err);
        setError(`An unexpected error occurred: ${err.message}`);
        setMarkdown(null);
      } finally {
        setLoading(false);
      }
    };

    if (topicId) {
      fetchTopicContent(topicId);
    } else {
      // Reset state if no topic is selected
      setMarkdown(null);
      setLoading(false);
      setError(null);
    }
  }, [topicId, topicTitle]); // Rerun effect when topicId or topicTitle changes

  const handleInject = () => {
    if (topicId && topicTitle) { // Allow injection even if markdown is null/empty
      // Construct a message to send to the chat
      const baseMessage = `Let's talk about "${topicTitle}".`;
      const snippet = markdown ? ` Here's some initial information:\n\n${markdown.substring(0, 300)}${markdown.length > 300 ? '...' : ''}` : '';
      const messageContent = baseMessage + snippet;

      console.log('Injecting topic to chat:', { topicId, topicTitle });
      sendMessage(messageContent, 'user'); // Send as a user message
      // Optionally navigate to the chat page or open a chat modal
    } else {
      console.warn('Cannot inject topic: Missing ID or title.');
    }
  };

  // Define base class for the container
  const containerBaseClass = "p-6 md:p-8 h-full"; // Ensure padding doesn't prevent full height usage if needed

  return (
    <div className={containerBaseClass}> {/* Use base class */}
      {loading && (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Loading content...</p>
        </div>
      )}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center h-full text-center">
           <AlertCircle className="h-12 w-12 text-destructive mb-4" />
           <p className="text-lg font-semibold text-destructive">Error Loading Content</p>
           <p className="text-muted-foreground mt-1">{error}</p>
           {/* Add inject button even on error */}
           <div className="mt-6">
             <Button onClick={handleInject} disabled={!topicId || !topicTitle}>
               Ask Companion about "{topicTitle}"
             </Button>
           </div>
        </div>
      )}
      {!loading && !error && !topicId && ( // Initial state: No topic selected
         <div className="flex flex-col items-center justify-center h-full text-center">
           <Info className="h-12 w-12 text-muted-foreground mb-4" />
           <p className="text-lg font-semibold">Select a Topic</p>
           <p className="text-muted-foreground mt-1">Choose a life situation from the sidebar to view details.</p>
         </div>
      )}
      {!loading && !error && topicId && ( // Topic selected, content might be loading or loaded
        <>
          {markdown ? ( // Content successfully loaded
            <article className="prose prose-zinc dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
              <hr className="my-6" />
              <div className="mt-6 flex justify-end">
                <Button onClick={handleInject} disabled={!topicId || !topicTitle}>
                  Talk to Companion about "{topicTitle}"
                </Button>
              </div>
            </article>
          ) : ( // Topic selected, but no markdown content (either not found or empty)
             !loading && ( // Ensure loading is finished before showing this state
               <div className="flex flex-col items-center justify-center h-full text-center">
                 <Info className="h-12 w-12 text-muted-foreground mb-4" />
                 <p className="text-lg font-semibold">No Content Yet</p>
                 <p className="text-muted-foreground mt-1">Content for "{topicTitle}" hasn't been added, but you can still discuss it.</p>
                 <div className="mt-6">
                   <Button onClick={handleInject} disabled={!topicId || !topicTitle}>
                     Ask Companion about "{topicTitle}"
                   </Button>
                 </div>
               </div>
             )
          )}
        </>
      )}
    </div>
  );
};

export default ContentPanel;
