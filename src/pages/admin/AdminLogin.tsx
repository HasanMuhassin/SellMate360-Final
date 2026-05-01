import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShieldCheck, RefreshCw, ShieldAlert } from 'lucide-react';
import { z } from 'zod';
import { useCreateLoginEntry } from '@/hooks/useSecurity';

const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type VerificationStatus = 'idle' | 'authenticating' | 'verifying' | 'timeout' | 'success';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isInitializing } = useAdminAuth();
  const createLoginEntry = useCreateLoginEntry();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, isInitializing, navigate]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Checking your session...</p>
        </div>
      </div>
    );
  }

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setVerificationStatus('idle');

    // Validate input
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    setVerificationStatus('authenticating');

    try {
      // Update status to verifying after initial auth
      const authTimeout = setTimeout(() => {
        setVerificationStatus('verifying');
      }, 1500);

      const result = await login(email, password);
      clearTimeout(authTimeout);

      if (result.success) {
        // Record successful login
        createLoginEntry.mutate({
          email,
          success: true,
        });
        
        setVerificationStatus('success');
        // Navigate to admin dashboard on success
        navigate('/admin', { replace: true });
        return;
      }

      // Record failed login
      createLoginEntry.mutate({
        email,
        success: false,
        failure_reason: result.error || 'Login failed',
      });

      // Check if it's a timeout error
      if (result.error?.includes('timed out')) {
        setVerificationStatus('timeout');
        setError('Role verification timed out. Please try again.');
      } else {
        setVerificationStatus('idle');
        setError(result.error || 'Login failed');
      }
    } catch (_err) {
      setVerificationStatus('timeout');
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setVerificationStatus('idle');
    setError('');
    handleLogin();
  };

  const getStatusMessage = () => {
    switch (verificationStatus) {
      case 'authenticating':
        return 'Authenticating...';
      case 'verifying':
        return 'Checking access permissions...';
      case 'success':
        return 'Access granted! Redirecting...';
      case 'timeout':
        return 'Verification timed out';
      default:
        return null;
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">SellMate360 Admin</CardTitle>
          <CardDescription>
            Sign in to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Status indicator */}
          {statusMessage && verificationStatus !== 'timeout' && (
            <div className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              {verificationStatus !== 'success' && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Retry button for timeout */}
          {verificationStatus === 'timeout' && (
            <div className="mb-4 flex flex-col items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm text-muted-foreground text-center">
                The server took too long to verify your access. This might be a temporary issue.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                disabled={isSubmitting}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                Retry Verification
              </Button>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting || verificationStatus === 'timeout'}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
