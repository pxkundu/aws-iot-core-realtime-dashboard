import { useState, useEffect } from 'react';

interface User {
  userId: string;
  email: string;
  name?: string;
}

export const useSimpleAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For now, we'll use a simple localStorage approach
    // In production, you'd integrate with Amplify Auth
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Simplified sign in - in production, use Amplify Auth
    const mockUser: User = {
      userId: `user-${Date.now()}`,
      email,
      name: email.split('@')[0]
    };
    
    setUser(mockUser);
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    return mockUser;
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const signUp = async (email: string, password: string, name: string) => {
    // Simplified sign up - in production, use Amplify Auth
    const mockUser: User = {
      userId: `user-${Date.now()}`,
      email,
      name
    };
    
    setUser(mockUser);
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    return mockUser;
  };

  return {
    user,
    loading,
    signIn,
    signOut,
    signUp
  };
}; 