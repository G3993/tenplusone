import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router';
import { Analytics } from '@vercel/analytics/react';
import { Nav } from './components/layout/Nav';
import { Footer } from './components/layout/Footer';
import { FooterBottom } from './components/layout/FooterBottom';
import { Editor } from './components/layout/Editor';
import { Home } from './pages/Home';
import { useCartStore } from './stores/cart';

// Code-split everything off the landing path. Home stays eager so the
// first paint never waits on a network chunk.
const WC26 = lazy(() => import('./pages/WC26').then((m) => ({ default: m.WC26 })));
const Teams = lazy(() => import('./pages/Teams').then((m) => ({ default: m.Teams })));
const BetSlipPage = lazy(() => import('./pages/BetSlipPage').then((m) => ({ default: m.BetSlipPage })));
const Merch = lazy(() => import('./pages/Merch').then((m) => ({ default: m.Merch })));
const Logos = lazy(() => import('./pages/Logos').then((m) => ({ default: m.Logos })));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Team = lazy(() => import('./pages/Team').then((m) => ({ default: m.Team })));
const MatchDetail = lazy(() => import('./pages/MatchDetail').then((m) => ({ default: m.MatchDetail })));
const AdminGenerate = lazy(() => import('./pages/AdminGenerate').then((m) => ({ default: m.AdminGenerate })));
const RenderCrest = lazy(() => import('./pages/RenderCrest').then((m) => ({ default: m.RenderCrest })));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const About = lazy(() => import('./pages/About'));
const Shipping = lazy(() => import('./pages/Shipping'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Contact = lazy(() => import('./pages/Contact'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageFallback() {
  return (
    <div style={{ padding: '40px 24px', color: 'var(--dim)', fontSize: 13 }}>
      loading…
    </div>
  );
}

/** Jump to the top of the page on every route change so navigating into a
 *  team / product / match always starts at the hero, not mid-scroll. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  useEffect(() => {
    useCartStore.getState().restoreCart();
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
      <Analytics />
    </BrowserRouter>
  );
}
