import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router';
import { fetchProductByHandle, sizedImage, type ShopifyProduct } from '../lib/shopify';
import { useCartStore } from '../stores/cart';
import { TEAMS, getTeamBySlug } from '../data/teams';
import { TeamLogo } from '../components/team/TeamLogo';
import { MerchIcon, merchKindFor } from '../components/merch/MerchIcon';
import { SpectrumCrest } from '../components/logos/SpectrumCrest';
import { teamSeed, FRAMES } from '../components/logos/spectrumMotif';
import { getLogoPixels } from '../data/team-logos/index';
import styles from './ProductDetail.module.css';

type VariantNode = {
  id: string;
  title: string;
  price: { amount: string };
  availableForSale?: boolean;
  selectedOptions?: Array<{ name: string; value: string }>;
};

/** Canonical size ordering for apparel; unknowns sort to the end. */
const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL', 'One Size', 'OS'];
const sizeRank = (s: string) => {
  const i = SIZE_ORDER.indexOf(s.toUpperCase() === 'OS' ? 'OS' : s);
  return i === -1 ? 999 : i;
};

/** Garment swatch colors — the neutral B&W palette, with a keyword fallback. */
const COLOR_HEX: Record<string, string> = {
  white: '#f3f3f0',
  black: '#191919',
  natural: '#ece3d0',
  sand: '#ddccac',
  toast: '#bf8a5b',
  ash: '#e6e7e9',
  'sport grey': '#c2c4c6',
  'athletic heather': '#d3d5d7',
  'heather grey': '#cfd1d3',
  charcoal: '#3c3e41',
  'dark heather': '#52555a',
};
function swatchHex(color: string): string {
  const key = color.trim().toLowerCase();
  if (COLOR_HEX[key]) return COLOR_HEX[key];
  if (/black|onyx|coal/.test(key)) return '#191919';
  if (/charcoal|graphite|dark/.test(key)) return '#3c3e41';
  if (/white|ivory/.test(key)) return '#f3f3f0';
  if (/natural|sand|toast|tan|beige|bone|oat|cream/.test(key)) return '#ddccac';
  if (/grey|gray|heather|ash|silver/.test(key)) return '#cfd1d3';
  return '#b9bbbd';
}

const optionValue = (n: VariantNode, re: RegExp) =>
  n.selectedOptions?.find((o) => re.test(o.name))?.value ?? null;
const colorOf = (n: VariantNode) =>
  optionValue(n, /colou?r/i) ?? n.title.split('/')[0]?.trim() ?? n.title;
const sizeOf = (n: VariantNode) => {
  const explicit = optionValue(n, /size/i);
  if (explicit) return explicit;
  const parts = n.title.split('/').map((s) => s.trim());
  return parts.length > 1 ? parts[parts.length - 1] : '';
};

/** Resolve the team a product belongs to from its `${slug}-${type}` handle. */
function teamFromHandle(handle: string | undefined) {
  if (!handle) return undefined;
  const matches = TEAMS.filter((t) => handle.startsWith(`${t.slug}-`));
  // longest slug wins (avoids partial-prefix collisions)
  return matches.sort((a, b) => b.slug.length - a.slug.length)[0];
}

