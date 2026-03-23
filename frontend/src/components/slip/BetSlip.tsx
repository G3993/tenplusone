import { useState, useEffect } from 'react';
import { useSlipStore } from '../../stores/slip';
import { fetchProducts, type ShopifyProduct } from '../../lib/shopify';
import { placeWager } from '../../lib/api';
import { Line, Blank, useLineCounter } from '../layout/Line';
import styles from './BetSlip.module.css';

function pickLabel(pick: string, homeTeam: string, awayTeam: string) {
  if (pick === 'home') return homeTeam;
  if (pick === 'away') return awayTeam;
  return 'draw';
}

export function BetSlip() {
  const nextLn = useLineCounter();
  const bets = useSlipStore((s) => s.bets);
  const removeBet = useSlipStore((s) => s.removeBet);
  const setWager = useSlipStore((s) => s.setWager);
  const clear = useSlipStore((s) => s.clear);

  // Fetch products from Shopify (or mock fallback) for wager dropdown
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => {
        // Products will remain empty; wager dropdown shows no options
      });
  }, []);

  const [email, setEmail] = useState(() => localStorage.getItem('tenplusone-email') || '');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (email) localStorage.setItem('tenplusone-email', email);
  }, [email]);

  async function handleSubmit() {
    if (!email || bets.length === 0) return;
    setSubmitting(true);
    setMessage(null);

    const errors: string[] = [];
    let placed = 0;

    for (const bet of bets) {
      try {
        await placeWager({
          email,
          matchId: bet.matchId,
          pick: bet.pick,
          productId: bet.wager || undefined,
        });
        placed++;
      } catch (e) {
        errors.push(`${bet.homeTeam} vs ${bet.awayTeam}: ${(e as Error).message}`);
      }
    }

    setSubmitting(false);

    if (errors.length === 0) {
      setMessage({ type: 'success', text: `Predictions placed! (${placed})` });
      clear();
    } else if (placed > 0) {
      setMessage({ type: 'error', text: `${placed} placed, ${errors.length} failed: ${errors.join('; ')}` });
    } else {
      setMessage({ type: 'error', text: errors.join('; ') });
    }
  }

  return (
    <>
      <Line n={nextLn()}><span className="comment"># your bet slip</span></Line>
      <Line n={nextLn()}><span className="comment"># select merch to wager on each pick</span></Line>
      <Blank n={nextLn()} />

      {bets.length === 0 ? (
        <>
          <Line n={nextLn()}><span className="dim">no bets yet.</span></Line>
          <Line n={nextLn()}><span className="dim">go to matches tab, click odds to add bets.</span></Line>
        </>
      ) : (
        <>
          {bets.map((b, i) => {
            // Use first variant ID as wager value
            const selectedProduct = products.find((p) =>
              p.variants.edges.some((v) => v.node.id === b.wager)
            );
            void selectedProduct; // referenced for future use

            return (
              <div key={b.matchId}>
                <Line n={nextLn()}>
                  <span className="bright">bet {i + 1}</span>
                  <button className={styles.rmBtn} onClick={() => removeBet(b.matchId)}>[remove]</button>
                </Line>
                <Line n={nextLn()}>
                  <span className="bright">{b.homeTeam}</span>
                  <span className="dim"> vs </span>
                  <span className="bright">{b.awayTeam}</span>
                </Line>
                <Line n={nextLn()}>
                  <span className="dim">pick: </span>
                  <span className="bright">
                    {pickLabel(b.pick, b.homeTeam, b.awayTeam)} @ {b.odds.toFixed(2)}
                  </span>
                </Line>
                <Line n={nextLn()} className={styles.inputLine}>
                  <span className="dim">wager: </span>
                  <select
                    className={styles.slipSelect}
                    value={b.wager}
                    onChange={(e) => setWager(b.matchId, e.target.value)}
                  >
                    <option value="">select merch...</option>
                    {products.map((p) => {
                      const variantId = p.variants.edges[0]?.node.id ?? '';
                      const price = parseFloat(p.priceRange.minVariantPrice.amount).toFixed(2);
                      return (
                        <option key={p.id} value={variantId}>
                          {p.title} (${price})
                        </option>
                      );
                    })}
                  </select>
                </Line>
                <Blank n={nextLn()} />
              </div>
            );
          })}

          <Line n={nextLn()}><span className="comment"># ---------------------------------</span></Line>
          <Line n={nextLn()}>
            <span className="dim">total bets: </span>
            <span className="bright">{bets.length}</span>
            <span className="dim">  merch wagered: </span>
            <span className="bright">{bets.filter((b) => b.wager).length}</span>
          </Line>
          <Blank n={nextLn()} />

          <Line n={nextLn()} className={styles.inputLine}>
            <span className="dim">email: </span>
            <input
              type="email"
              className={styles.slipSelect}
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Line>
          <Blank n={nextLn()} />

          <Line n={nextLn()}>
            <button
              className={styles.cmdBtn}
              disabled={submitting || !email}
              onClick={handleSubmit}
            >
              {submitting ? 'placing...' : `place ${bets.length} prediction${bets.length > 1 ? 's' : ''}`}
            </button>
          </Line>

          {message && (
            <Line n={nextLn()}>
              <span className={message.type === 'success' ? 'bright' : 'dim'}>
                {message.text}
              </span>
            </Line>
          )}

          <Blank n={nextLn()} />
          <Line n={nextLn()}>
            <button className={styles.rmBtn} onClick={clear}>[clear all]</button>
          </Line>
        </>
      )}

      <Blank n={nextLn()} />
      <Line n={nextLn()} className="cursor-line"><span className="cursor" /></Line>
    </>
  );
}
