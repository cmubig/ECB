'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function UserProfile() {
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      toast.success('Successfully signed out!');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
          <AvatarFallback>
            {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="hidden sm:block">
          <p className="text-sm font-medium">{user.displayName || 'Anonymous'}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleLogout}
        disabled={loading}
      >
        {loading ? 'Signing out...' : 'Sign out'}
      </Button>
    </div>
  );
}
