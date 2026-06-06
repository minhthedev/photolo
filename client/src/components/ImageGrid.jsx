import { useEffect, useRef, useCallback } from 'react';
import ImageCard from './ImageCard';

function ImageGrid({
  images,
  onToggle,
  onEditNote,
  galleryMode = false,
  showFileNames = false,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
}) {
  const observerRef = useRef(null);
  const loadMoreRef = useRef(onLoadMore);

  loadMoreRef.current = onLoadMore;

  const handleObserver = useCallback(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loadingMore) {
        loadMoreRef.current?.();
      }
    },
    [hasMore, loadingMore]
  );

  useEffect(() => {
    if (!onLoadMore) return undefined;

    const node = observerRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '200px',
      threshold: 0,
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [handleObserver, onLoadMore, images.length]);

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
          <svg className="h-8 w-8 text-accent/60" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
        <p className="text-white/50">Chưa có ảnh nào ở đây</p>
      </div>
    );
  }

  return (
    <>
      <div className="photo-grid animate-fade-in">
        {images.map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            onToggle={onToggle}
            onEditNote={onEditNote}
            galleryMode={galleryMode}
            showFileNames={showFileNames}
          />
        ))}
      </div>

      {onLoadMore && (
        <div ref={observerRef} className="flex justify-center py-8">
          {loadingMore && (
            <div className="flex items-center gap-2 text-sm text-white/50">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              Đang tải thêm...
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default ImageGrid;
