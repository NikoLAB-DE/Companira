import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { BarChart, LineChart, PieChart, Activity, Maximize2, Minimize2, Loader2, AlertCircle, RefreshCw, Info, ClipboardCopy, Check } from 'lucide-react'; // Added ClipboardCopy, Check
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/components/ui/use-toast";

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true,
});

interface AnalysisCardData {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  contentPlaceholder: string;
  isNew?: boolean; // Added isNew property
}

// Reordered and updated placeholder text
const analysisCardsData: AnalysisCardData[] = [
  {
  id: 'weeklySummary',
  title: 'Weekly Summary',
  description: 'Get a summary of your previous week',
  icon: Activity,
  iconColor: 'text-red-600',
  contentPlaceholder: '\n\nOpen this card to explore a thoughtful reflection crafted by your assistant:\n\n ✨ Highlights of your key moments\n 🧠 Hidden patterns and emotional trends\n 🎯 Progress toward your personal goals\n 🌱 A motivating nudge for the new week.\n\nLet’s celebrate your steps forward — even the small ones!',
  isNew: true, // Mark as New
},
  {
    id: 'topicAnalysis',
    title: 'Topic Analysis',
    description: 'Understand what topics you discuss most',
    icon: PieChart,
    iconColor: 'text-purple-600',
    contentPlaceholder: 'Topic analysis coming soon',
  },
  {
    id: 'progressTrends',
    title: 'Progress Trends',
    description: 'See your progress toward your goals',
    icon: LineChart,
    iconColor: 'text-green-600',
    contentPlaceholder: 'Progress visualization coming soon',
  },
  {
    id: 'moodTracking',
    title: 'Mood Tracking',
    description: 'Track your mood patterns over time',
    icon: BarChart,
    iconColor: 'text-blue-600',
    contentPlaceholder: 'Mood tracking visualization coming soon',
  },
];

const WEEKLY_SUMMARY_WEBHOOK_URL = 'https://flow.lazy-bees.com/webhook/weekly_summary';
const SUMMARY_STORAGE_KEY_PREFIX = 'companira-weekly-summary-';

// Helper function to fetch the 'summary' thread ID
const fetchSummaryThreadId = async (userId: string): Promise<string | null> => {
  console.log(`[AnalysisPage] Fetching summary thread ID for user: ${userId}`);
  try {
    const { data, error } = await supabase
      .from('chat_threads')
      .select('id')
      .eq('user_id', userId)
      .ilike('title', 'summary')
      .maybeSingle();

    if (error) {
      console.error('[AnalysisPage] Supabase error fetching summary thread ID:', error);
      throw new Error(`Failed to load summary thread information: ${error.message}`);
    }

    if (data) {
      console.log(`[AnalysisPage] Summary thread ID found: ${data.id}`);
      return data.id;
    } else {
      console.warn('[AnalysisPage] No summary thread found for user:', userId);
      return null;
    }
  } catch (err: any) {
    console.error('[AnalysisPage] Unexpected JS error fetching summary thread ID:', err);
    throw new Error(`An unexpected error occurred while loading summary thread information: ${err.message || 'Unknown error'}`);
  }
};

// Helper function to get the session storage key for the summary
const getSummaryStorageKey = (userId: string | undefined): string | null => {
  return userId ? `${SUMMARY_STORAGE_KEY_PREFIX}${userId}` : null;
};

