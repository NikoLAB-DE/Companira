import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { AlertCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState(''); // Using email state
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    setLoading(true);
    try {
      // Call signIn and get the response object { data, error }
      // Pass email state directly as the identifier
      const response = await signIn(email, password);

      // Check the error property of the response
      if (response.error) {
        throw response.error; // Throw the error object from Supabase/AuthContext
      }

      // Handle success (e.g., redirect)
      // Note: onAuthStateChange should handle setting the user state
      navigate('/'); // Redirect to home/chat page on successful login

    } catch (err: any) {
      console.error("Login page error:", err);
      // Display the error message from the caught error
      setError(err.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] bg-muted/40 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back!</CardTitle>
          <CardDescription>Log in to continue your session</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Login Failed</p>
                <p>{error}</p>
              </div>
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              {/* Label and Input for Email */}
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email" // Ensure type is email for validation
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required // Email is required
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
                placeholder="Enter your password" // Added placeholder
                required
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging In...' : 'Log In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <p>Don't have an account?&nbsp;</p>
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
