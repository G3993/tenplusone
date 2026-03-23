import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Nav } from './components/layout/Nav';
import { Editor } from './components/layout/Editor';
import { Matches } from './pages/Matches';
import { Groups } from './pages/Groups';
import { BetSlipPage } from './pages/BetSlipPage';

function MerchPlaceholder() {
  return <div className="dim" style={{ padding: '40px 24px' }}>Merch coming soon</div>;
}

function ProductPlaceholder() {
  return <div className="dim" style={{ padding: '40px 24px' }}>Product detail coming soon</div>;
}

export function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Editor>
        <Routes>
          <Route path="/" element={<Navigate to="/matches" replace />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/slip" element={<BetSlipPage />} />
          <Route path="/merch" element={<MerchPlaceholder />} />
          <Route path="/merch/:handle" element={<ProductPlaceholder />} />
        </Routes>
      </Editor>
    </BrowserRouter>
  );
}