const AnalysisPage: React.FC = () => {
  const [maximizedCardId, setMaximizedCardId] = useState<string | null>(null);
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  // State for webhook/sessionStorage summary
  const [summaryContent, setSummaryContent] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [alreadyExistsMessage, setAlreadyExistsMessage] = useState<string | null>(null);
  // State for DB summary
  const [dbSummaryContent, setDbSummaryContent] = useState<string | null>(null);
  const [dbSummaryLoading, setDbSummaryLoading] = useState(false);
  const [dbSummaryError, setDbSummaryError] = useState<string | null>(null);
  // State for copy button feedback
  const [isCopied, setIsCopied] = useState(false);

  // Load summary from sessionStorage on mount or user change
  useEffect(() => {
    const key = getSummaryStorageKey(user?.id);
    if (key) {
      const storedSummary = sessionStorage.getItem(key);
      if (storedSummary) {
        console.log("[AnalysisPage] Loaded summary from sessionStorage.");
        setSummaryContent(storedSummary);
        setAlreadyExistsMessage(null);
      } else {
        setSummaryContent(null);
        setAlreadyExistsMessage(null);
      }
    } else {
      setSummaryContent(null);
      setAlreadyExistsMessage(null);
    }
  }, [user?.id]);

  // Fetch latest summary from DB
  const fetchLatestSummaryFromDB = useCallback(async (userId: string, threadId: string | null) => {
    if (!threadId) {
      console.log("[AnalysisPage] Cannot fetch DB summary: threadId is null.");
      setDbSummaryError("Summary thread information not found.");
      setDbSummaryContent(null);
      setDbSummaryLoading(false);
      return;
    }

    console.log(`[AnalysisPage] Fetching latest DB summary for user ${userId}, thread ${threadId}`);
    setDbSummaryLoading(true);
    setDbSummaryError(null);
    setDbSummaryContent(null);

    try {
      const { data, error } = await supabase
        .from('chat_summaries')
        .select('summary_text')
        .eq('user_id', userId)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[AnalysisPage] Supabase error fetching DB summary:', error);
        setDbSummaryError(`Failed to load summary from database: ${error.message}`);
        setDbSummaryContent(null);
      } else if (data) {
        console.log("[AnalysisPage] Latest DB summary fetched successfully.");
        setDbSummaryContent(data.summary_text);
      } else {
        console.log("[AnalysisPage] No summary found in database for this thread.");
        setDbSummaryError("No weekly summary has been generated yet.");
        setDbSummaryContent(null);
      }
    } catch (err: any) {
      console.error('[AnalysisPage] Unexpected JS error fetching DB summary:', err);
      setDbSummaryError(`An unexpected error occurred while loading the summary: ${err.message || 'Unknown error'}`);
      setDbSummaryContent(null);
    } finally {
      setDbSummaryLoading(false);
    }
  }, []);


  const handleMaximize = useCallback(async (id: string) => {
    setMaximizedCardId(id);
    setDbSummaryContent(null);
    setDbSummaryError(null);
    setDbSummaryLoading(false);
    setIsCopied(false); // Reset copy state

    if (id === 'weeklySummary' && user?.id) {
      setSummaryError(null);
      setSummaryLoading(false);
      setAlreadyExistsMessage(null);
      try {
        const threadId = await fetchSummaryThreadId(user.id);
        await fetchLatestSummaryFromDB(user.id, threadId);
      } catch (error: any) {
        setDbSummaryError(error.message || "Failed to get summary thread info.");
        setDbSummaryLoading(false);
      }
    } else if (id !== 'weeklySummary') {
      setSummaryError(null);
      setSummaryLoading(false);
      setAlreadyExistsMessage(null);
    }
  }, [user?.id, fetchLatestSummaryFromDB]);

  const handleMinimize = () => {
    setMaximizedCardId(null);
    setDbSummaryContent(null);
    setDbSummaryError(null);
    setDbSummaryLoading(false);
    setIsCopied(false); // Reset copy state
  };

  const handleGenerateSummary = useCallback(async () => {
    if (!user || !user.id) {
      setSummaryError("Please log in to generate a summary.");
      return;
    }

    setSummaryLoading(true);
    setSummaryError(null);
    setAlreadyExistsMessage(null);
    setDbSummaryContent(null);
    setDbSummaryError(null);
    setDbSummaryLoading(false);
    setIsCopied(false); // Reset copy state

    let summaryThreadId: string | null = null;

    try {
      summaryThreadId = await fetchSummaryThreadId(user.id);
      if (summaryThreadId === null) {
        console.warn("[AnalysisPage] Proceeding without a summary thread ID for generation.");
      }

      const payload = {
        user_id: user.id,
        thread_id: summaryThreadId,
        nickname: profile?.nickname || "",
        current_situation: profile?.current_situation || "",
        focused_problem: profile?.focused_problem || "",
        top_goals: profile?.top_goals || [],
        assistant_name: profile?.assistant_name || "",
        persona: profile?.persona || "",
        tone: profile?.tone || "",
        language: profile?.language || "EN",
        preferred_response_style: profile?.preferred_response_style || ""
      };

      console.log("Sending payload to weekly summary webhook:", payload);

      const response = await fetch(WEEKLY_SUMMARY_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Webhook error response:", errorText);
        throw new Error(`Failed to generate summary. Server responded with status ${response.status}. ${errorText || ''}`);
      }

      const responseText = await response.text();
      let isAlreadyExists = false;
      let newSummaryContent: string | null = null;

      if (responseText.trim() === ', already_exists') {
        isAlreadyExists = true;
        console.log("[AnalysisPage] 'already_exists' string received.");
      } else {
        try {
          const jsonData = JSON.parse(responseText);
          console.log("Received JSON response from webhook:", jsonData);
          if (Array.isArray(jsonData) && jsonData.length > 0 && jsonData[0]?.output === 'already_exists') {
            isAlreadyExists = true;
            console.log("[AnalysisPage] 'already_exists' received in array format.");
          } else if (typeof jsonData === 'object' && jsonData !== null && !Array.isArray(jsonData) && jsonData.already_exists === true) {
            isAlreadyExists = true;
            console.log("[AnalysisPage] 'already_exists' received in object format.");
          } else {
            if (Array.isArray(jsonData) && jsonData.length > 0) {
               newSummaryContent = jsonData[0]?.output || jsonData[0]?.summary || jsonData[0]?.text || JSON.stringify(jsonData);
            } else if (typeof jsonData === 'object' && jsonData !== null) {
               newSummaryContent = jsonData.output || jsonData.summary || jsonData.text || JSON.stringify(jsonData);
            } else {
               newSummaryContent = JSON.stringify(jsonData);
            }
          }
        } catch (e) {
          console.log("Received non-JSON response (and not ', already_exists'), treating as summary text.");
          newSummaryContent = responseText;
        }
      }

      if (isAlreadyExists) {
        toast({
          title: "Info",
          description: "Weekly summary for previous week already available.",
          variant: "info",
        });
        console.log("[AnalysisPage] Showing toast, preserving current summary.");
        if (user?.id && summaryThreadId) {
           await fetchLatestSummaryFromDB(user.id, summaryThreadId);
        }
      } else if (newSummaryContent) {
        setSummaryContent(newSummaryContent);
        const key = getSummaryStorageKey(user.id);
        if (key) {
          sessionStorage.setItem(key, newSummaryContent);
          console.log("[AnalysisPage] New summary saved to sessionStorage.");
        }
        setDbSummaryContent(newSummaryContent);
        setDbSummaryError(null);
      }

    } catch (error: any) {
      console.error("Error generating weekly summary:", error);
      setSummaryError(error.message || "An unexpected error occurred while generating the summary.");
      setSummaryContent(null);
      setDbSummaryContent(null);
      const key = getSummaryStorageKey(user?.id);
      if (key) sessionStorage.removeItem(key);
    } finally {
      setSummaryLoading(false);
    }
  }, [user, profile, fetchLatestSummaryFromDB, toast]);

  // Function to handle copying the summary
  const handleCopySummary = useCallback(async () => {
    const textToCopy = dbSummaryContent ?? summaryContent; // Prioritize DB content
    if (!textToCopy) {
      toast({ title: "Error", description: "No summary content available to copy.", variant: "destructive" });
      return;
    }

    // Log availability of clipboard API
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      console.error("Clipboard API (writeText) not available in this environment.");
      toast({ title: "Error", description: "Clipboard access is not available in this browser or context.", variant: "destructive" });
      return;
    }

    try {
      console.log("Attempting to copy text to clipboard..."); // Log before attempting
      await navigator.clipboard.writeText(textToCopy);
      console.log("Text successfully copied to clipboard."); // Log success
      setIsCopied(true);
      toast({ title: "Success", description: "Summary copied to clipboard!" });
      setTimeout(() => setIsCopied(false), 2000); // Reset icon after 2 seconds
    } catch (err) {
      // Log the specific error object
      console.error("Failed to copy summary:", err);
      // Provide more specific error if possible
      let errorMsg = "Could not copy summary to clipboard.";
      if (err instanceof Error) {
        errorMsg += ` Reason: ${err.name} - ${err.message}`;
      }
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
    }
  }, [dbSummaryContent, summaryContent, toast]);

  // Function to render markdown safely
  const renderMarkdown = (markdown: string) => {
    if (markdown.trim() === ', already_exists') {
        return null;
    }
    const rawMarkup = marked.parse(markdown);
    const sanitizedMarkup = DOMPurify.sanitize(rawMarkup, { USE_PROFILES: { html: true } });
    return <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: sanitizedMarkup }} />;
  };

  const cardsToDisplay = maximizedCardId
    ? analysisCardsData.filter(card => card.id === maximizedCardId)
    : analysisCardsData;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Analysis & Insights</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Track your progress and gain insights from your conversations with Companira.
        Some features require login.
      </p>

      <div className={`grid gap-6 ${maximizedCardId ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        {cardsToDisplay.map((cardData) => {
          const isMaximized = maximizedCardId === cardData.id;
          const isWeeklySummaryCard = cardData.id === 'weeklySummary';
          const currentSummaryText = dbSummaryContent ?? summaryContent; // Determine current text

          return (
            <Card key={cardData.id} className={cn(isMaximized ? 'transition-all duration-300 ease-in-out flex flex-col' : '', 'overflow-hidden')}>
              <CardHeader className="flex flex-row items-start justify-between flex-shrink-0">
                <div>
                  <CardTitle className="flex items-center mb-1">
                    <cardData.icon className={`h-5 w-5 mr-2 ${cardData.iconColor}`} />
                    {cardData.title}
                    {/* Add New Badge */}
                    {cardData.isNew && (
                      <span className="ml-2 inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                        New
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {cardData.description}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => isMaximized ? handleMinimize() : handleMaximize(cardData.id)}
                  aria-label={isMaximized ? 'Minimize card' : 'Maximize card'}
                  title={isMaximized ? 'Minimize card' : 'Maximize card'}
                >
                  {isMaximized ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                </Button>
              </CardHeader>
              <CardContent className={cn(
                "bg-gray-50 dark:bg-slate-900 rounded-b-lg",
                isMaximized ? 'flex-grow p-6 overflow-y-auto' : 'h-48 p-4 flex items-center justify-center'
              )}>
                {/* Content */}
                {isMaximized && isWeeklySummaryCard ? (
                  // Maximized Weekly Summary Card Content
                  <div className="flex flex-col h-full">
                    {/* --- Loading States --- */}
                    {summaryLoading && (
                      <div className="flex-grow flex flex-col items-center justify-center text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Generating your summary...</p>
                      </div>
                    )}
                    {!summaryLoading && dbSummaryLoading && (
                      <div className="flex-grow flex flex-col items-center justify-center text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Loading latest summary...</p>
                      </div>
                    )}

                    {/* --- Error States --- */}
                    {!summaryLoading && !dbSummaryLoading && summaryError && (
                       <div className="flex-grow flex flex-col items-center justify-center text-center text-destructive bg-destructive/10 p-4 rounded-md border border-destructive">
                         <AlertCircle className="h-8 w-8 mb-4" />
                         <p className="font-semibold mb-2">Error Generating Summary</p>
                         <p className="text-sm mb-4">{summaryError}</p>
                         <Button onClick={handleGenerateSummary} variant="destructive" size="sm">
                            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                         </Button>
                       </div>
                    )}
                    {!summaryLoading && !dbSummaryLoading && !summaryError && dbSummaryError && !dbSummaryContent && (
                       <div className="flex-grow flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/30 p-4 rounded-md border border-border">
                         <Info className="h-8 w-8 mb-4" />
                         <p className="font-semibold mb-2">No Summary Available</p>
                         <p className="text-sm mb-4">{dbSummaryError}</p>
                         <Button onClick={handleGenerateSummary} disabled={!user || summaryLoading} variant="default" size="sm">
                           <RefreshCw className="mr-2 h-4 w-4" />
                           {user ? 'Generate Weekly Summary' : 'Log in to Generate'}
                         </Button>
                       </div>
                    )}

                    {/* --- Content Display --- */}
                    {!summaryLoading && !dbSummaryLoading && !summaryError && (
                      <div className="flex-grow flex flex-col">
                        {/* Display Summary Content */}
                        {currentSummaryText ? (
                          <div className="flex-grow overflow-y-auto mb-4">
                            {renderMarkdown(currentSummaryText)}
                          </div>
                        ) : (
                          !dbSummaryError && (
                            <div className="flex-grow flex flex-col items-center justify-center text-center">
                              <p className="text-muted-foreground mb-4">
                                Click the button below to generate your personalized weekly summary.
                              </p>
                            </div>
                          )
                        )}

                        {/* Action Button Area */}
                        <div className="mt-auto flex justify-end items-center gap-2 pt-4 border-t">
                           {/* Copy Button - Show only if content exists */}
                           {currentSummaryText && (
                             <Button
                               onClick={handleCopySummary}
                               variant="ghost"
                               size="sm"
                               className={cn("text-muted-foreground hover:text-foreground", isCopied && "text-green-600 hover:text-green-700")}
                               disabled={isCopied}
                               aria-label="Copy summary to clipboard"
                             >
                               {isCopied ? (
                                 <Check className="mr-1 h-4 w-4" />
                               ) : (
                                 <ClipboardCopy className="mr-1 h-4 w-4" />
                               )}
                               {isCopied ? 'Copied!' : 'Copy'}
                             </Button>
                           )}
                           {/* Generate/Regenerate Button */}
                           <Button onClick={handleGenerateSummary} disabled={!user || summaryLoading} variant={currentSummaryText ? "outline" : "default"} size="sm">
                             <RefreshCw className="mr-2 h-4 w-4" />
                             {currentSummaryText ? 'Regenerate Summary' : (user ? 'Generate Weekly Summary' : 'Log in to Generate')}
                           </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Placeholder for other cards
                  <p className="text-gray-500 dark:text-gray-400 text-center whitespace-pre-line">
                    {cardData.contentPlaceholder}
                    {isMaximized && !isWeeklySummaryCard && <span className="block mt-4 text-sm">(Full analysis interface will appear here)</span>}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AnalysisPage;
