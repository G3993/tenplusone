import { createWinnerDiscount, createConsolationDiscount } from './shopify-admin';

interface ResolveResult {
  matchId: string;
  resolved: number;
  winners: number;
  losers: number;
}

export async function resolveMatch(
  db: D1Database,
  matchId: string,
  storeDomain: string,
  adminToken: string
): Promise<ResolveResult> {
  // Get match result
  const match = await db.prepare(
    'SELECT * FROM matches WHERE id = ? AND status = ?'
  ).bind(matchId, 'FINISHED').first();
  if (!match) throw new Error(`Match ${matchId} not finished`);

  // Determine winner: 'home', 'away', or 'draw'
  let winner: string;
  if ((match.score_home as number) > (match.score_away as number)) winner = 'home';
  else if ((match.score_home as number) < (match.score_away as number)) winner = 'away';
  else winner = 'draw';

  // Get all PENDING wagers for this match
  const { results: wagers } = await db.prepare(
    'SELECT * FROM wagers WHERE match_id = ? AND status = ?'
  ).bind(matchId, 'PENDING').all();

  let winners = 0, losers = 0;

  for (const wager of wagers) {
    const isWinner = wager.pick === winner;
    let discount: { code: string; percentage: number };

    if (isWinner) {
      discount = await createWinnerDiscount(storeDomain, adminToken, matchId, wager.user_email as string);
      winners++;
    } else {
      discount = await createConsolationDiscount(storeDomain, adminToken, matchId, wager.user_email as string);
      losers++;
    }

    await db.prepare(`
      UPDATE wagers SET status = ?, discount_code = ?, discount_pct = ?, resolved_at = datetime('now')
      WHERE id = ?
    `).bind(
      isWinner ? 'WON' : 'LOST',
      discount.code,
      discount.percentage,
      wager.id
    ).run();
  }

  return { matchId, resolved: wagers.length, winners, losers };
}
