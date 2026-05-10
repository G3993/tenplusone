import { Link } from 'react-router';
import { Line } from '../layout/Line';
import { MerchIcon, merchKindFor } from './MerchIcon';
import type { ShopifyProduct } from '../../lib/shopify';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: ShopifyProduct;
  ln: () => number;
}

export function ProductCard({ product, ln }: ProductCardProps) {
  const price = parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2);
  const kind = merchKindFor(`${product.title} ${product.handle}`);

  return (
    <Link to={`/merch/${product.handle}`} className={styles.card}>
      <Line n={ln()}>
        <span className={styles.icon}>
          <MerchIcon kind={kind} size={64} />
        </span>
      </Line>
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
