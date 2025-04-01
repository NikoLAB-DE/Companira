import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import ChatContainer from '../components/chat/ChatContainer';
import FAQSection from '../components/faq/FAQSection';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { chatId } = useChat();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {user ? (
          // Authenticated user sees the chat interface
          <div className="bg-white rounded-lg shadow-md border border-gray-200 h-[70vh] mb-8">
            <div className="bg-blue-50 border-b border-blue-200 p-3 flex justify-between items-center">
              <p className="text-blue-800 font-medium">
                Welcome back, <span className="font-bold">{user.nickname || user.email}</span>! How can I help you today?
              </p>
              <span className="text-xs text-blue-500">Chat ID: {chatId.substring(0, 8)}</span>
            </div>
            <div className="h-[calc(70vh-48px)]">
              <ChatContainer />
            </div>
          </div>
        ) : (
          // Non-authenticated users see the welcome content
          <>
            <h1 className="text-3xl font-bold mb-6">Companira</h1>
            <div className="prose max-w-none mb-8">
              <p className="text-lg text-gray-700 mb-6">
                Companira is your AI companion for meaningful conversations and assistance. Whether you need someone to talk to, get advice, or simply explore ideas, Companira is here for you.
              </p>
              <p className="text-gray-600 mb-8">
                Our AI is designed to be empathetic, understanding, and helpful. It adapts to your preferences and needs to provide the best possible experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold mb-3 text-blue-700">Personalized Experience</h3>
                <p className="text-gray-600">Customize how Companira interacts with you through detailed profile settings.</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold mb-3 text-blue-700">Meaningful Conversations</h3>
                <p className="text-gray-600">Engage in deep, thoughtful discussions about topics that matter to you.</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold mb-3 text-blue-700">Helpful Tools</h3>
                <p className="text-gray-600">Access a variety of tools designed to assist with your personal growth and well-being.</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-8 text-center mb-12">
              <h2 className="text-2xl font-bold text-blue-800 mb-4">Ready to get started?</h2>
              <p className="text-blue-700 mb-6">Create an account or log in to begin your journey with Companira.</p>
              <div className="flex justify-center space-x-4">
                <Link to="/signup">
                  <Button size="lg">Sign Up</Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg">Log In</Button>
                </Link>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-8 mt-12">
              <h2 className="text-2xl font-bold mb-4">Why Choose Companira?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"> {/* Added mb-12 */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Privacy-Focused</h3>
                  <p className="text-gray-600">Your conversations and data are kept private and secure.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Always Available</h3>
                  <p className="text-gray-600">Companira is here for you 24/7, whenever you need someone to talk to.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Continuous Improvement</h3>
                  <p className="text-gray-600">Our AI learns and adapts to provide better assistance over time.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Research-Backed</h3>
                  <p className="text-gray-600">Built on the latest advancements in AI and psychology.</p>
                </div>
              </div>
            </div>

            {/* FAQ Section - Moved to the end */}
            <FAQSection />
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
