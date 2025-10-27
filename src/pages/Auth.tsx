import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquare, Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Sign In states
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInShowPassword, setSignInShowPassword] = useState(false);

  // Sign Up states
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpShowPassword, setSignUpShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/chat');
    }
  }, [user, navigate]);

  const resetAllFields = useCallback(() => {
    setSignInEmail('');
    setSignInPassword('');
    setSignInShowPassword(false);

    setSignUpName('');
    setSignUpEmail('');
    setSignUpPassword('');
    setSignUpShowPassword(false);
  }, []);

  const handleTabChange = (value: 'signin' | 'signup') => {
    setActiveTab(value);
    resetAllFields();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signInEmail || !signInPassword) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { error } = await signIn(signInEmail, signInPassword);
    setLoading(false);

    if (error) {
      toast({
        title: 'Sign In Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Spaces allowed, but NOT counted
    const cleanedPassword = signUpPassword.replace(/\s/g, '');

    if (!signUpEmail || !cleanedPassword) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (cleanedPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters (spaces are not counted)',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { error } = await signUp(signUpEmail, signUpPassword, signUpName); // original password sent
    setLoading(false);

    if (error) {
      toast({
        title: 'Sign Up Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success!',
        description: 'Account created successfully. You can now sign in.',
      });
      resetAllFields();
      setActiveTab('signin');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-950 to-zinc-800 p-4">
      <Card className="w-full max-w-md bg-gradient-to-b from-zinc-800 to-zinc-950">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 inline-flex rounded-lg bg-gradient-to-b from-zinc-900 to-zinc-800 p-3">
            <MessageSquare className="h-8 w-8 text-gray-300" />
          </div>
          <CardTitle className="text-2xl">Welcome to AI Chat</CardTitle>
          <CardDescription>Sign in or create an account to get started</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as 'signin' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* Sign In */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                    className="bg-zinc-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={signInShowPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      required
                      className="bg-zinc-800 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setSignInShowPassword((s) => !s)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200"
                    >
                      {signInShowPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-gradient-to-b from-zinc-700 to-zinc-800" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            {/* Sign Up */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Name (optional)</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Your Name"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    className="bg-zinc-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                    className="bg-zinc-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={signUpShowPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)} // spaces allowed
                      required
                      className="bg-zinc-800 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setSignUpShowPassword((s) => !s)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200"
                    >
                      {signUpShowPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 6 characters (spaces are not counted)
                  </p>
                </div>

                <Button type="submit" className="w-full bg-gradient-to-b from-zinc-700 to-zinc-800" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
