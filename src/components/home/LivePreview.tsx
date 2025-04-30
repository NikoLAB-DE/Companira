import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion'; // Using framer-motion for smooth transitions

const messages = [
  "Hi, I’m here. What’s on your mind today?",
  "Struggling with focus? I can help you gently refocus.",
  "Need a little motivation or a mindful pause?",
  "Let's explore your thoughts together in a safe space.",
  "Remember to be kind to yourself today.",
];

const LivePreview: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 4000); // Change message every 4 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-muted/50 border border-border rounded-lg shadow-sm text-center min-h-[6rem] flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          className="text-muted-foreground italic"
        >
          "{messages[index]}"
        </motion.p>
      </AnimatePresence>
    </div>
  );
};

export default LivePreview;
