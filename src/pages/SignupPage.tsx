import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { AlertCircle, Info } from 'lucide-react';

// Retrieve the Test Key from environment variables
const VITE_TEST_KEY = import.meta.env.VITE_TEST_KEY;

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [testerId, setTesterId] = useState(''); // State for Tester ID
  const [error, setError] = useState<string | null>(null); // Page-specific error state
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous page-specific errors
    setLoading(true);

    // --- Tester ID Validation ---
    if (!VITE_TEST_KEY) {
        console.error("VITE_TEST_KEY is not defined in the environment variables.");
        setError("Sign-up configuration error. Please contact support.");
        setLoading(false);
        return;
    }
    if (testerId !== VITE_TEST_KEY) {
      setError('Invalid Tester ID. Please provide the correct ID to sign up during the testing phase.');
      setLoading(false);
      return;
    }
    // --- End Tester ID Validation ---

    try {
      // Call the signUp function from AuthContext
      console.log("Calling signUp with:", { nickname, email });
      const response = await signUp(nickname, email, password);
      console.log("Response from signUp in SignupPage:", response); // Log the received response

      // Check if the response contains an error object
      if (response.error) {
        console.error("Signup failed (detected in SignupPage):", response.error);
        // Set the page-specific error state with the message from the error object
        setError(response.error.message || 'Failed to sign up. Please check your details and try again.');
        // Do NOT reset form or navigate away - let user correct the issue
      } else if (response.data.user) {
        // Signup was successful, user object exists
        console.log("Signup successful, navigating to login...");
        // Only redirect to login after successful signup
        navigate('/login');
      } else {
        // Handle unexpected case where there's no error but also no user
        console.error("Signup returned no error and no user.");
        setError('An unexpected issue occurred during sign up. Please try again.');
        // Do NOT reset form or navigate away - let user try again
      }
    } catch (err: any) {
      // This catch block in SignupPage should ideally not be hit if AuthContext handles errors properly,
      // but keep it as a fallback for truly unexpected issues during the await/call itself.
      console.error("Unexpected error during signup process in SignupPage:", err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
      // Do NOT reset form or navigate away - let user try again
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] bg-muted/40 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create Tester Account</CardTitle>
          <CardDescription>Join the Companira testing phase!</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Informational Text */}
          <div className="mb-4 rounded-md border border-blue-300 bg-blue-50 p-3 text-sm text-blue-800 flex items-start space-x-2 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Testing Phase Information</p>
              <p>This is a testing phase of Companira assistant. Only test users are currently allowed to sign-up. If you believe you can bring some valuable insights or ideas (psychologist, patient, developer etc), use the <Link to="/contact" className="font-medium text-primary hover:underline">contact form</Link> and leave us a message.</p>
            </div>
          </div>

          {/* Display page-specific error - Make it more prominent */}
          {error && (
            <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Signup Failed</p>
                <p>{error}</p>
              </div>
            </div>
          )}
          <form onSubmit={handleSignup} className="space-y-4">
             <div>
              <Label htmlFor="testerId">Tester ID</Label>
              <Input
                id="testerId"
                type="password" // Use password type to obscure the ID
                value={testerId}
                onChange={(e) => setTesterId(e.target.value)}
                placeholder="Enter your Tester ID"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Choose a unique nickname"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Must be at least 6 characters"
                required
                minLength={6}
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up as Tester'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <p>Already have an account?&nbsp;</p>
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignupPage;
