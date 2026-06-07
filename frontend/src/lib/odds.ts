/**
 * Convert European/decimal odds to American (moneyline) format.
 *   decimal >= 2.0  ->  +(d - 1) * 100   (underdog, positive)
 *   decimal <  2.0  ->  -100 / (d - 1)   (favorite, negative)
 * Always returns an explicit sign, e.g. "+320", "-222".
 */
export function toAmerican(decimal: number): string {
  if (!Number.isFinite(decimal) || decimal <= 1) return '—';
  const american =
    decimal >= 2
      ? Math.round((decimal - 1) * 100)
      : -Math.round(100 / (decimal - 1));
  return american > 0 ? `+${american}` : `${american}`;
}
