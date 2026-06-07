import { useState, useEffect, useMemo } from 'react';
import type { MatchStats } from './matchDesign';
import { baseStats } from './matchDesign';

interface MatchEvent {
  minute: number;
  type: 'goal' | 'card' | 'shot';
  team: 'home' | 'away';
}

interface LivePayload {
  id: string;
  source: 'live' | 'simulated';
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED';
  playSeconds: number;
  final: { homeGoals: number; awayGoals: number; possession: number; cards: number; shots: number; xg: number };
  events: MatchEvent[];
}

/**
 * Subscribes to /api/match-live, then replays the event timeline on a clock so
 * the crest morphs minute by minute and freezes at full-time. Returns the
 * current derived stats + the playhead, and a replay() to watch it again.
 */
export function useMatchLive(matchId: string) {
  const [payload, setPayload] = useState<LivePayload | null>(null);
  const [minute, setMinute] = useState(0);
  const [frozen, setFrozen] = useState(false);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    let alive = true;
    fetch(`/api/match-live?id=${encodeURIComponent(matchId)}`)
      .then((r) => r.json())
      .then((p: LivePayload) => { if (alive) setPayload(p); })
      .catch(() => { /* leave payload null → base crest */ });
    return () => { alive = false; };
  }, [matchId]);

  // Drive the playhead from 0' to 90', then freeze.
  useEffect(() => {
    if (!payload) return;
    setMinute(0);
    setFrozen(false);
    const total = Math.max(1, payload.playSeconds) * 1000;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / total);
      setMinute(Math.round(p * 90));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setMinute(90);
        setFrozen(true);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [payload, runId]);

  const stats: MatchStats = useMemo(() => {
    if (!payload) return baseStats();
    const upTo = payload.events.filter((e) => e.minute <= minute);
    const homeGoals = upTo.filter((e) => e.type === 'goal' && e.team === 'home').length;
    const awayGoals = upTo.filter((e) => e.type === 'goal' && e.team === 'away').length;
    const cards = upTo.filter((e) => e.type === 'card').length;
    const progress = minute / 90;
    return {
      homeGoals,
      awayGoals,
      cards,
      possession: payload.final.possession,
      shots: Math.round(payload.final.shots * progress),
      xg: Math.round(payload.final.xg * progress * 10) / 10,
      minute,
      status: frozen ? 'FINISHED' : minute === 0 ? 'SCHEDULED' : 'LIVE',
    };
  }, [payload, minute, frozen]);

  return {
    stats,
    frozen,
    source: payload?.source ?? null,
    replay: () => setRunId((n) => n + 1),
  };
}
