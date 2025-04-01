import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import ChatContainer from '../components/chat/ChatContainer';
import FAQSection from '../components/faq/FAQSection';
import { MessageSquare, BrainCircuit, ShieldCheck, Users, PlayCircle } from 'lucide-react'; // Added icons

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { chatId } = useChat();

  // Video state and ref
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    // Construct the public URL for the video from Supabase environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      try {
        // Extract project reference from the Supabase URL
        const url = new URL(supabaseUrl);
        const projectRef = url.hostname.split('.')[0];
        // Construct the public storage URL
        const publicUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/video/Companira_ad.mp4`;
        setVideoUrl(publicUrl);
      } catch (error) {
        console.error("Error constructing Supabase video URL:", error);
        // Handle error appropriately, maybe set a state to show an error message
      }
    } else {
      console.error("VITE_SUPABASE_URL is not defined in environment variables.");
      // Handle missing env var
    }
  }, []); // Run only once on component mount

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (!isPlaying) {
        videoRef.current.play().catch(error => {
          console.error("Video play failed:", error);
          // Handle potential play errors (e.g., browser restrictions)
        });
        setIsPlaying(true);
      }
      // Optional: Allow pausing by clicking again
      // else {
      //   videoRef.current.pause();
      //   setIsPlaying(false);
      // }
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false); // Reset play button when video ends
    if (videoRef.current) {
      videoRef.current.currentTime = 0; // Optional: Reset video to start
    }
  };


  return (
    <div className="container mx-auto px-4 py-8">
      {user ? (
        // Authenticated user view
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-lg shadow-md h-[70vh] mb-8">
            <div className="bg-muted/50 border-b border-border p-3 flex justify-between items-center rounded-t-lg">
              <p className="text-foreground font-medium">
                Welcome back, <span className="font-bold">{user.nickname || user.email}</span>! How can I help you today?
              </p>
              <span className="text-xs text-muted-foreground">Chat ID: {chatId.substring(0, 8)}</span>
            </div>
            <div className="h-[calc(70vh-48px)]">
              <ChatContainer />
            </div>
          </div>
        </div>
      ) : (
        // Non-authenticated user view
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
                <Link to="/signup">
                  <Button size="lg" className="w-full sm:w-auto">Get Started for Free</Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">Log In</Button>
                </Link>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="mb-16" aria-labelledby="features-heading">
             <h2 id="features-heading" className="text-3xl font-bold text-center mb-12 text-foreground">
              Why Choose Companira?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature Cards */}
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
                  className="w-full block" // Ensure video takes full width of container
                  playsInline // Important for playback on iOS
                  onEnded={handleVideoEnd} // Reset state when video finishes
                  // poster="/path/to/your/poster.jpg" // Optional: Add a poster image URL here
                  preload="metadata" // Preload metadata to get dimensions/duration
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
             // Optional: Show a loading state or placeholder if the URL is not yet available
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

          {/* FAQ Section */}
          <FAQSection />
        </>
      )}
    </div>
  );
};

export default HomePage;
