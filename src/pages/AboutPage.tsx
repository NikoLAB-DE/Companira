import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Shield, Heart, MessageSquare } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    // Added padding within the scrollable area
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">About Companira</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8"> {/* Adjusted text color for dark mode */}
        Companira is a personalized psychological assistant designed to support your mental wellbeing through thoughtful conversations and guidance.
      </p>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="h-5 w-5 mr-2 text-red-600" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300"> {/* Adjusted text color for dark mode */}
              Companira was created with a simple mission: to make mental wellbeing support accessible to everyone, everywhere. We believe that everyone deserves a compassionate companion who listens without judgment, offers perspective when needed, and helps navigate life's challenges.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mt-4"> {/* Adjusted text color for dark mode */}
              Our goal is to combine the best of psychological science with the convenience of modern technology to provide personalized support that adapts to your unique needs and preferences.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-blue-600" />
              Privacy & Ethics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300"> {/* Adjusted text color for dark mode */}
              Your privacy and wellbeing are our top priorities. Companira is designed with strong privacy protections:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-700 dark:text-gray-300"> {/* Adjusted text color for dark mode */}
              <li>Your conversations are encrypted and handled with care</li>
              <li>We only collect information that helps improve your experience</li>
              <li>You have full control over your data</li>
              <li>We're transparent about our capabilities and limitations</li>
              <li>Companira is designed to complement, not replace, professional mental health care</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-purple-600" />
              Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300"> {/* Adjusted text color for dark mode */}
              We'd love to hear from you! If you have questions, feedback, or need support, please reach out to us:
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-gray-700 dark:text-gray-300"><strong>Email:</strong> support@companira.com</p> {/* Adjusted text color for dark mode */}
              <p className="text-gray-700 dark:text-gray-300"><strong>Support Hours:</strong> Monday-Friday, 9am-5pm CET</p> {/* Adjusted text color for dark mode */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AboutPage;
