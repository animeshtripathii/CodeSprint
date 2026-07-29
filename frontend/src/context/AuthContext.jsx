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

  // Syncs authenticated Clerk user profile with backend database
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
          .catch((err) => {
            const status = err?.response?.status;
            // Signs out user if account is deleted or unauthorized
            if (status === 403 || status === 401) {
              clerk.signOut().catch(() => {});
              localStorage.removeItem('hf_token');
              localStorage.removeItem('hf_user');
              setLocalUser(null);
              return;
            }
            // Fallback user state when network connection fails
            const fallbackUser = {
              _id: clerkUser.id,
              name,
              email,
              role: 'participant',
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

  // ── Active user computation ──────────────────────────────────────────────
  // For Clerk users (Google/GitHub), the UI role MUST come from MongoDB (localUser),
  // NOT from Clerk's publicMetadata. localUser is populated by the clerk-sync API call
  // above, so it always reflects the real role stored in the database.
  const activeUser = clerkUser
    ? {
        // Prefer MongoDB _id over Clerk id so backend JWT lookups work correctly
        _id: localUser?._id || clerkUser.id,
        name: clerkUser.fullName || clerkUser.firstName || localUser?.name || 'Developer',
        email: clerkUser.primaryEmailAddress?.emailAddress || localUser?.email || '',
        // ✅ KEY FIX: use MongoDB role from localUser, fall back to Clerk metadata only
        //    if the clerk-sync call hasn't completed yet.
        role: localUser?.role || clerkUser.publicMetadata?.role || 'participant',
        avatar: clerkUser.imageUrl || localUser?.avatar || '',
        isClerk: true,
        githubConnected: isGithubUser,
        githubUsername: githubHandle,
        authProvider: isGithubUser ? 'github' : 'google',
      }
    : (clerkLoaded && !clerkUser && localUser?.isClerk ? null : localUser);

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
      if (clerkUser) {
        // For Clerk users (Google/GitHub), re-sync with backend to get latest DB role
        const email = clerkUser.primaryEmailAddress?.emailAddress || '';
        const name = clerkUser.fullName || clerkUser.firstName || 'Developer';
        const avatar = clerkUser.imageUrl || '';
        const res = await api.post('/auth/clerk-sync', { clerkId: clerkUser.id, name, email, avatar });
        const { user: backendUser, token } = res.data.data;
        if (token) localStorage.setItem('hf_token', token);
        localStorage.setItem('hf_user', JSON.stringify(backendUser));
        setLocalUser(backendUser);
      } else {
        // For local email/password users, fetch via JWT
        const { data } = await api.get('/auth/me');
        const u = data.data;
        localStorage.setItem('hf_user', JSON.stringify(u));
        setLocalUser(u);
      }
    } catch {}
  }, [clerkUser]);

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
