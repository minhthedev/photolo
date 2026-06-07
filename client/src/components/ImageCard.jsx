import { useState } from 'react';

function getFallbackUrl(url) {
  const match = url.match(/\/proxy\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1200`;
  }
  return url;
}

function ImageCard({
  image,
  onToggle,
  onEditNote,
  galleryMode = false,
  showFileNames = false,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [src, setSrc] = useState(image.url);
  const [hasError, setHasError] = useState(false);
  const selected = image.isSelected;

  const handleToggle = (e) => {
    e.stopPropagation();
    onToggle(image.id);
  };

  const handleError = () => {
    const fallback = getFallbackUrl(image.url);
    if (src !== fallback) {
      setSrc(fallback);
      return;
    }
    setHasError(true);
    setIsLoading(false);
  };

  return (
    <div className={`flex flex-col transition-all duration-500 ${selected ? 'animate-scale-in' : ''}`}>
      <div
        className={`group relative aspect-[3/4] overflow-hidden rounded-2xl transition-all duration-500 ${
          selected
            ? 'scale-[1.02] shadow-[0_0_40px_rgba(255,59,92,0.35)] ring-2 ring-accent/80 animate-glow-pulse'
            : 'ring-1 ring-white/10 hover:ring-white/25 hover:shadow-xl hover:shadow-black/40'
        } ${galleryMode ? 'cursor-pointer' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={galleryMode ? handleToggle : undefined}
      >
        {selected && (
          <>
            <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-accent/30 via-transparent to-accent/10" />
            <div className="pointer-events-none absolute inset-0 z-[1] ring-1 ring-inset ring-white/20" />
            <div className="pointer-events-none absolute left-0 top-0 z-[2] h-8 w-8 border-l-2 border-t-2 border-accent/80" />
            <div className="pointer-events-none absolute bottom-0 right-0 z-[2] h-8 w-8 border-b-2 border-r-2 border-accent/80" />
          </>
        )}

        {isLoading && !hasError && (
          <div className="absolute inset-0 animate-pulse bg-surface-elevated" />
        )}

        {hasError ? (
          <div className="flex h-full w-full flex-col items-center justify-center bg-surface-elevated p-3 text-center">
            <svg className="mb-2 h-8 w-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-white/40">Không tải được ảnh</span>
          </div>
        ) : (
          <img
            src={src}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={() => setIsLoading(false)}
            onError={handleError}
            className={`h-full w-full object-cover transition-all duration-500 ${
              selected
                ? 'scale-[1.04] brightness-105 saturate-110'
                : isHovered
                  ? 'scale-[1.03]'
                  : 'scale-100'
            }`}
          />
        )}

        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            selected
              ? 'bg-gradient-to-b from-black/10 via-transparent to-black/40 opacity-100'
              : isHovered
                ? 'bg-black/30 opacity-100'
                : 'opacity-0'
          }`}
        />

        <button
          type="button"
          onClick={handleToggle}
          aria-label={selected ? 'Bỏ chọn' : 'Chọn ảnh'}
          className={`absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all duration-300 sm:right-3 sm:top-3 sm:h-10 sm:w-10 ${
            selected
              ? 'scale-110 bg-accent shadow-lg shadow-accent/50 animate-heart-pop'
              : 'bg-black/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
          }`}
        >
          {selected ? (
            <svg className="h-5 w-5 text-white drop-shadow" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              />
            </svg>
          )}
        </button>

        {selected && (
          <div className="absolute bottom-3 left-3 right-12 z-10 flex flex-col gap-1">
            <div className="flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
              <span className="text-accent">❤</span>
              <span>Đã chọn</span>
            </div>
            {image.clientNote && (
              <p className="line-clamp-2 rounded-lg bg-black/50 px-2 py-1 text-[11px] leading-snug text-white/90 backdrop-blur-md">
                💬 {image.clientNote}
              </p>
            )}
          </div>
        )}

        {selected && onEditNote && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditNote(image);
            }}
            className="absolute bottom-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/50 text-sm backdrop-blur-md transition hover:bg-accent/80"
            aria-label="Sửa ghi chú"
          >
            💬
          </button>
        )}
      </div>

      {showFileNames && (
        <p
          className={`mt-2 truncate px-0.5 text-xs ${
            selected ? 'font-semibold text-accent' : 'text-white/50'
          }`}
          title={image.fileName || ''}
        >
          {selected && '❤️ '}
          {image.fileName || 'Chưa có tên file'}
        </p>
      )}
    </div>
  );
}

export default ImageCard;
