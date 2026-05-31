import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from './use_auth';
import type { ScoreResult } from './use_scoring';
import { getSupabaseClient } from '../services/supabase';
import type { MoodEntry } from '../types/mood_history';
import { getTimeContext } from '../utils/time_context';

const MOOD_HISTORY_STORAGE_KEY = '@solen_mood_history_v1';

type MoodEntryRow = {
  gad7: number | null;
  high_items: string[] | null;
  id: string;
  phq9: number | null;
  time_period: MoodEntry['timePeriod'];
  timestamp: string;
  user_id: string;
  who5_pct: number;
};

export function useMoodHistory() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const sortedEntries = useMemo(() => sortEntries(entries), [entries]);

  useEffect(() => {
    let active = true;

    loadLocalEntries(user?.id)
      .then((localEntries) => {
        if (!active) {
          return;
        }

        setEntries(localEntries);
      })
      .finally(() => {
        if (active) {
          setIsLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    saveLocalEntries(entries, user?.id).catch(() => undefined);
  }, [entries, isLoaded, user?.id]);

  const syncToSupabase = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    const client = getSupabaseClient();
    const localEntries = await loadLocalEntries(user.id);
    const { data: remoteRows, error: readError } = await client
      .from('mood_entries')
      .select('id, user_id, timestamp, who5_pct, phq9, gad7, high_items, time_period')
      .eq('user_id', user.id);

    if (readError) {
      throw new Error(`Không đồng bộ được lịch sử: ${readError.message}`);
    }

    const remoteEntries = (remoteRows ?? []).map(mapMoodEntryRow);
    const mergedEntries = mergeEntries(remoteEntries, localEntries);
    const unsyncedEntries = mergedEntries.filter((entry) => !entry.syncedAt);

    if (unsyncedEntries.length > 0) {
      const syncedAt = new Date().toISOString();
      const { error: upsertError } = await client.from('mood_entries').upsert(
        unsyncedEntries.map((entry) => ({
          gad7: entry.gad7,
          high_items: entry.highItems,
          id: entry.id,
          phq9: entry.phq9,
          time_period: entry.timePeriod,
          timestamp: entry.timestamp,
          user_id: user.id,
          who5_pct: Math.round(entry.who5_pct),
        })),
        { onConflict: 'user_id,timestamp' },
      );

      if (upsertError) {
        throw new Error(`Không lưu được lịch sử: ${upsertError.message}`);
      }

      const syncedEntries = mergedEntries.map((entry) =>
        unsyncedEntries.some((unsyncedEntry) => unsyncedEntry.id === entry.id)
          ? { ...entry, syncedAt }
          : entry,
      );

      setEntries(sortEntries(syncedEntries));
      await saveLocalEntries(syncedEntries, user.id);
      return;
    }

    setEntries(sortEntries(mergedEntries));
    await saveLocalEntries(mergedEntries, user.id);
  }, [user?.id]);

  useEffect(() => {
    if (!isLoaded || !user?.id) {
      return;
    }

    syncToSupabase().catch(() => undefined);
  }, [isLoaded, syncToSupabase, user?.id]);

  const addEntry = useCallback(
    async (scores: ScoreResult) => {
      const timeContext = getTimeContext();
      const nextEntry: MoodEntry = {
        gad7: scores.needsDeepScreen ? scores.gad7 : null,
        highItems: scores.highItems,
        id: createMoodEntryId(),
        phq9: scores.needsDeepScreen ? scores.phq9 : null,
        syncedAt: null,
        timePeriod: timeContext.period,
        timestamp: new Date().toISOString(),
        who5_pct: scores.who5_pct,
      };

      const nextEntries = sortEntries([nextEntry, ...entries]);
      setEntries(nextEntries);
      await saveLocalEntries(nextEntries, user?.id);

      if (user?.id) {
        syncToSupabase().catch(() => undefined);
      }
    },
    [entries, syncToSupabase, user?.id],
  );

  const clearAll = useCallback(async () => {
    setEntries([]);
    await AsyncStorage.multiRemove([
      getStorageKey(user?.id),
      MOOD_HISTORY_STORAGE_KEY,
    ]);

    if (!user?.id) {
      return;
    }

    const client = getSupabaseClient();
    const { error } = await client.from('mood_entries').delete().eq('user_id', user.id);

    if (error) {
      throw new Error(`Không xoá được lịch sử: ${error.message}`);
    }
  }, [user?.id]);

  return {
    addEntry,
    clearAll,
    entries: sortedEntries,
    syncToSupabase,
  };
}

async function loadLocalEntries(userId?: string) {
  const value =
    (await AsyncStorage.getItem(getStorageKey(userId))) ??
    (userId ? await AsyncStorage.getItem(MOOD_HISTORY_STORAGE_KEY) : null);

  if (!value) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(value);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return sortEntries(parsedValue.filter(isMoodEntry));
  } catch {
    return [];
  }
}

async function saveLocalEntries(entries: MoodEntry[], userId?: string) {
  await AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(sortEntries(entries)));
}

function getStorageKey(userId?: string) {
  return userId ? `${MOOD_HISTORY_STORAGE_KEY}:${userId}` : MOOD_HISTORY_STORAGE_KEY;
}

function mapMoodEntryRow(row: MoodEntryRow): MoodEntry {
  return {
    gad7: row.gad7,
    highItems: row.high_items ?? [],
    id: row.id,
    phq9: row.phq9,
    syncedAt: new Date().toISOString(),
    timePeriod: row.time_period,
    timestamp: row.timestamp,
    who5_pct: row.who5_pct,
  };
}

function mergeEntries(remoteEntries: MoodEntry[], localEntries: MoodEntry[]) {
  const byTimestamp = new Map<string, MoodEntry>();

  for (const entry of remoteEntries) {
    byTimestamp.set(entry.timestamp, entry);
  }

  for (const entry of localEntries) {
    byTimestamp.set(entry.timestamp, entry);
  }

  return sortEntries([...byTimestamp.values()]);
}

function sortEntries(entries: MoodEntry[]) {
  return [...entries].sort(
    (first, second) =>
      new Date(second.timestamp).getTime() - new Date(first.timestamp).getTime(),
  );
}

function createMoodEntryId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `mood-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isMoodEntry(value: unknown): value is MoodEntry {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const entry = value as MoodEntry;

  return (
    typeof entry.id === 'string' &&
    typeof entry.timestamp === 'string' &&
    typeof entry.who5_pct === 'number' &&
    Array.isArray(entry.highItems) &&
    typeof entry.timePeriod === 'string' &&
    ('syncedAt' in entry ? entry.syncedAt === null || typeof entry.syncedAt === 'string' : true)
  );
}
