import { lazy, Suspense, useEffect } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import Catalogue from './pages/Catalogue';
import TechniquePage from './pages/Technique';
import About from './pages/About';
import Papers from './pages/Papers';
import ThemeToggle from './ThemeToggle';

// The 3D graph pulls in three.js, so it loads only when someone opens it.
const GraphPage = lazy(() => import('./pages/Graph'));
import { REPO_URL, getTechnique } from './lib/data';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

declare global {
  interface Window {
    goatcounter?: { count: (vars: { path: string; title?: string }) => void };
  }
}

// The site uses hash routes, so GoatCounter would see every page as the same URL. Count each route ourselves.
// Keep the browser tab title in step with the page (the build writes the same titles into each page's HTML).
function PageTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const m = pathname.match(/^\/technique\/([^/]+)/);
    const name = m ? getTechnique(m[1])?.name : null;
    const titles: Record<string, string> = {
      '/graph': 'Graphs',
      '/papers': 'Papers',
      '/about': 'About',
    };
    const page = name ?? titles[pathname];
    document.title = page ? `${page} · 3D Selection Vault` : '3D Selection Vault';
  }, [pathname]);
  return null;
}

function CountPageView() {
  const { pathname, search } = useLocation();
  // Filters and selections change the query string; only a new page or graph view counts as a visit.
  const view = pathname === '/graph' ? new URLSearchParams(search).get('view') : null;
  const path = pathname + (view ? `/${view}` : '');
  useEffect(() => {
    let tries = 0;
    const send = () => {
      if (window.goatcounter?.count) window.goatcounter.count({ path, title: document.title });
      else if (tries++ < 20) setTimeout(send, 250);
    };
    send();
  }, [path]);
  return null;
}

export default function App() {
  return (
    <div className="shell">
      <ScrollToTop />
      <PageTitle />
      <CountPageView />
      <header className="site-header">
        <Link to="/" className="brand" aria-label="3D Selection Vault home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path d="M2 7V2h5M17 2h5v5M22 17v5h-5M7 22H2v-5" fill="none" stroke="currentColor" strokeWidth="1.7" />
              <path d="M12 6l5.2 3-5.2 3-5.2-3z" fill="#6f9fe6" />
              <path
                d="M12 6l5.2 3v6L12 18l-5.2-3V9z M6.8 9 12 12l5.2-3M12 12v6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>3D Selection Vault</span>
        </Link>
        <nav className="site-nav" aria-label="Main">
          <NavLink to="/" end>
            Techniques
          </NavLink>
          <NavLink to="/graph">Graphs</NavLink>
          <NavLink to="/papers">Papers</NavLink>
          <NavLink to="/about">About</NavLink>
        </nav>
        <div className="header-actions">
          <a className="nav-cta" href={`${REPO_URL}/issues/new/choose`} target="_blank" rel="noreferrer">
            <span className="long">Suggest a technique</span>
            <span className="short">Suggest</span>
          </a>
          <ThemeToggle />
        </div>
      </header>
      <main className="site-main">
        <Routes>
          <Route path="/" element={<Catalogue />} />
          <Route path="/technique/:id" element={<TechniquePage />} />
          <Route
            path="/graph"
            element={
              <Suspense fallback={<p className="muted">Loading the graph…</p>}>
                <GraphPage />
              </Suspense>
            }
          />
          <Route path="/papers" element={<Papers />} />
          <Route path="/about" element={<About />} />
          <Route
            path="*"
            element={
              <div className="empty">
                <h1>Page not found</h1>
                <p>
                  <Link to="/">Back to all techniques</Link>
                </p>
              </div>
            }
          />
        </Routes>
      </main>
      <footer className="site-footer">
        <span>
          Turkmen and Batmaz, 2026 · Open data under MIT · Visits are counted anonymously, without cookies
        </span>
      </footer>
    </div>
  );
}
