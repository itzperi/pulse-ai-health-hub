import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/pulse-ai-logo.png';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    name: '',
    mobile: ''
  });
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      toast({ title: 'Login successful!' });
      // Navigation will be handled by App.tsx based on role
      navigate('/');
    } else {
      toast({
        title: 'Login failed',
        description: 'Invalid username or password',
        variant: 'destructive'
      });
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (signup(signupData.email, signupData.password, signupData.name, signupData.mobile)) {
      toast({ title: 'Signup successful! Welcome to Pulse AI' });
      navigate('/');
    } else {
      toast({
        title: 'Signup failed',
        description: 'Email already registered',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-light via-background to-medical-light p-4">
      <Card className="w-full max-w-md p-8 shadow-[var(--shadow-medical)] border-2">
        <div className="flex justify-center mb-8">
          <img src={logo} alt="Pulse AI Logo" className="h-20" />
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Patient Signup</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username / Email</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter your username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
              <div className="text-sm text-muted-foreground mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-2">Demo Credentials:</p>
                <p>Admin: admin / 1234@</p>
                <p>Doctor: doctor / 1234@</p>
                <p>Pharmacy: pharma / 1234@</p>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={signupData.name}
                  onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                  required
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  required
                  placeholder="Enter your email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={signupData.mobile}
                  onChange={(e) => setSignupData({ ...signupData, mobile: e.target.value })}
                  required
                  placeholder="Enter your mobile number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  required
                  placeholder="Create a password"
                />
              </div>
              <Button type="submit" className="w-full">
                Sign Up
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
