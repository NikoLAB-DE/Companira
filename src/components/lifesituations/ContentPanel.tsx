import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Info } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { useNavigate } from 'react-router-dom';

interface ContentPanelProps {
  topicId: string | null;
  topicTitle: string | null;
  topicPath: string[];
}

const ContentPanel: React.FC<ContentPanelProps> = ({ topicId, topicTitle, topicPath }) => {
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { sendMessage } = useChat();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopicContent = async (id: string) => {
      setLoading(true);
      setError(null);
      setMarkdown(null);

      try {
        const { data, error: dbError } = await supabase
          .from('topics')
          .select('markdown')
          .eq('id', id)
          .single();

        if (dbError) {
          if (dbError.code === 'PGRST116') {
            setError(`Content not found for topic "${topicTitle || id}". It might not be created yet.`);
          } else {
            setError(`Failed to load content: ${dbError.message}`);
          }
          setMarkdown(null);
        } else if (data) {
          setMarkdown(data.markdown);
        } else {
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
      setMarkdown(null);
      setLoading(false);
      setError(null);
    }
  }, [topicId, topicTitle]);

  const handleInject = async () => {
    if (!topicId || !topicTitle) return;

    const intro = "Important: This is not standard user message, but this is a topic, that user found interesting and needs more details to get more familiar with it. Use the 'Topic Path' as the focus area, framework and extend the 'Details' part";
    const pathStr = topicPath.join(' / ');
    const snippet = markdown ? markdown.substring(0, 400) + (markdown.length > 400 ? '...' : '') : '';
    const questionPrompt = "Try to answer What, Where, Why, How, When and similar where applicable.";

    const message = `${intro}\n\nTopic Path: ${pathStr}\n\nDetails:\n${snippet}\n\n${questionPrompt}`;

    try {
      // Call sendMessage with silentInject=true
      sendMessage(message, 'user', undefined, true);
    } catch (error) {
      console.error('Error injecting message:', error);
    } finally {
      navigate('/chat');
    }
  };

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto">
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
        </div>
      )}
      {!loading && !error && !markdown && !topicId && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Info className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-semibold">Select a Topic</p>
          <p className="text-muted-foreground mt-1">Choose a life situation from the sidebar to view details.</p>
        </div>
      )}
      {!loading && !error && markdown && topicId && (
        <article className="prose prose-zinc dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          <hr className="my-6" />
          <div className="mt-6 flex justify-end">
            <Button onClick={handleInject} disabled={!topicId || !topicTitle}>
              Talk to Companira about "{topicTitle}"
            </Button>
          </div>
        </article>
      )}
      {!loading && !error && !markdown && topicId && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Info className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-semibold">No Content Yet</p>
          <p className="text-muted-foreground mt-1">Content for "{topicTitle}" hasn't been added.</p>
        </div>
      )}
    </div>
  );
};

export default ContentPanel;
