import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { fetchProductsByTeam, type ShopifyProduct } from '../../lib/shopify';
import { ProductCard } from '../merch/ProductCard';
import styles from './TeamCloset.module.css';

interface TeamClosetProps {
  teamSlug: string;
  /** Override the header title (defaults to "mundial merch"). */
  title?: string;
  /** Cap the number of items shown — turns the closet into a preview. */
  limit?: number;
  /** With `limit`, render a "view all" link to the full closet. */
  viewAllHref?: string;
}

export function TeamCloset({ teamSlug, title = 'Shop the kit', limit, viewAllHref }: TeamClosetProps) {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchProductsByTeam(teamSlug)
      .then((p) => {
        setProducts(p);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch team products:', err);
        setError('error loading products');
        setLoading(false);
      });
  }, [teamSlug]);

  const shown = limit ? products.slice(0, limit) : products;
  const hasMore = limit != null && viewAllHref != null && products.length > limit;

  return (
    <div className={styles.closet}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>{teamSlug.replace(/-/g, ' ')} · world cup 2026</span>
        <h2 className={styles.title}>{title}</h2>
      </header>

      {loading && <div className={styles.note}>loading products…</div>}
      {error && <div className={styles.note}>{error}</div>}
      {!loading && !error && products.length === 0 && (
        <div className={styles.note}>no merch yet for this team</div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className={styles.grid}>
          {shown.map((product) => (
            <ProductCard key={product.id} product={product} teamSlug={teamSlug} />
          ))}
        </div>
      )}

      {hasMore && (
        <Link to={viewAllHref} className={styles.viewAll}>
          view all {products.length} items →
        </Link>
      )}
    </div>
  );
}
