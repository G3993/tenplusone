import { useState, useEffect, useMemo, useRef } from 'react';
import { fetchProducts, fetchProductsByTeam, type ShopifyProduct } from '../../lib/shopify';
import { TEAMS } from '../../data/teams';
import { ProductCard } from './ProductCard';
import styles from './ProductGrid.module.css';

interface ProductGridProps {
  teamFilter?: string;
}

/** Category from the Shopify product type (e.g. "T-Shirt", "Hoodie"). */
function productTypeFor(p: ShopifyProduct): string {
  const t = p.productType?.trim() || 'Other';
  // Two hoodie products per nation (Hoodie / Hoodie Dark) carry different
  // Shopify productTypes — collapse "Sweatshirt" into "Hoodie" so the filter
  // shows a single hoodie line.
  return /sweatshirt/i.test(t) ? 'Hoodie' : t;
}

// Some product titles use official nation names that differ from the site's
// short display names — map those title forms back to the team. Used only as
// a fallback; the primary key is the product's team tag (slug/code), which is
// exact and unambiguous for all 48 teams.
const TITLE_ALIASES: Record<string, string[]> = {
  USA: ['united states', 'usa'],
  Turkey: ['türkiye', 'turkiye', 'turkey'],
  'Cabo Verde': ['cape verde', 'cabo verde'],
  // Both apostrophe forms (straight ' and curly ’) and the accented/unaccented
  // "cote"/"côte" forms — the live catalog stores "Côte d'Ivoire" (straight).
  'Ivory Coast': ["côte d'ivoire", 'côte d’ivoire', "cote d'ivoire", 'cote d’ivoire', 'ivory coast'],
  Curacao: ['curaçao', 'curacao'],
  Bosnia: ['bosnia and herzegovina', 'bosnia'],
  'Dr Congo': ['dr congo', 'democratic republic of congo', 'congo dr'],
};

// Lookup tables keyed by the team tag the catalog actually carries. The
// Printify pipeline tags every product with [team.slug, team.code(lower), …],
// so the slug/code is the reliable join — far more robust than title text.
const TEAM_BY_SLUG = new Map(TEAMS.map((t) => [t.slug, t.name]));
const TEAM_BY_CODE = new Map(TEAMS.map((t) => [t.code.toLowerCase(), t.name]));

/**
 * Team display name for a product. Prefers the exact team tag (slug or code),
 * then falls back to matching the team name / a known alias in the title.
 */
function teamNameFor(p: ShopifyProduct): string | null {
  for (const tag of p.tags ?? []) {
    const key = tag.toLowerCase();
    const bySlug = TEAM_BY_SLUG.get(key);
    if (bySlug) return bySlug;
    const byCode = TEAM_BY_CODE.get(key);
    if (byCode) return byCode;
  }
  const title = p.title.toLowerCase();
  for (const t of TEAMS) {
    const forms = TITLE_ALIASES[t.name] ?? [t.name.toLowerCase()];
    if (forms.some((f) => title.includes(f))) return t.name;
  }
  return null;
}

/** The slug for a team display name — used to resolve its crest asset. */

// The catalog is black-and-white only: garments are limited to the neutral
// palette (black / white / beige / light gray), so the color filter mirrors
// exactly those four buckets — nothing else exists to filter by.
const COLOR_BUCKETS: { key: string; re: RegExp }[] = [
  { key: 'black', re: /black|onyx/i },
  { key: 'white', re: /\bwhite\b|ivory|pearl/i },
  { key: 'beige', re: /natural|toast|sand|\btan\b|oatmeal|stone|almond|bone|cream|khaki|beige/i },
  { key: 'grey', re: /gr[ae]y|heather|\bash\b|silver/i },
];

function colorsFor(p: ShopifyProduct): string[] {
  const opt = p.options?.find((o) => /colou?r/i.test(o.name));
  if (!opt) return [];
  const out = new Set<string>();
  for (const v of opt.values) {
    for (const b of COLOR_BUCKETS) if (b.re.test(v)) out.add(b.key);
  }
  return [...out];
}

/** Photo of the variant whose color falls in the selected bucket. */
function variantImageForColor(p: ShopifyProduct, colorKey: string): string | undefined {
  const bucket = COLOR_BUCKETS.find((b) => b.key === colorKey);
  if (!bucket) return undefined;
  for (const e of p.variants?.edges ?? []) {
    const c = e.node.selectedOptions?.find((o) => /colou?r/i.test(o.name))?.value;
    if (c && bucket.re.test(c) && e.node.image?.url) return e.node.image.url;
  }
  return undefined;
}

/** How many cards to render per page (grows on scroll). */
const GRID_PAGE = 48;

/** Product types that make up the Featured collection right now (shirts only).
 *  Lowercased Shopify productType values. Mirrors the "Featured" smart
 *  collection rules in Shopify admin. */
const FEATURED_TYPES = new Set(['t-shirt']);

