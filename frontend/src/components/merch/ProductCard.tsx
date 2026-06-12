import { Link } from 'react-router';
import { MerchIcon, merchKindFor } from './MerchIcon';
import { sizedImage, type ShopifyProduct } from '../../lib/shopify';
import styles from './ProductCard.module.css';

const CARD_IMG_W = 600; // ~2x the largest card display width (retina)

export function ProductCard({
  product,
  teamSlug,
  imageOverride,
}: {
  product: ShopifyProduct;
  teamSlug?: string;
  /** Show this image instead of the default (e.g. the selected color's variant). */
  imageOverride?: string;
}) {
  const price = parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2);
  const kind = merchKindFor(`${product.title} ${product.handle}`);
  const to = teamSlug
    ? `/merch/${product.handle}?team=${teamSlug}`
    : `/merch/${product.handle}`;
  // Real product photo (Printify mockup) when Shopify has one; else the icon.
  // imageOverride wins (the selected color's variant photo).
  const imgs = product.images?.edges ?? [];
  const nodes = imgs.map((e) => e.node);
  const byColor = (kw: string) => nodes.find((n) => (n.altText ?? '').toLowerCase().includes(kw));
  // Default tile shows a light/white colorway; hover crossfades to the black
  // one, so every apparel tile reads as black & white — independent of the
  // order Printify happens to emit media in (hoodies aren't white-first).
  // Falls back to catalog media order when those colorways aren't present
  // (e.g. the Natural/Black canvas tote has no white).
  const primaryNode = byColor('white') ?? nodes[0];
  const blackNode = byColor('black');
  const rawPhoto = imageOverride ?? primaryNode?.url;
  const photoUrl = sizedImage(rawPhoto, CARD_IMG_W);
  const photoAlt = (imageOverride ? nodes[0]?.altText : primaryNode?.altText) ?? product.title;
  // Second catalog image — crossfades in on hover. Skipped when a color
  // override is active (the override already replaced the primary photo).
  const rawSecond = !imageOverride
    ? (blackNode && blackNode.url !== primaryNode?.url ? blackNode.url : nodes[1]?.url)
    : undefined;
  const secondUrl = sizedImage(rawSecond, CARD_IMG_W);
  const hasSecond = !!secondUrl && rawSecond !== rawPhoto;

  return (
    <Link to={to} className={styles.card} aria-label={`${product.title} — $${price}`}>
      {/* Visual fills the upper portion of the tile. */}
      <span className={styles.media}>
        {photoUrl ? (
          <>
            <img src={photoUrl} alt={photoAlt} className={styles.img} loading="lazy" decoding="async" />
            {hasSecond && (
              <img
                src={secondUrl}
                alt=""
                aria-hidden="true"
                className={styles.imgSecondary}
                loading="lazy"
                decoding="async"
              />
            )}
          </>
        ) : (
          <MerchIcon kind={kind} size={180} label={`${product.title} preview`} />
        )}
      </span>

      {/* Hover affordance — only visible on pointer-hover/focus. Click on the
          card itself still navigates to the product detail page. */}
      <span className={styles.add} aria-hidden="true">view →</span>

      <span className={styles.meta}>
        <span className={styles.title}>{product.title}</span>
        <span className={styles.price}>${price}</span>
      </span>
    </Link>
  );
}
