import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ContentPanelProps {
  topicId: string | null;
  topicTitle: string | null;
  topicPath: string[];
}

// Define the introductory text constant
const INTRO_TEXT = `🌻 **Life Situations**

Life doesn’t come with a manual — but hey, that’s what **Companira** is for! 🧡

Here you'll find a collection of common life tangles, twists, and tricky moments — from anxiety to addiction, heartbreak to healing. Each topic gives you a little intro to what it's all about.

✨ Curious? Confused? Click **“Talk to Companira about this…”** and your chosen topic will magically appear in your chat. From there, Companira is all ears — ready to explore, explain, or just sit with you through it.

Got something else on your mind? You can always start your own topic in the chat — no script required.

Let’s untangle life, one conversation at a time.`;

const ContentPanel: React.FC<ContentPanelProps> = ({ topicId, topicTitle, topicPath }) => {
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
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
            // Content not found is not necessarily an "error" state for display,
            // but we won't have markdown. Keep error null unless it's another issue.
            // setError(`Content not found for topic "${topicTitle || id}". It might not be created yet.`);
            console.warn(`Content not found for topic "${topicTitle || id}"`);
          } else {
            setError(`Failed to load content: ${dbError.message}`);
          }
          setMarkdown(null);
        } else if (data) {
          setMarkdown(data.markdown);
        } else {
           // No data returned, but no specific error code like PGRST116
           console.warn(`No content available for topic "${topicTitle || id}".`);
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

  const handleInject = () => {
    if (!topicId || !topicTitle) return;

    if (!user) {
      navigate('/signup');
      return;
    }

    console.log(`Logged-in user clicked button for topic "${topicTitle}". Navigating to main page.`);
    navigate('/');
  };

  const buttonText = user
    ? `Talk to Companira about "${topicTitle}"`
    : `Sign up to talk about "${topicTitle}"`;

  // Determine if the intro text should be shown
  const showIntroText = !loading && !error && (!topicId || topicPath.length <= 2);

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Loading content...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-lg font-semibold text-destructive">Error Loading Content</p>
          <p className="text-muted-foreground mt-1">{error}</p>
        </div>
      )}

      {/* Content Area (Not Loading, No Error) */}
      {!loading && !error && (
        <>
          {/* Conditionally render Intro Text */}
          {showIntroText && (
            <div className="mb-6 p-4 bg-muted/50 rounded-md border border-border">
              {/* Using prose here for consistent markdown-like styling */}
              <article className="prose prose-sm prose-zinc dark:prose-invert max-w-none">
                 <ReactMarkdown remarkPlugins={[remarkGfm]}>{INTRO_TEXT}</ReactMarkdown>
              </article>
            </div>
          )}

          {/* Initial State (No Topic Selected) */}
          {!topicId && (
            <div className="flex flex-col items-center justify-center h-auto text-center pt-8"> {/* Adjusted height and padding */}
              <Info className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold">Select a Topic</p>
              <p className="text-muted-foreground mt-1">Choose a life situation from the sidebar to view details.</p>
            </div>
          )}

          {/* Topic Selected */}
          {topicId && (
            <>
              {/* Display Markdown Content if available */}
              {markdown && (
                <article className="prose prose-zinc dark:prose-invert max-w-none">
                  {/* Render fetched markdown */}
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
                  <hr className="my-6" />
                  <div className="mt-6 flex justify-end">
                    <Button onClick={handleInject} disabled={!topicId || !topicTitle}>
                      {buttonText}
                    </Button>
                  </div>
                </article>
              )}

              {/* Display "No Content Yet" if topic selected but no markdown */}
              {!markdown && (
                <div className="flex flex-col items-center justify-center h-auto text-center pt-8"> {/* Adjusted height and padding */}
                  <Info className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold">No Specific Content Yet</p>
                  <p className="text-muted-foreground mt-1">
                    Specific details for "{topicTitle}" haven't been added, but you can still talk about it.
                  </p>
                  <div className="mt-6 flex justify-center"> {/* Centered button */}
                    <Button onClick={handleInject} disabled={!topicId || !topicTitle}>
                      {buttonText}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ContentPanel;
