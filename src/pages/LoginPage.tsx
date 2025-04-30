import React, { useState, useEffect } from 'react'; // Added useEffect for logging
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { AlertCircle, Eye, EyeOff } from 'lucide-react'; // Import icons

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Local loading state for the form button
  const { signIn } = useAuth();
  const navigate = useNavigate();

  // --- DEBUG LOGGING ---
  console.log('[LoginPage Render] State:', { email, password: '***', error, loading });

  useEffect(() => {
    console.log('[LoginPage Mounted]');
    return () => console.log('[LoginPage Unmounted]');
  }, []);
  // --- END DEBUG LOGGING ---


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[handleLogin] Start. Clearing previous error.'); // DEBUG
    setError(null); // Clear previous errors
    console.log('[handleLogin] Setting local loading to true.'); // DEBUG
    setLoading(true); // Set local loading true (disables button)
    try {
      console.log('[handleLogin] Calling signIn with:', email); // DEBUG
      const response = await signIn(email, password);
      console.log('[handleLogin] signIn response:', response); // DEBUG

      if (response.error) {
        console.log('[handleLogin] signIn returned an error. Throwing it.'); // DEBUG
        // If signIn returns an error, throw it to be caught below
        throw response.error;
      }
      console.log('[handleLogin] signIn successful. Navigating to /'); // DEBUG
      // Successful login: onAuthStateChange in AuthContext will handle user state update.
      navigate('/');
    } catch (err: any) {
      console.error("[handleLogin] CATCH block error:", err); // DEBUG: Log the raw error
      const errorMessage = err?.message || 'Failed to log in. Please check your credentials or try again later.';
      console.log('[handleLogin] Setting error state to:', errorMessage); // DEBUG
      // Set the local error state to display the message
      setError(errorMessage);
      // Email and password state remain unchanged here, preserving input
      console.log('[handleLogin] State after setting error:', { email, password: '***', error: errorMessage, loading }); // DEBUG
    } finally {
      console.log('[handleLogin] FINALLY block. Setting local loading to false.'); // DEBUG
      // Set local loading false (re-enables button)
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
          <CardTitle className="text-2xl font-bold">Welcome Back!</CardTitle>
          <CardDescription>Log in to continue your session</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Error message display section */}
          {error && (
            <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive flex items-start space-x-2" role="alert">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Login Failed</p>
                <p>{error}</p> {/* Display the error message */}
              </div>
            </div>
          )}
          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email} // Value bound to state
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                aria-required="true"
                aria-invalid={!!error} // Indicate invalid input on error
                className="mt-1"
                disabled={loading} // Disable input while local loading is true
              />
            </div>
            <div className="relative">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password} // Value bound to state
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                aria-required="true"
                aria-invalid={!!error} // Indicate invalid input on error
                className="mt-1 pr-10"
                disabled={loading} // Disable input while local loading is true
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 top-6 flex items-center px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={loading} // Disable toggle while local loading is true
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {/* Show local loading state text on button */}
              {loading ? 'Logging In...' : 'Log In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <p>Don't have an account? </p>
          <Link to="/signup" className="ml-1 font-medium text-primary hover:underline"> {/* Added ml-1 for spacing */}
            Sign up
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
