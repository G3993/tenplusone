import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router';
import { Nav } from './components/layout/Nav';
import { Editor } from './components/layout/Editor';
import { PitchBackground } from './components/layout/PitchBackground';
import { Landing } from './pages/Landing';
import { Matches } from './pages/Matches';
import { Groups } from './pages/Groups';
import { Bracket } from './pages/Bracket';
import { Outrights } from './pages/Outrights';
import { BetSlipPage } from './pages/BetSlipPage';
import { Merch } from './pages/Merch';
import ProductDetail from './pages/ProductDetail';
import { Team } from './pages/Team';
import { MatchDetail } from './pages/MatchDetail';
import { AdminGenerate } from './pages/AdminGenerate';
import { useCartStore } from './stores/cart';

// Pitch outline shows on the landing page and the matches list.
function HomePitch() {
  const { pathname } = useLocation();
  return pathname === '/' || pathname === '/matches' ? <PitchBackground /> : null;
}

export function App() {
  useEffect(() => {
    useCartStore.getState().restoreCart();
  }, []);

  return (
    <BrowserRouter>
      <HomePitch />
      <Nav />
      <Editor>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/bracket" element={<Bracket />} />
          <Route path="/outrights" element={<Outrights />} />
          <Route path="/slip" element={<BetSlipPage />} />
          <Route path="/merch" element={<Merch />} />
          <Route path="/merch/:handle" element={<ProductDetail />} />
          <Route path="/team/:slug" element={<Team />} />
          <Route path="/match/:id" element={<MatchDetail />} />
          <Route path="/admin/generate/:matchId" element={<AdminGenerate />} />
        </Routes>
      </Editor>
    </BrowserRouter>
  );
}
