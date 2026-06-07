import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ImageGrid from '../components/ImageGrid';
import NoteModal from '../components/NoteModal';
import { useAuth } from '../context/AuthContext';
import { getAlbum, getImages, getSelectedImages, toggleImageSelection, updateImageNote } from '../api';

function Album() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();

  const [album, setAlbum] = useState(null);
  const [images, setImages] = useState([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showFileNames, setShowFileNames] = useState(false);
  const [showSelectedList, setShowSelectedList] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteImages, setFavoriteImages] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [noteModalImage, setNoteModalImage] = useState(null);

  const canManageAlbum =
    isAuthenticated &&
    album &&
    (user?.role === 'admin' || album.ownerId === user?.id);

  const fetchImages = useCallback(
    async (pageNum, append = false) => {
      const { data } = await getImages(id, pageNum);
      setImages((prev) => (append ? [...prev, ...data.images] : data.images));
      setSelectedCount(data.selectedCount);
      setHasMore(data.pagination.hasMore);
      setPage(pageNum);
    },
    [id]
  );

  const loadSelectedFiles = useCallback(async () => {
    const { data } = await getSelectedImages(id);
    setSelectedFiles(data.images || []);
    return data.images || [];
  }, [id]);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: albumData } = await getAlbum(id);
        setAlbum(albumData);
        await fetchImages(1);
      } catch {
        setError('Không tìm thấy album hoặc không thể tải dữ liệu.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [id, fetchImages]);

  useEffect(() => {
    if (showSelectedList && selectedCount > 0) {
      loadSelectedFiles();
    }
  }, [showSelectedList, selectedCount, loadSelectedFiles]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      await fetchImages(page + 1, true);
    } catch {
      /* ignore */
    } finally {
      setLoadingMore(false);
    }
  };

  const updateImageInState = useCallback((updated) => {
    setImages((prev) => prev.map((img) => (img.id === updated.id ? updated : img)));
    setFavoriteImages((prev) => {
      if (!updated.isSelected) {
        return prev.filter((img) => img.id !== updated.id);
      }
      const exists = prev.some((img) => img.id === updated.id);
      return exists
        ? prev.map((img) => (img.id === updated.id ? updated : img))
        : [...prev, updated];
    });
  }, []);

  const handleSaveNote = async (note) => {
    if (!noteModalImage) return;
    const { data } = await updateImageNote(noteModalImage.id, note);
    updateImageInState(data);
    if (showSelectedList) {
      await loadSelectedFiles();
    }
    setNoteModalImage(null);
  };

  const handleToggleFavorites = async () => {
    if (favoritesOnly) {
      setFavoritesOnly(false);
      return;
    }

    setLoadingFavorites(true);
    try {
      const selected = await loadSelectedFiles();
      setFavoriteImages(selected);
      setFavoritesOnly(true);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const handleToggle = async (imageId) => {
    const previous =
      images.find((img) => img.id === imageId) ||
      favoriteImages.find((img) => img.id === imageId);
    if (!previous) return;

    const optimistic = !previous.isSelected;
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId ? { ...img, isSelected: optimistic } : img
      )
    );
    if (favoritesOnly) {
      setFavoriteImages((prev) =>
        optimistic
          ? prev.map((img) => (img.id === imageId ? { ...img, isSelected: true } : img))
          : prev.filter((img) => img.id !== imageId)
      );
    }
    setSelectedCount((prev) => prev + (optimistic ? 1 : -1));

    try {
      const { data } = await toggleImageSelection(imageId);
      updateImageInState(data);
      if (data.isSelected) {
        setNoteModalImage(data);
      }
      if (showSelectedList) {
        await loadSelectedFiles();
      }
    } catch {
      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId ? { ...img, isSelected: previous.isSelected, clientNote: previous.clientNote } : img
        )
      );
      if (favoritesOnly && optimistic) {
        setFavoriteImages((prev) => prev.filter((img) => img.id !== imageId));
      }
      setSelectedCount((prev) => prev + (optimistic ? -1 : 1));
    }
  };

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/album/${id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(`Link chia sẻ: ${link}`);
    }
  };

  const handleDownloadSelected = async () => {
    const selected = showSelectedList
      ? selectedFiles
      : await loadSelectedFiles();

    const payload = {
      albumId: id,
      albumTitle: album?.title,
      selectedImages: selected.map((img) => ({
        id: img.id,
        fileName: img.fileName,
        url: img.url,
        clientNote: img.clientNote,
      })),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected-${album?.title || id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySelectedNames = async () => {
    const selected = selectedFiles.length ? selectedFiles : await loadSelectedFiles();
    const text = selected
      .map((img) => img.fileName || img.url)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      alert(`Đã copy ${selected.length} tên file`);
    } catch {
      alert(text);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="flex items-center gap-3 text-white/50">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          Đang tải gallery...
        </div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
        <p className="mb-4 text-accent">{error || 'Album không tồn tại'}</p>
      </div>
    );
  }

  const displayImages = favoritesOnly ? favoriteImages : images;

  return (
    <div className="min-h-screen bg-surface">
      <div className="sticky top-0 z-40 border-b border-white/5 bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold sm:text-xl">{album.title}</h1>
            {album.description && (
              <p className="truncate text-sm text-white/50">{album.description}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleToggleFavorites}
              disabled={loadingFavorites || (selectedCount === 0 && !favoritesOnly)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition sm:text-sm ${
                favoritesOnly
                  ? 'bg-accent text-white shadow-lg shadow-accent/30'
                  : selectedCount > 0
                    ? 'border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20'
                    : 'border border-white/10 bg-white/5 text-white/40'
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              {loadingFavorites
                ? 'Đang tải...'
                : favoritesOnly
                  ? 'Xem tất cả ảnh'
                  : `Ảnh đã tim (${selectedCount})`}
            </button>

            <div
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                selectedCount > 0
                  ? 'bg-accent/15 text-accent'
                  : 'bg-white/5 text-white/40'
              }`}
            >
              {selectedCount} đã chọn
            </div>

            {canManageAlbum && (
              <>
                <button
                  type="button"
                  onClick={() => setShowFileNames((v) => !v)}
                  className={`btn-secondary !px-3 !py-2 text-xs sm:text-sm ${
                    showFileNames ? '!border-accent/50 !text-accent' : ''
                  }`}
                >
                  {showFileNames ? 'Ẩn tên file' : 'Hiện tên file'}
                </button>
                {selectedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowSelectedList((v) => !v)}
                    className={`btn-secondary !px-3 !py-2 text-xs sm:text-sm ${
                      showSelectedList ? '!border-accent/50 !text-accent' : ''
                    }`}
                  >
                    Danh sách đã chọn
                  </button>
                )}
              </>
            )}

            <button type="button" onClick={handleCopyLink} className="btn-secondary !px-3 !py-2 text-xs sm:text-sm">
              {copied ? '✓ Copied' : 'Chia sẻ'}
            </button>
            {canManageAlbum && selectedCount > 0 && (
              <button
                type="button"
                onClick={handleDownloadSelected}
                className="btn-accent !px-3 !py-2 text-xs sm:text-sm"
              >
                Tải JSON
              </button>
            )}
          </div>
        </div>
      </div>

      {canManageAlbum && showSelectedList && selectedCount > 0 && (
        <div className="border-b border-white/5 bg-surface-card">
          <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-white">
                Ảnh khách đã chọn ({selectedCount})
              </h2>
              <button type="button" onClick={handleCopySelectedNames} className="btn-secondary !px-3 !py-1.5 text-xs">
                Copy tên file
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-surface p-3">
              <ul className="space-y-1.5 text-sm">
                {selectedFiles.map((img) => (
                  <li key={img.id} className="rounded-lg bg-white/5 p-2">
                    <div className="flex items-center gap-2 text-accent">
                      <span>❤️</span>
                      <span className="truncate font-medium">{img.fileName || 'Chưa có tên file'}</span>
                    </div>
                    {img.clientNote && (
                      <p className="mt-1 pl-6 text-sm text-white/70">💬 {img.clientNote}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {favoritesOnly && (
        <div className="border-b border-accent/20 bg-gradient-to-r from-accent/10 via-transparent to-accent/5">
          <div className="mx-auto max-w-[1600px] px-4 py-3 sm:px-6">
            <p className="text-center text-sm text-accent/90">
              ✨ Đang xem {favoriteImages.length} ảnh bạn đã tim — bấm tim lần nữa để bỏ chọn
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-6 sm:py-6">
        <ImageGrid
          images={displayImages}
          onToggle={handleToggle}
          onEditNote={(img) => setNoteModalImage(img)}
          galleryMode
          showFileNames={showFileNames}
          onLoadMore={favoritesOnly ? undefined : handleLoadMore}
          hasMore={favoritesOnly ? false : hasMore}
          loadingMore={loadingMore}
        />
      </div>

      {noteModalImage && (
        <NoteModal
          image={noteModalImage}
          onSave={handleSaveNote}
          onClose={() => setNoteModalImage(null)}
        />
      )}
    </div>
  );
}

export default Album;
