import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle auth events with appropriate feedback
        if (event === 'SIGNED_IN' && session?.user) {
          toast({
            title: "Welcome back!",
            description: `Signed in as ${session.user.email}`,
          });
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Signed out",
            description: "You have been signed out successfully.",
          });
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error.message);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // DoD Password Validation Helper
  const validateDoDPassword = (password: string, email: string, firstName?: string, lastName?: string) => {
    // Check for personal information
    const lowerPassword = password.toLowerCase();
    const emailName = email.split('@')[0].toLowerCase();
    let hasPersonalInfo = false;
    
    if (firstName && firstName.length > 2 && lowerPassword.includes(firstName.toLowerCase())) {
      hasPersonalInfo = true;
    }
    if (lastName && lastName.length > 2 && lowerPassword.includes(lastName.toLowerCase())) {
      hasPersonalInfo = true;
    }
    if (emailName.length > 2 && lowerPassword.includes(emailName)) {
      hasPersonalInfo = true;
    }

    const checks = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>~`\-_=+\[\]\\;'/]/.test(password),
      noSequential: !/(.)\1{2,}/.test(password),
      noCommonPatterns: !/(123|abc|qwe|password|admin|welcome)/i.test(password),
      noPersonalInfo: !hasPersonalInfo
    };

    return checks;
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    try {
      // DoD Password Validation
      const passwordChecks = validateDoDPassword(password, email, firstName, lastName);
      
      if (!passwordChecks.length) {
        const error = new Error('Password must be at least 12 characters (DoD standard)');
        toast({
          title: "Password Error",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      if (!passwordChecks.uppercase || !passwordChecks.lowercase || !passwordChecks.number || !passwordChecks.special) {
        const error = new Error('Password must include uppercase, lowercase, number, and special character (DoD standard)');
        toast({
          title: "Password Error",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      if (!passwordChecks.noSequential) {
        const error = new Error('Password cannot contain repeated characters (DoD standard)');
        toast({
          title: "Password Error",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      if (!passwordChecks.noCommonPatterns) {
        const error = new Error('Password cannot contain common patterns or dictionary words (DoD standard)');
        toast({
          title: "Password Error",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      if (!passwordChecks.noPersonalInfo) {
        const error = new Error('Password cannot contain personal information (DoD standard)');
        toast({
          title: "Password Error",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      // Enhanced security: validate input before sending
      if (!email || !password || password.length < 12) {
        const error = new Error('Invalid input: Email and password (min 12 chars) are required');
        toast({
          title: "Sign Up Error",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      const { error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName?.trim(),
            last_name: lastName?.trim(),
          }
        }
      });

      if (error) {
        toast({
          title: "Sign Up Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Check your email",
          description: "We sent you a confirmation link to complete your registration.",
        });
      }

      return { error };
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Sign Up Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Enhanced security: validate input
      if (!email || !password) {
        const error = new Error('Email and password are required');
        return { error };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        // Don't show toast here as the form component handles specific errors
        console.error('Sign in error:', error.message);
      }

      return { error };
    } catch (err) {
      const error = err as Error;
      console.error('Unexpected sign in error:', error.message);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Sign Out Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Sign out error:', err);
      toast({
        title: "Sign Out Error",
        description: "An unexpected error occurred while signing out.",
        variant: "destructive"
      });
    }
  };

  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
