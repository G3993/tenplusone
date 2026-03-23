import type { TeamData } from '../data/teams';

export interface MatchStats {
  homeScore: number;
  awayScore: number;
  possession: [number, number];
  shots: [number, number];
  shotsOnTarget: [number, number];
  corners: [number, number];
  fouls: [number, number];
  yellowCards: [number, number];
  redCards: [number, number];
}

export interface GenerativeConfig {
  gridScale: number;
  gridRotation: number;
  shapeMode: 'cube' | 'sphere';
  darkMode: boolean;
  fluidIntensity: number;
  fluidColor: [number, number, number];
  splatCount: number;
  logoBlend: number;
  transitionStyle: 'wave' | 'spiral' | 'random' | 'rows' | 'columns' | 'diagonal';
  matchTitle: string;
  score: string;
  date: string;
}

export function matchToGenerativeConfig(
  stats: MatchStats,
  homeTeam: TeamData,
  awayTeam: TeamData,
  matchDate?: string
): GenerativeConfig {
  const totalGoals = stats.homeScore + stats.awayScore;
  const goalDiff = Math.abs(stats.homeScore - stats.awayScore);

  // Grid scale: base 0.8, +0.05 per goal, clamped [0.3, 1.5]
  const gridScale = Math.min(1.5, Math.max(0.3, 0.8 + totalGoals * 0.05));

  // Grid rotation: possession ratio mapped to 360 degrees
  const gridRotation = (stats.possession[0] / 100) * 360;

  // Shape: high-scoring matches get sphere
  const shapeMode: 'cube' | 'sphere' = totalGoals > 4 ? 'sphere' : 'cube';

  // Dark mode: home team dominant (homeScore >= awayScore)
  const darkMode = stats.homeScore >= stats.awayScore;

  // Fluid intensity: 0.15 per goal, capped at 1.0
  const fluidIntensity = Math.min(totalGoals * 0.15, 1.0);

  // Fluid color: winning team's primary color (home if tied)
  const fluidColor: [number, number, number] =
    stats.homeScore >= stats.awayScore
      ? homeTeam.primaryColor
      : awayTeam.primaryColor;

  // Splat count: total shots
  const splatCount = stats.shots[0] + stats.shots[1];

  // Logo blend: home possession ratio
  const logoBlend = stats.possession[0] / 100;

  // Transition style based on goal difference
  let transitionStyle: GenerativeConfig['transitionStyle'];
  if (goalDiff === 0) {
    transitionStyle = 'wave';
  } else if (goalDiff === 1) {
    transitionStyle = 'spiral';
  } else if (goalDiff >= 3) {
    transitionStyle = 'diagonal';
  } else {
    transitionStyle = 'random';
  }

  // Metadata
  const matchTitle = `${homeTeam.name} vs ${awayTeam.name}`;
  const score = `${stats.homeScore} - ${stats.awayScore}`;
  const date = matchDate || new Date().toISOString().split('T')[0];

  return {
    gridScale,
    gridRotation,
    shapeMode,
    darkMode,
    fluidIntensity,
    fluidColor,
    splatCount,
    logoBlend,
    transitionStyle,
    matchTitle,
    score,
    date,
  };
}
