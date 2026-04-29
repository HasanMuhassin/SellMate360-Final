import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Phone, User, ArrowRight, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useSignIn, useSignUp } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useCreateLoginEntry } from '@/hooks/useSecurity';
import { z } from 'zod';

// Validation schemas
const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

const registerSchema = z.object({
  name: z.string().trim().min(2, { message: 'Name must be at least 2 characters' }).max(100, { message: 'Name must be less than 100 characters' }),
  email: z.string().trim().email({ message: 'Please enter a valid email address' }),
  phone: z.string().optional(),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  terms: z.boolean().refine(val => val === true, { message: 'You must accept the terms and conditions' }),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  terms?: string;
}

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [loginErrors, setLoginErrors] = useState<Partial<LoginFormData>>({});
  const [registerErrors, setRegisterErrors] = useState<FormErrors>({});

  const navigate = useNavigate();
  const { toast } = useToast();
  const signIn = useSignIn();
  const signUp = useSignUp();
  const createLoginEntry = useCreateLoginEntry();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginErrors({});

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get('login-email') as string,
      password: formData.get('login-password') as string,
    };

    // Validate
    const result = loginSchema.safeParse(data);
    if (!result.success) {
      const errors: Partial<LoginFormData> = {};
      result.error.errors.forEach(err => {
        errors[err.path[0] as keyof LoginFormData] = err.message;
      });
      setLoginErrors(errors);
      return;
    }

    try {
      await signIn.mutateAsync({ email: data.email, password: data.password });

      // Record successful login
      createLoginEntry.mutate({
        email: data.email,
        success: true,
        metadata: { portal: 'customer', action: 'login' }
      });

      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
      navigate('/');
    } catch (error: any) {
      // Record failed login
      createLoginEntry.mutate({
        email: data.email,
        success: false,
        failure_reason: error.message || 'Invalid email or password',
        metadata: { portal: 'customer', action: 'login' }
      });

      toast({
        title: 'Sign in failed',
        description: error.message || 'Invalid email or password',
        variant: 'destructive',
      });
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegisterErrors({});

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('register-name') as string,
      email: formData.get('register-email') as string,
      phone: formData.get('register-phone') as string,
      password: formData.get('register-password') as string,
      terms: formData.get('terms') === 'on',
    };

    // Validate
    const result = registerSchema.safeParse(data);
    if (!result.success) {
      const errors: FormErrors = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof FormErrors;
        errors[field] = err.message;
      });
      setRegisterErrors(errors);
      return;
    }

    try {
      const result = await signUp.mutateAsync({
        email: data.email,
        password: data.password,
        name: data.name,
        phone: data.phone,
      });

      // Record successful registration
      createLoginEntry.mutate({
        email: data.email,
        success: true,
        metadata: { portal: 'customer', action: 'register' }
      });

      // If auto-confirmed, user is logged in immediately
      if (result.session) {
        toast({
          title: 'Welcome!',
          description: 'Your account has been created successfully.',
        });
        navigate('/');
      } else {
        setRegistrationSuccess(true);
      }
    } catch (error: any) {
      // Record failed registration
      createLoginEntry.mutate({
        email: data.email,
        success: false,
        failure_reason: error.message || 'Could not create account',
        metadata: { portal: 'customer', action: 'register' }
      });

      toast({
        title: 'Registration failed',
        description: error.message || 'Could not create account',
        variant: 'destructive',
      });
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Check your email</h1>
          <p className="text-muted-foreground mb-6">
            We've sent you a confirmation link. Please check your email to verify your account.
          </p>
          <Button asChild variant="outline">
            <Link to="/">Return to Home</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

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
            <span className="text-2xl font-bold">
              SellMate<span className="text-primary">360</span>
            </span>
          </Link>

          <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
          <p className="text-muted-foreground mb-8">
            Sign in to your account to continue shopping
          </p>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      name="login-email"
                      type="email"
                      placeholder="john@example.com"
                      className="pl-10"
                      required
                    />
                  </div>
                  {loginErrors.email && (
                    <p className="text-sm text-destructive mt-1">{loginErrors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      name="login-password"
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
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="text-sm text-destructive mt-1">{loginErrors.password}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" />
                    <label htmlFor="remember" className="text-sm cursor-pointer">
                      Remember me
                    </label>
                  </div>
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
                  disabled={signIn.isPending}
                >
                  {signIn.isPending ? 'Signing in...' : 'Sign In'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </TabsContent>

            {/* Register Form */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="register-name">Full Name</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-name"
                      name="register-name"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10"
                      required
                    />
                  </div>
                  {registerErrors.name && (
                    <p className="text-sm text-destructive mt-1">{registerErrors.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="register-phone">Phone Number (Optional)</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-phone"
                      name="register-phone"
                      type="tel"
                      placeholder="0771234567"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="register-email">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-email"
                      name="register-email"
                      type="email"
                      placeholder="john@example.com"
                      className="pl-10"
                      required
                    />
                  </div>
                  {registerErrors.email && (
                    <p className="text-sm text-destructive mt-1">{registerErrors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="register-password">Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-password"
                      name="register-password"
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
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {registerErrors.password && (
                    <p className="text-sm text-destructive mt-1">{registerErrors.password}</p>
                  )}
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox id="terms" name="terms" required />
                  <label htmlFor="terms" className="text-sm cursor-pointer leading-tight">
                    I agree to the{' '}
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms & Conditions
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                {registerErrors.terms && (
                  <p className="text-sm text-destructive">{registerErrors.terms}</p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={signUp.isPending}
                >
                  {signUp.isPending ? 'Creating account...' : 'Create Account'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Reseller Link */}
          <div className="mt-8 p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-2">Are you a reseller?</p>
            <Link to="/reseller/login" className="text-primary font-medium hover:underline">
              Login to Reseller Portal →
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center p-8">
        <div className="text-center text-primary-foreground">
          <h2 className="text-3xl font-bold mb-4">Start Shopping Today</h2>
          <p className="text-lg opacity-90 max-w-md">
            Discover amazing products with island-wide delivery and cash on delivery options.
          </p>
        </div>
      </div>
    </div>
  );
}
