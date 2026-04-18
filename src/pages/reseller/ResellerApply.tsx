import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  ArrowRight, 
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useSession, useSignUp } from '@/hooks/useAuth';
import { useApplyAsReseller, useReseller } from '@/hooks/useReseller';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const applicationSchema = z.object({
  business_name: z.string().trim().min(2, { message: 'Business name must be at least 2 characters' }).max(255),
  business_registration: z.string().optional(),
  tax_id: z.string().optional(),
  contact_person: z.string().trim().min(2, { message: 'Contact person name is required' }).max(255),
  phone: z.string().min(9, { message: 'Please enter a valid phone number' }).max(20),
  email: z.string().trim().email({ message: 'Please enter a valid email address' }),
  address: z.string().trim().min(10, { message: 'Please enter your full address' }).max(500),
  terms: z.boolean().refine(val => val === true, { message: 'You must accept the terms and conditions' }),
});

const registerSchema = z.object({
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;
type FormErrors = Partial<Record<keyof ApplicationFormData | 'password', string>>;

export default function ResellerApply() {
  const [errors, setErrors] = useState<FormErrors>({});
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [signupRequiresEmailVerification, setSignupRequiresEmailVerification] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, loading: sessionLoading } = useSession();
  const { data: existingReseller, isLoading: resellerLoading } = useReseller();
  const signUp = useSignUp();
  const applyAsReseller = useApplyAsReseller();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    
    const formData = new FormData(e.currentTarget);
    const data = {
      business_name: formData.get('business_name') as string,
      business_registration: formData.get('business_registration') as string || undefined,
      tax_id: formData.get('tax_id') as string || undefined,
      contact_person: formData.get('contact_person') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      address: formData.get('address') as string,
      terms: formData.get('terms') === 'on',
    };

    // Validate application data
    const result = applicationSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof FormErrors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // If not logged in, we need to create an account first
    if (!session) {
      const password = formData.get('password') as string;
      const passwordResult = registerSchema.safeParse({ password });
      
      if (!passwordResult.success) {
        setErrors({ password: passwordResult.error.errors[0].message });
        return;
      }

      try {
        // Create account first
        const signUpResult = await signUp.mutateAsync({
          email: data.email,
          password,
          name: data.contact_person,
        });

        // If signup immediately creates a session (e.g., auto-confirm enabled), submit the reseller application now.
        // Otherwise, we can only create the account and ask the user to verify their email, then sign in and submit.
        if (signUpResult?.session && signUpResult.user) {
          const { error: applyError } = await supabase
            .from('resellers')
            .insert({
              business_name: data.business_name,
              business_registration: data.business_registration ?? null,
              tax_id: data.tax_id ?? null,
              contact_person: data.contact_person,
              phone: data.phone,
              email: data.email,
              address: data.address,
              user_id: signUpResult.user.id,
              status: 'pending',
            })
            .select()
            .single();

          if (applyError) throw applyError;

          setSignupRequiresEmailVerification(false);
          setApplicationSubmitted(true);
          toast({
            title: 'Application submitted!',
            description: 'We will review your application and get back to you soon.',
          });
          return;
        }

        setSignupRequiresEmailVerification(true);
        setApplicationSubmitted(true);
        toast({
          title: 'Account created!',
          description: 'Please verify your email, then sign in and submit your reseller application.',
        });
        return;
      } catch (error: any) {
        toast({
          title: 'Registration failed',
          description: error.message || 'Could not create account',
          variant: 'destructive',
        });
        return;
      }
    }

    // If logged in, submit the application
    try {
      await applyAsReseller.mutateAsync({
        business_name: data.business_name,
        business_registration: data.business_registration,
        tax_id: data.tax_id,
        contact_person: data.contact_person,
        phone: data.phone,
        email: data.email,
        address: data.address,
      });

      setApplicationSubmitted(true);
      toast({
        title: 'Application submitted!',
        description: 'We will review your application and get back to you soon.',
      });
    } catch (error: any) {
      toast({
        title: 'Application failed',
        description: error.message || 'Could not submit application',
        variant: 'destructive',
      });
    }
  };

  // Already a reseller
  if (!resellerLoading && existingReseller) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Already Applied</h1>
          <p className="text-muted-foreground mb-6">
            You have already submitted a reseller application. 
            {existingReseller.status === 'pending' && ' Your application is under review.'}
            {existingReseller.status === 'approved' && ' Your application has been approved!'}
            {existingReseller.status === 'rejected' && ' Unfortunately, your application was not approved.'}
          </p>
          <Button asChild>
            <Link to="/reseller/login">Go to Reseller Portal</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  // Application submitted success
  if (applicationSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {signupRequiresEmailVerification ? 'Account Created!' : 'Application Submitted!'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {signupRequiresEmailVerification
              ? 'Please check your email and verify your account. After verifying, sign in and submit your reseller application.'
              : 'Thank you for applying. We will review your application and notify you via email once approved.'}
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link to="/reseller/login">Go to Reseller Login</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Return to Store</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const isLoading = signUp.isPending || applyAsReseller.isPending;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
              <span className="text-lg font-bold text-primary-foreground">S</span>
            </div>
            <span className="text-xl font-bold">
              SellMate<span className="text-primary">360</span>
            </span>
          </Link>
          <Button variant="ghost" asChild>
            <Link to="/reseller/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Become a Reseller</h1>
            <p className="text-muted-foreground">
              Join our reseller network and start earning profits on every sale
            </p>
          </div>

          {/* Benefits */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-bold text-primary">15%</span>
                </div>
                <p className="font-medium">Profit Margin</p>
                <p className="text-sm text-muted-foreground">On every sale</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-bold text-primary">COD</span>
                </div>
                <p className="font-medium">COD Support</p>
                <p className="text-sm text-muted-foreground">Cash on delivery</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-bold text-primary">24h</span>
                </div>
                <p className="font-medium">Fast Payouts</p>
                <p className="text-sm text-muted-foreground">Quick withdrawals</p>
              </CardContent>
            </Card>
          </div>

          {/* Application Form */}
          <Card>
            <CardHeader>
              <CardTitle>Reseller Application</CardTitle>
              <CardDescription>
                Fill in your business details to apply as a reseller
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Business Details */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Business Information
                  </h3>
                  
                  <div>
                    <Label htmlFor="business_name">Business Name *</Label>
                    <div className="relative mt-1">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="business_name"
                        name="business_name"
                        placeholder="Your Business Name"
                        className="pl-10"
                        required
                      />
                    </div>
                    {errors.business_name && (
                      <p className="text-sm text-destructive mt-1">{errors.business_name}</p>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="business_registration">Business Registration No.</Label>
                      <div className="relative mt-1">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="business_registration"
                          name="business_registration"
                          placeholder="Optional"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="tax_id">Tax ID / VAT No.</Label>
                      <div className="relative mt-1">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="tax_id"
                          name="tax_id"
                          placeholder="Optional"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Details */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Contact Information
                  </h3>

                  <div>
                    <Label htmlFor="contact_person">Contact Person *</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="contact_person"
                        name="contact_person"
                        placeholder="Your Full Name"
                        className="pl-10"
                        required
                      />
                    </div>
                    {errors.contact_person && (
                      <p className="text-sm text-destructive mt-1">{errors.contact_person}</p>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="0771234567"
                          className="pl-10"
                          required
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-sm text-destructive mt-1">{errors.phone}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="you@example.com"
                          className="pl-10"
                          defaultValue={session?.user?.email || ''}
                          required
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-destructive mt-1">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Business Address *</Label>
                    <div className="relative mt-1">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        id="address"
                        name="address"
                        placeholder="Enter your full business address"
                        className="pl-10 min-h-[80px]"
                        required
                      />
                    </div>
                    {errors.address && (
                      <p className="text-sm text-destructive mt-1">{errors.address}</p>
                    )}
                  </div>
                </div>

                {/* Password field if not logged in */}
                {!session && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Create Account
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      We'll create an account for you using the email address above.
                    </p>
                    <div>
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Choose a strong password"
                        required
                      />
                      {errors.password && (
                        <p className="text-sm text-destructive mt-1">{errors.password}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Terms */}
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
                    , and confirm that all information provided is accurate.
                  </label>
                </div>
                {errors.terms && (
                  <p className="text-sm text-destructive">{errors.terms}</p>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? 'Submitting...' : 'Submit Application'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Already have an account */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already a reseller?{' '}
              <Link to="/reseller/login" className="text-primary hover:underline">
                Sign in to your account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
