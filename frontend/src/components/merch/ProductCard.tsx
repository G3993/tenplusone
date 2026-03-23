import { Link } from 'react-router';
import { Line } from '../layout/Line';
import type { ShopifyProduct } from '../../lib/shopify';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: ShopifyProduct;
  ln: () => number;
}

export function ProductCard({ product, ln }: ProductCardProps) {
  const price = parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2);

  return (
    <Link to={`/merch/${product.handle}`} className={styles.card}>
      <Line n={ln()}>
        <span className={styles.title}>{product.title}</span>
      </Line>
      <Line n={ln()}>
        <span className="dim">${price}</span>
      </Line>
      <Line n={ln()}>
        <span className="dim">{product.description}</span>
      </Line>
    </Link>
  );
}
