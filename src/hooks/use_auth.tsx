import type { Session, User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';

import { getSupabaseClient, isSupabaseConfigured, supabase } from '../services/supabase';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_AUTH_REDIRECT_URL = 'mentalhealth://auth/callback';

function parseAuthParams(url: string) {
  const params: Record<string, string> = {};
  
  // Clean trailing hash or slashes first
  const cleanUrl = url.replace(/[#/]+$/, '');
  
  // Parse query parameters (?key=value)
  const queryStartIndex = cleanUrl.indexOf('?');
  if (queryStartIndex !== -1) {
    const queryString = cleanUrl.slice(queryStartIndex + 1).split('#')[0];
    const pairs = queryString.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    }
  }
  
  // Parse hash parameters (#key=value)
  const hashStartIndex = cleanUrl.indexOf('#');
  if (hashStartIndex !== -1) {
    const hashString = cleanUrl.slice(hashStartIndex + 1);
    const pairs = hashString.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    }
  }
  
  return params;
}

type AuthContextValue = {
  error: string | null;
  isConfigured: boolean;
  isLoading: boolean;
  session: Session | null;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      return;
    }

    let active = true;

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!active) {
          return;
        }

        if (sessionError) {
          setError(sessionError.message);
          return;
        }

        setSession(data.session);
      })
      .catch(() => {
        setError('Không đọc được phiên đăng nhập.');
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithApple = useCallback(async () => {
    setError(null);

    if (Platform.OS !== 'ios') {
      setError('Đăng nhập Apple chỉ khả dụng trên iOS.');
      return;
    }

    setIsLoading(true);

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('Apple không trả về identity token.');
      }

      const { error: signInError } = await getSupabaseClient().auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (signInError) {
        throw signInError;
      }
    } catch (signInError) {
      const code =
        signInError && typeof signInError === 'object' && 'code' in signInError
          ? String(signInError.code)
          : '';

      if (code !== 'ERR_REQUEST_CANCELED') {
        setError(signInError instanceof Error ? signInError.message : 'Không đăng nhập được bằng Apple.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const client = getSupabaseClient();
      const { data, error: oauthError } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: GOOGLE_AUTH_REDIRECT_URL,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (oauthError) {
        throw oauthError;
      }

      if (!data.url) {
        throw new Error('Supabase không trả về URL đăng nhập Google.');
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, GOOGLE_AUTH_REDIRECT_URL);

      if (result.type === 'success') {
        const params = parseAuthParams(result.url);

        if (params.error) {
          throw new Error(params.error_description || params.error);
        }

        if (params.access_token) {
          // Implicit flow: establish session directly
          const { error: sessionError } = await client.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token || '',
          });

          if (sessionError) {
            throw sessionError;
          }
        } else if (params.code) {
          // PKCE flow: exchange code string directly (NOT the full URL)
          const { error: exchangeError } = await client.auth.exchangeCodeForSession(params.code);

          if (exchangeError) {
            throw exchangeError;
          }
        } else {
          throw new Error('Không tìm thấy thông tin đăng nhập Google trong phản hồi.');
        }
      }
    } catch (signInError) {
      const code =
        signInError && typeof signInError === 'object' && 'code' in signInError
          ? String(signInError.code)
          : '';

      if (code !== 'SIGN_IN_CANCELLED' && code !== 'ERR_WEB_BROWSER_CRYPTO') {
        setError(signInError instanceof Error ? signInError.message : 'Không đăng nhập được bằng Google.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const { error: signOutError } = await getSupabaseClient().auth.signOut();

      if (signOutError) {
        throw signOutError;
      }
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : 'Không đăng xuất được.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      error,
      isConfigured: isSupabaseConfigured,
      isLoading,
      session,
      signInWithApple,
      signInWithGoogle,
      signOut,
      user: session?.user ?? null,
    }),
    [error, isLoading, session, signInWithApple, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
