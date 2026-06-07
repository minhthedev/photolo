const albumService = require('../services/albumService');
const imageService = require('../services/imageService');

exports.createAlbum = async (req, res) => {
  try {
    const { title, description, drive_link, driveLink } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const album = await albumService.createAlbum({
      title,
      description,
      driveLink: drive_link || driveLink,
      ownerId: req.user.userId,
    });

    let syncResult = null;
    if (album.driveLink) {
      syncResult = {
        syncStarted: true,
        message: 'Album đã tạo. Đang đồng bộ ảnh từ Drive...',
      };
      imageService.syncFromDrive(album.id).catch((err) => {
        console.error('Background Drive sync failed:', err.message);
      });
    }

    res.status(201).json({ ...album, syncResult });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create album', error: error.message });
  }
};

exports.getAlbums = async (req, res) => {
  try {
    const albums = await albumService.getAlbums({
      userId: req.user.userId,
      role: req.user.role,
    });
    res.json(albums);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch albums', error: error.message });
  }
};

exports.getAlbumById = async (req, res) => {
  try {
    const album = await albumService.getAlbumById(req.params.id);

    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }

    res.json(album);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch album', error: error.message });
  }
};

exports.updateAlbum = async (req, res) => {
  try {
    const allowed = await albumService.canManageAlbum(req.params.id, req.user);
    if (!allowed) {
      return res.status(403).json({ message: 'Bạn không có quyền với album này' });
    }

    const { title, description, drive_link, driveLink } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: 'Tên album không được để trống' });
    }

    const album = await albumService.updateAlbum(req.params.id, {
      title,
      description,
      driveLink: drive_link ?? driveLink,
    });

    if (!album) {
      return res.status(404).json({ message: 'Album not found' });
    }

    res.json(album);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update album', error: error.message });
  }
};

exports.deleteAlbum = async (req, res) => {
  try {
    const allowed = await albumService.canManageAlbum(req.params.id, req.user);
    if (!allowed) {
      return res.status(403).json({ message: 'Bạn không có quyền với album này' });
    }

    const deleted = await albumService.deleteAlbum(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Album not found' });
    }

    res.json({ message: 'Album đã xóa' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete album', error: error.message });
  }
};

exports.syncDrive = async (req, res) => {
  try {
    const allowed = await albumService.canManageAlbum(req.params.id, req.user);
    if (!allowed) {
      return res.status(403).json({ message: 'Bạn không có quyền với album này' });
    }

    const result = await imageService.syncFromDrive(req.params.id);

    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ message: result.message });
    }

    if (result.error) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to sync Drive', error: error.message });
  }
};
