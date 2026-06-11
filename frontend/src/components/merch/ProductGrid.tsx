import { useState, useEffect, useMemo, useRef } from 'react';
import { fetchProducts, fetchProductsByTeam, type ShopifyProduct } from '../../lib/shopify';
import { TEAMS } from '../../data/teams';
import { ProductCard } from './ProductCard';
import styles from './ProductGrid.module.css';

interface ProductGridProps {
  teamFilter?: string;
}

// Broad shop categories — Shopify product types roll up into three buckets so
// the TYPE filter stays simple: tees → Tees, hoodies/sweats → Outerwear,
// everything else (bags, totes, hats, …) → Accessories.
const CATEGORIES: { key: string; label: string; re: RegExp }[] = [
  { key: 'tees', label: 'tees', re: /tee|t-?shirt/i },
  { key: 'outerwear', label: 'outerwear', re: /hoodie|sweatshirt|sweater|jacket|fleece|crew/i },
];
/** Broad category for a product — defaults to "accessories" when it isn't a
 *  tee or outerwear. */
function categoryFor(p: ShopifyProduct): string {
  const t = (p.productType ?? '').toLowerCase();
  for (const c of CATEGORIES) if (c.re.test(t)) return c.key;
  return 'accessories';
}
const CATEGORY_ORDER = ['tees', 'outerwear', 'accessories'];
const CATEGORY_LABEL: Record<string, string> = { tees: 'tees', outerwear: 'outerwear', accessories: 'accessories' };

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
  // Preferred: a variant whose color falls in the bucket and carries its own
  // photo. Only present on the full product query (detail page).
  for (const e of p.variants?.edges ?? []) {
    const c = e.node.selectedOptions?.find((o) => /colou?r/i.test(o.name))?.value;
    if (c && bucket.re.test(c) && e.node.image?.url) return e.node.image.url;
  }
  // Fallback for the slim grid catalog (/api/products carries no variants):
  // match the product image whose altText names the color, e.g.
  // "Panama Hoodie Ash". Products with blank image altText can't be matched
  // here and just keep their featured image.
  for (const e of p.images?.edges ?? []) {
    const alt = e.node.altText;
    if (alt && bucket.re.test(alt) && e.node.url) return e.node.url;
  }
  return undefined;
}

/** How many cards to render per page (grows on scroll). */
const GRID_PAGE = 48;

export function ProductGrid({ teamFilter }: ProductGridProps = {}) {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [team, setTeam] = useState('all');
  // The shop lands on Tees (the center pagination's first tab); "all" shows
  // every type.
  const [type, setType] = useState('tees');
  const [color, setColor] = useState('all');
  // Render the grid in pages so we don't mount ~1,400 cards (and their images)
  // at once. Grow as a sentinel scrolls into view.
  const [visible, setVisible] = useState(GRID_PAGE);
  const sentinel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setTeam('all'); setType('tees'); setColor('all');
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
  // Broad type buckets present in the catalog, in fixed order, then "all".
  const typeTabs = useMemo(() => {
    const present = new Set(products.map(categoryFor));
    const tabs = CATEGORY_ORDER.filter((k) => present.has(k)).map((k) => ({ type: k, label: CATEGORY_LABEL[k] }));
    tabs.push({ type: 'all', label: 'all' });
    return tabs;
  }, [products]);
  const colors = useMemo(() => {
    const s = new Set<string>();
    products.forEach((p) => colorsFor(p).forEach((c) => s.add(c)));
    return COLOR_BUCKETS.map((b) => b.key).filter((k) => s.has(k));
  }, [products]);

  const filtered = useMemo(() => products.filter((p) =>
    (team === 'all' || teamNameFor(p) === team)
    && (type === 'all' || categoryFor(p) === type)
    && (color === 'all' || colorsFor(p).includes(color)),
  ), [products, team, type, color]);

  // Reset to the first page whenever the result set changes.
  useEffect(() => { setVisible(GRID_PAGE); }, [team, type, color, products]);

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

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <div className={styles.filterBar}>
          {/* left — team dropdown */}
          <div className={styles.filterLeft}>
            {!teamFilter && teams.length > 0 && (
              <select className={styles.select} value={team} onChange={(e) => setTeam(e.target.value)} aria-label="filter by team">
                <option value="all">WC26 TEAMS</option>
                {teams.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
          </div>

          {/* center — type pagination (tees / outerwear / accessories / all).
              On mobile this is hidden and replaced by the dropdown below. */}
          <div className={styles.tabs} role="tablist" aria-label="product type">
            {typeTabs.map((o) => (
              <button
                key={o.type}
                type="button"
                role="tab"
                aria-selected={type === o.type}
                className={type === o.type ? `${styles.tab} ${styles.tabActive}` : styles.tab}
                onClick={() => setType(o.type)}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* mobile — type as a dropdown instead of the pagination */}
          <select
            className={`${styles.select} ${styles.typeSelect}`}
            value={type}
            onChange={(e) => setType(e.target.value)}
            aria-label="filter by type"
          >
            {typeTabs.map((o) => <option key={o.type} value={o.type}>{o.label}</option>)}
          </select>

          {/* right — color dropdown */}
          <div className={styles.filterRight}>
            {colors.length > 0 && (
              <select className={styles.select} value={color} onChange={(e) => setColor(e.target.value)} aria-label="filter by color">
                <option value="all">color</option>
                {colors.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>
        </div>
      </header>

      {loading && <div className={styles.note}>loading…</div>}
      {error && <div className={styles.note}>{error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <div className={styles.note}>no pieces match these filters.</div>
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
