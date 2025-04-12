import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { MessageSquare } from 'lucide-react';

const ContactForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    // Basic Validation
    if (!name || !email || !subject || !message) {
      setError("Please fill in all required fields.");
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // --- Simulate API Call ---
    // In a real application, you would send the data to your backend here
    // e.g., await fetch('/api/contact', { method: 'POST', body: JSON.stringify({ name, email, subject, message }) });
    console.log("Form Data:", { name, email, subject, message });

    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

    // --- Handle Response (Simulated) ---
    const success = Math.random() > 0.1; // Simulate occasional failure

    if (success) {
      toast({
        title: "Message Sent!",
        description: "Thank you for contacting us. We'll get back to you soon.",
      });
      // Reset form
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } else {
      setError("Failed to send message. Please try again later.");
      toast({
        title: "Submission Error",
        description: "Failed to send message. Please try again later.",
        variant: "destructive",
      });
    }
    // --- End Simulation ---

    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-purple-600" />
          Contact Us
        </CardTitle>
        <CardDescription>
          Have questions or feedback? Fill out the form below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject <span className="text-destructive">*</span></Label>
            <Input
              id="subject"
              placeholder="How can we help?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="message">Message <span className="text-destructive">*</span></Label>
            <Textarea
              id="message"
              placeholder="Your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              disabled={isSubmitting}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ContactForm;
