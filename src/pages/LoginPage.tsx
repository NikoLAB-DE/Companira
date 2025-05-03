import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  // --- DEBUG LOGGING ---
  // Log state on every render
  console.log('[LoginPage Render] Current State:', { email, password: password ? '***' : '', error, loading });

  useEffect(() => {
    console.log('[LoginPage Mounted]');
    return () => console.log('[LoginPage Unmounted]');
  }, []);
  // --- END DEBUG LOGGING ---


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[handleLogin] Start. Clearing previous error.');
    setError(null); // Clear previous errors
    console.log('[handleLogin] Setting local loading to true.');
    setLoading(true); // Set local loading true (disables button)

    try {
      console.log('[handleLogin] Calling signIn with email:', email);
      const response = await signIn(email, password);
      console.log('[handleLogin] signIn response received:', response);

      if (response.error) {
        console.log('[handleLogin] signIn returned an error. Throwing it:', response.error);
        // If signIn returns an error, throw it to be caught below
        throw response.error;
      }

      console.log('[handleLogin] signIn successful. Navigating to /');
      // Successful login: onAuthStateChange in AuthContext will handle user state update.
      navigate('/');

    } catch (err: any) {
      console.error("[handleLogin] CATCH block entered. Raw error object:", err); // Log the raw error object
      const errorMessage = err?.message || 'Failed to log in. Please check your credentials or try again later.';
      console.log('[handleLogin] Derived error message:', errorMessage);
      console.log('[handleLogin] Calling setError with:', errorMessage);
      setError(errorMessage); // Set the local error state to display the message
      // Email and password state should remain unchanged here, preserving input
      console.log('[handleLogin] State after calling setError:', { email, password: password ? '***' : '', error: errorMessage, loading });

    } finally {
      console.log('[handleLogin] FINALLY block entered. Setting local loading to false.');
      setLoading(false); // Set local loading false (re-enables button)
      console.log('[handleLogin] FINALLY block finished.');
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
            {/* Password Input with Visibility Toggle */}
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password} // Value bound to state
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  aria-required="true"
                  aria-invalid={!!error} // Indicate invalid input on error
                  className="pr-10" // Keep padding for the icon button
                  disabled={loading} // Disable input while local loading is true
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading} // Disable toggle while local loading is true
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {/* Show local loading state text on button */}
              {loading ? 'Logging In...' : 'Log In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <p>Don't have an account? </p>
          <Link to="/signup" className="ml-1 font-medium text-primary hover:underline">
            Sign up
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
