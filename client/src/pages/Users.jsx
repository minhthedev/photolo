import { useEffect, useState } from 'react';
import { createPhotographer, getPhotographers } from '../api';

function Users() {
  const [photographers, setPhotographers] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadPhotographers = async () => {
    const { data } = await getPhotographers();
    setPhotographers(data);
  };

  useEffect(() => {
    loadPhotographers()
      .catch(() => setError('Không thể tải danh sách thợ ảnh.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await createPhotographer({
        username: username.trim(),
        password,
        displayName: displayName.trim() || username.trim(),
      });
      setUsername('');
      setPassword('');
      setDisplayName('');
      setSuccess('Đã tạo tài khoản thợ ảnh.');
      await loadPhotographers();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tạo tài khoản.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Quản lý thợ ảnh</h1>
        <p className="mt-2 text-white/50">
          Tạo tài khoản để thợ ảnh đăng nhập và quản lý album riêng của họ
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-surface-card p-6 sm:p-8">
          <h2 className="mb-6 text-xl font-semibold">Tạo tài khoản mới</h2>

          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}
          {success && (
            <div className="mb-4 rounded-xl bg-green-500/10 px-4 py-3 text-sm text-green-400">{success}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">Tên đăng nhập *</label>
              <input
                type="text"
                className="input-field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="vd: thoanh01"
                required
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
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">Tên hiển thị</label>
              <input
                type="text"
                className="input-field"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="VD: Studio Anh Minh"
              />
            </div>

            <button type="submit" className="btn-accent w-full" disabled={submitting}>
              {submitting ? 'Đang tạo...' : 'Tạo tài khoản thợ ảnh'}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-white/10 bg-surface-card p-6 sm:p-8">
          <h2 className="mb-6 text-xl font-semibold">
            Danh sách thợ ảnh ({photographers.length})
          </h2>

          {photographers.length === 0 ? (
            <p className="text-white/50">Chưa có thợ ảnh nào.</p>
          ) : (
            <ul className="space-y-3">
              {photographers.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{p.displayName}</p>
                    <p className="text-sm text-white/40">@{p.username}</p>
                  </div>
                  <span className="text-sm text-white/50">{p.albumCount ?? 0} album</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default Users;
