import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import TheDepTraiModal from '../components/TheDepTraiModal';
import { register as registerApi } from '../api';
import { useAuth } from '../context/AuthContext';

function Register() {
  const { completeAuth, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [pendingAuth, setPendingAuth] = useState(null);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const finishRegister = (data) => {
    completeAuth(data);
    setShowGate(false);
    setPendingAuth(null);
    navigate('/', { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await registerApi({
        username: username.trim(),
        password,
        displayName: displayName.trim() || username.trim(),
      });
      setPendingAuth(data);
      setShowGate(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <div className="w-full max-w-md animate-fade-in rounded-2xl border border-white/10 bg-surface-card p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
              <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Đăng ký thợ ảnh</h1>
            <p className="mt-2 text-sm text-white/50">
              Tạo tài khoản để quản lý album riêng. Khách xem ảnh không cần đăng ký.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">Tên đăng nhập *</label>
              <input
                type="text"
                className="input-field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="vd: studio_minh"
                autoComplete="username"
                required
              />
              <p className="mt-1 text-xs text-white/40">Chữ thường, số và dấu _</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">Tên hiển thị</label>
              <input
                type="text"
                className="input-field"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="VD: Studio Ảnh Minh"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">Mật khẩu *</label>
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                autoComplete="new-password"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">Xác nhận mật khẩu *</label>
              <input
                type="password"
                className="input-field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                autoComplete="new-password"
                required
              />
            </div>

            <button type="submit" className="btn-accent w-full" disabled={submitting}>
              {submitting ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/50">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-medium text-accent hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>

      <TheDepTraiModal
        open={showGate}
        onConfirm={() => pendingAuth && finishRegister(pendingAuth)}
      />
    </>
  );
}

export default Register;
