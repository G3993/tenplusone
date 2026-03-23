export async function fetchAndSyncMatches(db: D1Database, apiKey: string, apiHost: string): Promise<number> {
  const res = await fetch(`https://${apiHost}/fixtures?league=1&season=2026`, {
    headers: { 'x-apisports-key': apiKey },
  });
  if (!res.ok) throw new Error(`API-Football error: ${res.status}`);
  const data = await res.json() as { response: Array<any> };

  for (const fixture of data.response) {
    const statusMap: Record<string, string> = { NS: 'SCHEDULED', '1H': 'LIVE', HT: 'LIVE', '2H': 'LIVE', FT: 'FINISHED' };
    const status = statusMap[fixture.fixture.status.short] || 'SCHEDULED';

    await db.prepare(`
      INSERT INTO matches (id, home_team, away_team, kickoff, status, score_home, score_away, group_id, venue, match_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET status=excluded.status, score_home=excluded.score_home, score_away=excluded.score_away, match_data=excluded.match_data
    `).bind(
      String(fixture.fixture.id),
      fixture.teams.home.name,
      fixture.teams.away.name,
      fixture.fixture.date,
      status,
      fixture.goals.home,
      fixture.goals.away,
      fixture.league.round || null,
      fixture.fixture.venue?.name || null,
      JSON.stringify(fixture.statistics || null),
    ).run();
  }
  return data.response.length;
}
