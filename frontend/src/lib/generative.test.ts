import { describe, it, expect } from 'vitest';
import { matchToGenerativeConfig, type MatchStats } from './generative';
import type { TeamData } from '../data/teams';

const homeTeam: TeamData = {
  name: 'Germany',
  slug: 'germany',
  code: 'GER',
  group: 'E',
  flag: '',
  primaryColor: [0.0, 0.0, 0.0],
};

const awayTeam: TeamData = {
  name: 'France',
  slug: 'france',
  code: 'FRA',
  group: 'I',
  flag: '',
  primaryColor: [0.0, 0.14, 0.58],
};

function makeStats(overrides: Partial<MatchStats> = {}): MatchStats {
  return {
    homeScore: 0,
    awayScore: 0,
    possession: [50, 50],
    shots: [5, 5],
    shotsOnTarget: [2, 2],
    corners: [3, 3],
    fouls: [10, 10],
    yellowCards: [1, 1],
    redCards: [0, 0],
    ...overrides,
  };
}

describe('matchToGenerativeConfig', () => {
  it('Test 1: 0-0 draw produces wave transition, cube shape, dark mode on', () => {
    const stats = makeStats({ homeScore: 0, awayScore: 0 });
    const config = matchToGenerativeConfig(stats, homeTeam, awayTeam);
    expect(config.transitionStyle).toBe('wave');
    expect(config.shapeMode).toBe('cube');
    expect(config.darkMode).toBe(true); // homeScore >= awayScore
  });

  it('Test 2: 5-0 blowout produces sphere shape, diagonal transition', () => {
    const stats = makeStats({ homeScore: 5, awayScore: 0 });
    const config = matchToGenerativeConfig(stats, homeTeam, awayTeam);
    expect(config.shapeMode).toBe('sphere'); // totalGoals > 4
    expect(config.transitionStyle).toBe('diagonal'); // goalDiff >= 3
  });

  it('Test 3: 1-0 close win produces spiral transition', () => {
    const stats = makeStats({ homeScore: 1, awayScore: 0 });
    const config = matchToGenerativeConfig(stats, homeTeam, awayTeam);
    expect(config.transitionStyle).toBe('spiral'); // goalDiff === 1
  });

  it('Test 4: gridScale increases with total goals (base 0.8 + goals * 0.05)', () => {
    const stats0 = makeStats({ homeScore: 0, awayScore: 0 });
    const stats4 = makeStats({ homeScore: 2, awayScore: 2 });
    const config0 = matchToGenerativeConfig(stats0, homeTeam, awayTeam);
    const config4 = matchToGenerativeConfig(stats4, homeTeam, awayTeam);
    expect(config0.gridScale).toBeCloseTo(0.8);
    expect(config4.gridScale).toBeCloseTo(1.0); // 0.8 + 4*0.05
  });

  it('Test 5: fluidIntensity capped at 1.0 regardless of goal count', () => {
    const stats = makeStats({ homeScore: 10, awayScore: 10 });
    const config = matchToGenerativeConfig(stats, homeTeam, awayTeam);
    expect(config.fluidIntensity).toBe(1.0);
    expect(config.fluidIntensity).toBeLessThanOrEqual(1.0);
  });

  it('Test 6: fluidColor uses winning team primaryColor', () => {
    const statsHomeWin = makeStats({ homeScore: 2, awayScore: 1 });
    const statsAwayWin = makeStats({ homeScore: 0, awayScore: 3 });
    const configHome = matchToGenerativeConfig(statsHomeWin, homeTeam, awayTeam);
    const configAway = matchToGenerativeConfig(statsAwayWin, homeTeam, awayTeam);
    expect(configHome.fluidColor).toEqual(homeTeam.primaryColor);
    expect(configAway.fluidColor).toEqual(awayTeam.primaryColor);
  });

  it('Test 7: logoBlend reflects possession ratio (50/50 = 0.5)', () => {
    const stats5050 = makeStats({ possession: [50, 50] });
    const stats7030 = makeStats({ possession: [70, 30] });
    const config5050 = matchToGenerativeConfig(stats5050, homeTeam, awayTeam);
    const config7030 = matchToGenerativeConfig(stats7030, homeTeam, awayTeam);
    expect(config5050.logoBlend).toBeCloseTo(0.5);
    expect(config7030.logoBlend).toBeCloseTo(0.7);
  });

  it('Test 8: splatCount equals total shots from both teams', () => {
    const stats = makeStats({ shots: [12, 8] });
    const config = matchToGenerativeConfig(stats, homeTeam, awayTeam);
    expect(config.splatCount).toBe(20);
  });

  it('Test 9: output includes matchTitle, score string, and date', () => {
    const stats = makeStats({ homeScore: 2, awayScore: 1 });
    const config = matchToGenerativeConfig(stats, homeTeam, awayTeam, '2026-06-13');
    expect(config.matchTitle).toBe('Germany vs France');
    expect(config.score).toBe('2 - 1');
    expect(config.date).toBe('2026-06-13');
  });
});