export default function ProductDetail() {
  const { handle } = useParams<{ handle: string }>();
  const [searchParams] = useSearchParams();
  const teamParam = searchParams.get('team') ?? undefined;
  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [frame, setFrame] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const checkout = useCartStore((s) => s.checkout);
  const cartLoading = useCartStore((s) => s.loading);

  // Clock for the animated crest below the mockup.
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % FRAMES), 110);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!handle) return;
    setLoading(true);
    fetchProductByHandle(handle)
      .then((p) => {
        setProduct(p);
        const first = p?.variants?.edges?.[0]?.node;
        if (first) {
          const c = colorOf(first);
          setSelectedColor(c);
          setSelectedSize(sizeOf(first));
          // Show the mockup that matches the default colorway, not always image 0.
          const imgs = p?.images?.edges ?? [];
          const idx = imgs.findIndex((e) => (e.node.altText ?? '').toLowerCase().includes(c.toLowerCase()));
          setActiveImg(idx >= 0 ? idx : 0);
        } else {
          setActiveImg(0);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [handle]);

  if (loading) {
    return <div className={styles.note}>loading product…</div>;
  }

  if (!product) {
    return (
      <div className={styles.note}>
        product not found
        <br />
        <Link to="/merch" className={styles.back}>← back to merch</Link>
      </div>
    );
  }

  const price = parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2);
  const team =
    (teamParam ? getTeamBySlug(teamParam) : undefined) ?? teamFromHandle(product.handle);
  const kind = merchKindFor(`${product.title} ${product.handle}`);
  const backTo = team ? `/team/${team.slug}` : '/merch';
  const backLabel = team ? `← back to ${team.name}` : '← back to merch';

  // Printify mockups straight from Shopify. Empty in local mock mode → we fall
  // back to the garment silhouette + crest.
  const images = product.images?.edges?.map((e) => e.node) ?? [];
  const heroImg = images[Math.min(activeImg, images.length - 1)];

  // The crest, animated — shown below the mockup as "the print, in motion".
  const teamPixels = team ? getLogoPixels(team.slug, team.name[0]) : null;
  const teamSeedVal = team ? teamSeed(team.slug) : 0;

  // Split variants into Color + Size axes for the picker UI.
  const variantNodes: VariantNode[] = (product.variants?.edges ?? []).map((e) => e.node);
  const colors = [...new Set(variantNodes.map(colorOf))].filter((c) => c && c !== 'Default Title');
  const sizes = [...new Set(variantNodes.map(sizeOf).filter(Boolean))].sort(
    (a, b) => sizeRank(a) - sizeRank(b),
  );
  const multiColor = colors.length > 1;
  const multiSize = sizes.length > 1;

  const availSizesForColor = (color: string) =>
    new Set(
      variantNodes
        .filter((n) => colorOf(n) === color && n.availableForSale !== false)
        .map(sizeOf),
    );
  const availSizes = multiSize ? availSizesForColor(selectedColor) : new Set<string>();

  const currentVariant =
    variantNodes.find((n) => colorOf(n) === selectedColor && (!multiSize || sizeOf(n) === selectedSize)) ??
    variantNodes.find((n) => colorOf(n) === selectedColor) ??
    variantNodes[0];
  const currentVariantId = currentVariant?.id ?? '';

  // Picking a color swaps the mockup to that colorway and keeps the size if the
  // color has it (else jumps to the first size that's in stock for that color).
  const pickColor = (color: string) => {
    setSelectedColor(color);
    const avail = availSizesForColor(color);
    if (selectedSize && !avail.has(selectedSize)) {
      const next = sizes.find((s) => avail.has(s));
      if (next) setSelectedSize(next);
    }
    const idx = images.findIndex((im) =>
      (im.altText ?? '').toLowerCase().includes(color.toLowerCase()),
    );
    if (idx >= 0) setActiveImg(idx);
  };

  const addToCart = async () => {
    if (!currentVariantId) return;
    await addItem(currentVariantId);
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 2500);
  };

  const buyNow = async () => {
    if (!currentVariantId) return;
    await addItem(currentVariantId);
    checkout();
  };

  return (
    <div className={styles.page}>
      <Link to={backTo} className={styles.back}>{backLabel}</Link>

      <div className={styles.layout}>
        {/* Left column: Printify mockup(s) on top, the print animated below. */}
        <div className={styles.media}>
          <div className={styles.mockup} aria-label={`${product.title} mockup`}>
            {heroImg ? (
              <img
                src={sizedImage(heroImg.url, 1200)}
                alt={heroImg.altText ?? product.title}
                className={styles.mockupImg}
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className={styles.preview}>
                <MerchIcon
                  kind={kind}
                  size={300}
                  className={styles.garment}
                  label={`${product.title} silhouette`}
                />
                {team && (
                  <span className={styles.crestOverlay}>
                    <TeamLogo team={team} size={104} />
                  </span>
                )}
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className={styles.thumbs} role="group" aria-label="more mockups">
              {images.slice(0, 6).map((im, i) => (
                <button
                  key={im.url}
                  type="button"
                  className={i === activeImg ? `${styles.thumb} ${styles.thumbActive}` : styles.thumb}
                  onClick={() => setActiveImg(i)}
                  aria-label={`view mockup ${i + 1}`}
                  aria-pressed={i === activeImg}
                >
                  <img src={sizedImage(im.url, 200)} alt="" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          )}

          {teamPixels && (
            <div className={styles.animated}>
              <div className={styles.animatedHead}>the print · in motion</div>
              <SpectrumCrest
                pixels={teamPixels}
                seed={teamSeedVal}
                frame={frame}
                size={360}
                variant="spectrum"
                className={styles.animatedCrest}
              />
            </div>
          )}
        </div>

        <div className={styles.info}>
          {team && <div className={styles.eyebrow}>{team.code} · world cup 2026</div>}
          <h1 className={styles.title}>{product.title}</h1>
          <div className={styles.price}>${price}</div>
          <p className={styles.desc}>{product.description}</p>

          {product.specs && product.specs.length > 0 && (
            <dl className={styles.specs} aria-label="product specifications">
              {product.specs.map((s) => (
                <div key={s.label} className={styles.specRow}>
                  <dt className={styles.specLabel}>{s.label}</dt>
                  <dd className={styles.specValue}>{s.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <ul className={styles.trust} aria-label="trust signals">
            <li>free shipping on orders over $75 (US)</li>
            <li>30-day returns, no questions</li>
            <li>printed on demand &middot; ships in 3 to 5 business days</li>
          </ul>

          {multiColor && (
            <div className={styles.optGroup}>
              <div className={styles.optHead}>
                <span className={styles.variantLabel}>color</span>
                <span className={styles.optValue}>{selectedColor}</span>
              </div>
              <div className={styles.swatches} role="group" aria-label="color">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={c === selectedColor ? `${styles.swatch} ${styles.swatchActive}` : styles.swatch}
                    style={{ background: swatchHex(c) }}
                    onClick={() => pickColor(c)}
                    aria-label={c}
                    aria-pressed={c === selectedColor}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}

          {multiSize && (
            <div className={styles.optGroup}>
              <span className={styles.variantLabel}>size</span>
              <div className={styles.sizes} role="group" aria-label="size">
                {sizes.map((s) => {
                  const inStock = availSizes.has(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      className={s === selectedSize ? `${styles.size} ${styles.sizeActive}` : styles.size}
                      onClick={() => setSelectedSize(s)}
                      disabled={!inStock}
                      aria-pressed={s === selectedSize}
                      title={inStock ? s : `${s} — out of stock`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className={styles.buyRow}>
            <button
              className={styles.buy}
              onClick={addToCart}
              disabled={cartLoading || !currentVariantId}
            >
              {cartLoading ? 'processing…' : added ? 'added ✓' : 'add to cart'}
            </button>
            <button
              className={styles.buyNow}
              onClick={buyNow}
              disabled={cartLoading || !currentVariantId}
            >
              buy now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
