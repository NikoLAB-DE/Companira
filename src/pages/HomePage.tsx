import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { Button, buttonVariants } from '../components/ui/button'; // Import buttonVariants
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import ChatContainer from '../components/chat/ChatContainer';
import FAQSection from '../components/faq/FAQSection';
import { MessageSquare, BrainCircuit, ShieldCheck, Users, PlayCircle, HelpCircle, CheckCircle, UserCircle } from 'lucide-react';
import { useActiveTasks } from '@/hooks/useActiveTasks';
import HelpDialog from '@/components/HelpDialog';
import { useAdmin } from '@/contexts/AdminContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useProfile } from '@/contexts/ProfileContext';

// Import the markdown file content as raw strings
import chatHelpMarkdown from '../../chat_help.md?raw';
import profileHelpMarkdown from '../../profile_help.md?raw';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { chatId } = useChat(); // chatId is still available if needed elsewhere, just not rendered here
  const { activeTasks } = useActiveTasks(user?.id);
  const { isAdmin } = useAdmin();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const location = useLocation(); // Get location object

  // Extract topic path string from location state
  const initialTopicPath = location.state?.topicPathString as string | undefined;

  // State for Help Dialogs
  const [isChatHelpDialogOpen, setIsChatHelpDialogOpen] = useState(false);
  const [isProfileHelpDialogOpen, setIsProfileHelpDialogOpen] = useState(false);

  // Video state and ref
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      try {
        const url = new URL(supabaseUrl);
        const projectRef = url.hostname.split('.')[0];
        const publicUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/video/Companira_ad.mp4`;
        setVideoUrl(publicUrl);
      } catch (error) {
        console.error("Error constructing Supabase video URL:", error);
      }
    } else {
      console.error("VITE_SUPABASE_URL is not defined in environment variables.");
    }
  }, []);

  // Clear location state after using it to prevent re-population on refresh/navigation
  useEffect(() => {
    if (location.state?.topicPathString) {
      // Replace the current entry in the history stack without the state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);


  const handleVideoClick = () => {
    if (videoRef.current) {
      if (!isPlaying) {
        videoRef.current.play().catch(error => {
          console.error("Video play failed:", error);
        });
        setIsPlaying(true);
      }
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const activeTaskCount = activeTasks.length;
  const taskMessage = activeTaskCount > 0
    ? `You have ${activeTaskCount} active task${activeTaskCount > 1 ? 's' : ''}.`
    : 'You have no active tasks.';

  const handlePricingButtonClick = () => {
    navigate('/signup');
  };

  const hasProfile = !profileLoading && profile !== null && profile.user_id === user?.id;
  const showCreateProfileIcon = user && !profileLoading && profile === null;


  return (
    <div className="container mx-auto px-4 py-8">
      {user ? (
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-lg shadow-md h-[70vh] mb-8">
            <div className="bg-muted/50 border-b border-border p-3 flex justify-between items-center rounded-t-lg">
              <p className="text-foreground font-medium">
                Welcome back, <span className="font-bold">{user.nickname || user.email}</span>! How can I help you today?
                <span className="block text-sm text-muted-foreground mt-1">
                  {taskMessage} <Link to="/tools" className="text-primary hover:underline">View tasks</Link>
                </span>
              </p>
              <div className="flex items-center space-x-2">
                 {showCreateProfileIcon && (
                    <Button
                       variant="ghost"
                       size="icon"
                       onClick={() => setIsProfileHelpDialogOpen(true)}
                       aria-label="Open profile help"
                       title="Create Your Profile"
                       className="text-orange-500 hover:text-orange-600"
                    >
                       <UserCircle className="h-5 w-5" />
                    </Button>
                 )}
                 <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsChatHelpDialogOpen(true)}
                    aria-label="Open chat help"
                    title="Chat Help"
                    className="text-muted-foreground hover:text-foreground"
                 >
                    <HelpCircle className="h-5 w-5" />
                 </Button>
                 {/* Removed the Chat ID span element */}
                 {/* <span className="text-xs text-muted-foreground">Chat ID: {chatId.substring(0, 8)}</span> */}
              </div>
            </div>
            <div className="h-[calc(70vh-48px)]">
              {/* Pass the initialTopicPath down to ChatContainer */}
              <ChatContainer initialTopicPath={initialTopicPath} />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <section className="text-center py-16 md:py-24 bg-gradient-to-br from-primary/10 via-background to-background rounded-lg mb-16">
            <div className="max-w-3xl mx-auto px-4">
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-foreground tracking-tight">
                Your Personal AI Companion for Mental Wellbeing
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Engage in meaningful conversations, gain insights, and access tools designed to support your emotional health and personal growth. Secure, empathetic, and always available.
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                {/* Apply button styles directly to Link */}
                <Link
                  to="/signup"
                  className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
                >
                  Get Started for Free
                </Link>
                {/* Apply button styles directly to Link */}
                <Link
                  to="/login"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}
                >
                  Log In
                </Link>
              </div>
               <p className="mt-6 text-sm text-muted-foreground">
                 Have questions? <Link to="/about#contact-form" className="text-primary hover:underline font-medium">Contact Us</Link>
               </p>
            </div>
          </section>

          {/* Features Section */}
          <section className="mb-16" aria-labelledby="features-heading">
             <h2 id="features-heading" className="text-3xl font-bold text-center mb-12 text-foreground">
              Why Choose Companira?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="flex flex-col items-center text-center p-6 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                   <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Empathetic Conversations</h3>
                <p className="text-muted-foreground text-sm">Engage in supportive dialogues designed to understand and assist you.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                 <div className="p-3 rounded-full bg-primary/10 mb-4">
                   <BrainCircuit className="h-8 w-8 text-primary" />
                 </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Personalized Insights</h3>
                <p className="text-muted-foreground text-sm">Gain understanding through AI analysis tailored to your interactions.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                 <div className="p-3 rounded-full bg-primary/10 mb-4">
                   <ShieldCheck className="h-8 w-8 text-primary" />
                 </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Secure & Private</h3>
                <p className="text-muted-foreground text-sm">Your conversations are confidential and protected with robust security.</p>
              </div>
               <div className="flex flex-col items-center text-center p-6 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                 <div className="p-3 rounded-full bg-primary/10 mb-4">
                   <Users className="h-8 w-8 text-primary" />
                 </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Community & Tools</h3>
                <p className="text-muted-foreground text-sm">Access helpful resources and connect within a supportive environment (coming soon).</p>
              </div>
            </div>
          </section>

          {/* Video Section */}
          {videoUrl ? (
            <section className="mb-16" aria-label="Companira Introduction Video">
              <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Meet Companira</h2>
              <div
                className="max-w-2xl mx-auto relative group cursor-pointer overflow-hidden rounded-lg shadow-lg border border-border"
                onClick={handleVideoClick}
              >
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full block"
                  playsInline
                  onEnded={handleVideoEnd}
                  preload="metadata"
                  aria-label="Click to play Companira introduction video"
                />
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 transition-opacity duration-300 group-hover:bg-opacity-50">
                    <PlayCircle className="h-16 w-16 text-white opacity-80 group-hover:opacity-100 transform transition-transform group-hover:scale-110" />
                  </div>
                )}
              </div>
            </section>
          ) : (
             <section className="mb-16 text-center">
                <p className="text-muted-foreground">Loading video...</p>
             </section>
          )}


          {/* How it Works / Deeper Dive Section */}
          <section className="mb-16 bg-muted/30 p-8 md:p-12 rounded-lg border border-border" aria-labelledby="how-it-works-heading">
             <h2 id="how-it-works-heading" className="text-3xl font-bold text-center mb-8 text-foreground">
              Start Your Journey Today
            </h2>
            <div className="max-w-3xl mx-auto text-center text-muted-foreground space-y-4">
                <p>Companira uses advanced AI, grounded in psychological principles, to provide a unique space for reflection and growth. Simply sign up, start chatting, and discover how personalized AI support can enhance your wellbeing.</p>
                <p>Customize your profile to help Companira understand your needs better, explore different conversation topics, or utilize integrated tools for specific goals.</p>
                 <Link to="/about" className="inline-block mt-4 text-primary hover:text-primary/80 font-medium">
                    Learn more about our approach &rarr;
                 </Link>
            </div>
          </section>

          {/* Pricing Section - Visible only if NOT logged in */}
          {!user && (
            <section className="mb-16" aria-labelledby="pricing-heading">
              <h2 id="pricing-heading" className="text-3xl font-bold text-center mb-12 text-foreground">
                Pricing
              </h2>
              {/* "Free for test users!" Badge/Text */}
              <div className="text-center mb-8">
                 <p className="text-xl font-bold text-primary">Free for test users!</p>
                 <p className="text-sm text-muted-foreground">Sign up now to access all features during the testing phase.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Free Trial Tier */}
                <Card className="flex flex-col text-center transition-all duration-300 hover:shadow-lg hover:scale-105">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold">Free Trial</CardTitle>
                    <CardDescription>Experience all features</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-4">
                    <p className="text-4xl font-extrabold text-primary">$0<span className="text-base font-medium text-muted-foreground">/10 days</span></p>
                    <ul className="text-left space-y-2 text-muted-foreground">
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Access to ALL functionalities</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Full chat capabilities</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Full profile customization</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Access to Life Situations content</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Full access to Tools</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Full access to Analysis</li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant="outline" onClick={handlePricingButtonClick}>Start Free Trial</Button>
                  </CardFooter>
                </Card>

                {/* Standard Tier */}
                <Card className="flex flex-col text-center transition-all duration-300 hover:shadow-lg hover:scale-105">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold">Standard</CardTitle>
                    <CardDescription>Essential support</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-4">
                    <p className="text-4xl font-extrabold text-primary">$14<span className="text-base font-medium text-muted-foreground">/month</span></p>
                     <ul className="text-left space-y-2 text-muted-foreground">
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Unlimited chat messages</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Full profile customization</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Access to Life Situations content</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Limited access to Tools</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Limited access to Analysis</li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" onClick={handlePricingButtonClick}>Choose Standard</Button>
                  </CardFooter>
                </Card>

                {/* Pro Tier (Highlighted) */}
                <Card className="flex flex-col text-center border-primary border-2 transition-all duration-300 hover:shadow-lg hover:scale-105">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold">Pro</CardTitle>
                    <CardDescription>Unlock full potential</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-4">
                    <p className="text-4xl font-extrabold text-primary">$19<span className="text-base font-medium text-muted-foreground">/month</span></p>
                     <ul className="text-left space-y-2 text-muted-foreground">
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Unlimited chat messages</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Full profile customization</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Access to Life Situations content</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Full access to Tools</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Full access to Analysis</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Voice control</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Internet search</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Priority support</li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" onClick={handlePricingButtonClick}>Choose Pro</Button>
                  </CardFooter>
                </Card>
              </div>
            </section>
          )}


          {/* FAQ Section */}
          <FAQSection />
        </>
      )}

      {/* Chat Help Dialog Component */}
      <HelpDialog
         isOpen={isChatHelpDialogOpen}
         onClose={() => setIsChatHelpDialogOpen(false)}
         markdownContent={chatHelpMarkdown}
         title="Chat Help"
         description="Tips for using the chat feature."
      />

      {/* Profile Help Dialog Component */}
      <HelpDialog
         isOpen={isProfileHelpDialogOpen}
         onClose={() => setIsProfileHelpDialogOpen(false)}
         markdownContent={profileHelpMarkdown}
         title="Complete Your Profile"
         description="Unlock a more personalized experience."
      />
    </div>
  );
};

export default HomePage;
