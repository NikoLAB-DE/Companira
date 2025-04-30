import React, { useEffect, useRef } from 'react'; // Import useEffect and useRef
import { useLocation } from 'react-router-dom'; // Import useLocation
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Shield, Heart } from 'lucide-react';
import ContactForm from '../components/contact/ContactForm'; // Import the new form

const AboutPage: React.FC = () => {
  const location = useLocation(); // Get current location
  const contactFormRef = useRef<HTMLDivElement>(null); // Ref for the ContactForm Card

  // Effect to scroll to and focus the contact form if the hash matches
  useEffect(() => {
    if (location.hash === '#contact-form') {
      // Use a timeout to ensure the element is rendered before attempting to scroll/focus
      const timer = setTimeout(() => {
        const contactFormElement = document.getElementById('contact-form');
        if (contactFormElement) {
          console.log("Scrolling to and focusing contact form."); // Debug log
          contactFormElement.scrollIntoView({ behavior: 'smooth' });
          // Attempt to focus the first focusable element within the form card
          const firstInput = contactFormElement.querySelector('input, textarea, button') as HTMLElement;
          if (firstInput) {
            firstInput.focus();
          } else {
             // Fallback focus on the card itself if no focusable elements found immediately
             contactFormElement.focus();
          }
        } else {
           console.warn("Element with id 'contact-form' not found."); // Debug log
        }
      }, 100); // Small delay

      return () => clearTimeout(timer); // Cleanup the timer
    }
  }, [location.hash]); // Re-run effect when the URL hash changes

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

        {/* Wrap ContactForm in a Card with the target ID */}
        <Card id="contact-form" ref={contactFormRef} tabIndex={-1}> {/* Added id and tabIndex for focus */}
           <ContactForm />
        </Card>

      </div>
    </div>
  );
};

export default AboutPage;
