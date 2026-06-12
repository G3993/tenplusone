import { useEffect, useState } from 'react';

export interface ResultRow {
  home: string;
  away: string;
  homeGoals: number;
  awayGoals: number;
  state: 'pre' | 'in' | 'post';
}

// One fetch for the whole session (refreshes on a 60s timer while mounted
// anywhere). All match cards share it.
let cache: ResultRow[] | null = null;
let inflight: Promise<ResultRow[]> | null = null;
const listeners = new Set<(r: ResultRow[]) => void>();

function load(): Promise<ResultRow[]> {
  if (!inflight) {
    inflight = fetch('/api/results')
      .then((r) => r.json())
      .then((d: { results: ResultRow[] }) => {
        cache = d.results || [];
        listeners.forEach((fn) => fn(cache!));
        return cache;
      })
      .catch(() => cache ?? [])
      .finally(() => { setTimeout(() => { inflight = null; }, 60_000); });
  }
  return inflight;
}

const ALIASES: Record<string, string> = {
  unitedstates: 'usa',
  capeverde: 'caboverde',
  bosniaandherzegovina: 'bosnia',
  turkey: 'turkiye',
  democraticrepublicofthecongo: 'drcongo',
  curaao: 'curacao',
};
function norm(name: string): string {
  const n = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '');
  return ALIASES[n] ?? n;
}
export function sameTeam(a: string, b: string): boolean {
  const x = norm(a), y = norm(b);
  return x === y || x.includes(y) || y.includes(x);
}

/** The real result for a fixture (by team names), or null if not played. */
export function useMatchResult(home: string, away: string): ResultRow | null {
  const [rows, setRows] = useState<ResultRow[]>(cache ?? []);
  useEffect(() => {
    const fn = (r: ResultRow[]) => setRows(r);
    listeners.add(fn);
    load().then(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return (
    rows.find(
      (r) =>
        (sameTeam(r.home, home) && sameTeam(r.away, away)) ||
        (sameTeam(r.home, away) && sameTeam(r.away, home)),
    ) ?? null
  );
}
