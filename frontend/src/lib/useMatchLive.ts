import { useState, useEffect, useMemo, useRef } from 'react';
import type { MatchStats } from './matchDesign';
import { baseStats } from './matchDesign';

interface MatchEvent {
  minute: number;
  type: 'goal' | 'card' | 'shot';
  team: 'home' | 'away';
}

export interface TeamStatLine {
  goals: number;
  shots: number;
  shotsOnTarget: number;
  possession: number;
  passes: number;
  passAccuracy: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  offsides: number;
  corners: number;
}

interface LivePayload {
  id: string;
  source: 'live' | 'simulated';
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED';
  playSeconds: number;
  liveMinute?: number;
  final: { homeGoals: number; awayGoals: number; possession: number; cards: number; shots: number; xg: number };
  teamStats?: { home: TeamStatLine; away: TeamStatLine };
  events: MatchEvent[];
}

/** Interpolate a final stat line to the playhead: counts accumulate with the
 *  clock (goals follow the actual event timeline), rates settle in early. */
function lineAt(final: TeamStatLine, goals: number, progress: number): TeamStatLine {
  const grow = (v: number) => Math.round(v * progress);
  const settle = (v: number) => Math.round(v * Math.min(1, 0.6 + progress * 0.4));
  return {
    goals,
    shots: Math.max(goals, grow(final.shots)),
    shotsOnTarget: Math.max(goals, grow(final.shotsOnTarget)),
    possession: settle(final.possession),
    passes: grow(final.passes),
    passAccuracy: settle(final.passAccuracy),
    fouls: grow(final.fouls),
    yellowCards: grow(final.yellowCards),
    redCards: progress > 0.7 ? final.redCards : 0,
    offsides: grow(final.offsides),
    corners: grow(final.corners),
  };
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

  // Fetch the feed; while the game is LIVE, poll every 60s so the page
  // tracks the real match as it happens.
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = () => {
      fetch(`/api/match-live?id=${encodeURIComponent(matchId)}`)
        .then((r) => r.json())
        .then((p: LivePayload) => {
          if (!alive) return;
          setPayload(p);
          if (p.status === 'LIVE') timer = setTimeout(load, 60_000);
        })
        .catch(() => { /* leave payload null → base crest */ });
    };
    load();
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, [matchId]);

  // Drive the playhead. Finished games replay 0'→90' and freeze; live games
  // catch up to the real minute fast and hold there until the next poll.
  const heldMinute = useRef(0);
  useEffect(() => {
    if (!payload) return;
    const isLive = payload.status === 'LIVE';
    // a match that already happened shows its final numbers immediately —
    // the replay only runs when explicitly requested via replay()
    if (payload.status === 'FINISHED' && runId === 0) {
      setMinute(90);
      heldMinute.current = 90;
      setFrozen(true);
      return;
    }
    // a future match holds at 0' with empty lines
    if (payload.status === 'SCHEDULED') {
      setMinute(0);
      heldMinute.current = 0;
      setFrozen(false);
      return;
    }
    const target = isLive ? Math.max(1, Math.min(90, payload.liveMinute ?? 1)) : 90;
    const from = isLive ? Math.min(heldMinute.current, target) : 0;
    setMinute(from);
    setFrozen(false);
    const total = Math.max(1, payload.playSeconds) * 1000;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / total);
      const m = Math.round(from + p * (target - from));
      setMinute(m);
      heldMinute.current = m;
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setMinute(target);
        heldMinute.current = target;
        if (!isLive) setFrozen(true);
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

  // The full 11-attribute lines, advanced to the playhead.
  const teams = useMemo(() => {
    if (!payload?.teamStats) return null;
    const progress = minute / 90;
    return {
      home: lineAt(payload.teamStats.home, stats.homeGoals, progress),
      away: lineAt(payload.teamStats.away, stats.awayGoals, progress),
    };
  }, [payload, minute, stats.homeGoals, stats.awayGoals]);

  return {
    stats,
    teams,
    minute,
    frozen,
    source: payload?.source ?? null,
    replay: () => setRunId((n) => n + 1),
  };
}
