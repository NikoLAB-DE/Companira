import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { AlertCircle, Info, Eye, EyeOff } from 'lucide-react'; // Import Eye and EyeOff icons

// Retrieve the Test Key from environment variables
const VITE_TEST_KEY = import.meta.env.VITE_TEST_KEY;

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
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
      // Call the signUp function from AuthContext (now simplified)
      console.log("Calling signUp from SignupPage with:", { nickname, email });
      const response = await signUp(nickname, email, password);
      console.log("Response from signUp in SignupPage:", response); // Log the received response

      // Check if the response contains an error object
      if (response.error) {
        console.error("Signup failed (detected in SignupPage):", response.error.message);
        // Set the page-specific error state with the message from the error object
        // The message might have been standardized in AuthContext
        setError(response.error.message || 'Failed to sign up. Please check your details and try again.');
      } else if (response.data.user || response.data.session) {
        // Signup was successful (or requires confirmation), user/session object exists
        console.log("Signup successful or pending confirmation, navigating to login...");
        // Redirect to login page. If email confirmation is required,
        // the user will see a message there or need to check their email.
        // Consider showing a success message here before navigating:
        // e.g., setSuccess("Account created! Please check your email for confirmation.")
        navigate('/login');
      } else {
        // Handle unexpected case where there's no error but also no user/session
        console.error("Signup returned no error and no user/session data.");
        setError('An unexpected issue occurred during sign up. Please try again.');
      }
    } catch (err: any) {
      // This catch block handles errors *outside* the signUp promise itself (e.g., network error before call)
      // It's less likely to be hit now that AuthContext catches internal errors.
      console.error("Unexpected error during signup process in SignupPage:", err);
      setError(err.message || 'An unexpected network or system error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
              {/* Updated Link to point to About page contact form */}
              <p>This is a testing phase of Companira assistant. Only test users are currently allowed to sign-up. If you believe you can bring some valuable insights or ideas (psychologist, patient, developer etc), use the <Link to="/about#contact-form" className="font-medium text-primary hover:underline">contact form</Link> and leave us a message.</p>
            </div>
          </div>

          {/* Display page-specific error - Make it more prominent */}
          {error && (
            <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Signup Failed</p>
                <p>{error}</p> {/* Display the error message from state */}
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
                aria-describedby="testerIdHint" // For accessibility
                disabled={loading}
              />
               <p id="testerIdHint" className="text-xs text-muted-foreground mt-1">Required for the testing phase.</p>
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
                aria-describedby="nicknameHint"
                disabled={loading}
              />
              <p id="nicknameHint" className="text-xs text-muted-foreground mt-1">This will be your display name.</p>
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
                disabled={loading}
              />
            </div>
            {/* Password Input with Visibility Toggle */}
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1"> {/* Added relative container and mt-1 */}
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'} // Toggle type based on state
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  minLength={6} // Keep client-side check
                  className="pr-10" // Keep padding for the icon button
                  aria-describedby="passwordHint"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" // Use inset-y-0 and flex items-center
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
               <p id="passwordHint" className="text-xs text-muted-foreground mt-1">Must be at least 6 characters long.</p>
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
