import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const clerk = useClerk();

  const [localUser, setLocalUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hf_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  // Synchronize Clerk user with backend API & save JWT token
  useEffect(() => {
    if (clerkLoaded) {
      if (clerkUser) {
        const email = clerkUser.primaryEmailAddress?.emailAddress || '';
        const name = clerkUser.fullName || clerkUser.firstName || 'Developer';
        const avatar = clerkUser.imageUrl || '';

        api.post('/auth/clerk-sync', { clerkId: clerkUser.id, name, email, avatar })
          .then(res => {
            const { user: backendUser, token } = res.data.data;
            if (token) localStorage.setItem('hf_token', token);
            localStorage.setItem('hf_user', JSON.stringify(backendUser));
            setLocalUser(backendUser);
          })
          .catch(() => {
            const fallbackUser = {
              _id: clerkUser.id,
              name,
              email,
              role: clerkUser.publicMetadata?.role || 'participant',
              avatar,
              isClerk: true,
            };
            localStorage.setItem('hf_user', JSON.stringify(fallbackUser));
            setLocalUser(fallbackUser);
          });
      } else if (localUser?.isClerk) {
        localStorage.removeItem('hf_user');
        localStorage.removeItem('hf_token');
        setLocalUser(null);
      }
    }
  }, [clerkUser, clerkLoaded]);

  // Helper to check GitHub connection
  const githubAccount = clerkUser?.externalAccounts?.find(acc => acc.provider?.includes('github'));
  const isGithubUser = Boolean(githubAccount) || clerkUser?.externalAccounts?.some(a => a.provider?.includes('github')) || false;
  const githubHandle = githubAccount?.username || (isGithubUser ? clerkUser?.firstName?.toLowerCase() || 'developer' : '');

  const activeUser = clerkUser ? {
    _id: clerkUser.id,
    name: clerkUser.fullName || clerkUser.firstName || 'Developer',
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    role: clerkUser.publicMetadata?.role || 'participant',
    avatar: clerkUser.imageUrl,
    isClerk: true,
    githubConnected: isGithubUser,
    githubUsername: githubHandle,
    authProvider: isGithubUser ? 'github' : 'google',
  } : (clerkLoaded && !clerkUser && localUser?.isClerk ? null : localUser);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { user: u, token } = data.data;
      localStorage.setItem('hf_token', token);
      localStorage.setItem('hf_user', JSON.stringify(u));
      setLocalUser(u);
      return u;
    } finally { setLoading(false); }
  }, []);

  const register = useCallback(async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', payload);
      const { user: u, token } = data.data;
      localStorage.setItem('hf_token', token);
      localStorage.setItem('hf_user', JSON.stringify(u));
      setLocalUser(u);
      return u;
    } finally { setLoading(false); }
  }, []);

  const logout = useCallback(async () => {
    if (clerkUser) {
      await clerk.signOut().catch(() => {});
    }
    await api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('hf_token');
    localStorage.removeItem('hf_user');
    setLocalUser(null);
  }, [clerkUser, clerk]);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      const u = data.data;
      localStorage.setItem('hf_user', JSON.stringify(u));
      setLocalUser(u);
    } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{
      user: activeUser,
      loading,
      initializing: !clerkLoaded,
      login,
      register,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
