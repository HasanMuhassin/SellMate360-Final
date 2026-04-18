import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Building2, AlertCircle, Clock, XCircle, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSignIn, useSession } from '@/hooks/useAuth';
import { useReseller } from '@/hooks/useReseller';
import { useToast } from '@/hooks/use-toast';
import { useCreateLoginEntry } from '@/hooks/useSecurity';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function ResellerLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [checkingReseller, setCheckingReseller] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const signIn = useSignIn();
  const { session, loading: sessionLoading } = useSession();
  const { data: reseller, isLoading: resellerLoading, refetch } = useReseller();
  const createLoginEntry = useCreateLoginEntry();

  // If already logged in as approved reseller, redirect to portal
  useEffect(() => {
    if (sessionLoading || resellerLoading) return;
    
    if (session && reseller?.status === 'approved') {
      navigate('/reseller');
    }
  }, [session, sessionLoading, reseller, resellerLoading, navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    
    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    const result = loginSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Partial<LoginFormData> = {};
      result.error.errors.forEach(err => {
        fieldErrors[err.path[0] as keyof LoginFormData] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await signIn.mutateAsync({ email: data.email, password: data.password });
      
      // Record successful login
      createLoginEntry.mutate({
        email: data.email,
        success: true,
        metadata: { portal: 'reseller' }
      });

      setCheckingReseller(true);
      
      // Refetch reseller status after login
      const { data: resellerData } = await refetch();
      setCheckingReseller(false);
      
      if (resellerData?.status === 'approved') {
        toast({
          title: 'Welcome back!',
          description: 'You have successfully signed in to the Reseller Portal.',
        });
        navigate('/reseller');
      }
      // If not approved, the status message will show in the UI
    } catch (error: any) {
      // Record failed login
      createLoginEntry.mutate({
        email: data.email,
        success: false,
        failure_reason: error.message || 'Invalid email or password',
        metadata: { portal: 'reseller' }
      });

      setCheckingReseller(false);
      toast({
        title: 'Sign in failed',
        description: error.message || 'Invalid email or password',
        variant: 'destructive',
      });
    }
  };

  // Show status message if logged in but not approved
  const renderStatusMessage = () => {
    if (!session || resellerLoading) return null;
    
    if (!reseller) {
      return (
        <Alert className="border-primary/50 bg-primary/5">
          <Building2 className="h-4 w-4" />
          <AlertTitle>Not a Reseller</AlertTitle>
          <AlertDescription className="mt-2">
            You don't have a reseller account yet. Would you like to apply?
            <div className="mt-3">
              <Button asChild size="sm">
                <Link to="/reseller/apply">Apply as Reseller</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    switch (reseller.status) {
      case 'pending':
        return (
          <Alert className="border-warning/50 bg-warning/5">
            <Clock className="h-4 w-4 text-warning" />
            <AlertTitle className="text-warning">Application Under Review</AlertTitle>
            <AlertDescription>
              Your reseller application is being reviewed. We'll notify you once it's approved.
            </AlertDescription>
          </Alert>
        );
      case 'rejected':
        return (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Application Rejected</AlertTitle>
            <AlertDescription>
              Unfortunately, your reseller application was not approved. Please contact support for more information.
            </AlertDescription>
          </Alert>
        );
      case 'blocked':
        return (
          <Alert variant="destructive">
            <Ban className="h-4 w-4" />
            <AlertTitle>Account Blocked</AlertTitle>
            <AlertDescription>
              Your reseller account has been blocked. 
              {reseller.blocked_reason && <span className="block mt-1">Reason: {reseller.blocked_reason}</span>}
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  const isLoading = signIn.isPending || checkingReseller;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
              <span className="text-xl font-bold text-primary-foreground">S</span>
            </div>
            <div>
              <span className="text-2xl font-bold">
                SellMate<span className="text-primary">360</span>
              </span>
              <p className="text-xs text-muted-foreground">Reseller Portal</p>
            </div>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Reseller Login</CardTitle>
              <CardDescription>
                Sign in to access your reseller dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Message */}
              {renderStatusMessage()}

              {/* Login Form - only show if not logged in or needs to re-authenticate */}
              {(!session || (!reseller && !resellerLoading)) && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="reseller@example.com"
                        className="pl-10"
                        required
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive mt-1">{errors.password}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end">
                    <Link
                      to="/forgot-password"
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              )}

              {/* Back to home if logged in with non-approved status */}
              {session && reseller && reseller.status !== 'approved' && (
                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/">Return to Store</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Apply Link */}
          {!session && (
            <div className="mt-6 p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">Not a reseller yet?</p>
              <Link to="/reseller/apply" className="text-primary font-medium hover:underline">
                Apply to become a reseller →
              </Link>
            </div>
          )}

          {/* Customer Login Link */}
          <div className="mt-4 text-center">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Looking for customer login? →
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center p-8">
        <div className="text-center text-primary-foreground">
          <Building2 className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl font-bold mb-4">Reseller Portal</h2>
          <p className="text-lg opacity-90 max-w-md">
            Place orders, track your profits, and grow your business with SellMate360.
          </p>
          <div className="mt-8 space-y-2 text-left max-w-sm mx-auto">
            <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-sm font-bold">15%</span>
              </div>
              <span>Profit margins on every sale</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-sm font-bold">24h</span>
              </div>
              <span>Fast payout processing</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-sm font-bold">COD</span>
              </div>
              <span>Cash on delivery support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
