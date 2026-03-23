import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { fetchProductByHandle, type ShopifyProduct } from '../lib/shopify';
import { useCartStore } from '../stores/cart';
import { Line, Blank, useLineCounter } from '../components/layout/Line';
import styles from './ProductDetail.module.css';

export default function ProductDetail() {
  const { handle } = useParams<{ handle: string }>();
  const nextLn = useLineCounter();
  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const cartLoading = useCartStore((s) => s.loading);

  useEffect(() => {
    if (!handle) return;
    fetchProductByHandle(handle)
      .then((p) => {
        setProduct(p);
        if (p && p.variants.edges.length > 0) {
          setSelectedVariant(p.variants.edges[0].node.id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [handle]);

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    await addItem(selectedVariant);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <Line n={nextLn()}>
        <span className="dim">{'// loading product...'}</span>
      </Line>
    );
  }

  if (!product) {
    return (
      <>
        <Line n={nextLn()}>
          <span className="dim">{'// product not found'}</span>
        </Line>
        <Line n={nextLn()}>
          <Link to="/merch" className={styles.backLink}>{'<- back to merch'}</Link>
        </Line>
      </>
    );
  }

  const price = parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2);
  const hasVariants = product.variants.edges.length > 1;
  const images = product.images.edges;

  return (
    <>
      <Line n={nextLn()}>
        <Link to="/merch" className={styles.backLink}>{'<- back to merch'}</Link>
      </Line>
      <Blank n={nextLn()} />

      <Line n={nextLn()}>
        <span className="comment">{`// ${product.title.toUpperCase()}`}</span>
      </Line>
      <Blank n={nextLn()} />

      {images.length > 0 && (
        <div className={styles.imageGrid}>
          {images.map((img, i) => (
            <img
              key={i}
              src={img.node.url}
              alt={img.node.altText ?? product.title}
              className={styles.productImage}
            />
          ))}
        </div>
      )}

      <Line n={nextLn()}>
        <span className="bright">{product.title}</span>
      </Line>
      <Line n={nextLn()}>
        <span className="dim">${price}</span>
      </Line>
      <Blank n={nextLn()} />

      <Line n={nextLn()}>
        <span className="dim">{product.description}</span>
      </Line>
      <Blank n={nextLn()} />

      {hasVariants && (
        <Line n={nextLn()} className={styles.inputLine}>
          <span className="dim">variant: </span>
          <select
            className={styles.slipSelect}
            value={selectedVariant}
            onChange={(e) => setSelectedVariant(e.target.value)}
          >
            {product.variants.edges.map((v) => (
              <option key={v.node.id} value={v.node.id}>
                {v.node.title} - ${parseFloat(v.node.price.amount).toFixed(2)}
              </option>
            ))}
          </select>
        </Line>
      )}

      <Blank n={nextLn()} />
      <Line n={nextLn()}>
        <button
          className={styles.cmdBtn}
          onClick={handleAddToCart}
          disabled={cartLoading || !selectedVariant}
        >
          {cartLoading ? 'ADDING...' : added ? 'ADDED!' : 'ADD TO CART'}
        </button>
      </Line>
      <Blank n={nextLn()} />
    </>
  );
}
