import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Album from './pages/Album';
import Admin from './pages/Admin';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

function AppShell({ children }) {
  const { pathname } = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const isGallery = pathname.startsWith('/album/');
  const isLogin = pathname === '/login';

  if (isGallery || isLogin) {
    return <div className="min-h-screen bg-surface">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to={isAuthenticated ? '/' : '/login'} className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight sm:text-base">
              Photo Selection
            </span>
          </Link>

          {isAuthenticated ? (
            <nav className="flex items-center gap-2 sm:gap-3">
              <span className="hidden text-xs text-white/40 sm:inline">{user?.username}</span>
              <Link to="/" className="btn-secondary !px-4 !py-2 text-xs sm:text-sm">
                Albums
              </Link>
              <Link to="/admin" className="btn-primary !px-4 !py-2 text-xs sm:text-sm">
                Quản lý
              </Link>
              <button type="button" onClick={logout} className="btn-secondary !px-4 !py-2 text-xs sm:text-sm">
                Đăng xuất
              </button>
            </nav>
          ) : (
            <Link to="/login" className="btn-primary !px-4 !py-2 text-xs sm:text-sm">
              Đăng nhập
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route path="/album/:id" element={<Album />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AppShell>
  );
}

export default App;
