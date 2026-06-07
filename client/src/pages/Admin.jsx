import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageGrid from '../components/ImageGrid';
import { useAuth } from '../context/AuthContext';
import { addImage, createAlbum, deleteAlbum, getAlbum, getAlbums, syncDriveImages, updateAlbum } from '../api';

function Admin() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [albums, setAlbums] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [selectedAlbumId, setSelectedAlbumId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [syncMessage, setSyncMessage] = useState('');
  const [showFileNames, setShowFileNames] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDriveLink, setEditDriveLink] = useState('');

  const refreshAlbums = async () => {
    const { data } = await getAlbums();
    setAlbums(data);
    return data;
  };

  const refreshImages = async (albumId) => {
    if (!albumId) {
      setImages([]);
      setSelectedCount(0);
      return;
    }
    const { data } = await getAlbum(albumId);
    setImages(data.images || []);
    setSelectedCount(data.selectedCount ?? 0);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const data = await refreshAlbums();
        if (data.length > 0) {
          setSelectedAlbumId(data[0].id);
          await refreshImages(data[0].id);
          setActiveTab('manage');
        }
      } catch {
        /* backend may be offline */
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const selectedAlbum = albums.find((a) => a.id === selectedAlbumId);

  useEffect(() => {
    const album = albums.find((a) => a.id === selectedAlbumId);
    if (album) {
      setEditTitle(album.title);
      setEditDescription(album.description || '');
      setEditDriveLink(album.driveLink || '');
    }
  }, [selectedAlbumId, albums]);

  const showSyncResult = (syncResult) => {
    if (!syncResult) return;
    if (syncResult.syncStarted) {
      setSyncMessage(syncResult.message);
      return;
    }
    if (syncResult.error) {
      setSyncMessage(`Lỗi đồng bộ: ${syncResult.message}`);
    } else {
      setSyncMessage(syncResult.message || `Đã thêm ${syncResult.added} ảnh từ Drive`);
    }
  };

  const pollSyncProgress = async (albumId) => {
    let prevCount = 0;
    let stableRounds = 0;

    for (let i = 0; i < 90; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await refreshAlbums();
      const { data } = await getAlbum(albumId);
      const count = data.images?.length || 0;
      setImages(data.images || []);
      setSelectedCount(data.selectedCount ?? 0);

      if (count > 0) {
        setSyncMessage(`Đang đồng bộ... ${count} ảnh`);
      }

      if (count === prevCount) {
        stableRounds += 1;
        if (stableRounds >= 2) {
          setSyncMessage(count > 0 ? `Đồng bộ xong: ${count} ảnh` : 'Đồng bộ xong.');
          return;
        }
      } else {
        stableRounds = 0;
        prevCount = count;
      }
    }

    setSyncMessage('Đồng bộ vẫn đang chạy. Refresh trang nếu chưa thấy đủ ảnh.');
  };

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setSyncMessage('');
    try {
      const { data } = await createAlbum({
        title: title.trim(),
        description: description.trim(),
        drive_link: driveLink.trim() || null,
      });

      setTitle('');
      setDescription('');
      setDriveLink('');

      await refreshAlbums();
      setSelectedAlbumId(data.id);
      setActiveTab('manage');
      showSyncResult(data.syncResult);

      if (data.syncResult?.syncStarted) {
        pollSyncProgress(data.id);
      } else {
        await refreshImages(data.id);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể tạo album. Kiểm tra backend và DATABASE_URL.';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddImage = async (e) => {
    e.preventDefault();
    if (!selectedAlbumId || !imageUrl.trim()) return;

    setSubmitting(true);
    try {
      await addImage(selectedAlbumId, imageUrl.trim());
      setImageUrl('');
      await refreshImages(selectedAlbumId);
      await refreshAlbums();
    } catch {
      alert('Không thể thêm ảnh.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAlbumChange = async (e) => {
    const albumId = e.target.value;
    setSelectedAlbumId(albumId);
    await refreshImages(albumId);
  };

  const handleCopyLink = async () => {
    if (!selectedAlbumId) return;
    const link = `${window.location.origin}/album/${selectedAlbumId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(`Link chia sẻ: ${link}`);
    }
  };

  const handleOpenGallery = () => {
    if (selectedAlbumId) {
      navigate(`/album/${selectedAlbumId}`);
    }
  };

  const handleSyncDrive = async () => {
    if (!selectedAlbumId) return;
    setSubmitting(true);
    setSyncMessage('');
    try {
      const { data } = await syncDriveImages(selectedAlbumId);
      showSyncResult(data);
      await refreshImages(selectedAlbumId);
      await refreshAlbums();
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể đồng bộ từ Google Drive.';
      setSyncMessage(`Lỗi: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAlbum = async (e) => {
    e.preventDefault();
    if (!selectedAlbumId || !editTitle.trim()) return;

    setSubmitting(true);
    setSyncMessage('');
    try {
      await updateAlbum(selectedAlbumId, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        drive_link: editDriveLink.trim() || null,
      });
      await refreshAlbums();
      setSyncMessage('Đã cập nhật album.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể cập nhật album.';
      setSyncMessage(`Lỗi: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAlbum = async () => {
    if (!selectedAlbumId) return;

    const name = selectedAlbum?.title || 'album này';
    if (!window.confirm(`Xóa "${name}"? Toàn bộ ảnh trong album cũng bị xóa.`)) {
      return;
    }

    setSubmitting(true);
    setSyncMessage('');
    try {
      await deleteAlbum(selectedAlbumId);
      const data = await refreshAlbums();
      const nextId = data[0]?.id || '';
      setSelectedAlbumId(nextId);
      await refreshImages(nextId);
      setSyncMessage('Đã xóa album.');
      if (!nextId) {
        setActiveTab('create');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể xóa album.';
      setSyncMessage(`Lỗi: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {isAdmin ? 'Quản lý album (Admin)' : 'Quản lý album'}
        </h1>
        <p className="mt-2 text-white/50">
          {isAdmin
            ? 'Tạo album và quản lý ảnh cho mọi thợ ảnh'
            : 'Tạo album riêng, thêm ảnh và chia sẻ link cho khách hàng'}
        </p>
      </div>

      <div className="mb-6 flex gap-2 rounded-xl bg-surface-card p-1">
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'create' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
          }`}
        >
          Tạo mới
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('manage')}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'manage' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
          }`}
        >
          Quản lý ảnh
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('edit')}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'edit' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
          }`}
        >
          Sửa / Xóa
        </button>
      </div>

      {activeTab === 'create' && (
        <section className="rounded-2xl border border-white/10 bg-surface-card p-6 sm:p-8">
          <h2 className="mb-6 text-xl font-semibold">Tạo album mới</h2>
          <form onSubmit={handleCreateAlbum} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">
                Tên album *
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="VD: Wedding An & Bình"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">
                Mô tả (tuỳ chọn)
              </label>
              <textarea
                className="input-field min-h-[80px] resize-none"
                placeholder="Mô tả ngắn cho album..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">
                Google Drive folder link (tuỳ chọn)
              </label>
              <input
                type="url"
                className="input-field"
                placeholder="https://drive.google.com/drive/folders/..."
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
              />
              <p className="mt-2 text-xs text-white/40">
                Dán link folder Drive (đã chia sẻ &quot;Anyone with the link&quot;). Ảnh sẽ tự
                đồng bộ sau khi tạo album. Cần cấu hình GOOGLE_API_KEY trong server/.env.
              </p>
            </div>

            <button type="submit" className="btn-accent w-full sm:w-auto" disabled={submitting}>
              {submitting ? 'Đang tạo album...' : 'Tạo album'}
            </button>
          </form>
        </section>
      )}

      {activeTab === 'edit' && (
        <section className="rounded-2xl border border-white/10 bg-surface-card p-6 sm:p-8">
          {albums.length === 0 ? (
            <p className="text-center text-white/50">Chưa có album nào để sửa.</p>
          ) : (
            <>
              <h2 className="mb-6 text-xl font-semibold">Sửa hoặc xóa album</h2>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-white/70">Chọn album</label>
                <select
                  value={selectedAlbumId}
                  onChange={handleAlbumChange}
                  className="input-field"
                >
                  {albums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {isAdmin && album.ownerName ? `[${album.ownerName}] ` : ''}
                      {album.title}
                    </option>
                  ))}
                </select>
              </div>

              {syncMessage && (
                <div
                  className={`mb-4 rounded-xl px-4 py-3 text-sm ${
                    syncMessage.startsWith('Lỗi')
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-green-500/10 text-green-400'
                  }`}
                >
                  {syncMessage}
                </div>
              )}

              <form onSubmit={handleUpdateAlbum} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">Tên album *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">Mô tả</label>
                  <textarea
                    className="input-field min-h-[80px] resize-none"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    Google Drive folder link
                  </label>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={editDriveLink}
                    onChange={(e) => setEditDriveLink(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button type="submit" className="btn-accent" disabled={submitting}>
                    {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAlbum}
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
                    disabled={submitting}
                  >
                    Xóa album
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      )}

      {activeTab === 'manage' && (
        <div className="space-y-6">
          {albums.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-white/50">
              Tạo album trước khi thêm ảnh.
            </div>
          ) : (
            <>
              <section className="rounded-2xl border border-white/10 bg-surface-card p-6 sm:p-8">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      Chọn album
                    </label>
                    <select
                      value={selectedAlbumId}
                      onChange={handleAlbumChange}
                      className="input-field"
                    >
                      {albums.map((album) => (
                        <option key={album.id} value={album.id}>
                          {isAdmin && album.ownerName ? `[${album.ownerName}] ` : ''}
                          {album.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:pt-6">
                    {selectedAlbum?.driveLink && (
                      <button
                        type="button"
                        onClick={handleSyncDrive}
                        className="btn-accent"
                        disabled={submitting}
                      >
                        {submitting ? 'Đang đồng bộ...' : 'Đồng bộ Drive'}
                      </button>
                    )}
                    <button type="button" onClick={handleCopyLink} className="btn-secondary">
                      {copied ? '✓ Đã copy' : 'Copy link chia sẻ'}
                    </button>
                    <button type="button" onClick={handleOpenGallery} className="btn-primary">
                      Xem gallery
                    </button>
                  </div>
                </div>

                {syncMessage && (
                  <div
                    className={`mb-4 rounded-xl px-4 py-3 text-sm ${
                      syncMessage.startsWith('Lỗi')
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-green-500/10 text-green-400'
                    }`}
                  >
                    {syncMessage}
                  </div>
                )}

                {selectedAlbum?.driveLink && (
                  <p className="mb-4 truncate text-xs text-white/40">
                    Drive: {selectedAlbum.driveLink}
                  </p>
                )}

                <div className="mb-6 flex flex-wrap gap-3">
                  <div className="rounded-xl bg-white/5 px-4 py-3">
                    <p className="text-xs text-white/40">Tổng ảnh</p>
                    <p className="text-2xl font-bold">{images.length}</p>
                  </div>
                  <div className="rounded-xl bg-accent/10 px-4 py-3">
                    <p className="text-xs text-accent/70">Đã chọn</p>
                    <p className="text-2xl font-bold text-accent">{selectedCount}</p>
                  </div>
                </div>

                <form onSubmit={handleAddImage} className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="url"
                    className="input-field flex-1"
                    placeholder="URL ảnh (https://picsum.photos/600/800?random=1)"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn-accent shrink-0" disabled={submitting}>
                    {submitting ? 'Đang thêm...' : 'Thêm ảnh'}
                  </button>
                </form>
              </section>

              <section>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">
                    Ảnh trong album ({images.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowFileNames((v) => !v)}
                    className={`btn-secondary !px-3 !py-2 text-xs sm:text-sm ${
                      showFileNames ? '!border-accent/50 !text-accent' : ''
                    }`}
                  >
                    {showFileNames ? 'Ẩn tên file' : 'Hiện tên file'}
                  </button>
                </div>
                <ImageGrid
                  images={images}
                  onToggle={() => {}}
                  galleryMode={false}
                  showFileNames={showFileNames}
                />
              </section>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Admin;
