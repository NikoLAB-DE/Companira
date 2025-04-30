import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { MessageSquare, Loader2 } from 'lucide-react'; // Added Loader2
import { supabase } from '@/lib/supabase'; // Import Supabase client

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

    try {
      console.log("Invoking Supabase function 'send-contact-email' with:", { name, email, subject, message });
      const { data, error: functionError } = await supabase.functions.invoke('send-contact-email', {
        body: { name, email, subject, message },
      });

      console.log("Supabase function response:", { data, functionError });

      if (functionError) {
        // Handle specific Supabase function errors if needed
        console.error("Supabase function error:", functionError);
        throw new Error(functionError.message || "Failed to send message via Supabase function.");
      }

      // Check the response from the Resend API within the function's data
      // Resend API typically returns an object with an 'id' on success or 'error' object on failure.
      if (data?.error) {
         console.error("Resend API error (from function response):", data.error);
         // Try to get a more specific error message from Resend's response structure
         const resendErrorMessage = data.error.message || data.error.name || "Failed to send email via Resend.";
         throw new Error(resendErrorMessage);
      } else if (!data?.id) {
         // If there's no functionError but also no Resend ID, something might be wrong
         console.warn("Supabase function succeeded but no Resend email ID returned.", data);
         // Consider this a success for the user, but log a warning
         // throw new Error("Message sent, but confirmation from email service was unclear.");
      }

      // --- Success ---
      toast({
        title: "Message Sent!",
        description: "Thank you for contacting us. We'll get back to you soon.",
      });
      // Reset form
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');

    } catch (err: any) {
      console.error("Error submitting contact form:", err);
      setError(err.message || "Failed to send message. Please try again later.");
      toast({
        title: "Submission Error",
        description: err.message || "Failed to send message. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
              </>
            ) : (
              'Send Message'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ContactForm;
