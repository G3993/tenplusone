import { useState, useEffect } from 'react';
import { fetchProducts, fetchProductsByCollection, type ShopifyProduct } from '../../lib/shopify';
import { Line, Blank, useLineCounter } from '../layout/Line';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  teamFilter?: string;
}

export function ProductGrid({ teamFilter }: ProductGridProps = {}) {
  const nextLn = useLineCounter();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const fetcher = teamFilter
      ? fetchProductsByCollection(teamFilter)
      : fetchProducts();

    fetcher
      .then((p) => {
        setProducts(p);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch products:', err);
        setError('error loading products');
        setLoading(false);
      });
  }, [teamFilter]);

  const heading = teamFilter
    ? `// ${teamFilter.toUpperCase()} MERCH`
    : '// MERCH';

  return (
    <>
      <Line n={nextLn()}>
        <span className="comment">{heading}</span>
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
        products.map((product) => (
          <div key={product.id}>
            <ProductCard product={product} ln={nextLn} />
            <Blank n={nextLn()} />
          </div>
        ))}
    </>
  );
}
