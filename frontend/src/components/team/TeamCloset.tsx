import { useState, useEffect } from 'react';
import { fetchProductsByCollection, type ShopifyProduct } from '../../lib/shopify';
import { Line, Blank, useLineCounter } from '../layout/Line';
import { ProductCard } from '../merch/ProductCard';
import styles from './TeamCloset.module.css';

interface TeamClosetProps {
  teamSlug: string;
}

export function TeamCloset({ teamSlug }: TeamClosetProps) {
  const nextLn = useLineCounter(100);
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchProductsByCollection(teamSlug)
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

  return (
    <div className={styles.closet}>
      <Line n={nextLn()}>
        <span className="comment">{'// TEAM CLOSET'}</span>
      </Line>
      <Blank n={nextLn()} />

      {loading && (
        <Line n={nextLn()}>
          <span className="dim">{'// loading products...'}</span>
        </Line>
      )}

      {error && (
        <Line n={nextLn()}>
          <span className="dim">{`// ${error}`}</span>
        </Line>
      )}

      {!loading &&
        !error &&
        products.length === 0 && (
          <Line n={nextLn()}>
            <span className="dim">{'// no merch yet for this team'}</span>
          </Line>
        )}

      {!loading &&
        !error &&
        products.map((product) => (
          <div key={product.id}>
            <ProductCard product={product} ln={nextLn} />
            <Blank n={nextLn()} />
          </div>
        ))}
    </div>
  );
}