export function ProductGrid({ teamFilter }: ProductGridProps = {}) {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [team, setTeam] = useState('all');
  const [type, setType] = useState('all');
  const [color, setColor] = useState('all');
  // The main shop lands on the Featured collection (products tagged "featured").
  // "all" switches to the full catalog. Team-scoped grids ignore this.
  const [view, setView] = useState<'featured' | 'all'>('featured');
  // Filters are exposed by default (the team filter especially) rather than
  // hidden behind a toggle.
  // Render the grid in pages so we don't mount ~1,400 cards (and their images)
  // at once. Grow as a sentinel scrolls into view.
  const [visible, setVisible] = useState(GRID_PAGE);
  const sentinel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setTeam('all'); setType('all'); setColor('all');
    const fetcher = teamFilter ? fetchProductsByTeam(teamFilter) : fetchProducts();
    fetcher
      .then((p) => { setProducts(p); setLoading(false); })
      .catch((err) => { console.error('Failed to fetch products:', err); setError('error loading products'); setLoading(false); });
  }, [teamFilter]);

  // Build the available filter options from the live catalog.
  const teams = useMemo(() => {
    const s = new Set<string>();
    products.forEach((p) => { const t = teamNameFor(p); if (t) s.add(t); });
    return [...s].sort();
  }, [products]);
  const types = useMemo(() => {
    // The shop's core lines are tees, hoodies and totes (every nation carries
    // them). Legacy one-off items (mugs, hats, accessories…) would just clutter
    // the menu, so the main grid's TYPE filter is limited to those core lines.
    // A team's own page shows whatever that team actually has.
    const CORE = /tee|t-?shirt|hoodie|sweatshirt|\bbag|tote/i;
    const present = [...new Set(products.map(productTypeFor))].filter((t) => t && t !== 'Other');
    return (teamFilter ? present : present.filter((t) => CORE.test(t)))
      .sort()
      .map((t) => ({ type: t, label: t.toLowerCase() }));
  }, [products, teamFilter]);
  const colors = useMemo(() => {
    const s = new Set<string>();
    products.forEach((p) => colorsFor(p).forEach((c) => s.add(c)));
    return COLOR_BUCKETS.map((b) => b.key).filter((k) => s.has(k));
  }, [products]);

  // Featured = anything hand-tagged "featured" in Shopify, plus the current
  // featured product types (shirts only). Mirrors the "Featured" smart
  // collection in Shopify admin; edit FEATURED_TYPES to change the set.
  const featured = useMemo(
    () => products.filter((p) =>
      (p.tags ?? []).some((t) => t.toLowerCase() === 'featured')
      || FEATURED_TYPES.has((p.productType ?? '').trim().toLowerCase()),
    ),
    [products],
  );
  const showFeatured = !teamFilter && view === 'featured';
  // Featured is the curated landing set (tees). The moment any filter is active,
  // search the WHOLE catalog — otherwise picking Bags/Hoodie filters an all-tees
  // set down to nothing and looks broken.
  const anyFilter = team !== 'all' || type !== 'all' || color !== 'all';
  const base = showFeatured && !anyFilter ? featured : products;

  const filtered = useMemo(() => base.filter((p) =>
    (team === 'all' || teamNameFor(p) === team)
    && (type === 'all' || productTypeFor(p) === type)
    && (color === 'all' || colorsFor(p).includes(color)),
  ), [base, team, type, color]);

  // Switching between Featured and All resets the filters.
  useEffect(() => { setTeam('all'); setType('all'); setColor('all'); }, [view]);

  // Reset to the first page whenever the result set changes.
  useEffect(() => { setVisible(GRID_PAGE); }, [team, type, color, products, view]);

  // Grow the visible page as the sentinel scrolls near the viewport.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || visible >= filtered.length) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setVisible((v) => v + GRID_PAGE);
    }, { rootMargin: '800px' });
    io.observe(el);
    return () => io.disconnect();
  }, [visible, filtered.length]);

  const eyebrow = teamFilter
    ? `${teamFilter.replace(/-/g, ' ')} / shop`
    : showFeatured ? 'featured' : 'shop / all';
  const count = loading ? '…' : `${filtered.length}`;

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        {!teamFilter && (
          <div className={styles.tabs} role="tablist" aria-label="collection">
            <button
              type="button"
              role="tab"
              aria-selected={view === 'featured'}
              className={view === 'featured' ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              onClick={() => setView('featured')}
            >
              featured
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'all'}
              className={view === 'all' ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              onClick={() => setView('all')}
            >
              all products
            </button>
          </div>
        )}
        <div className={styles.crumb}>
          <span className={styles.crumbLabel}>{eyebrow}</span>
          <span className={styles.crumbCount}>{count} {filtered.length === 1 ? 'piece' : 'pieces'}</span>
        </div>

        <div className={styles.filterBar}>
          {!teamFilter && teams.length > 0 && (
            <select className={styles.select} value={team} onChange={(e) => setTeam(e.target.value)} aria-label="filter by team">
              <option value="all">all teams</option>
              {teams.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          {types.length > 0 && (
            <select className={styles.select} value={type} onChange={(e) => setType(e.target.value)} aria-label="filter by type">
              <option value="all">all types</option>
              {types.map((o) => <option key={o.type} value={o.type}>{o.label}</option>)}
            </select>
          )}
          {colors.length > 0 && (
            <select className={styles.select} value={color} onChange={(e) => setColor(e.target.value)} aria-label="filter by color">
              <option value="all">all colors</option>
              {colors.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          {(team !== 'all' || type !== 'all' || color !== 'all') && (
            <button type="button" className={styles.filterClear} onClick={() => { setTeam('all'); setType('all'); setColor('all'); }}>
              clear
            </button>
          )}
        </div>
      </header>

      {loading && <div className={styles.note}>loading…</div>}
      {error && <div className={styles.note}>{error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <div className={styles.note}>
          {showFeatured && featured.length === 0 ? (
            <>nothing featured yet — <button type="button" className={styles.linkBtn} onClick={() => setView('all')}>browse all products →</button></>
          ) : (
            'no pieces match these filters.'
          )}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          <div className={styles.grid}>
            {filtered.slice(0, visible).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                imageOverride={color !== 'all' ? variantImageForColor(product, color) : undefined}
              />
            ))}
          </div>
          {visible < filtered.length && (
            <div ref={sentinel} className={styles.note}>loading more…</div>
          )}
        </>
      )}
    </div>
  );
}
