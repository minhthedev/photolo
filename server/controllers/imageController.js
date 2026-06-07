const imageService = require('../services/imageService');
const albumService = require('../services/albumService');

exports.addImage = async (req, res) => {
  try {
    const { album_id, albumId, url } = req.body;
    const resolvedAlbumId = album_id || albumId;

    if (!resolvedAlbumId || !url?.trim()) {
      return res.status(400).json({ message: 'album_id and url are required' });
    }

    const allowed = await albumService.canManageAlbum(resolvedAlbumId, req.user);
    if (!allowed) {
      return res.status(403).json({ message: 'Bạn không có quyền với album này' });
    }

    const image = await imageService.addImage({
      albumId: resolvedAlbumId,
      url,
    });

    if (!image) {
      return res.status(404).json({ message: 'Album not found' });
    }

    res.status(201).json(image);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add image', error: error.message });
  }
};

exports.getImagesByAlbum = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit, 10) || 24));

    const data = await imageService.getImagesByAlbum(req.params.albumId, { page, limit });

    if (!data) {
      return res.status(404).json({ message: 'Album not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch images', error: error.message });
  }
};

exports.toggleSelection = async (req, res) => {
  try {
    const image = await imageService.toggleSelection(req.params.id);

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    res.json(image);
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle selection', error: error.message });
  }
};

exports.updateClientNote = async (req, res) => {
  try {
    const { note, client_note, clientNote } = req.body;
    const resolvedNote = note ?? client_note ?? clientNote ?? '';

    const image = await imageService.updateClientNote(req.params.id, resolvedNote);

    if (!image) {
      return res.status(404).json({ message: 'Image not found or not selected' });
    }

    res.json(image);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update note', error: error.message });
  }
};

exports.proxyDriveImage = async (req, res) => {
  try {
    const { fileId } = req.params;
    const driveUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

    const response = await fetch(driveUrl, { redirect: 'follow' });

    if (!response.ok) {
      return res.status(response.status).json({ message: 'Không thể tải ảnh từ Drive' });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=604800');
    res.send(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    res.status(500).json({ message: 'Failed to proxy image', error: error.message });
  }
};
