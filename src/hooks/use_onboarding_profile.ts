import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { getSupabaseClient } from '../services/supabase';
import type { OnboardingProfile } from '../types/onboarding';

const ONBOARDING_STORAGE_PREFIX = '@solen_onboarding_profile_v1';

type OnboardingProfileRow = {
  completed_at: string;
  goals: string[] | null;
  sleep_habit: string | null;
  triggers: string[] | null;
  updated_at: string;
  user_id: string;
};

export function useOnboardingProfile(userId?: string) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);

  useEffect(() => {
    let active = true;

    setIsLoaded(false);
    loadProfile(userId)
      .then((nextProfile) => {
        if (active) {
          setProfile(nextProfile);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const complete = useCallback(
    async (nextProfile: OnboardingProfile) => {
      setProfile(nextProfile);
      await AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(nextProfile));

      if (userId) {
        await upsertRemoteProfile(userId, nextProfile);
      }
    },
    [userId],
  );

  const skip = useCallback(async () => {
    const skippedProfile: OnboardingProfile = {
      completedAt: new Date().toISOString(),
      goals: [],
      sleepHabit: null,
      triggers: [],
    };

    setProfile(skippedProfile);
    await AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(skippedProfile));

    if (userId) {
      await upsertRemoteProfile(userId, skippedProfile);
    }
  }, [userId]);

  return {
    complete,
    isLoaded,
    profile,
    skip,
  };
}

async function loadProfile(userId?: string) {
  const localProfile = await loadLocalProfile(userId);

  if (!userId) {
    return localProfile;
  }

  try {
    const remoteProfile = await loadRemoteProfile(userId);

    if (remoteProfile) {
      await AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(remoteProfile));
      return remoteProfile;
    }

    if (localProfile) {
      await upsertRemoteProfile(userId, localProfile);
      return localProfile;
    }
  } catch {
    return localProfile;
  }

  return null;
}

async function loadLocalProfile(userId?: string) {
  const value = await AsyncStorage.getItem(getStorageKey(userId));

  if (!value) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(value);

    return isOnboardingProfile(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

async function loadRemoteProfile(userId: string) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('onboarding_profiles')
    .select('user_id, goals, triggers, sleep_habit, completed_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle<OnboardingProfileRow>();

  if (error) {
    throw new Error(`Không đọc được onboarding profile: ${error.message}`);
  }

  return data ? mapProfileRow(data) : null;
}

async function upsertRemoteProfile(userId: string, profile: OnboardingProfile) {
  const client = getSupabaseClient();
  const { error } = await client.from('onboarding_profiles').upsert(
    {
      completed_at: profile.completedAt,
      goals: profile.goals,
      sleep_habit: profile.sleepHabit,
      triggers: profile.triggers,
      updated_at: new Date().toISOString(),
      user_id: userId,
    },
    { onConflict: 'user_id' },
  );

  if (error) {
    throw new Error(`Không lưu được onboarding profile: ${error.message}`);
  }
}

function mapProfileRow(row: OnboardingProfileRow): OnboardingProfile {
  return {
    completedAt: row.completed_at,
    goals: (row.goals ?? []).filter((item) => typeof item === 'string') as OnboardingProfile['goals'],
    sleepHabit: row.sleep_habit as OnboardingProfile['sleepHabit'],
    triggers: (row.triggers ?? []).filter((item) => typeof item === 'string') as OnboardingProfile['triggers'],
  };
}

function getStorageKey(userId?: string) {
  return `${ONBOARDING_STORAGE_PREFIX}:${userId ?? 'guest'}`;
}

function isOnboardingProfile(value: unknown): value is OnboardingProfile {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const profile = value as OnboardingProfile;

  return (
    typeof profile.completedAt === 'string' &&
    Array.isArray(profile.goals) &&
    Array.isArray(profile.triggers) &&
    (profile.sleepHabit === null || typeof profile.sleepHabit === 'string')
  );
}
