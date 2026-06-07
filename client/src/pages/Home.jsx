import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AlbumCard from '../components/AlbumCard';
import { useAuth } from '../context/AuthContext';
import { getAlbums } from '../api';

function Home() {
  const { isAdmin, user } = useAuth();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const { data } = await getAlbums();
        setAlbums(data);
      } catch {
        setError('Không thể tải danh sách album. Hãy kiểm tra backend và database.');
      } finally {
        setLoading(false);
      }
    };

    fetchAlbums();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-white/50">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          Đang tải...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="mb-4 text-accent">{error}</p>
        <button type="button" onClick={() => window.location.reload()} className="btn-secondary">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {isAdmin ? 'Tất cả album' : 'Album của tôi'}
          </h1>
          <p className="mt-2 text-white/50">
            {isAdmin
              ? 'Quản lý album của toàn bộ thợ ảnh'
              : `Xin chào ${user?.displayName || user?.username} — quản lý album và chia sẻ link cho khách`}
          </p>
        </div>
        <Link to="/admin" className="btn-primary shrink-0">
          + Tạo album mới
        </Link>
      </div>

      {albums.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-24 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5">
            <svg className="h-10 w-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold">Chưa có album nào</h2>
          <p className="mb-6 max-w-sm text-white/50">
            Tạo album đầu tiên và thêm ảnh từ Google Drive hoặc URL
          </p>
          <Link to="/admin" className="btn-accent">
            Bắt đầu ngay
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} showOwner={isAdmin} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
