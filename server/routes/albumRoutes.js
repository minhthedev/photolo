const express = require('express');
const router = express.Router();
const albumController = require('../controllers/albumController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/:id', albumController.getAlbumById);

router.post('/', requireAuth, albumController.createAlbum);
router.get('/', requireAuth, albumController.getAlbums);
router.post('/:id/sync-drive', requireAuth, albumController.syncDrive);

module.exports = router;
