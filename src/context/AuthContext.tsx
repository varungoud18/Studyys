import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Session, User } from '@supabase/supabase-js';

export type UserRole = 'student' | 'moderator' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  bio?: string;
  college?: string;
  branch?: string;
  semester?: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isMock: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setMockRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock Users for testing
const MOCK_PROFILES: Record<UserRole, UserProfile> = {
  student: {
    id: 'mock-student-id',
    email: 'student@studyys.edu',
    full_name: 'Varun Sharma',
    role: 'student',
    bio: 'Computer Science & Engineering Student | ML Enthusiast',
    college: 'IIT Delhi',
    branch: 'Computer Science',
    semester: 6,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  },
  moderator: {
    id: 'mock-mod-id',
    email: 'moderator@studyys.edu',
    full_name: 'Dr. Anita Roy',
    role: 'moderator',
    bio: 'Senior Professor of CSE & Academic Moderator',
    college: 'BITS Pilani',
    branch: 'Information Systems',
    semester: 8,
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  },
  admin: {
    id: 'mock-admin-id',
    email: 'admin@studyys.edu',
    full_name: 'System Admin',
    role: 'admin',
    bio: 'Platform Administrator & System Integrator',
    college: 'Studyys Academic',
    branch: 'Platform Security',
    semester: 8,
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  // Check if environment variables are placeholders or empty
  const isSupabasePlaceholder = 
    !import.meta.env.VITE_SUPABASE_URL || 
    import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

  useEffect(() => {
    if (isSupabasePlaceholder) {
      // Mock Auth setup
      setIsMock(true);
      const storedProfile = localStorage.getItem('studyys_profile');
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile) as UserProfile;
        setProfile(parsed);
        setUser({ id: parsed.id, email: parsed.email } as User);
      }
      setLoading(false);
      return;
    }

    // Real Supabase Auth initialization
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error('Error fetching session:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth state updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isSupabasePlaceholder]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile, creating default student profile:', err);
      // Fallback fallback
      const defaultProfile: UserProfile = {
        id: userId,
        email: user?.email || '',
        full_name: 'Student User',
        role: 'student',
      };
      setProfile(defaultProfile);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    if (isMock) {
      // Find matches in MOCK_PROFILES or create dynamic mock
      let role: UserRole = 'student';
      if (email.includes('mod')) role = 'moderator';
      if (email.includes('admin')) role = 'admin';

      const mockProf = { ...MOCK_PROFILES[role], email };
      setProfile(mockProf);
      setUser({ id: mockProf.id, email: mockProf.email } as User);
      localStorage.setItem('studyys_profile', JSON.stringify(mockProf));
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      throw error;
    }
  };

  const signup = async (email: string, password: string, fullName: string, role: UserRole) => {
    setLoading(true);
    if (isMock) {
      const mockProf: UserProfile = {
        id: `mock-id-${Math.random().toString(36).substr(2, 9)}`,
        email,
        full_name: fullName,
        role,
        bio: `${role.charAt(0).toUpperCase() + role.slice(1)} Account`,
        college: 'Engineering College',
        semester: 1,
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      };
      setProfile(mockProf);
      setUser({ id: mockProf.id, email: mockProf.email } as User);
      localStorage.setItem('studyys_profile', JSON.stringify(mockProf));
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (error) {
      setLoading(false);
      throw error;
    }

    // In a normal flow, Supabase trigger inserts profile, but in case there is no trigger we can insert manually:
    if (data.user) {
      const newProfile: UserProfile = {
        id: data.user.id,
        email,
        full_name: fullName,
        role,
      };
      try {
        await supabase.from('profiles').upsert(newProfile);
      } catch (dbErr) {
        console.error('Failed to create profile directly, trigger might handle it:', dbErr);
      }
    }
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    if (isMock) {
      setUser(null);
      setProfile(null);
      localStorage.removeItem('studyys_profile');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      setLoading(false);
      throw error;
    }
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates };

    if (isMock) {
      setProfile(updated);
      localStorage.setItem('studyys_profile', JSON.stringify(updated));
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id);

    if (error) throw error;
    setProfile(updated);
  };

  // Helper for quick mock role switching in testing
  const setMockRole = (role: UserRole) => {
    if (!isMock) return;
    const mockProf = MOCK_PROFILES[role];
    setProfile(mockProf);
    setUser({ id: mockProf.id, email: mockProf.email } as User);
    localStorage.setItem('studyys_profile', JSON.stringify(mockProf));
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    if (isMock) {
      const mockProf = MOCK_PROFILES['student'];
      setProfile(mockProf);
      setUser({ id: mockProf.id, email: mockProf.email } as User);
      localStorage.setItem('studyys_profile', JSON.stringify(mockProf));
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard',
      },
    });

    if (error) {
      setLoading(false);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isMock,
        login,
        signup,
        signInWithGoogle,
        logout,
        updateProfile,
        setMockRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
