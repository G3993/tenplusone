import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Nav } from './components/layout/Nav';
import { Editor } from './components/layout/Editor';
import { Matches } from './pages/Matches';
import { Groups } from './pages/Groups';
import { BetSlipPage } from './pages/BetSlipPage';
import { Merch } from './pages/Merch';
import ProductDetail from './pages/ProductDetail';
import { useCartStore } from './stores/cart';

export function App() {
  useEffect(() => {
    useCartStore.getState().restoreCart();
  }, []);

  return (
    <BrowserRouter>
      <Nav />
      <Editor>
        <Routes>
          <Route path="/" element={<Navigate to="/matches" replace />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/slip" element={<BetSlipPage />} />
          <Route path="/merch" element={<Merch />} />
          <Route path="/merch/:handle" element={<ProductDetail />} />
        </Routes>
      </Editor>
    </BrowserRouter>
  );
}
