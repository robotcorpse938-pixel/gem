import { supabase } from './supabase';
import type { RunState } from '../types/game';

export async function saveRun(state: RunState): Promise<void> {
  try {
    await supabase
      .from('run_saves')
      .upsert(
        { session_id: state.sessionId, run_state: state, updated_at: new Date().toISOString() },
        { onConflict: 'session_id' }
      );
  } catch { /* non-blocking */ }
}

export async function loadRun(sessionId: string): Promise<RunState | null> {
  try {
    const { data } = await supabase
      .from('run_saves')
      .select('run_state')
      .eq('session_id', sessionId)
      .maybeSingle();
    return data?.run_state ?? null;
  } catch {
    return null;
  }
}

export async function deleteRun(sessionId: string): Promise<void> {
  try {
    await supabase.from('run_saves').delete().eq('session_id', sessionId);
  } catch { /* non-blocking */ }
}

export async function recordRunHistory(entry: {
  sessionId: string;
  outcome: string;
  stratumReached: number;
  soulDebt: number;
  stressAtEnd: number;
  durationSeconds: number;
  worldFlags: object;
}): Promise<void> {
  try {
    await supabase.from('run_history').insert({
      session_id: entry.sessionId,
      outcome: entry.outcome,
      stratum_reached: entry.stratumReached,
      soul_debt: entry.soulDebt,
      stress_at_end: entry.stressAtEnd,
      duration_seconds: entry.durationSeconds,
      world_flags: entry.worldFlags,
    });
  } catch { /* non-blocking */ }
}

export async function getRunHistory(): Promise<unknown[]> {
  try {
    const { data } = await supabase
      .from('run_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    return data ?? [];
  } catch {
    return [];
  }
}

export function getStoredSessionId(): string | null {
  return localStorage.getItem('sba_session_id');
}

export function storeSessionId(id: string): void {
  localStorage.setItem('sba_session_id', id);
}
