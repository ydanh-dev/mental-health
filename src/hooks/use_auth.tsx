import type { Session, User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { NativeModules, Platform } from 'react-native';

import { getSupabaseClient, isSupabaseConfigured, supabase } from '../services/supabase';

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

  // Helper to safely load GoogleSignin without crashing in Expo Go
  const getGoogleSignin = useCallback(() => {
    // Check if the native module is registered in the native binary before importing
    const isNativeAvailable = NativeModules.RNGoogleSignin != null;
    
    if (!isNativeAvailable) {
      return null;
    }

    try {
      // Use dynamic require wrapped in try-catch to capture native registration failures in Expo Go
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      return GoogleSignin;
    } catch (error) {
      console.warn('Google Signin is not available in Expo Go:', error);
      return null;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
        throw new Error('Chưa cấu hình EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.');
      }

      const GoogleSignin = getGoogleSignin();
      if (!GoogleSignin) {
        throw new Error('Đăng nhập Google không khả dụng trên phiên bản Expo Go này. Vui lòng sử dụng Custom Dev Client.');
      }

      GoogleSignin.configure({
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();
      const idToken = result.data?.idToken;

      if (!idToken) {
        throw new Error('Google không trả về idToken.');
      }

      const { error: signInError } = await getSupabaseClient().auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (signInError) {
        throw signInError;
      }
    } catch (signInError) {
      const code =
        signInError && typeof signInError === 'object' && 'code' in signInError
          ? String(signInError.code)
          : '';

      if (code !== 'SIGN_IN_CANCELLED') {
        setError(signInError instanceof Error ? signInError.message : 'Không đăng nhập được bằng Google.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [getGoogleSignin]);

  const signOut = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const GoogleSignin = getGoogleSignin();
      if (GoogleSignin) {
        await GoogleSignin.signOut().catch(() => undefined);
      }
      const { error: signOutError } = await getSupabaseClient().auth.signOut();

      if (signOutError) {
        throw signOutError;
      }
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : 'Không đăng xuất được.');
    } finally {
      setIsLoading(false);
    }
  }, [getGoogleSignin]);

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
