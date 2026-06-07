import { Link } from 'react-router-dom';

function AlbumCard({ album, showOwner = false }) {
  const date = new Date(album.createdAt).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Link
      to={`/album/${album.id}`}
      className="group block overflow-hidden rounded-2xl border border-white/10 bg-surface-card transition duration-300 hover:border-white/20 hover:shadow-2xl hover:shadow-black/40"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-elevated">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-accent/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm transition group-hover:scale-110">
            <svg className="h-8 w-8 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="p-5">
        <h3 className="mb-1 truncate text-lg font-semibold text-white group-hover:text-white">
          {album.title}
        </h3>
        {album.description && (
          <p className="mb-3 line-clamp-2 text-sm text-white/50">{album.description}</p>
        )}
        {showOwner && album.ownerName && (
          <p className="mb-2 text-xs text-accent/80">Thợ ảnh: {album.ownerName}</p>
        )}
        <div className="flex items-center justify-between text-xs text-white/40">
          <span>{date}</span>
          <span>
            {album.imageCount ?? 0} ảnh · {album.selectedCount ?? 0} đã chọn
          </span>
        </div>
      </div>
    </Link>
  );
}

export default AlbumCard;
