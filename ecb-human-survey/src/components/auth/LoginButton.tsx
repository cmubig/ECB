'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function LoginButton() {
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle } = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Successfully signed in!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleLogin} 
      disabled={loading}
      size="lg"
      className="w-full max-w-sm"
    >
      {loading ? 'Signing in...' : 'Sign in with Google'}
    </Button>
  );
}
