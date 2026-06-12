import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router';
import { Analytics } from '@vercel/analytics/react';
import { Nav } from './components/layout/Nav';
import { Footer } from './components/layout/Footer';
import { FooterBottom } from './components/layout/FooterBottom';
import { Editor } from './components/layout/Editor';
import { CartDrawer } from './components/merch/CartDrawer';
import { Home } from './pages/Home';
import { useCartStore } from './stores/cart';
import { fetchProducts } from './lib/shopify';

// Code-split everything off the landing path. Home stays eager so the
// first paint never waits on a network chunk. Each chunk is a named loader so
// it can be BOTH lazy-mounted and prefetched on idle/hover (see warmRoutes) —
// that way the first navigation to a route doesn't pay a cold network fetch.
const load = {
  WC26: () => import('./pages/WC26'),
  Teams: () => import('./pages/Teams'),
  BetSlipPage: () => import('./pages/BetSlipPage'),
  Merch: () => import('./pages/Merch'),
  Logos: () => import('./pages/Logos'),
  Play: () => import('./pages/Play'),
  ProductDetail: () => import('./pages/ProductDetail'),
  Team: () => import('./pages/Team'),
  MatchDetail: () => import('./pages/MatchDetail'),
  AdminGenerate: () => import('./pages/AdminGenerate'),
  RenderCrest: () => import('./pages/RenderCrest'),
  Privacy: () => import('./pages/Privacy'),
  Terms: () => import('./pages/Terms'),
  About: () => import('./pages/About'),
  Shipping: () => import('./pages/Shipping'),
  FAQ: () => import('./pages/FAQ'),
  Contact: () => import('./pages/Contact'),
  NotFound: () => import('./pages/NotFound'),
};

const WC26 = lazy(() => load.WC26().then((m) => ({ default: m.WC26 })));
const Teams = lazy(() => load.Teams().then((m) => ({ default: m.Teams })));
const BetSlipPage = lazy(() => load.BetSlipPage().then((m) => ({ default: m.BetSlipPage })));
const Merch = lazy(() => load.Merch().then((m) => ({ default: m.Merch })));
const Logos = lazy(() => load.Logos().then((m) => ({ default: m.Logos })));
const Play = lazy(() => load.Play().then((m) => ({ default: m.Play })));
const ProductDetail = lazy(load.ProductDetail);
const Team = lazy(() => load.Team().then((m) => ({ default: m.Team })));
const MatchDetail = lazy(() => load.MatchDetail().then((m) => ({ default: m.MatchDetail })));
const AdminGenerate = lazy(() => load.AdminGenerate().then((m) => ({ default: m.AdminGenerate })));
const RenderCrest = lazy(() => load.RenderCrest().then((m) => ({ default: m.RenderCrest })));
const Privacy = lazy(load.Privacy);
const Terms = lazy(load.Terms);
const About = lazy(load.About);
const Shipping = lazy(load.Shipping);
const FAQ = lazy(load.FAQ);
const Contact = lazy(load.Contact);
const NotFound = lazy(load.NotFound);

// Prefetch the high-traffic route chunks once the landing page is idle, so the
// first click into them resolves instantly instead of fetching a cold chunk.
function warmRoutes() {
  load.WC26(); load.Team(); load.MatchDetail(); load.Merch(); load.ProductDetail(); load.Teams();
  // Warm the shop catalog into the session cache too — match/team closets
  // then render instantly instead of waiting on /api/products at scroll time.
  fetchProducts().catch(() => {});
}

function PageFallback() {
  // Layout-stable, low-key — keeps the viewport from collapsing/flashing on the
  // rare cold transition (most are prewarmed, so this seldom shows).
  return <div style={{ minHeight: '60vh' }} aria-busy="true" />;
}

/** Jump to the top of the page on every route change so navigating into a
 *  team / product / match always starts at the hero, not mid-scroll. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Take over scroll restoration so mobile browsers don't re-apply the list
    // page's scroll position after the new route's content mounts.
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    const toTop = () => {
      // 'instant' overrides the global `html { scroll-behavior: smooth }`,
      // which otherwise animates this jump and gets cut off mid-scroll on
      // mobile when the lazy route content lands.
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    toTop();
    // Again on the next frame — after the lazy route's real content replaces
    // the Suspense fallback and the document regains its height.
    const raf = requestAnimationFrame(toTop);
    return () => cancelAnimationFrame(raf);
  }, [pathname]);
  return null;
}

export function App() {
  useEffect(() => {
    useCartStore.getState().restoreCart();
  }, []);

  // Warm common route chunks during idle time after first paint.
  useEffect(() => {
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    if (ric) { const id = ric(warmRoutes, { timeout: 3000 }); return () => (window as unknown as { cancelIdleCallback?: (n: number) => void }).cancelIdleCallback?.(id); }
    const t = setTimeout(warmRoutes, 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Nav />
      <Editor>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/wc26" element={<WC26 />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/slip" element={<BetSlipPage />} />
            <Route path="/merch" element={<Merch />} />
            <Route path="/shop" element={<Merch />} />
            <Route path="/merch/:handle" element={<ProductDetail />} />
            <Route path="/logos" element={<Logos />} />
            <Route path="/play" element={<Play />} />
            <Route path="/team/:slug" element={<Team />} />
            <Route path="/match/:id" element={<MatchDetail />} />
            <Route path="/admin/generate/:matchId" element={<AdminGenerate />} />
            <Route path="/render/crest/:slug" element={<RenderCrest />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/about" element={<About />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            {/* legacy routes → consolidated tournament page */}
            <Route path="/matches" element={<WC26 />} />
            <Route path="/groups" element={<WC26 />} />
            <Route path="/bracket" element={<WC26 />} />
            <Route path="/outrights" element={<WC26 />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Editor>
      <Footer />
      <FooterBottom />
      <CartDrawer />
      <Analytics />
    </BrowserRouter>
  );
}
